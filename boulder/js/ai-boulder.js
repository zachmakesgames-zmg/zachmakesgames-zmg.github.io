// AI-controlled boulders with personalities: Mouse, Bear, Moose

class AIBoulder {
    constructor(x, y, radius, personality) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.velocityX = 0;
        this.velocityY = 0;
        this.angle = 0;
        this.personality = personality; // 'mouse', 'bear', 'moose'

        // AI state
        this.state = 'indifferent'; // 'indifferent', 'curious', 'angry', 'fearful'
        this.stateTimer = 0;
        this.targetX = x;
        this.targetY = y;

        // Personality-specific properties
        this.initPersonality();

        // Learning and relationships
        this.trustLevel = 0; // -100 to 100
        this.timeWithPlayer = 0;
        this.helpfulActions = 0;

        // Glyphs (AI boulders can also collect)
        this.glyphs = {
            circle: { collected: 0, required: 5, active: false },
            triangle: { collected: 0, required: 5, active: false },
            square: { collected: 0, required: 5, active: false }
        };
    }

    initPersonality() {
        switch (this.personality) {
            case 'mouse':
                this.speed = 0.6;
                this.baseColor = '#9a8a7a';
                this.detectionRange = 150;
                this.state = 'curious';
                break;

            case 'bear':
                this.speed = 0.4;
                this.baseColor = '#6a5a4a';
                this.detectionRange = 100;
                this.state = 'indifferent';
                this.territorialRadius = 200;
                break;

            case 'moose':
                this.speed = 0.35;
                this.baseColor = '#7a6a5a';
                this.detectionRange = 120;
                this.state = 'fearful';
                break;
        }
    }

    update(player, butterflies, physics, deltaTime) {
        this.updateState(player, butterflies);
        this.updateBehavior(player, butterflies);
        this.updateMovement(physics);

        this.stateTimer += deltaTime;
        this.angle += Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2) * 0.1;
    }

    updateState(player, butterflies) {
        const distToPlayer = Utils.distance(this.x, this.y, player.x, player.y);
        const hasButterflies = butterflies && butterflies.following === player;

        switch (this.personality) {
            case 'mouse':
                // Mouse is thrill-seeker and curious
                if (distToPlayer > 300 && this.stateTimer > 5000) {
                    this.state = 'angry'; // Left behind too long
                } else if (hasButterflies) {
                    this.state = 'curious'; // Excited by butterflies
                } else {
                    this.state = 'curious'; // Generally curious
                }
                break;

            case 'bear':
                // Bear is territorial and easily angered
                if (hasButterflies) {
                    this.state = 'fearful'; // Hates butterflies
                } else if (distToPlayer < this.territorialRadius) {
                    this.state = 'angry'; // Invaded territory
                } else if (this.helpfulActions > 3) {
                    this.state = 'curious'; // Warmed up after helping
                } else {
                    this.state = 'indifferent';
                }
                break;

            case 'moose':
                // Moose is peaceful and skittish
                if (hasButterflies) {
                    this.state = 'curious'; // Likes butterflies
                } else if (distToPlayer < 80) {
                    this.state = 'fearful'; // Too close
                } else if (this.trustLevel > 50) {
                    this.state = 'curious'; // Trusts player now
                } else {
                    this.state = 'fearful';
                }
                break;
        }
    }

    updateBehavior(player, butterflies) {
        const distToPlayer = Utils.distance(this.x, this.y, player.x, player.y);

        switch (this.state) {
            case 'curious':
                // Follow player
                if (distToPlayer > 50) {
                    this.moveToward(player.x, player.y);
                    this.timeWithPlayer += 0.1;
                }
                break;

            case 'angry':
                // Chase player
                if (distToPlayer < 300) {
                    this.moveToward(player.x, player.y, 1.5); // Faster when angry
                } else {
                    this.state = 'indifferent';
                    this.stateTimer = 0;
                }
                break;

            case 'fearful':
                // Run away from player
                if (distToPlayer < this.detectionRange) {
                    this.moveAway(player.x, player.y);
                }
                break;

            case 'indifferent':
                // Random wandering
                if (Math.random() < 0.01) {
                    this.targetX = this.x + Utils.random(-100, 100);
                    this.targetY = this.y + Utils.random(-100, 100);
                }
                this.moveToward(this.targetX, this.targetY, 0.3);
                break;
        }

        // Personality-specific behaviors
        if (this.personality === 'mouse' && Math.random() < 0.005) {
            // Mouse does random dashes
            const dashAngle = Math.random() * Math.PI * 2;
            this.velocityX += Math.cos(dashAngle) * 3;
            this.velocityY += Math.sin(dashAngle) * 3;
        }
    }

    moveToward(targetX, targetY, speedMult = 1) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            this.velocityX += (dx / dist) * this.speed * speedMult;
            this.velocityY += (dy / dist) * this.speed * speedMult;
        }
    }

    moveAway(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.velocityX -= (dx / dist) * this.speed * 1.2;
            this.velocityY -= (dy / dist) * this.speed * 1.2;
        }
    }

    updateMovement(physics) {
        // Apply friction
        physics.applyFriction(this, 0.90);

        // Cap velocity
        const maxVelocity = 8;
        const currentSpeed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
        if (currentSpeed > maxVelocity) {
            this.velocityX = (this.velocityX / currentSpeed) * maxVelocity;
            this.velocityY = (this.velocityY / currentSpeed) * maxVelocity;
        }

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    collectGlyph(type) {
        if (this.glyphs[type]) {
            this.glyphs[type].collected++;
            if (this.glyphs[type].collected >= this.glyphs[type].required) {
                this.glyphs[type].active = true;
            }
            return true;
        }
        return false;
    }

    hasActiveGlyph(type) {
        return this.glyphs[type] && this.glyphs[type].active;
    }

    onHitByBoulder(otherBoulder) {
        const isPlayer = otherBoulder instanceof Boulder;

        if (isPlayer) {
            if (this.state === 'fearful') {
                this.trustLevel -= 10; // Lost trust
                this.state = 'angry'; // Trapped, now angry
                this.stateTimer = 0;
            } else if (this.state === 'indifferent') {
                this.state = 'angry';
                this.stateTimer = 0;
            }
        }
    }

    onHelped() {
        // Called when AI boulder is helped by player
        this.helpfulActions++;
        this.trustLevel += 5;

        if (this.state === 'angry' && this.helpfulActions > 2) {
            this.state = 'curious';
        }
    }

    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const screenRadius = this.radius * camera.zoom;

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(this.angle);

        // Boulder body with personality tint
        const gradient = ctx.createRadialGradient(
            -screenRadius * 0.3, -screenRadius * 0.3, 0,
            0, 0, screenRadius
        );
        gradient.addColorStop(0, this.lightenColor(this.baseColor, 20));
        gradient.addColorStop(0.7, this.baseColor);
        gradient.addColorStop(1, this.darkenColor(this.baseColor, 20));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, screenRadius, 0, Math.PI * 2);
        ctx.fill();

        // State indicator
        const stateColors = {
            curious: '#4aff6b',
            angry: '#ff4a4a',
            fearful: '#ffd700',
            indifferent: '#888888'
        };

        const indicatorSize = screenRadius * 0.3;
        ctx.fillStyle = stateColors[this.state];
        ctx.beginPath();
        ctx.arc(screenRadius * 0.6, -screenRadius * 0.6, indicatorSize, 0, Math.PI * 2);
        ctx.fill();

        // Personality marker
        ctx.fillStyle = '#fff';
        ctx.font = `${screenRadius * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const symbols = {
            mouse: '🐭',
            bear: '🐻',
            moose: '🫎'
        };

        // Fallback to text if emoji not supported
        const symbol = symbols[this.personality] || this.personality[0].toUpperCase();
        ctx.fillText(symbol, 0, 0);

        ctx.restore();

        // Name label (for debugging/clarity)
        ctx.fillStyle = '#fff';
        ctx.font = `${12 * camera.zoom}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(
            this.personality.charAt(0).toUpperCase() + this.personality.slice(1),
            screenPos.x,
            screenPos.y - screenRadius - 10
        );
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }
}

class Butterflies {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.butterflies = [];
        this.following = null;
        this.followDuration = 0;
        this.maxFollowTime = 5000; // 5 seconds

        // Create butterfly instances
        for (let i = 0; i < 8; i++) {
            this.butterflies.push({
                offsetX: Utils.random(-20, 20),
                offsetY: Utils.random(-20, 20),
                flapOffset: Math.random() * Math.PI * 2,
                flapSpeed: Utils.random(0.1, 0.2)
            });
        }
    }

    update(player, aiBoulders) {
        // Check if player rolls through butterflies
        if (!this.following) {
            const distToPlayer = Utils.distance(this.x, this.y, player.x, player.y);
            if (distToPlayer < player.radius + 30) {
                this.following = player;
                this.followDuration = 0;
            }
        }

        // Check if AI boulders intercept
        if (this.following === player) {
            aiBoulders.forEach(ai => {
                if (ai.personality === 'mouse') {
                    const distToAI = Utils.distance(this.x, this.y, ai.x, ai.y);
                    if (distToAI < ai.radius + 30) {
                        this.following = null; // Mouse scatters butterflies
                        this.scatter();
                    }
                } else if (ai.personality === 'moose' && this.following) {
                    const distToAI = Utils.distance(this.x, this.y, ai.x, ai.y);
                    if (distToAI < 100) {
                        this.following = ai; // Moose attracts butterflies
                    }
                }
            });
        }

        // Follow target
        if (this.following) {
            this.followDuration += 16; // Approximate deltaTime
            const tx = this.following.x;
            const ty = this.following.y - 40; // Hover above

            this.x = Utils.lerp(this.x, tx, 0.05);
            this.y = Utils.lerp(this.y, ty, 0.05);

            if (this.followDuration > this.maxFollowTime) {
                this.following = null;
            }
        }

        // Update butterfly animations
        this.butterflies.forEach(b => {
            b.flapOffset += b.flapSpeed;
        });
    }

    scatter() {
        // Scatter butterflies in random directions
        this.butterflies.forEach(b => {
            b.offsetX = Utils.random(-50, 50);
            b.offsetY = Utils.random(-50, 50);
        });
    }

    draw(ctx, camera) {
        this.butterflies.forEach(b => {
            const x = this.x + b.offsetX + Math.sin(b.flapOffset) * 5;
            const y = this.y + b.offsetY + Math.cos(b.flapOffset * 2) * 3;

            const screenPos = camera.worldToScreen(x, y);

            // Simple butterfly representation
            ctx.save();
            ctx.translate(screenPos.x, screenPos.y);

            const wingFlap = Math.sin(b.flapOffset) * 0.3;

            ctx.fillStyle = '#ff69b4';
            ctx.beginPath();
            ctx.ellipse(-3 + wingFlap, 0, 4, 6, -0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.ellipse(3 - wingFlap, 0, 4, 6, 0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.fillRect(-1, -3, 2, 6);

            ctx.restore();
        });
    }
}
