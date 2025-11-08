// Level design and management

class Level {
    constructor() {
        this.width = 2000;
        this.height = 1500;

        this.walls = [];
        this.waters = [];
        this.sands = [];
        this.ramps = [];
        this.geysers = [];
        this.doors = [];
        this.glyphs = [];
        this.glyphRocks = [];
        this.switches = [];
        this.enemyBlocks = [];

        this.buildLevel1();
    }

    buildLevel1() {
        // Outer boundary walls
        this.walls.push(new Wall(0, 0, this.width, 20)); // Top
        this.walls.push(new Wall(0, this.height - 20, this.width, 20)); // Bottom
        this.walls.push(new Wall(0, 0, 20, this.height)); // Left
        this.walls.push(new Wall(this.width - 20, 0, 20, this.height)); // Right

        // Interior maze walls
        this.walls.push(new Wall(200, 200, 300, 20));
        this.walls.push(new Wall(200, 200, 20, 300));
        this.walls.push(new Wall(600, 100, 20, 400));
        this.walls.push(new Wall(400, 400, 300, 20));
        this.walls.push(new Wall(800, 300, 20, 300));
        this.walls.push(new Wall(800, 600, 400, 20));
        this.walls.push(new Wall(300, 700, 20, 200));
        this.walls.push(new Wall(500, 900, 400, 20));
        this.walls.push(new Wall(1000, 200, 300, 20));
        this.walls.push(new Wall(1200, 400, 20, 300));

        // Glyph rocks to shatter
        this.glyphRocks.push(new GlyphRock(400, 300, 'circle', 30));
        this.glyphRocks.push(new GlyphRock(700, 450, 'triangle', 40));
        this.glyphRocks.push(new GlyphRock(1100, 500, 'square', 35));
        this.glyphRocks.push(new GlyphRock(350, 800, 'circle', 25));
        this.glyphRocks.push(new GlyphRock(950, 750, 'triangle', 30));

        // Scattered glyphs
        this.glyphs.push(new Glyph(250, 350, 'circle'));
        this.glyphs.push(new Glyph(550, 250, 'triangle'));
        this.glyphs.push(new Glyph(850, 450, 'square'));
        this.glyphs.push(new Glyph(450, 650, 'circle'));
        this.glyphs.push(new Glyph(750, 800, 'triangle'));
        this.glyphs.push(new Glyph(1050, 350, 'square'));

        // Switch podiums
        const switch1 = new SwitchPodium(900, 450, 60, 60, 'circle');
        const switch2 = new SwitchPodium(400, 1000, 60, 60, 'triangle');
        const switch3 = new SwitchPodium(1300, 600, 60, 60, 'square');

        this.switches.push(switch1);
        this.switches.push(switch2);
        this.switches.push(switch3);

        // Doors linked to switches
        this.doors.push(new Door(700, 250, 80, 20, switch1));
        this.doors.push(new Door(650, 750, 80, 20, switch2));
        this.doors.push(new Door(1150, 300, 20, 100, switch3));

        // Environmental elements
        this.waters.push(new Water(100, 500, 150, 150, 2, 0)); // Flowing right
        this.waters.push(new Water(1300, 800, 200, 100, -1, 1)); // Flowing diagonal

        this.sands.push(new Sand(550, 600, 200, 150));
        this.sands.push(new Sand(1000, 900, 150, 100));

        this.ramps.push(new Ramp(350, 550, 80, 60, 45));
        this.ramps.push(new Ramp(1100, 700, 100, 70, 50));

        this.geysers.push(new Geyser(800, 900, 60, 6));
        this.geysers.push(new Geyser(1400, 400, 50, 5));

        // Enemy blocks (some are disguised as walls)
        this.enemyBlocks.push(new EnemyBlock(650, 350, 40));
        this.enemyBlocks.push(new EnemyBlock(450, 550, 45));
        this.enemyBlocks.push(new EnemyBlock(1050, 250, 40));
        this.enemyBlocks.push(new EnemyBlock(850, 650, 50));
        this.enemyBlocks.push(new EnemyBlock(300, 1100, 40));
    }

    getSpawnPoint() {
        return { x: 100, y: 100 };
    }

    getAISpawnPoints() {
        return {
            mouse: { x: 150, y: 300, radius: 20 },
            bear: { x: 1300, y: 200, radius: 35 },
            moose: { x: 700, y: 1100, radius: 30 }
        };
    }

    getButterflySpawns() {
        return [
            { x: 400, y: 200 },
            { x: 900, y: 550 },
            { x: 600, y: 950 }
        ];
    }

    update(deltaTime) {
        // Update animated environment objects
        this.waters.forEach(water => water.update(deltaTime));
        this.geysers.forEach(geyser => geyser.update(deltaTime));
        this.doors.forEach(door => door.update(deltaTime));
        this.glyphs.forEach(glyph => glyph.update(deltaTime));
    }

    checkCollisions(boulder, physics) {
        // Wall collisions
        this.walls.forEach(wall => {
            physics.resolveCollisionCircleRect(boulder, wall);
        });

        // Door collisions (only if not fully open)
        this.doors.forEach(door => {
            if (door.isSolid()) {
                physics.resolveCollisionCircleRect(boulder, door);
            }
        });

        // Check switch activations
        this.switches.forEach(switchPodium => {
            switchPodium.checkActivation(boulder);
        });
    }

    applyEnvironmentalEffects(boulder) {
        // Water effects
        this.waters.forEach(water => {
            if (Utils.circleRect(boulder.x, boulder.y, boulder.radius, water.x, water.y, water.width, water.height)) {
                water.applyFlow(boulder);
            }
        });

        // Sand effects
        this.sands.forEach(sand => {
            if (Utils.circleRect(boulder.x, boulder.y, boulder.radius, sand.x, sand.y, sand.width, sand.height)) {
                sand.applyEffect(boulder);
            }
        });

        // Geyser effects
        this.geysers.forEach(geyser => {
            geyser.applyLift(boulder);
        });
    }

    checkGlyphCollection(boulder, particles) {
        // Regular glyphs
        this.glyphs.forEach(glyph => {
            if (glyph.checkCollection(boulder)) {
                boulder.collectGlyph(glyph.type);
                particles.emitGlyphCollect(glyph.x, glyph.y, glyph.color);
            }
        });
    }

    checkGlyphRockCollisions(boulder, physics, particles) {
        this.glyphRocks.forEach(rock => {
            if (rock.broken) return;

            // Check collision
            const dist = Utils.distance(boulder.x, boulder.y, rock.x, rock.y);
            if (dist < boulder.radius + rock.size) {
                const speed = Math.sqrt(boulder.velocityX ** 2 + boulder.velocityY ** 2);

                if (rock.takeDamage(speed * boulder.radius)) {
                    // Rock shattered!
                    particles.emitRockShatter(rock.x, rock.y, rock.size);

                    // Release glyphs
                    const newGlyphs = rock.getGlyphs();
                    this.glyphs.push(...newGlyphs);
                } else {
                    // Rock hit but not broken
                    particles.emitDust(rock.x, rock.y, 3);
                }

                // Bounce boulder back
                const dx = boulder.x - rock.x;
                const dy = boulder.y - rock.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    boulder.velocityX = (dx / dist) * 3;
                    boulder.velocityY = (dy / dist) * 3;
                }
            }
        });
    }

    draw(ctx, camera) {
        // Draw environment
        this.waters.forEach(water => water.draw(ctx, camera));
        this.sands.forEach(sand => sand.draw(ctx, camera));
        this.geysers.forEach(geyser => geyser.draw(ctx, camera));

        // Draw walls and doors
        this.walls.forEach(wall => wall.draw(ctx, camera));
        this.doors.forEach(door => door.draw(ctx, camera));

        // Draw ramps
        this.ramps.forEach(ramp => ramp.draw(ctx, camera));

        // Draw switches
        this.switches.forEach(switchPodium => switchPodium.draw(ctx, camera));

        // Draw glyph rocks
        this.glyphRocks.forEach(rock => rock.draw(ctx, camera));

        // Draw glyphs
        this.glyphs.forEach(glyph => glyph.draw(ctx, camera));
    }
}
