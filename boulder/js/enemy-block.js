// Enemy blocks that hop and interfere with the player

class EnemyBlock {
    constructor(x, y, size = 40) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;
        this.moveProgress = 0;
        this.startX = x;
        this.startY = y;

        // AI behavior
        this.aggroRange = 200;
        this.hopCooldown = 0;
        this.health = size / 10;
        this.isAlive = true;

        // Animation
        this.squashStretch = 1;
        this.eyeBlinkTimer = 0;
        this.isBlinking = false;
    }

    update(player, aiBoulders, deltaTime) {
        if (!this.isAlive) return;

        this.hopCooldown -= deltaTime;
        this.eyeBlinkTimer += deltaTime;

        // Blinking animation
        if (this.eyeBlinkTimer > 3000) {
            this.isBlinking = true;
            if (this.eyeBlinkTimer > 3200) {
                this.isBlinking = false;
                this.eyeBlinkTimer = 0;
            }
        }

        // Movement
        if (this.isMoving) {
            this.moveProgress += 0.05;

            // Squash and stretch during hop
            if (this.moveProgress < 0.5) {
                this.squashStretch = 1 - this.moveProgress;
            } else {
                this.squashStretch = this.moveProgress;
            }

            if (this.moveProgress >= 1) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
                this.moveProgress = 0;
                this.squashStretch = 1;
                this.hopCooldown = 1000;
            } else {
                // Interpolate position with arc
                const t = this.moveProgress;
                const arc = Math.sin(t * Math.PI) * 50; // Hop height

                this.x = Utils.lerp(this.startX, this.targetX, t);
                this.y = Utils.lerp(this.startY, this.targetY, t) - arc;
            }
        } else if (this.hopCooldown <= 0) {
            // Decide where to hop
            this.decideHop(player, aiBoulders);
        }
    }

    decideHop(player, aiBoulders) {
        const distToPlayer = Utils.distance(this.x, this.y, player.x, player.y);

        if (distToPlayer < this.aggroRange) {
            // Aggressive behavior - try to block or intercept player
            const strategy = Math.random();

            if (strategy < 0.6) {
                // Hop toward player
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                    this.targetX = this.x + (dx / dist) * this.size * 2;
                    this.targetY = this.y + (dy / dist) * this.size * 2;
                }
            } else {
                // Hop to intercept path
                const predictedX = player.x + player.velocityX * 10;
                const predictedY = player.y + player.velocityY * 10;

                this.targetX = predictedX;
                this.targetY = predictedY;
            }

            this.startHop();
        } else {
            // Idle behavior - occasional random hops
            if (Math.random() < 0.1) {
                this.targetX = this.x + Utils.random(-this.size, this.size);
                this.targetY = this.y + Utils.random(-this.size, this.size);
                this.startHop();
            }
        }
    }

    startHop() {
        this.isMoving = true;
        this.moveProgress = 0;
        this.startX = this.x;
        this.startY = this.y;
    }

    takeDamage(force) {
        // Larger, faster boulders can destroy blocks
        this.health -= force / 5;

        if (this.health <= 0) {
            this.isAlive = false;
            return true; // Block destroyed
        }

        return false;
    }

    checkCollisionWithBoulder(boulder) {
        const boulderSize = boulder.radius;
        const blockSize = this.size / 2;

        const dx = Math.abs(boulder.x - this.x);
        const dy = Math.abs(boulder.y - this.y);

        if (dx < boulderSize + blockSize && dy < boulderSize + blockSize) {
            // Check if boulder is large and fast enough to damage block
            const speed = Math.sqrt(boulder.velocityX ** 2 + boulder.velocityY ** 2);
            const force = speed * boulderSize;

            if (force > 50) {
                return this.takeDamage(force);
            }

            return false;
        }

        return false;
    }

    draw(ctx, camera) {
        if (!this.isAlive) return;

        const screenPos = camera.worldToScreen(this.x, this.y);
        const screenSize = this.size * camera.zoom;

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);

        // Apply squash and stretch
        const scaleY = this.squashStretch;
        const scaleX = 2 - this.squashStretch;

        ctx.scale(scaleX, scaleY);

        // Block body
        const gradient = ctx.createLinearGradient(
            -screenSize / 2, -screenSize / 2,
            screenSize / 2, screenSize / 2
        );
        gradient.addColorStop(0, '#444');
        gradient.addColorStop(0.5, '#555');
        gradient.addColorStop(1, '#333');

        ctx.fillStyle = gradient;
        ctx.fillRect(-screenSize / 2, -screenSize / 2, screenSize, screenSize);

        // Block outline
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 3;
        ctx.strokeRect(-screenSize / 2, -screenSize / 2, screenSize, screenSize);

        // Stone texture
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-screenSize / 4, -screenSize / 2);
        ctx.lineTo(-screenSize / 4, screenSize / 2);
        ctx.moveTo(screenSize / 4, -screenSize / 2);
        ctx.lineTo(screenSize / 4, screenSize / 2);
        ctx.stroke();

        // Eyes
        if (!this.isBlinking) {
            ctx.fillStyle = '#ff4444';
            const eyeSize = screenSize * 0.15;
            const eyeSpacing = screenSize * 0.25;

            // Left eye
            ctx.beginPath();
            ctx.arc(-eyeSpacing, -screenSize * 0.15, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            // Right eye
            ctx.beginPath();
            ctx.arc(eyeSpacing, -screenSize * 0.15, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-eyeSpacing, -screenSize * 0.15, eyeSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeSpacing, -screenSize * 0.15, eyeSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Blinking - just lines
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 2;
            const eyeSpacing = screenSize * 0.25;

            ctx.beginPath();
            ctx.moveTo(-eyeSpacing - 5, -screenSize * 0.15);
            ctx.lineTo(-eyeSpacing + 5, -screenSize * 0.15);
            ctx.moveTo(eyeSpacing - 5, -screenSize * 0.15);
            ctx.lineTo(eyeSpacing + 5, -screenSize * 0.15);
            ctx.stroke();
        }

        ctx.restore();

        // Health bar if damaged
        if (this.health < this.size / 10) {
            const healthBarWidth = screenSize;
            const healthBarHeight = 5;
            const healthPercent = this.health / (this.size / 10);

            ctx.fillStyle = '#333';
            ctx.fillRect(
                screenPos.x - healthBarWidth / 2,
                screenPos.y - screenSize / 2 - 15,
                healthBarWidth,
                healthBarHeight
            );

            ctx.fillStyle = '#ff4444';
            ctx.fillRect(
                screenPos.x - healthBarWidth / 2,
                screenPos.y - screenSize / 2 - 15,
                healthBarWidth * healthPercent,
                healthBarHeight
            );
        }
    }

    getCollisionBox() {
        return {
            x: this.x - this.size / 2,
            y: this.y - this.size / 2,
            width: this.size,
            height: this.size
        };
    }
}
