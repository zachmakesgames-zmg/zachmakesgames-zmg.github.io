// Input handling for mobile touch and desktop controls

class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.inputX = 0;
        this.inputY = 0;
        this.isActive = false;

        // Touch controls
        this.touchActive = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;

        // Keyboard controls
        this.keys = {};

        // Detect if mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        this.initControls();
    }

    initControls() {
        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // Mouse controls for desktop
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Keyboard controls
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();

        this.touchStartX = touch.clientX - rect.left;
        this.touchStartY = touch.clientY - rect.top;
        this.touchCurrentX = this.touchStartX;
        this.touchCurrentY = this.touchStartY;
        this.touchActive = true;
        this.isActive = true;
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touchActive) return;

        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();

        this.touchCurrentX = touch.clientX - rect.left;
        this.touchCurrentY = touch.clientY - rect.top;

        this.updateTouchInput();
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.touchActive = false;
        this.isActive = false;
        this.inputX = 0;
        this.inputY = 0;
    }

    updateTouchInput() {
        const dx = this.touchCurrentX - this.touchStartX;
        const dy = this.touchCurrentY - this.touchStartY;

        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 75; // Maximum drag distance for full input

        if (distance > 0) {
            const normalizedDistance = Math.min(distance, maxDistance) / maxDistance;
            this.inputX = (dx / distance) * normalizedDistance;
            this.inputY = (dy / distance) * normalizedDistance;
        } else {
            this.inputX = 0;
            this.inputY = 0;
        }
    }

    handleMouseDown(e) {
        if (this.isMobile) return; // Don't use mouse on mobile

        const rect = this.canvas.getBoundingClientRect();
        this.touchStartX = e.clientX - rect.left;
        this.touchStartY = e.clientY - rect.top;
        this.touchCurrentX = this.touchStartX;
        this.touchCurrentY = this.touchStartY;
        this.touchActive = true;
        this.isActive = true;
    }

    handleMouseMove(e) {
        if (this.isMobile || !this.touchActive) return;

        const rect = this.canvas.getBoundingClientRect();
        this.touchCurrentX = e.clientX - rect.left;
        this.touchCurrentY = e.clientY - rect.top;

        this.updateTouchInput();
    }

    handleMouseUp(e) {
        if (this.isMobile) return;

        this.touchActive = false;
        if (!this.isKeyboardActive()) {
            this.isActive = false;
            this.inputX = 0;
            this.inputY = 0;
        }
    }

    handleKeyDown(e) {
        this.keys[e.key.toLowerCase()] = true;
        this.isActive = true;

        // Prevent arrow keys from scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    }

    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;

        if (!this.isKeyboardActive()) {
            this.isActive = this.touchActive;
        }
    }

    isKeyboardActive() {
        return this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d'] ||
               this.keys['arrowup'] || this.keys['arrowdown'] || this.keys['arrowleft'] || this.keys['arrowright'];
    }

    update() {
        // Update keyboard input
        if (this.isKeyboardActive()) {
            let kx = 0;
            let ky = 0;

            if (this.keys['w'] || this.keys['arrowup']) ky -= 1;
            if (this.keys['s'] || this.keys['arrowdown']) ky += 1;
            if (this.keys['a'] || this.keys['arrowleft']) kx -= 1;
            if (this.keys['d'] || this.keys['arrowright']) kx += 1;

            // Normalize diagonal movement
            const length = Math.sqrt(kx * kx + ky * ky);
            if (length > 0) {
                this.inputX = kx / length;
                this.inputY = ky / length;
            }
        } else if (!this.touchActive) {
            this.inputX = 0;
            this.inputY = 0;
        }
    }

    getInput() {
        return {
            x: this.inputX,
            y: this.inputY,
            isActive: this.isActive,
            isSpinning: this.keys[' '] || false // Spacebar for sand spin
        };
    }

    drawJoystick(ctx) {
        if (!this.touchActive || !this.isMobile) return;

        const joystickArea = document.getElementById('joystick-area');
        if (!joystickArea) return;

        // Draw visual feedback on canvas
        const baseX = this.touchStartX;
        const baseY = this.touchStartY;
        const stickX = this.touchCurrentX;
        const stickY = this.touchCurrentY;

        ctx.save();

        // Base circle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(baseX, baseY, 50, 0, Math.PI * 2);
        ctx.stroke();

        // Connection line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(stickX, stickY);
        ctx.stroke();

        // Stick circle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(stickX, stickY, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
