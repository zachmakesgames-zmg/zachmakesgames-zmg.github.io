// Camera system for following the player

class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.targetX = 0;
        this.targetY = 0;
        this.smoothing = 0.1;
        this.zoom = 1;
        this.targetZoom = 1;
    }

    follow(target, worldWidth, worldHeight) {
        // Set target position (center on target)
        this.targetX = target.x - this.width / (2 * this.zoom);
        this.targetY = target.y - this.height / (2 * this.zoom);

        // Clamp to world bounds
        this.targetX = Utils.clamp(this.targetX, 0, worldWidth - this.width / this.zoom);
        this.targetY = Utils.clamp(this.targetY, 0, worldHeight - this.height / this.zoom);

        // Smooth camera movement
        this.x = Utils.lerp(this.x, this.targetX, this.smoothing);
        this.y = Utils.lerp(this.y, this.targetY, this.smoothing);

        // Smooth zoom
        this.zoom = Utils.lerp(this.zoom, this.targetZoom, this.smoothing);
    }

    setZoom(zoom) {
        this.targetZoom = Utils.clamp(zoom, 0.5, 2);
    }

    shake(intensity = 5, duration = 300) {
        // Simple camera shake effect
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeStartTime = Date.now();
    }

    update() {
        // Apply shake if active
        if (this.shakeDuration > 0) {
            const elapsed = Date.now() - this.shakeStartTime;
            if (elapsed < this.shakeDuration) {
                const progress = elapsed / this.shakeDuration;
                const currentIntensity = this.shakeIntensity * (1 - progress);

                this.x += Utils.random(-currentIntensity, currentIntensity);
                this.y += Utils.random(-currentIntensity, currentIntensity);
            } else {
                this.shakeDuration = 0;
            }
        }
    }

    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom,
            y: (worldY - this.y) * this.zoom
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.zoom + this.x,
            y: screenY / this.zoom + this.y
        };
    }
}
