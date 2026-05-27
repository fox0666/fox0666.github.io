(function () {
    'use strict';

    var script = document.currentScript;

    var config = {
        sound: getAttr('data-sound', 'https://blog.369988.xyz/plugins/mixkit-arcade.wav'),
        volume: Number(getAttr('data-volume', '0.5')),
        bubbleCount: Number(getAttr('data-count', '12')),
        holdInterval: Number(getAttr('data-hold-interval', '85')),
        zIndex: Number(getAttr('data-z-index', '999999')),
        maxHoldSize: Number(getAttr('data-max-hold-size', '128')),
        holdGrowSpeed: Number(getAttr('data-hold-grow-speed', '2.2')),
        ignoreInput: getAttr('data-ignore-input', 'true') !== 'false'
    };

    var styleId = 'rainbow-bubble-click-style';

    var isDown = false;
    var pointerX = 0;
    var pointerY = 0;

    var holdTimer = null;
    var holdBubble = null;
    var holdSize = 0;
    var holdStartTime = 0;
    var hasAutoBurst = false;

    var audioPool = [];
    var audioIndex = 0;

    function getAttr(name, defaultValue) {
        if (!script) {
            return defaultValue;
        }

        var value = script.getAttribute(name);
        return value === null || value === '' ? defaultValue : value;
    }

    function init() {
        injectStyle();
        initAudioPool();
        bindEvents();
    }

    function initAudioPool() {
        if (!config.sound) {
            return;
        }

        for (var i = 0; i < 8; i++) {
            var audio = new Audio(config.sound);
            audio.preload = 'auto';
            audio.volume = clamp(config.volume, 0, 1);
            audioPool.push(audio);
        }
    }

    function bindEvents() {
        document.addEventListener('mousedown', function (event) {
            if (!canTrigger(event.target)) {
                return;
            }

            startPress(event.clientX, event.clientY);
        }, { passive: true });

        document.addEventListener('mousemove', function (event) {
            movePointer(event.clientX, event.clientY);
        }, { passive: true });

        document.addEventListener('mouseup', endPress, { passive: true });
        document.addEventListener('mouseleave', endPress, { passive: true });

        document.addEventListener('touchstart', function (event) {
            if (!event.touches || !event.touches.length) {
                return;
            }

            if (!canTrigger(event.target)) {
                return;
            }

            var touch = event.touches[0];
            startPress(touch.clientX, touch.clientY);
        }, { passive: true });

        document.addEventListener('touchmove', function (event) {
            if (!event.touches || !event.touches.length) {
                return;
            }

            var touch = event.touches[0];
            movePointer(touch.clientX, touch.clientY);
        }, { passive: true });

        document.addEventListener('touchend', endPress, { passive: true });
        document.addEventListener('touchcancel', endPress, { passive: true });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                endPress();
            }
        });
    }

    function canTrigger(target) {
        if (!config.ignoreInput) {
            return true;
        }

        if (!target || !target.closest) {
            return true;
        }

        return !target.closest('input, textarea, select, option, [contenteditable="true"]');
    }

    function startPress(x, y) {
        pointerX = x;
        pointerY = y;
        isDown = true;
        holdStartTime = Date.now();
        holdSize = 46;
        hasAutoBurst = false;

        playSound();
        createClickEffect(x, y);
        createHoldBubble(x, y);

        clearInterval(holdTimer);
        holdTimer = setInterval(function () {
            if (!isDown || !holdBubble) {
                return;
            }

            holdSize += config.holdGrowSpeed;

            updateHoldBubble(pointerX, pointerY, holdSize);
            createFloatingBubbles(pointerX, pointerY, 3);
            createTinyColorSpark(pointerX, pointerY);

            if (holdSize >= config.maxHoldSize && !hasAutoBurst) {
                hasAutoBurst = true;
                autoBurstHoldBubble();
            }
        }, config.holdInterval);
    }

    function movePointer(x, y) {
        pointerX = x;
        pointerY = y;

        if (isDown && holdBubble) {
            updateHoldBubble(x, y, holdSize);
        }
    }

    function endPress() {
        if (!isDown) {
            return;
        }

        isDown = false;
        clearInterval(holdTimer);
        holdTimer = null;

        if (holdBubble) {
            var duration = Date.now() - holdStartTime;

            burstHoldBubble(pointerX, pointerY, duration, holdSize);

            holdBubble.remove();
            holdBubble = null;
        }
    }

    function autoBurstHoldBubble() {
        if (!holdBubble) {
            return;
        }

        var x = pointerX;
        var y = pointerY;
        var size = holdSize;

        playSound();
        burstHoldBubble(x, y, 1800, size);

        holdBubble.remove();
        holdBubble = null;

        clearInterval(holdTimer);
        holdTimer = null;
        isDown = false;
    }

    function playSound() {
        if (!audioPool.length) {
            return;
        }

        try {
            var audio = audioPool[audioIndex];
            audioIndex = (audioIndex + 1) % audioPool.length;

            audio.pause();
            audio.currentTime = 0;
            audio.volume = clamp(config.volume, 0, 1);

            var promise = audio.play();

            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {});
            }
        } catch (e) {}
    }

    function createClickEffect(x, y) {
        createRipple(x, y, 'normal');
        createRipple(x, y, 'rainbow');

        for (var i = 0; i < config.bubbleCount; i++) {
            createBubble(x, y, false);
        }

        for (var j = 0; j < 8; j++) {
            createStar(x, y);
        }
    }

    function createHoldBubble(x, y) {
        if (holdBubble) {
            holdBubble.remove();
            holdBubble = null;
        }

        holdBubble = document.createElement('span');
        holdBubble.className = 'rainbow-bubble-hold';
        holdBubble.style.left = x + 'px';
        holdBubble.style.top = y + 'px';
        holdBubble.style.width = holdSize + 'px';
        holdBubble.style.height = holdSize + 'px';
        holdBubble.style.zIndex = config.zIndex;

        document.body.appendChild(holdBubble);
    }

    function updateHoldBubble(x, y, size) {
        if (!holdBubble) {
            return;
        }

        holdBubble.style.left = x + 'px';
        holdBubble.style.top = y + 'px';
        holdBubble.style.width = size + 'px';
        holdBubble.style.height = size + 'px';

        var progress = Math.min(size / config.maxHoldSize, 1);
        holdBubble.style.setProperty('--hold-progress', progress);
    }

    function burstHoldBubble(x, y, duration, size) {
        var power = Math.min(Math.floor(duration / 180), 12);
        var count = 16 + power * 3;

        createBigPop(x, y, size);
        createRipple(x, y, 'rainbow');
        createRipple(x, y, 'big');

        for (var i = 0; i < count; i++) {
            createBubble(x, y, false, true);
        }

        for (var j = 0; j < 12 + power; j++) {
            createStar(x, y);
        }

        for (var k = 0; k < 8; k++) {
            createFloatingBubbles(x + random(-20, 20), y + random(-20, 20), 1);
        }
    }

    function createRipple(x, y, type) {
        var ripple = document.createElement('span');

        if (type === 'rainbow') {
            ripple.className = 'rainbow-bubble-ripple rainbow-bubble-ripple-color';
        } else if (type === 'big') {
            ripple.className = 'rainbow-bubble-ripple rainbow-bubble-ripple-big';
        } else {
            ripple.className = 'rainbow-bubble-ripple';
        }

        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.zIndex = config.zIndex;

        document.body.appendChild(ripple);

        removeLater(ripple, type === 'big' ? 1100 : 800);
    }

    function createBubble(x, y, isFloating, isBurst) {
        var bubble = document.createElement('span');
        bubble.className = isFloating
            ? 'rainbow-bubble-item rainbow-bubble-float'
            : 'rainbow-bubble-item';

        if (isBurst) {
            bubble.className += ' rainbow-bubble-burst';
        }

        var size = isFloating ? random(10, 30) : random(10, 34);
        var angle = Math.random() * Math.PI * 2;
        var distance = isBurst ? random(70, 150) : random(32, 95);

        var moveX = Math.cos(angle) * distance;
        var moveY;

        if (isFloating) {
            moveY = -random(80, 170);
            moveX += random(-28, 28);
        } else {
            moveY = Math.sin(angle) * distance - random(22, 58);
        }

        var hue = random(0, 360);
        var delay = random(0, 60);

        bubble.style.left = x + random(-5, 5) + 'px';
        bubble.style.top = y + random(-5, 5) + 'px';
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.zIndex = config.zIndex;
        bubble.style.animationDelay = delay + 'ms';

        bubble.style.setProperty('--move-x', moveX + 'px');
        bubble.style.setProperty('--move-y', moveY + 'px');
        bubble.style.setProperty('--hue', hue);

        document.body.appendChild(bubble);

        removeLater(bubble, isFloating ? 1500 : 950);
    }

    function createFloatingBubbles(x, y, count) {
        for (var i = 0; i < count; i++) {
            createBubble(
                x + random(-20, 20),
                y + random(-10, 16),
                true,
                false
            );
        }
    }

    function createStar(x, y) {
        var star = document.createElement('span');
        star.className = 'rainbow-bubble-star';

        var angle = Math.random() * Math.PI * 2;
        var distance = random(34, 105);

        var moveX = Math.cos(angle) * distance;
        var moveY = Math.sin(angle) * distance - random(18, 55);
        var hue = random(0, 360);

        star.style.left = x + 'px';
        star.style.top = y + 'px';
        star.style.zIndex = config.zIndex;
        star.style.setProperty('--move-x', moveX + 'px');
        star.style.setProperty('--move-y', moveY + 'px');
        star.style.setProperty('--hue', hue);

        document.body.appendChild(star);

        removeLater(star, 760);
    }

    function createTinyColorSpark(x, y) {
        var spark = document.createElement('span');
        spark.className = 'rainbow-bubble-tiny-spark';

        var hue = random(0, 360);

        spark.style.left = x + random(-24, 24) + 'px';
        spark.style.top = y + random(-24, 24) + 'px';
        spark.style.zIndex = config.zIndex;
        spark.style.setProperty('--hue', hue);

        document.body.appendChild(spark);

        removeLater(spark, 760);
    }

    function createBigPop(x, y, size) {
        var pop = document.createElement('span');
        pop.className = 'rainbow-bubble-big-pop';

        var popSize = Math.max(size || 86, 86);

        pop.style.left = x + 'px';
        pop.style.top = y + 'px';
        pop.style.width = popSize + 'px';
        pop.style.height = popSize + 'px';
        pop.style.zIndex = config.zIndex;

        document.body.appendChild(pop);

        removeLater(pop, 900);
    }

    function removeLater(el, time) {
        setTimeout(function () {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        }, time);
    }

    function injectStyle() {
        if (document.getElementById(styleId)) {
            return;
        }

        var style = document.createElement('style');
        style.id = styleId;

        style.innerHTML = `
            .rainbow-bubble-ripple,
            .rainbow-bubble-item,
            .rainbow-bubble-star,
            .rainbow-bubble-hold,
            .rainbow-bubble-tiny-spark,
            .rainbow-bubble-big-pop {
                position: fixed;
                left: 0;
                top: 0;
                pointer-events: none;
                box-sizing: border-box;
            }

            .rainbow-bubble-ripple {
                width: 26px;
                height: 26px;
                border-radius: 50%;
                border: 2px solid rgba(110, 225, 255, 0.72);
                box-shadow:
                    0 0 18px rgba(110, 225, 255, 0.58),
                    inset 0 0 14px rgba(255, 255, 255, 0.76);
                transform: translate(-50%, -50%) scale(0.18);
                animation: rainbowBubbleRipple 760ms ease-out forwards;
            }

            .rainbow-bubble-ripple-color {
                width: 34px;
                height: 34px;
                border: 2px solid rgba(255, 255, 255, 0.7);
                background:
                    conic-gradient(
                        from 0deg,
                        rgba(255, 80, 150, 0.28),
                        rgba(255, 210, 80, 0.25),
                        rgba(100, 255, 170, 0.25),
                        rgba(80, 220, 255, 0.28),
                        rgba(160, 120, 255, 0.25),
                        rgba(255, 80, 180, 0.28)
                    );
                box-shadow:
                    0 0 22px rgba(120, 230, 255, 0.5),
                    0 0 36px rgba(200, 120, 255, 0.32);
                animation-duration: 900ms;
            }

            .rainbow-bubble-ripple-big {
                width: 48px;
                height: 48px;
                border: 2px solid rgba(255, 255, 255, 0.82);
                background:
                    conic-gradient(
                        rgba(255, 90, 150, 0.22),
                        rgba(255, 230, 90, 0.22),
                        rgba(80, 255, 180, 0.22),
                        rgba(80, 210, 255, 0.22),
                        rgba(165, 120, 255, 0.22),
                        rgba(255, 90, 180, 0.22)
                    );
                animation: rainbowBubbleBigRipple 1100ms ease-out forwards;
            }

            .rainbow-bubble-item {
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0.18);
                background:
                    radial-gradient(circle at 28% 23%,
                        rgba(255, 255, 255, 1) 0%,
                        rgba(255, 255, 255, 0.96) 10%,
                        hsla(var(--hue), 100%, 78%, 0.68) 30%,
                        hsla(calc(var(--hue) + 70), 100%, 70%, 0.42) 55%,
                        hsla(calc(var(--hue) + 145), 100%, 68%, 0.2) 78%,
                        rgba(255, 255, 255, 0.04) 100%
                    );
                border: 1px solid rgba(255, 255, 255, 0.82);
                box-shadow:
                    0 0 13px hsla(var(--hue), 100%, 70%, 0.68),
                    0 0 24px hsla(calc(var(--hue) + 90), 100%, 70%, 0.28),
                    inset 0 0 11px rgba(255, 255, 255, 0.86),
                    inset -5px -7px 13px hsla(calc(var(--hue) + 180), 100%, 60%, 0.18);
                animation:
                    rainbowBubbleFly 880ms cubic-bezier(.16,.88,.32,1) forwards,
                    rainbowBubbleHue 1300ms linear infinite;
            }

            .rainbow-bubble-item::before {
                content: "";
                position: absolute;
                left: 23%;
                top: 18%;
                width: 30%;
                height: 18%;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.98);
                transform: rotate(-28deg);
                filter: blur(0.15px);
            }

            .rainbow-bubble-item::after {
                content: "";
                position: absolute;
                right: 22%;
                bottom: 23%;
                width: 15%;
                height: 15%;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.56);
            }

            .rainbow-bubble-float {
                animation:
                    rainbowBubbleFloat 1500ms ease-out forwards,
                    rainbowBubbleHue 1300ms linear infinite;
            }

            .rainbow-bubble-burst {
                animation:
                    rainbowBubbleBurst 920ms cubic-bezier(.15,.9,.2,1) forwards,
                    rainbowBubbleHue 1000ms linear infinite;
            }

            .rainbow-bubble-star {
                width: 8px;
                height: 8px;
                transform: translate(-50%, -50%) rotate(45deg) scale(0.25);
                background: hsla(var(--hue), 100%, 82%, 0.98);
                box-shadow:
                    0 0 8px rgba(255, 255, 255, 0.98),
                    0 0 18px hsla(var(--hue), 100%, 68%, 0.9),
                    0 0 30px hsla(calc(var(--hue) + 100), 100%, 70%, 0.45);
                animation:
                    rainbowBubbleStar 720ms ease-out forwards,
                    rainbowBubbleHue 900ms linear infinite;
            }

            .rainbow-bubble-tiny-spark {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: hsla(var(--hue), 100%, 82%, 0.96);
                box-shadow:
                    0 0 8px rgba(255, 255, 255, 0.95),
                    0 0 17px hsla(var(--hue), 100%, 70%, 0.85);
                transform: translate(-50%, -50%) scale(0.5);
                animation:
                    rainbowBubbleTinySpark 760ms ease-out forwards,
                    rainbowBubbleHue 900ms linear infinite;
            }

            .rainbow-bubble-hold {
                --hold-progress: 0;
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(1);
                background:
                    radial-gradient(circle at 28% 22%,
                        rgba(255, 255, 255, 1) 0%,
                        rgba(255, 255, 255, 0.96) 9%,
                        rgba(120, 230, 255, 0.62) 25%,
                        rgba(255, 130, 210, 0.38) 45%,
                        rgba(160, 120, 255, 0.32) 65%,
                        rgba(80, 255, 190, 0.18) 82%,
                        rgba(255, 255, 255, 0.04) 100%
                    ),
                    conic-gradient(
                        from 0deg,
                        rgba(255, 85, 150, 0.42),
                        rgba(255, 220, 90, 0.38),
                        rgba(80, 255, 170, 0.36),
                        rgba(80, 215, 255, 0.42),
                        rgba(165, 120, 255, 0.4),
                        rgba(255, 85, 180, 0.42)
                    );
                border: 1px solid rgba(255, 255, 255, 0.88);
                box-shadow:
                    0 0 calc(18px + 22px * var(--hold-progress)) rgba(110, 225, 255, 0.62),
                    0 0 calc(36px + 38px * var(--hold-progress)) rgba(210, 120, 255, 0.38),
                    inset 0 0 20px rgba(255, 255, 255, 0.85),
                    inset -10px -12px 28px rgba(90, 160, 255, 0.2);
                animation:
                    rainbowHoldAppear 220ms ease-out forwards,
                    rainbowHoldPulse 1050ms ease-in-out infinite,
                    rainbowBubbleHue 1700ms linear infinite;
            }

            .rainbow-bubble-hold::before {
                content: "";
                position: absolute;
                left: 21%;
                top: 17%;
                width: 31%;
                height: 18%;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.98);
                transform: rotate(-26deg);
            }

            .rainbow-bubble-hold::after {
                content: "";
                position: absolute;
                left: 50%;
                top: 50%;
                width: 135%;
                height: 135%;
                border-radius: 50%;
                border: 1px solid rgba(255, 255, 255, 0.55);
                background:
                    conic-gradient(
                        rgba(255, 80, 150, 0.16),
                        rgba(255, 230, 80, 0.12),
                        rgba(80, 255, 180, 0.13),
                        rgba(80, 210, 255, 0.16),
                        rgba(160, 120, 255, 0.13),
                        rgba(255, 80, 180, 0.16)
                    );
                transform: translate(-50%, -50%) scale(0.72);
                animation: rainbowHoldRing 1000ms ease-out infinite;
            }

            .rainbow-bubble-big-pop {
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0.42);
                border: 2px solid rgba(255, 255, 255, 0.86);
                background:
                    radial-gradient(circle,
                        rgba(255,255,255,0.18),
                        rgba(255,255,255,0.03) 55%,
                        transparent 70%
                    ),
                    conic-gradient(
                        rgba(255, 80, 150, 0.32),
                        rgba(255, 230, 80, 0.28),
                        rgba(80, 255, 180, 0.28),
                        rgba(80, 210, 255, 0.34),
                        rgba(160, 120, 255, 0.3),
                        rgba(255, 80, 180, 0.32)
                    );
                box-shadow:
                    0 0 28px rgba(100, 220, 255, 0.72),
                    0 0 55px rgba(200, 120, 255, 0.5),
                    inset 0 0 24px rgba(255, 255, 255, 0.76);
                animation:
                    rainbowBigPop 900ms ease-out forwards,
                    rainbowBubbleHue 900ms linear infinite;
            }

            @keyframes rainbowBubbleRipple {
                0% {
                    opacity: 0.96;
                    transform: translate(-50%, -50%) scale(0.2);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(4.6);
                }
            }

            @keyframes rainbowBubbleBigRipple {
                0% {
                    opacity: 0.95;
                    transform: translate(-50%, -50%) scale(0.18) rotate(0deg);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(5.8) rotate(90deg);
                }
            }

            @keyframes rainbowBubbleFly {
                0% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(0.16);
                }
                42% {
                    opacity: 0.96;
                }
                100% {
                    opacity: 0;
                    transform:
                        translate(
                            calc(-50% + var(--move-x)),
                            calc(-50% + var(--move-y))
                        )
                        scale(1.18);
                }
            }

            @keyframes rainbowBubbleFloat {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.25);
                }
                14% {
                    opacity: 0.96;
                }
                100% {
                    opacity: 0;
                    transform:
                        translate(
                            calc(-50% + var(--move-x)),
                            calc(-50% + var(--move-y))
                        )
                        scale(1.1);
                }
            }

            @keyframes rainbowBubbleBurst {
                0% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(0.18);
                }
                35% {
                    opacity: 0.98;
                }
                100% {
                    opacity: 0;
                    transform:
                        translate(
                            calc(-50% + var(--move-x)),
                            calc(-50% + var(--move-y))
                        )
                        scale(1.35);
                }
            }

            @keyframes rainbowBubbleStar {
                0% {
                    opacity: 1;
                    transform: translate(-50%, -50%) rotate(45deg) scale(0.25);
                }
                100% {
                    opacity: 0;
                    transform:
                        translate(
                            calc(-50% + var(--move-x)),
                            calc(-50% + var(--move-y))
                        )
                        rotate(220deg)
                        scale(1.18);
                }
            }

            @keyframes rainbowBubbleTinySpark {
                0% {
                    opacity: 0.96;
                    transform: translate(-50%, -50%) scale(0.4);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -110%) scale(1.25);
                }
            }

            @keyframes rainbowHoldAppear {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.35);
                }
                100% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            @keyframes rainbowHoldPulse {
                0%, 100% {
                    filter: hue-rotate(0deg) saturate(1.1);
                }
                50% {
                    filter: hue-rotate(45deg) saturate(1.45);
                }
            }

            @keyframes rainbowHoldRing {
                0% {
                    opacity: 0.72;
                    transform: translate(-50%, -50%) scale(0.62) rotate(0deg);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(1.42) rotate(90deg);
                }
            }

            @keyframes rainbowBigPop {
                0% {
                    opacity: 0.98;
                    transform: translate(-50%, -50%) scale(0.4) rotate(0deg);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(2.25) rotate(120deg);
                }
            }

            @keyframes rainbowBubbleHue {
                0% {
                    filter: hue-rotate(0deg) saturate(1.15);
                }
                100% {
                    filter: hue-rotate(360deg) saturate(1.25);
                }
            }
        `;

        document.head.appendChild(style);
    }

    function random(min, max) {
        return min + Math.random() * (max - min);
    }

    function clamp(value, min, max) {
        value = Number(value);

        if (Number.isNaN(value)) {
            value = min;
        }

        return Math.max(min, Math.min(value, max));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
