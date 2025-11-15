// Player Boulder class

class Boulder {
    constructor(x, y, radius = 25) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.velocityX = 0;
        this.velocityY = 0;
        this.angle = 0; // Visual rotation angle
        this.speed = 0.5; // Movement speed multiplier

        // Glyph system
        this.glyphs = {
            circle: { collected: 0, required: 5, active: false, symbol: '◯', color: '#4a9eff' },
            triangle: { collected: 0, required: 5, active: false, symbol: '△', color: '#ff6b4a' },
            square: { collected: 0, required: 5, active: false, symbol: '□', color: '#4aff6b' }
        };

        // State
        this.isOnGround = true;
        this.isInSand = false;
        this.isInWater = false;
        this.spinSpeed = 0;
        this.sandSpinCharge = 0;

        // Visual properties
        this.baseColor = '#8a8a8a';
        this.etchColor = '#555';
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

    move(inputX, inputY) {
        // Apply input force
        let forceX = inputX * this.speed;
        let forceY = inputY * this.speed;

        // Modify based on terrain
        if (this.isInSand) {
            forceX *= 0.3;
            forceY *= 0.3;
        }

        if (this.isInWater) {
            // Water resistance
            this.velocityX *= 0.85;
            this.velocityY *= 0.85;
        }

        this.velocityX += forceX;
        this.velocityY += forceY;

        // Cap max velocity
        const maxVelocity = 8;
        const currentSpeed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
        if (currentSpeed > maxVelocity) {
            this.velocityX = (this.velocityX / currentSpeed) * maxVelocity;
            this.velocityY = (this.velocityY / currentSpeed) * maxVelocity;
        }
    }

    spinInSand(isSpinning) {
        if (this.isInSand && isSpinning) {
            this.sandSpinCharge += 0.05;
            this.spinSpeed = 20;

            if (this.sandSpinCharge >= 1) {
                // Launch out of sand
                const angle = Math.random() * Math.PI * 2;
                this.velocityX = Math.cos(angle) * 6;
                this.velocityY = Math.sin(angle) * 6;
                this.sandSpinCharge = 0;
                this.isInSand = false;
            }
        } else {
            this.sandSpinCharge = Math.max(0, this.sandSpinCharge - 0.02);
        }
    }

    update(physics, deltaTime) {
        // Apply friction
        if (this.isOnGround) {
            const friction = this.isInSand ? 0.8 : 0.92;
            physics.applyFriction(this, friction);
        }

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Update visual rotation based on movement
        const speed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
        this.angle += speed * 0.1;

        // Decay spin speed
        if (this.spinSpeed > 0) {
            this.spinSpeed *= 0.95;
        }

        // Reset terrain flags (will be set by level)
        this.isInSand = false;
        this.isInWater = false;
    }

    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const screenRadius = this.radius * camera.zoom;

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(this.angle + this.spinSpeed * 0.1);

        // Draw boulder body
        const gradient = ctx.createRadialGradient(
            -screenRadius * 0.3, -screenRadius * 0.3, 0,
            0, 0, screenRadius
        );
        gradient.addColorStop(0, '#a0a0a0');
        gradient.addColorStop(0.7, this.baseColor);
        gradient.addColorStop(1, '#606060');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, screenRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw stone texture
        ctx.strokeStyle = '#707070';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5;
            const x1 = Math.cos(angle) * screenRadius * 0.7;
            const y1 = Math.sin(angle) * screenRadius * 0.7;
            const x2 = Math.cos(angle) * screenRadius * 0.3;
            const y2 = Math.sin(angle) * screenRadius * 0.3;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Draw glyphs on boulder
        ctx.font = `${screenRadius * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const glyphTypes = Object.keys(this.glyphs);
        glyphTypes.forEach((type, index) => {
            const glyph = this.glyphs[type];
            const angle = (Math.PI * 2 * index) / glyphTypes.length;
            const x = Math.cos(angle) * screenRadius * 0.5;
            const y = Math.sin(angle) * screenRadius * 0.5;

            if (glyph.active) {
                // Glowing active glyph
                ctx.shadowColor = glyph.color;
                ctx.shadowBlur = 10;
                ctx.fillStyle = glyph.color;
            } else {
                ctx.shadowBlur = 0;
                ctx.fillStyle = this.etchColor;
            }

            ctx.fillText(glyph.symbol, x, y);
        });

        ctx.restore();

        // Draw sand spin charge indicator
        if (this.isInSand && this.sandSpinCharge > 0) {
            const chargeRadius = screenRadius + 10;
            const chargeAngle = this.sandSpinCharge * Math.PI * 2;

            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, chargeRadius, -Math.PI / 2, -Math.PI / 2 + chargeAngle);
            ctx.stroke();
        }
    }

    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}
