(function () {
    'use strict';

    var script = document.currentScript;

    var config = {
        sound: getAttr('data-sound', './mixkit-arcade.wav'),
        volume: Number(getAttr('data-volume', '0.5')),
        bubbleCount: Number(getAttr('data-count', '10')),
        holdInterval: Number(getAttr('data-hold-interval', '90')),
        zIndex: Number(getAttr('data-z-index', '999999')),
        ignoreInput: getAttr('data-ignore-input', 'true') !== 'false'
    };

    var styleId = 'bubble-click-effect-style-v2';
    var isDown = false;
    var holdTimer = null;
    var holdBubble = null;
    var holdStartTime = 0;
    var pointerX = 0;
    var pointerY = 0;
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

        for (var i = 0; i < 6; i++) {
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

        document.addEventListener('mouseup', function () {
            endPress();
        }, { passive: true });

        document.addEventListener('mouseleave', function () {
            endPress();
        }, { passive: true });

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

        document.addEventListener('touchend', function () {
            endPress();
        }, { passive: true });

        document.addEventListener('touchcancel', function () {
            endPress();
        }, { passive: true });

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

        playSound();
        createClickEffect(x, y);
        createHoldCore(x, y);

        clearInterval(holdTimer);
        holdTimer = setInterval(function () {
            if (!isDown) {
                return;
            }

            createFloatingBubbles(pointerX, pointerY, 3);
            createTinySpark(pointerX, pointerY);

            if (holdBubble) {
                updateHoldCore(pointerX, pointerY);
            }
        }, config.holdInterval);
    }

    function movePointer(x, y) {
        pointerX = x;
        pointerY = y;

        if (isDown && holdBubble) {
            updateHoldCore(x, y);
        }
    }

    function endPress() {
        if (!isDown) {
            return;
        }

        isDown = false;
        clearInterval(holdTimer);
        holdTimer = null;

        var holdDuration = Date.now() - holdStartTime;

        if (holdBubble) {
            burstHoldCore(pointerX, pointerY, holdDuration);
            holdBubble.remove();
            holdBubble = null;
        }
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
        createRipple(x, y, 'soft');

        for (var i = 0; i < config.bubbleCount; i++) {
            createBubble(x, y, false);
        }

        for (var j = 0; j < 6; j++) {
            createStar(x, y);
        }
    }

    function createRipple(x, y, type) {
        var ripple = document.createElement('span');
        ripple.className = type === 'soft'
            ? 'bubble-click-ripple bubble-click-ripple-soft'
            : 'bubble-click-ripple';

        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.zIndex = config.zIndex;

        document.body.appendChild(ripple);

        removeLater(ripple, type === 'soft' ? 900 : 680);
    }

    function createBubble(x, y, isFloating) {
        var bubble = document.createElement('span');
        bubble.className = isFloating ? 'bubble-click-item bubble-click-float' : 'bubble-click-item';

        var size = isFloating ? random(12, 32) : random(10, 30);
        var angle = Math.random() * Math.PI * 2;
        var distance = isFloating ? random(20, 56) : random(30, 90);

        var moveX = Math.cos(angle) * distance;
        var moveY;

        if (isFloating) {
            moveY = -random(70, 150);
        } else {
            moveY = Math.sin(angle) * distance - random(20, 54);
        }

        var hue = random(180, 230);

        bubble.style.left = x + random(-4, 4) + 'px';
        bubble.style.top = y + random(-4, 4) + 'px';
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.zIndex = config.zIndex;
        bubble.style.setProperty('--move-x', moveX + 'px');
        bubble.style.setProperty('--move-y', moveY + 'px');
        bubble.style.setProperty('--hue', hue);

        document.body.appendChild(bubble);

        removeLater(bubble, isFloating ? 1350 : 850);
    }

    function createFloatingBubbles(x, y, count) {
        for (var i = 0; i < count; i++) {
            createBubble(
                x + random(-18, 18),
                y + random(-12, 12),
                true
            );
        }
    }

    function createStar(x, y) {
        var star = document.createElement('span');
        star.className = 'bubble-click-star';

        var angle = Math.random() * Math.PI * 2;
        var distance = random(26, 76);

        var moveX = Math.cos(angle) * distance;
        var moveY = Math.sin(angle) * distance - random(12, 42);

        star.style.left = x + 'px';
        star.style.top = y + 'px';
        star.style.zIndex = config.zIndex;
        star.style.setProperty('--move-x', moveX + 'px');
        star.style.setProperty('--move-y', moveY + 'px');

        document.body.appendChild(star);

        removeLater(star, 680);
    }

    function createTinySpark(x, y) {
        var spark = document.createElement('span');
        spark.className = 'bubble-click-tiny-spark';

        spark.style.left = x + random(-16, 16) + 'px';
        spark.style.top = y + random(-16, 16) + 'px';
        spark.style.zIndex = config.zIndex;

        document.body.appendChild(spark);

        removeLater(spark, 700);
    }

    function createHoldCore(x, y) {
        if (holdBubble) {
            holdBubble.remove();
            holdBubble = null;
        }

        holdBubble = document.createElement('span');
        holdBubble.className = 'bubble-click-hold-core';
        holdBubble.style.left = x + 'px';
        holdBubble.style.top = y + 'px';
        holdBubble.style.zIndex = config.zIndex;

        document.body.appendChild(holdBubble);
    }

    function updateHoldCore(x, y) {
        if (!holdBubble) {
            return;
        }

        holdBubble.style.left = x + 'px';
        holdBubble.style.top = y + 'px';
    }

    function burstHoldCore(x, y, duration) {
        var power = Math.min(Math.floor(duration / 220), 8);
        var count = 10 + power * 3;

        createRipple(x, y, 'normal');
        createRipple(x, y, 'soft');

        for (var i = 0; i < count; i++) {
            createBubble(x, y, false);
        }

        for (var j = 0; j < 8 + power; j++) {
            createStar(x, y);
        }

        createBigPop(x, y);
    }

    function createBigPop(x, y) {
        var pop = document.createElement('span');
        pop.className = 'bubble-click-big-pop';

        pop.style.left = x + 'px';
        pop.style.top = y + 'px';
        pop.style.zIndex = config.zIndex;

        document.body.appendChild(pop);

        removeLater(pop, 760);
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
            .bubble-click-ripple,
            .bubble-click-item,
            .bubble-click-star,
            .bubble-click-hold-core,
            .bubble-click-tiny-spark,
            .bubble-click-big-pop {
                position: fixed;
                left: 0;
                top: 0;
                pointer-events: none;
                box-sizing: border-box;
            }

            .bubble-click-ripple {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid rgba(90, 220, 255, 0.72);
                box-shadow:
                    0 0 18px rgba(90, 220, 255, 0.58),
                    inset 0 0 14px rgba(255, 255, 255, 0.72);
                transform: translate(-50%, -50%) scale(0.2);
                animation: bubbleClickRipple 680ms ease-out forwards;
            }

            .bubble-click-ripple-soft {
                width: 34px;
                height: 34px;
                border-color: rgba(180, 150, 255, 0.35);
                box-shadow:
                    0 0 28px rgba(156, 190, 255, 0.45),
                    inset 0 0 18px rgba(255, 255, 255, 0.55);
                animation-duration: 900ms;
            }

            .bubble-click-item {
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0.18);
                background:
                    radial-gradient(circle at 28% 24%,
                        rgba(255, 255, 255, 1) 0%,
                        rgba(255, 255, 255, 0.92) 10%,
                        hsla(var(--hue), 100%, 76%, 0.62) 34%,
                        hsla(calc(var(--hue) + 32), 95%, 68%, 0.28) 68%,
                        rgba(255, 255, 255, 0.03) 100%
                    );
                border: 1px solid rgba(255, 255, 255, 0.78);
                box-shadow:
                    0 0 13px hsla(var(--hue), 100%, 70%, 0.62),
                    inset 0 0 10px rgba(255, 255, 255, 0.8),
                    inset -4px -6px 12px rgba(70, 170, 255, 0.18);
                animation: bubbleClickFly 820ms cubic-bezier(.16,.88,.32,1) forwards;
            }

            .bubble-click-item::before {
                content: "";
                position: absolute;
                left: 24%;
                top: 19%;
                width: 28%;
                height: 18%;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.95);
                transform: rotate(-28deg);
                filter: blur(0.2px);
            }

            .bubble-click-item::after {
                content: "";
                position: absolute;
                right: 23%;
                bottom: 24%;
                width: 14%;
                height: 14%;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.55);
            }

            .bubble-click-float {
                animation: bubbleClickFloat 1350ms ease-out forwards;
            }

            .bubble-click-star {
                width: 7px;
                height: 7px;
                transform: translate(-50%, -50%) rotate(45deg) scale(0.3);
                background: rgba(255, 255, 255, 0.96);
                box-shadow:
                    0 0 8px rgba(255, 255, 255, 0.98),
                    0 0 18px rgba(95, 222, 255, 0.88);
                animation: bubbleClickStar 640ms ease-out forwards;
            }

            .bubble-click-tiny-spark {
                width: 5px;
                height: 5px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.95);
                box-shadow:
                    0 0 8px rgba(255, 255, 255, 0.95),
                    0 0 15px rgba(110, 225, 255, 0.85);
                transform: translate(-50%, -50%) scale(0.5);
                animation: bubbleClickTinySpark 700ms ease-out forwards;
            }

            .bubble-click-hold-core {
                width: 54px;
                height: 54px;
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0.4);
                background:
                    radial-gradient(circle at 30% 24%,
                        rgba(255, 255, 255, 1) 0%,
                        rgba(255, 255, 255, 0.92) 12%,
                        rgba(115, 228, 255, 0.55) 36%,
                        rgba(155, 130, 255, 0.28) 72%,
                        rgba(255, 255, 255, 0.04) 100%
                    );
                border: 1px solid rgba(255, 255, 255, 0.78);
                box-shadow:
                    0 0 18px rgba(95, 220, 255, 0.58),
                    0 0 38px rgba(150, 140, 255, 0.3),
                    inset 0 0 18px rgba(255, 255, 255, 0.82),
                    inset -8px -10px 24px rgba(90, 160, 255, 0.18);
                animation:
                    bubbleHoldAppear 260ms ease-out forwards,
                    bubbleHoldPulse 1200ms ease-in-out infinite 260ms;
            }

            .bubble-click-hold-core::before {
                content: "";
                position: absolute;
                left: 22%;
                top: 18%;
                width: 30%;
                height: 18%;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.96);
                transform: rotate(-26deg);
            }

            .bubble-click-hold-core::after {
                content: "";
                position: absolute;
                left: 50%;
                top: 50%;
                width: 72px;
                height: 72px;
                border-radius: 50%;
                border: 1px solid rgba(115, 220, 255, 0.34);
                transform: translate(-50%, -50%);
                animation: bubbleHoldRing 1100ms ease-out infinite;
            }

            .bubble-click-big-pop {
                width: 72px;
                height: 72px;
                border-radius: 50%;
                border: 2px solid rgba(130, 228, 255, 0.76);
                transform: translate(-50%, -50%) scale(0.35);
                box-shadow:
                    0 0 24px rgba(100, 220, 255, 0.65),
                    0 0 44px rgba(170, 145, 255, 0.42),
                    inset 0 0 20px rgba(255, 255, 255, 0.7);
                animation: bubbleBigPop 760ms ease-out forwards;
            }

            @keyframes bubbleClickRipple {
                0% {
                    opacity: 0.95;
                    transform: translate(-50%, -50%) scale(0.22);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(4.4);
                }
            }

            @keyframes bubbleClickFly {
                0% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(0.18);
                    filter: blur(0);
                }
                45% {
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
                    filter: blur(0.2px);
                }
            }

            @keyframes bubbleClickFloat {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.3);
                }
                12% {
                    opacity: 0.92;
                }
                100% {
                    opacity: 0;
                    transform:
                        translate(
                            calc(-50% + var(--move-x)),
                            calc(-50% + var(--move-y))
                        )
                        scale(1.05);
                }
            }

            @keyframes bubbleClickStar {
                0% {
                    opacity: 1;
                    transform: translate(-50%, -50%) rotate(45deg) scale(0.28);
                }
                100% {
                    opacity: 0;
                    transform:
                        translate(
                            calc(-50% + var(--move-x)),
                            calc(-50% + var(--move-y))
                        )
                        rotate(190deg)
                        scale(1.1);
                }
            }

            @keyframes bubbleClickTinySpark {
                0% {
                    opacity: 0.9;
                    transform: translate(-50%, -50%) scale(0.4);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -90%) scale(1.2);
                }
            }

            @keyframes bubbleHoldAppear {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.25);
                }
                100% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            @keyframes bubbleHoldPulse {
                0%, 100% {
                    transform: translate(-50%, -50%) scale(1);
                    filter: hue-rotate(0deg);
                }
                50% {
                    transform: translate(-50%, -50%) scale(1.16);
                    filter: hue-rotate(18deg);
                }
            }

            @keyframes bubbleHoldRing {
                0% {
                    opacity: 0.7;
                    transform: translate(-50%, -50%) scale(0.55);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(1.45);
                }
            }

            @keyframes bubbleBigPop {
                0% {
                    opacity: 0.95;
                    transform: translate(-50%, -50%) scale(0.35);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(2.2);
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
