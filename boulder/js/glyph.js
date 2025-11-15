// Glyph collectibles and switch podiums

class Glyph {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'circle', 'triangle', 'square'
        this.radius = 8;
        this.collected = false;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.floatSpeed = 0.05;
        this.pulseOffset = Math.random() * Math.PI * 2;

        // Visual properties based on type
        const colors = {
            circle: '#4a9eff',
            triangle: '#ff6b4a',
            square: '#4aff6b'
        };
        this.color = colors[type] || '#ffffff';

        const symbols = {
            circle: '◯',
            triangle: '△',
            square: '□'
        };
        this.symbol = symbols[type] || '?';
    }

    update(deltaTime) {
        this.floatOffset += this.floatSpeed;
        this.pulseOffset += 0.1;
    }

    draw(ctx, camera) {
        if (this.collected) return;

        const floatY = Math.sin(this.floatOffset) * 3;
        const pulse = Math.sin(this.pulseOffset) * 0.2 + 1;

        const screenPos = camera.worldToScreen(this.x, this.y + floatY);
        const screenRadius = this.radius * camera.zoom * pulse;

        // Glow effect
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15 * pulse;

        // Outer glow
        ctx.fillStyle = this.color + '40';
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, screenRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
        ctx.fill();

        // Symbol
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#ffffff';
        ctx.font = `${screenRadius * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, screenPos.x, screenPos.y);

        ctx.restore();
    }

    checkCollection(boulder) {
        if (!this.collected) {
            const dist = Utils.distance(this.x, this.y, boulder.x, boulder.y);
            if (dist < boulder.radius + this.radius) {
                this.collected = true;
                return true;
            }
        }
        return false;
    }
}

class GlyphRock {
    constructor(x, y, type, size = 30) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = size;
        this.health = size / 10; // Bigger rocks need more hits
        this.maxHealth = this.health;
        this.broken = false;

        const colors = {
            circle: '#4a9eff',
            triangle: '#ff6b4a',
            square: '#4aff6b'
        };
        this.glyphColor = colors[type] || '#ffffff';
        this.glyphCount = Math.floor(size / 10) + 1;
    }

    takeDamage(force) {
        if (this.broken) return false;

        const damage = force / 3; // Adjust damage scaling
        this.health -= damage;

        if (this.health <= 0) {
            this.broken = true;
            return true; // Rock shattered
        }

        return false; // Rock damaged but not broken
    }

    draw(ctx, camera) {
        if (this.broken) return;

        const screenPos = camera.worldToScreen(this.x, this.y);
        const screenSize = this.size * camera.zoom;

        // Rock body
        ctx.fillStyle = '#666';
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 + Math.PI / 6;
            const variance = 0.8 + Math.sin(i * 2.3) * 0.2;
            const x = screenPos.x + Math.cos(angle) * screenSize * variance;
            const y = screenPos.y + Math.sin(angle) * screenSize * variance;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glyph marking with glow
        ctx.save();
        ctx.shadowColor = this.glyphColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.glyphColor;
        ctx.font = `${screenSize * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const symbols = { circle: '◯', triangle: '△', square: '□' };
        ctx.fillText(symbols[this.type] || '?', screenPos.x, screenPos.y);
        ctx.restore();

        // Health indicator
        if (this.health < this.maxHealth) {
            const healthBarWidth = screenSize * 2;
            const healthBarHeight = 5;
            const healthPercent = this.health / this.maxHealth;

            ctx.fillStyle = '#333';
            ctx.fillRect(
                screenPos.x - healthBarWidth / 2,
                screenPos.y - screenSize - 15,
                healthBarWidth,
                healthBarHeight
            );

            ctx.fillStyle = this.glyphColor;
            ctx.fillRect(
                screenPos.x - healthBarWidth / 2,
                screenPos.y - screenSize - 15,
                healthBarWidth * healthPercent,
                healthBarHeight
            );
        }
    }

    getGlyphs() {
        const glyphs = [];
        for (let i = 0; i < this.glyphCount; i++) {
            const offsetX = Utils.random(-20, 20);
            const offsetY = Utils.random(-20, 20);
            glyphs.push(new Glyph(this.x + offsetX, this.y + offsetY, this.type));
        }
        return glyphs;
    }
}

class SwitchPodium {
    constructor(x, y, width, height, requiredGlyph) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.requiredGlyph = requiredGlyph; // 'circle', 'triangle', 'square'
        this.activated = false;
        this.activationTime = 0;

        const colors = {
            circle: '#4a9eff',
            triangle: '#ff6b4a',
            square: '#4aff6b'
        };
        this.glyphColor = colors[requiredGlyph] || '#ffffff';

        const symbols = {
            circle: '◯',
            triangle: '△',
            square: '□'
        };
        this.symbol = symbols[requiredGlyph] || '?';
    }

    checkActivation(boulder) {
        // Check if boulder is on podium and has the required glyph
        const onPodium = Utils.circleRect(
            boulder.x, boulder.y, boulder.radius,
            this.x, this.y, this.width, this.height
        );

        if (onPodium && boulder.hasActiveGlyph(this.requiredGlyph) && !this.activated) {
            this.activated = true;
            this.activationTime = Date.now();
            return true;
        }

        return false;
    }

    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const screenWidth = this.width * camera.zoom;
        const screenHeight = this.height * camera.zoom;

        // Podium base
        ctx.fillStyle = this.activated ? '#4a4a4a' : '#3a3a3a';
        ctx.strokeStyle = this.activated ? this.glyphColor : '#555';
        ctx.lineWidth = 3;

        ctx.fillRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
        ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);

        // Glyph symbol
        ctx.save();
        if (this.activated) {
            ctx.shadowColor = this.glyphColor;
            ctx.shadowBlur = 20;
            ctx.fillStyle = this.glyphColor;
        } else {
            ctx.fillStyle = '#666';
        }

        ctx.font = `${Math.min(screenWidth, screenHeight) * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            this.symbol,
            screenPos.x + screenWidth / 2,
            screenPos.y + screenHeight / 2
        );
        ctx.restore();

        // Activation pulse
        if (this.activated) {
            const timeSinceActivation = Date.now() - this.activationTime;
            if (timeSinceActivation < 1000) {
                const progress = timeSinceActivation / 1000;
                const pulseRadius = Math.max(screenWidth, screenHeight) * (1 + progress * 2);
                const alpha = 1 - progress;

                ctx.strokeStyle = this.glyphColor;
                ctx.globalAlpha = alpha;
                ctx.lineWidth = 5;
                ctx.strokeRect(
                    screenPos.x + screenWidth / 2 - pulseRadius / 2,
                    screenPos.y + screenHeight / 2 - pulseRadius / 2,
                    pulseRadius,
                    pulseRadius
                );
                ctx.globalAlpha = 1;
            }
        }
    }
}
