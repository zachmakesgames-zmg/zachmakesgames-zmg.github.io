// Particle system for visual effects

class Particle {
    constructor(x, y, velocityX, velocityY, color, size, life) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.alpha = 1;
    }

    update(deltaTime) {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += 0.2; // Gravity
        this.velocityX *= 0.98; // Air resistance
        this.velocityY *= 0.98;
        this.life -= deltaTime;

        this.alpha = this.life / this.maxLife;
    }

    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, this.size * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, config = {}) {
        const {
            velocityRange = { min: -3, max: 3 },
            colors = ['#888', '#999', '#aaa'],
            sizeRange = { min: 2, max: 5 },
            lifeRange = { min: 0.5, max: 1.5 }
        } = config;

        for (let i = 0; i < count; i++) {
            const vx = Utils.random(velocityRange.min, velocityRange.max);
            const vy = Utils.random(velocityRange.min, velocityRange.max);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Utils.random(sizeRange.min, sizeRange.max);
            const life = Utils.random(lifeRange.min, lifeRange.max);

            this.particles.push(new Particle(x, y, vx, vy, color, size, life));
        }
    }

    emitGlyphCollect(x, y, glyphColor) {
        this.emit(x, y, 15, {
            velocityRange: { min: -2, max: 2 },
            colors: [glyphColor, '#fff', glyphColor],
            sizeRange: { min: 3, max: 6 },
            lifeRange: { min: 0.8, max: 1.5 }
        });
    }

    emitRockShatter(x, y, size) {
        const count = Math.floor(size / 5) + 10;
        this.emit(x, y, count, {
            velocityRange: { min: -4, max: 4 },
            colors: ['#666', '#777', '#888', '#999'],
            sizeRange: { min: 2, max: 8 },
            lifeRange: { min: 1, max: 2 }
        });
    }

    emitDust(x, y, count = 5) {
        this.emit(x, y, count, {
            velocityRange: { min: -1, max: 1 },
            colors: ['#999', '#aaa', '#bbb'],
            sizeRange: { min: 1, max: 3 },
            lifeRange: { min: 0.3, max: 0.8 }
        });
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, camera) {
        this.particles.forEach(particle => particle.draw(ctx, camera));
    }

    clear() {
        this.particles = [];
    }
}
