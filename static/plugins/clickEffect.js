function clickEffect() {
    let shapes = [];
    let waves = [];
    let longPressed = false;
    let longPress;
    let multiplier = 0;
    let width, height;
    let origin;
    let normal;
    let ctx;
    const shapeColours = ["#FF6B6B", "#6BFFB6", "#B66BFF", "#FFB66B", "#6B6BFF"];
    const waveColours = ["rgba(255, 107, 107, 0.5)", "rgba(107, 255, 182, 0.5)", "rgba(182, 107, 255, 0.5)", "rgba(255, 182, 107, 0.5)", "rgba(107, 107, 255, 0.5)"];
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    // 提高 z-index 的值，确保画布显示在更上层
    canvas.setAttribute("style", "width: 100%; height: 100%; top: 0; left: 0; z-index: 999999; position: fixed; pointer-events: none;");

    if (canvas.getContext && window.addEventListener) {
        ctx = canvas.getContext("2d");
        updateSize();
        window.addEventListener('resize', updateSize, false);
        loop();
        window.addEventListener("mousedown", function (e) {
            pushShapes(randBetween(10, 20), e.clientX, e.clientY);
            createWave(e.clientX, e.clientY);
            document.body.classList.add("is-pressed");
            longPress = setTimeout(function () {
                document.body.classList.add("is-longpress");
                longPressed = true;
            }, 500);
        }, false);
        window.addEventListener("mouseup", function (e) {
            clearTimeout(longPress);
            if (longPressed) {
                document.body.classList.remove("is-longpress");
                pushShapes(randBetween(50 + Math.ceil(multiplier), 100 + Math.ceil(multiplier)), e.clientX, e.clientY);
                longPressed = false;
            }
            document.body.classList.remove("is-pressed");
        }, false);
    } else {
        console.log("canvas or addEventListener is unsupported!");
    }

    function updateSize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * 2;
        canvas.height = height * 2;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(2, 2);
        origin = {
            x: width / 2,
            y: height / 2
        };
        normal = {
            x: width / 2,
            y: height / 2
        };
    }

    class Shape {
        constructor(x = origin.x, y = origin.y) {
            this.x = x;
            this.y = y;
            this.angle = Math.PI * 2 * Math.random();
            if (longPressed) {
                this.multiplier = randBetween(14 + multiplier, 15 + multiplier);
            } else {
                this.multiplier = randBetween(6, 12);
            }
            this.vx = (this.multiplier + Math.random() * 0.5) * Math.cos(this.angle);
            this.vy = (this.multiplier + Math.random() * 0.5) * Math.sin(this.angle);
            this.size = randBetween(8, 12) + 3 * Math.random();
            this.color = shapeColours[Math.floor(Math.random() * shapeColours.length)];
            this.type = Math.floor(Math.random() * 5);
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        }

        update() {
            this.x += this.vx - normal.x;
            this.y += this.vy - normal.y;
            normal.x = -2 / width * Math.sin(this.angle);
            normal.y = -2 / height * Math.cos(this.angle);
            this.size -= 0.1;
            this.vx *= 0.98;
            this.vy *= 0.98;
            this.rotation += this.rotationSpeed;
        }

        draw() {
            let gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, this.color.replace(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/, "#$1$2$300"));
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            switch (this.type) {
                case 0:
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2, false);
                    break;
                case 1:
                    let sideLength = this.size * 2;
                    let height = Math.sqrt(3) / 2 * sideLength;
                    ctx.moveTo(0, -height / 2);
                    ctx.lineTo(sideLength / 2, height / 2);
                    ctx.lineTo(-sideLength / 2, height / 2);
                    ctx.closePath();
                    break;
                case 2:
                    let halfSize = this.size;
                    ctx.rect(-halfSize, -halfSize, this.size * 2, this.size * 2);
                    break;
                case 3:
                    let numSides = 5;
                    let sideAngle = (Math.PI * 2) / numSides;
                    for (let i = 0; i < numSides; i++) {
                        let angle = i * sideAngle;
                        let x = this.size * Math.cos(angle);
                        let y = this.size * Math.sin(angle);
                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    ctx.closePath();
                    break;
                case 4:
                    let numSidesHex = 6;
                    let sideAngleHex = (Math.PI * 2) / numSidesHex;
                    for (let i = 0; i < numSidesHex; i++) {
                        let angle = i * sideAngleHex;
                        let x = this.size * Math.cos(angle);
                        let y = this.size * Math.sin(angle);
                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    ctx.closePath();
                    break;
            }
            ctx.restore();
            ctx.fill();
        }
    }

    class Wave {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.r = 0;
            this.opacity = 0.8;
            this.speed = randBetween(2, 4);
            this.color = waveColours[Math.floor(Math.random() * waveColours.length)];
        }

        update() {
            this.r += this.speed;
            this.opacity -= 0.015;
        }
    }

    function pushShapes(count = 1, x = origin.x, y = origin.y) {
        for (let i = 0; i < count; i++) {
            shapes.push(new Shape(x, y));
        }
    }

    function createWave(x, y) {
        waves.push(new Wave(x, y));
    }

    function randBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function loop() {
        ctx.fillStyle = "rgba(255, 255, 255, 0)";
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let newWaves = [];
        for (let i = 0; i < waves.length; i++) {
            let w = waves[i];
            if (w.opacity > 0) {
                let gradient = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r);
                gradient.addColorStop(0, w.color.replace("0.5", "0.8"));
                gradient.addColorStop(1, w.color.replace("0.5", "0"));
                ctx.beginPath();
                ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 3;
                ctx.stroke();
                w.update();
                newWaves.push(w);
            }
        }
        waves = newWaves;

        let newShapes = [];
        for (let i = 0; i < shapes.length; i++) {
            let s = shapes[i];
            if (s.size >= 0) {
                s.draw();
                s.update();
                newShapes.push(s);
            }
        }
        shapes = newShapes;

        if (longPressed) {
            multiplier += 0.2;
        } else if (!longPressed && multiplier >= 0) {
            multiplier -= 0.4;
        }
        requestAnimationFrame(loop);
    }
}    
