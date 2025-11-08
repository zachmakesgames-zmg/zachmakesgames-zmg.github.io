// Environmental objects: walls, water, sand, ramps, geysers, doors

class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = 'wall';
    }

    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const screenWidth = this.width * camera.zoom;
        const screenHeight = this.height * camera.zoom;

        // Stone wall texture
        const gradient = ctx.createLinearGradient(
            screenPos.x, screenPos.y,
            screenPos.x + screenWidth, screenPos.y + screenHeight
        );
        gradient.addColorStop(0, '#555');
        gradient.addColorStop(0.5, '#666');
        gradient.addColorStop(1, '#555');

        ctx.fillStyle = gradient;
        ctx.fillRect(screenPos.x, screenPos.y, screenWidth, screenHeight);

        // Stone texture lines
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);

        // Add some weathering
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const y = screenPos.y + (screenHeight / 4) * (i + 1);
            ctx.beginPath();
            ctx.moveTo(screenPos.x, y);
            ctx.lineTo(screenPos.x + screenWidth, y);
            ctx.stroke();
        }
    }
}

class Water {
    constructor(x, y, width, height, flowX = 0, flowY = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.flowX = flowX; // Flow direction and speed
        this.flowY = flowY;
        this.type = 'water';
        this.waveOffset = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        this.waveOffset += 0.05;
    }

    applyFlow(boulder) {
        // Apply flow force to boulder
        boulder.velocityX += this.flowX * 0.1;
        boulder.velocityY += this.flowY * 0.1;
        boulder.isInWater = true;
    }

    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const screenWidth = this.width * camera.zoom;
        const screenHeight = this.height * camera.zoom;

        // Water base
        ctx.fillStyle = 'rgba(70, 130, 180, 0.6)';
        ctx.fillRect(screenPos.x, screenPos.y, screenWidth, screenHeight);

        // Animated waves
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 160, 210, 0.4)';
        ctx.lineWidth = 2;

        for (let y = 0; y < screenHeight; y += 10) {
            ctx.beginPath();
            for (let x = 0; x < screenWidth; x += 5) {
                const waveY = Math.sin(this.waveOffset + x * 0.05) * 3;
                const drawY = screenPos.y + y + waveY;
                if (x === 0) ctx.moveTo(screenPos.x + x, drawY);
                else ctx.lineTo(screenPos.x + x, drawY);
            }
            ctx.stroke();
        }

        // Flow direction indicators
        if (this.flowX !== 0 || this.flowY !== 0) {
            const arrowSpacing = 40;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            for (let y = arrowSpacing; y < screenHeight; y += arrowSpacing) {
                for (let x = arrowSpacing; x < screenWidth; x += arrowSpacing) {
                    const centerX = screenPos.x + x;
                    const centerY = screenPos.y + y;
                    const angle = Math.atan2(this.flowY, this.flowX);
                    const length = 10;

                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(
                        centerX + Math.cos(angle) * length,
                        centerY + Math.sin(angle) * length
                    );
                    ctx.stroke();

                    // Arrow head
                    ctx.beginPath();
                    ctx.moveTo(
                        centerX + Math.cos(angle) * length,
                        centerY + Math.sin(angle) * length
                    );
                    ctx.lineTo(
                        centerX + Math.cos(angle - 2.5) * (length - 5),
                        centerY + Math.sin(angle - 2.5) * (length - 5)
                    );
                    ctx.moveTo(
                        centerX + Math.cos(angle) * length,
                        centerY + Math.sin(angle) * length
                    );
                    ctx.lineTo(
                        centerX + Math.cos(angle + 2.5) * (length - 5),
                        centerY + Math.sin(angle + 2.5) * (length - 5)
                    );
                    ctx.stroke();
                }
            }
        }

        ctx.restore();
    }
}

class Sand {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = 'sand';
    }

    applyEffect(boulder) {
        boulder.isInSand = true;
    }

    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const screenWidth = this.width * camera.zoom;
        const screenHeight = this.height * camera.zoom;

        // Sand texture
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(screenPos.x, screenPos.y, screenWidth, screenHeight);

        // Sand particles/texture
        ctx.fillStyle = '#c89560';
        for (let i = 0; i < 20; i++) {
            const px = screenPos.x + Math.random() * screenWidth;
            const py = screenPos.y + Math.random() * screenHeight;
            const size = Math.random() * 3;
            ctx.fillRect(px, py, size, size);
        }

        // Border
        ctx.strokeStyle = '#b08050';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
    }
}

class Ramp {
    constructor(x, y, width, height, angle = 45) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.angle = angle; // Launch angle in degrees
        this.type = 'ramp';
    }

    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const screenWidth = this.width * camera.zoom;
        const screenHeight = this.height * camera.zoom;

        // Ramp shape
        ctx.fillStyle = '#777';
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(screenPos.x, screenPos.y + screenHeight);
        ctx.lineTo(screenPos.x + screenWidth, screenPos.y + screenHeight);
        ctx.lineTo(screenPos.x + screenWidth, screenPos.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Direction arrow
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        const arrowX = screenPos.x + screenWidth * 0.5;
        const arrowY = screenPos.y + screenHeight * 0.5;
        const arrowAngle = -this.angle * (Math.PI / 180);
        const arrowLength = Math.min(screenWidth, screenHeight) * 0.4;

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX + Math.cos(arrowAngle) * arrowLength,
            arrowY + Math.sin(arrowAngle) * arrowLength
        );
        ctx.stroke();
    }
}

class Geyser {
    constructor(x, y, width, strength = 5) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.strength = strength;
        this.type = 'geyser';
        this.active = true;
        this.pulseOffset = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        this.pulseOffset += 0.1;
    }

    applyLift(boulder) {
        if (!this.active) return;

        const inGeyser = boulder.x > this.x &&
                        boulder.x < this.x + this.width &&
                        boulder.y < this.y;

        if (inGeyser) {
            boulder.velocityY -= this.strength * 0.2;
        }
    }

    draw(ctx, camera) {
        if (!this.active) return;

        const screenPos = camera.worldToScreen(this.x, this.y);
        const screenWidth = this.width * camera.zoom;
        const pulse = Math.sin(this.pulseOffset) * 0.3 + 1;

        // Geyser water stream
        const gradient = ctx.createLinearGradient(
            screenPos.x, screenPos.y,
            screenPos.x, screenPos.y - 200 * pulse
        );
        gradient.addColorStop(0, 'rgba(100, 160, 210, 0.8)');
        gradient.addColorStop(1, 'rgba(100, 160, 210, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(
            screenPos.x,
            screenPos.y - 200 * pulse,
            screenWidth,
            200 * pulse
        );

        // Base
        ctx.fillStyle = '#4682b4';
        ctx.fillRect(screenPos.x, screenPos.y, screenWidth, 10);
    }
}

class Door {
    constructor(x, y, width, height, linkedSwitch = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.linkedSwitch = linkedSwitch;
        this.isOpen = false;
        this.openProgress = 0;
        this.type = 'door';
    }

    update(deltaTime) {
        // Check if linked switch is activated
        if (this.linkedSwitch && this.linkedSwitch.activated) {
            this.isOpen = true;
        }

        // Animate door opening
        if (this.isOpen && this.openProgress < 1) {
            this.openProgress += 0.05;
        } else if (!this.isOpen && this.openProgress > 0) {
            this.openProgress -= 0.05;
        }

        this.openProgress = Utils.clamp(this.openProgress, 0, 1);
    }

    isSolid() {
        return this.openProgress < 0.9;
    }

    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const screenWidth = this.width * camera.zoom;
        const screenHeight = this.height * camera.zoom;

        // Door frame
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 4;
        ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);

        // Door panels (moving down)
        const panelHeight = screenHeight * (1 - this.openProgress);

        if (panelHeight > 0) {
            // Left panel
            ctx.fillStyle = '#555';
            ctx.fillRect(
                screenPos.x,
                screenPos.y,
                screenWidth / 2 - 2,
                panelHeight
            );

            // Right panel
            ctx.fillRect(
                screenPos.x + screenWidth / 2 + 2,
                screenPos.y,
                screenWidth / 2 - 2,
                panelHeight
            );

            // Stone texture
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenPos.x, screenPos.y, screenWidth / 2 - 2, panelHeight);
            ctx.strokeRect(screenPos.x + screenWidth / 2 + 2, screenPos.y, screenWidth / 2 - 2, panelHeight);
        }
    }
}
