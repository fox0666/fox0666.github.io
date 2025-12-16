(function() {
    let canvas, ctx, width, height;
    let particles = [];
    const colors = ['#FF1461', '#18FF92', '#5A87FF', '#FBF38C'];
    
    // 初始化音频 (确保 click.mp3 和 html 在同一文件夹)
    const sound = new Audio('click.mp3');
    sound.preload = 'auto'; // 预加载

    function init() {
        canvas = document.createElement("canvas");
        canvas.style.cssText = "position:fixed;top:0;left:0;pointer-events:none;z-index:999999;width:100%;height:100%";
        document.body.appendChild(canvas);
        ctx = canvas.getContext("2d");
        bindEvents();
        loop();
    }

    function bindEvents() {
        window.addEventListener('resize', onResize);
        window.addEventListener('mousedown', onPointerDown);
        window.addEventListener('touchstart', onPointerDown);
        onResize();
    }

    function onResize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function onPointerDown(e) {
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        
        playSound(); // 播放声音
        createParticles(x, y);
    }

    function playSound() {
        // 重置播放进度，实现快速连点
        sound.currentTime = 0; 
        // 捕获播放错误（防止没有交互时报错）
        sound.play().catch(() => {}); 
    }

    function createParticles(x, y) {
        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(x, y));
        }
    }

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.size = Math.random() * 5 + 2;
            this.life = 1;
            this.decay = 0.015 + Math.random() * 0.02;
            this.type = Math.random() > 0.5 ? 'circle' : 'rect';
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.94;
            this.vy *= 0.94;
            this.vy += 0.4;
            this.rotation += this.rotationSpeed;
            this.life -= this.decay;
        }

        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.life;
            ctx.beginPath();
            if (this.type === 'circle') {
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            } else {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
            ctx.fill();
        }
    }

    function loop() {
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw(ctx);
            if (particles[i].life <= 0) particles.splice(i, 1);
        }
        requestAnimationFrame(loop);
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
