(function() {
    // 核心配置：手感与视觉的平衡点
    const config = {
        friction: 0.88,    // 摩擦力：0.8~0.9之间，越小范围越小
        gravity: 0.2,      // 重力：轻轻下落
        decay: 0.03,       // 消失速度
        clickCount: 25,    // 单击粒子数
        holdFreq: 3,       // 长按发射频率
        spinSpeed: 0.25    // 旋转速度
    };

    const sound = new Audio('https://blog.369988.xyz/plugins/click.mp3');
    sound.crossOrigin = "anonymous";

    let canvas, ctx, width, height;
    let particles = [];
    let isDown = false;
    let mouseX = 0, mouseY = 0;
    let frame = 0;
    let hue = 0; // 动态色相

    function init() {
        canvas = document.createElement("canvas");
        canvas.style.cssText = "position:fixed;top:0;left:0;pointer-events:none;z-index:999999;width:100%;height:100%";
        document.body.appendChild(canvas);
        ctx = canvas.getContext("2d");
        bindEvents();
        loop();
    }

    function bindEvents() {
        const setSize = () => {
            const dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        };
        
        window.addEventListener('resize', setSize);
        setSize();

        const start = (x, y) => {
            mouseX = x;
            mouseY = y;
            isDown = true;
            playSound();
            createParticles(x, y, config.clickCount, true);
        };

        const move = (x, y) => {
            mouseX = x;
            mouseY = y;
        };

        const end = () => isDown = false;

        window.addEventListener('mousedown', e => start(e.clientX, e.clientY));
        window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
        window.addEventListener('mouseup', end);

        window.addEventListener('touchstart', e => start(e.touches[0].clientX, e.touches[0].clientY));
        window.addEventListener('touchmove', e => move(e.touches[0].clientX, e.touches[0].clientY));
        window.addEventListener('touchend', end);
    }

    function playSound() {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }

    function createParticles(x, y, count, isBurst) {
        const baseAngle = isBurst ? 0 : (frame * config.spinSpeed);
        
        for (let i = 0; i < count; i++) {
            const p = new Particle(x, y);
            // 颜色：使用 HSL 模式保证鲜艳且护眼，hue 随时间流动
            p.color = `hsl(${hue + Math.random() * 40}, 85%, 60%)`;
            
            // 物理：单击炸裂 vs 长按螺旋
            const angle = isBurst 
                ? Math.random() * Math.PI * 2 
                : baseAngle + (Math.random() - 0.5) * 0.5;
            
            const velocity = isBurst 
                ? 4 + Math.random() * 8 
                : 6 + Math.random() * 4;

            p.vx = Math.cos(angle) * velocity;
            p.vy = Math.sin(angle) * velocity;
            particles.push(p);
        }
    }

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 5 + 2;
            this.life = 1;
            this.shape = Math.random() > 0.5 ? 'circle' : 'rect';
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.3;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= config.friction;
            this.vy *= config.friction;
            this.vy += config.gravity;
            this.life -= config.decay;
            this.rotation += this.rotSpeed;
            this.size *= 0.96; // 粒子逐渐变小，显得更精致
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.life;
            
            ctx.beginPath();
            if (this.shape === 'circle') {
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            } else {
                ctx.rect(-this.size, -this.size, this.size * 2, this.size * 2);
            }
            ctx.fill();
            ctx.restore();
        }
    }

    function loop() {
        ctx.clearRect(0, 0, width, height);
        
        // 关键：lighter 混合模式让重叠处发光，产生霓虹质感
        ctx.globalCompositeOperation = 'lighter';

        if (isDown) {
            hue += 2; // 长按时颜色快速流转
            createParticles(mouseX, mouseY, config.holdFreq, false);
        } else {
            hue += 0.5; // 平时颜色缓慢流转
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw(ctx);
            if (particles[i].life <= 0 || particles[i].size < 0.3) {
                particles.splice(i, 1);
            }
        }
        
        frame++;
        requestAnimationFrame(loop);
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
