/*!
 * Live2D Widget
 * https://github.com/linji1/live2d
 */
!(function () {
    'use strict';

    function getRandomItem(arr) {
        return Array.isArray(arr) ? arr[Math.floor(Math.random() * arr.length)] : arr;
    }

    let timeoutId;

    function showTip(tips, duration, priority) {
        if (!tips || (sessionStorage.getItem('waifu-text') && sessionStorage.getItem('waifu-text') > priority)) return;
        
        clearTimeout(timeoutId);
        timeoutId = null;
        
        const tipElement = document.getElementById('waifu-tips');
        tipElement.innerHTML = getRandomItem(tips);
        tipElement.classList.add('waifu-tips-active');
        
        sessionStorage.setItem('waifu-text', priority);
        timeoutId = setTimeout(() => {
            sessionStorage.removeItem('waifu-text');
            tipElement.classList.remove('waifu-tips-active');
        }, duration);
    }

    class Live2DWidget {
        constructor(options) {
            const { apiPath, cdnPath } = options;
            this.useCDN = typeof cdnPath === 'string';
            this.apiPath = this.useCDN ? '' : (typeof apiPath === 'string' ? (apiPath.endsWith('/') ? apiPath : `${apiPath}/`) : '');
            this.cdnPath = this.useCDN ? (cdnPath.endsWith('/') ? cdnPath : `${cdnPath}/`) : '';
            this.modelList = null;
        }

        async loadModelList() {
            const response = await fetch(`${this.cdnPath}model_list.json`);
            this.modelList = await response.json();
        }

        async loadModel(modelId, textureId, tip) {
            localStorage.setItem('modelId', modelId);
            localStorage.setItem('modelTexturesId', textureId);
            
            showTip(tip, 4000, 10);
            
            if (this.useCDN) {
                if (!this.modelList) await this.loadModelList();
                const modelConfig = getRandomItem(this.modelList.models[modelId]);
                loadlive2d('live2d', `${this.cdnPath}model/${modelConfig}/index.json`);
            } else {
                loadlive2d('live2d', `${this.apiPath}get/?id=${modelId}-${textureId}`);
                console.log(`Live2D 模型 ${modelId}-${textureId} 加载完成`);
            }
        }

        async loadRandModel() {
            const currentModelId = localStorage.getItem('modelId');
            const currentTextureId = localStorage.getItem('modelTexturesId');
            
            if (this.useCDN) {
                if (!this.modelList) await this.loadModelList();
                const modelConfig = getRandomItem(this.modelList.models[currentModelId]);
                this.loadModel(currentModelId, 0, '我这新衣服一上身，活力直接拉满，你觉得咋样？');
            } else {
                await fetch(`${this.apiPath}rand_textures/?id=${currentModelId}-${currentTextureId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.textures.id !== 1 || (currentTextureId !== '1' && currentTextureId !== '0')) {
                            this.loadModel(currentModelId, data.textures.id, '我这新衣服一上身，活力直接拉满，你觉得咋样？');
                        } else {
                            showTip('哟呵，我这 “衣库” 比我的钱包还干净，没别的衣服咯！', 4000, 10);
                        }
                    });
            }
        }

        async loadOtherModel() {
            let currentModelId = parseInt(localStorage.getItem('modelId'), 10) || 0;
            
            if (this.useCDN) {
                if (!this.modelList) await this.loadModelList();
                currentModelId = (currentModelId + 1) % this.modelList.models.length;
                this.loadModel(currentModelId, 0, this.modelList.messages[currentModelId]);
            } else {
                await fetch(`${this.apiPath}switch/?id=${currentModelId}`)
                    .then(response => response.json())
                    .then(data => this.loadModel(data.model.id, 0, data.model.message));
            }
        }
    }

    const tools = {
        hitokoto: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">...</svg>',
            callback: function () {
                fetch('https://v1.hitokoto.cn')
                    .then(response => response.json())
                    .then(data => {
                        showTip(data.hitokoto, 6000, 9);
                        setTimeout(() => showTip('哇塞！刚刚这句诗词就像个小惊喜，蹦进了你的世界，有没有被它的魅力迷倒呀？', 4000, 9), 6000);
                    });
            }
        },
        asteroids: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">...</svg>',
            callback: () => {
                if (window.Asteroids) {
                    window.ASTEROIDSPLAYERS = window.ASTEROIDSPLAYERS || [];
                    window.ASTEROIDSPLAYERS.push(new Asteroids());
                } else {
                    const script = document.createElement('script');
                    script.src = 'https://jsd.onmicrosoft.cn/gh/stevenjoezhang/asteroids/asteroids.js';
                    document.head.appendChild(script);
                }
            }
        },
        'switch-model': { icon: '...', callback: () => {} },
        'switch-texture': { icon: '...', callback: () => {} },
        photo: {
            icon: '<svg ... </svg>',
            callback: () => {
                showTip('咔嚓！这张照片里的我简直萌翻啦，你觉得呢？', 6000, 9);
                Live2D.captureName = 'photo.png';
                Live2D.captureFrame = true;
            }
        },
        info: {
            icon: '<svg ... </svg>',
            callback: () => open('https://github.com/wuuconix/live2d-cdn')
        },
        quit: {
            icon: '<svg ... </svg>',
            callback: () => {
                localStorage.setItem('waifu-display', Date.now());
                showTip('生活偶尔会有离别，但一定会安排你们再次相遇，愿那份久别重逢的喜悦，治愈所有等待。', 2000, 11);
                document.getElementById('waifu').style.bottom = '-500px';
                setTimeout(() => {
                    document.getElementById('waifu').style.display = 'none';
                    document.getElementById('waifu-toggle').classList.add('waifu-toggle-active');
                }, 3000);
            }
        }
    };

    function initializeWidget(config) {
        const widget = new Live2DWidget(config);

        function setupInteractions() {
            let isActive = false;
            const defaultTips = config.message.default;
            
            window.addEventListener('mousemove', () => (isActive = true));
            window.addEventListener('keydown', () => (isActive = true));
            
            let intervalId;
            setInterval(() => {
                if (isActive) {
                    isActive = false;
                    clearInterval(intervalId);
                    intervalId = null;
                } else if (!intervalId) {
                    intervalId = setInterval(() => showTip(defaultTips, 6000, 9), 20000);
                }
            }, 1000);

            showTip(
                config.time.map(({ hour, text }) => {
                    const now = new Date();
                    const [start, end] = hour.split('-').map(h => h.split(':').map(Number));
                    const currentHour = now.getHours();
                    if (start[0] <= currentHour && currentHour <= (end[0] || start[0])) return text;
                }) || `以文字为舟,欢迎阅读<span>「${document.title.split(' - ')[0]}」</span>`,
                7000,
                11
            );

            window.addEventListener('mouseover', event => {
                config.mouseover.forEach(({ selector, text }) => {
                    if (event.target.closest(selector)) {
                        showTip(text.map(t => t.replace('{text}', event.target.innerText)) || text, 4000, 8);
                    }
                });
            });

            window.addEventListener('click', event => {
                config.click.forEach(({ selector, text }) => {
                    if (event.target.closest(selector)) {
                        showTip(text.map(t => t.replace('{text}', event.target.innerText)) || text, 4000, 8);
                    }
                });
            });
        }

        localStorage.removeItem('waifu-display');
        sessionStorage.removeItem('waifu-text');
        
        document.body.insertAdjacentHTML('beforeend', `
            <div id="waifu">
                <div id="waifu-tips"></div>
                <canvas id="live2d" width="800" height="800"></canvas>
                <div id="waifu-tool"></div>
            </div>
        `);

        setTimeout(() => document.getElementById('waifu').style.bottom = 0, 0);

        (function setupTools() {
            tools['switch-model'].callback = () => widget.loadOtherModel();
            tools['switch-texture'].callback = () => widget.loadRandModel();
            const enabledTools = Array.isArray(config.tools) ? config.tools : Object.keys(tools);
            
            enabledTools.forEach(toolName => {
                const tool = tools[toolName];
                if (tool) {
                    const toolElement = document.createElement('span');
                    toolElement.id = `waifu-tool-${toolName}`;
                    toolElement.innerHTML = tool.icon;
                    toolElement.addEventListener('click', tool.callback);
                    document.getElementById('waifu-tool').appendChild(toolElement);
                }
            });
        })();

        (async function loadInitialModel() {
            let modelId = localStorage.getItem('modelId');
            let textureId = localStorage.getItem('modelTexturesId');
            
            if (modelId === null) {
                await widget.loadModelList();
                modelId = Math.floor(Math.random() * widget.modelList.models.length);
                textureId = 0;
            }
            
            widget.loadModel(modelId, textureId);
            fetch(config.waifuPath).then(response => response.json()).then(setupInteractions);
        })();
    }

    window.initWidget = function (config, apiPath) {
        if (typeof config === 'string') {
            config = { waifuPath: config, apiPath: apiPath || '' };
        }

        document.body.insertAdjacentHTML('beforeend', `
            <div id="waifu-toggle">
                <span>看板娘</span>
            </div>
        `);

        const toggleButton = document.getElementById('waifu-toggle');
        toggleButton.addEventListener('click', function () {
            this.classList.remove('waifu-toggle-active');
            
            if (this.hasAttribute('first-time')) {
                initializeWidget(config);
                this.removeAttribute('first-time');
            } else {
                localStorage.removeItem('waifu-display');
                document.getElementById('waifu').style.display = '';
                setTimeout(() => document.getElementById('waifu').style.bottom = 0, 0);
            }
        });

        const lastDisplay = localStorage.getItem('waifu-display');
        if (lastDisplay && Date.now() - parseInt(lastDisplay, 10) <= 86400000) {
            toggleButton.setAttribute('first-time', true);
            setTimeout(() => toggleButton.classList.add('waifu-toggle-active'), 0);
        } else {
            initializeWidget(config);
        }
    };
})();
