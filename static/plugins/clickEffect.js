function clickEffect() {
    let balls = [];
    let longPressed = false;
    let longPress;
    let multiplier = 0;
    let width, height;
    let origin;
    let normal;
    let ctx;
    const colours = ["#F73859", "#14FFEC", "#00E0FF", "#FF99FE", "#FAF15D", "#FF6B6B", "#6BFFA0", "#A06BFF"];
    const shapes = ['circle', 'square', 'triangle'];
    const ballPool = [];
    const clickSound = new Audio('click.mp3');
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width: 100%; height: 100%; top: 0; left: 0; z-index: 99999; position: fixed; pointer-events: none;";
    document.body.appendChild(canvas);
    const pointer = document.createElement("span");
    pointer.classList.add("pointer");
    document.body.appendChild(pointer);
    if (canvas.getContext && window.addEventListener) {
        ctx = canvas.getContext("2d");
        updateSize();
        window.addEventListener('resize', updateSize);
        window.addEventListener("mousedown", (e) => {
            clickSound.play();
            pushBalls(randBetween(10, 20), e.clientX, e.clientY);
            document.body.classList.add("is-pressed");
            longPress = setTimeout(() => {
                document.body.classList.add("is-longpress");
                longPressed = true;
                balls.forEach((b) => {
                    b.r *= 1.5;
                    b.vx *= 1.2;
                    b.vy *= 1.2;
                });
            }, 500);
        }, { capture: true });
        window.addEventListener("mouseup", (e) => {
            clearTimeout(longPress);
            if (longPressed) {
                document.body.classList.remove("is-longpress");
                pushBalls(randBetween(50 + Math.ceil(multiplier), 100 + Math.ceil(multiplier)), e.clientX, e.clientY);
                longPressed = false;
            }
            document.body.classList.remove("is-pressed");
        }, { capture: true });
        window.addEventListener("mousemove", (e) => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            pointer.style.top = `${mouseY}px`;
            pointer.style.left = `${mouseX}px`;
            balls.forEach((b) => {
                const dx = mouseX - b.x;
                const dy = mouseY - b.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100) {
                    const force = 0.1;
                    b.vx += (dx / distance) * force;
                    b.vy += (dy / distance) * force;
                }
            });
        }, { capture: true });
        loop();
    }
    function updateSize() {
        canvas.width = window.innerWidth * 2;
        canvas.height = window.innerHeight * 2;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.scale(2, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        origin = {
            x: width / 2,
            y: height / 2
        };
        normal = {
            x: width / 2,
            y: height / 2
        };
        if (width < 600) {
            const newBalls = balls.slice(0, Math.floor(balls.length / 2));
            balls = newBalls;
        }
    }
    class Ball {
        constructor(x = origin.x, y = origin.y) {
            this.x = x;
            this.y = y;
            this.angle = Math.PI * 2 * Math.random();
            this.multiplier = longPressed ? randBetween(14 + multiplier, 15 + multiplier) : randBetween(6, 12);
            this.vx = (this.multiplier + Math.random() * 0.5) * Math.cos(this.angle);
            this.vy = (this.multiplier + Math.random() * 0.5) * Math.sin(this.angle);
            this.r = randBetween(8, 12) + 3 * Math.random();
            this.color = colours[Math.floor(Math.random() * colours.length)];
            this.shape = shapes[Math.floor(Math.random() * shapes.length)];
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.1;
            this.scale = 1;
            this.scaleSpeed = -0.01;
        }
        update() {
            this.x += this.vx - normal.x;
            this.y += this.vy - normal.y;
            normal.x = -2 / window.innerWidth * Math.sin(this.angle);
            normal.y = -2 / window.innerHeight * Math.cos(this.angle);
            this.r -= 0.3;
            this.vx *= 0.9;
            this.vy *= 0.9;
            this.rotation += this.rotationSpeed;
            this.scale += this.scaleSpeed;
        }
    }
    function getBall(x, y) {
        if (ballPool.length > 0) {
            const ball = ballPool.pop();
            ball.x = x;
            ball.y = y;
            ball.angle = Math.PI * 2 * Math.random();
            ball.multiplier = longPressed ? randBetween(14 + multiplier, 15 + multiplier) : randBetween(6, 12);
            ball.vx = (ball.multiplier + Math.random() * 0.5) * Math.cos(ball.angle);
            ball.vy = (ball.multiplier + Math.random() * 0.5) * Math.sin(ball.angle);
            ball.r = randBetween(8, 12) + 3 * Math.random();
            ball.color = colours[Math.floor(Math.random() * colours.length)];
            ball.shape = shapes[Math.floor(Math.random() * shapes.length)];
            ball.rotation = Math.random() * Math.PI * 2;
            ball.rotationSpeed = (Math.random() - 0.5) * 0.1;
            ball.scale = 1;
            ball.scaleSpeed = -0.01;
            return ball;
        }
        return new Ball(x, y);
    }
    function releaseBall(ball) {
        ballPool.push(ball);
    }
    function pushBalls(count = 1, x = origin.x, y = origin.y) {
        for (let i = 0; i < count; i++) {
            balls.push(getBall(x, y));
        }
    }
    function randBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function loop() {
        ctx.fillStyle = "rgba(255, 255, 255, 0)";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < balls.length; i++) {
            const b = balls[i];
            if (b.r < 0) continue;
            const gradient = ctx.createLinearGradient(b.x - b.r, b.y - b.r, b.x + b.r, b.y + b.r);
            gradient.addColorStop(0, b.color);
            gradient.addColorStop(1, 'white');
            ctx.fillStyle = gradient;
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.rotation);
            ctx.scale(b.scale, b.scale);
            ctx.beginPath();
            switch (b.shape) {
                case 'circle':
                    ctx.arc(0, 0, b.r, 0, Math.PI * 2, false);
                    break;
                case 'square':
                    ctx.rect(-b.r, -b.r, b.r * 2, b.r * 2);
                    break;
                case 'triangle':
                    ctx.moveTo(0, -b.r);
                    ctx.lineTo(b.r, b.r);
                    ctx.lineTo(-b.r, b.r);
                    ctx.closePath();
                    break;
            }
            ctx.fill();
            ctx.restore();
            b.update();
        }
        if (longPressed) {
            multiplier += 0.2;
        } else if (multiplier >= 0) {
            multiplier -= 0.4;
        }
        removeBall();
        requestAnimationFrame(loop);
    }
    function removeBall() {
        for (let i = balls.length - 1; i >= 0; i--) {
            const b = balls[i];
            if (b.x + b.r < 0 || b.x - b.r > width || b.y + b.r < 0 || b.y - b.r > height || b.r < 0) {
                releaseBall(b);
                balls.splice(i, 1);
            }
        }
    }
}
document.addEventListener('DOMContentLoaded', clickEffect);    
