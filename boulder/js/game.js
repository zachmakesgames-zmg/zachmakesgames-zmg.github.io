// Main game class that manages the game loop and state

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Game systems
        this.physics = new PhysicsEngine();
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.particles = new ParticleSystem();
        this.input = new InputManager(this.canvas);

        // Game state
        this.isRunning = false;
        this.isPaused = false;

        // Game objects
        this.level = null;
        this.player = null;
        this.aiBoulders = [];
        this.butterflyGroups = [];

        // Timing
        this.lastTime = Date.now();
        this.deltaTime = 0;

        // UI elements
        this.glyphIndicators = {
            circle: document.querySelector('[data-glyph="circle"]'),
            triangle: document.querySelector('[data-glyph="triangle"]'),
            square: document.querySelector('[data-glyph="square"]')
        };
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        const aspectRatio = 16 / 9;

        let width = window.innerWidth;
        let height = window.innerHeight;

        if (width / height > aspectRatio) {
            width = height * aspectRatio;
        } else {
            height = width / aspectRatio;
        }

        this.canvas.width = width;
        this.canvas.height = height;

        if (this.camera) {
            this.camera.width = width;
            this.camera.height = height;
        }
    }

    init() {
        // Create level
        this.level = new Level();

        // Create player
        const spawnPoint = this.level.getSpawnPoint();
        this.player = new Boulder(spawnPoint.x, spawnPoint.y, 25);

        // Create AI boulders
        const aiSpawns = this.level.getAISpawnPoints();
        this.aiBoulders = [
            new AIBoulder(aiSpawns.mouse.x, aiSpawns.mouse.y, aiSpawns.mouse.radius, 'mouse'),
            new AIBoulder(aiSpawns.bear.x, aiSpawns.bear.y, aiSpawns.bear.radius, 'bear'),
            new AIBoulder(aiSpawns.moose.x, aiSpawns.moose.y, aiSpawns.moose.radius, 'moose')
        ];

        // Create butterfly groups
        const butterflySpawns = this.level.getButterflySpawns();
        butterflySpawns.forEach(spawn => {
            this.butterflyGroups.push(new Butterflies(spawn.x, spawn.y));
        });

        // Position camera
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;
    }

    start() {
        this.init();
        this.isRunning = true;
        this.lastTime = Date.now();
        this.gameLoop();
    }

    pause() {
        this.isPaused = !this.isPaused;
    }

    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = Date.now();
        this.deltaTime = Math.min(currentTime - this.lastTime, 100); // Cap at 100ms
        this.lastTime = currentTime;

        if (!this.isPaused) {
            this.update(this.deltaTime);
        }

        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Update input
        this.input.update();
        const input = this.input.getInput();

        // Update player
        this.player.move(input.x, input.y);
        this.player.spinInSand(input.isSpinning);
        this.player.update(this.physics, deltaTime);

        // Level collisions
        this.level.checkCollisions(this.player, this.physics);
        this.level.applyEnvironmentalEffects(this.player);
        this.level.checkGlyphCollection(this.player, this.particles);
        this.level.checkGlyphRockCollisions(this.player, this.physics, this.particles);

        // Update AI boulders
        this.aiBoulders.forEach(ai => {
            ai.update(this.player, this.butterflyGroups[0], this.physics, deltaTime);

            // AI collisions with level
            this.level.walls.forEach(wall => {
                this.physics.resolveCollisionCircleRect(ai, wall);
            });

            // AI glyph collection
            this.level.glyphs.forEach(glyph => {
                if (glyph.checkCollection(ai)) {
                    ai.collectGlyph(glyph.type);
                    this.particles.emitGlyphCollect(glyph.x, glyph.y, glyph.color);
                }
            });

            // Check AI switch activation
            this.level.switches.forEach(switchPodium => {
                switchPodium.checkActivation(ai);
            });

            // AI environmental effects
            this.level.applyEnvironmentalEffects(ai);
        });

        // Boulder-to-boulder collisions
        this.handleBoulderCollisions();

        // Update butterflies
        this.butterflyGroups.forEach(group => {
            group.update(this.player, this.aiBoulders);
        });

        // Update enemy blocks
        this.level.enemyBlocks.forEach(block => {
            block.update(this.player, this.aiBoulders, deltaTime);

            // Check if player destroys block
            if (block.checkCollisionWithBoulder(this.player)) {
                this.particles.emitRockShatter(block.x, block.y, block.size);
            }

            // Check if AI boulders destroy block
            this.aiBoulders.forEach(ai => {
                if (block.checkCollisionWithBoulder(ai)) {
                    this.particles.emitRockShatter(block.x, block.y, block.size);
                }
            });

            // Block collisions with boulders
            if (block.isAlive && !block.isMoving) {
                const blockBox = block.getCollisionBox();
                this.physics.resolveCollisionCircleRect(this.player, blockBox);

                this.aiBoulders.forEach(ai => {
                    this.physics.resolveCollisionCircleRect(ai, blockBox);
                });
            }
        });

        // Update level
        this.level.update(deltaTime);

        // Update particles
        this.particles.update(deltaTime);

        // Update camera
        this.camera.follow(this.player, this.level.width, this.level.height);
        this.camera.update();

        // Update UI
        this.updateUI();

        // Emit movement dust
        const playerSpeed = Math.sqrt(this.player.velocityX ** 2 + this.player.velocityY ** 2);
        if (playerSpeed > 2 && Math.random() < 0.3) {
            this.particles.emitDust(
                this.player.x - this.player.velocityX * 2,
                this.player.y - this.player.velocityY * 2,
                2
            );
        }
    }

    handleBoulderCollisions() {
        const allBoulders = [this.player, ...this.aiBoulders];

        for (let i = 0; i < allBoulders.length; i++) {
            for (let j = i + 1; j < allBoulders.length; j++) {
                const result = this.physics.resolveCollisionCircleCircle(allBoulders[i], allBoulders[j]);

                if (result) {
                    // Collision occurred
                    const isPlayerInvolved = allBoulders[i] === this.player || allBoulders[j] === this.player;

                    if (isPlayerInvolved) {
                        const aiBounder = allBoulders[i] === this.player ? allBoulders[j] : allBoulders[i];

                        if (aiBounder instanceof AIBoulder) {
                            aiBounder.onHitByBoulder(this.player);
                        }
                    }

                    // Particle effect on collision
                    const midX = (allBoulders[i].x + allBoulders[j].x) / 2;
                    const midY = (allBoulders[i].y + allBoulders[j].y) / 2;

                    if (result.force > 3) {
                        this.particles.emitDust(midX, midY, Math.floor(result.force));
                        this.camera.shake(result.force * 0.5, 200);
                    }
                }
            }
        }
    }

    updateUI() {
        // Update glyph indicators
        Object.keys(this.player.glyphs).forEach(type => {
            const glyph = this.player.glyphs[type];
            const indicator = this.glyphIndicators[type];

            if (indicator) {
                const countElement = indicator.querySelector('.glyph-count');
                countElement.textContent = `${glyph.collected}/${glyph.required}`;

                if (glyph.active) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            }
        });
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#4a5f6f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background pattern
        this.drawBackground();

        // Save context state
        this.ctx.save();

        // Apply camera transform
        this.ctx.translate(-this.camera.x * this.camera.zoom, -this.camera.y * this.camera.zoom);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        // Draw level
        this.level.draw(this.ctx, this.camera);

        // Draw enemy blocks
        this.level.enemyBlocks.forEach(block => block.draw(this.ctx, this.camera));

        // Draw particles (behind boulders)
        this.particles.draw(this.ctx, this.camera);

        // Draw AI boulders
        this.aiBoulders.forEach(ai => ai.draw(this.ctx, this.camera));

        // Draw butterflies
        this.butterflyGroups.forEach(group => group.draw(this.ctx, this.camera));

        // Draw player
        this.player.draw(this.ctx, this.camera);

        // Restore context
        this.ctx.restore();

        // Draw joystick overlay
        this.input.drawJoystick(this.ctx);

        // Draw debug info if needed
        if (window.DEBUG) {
            this.drawDebugInfo();
        }
    }

    drawBackground() {
        // Subtle stone texture pattern
        this.ctx.fillStyle = '#3d4f5f';
        for (let y = 0; y < this.canvas.height; y += 40) {
            for (let x = 0; x < this.canvas.width; x += 40) {
                if ((x + y) % 80 === 0) {
                    this.ctx.fillRect(x, y, 20, 20);
                }
            }
        }
    }

    drawDebugInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 100);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${Math.round(1000 / this.deltaTime)}`, 20, 30);
        this.ctx.fillText(`Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`, 20, 50);
        this.ctx.fillText(`Velocity: ${Math.round(this.player.velocityX)}, ${Math.round(this.player.velocityY)}`, 20, 70);
        this.ctx.fillText(`Particles: ${this.particles.particles.length}`, 20, 90);
    }
}
