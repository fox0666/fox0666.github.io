function clickEffect() {
    let balls = [];
    let longPressed = false;
    let longPress;
    let multiplier = 0;
    let width, height;
    const colours = ["#F73859", "#14FFEC", "#00E0FF", "#FF99FE", "#FAF15D"];
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width: 100%; height: 100%; top: 0; left: 0; z-index: 999999; position: fixed; pointer-events: none;";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    function updateSize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    class Ball {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.angle = Math.PI * 2 * Math.random();
            this.multiplier = longPressed ? Math.floor(Math.random() * 2) + 14 + multiplier : Math.floor(Math.random() * 7) + 6;
            this.vx = (this.multiplier + Math.random() * 0.5) * Math.cos(this.angle);
            this.vy = (this.multiplier + Math.random() * 0.5) * Math.sin(this.angle);
            this.r = Math.floor(Math.random() * 5) + 8 + 3 * Math.random();
            this.color = colours[Math.floor(Math.random() * colours.length)];
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.r *= 0.97;
            this.vx *= 0.95;
            this.vy *= 0.95;
        }
    }

    function pushBalls(count, x, y) {
        for (let i = 0; i < count; i++) {
            balls.push(new Ball(x, y));
        }
    }

    function loop() {
        ctx.clearRect(0, 0, width, height);
        balls = balls.filter(b => b.r > 2);
        balls.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
            b.update();
        });
        requestAnimationFrame(loop);
    }

    window.addEventListener("mousedown", (e) => {
        pushBalls(10, e.clientX, e.clientY);
        longPress = setTimeout(() => {
            longPressed = true;
            pushBalls(50, e.clientX, e.clientY);
        }, 500);
    });

    window.addEventListener("mouseup", () => {
        clearTimeout(longPress);
        longPressed = false;
    });

    updateSize();
    window.addEventListener("resize", updateSize);
    loop();
}

clickEffect();
