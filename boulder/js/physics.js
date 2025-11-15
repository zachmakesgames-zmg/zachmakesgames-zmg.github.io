// Physics system for boulder movement and collisions

class PhysicsEngine {
    constructor() {
        this.gravity = 0.3;
        this.friction = 0.92;
        this.bounceDamping = 0.6;
    }

    applyForce(object, forceX, forceY) {
        object.velocityX += forceX;
        object.velocityY += forceY;
    }

    applyFriction(object, customFriction = null) {
        const friction = customFriction !== null ? customFriction : this.friction;
        object.velocityX *= friction;
        object.velocityY *= friction;

        // Stop very small movements
        if (Math.abs(object.velocityX) < 0.01) object.velocityX = 0;
        if (Math.abs(object.velocityY) < 0.01) object.velocityY = 0;
    }

    resolveCollisionCircleCircle(obj1, obj2) {
        const dx = obj2.x - obj1.x;
        const dy = obj2.y - obj1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = obj1.radius + obj2.radius;

        if (distance < minDist) {
            // Normalize collision vector
            const nx = dx / distance;
            const ny = dy / distance;

            // Separate objects
            const overlap = minDist - distance;
            const separationX = nx * overlap * 0.5;
            const separationY = ny * overlap * 0.5;

            obj1.x -= separationX;
            obj1.y -= separationY;
            obj2.x += separationX;
            obj2.y += separationY;

            // Calculate relative velocity
            const rvx = obj2.velocityX - obj1.velocityX;
            const rvy = obj2.velocityY - obj1.velocityY;

            // Calculate relative velocity along normal
            const velocityAlongNormal = rvx * nx + rvy * ny;

            // Don't resolve if velocities are separating
            if (velocityAlongNormal > 0) return;

            // Calculate mass ratio (based on radius/size)
            const mass1 = obj1.radius * obj1.radius;
            const mass2 = obj2.radius * obj2.radius;
            const totalMass = mass1 + mass2;

            // Calculate impulse
            const restitution = 0.7; // Bounciness
            const impulse = (-(1 + restitution) * velocityAlongNormal) / totalMass;

            // Apply impulse
            const impulseX = impulse * nx;
            const impulseY = impulse * ny;

            obj1.velocityX -= impulseX * mass2;
            obj1.velocityY -= impulseY * mass2;
            obj2.velocityX += impulseX * mass1;
            obj2.velocityY += impulseY * mass1;

            return { obj1, obj2, nx, ny, force: Math.abs(velocityAlongNormal) };
        }

        return null;
    }

    resolveCollisionCircleRect(circle, rect) {
        const closestX = Utils.clamp(circle.x, rect.x, rect.x + rect.width);
        const closestY = Utils.clamp(circle.y, rect.y, rect.y + rect.height);

        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < circle.radius) {
            // Calculate penetration
            const penetration = circle.radius - distance;

            // Normalize collision vector
            let nx = dx;
            let ny = dy;

            if (distance > 0) {
                nx /= distance;
                ny /= distance;
            } else {
                // Circle center is inside rect, push out from nearest edge
                const distToLeft = Math.abs(circle.x - rect.x);
                const distToRight = Math.abs(circle.x - (rect.x + rect.width));
                const distToTop = Math.abs(circle.y - rect.y);
                const distToBottom = Math.abs(circle.y - (rect.y + rect.height));

                const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

                if (minDist === distToLeft) { nx = -1; ny = 0; }
                else if (minDist === distToRight) { nx = 1; ny = 0; }
                else if (minDist === distToTop) { nx = 0; ny = -1; }
                else { nx = 0; ny = 1; }
            }

            // Move circle out of collision
            circle.x += nx * penetration;
            circle.y += ny * penetration;

            // Reflect velocity
            const dot = circle.velocityX * nx + circle.velocityY * ny;
            circle.velocityX -= 2 * dot * nx * 0.8;
            circle.velocityY -= 2 * dot * ny * 0.8;

            return { nx, ny, penetration };
        }

        return null;
    }

    checkRampCollision(circle, ramp) {
        // Check if circle is on the ramp surface
        if (Utils.pointInRect(circle.x, circle.y, ramp.x, ramp.y, ramp.width, ramp.height)) {
            // Apply upward force when moving across ramp
            const speedOnRamp = Math.sqrt(circle.velocityX * circle.velocityX + circle.velocityY * circle.velocityY);
            return {
                onRamp: true,
                angle: ramp.angle,
                launchSpeed: speedOnRamp
            };
        }
        return { onRamp: false };
    }
}
