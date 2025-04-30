/*!
 * Live2D Widget
 * https://github.com/stevenjoezhang/live2d-widget
 */
(function () {
    "use strict";

    // 随机选择数组中的一个元素
    function randomSelect(arr) {
        return Array.isArray(arr) ? arr[Math.floor(Math.random() * arr.length)] : arr;
    }

    let tipTimer;

    // 显示提示消息
    function showTip(message, duration, priority) {
        if (!message || (sessionStorage.getItem("waifu-text") && sessionStorage.getItem("waifu-text") > priority)) {
            return;
        }
        if (tipTimer) {
            clearTimeout(tipTimer);
            tipTimer = null;
        }
        message = randomSelect(message);
        sessionStorage.setItem("waifu-text", priority);

        const tipElement = document.getElementById("waifu-tips");
        tipElement.innerHTML = message;
        tipElement.classList.add("waifu-tips-active");

        tipTimer = setTimeout(() => {
            sessionStorage.removeItem("waifu-text");
            tipElement.classList.remove("waifu-tips-active");
        }, duration);
    }

    // 模型类
    class Model {
        constructor(config) {
            let { apiPath, cdnPath } = config;
            let useCDN = false;

            if (typeof cdnPath === "string") {
                useCDN = true;
                if (!cdnPath.endsWith("/")) {
                    cdnPath += "/";
                }
            } else {
                if (typeof apiPath!== "string") {
                    throw "Invalid initWidget argument!";
                }
                if (!apiPath.endsWith("/")) {
                    apiPath += "/";
                }
            }
            this.useCDN = useCDN;
            this.apiPath = apiPath;
            this.cdnPath = cdnPath;
        }

        // 加载模型列表
        async loadModelList() {
            const response = await fetch(`${this.cdnPath}model_list.json`);
            this.modelList = await response.json();
        }

        // 加载指定模型和材质
        async loadModel(modelId, texturesId, message) {
            localStorage.setItem("modelId", modelId);
            localStorage.setItem("modelTexturesId", texturesId);
            showTip(message, 4000, 10);

            if (this.useCDN) {
                if (!this.modelList) {
                    await this.loadModelList();
                }
                const target = randomSelect(this.modelList.models[modelId]);
                loadlive2d("live2d", `${this.cdnPath}model/${target}/index.json`);
            } else {
                loadlive2d("live2d", `${this.apiPath}get/?id=${modelId}-${texturesId}`);
                console.log(`Live2D 模型 ${modelId}-${texturesId} 加载完成`);
            }
        }

        // 随机加载材质
        async loadRandModel() {
            const modelId = localStorage.getItem("modelId");
            const texturesId = localStorage.getItem("modelTexturesId");

            if (this.useCDN) {
                if (!this.modelList) {
                    await this.loadModelList();
                }
                const target = randomSelect(this.modelList.models[modelId]);
                loadlive2d("live2d", `${this.cdnPath}model/${target}/index.json`);
                showTip("我的新衣服好看嘛？", 4000, 10);
            } else {
                fetch(`${this.apiPath}rand_textures/?id=${modelId}-${texturesId}`)
                   .then(response => response.json())
                   .then(result => {
                        if (result.textures.id!== 1 || (texturesId!== 1 && texturesId!== 0)) {
                            this.loadModel(modelId, result.textures.id, "我的新衣服好看嘛？");
                        } else {
                            showTip("我还没有其他衣服呢！", 4000, 10);
                        }
                    });
            }
        }

        // 加载其他模型
        async loadOtherModel() {
            let modelId = localStorage.getItem("modelId");
            if (this.useCDN) {
                if (!this.modelList) {
                    await this.loadModelList();
                }
                const newModelId = ++modelId >= this.modelList.models.length? 0 : modelId;
                this.loadModel(newModelId, 0, this.modelList.messages[newModelId]);
            } else {
                fetch(`${this.apiPath}switch/?id=${modelId}`)
                   .then(response => response.json())
                   .then(result => {
                        this.loadModel(result.model.id, 0, result.model.message);
                    });
            }
        }
    }

    // 工具配置
    const tools = {
        hitokoto: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M512 240c0 114.9-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4l0 0 0 0 0 0 0 0 .3-.3c.3-.3 .7-.7 1.3-1.4c1.1-1.2 2.8-3.1 4.9-5.7c4.1-5 9.6-12.4 15.2-21.6c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208z"/></svg>',
            callback: function () {
                fetch("https://v1.hitokoto.cn")
                   .then(response => response.json())
                   .then(result => {
                        const tip = `这句一言来自 <span>「${result.from}」</span>，是 <span>${result.creator}</span> 在 hitokoto.cn 投稿的。`;
                        showTip(result.hitokoto, 6000, 9);
                        setTimeout(() => {
                            showTip(tip, 4000, 9);
                        }, 6000);
                    });
            }
        },
        asteroids: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"/></svg>',
            callback: () => {
                if (window.Asteroids) {
                    window.ASTEROIDSPLAYERS = window.ASTEROIDSPLAYERS || [];
                    window.ASTEROIDSPLAYERS.push(new Asteroids());
                } else {
                    const script = document.createElement("script");
                    script.src = "https://jsd.onmicrosoft.cn/gh/stevenjoezhang/asteroids/asteroids.js";
                    document.head.appendChild(script);
                }
            }
        },
        "switch-model": {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M399 384.2C376.9 345.8 335.4 320 288 320H224c-47.4 0-88.9 25.8-111 64.2c35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 16a72 72 0 1 0 0-144 72 72 0 1 0 0 144z"/></svg>',
            callback: () => {}
        },
        "switch-texture": {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M320 64A64 64 0 1 0 192 64a64 64 0 1 0 128 0zm-96 96c-35.3 0-64 28.7-64 64v48c0 17.7 14.3 32 32 32h1.8l11.1 99.5c1.8 16.2 15.5 28.5 31.8 28.5h38.7c16.3 0 30-12.3 31.8-28.5L318.2 304H320c17.7 0 32-14.3 32-32V224c0-35.3-28.7-64-64-64H224zM132.3 394.2c13-2.4 21.7-14.9 19.3-27.9s-14.9-21.7-27.9-19.3c-32.4 5.9-60.9 14.2-82 24.8c-10.5 5.3-20.3 11.7-27.8 19.6C6.4 399.5 0 410.5 0 424c0 21.4 15.5 36.1 29.1 45c14.7 9.6 34.3 17.3 56.4 23.4C130.2 504.7 190.4 512 256 512s125.8-7.3 170.4-19.6c22.1-6.1 41.8-13.8 56.4-23.4c13.7-8.9 29.1-23.6 29.1-45c0-13.5-6.4-24.5-14-32.6c-7.5-7.9-17.3-14.3-27.8-19.6c-21-10.6-49.5-18.9-82-24.8c-13-2.4-25.5 6.3-27.9 19.3s6.3 25.5 19.3 27.9c30.2 5.5 53.7 12.8 69 20.5c3.2 1.6 5.8 3.1 7.9 4.5c3.6 2.4 3.6 7.2 0 9.6c-8.8 5.7-23.1 11.8-43 17.3C374.3 457 318.5 464 256 464s-118.3-7-157.7-17.9c-19.9-5.5-34.2-11.6-43-17.3c-3.6-2.4-3.6-7.2 0-9.6c2.1-1.4 4.8-2.9 7.9-4.5c15.3-7.7 38.8-14.9 69-20.5z"/></svg>',
            callback: () => {}
        },
        photo: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M220.6 121.2L271.1 96 448 96v96H333.2c-21.9-15.1-48.5-24-77.2-24s-55.2 8.9-77.2 24H64V128H192c9.9 0 19.7-2.3 28.6-6.8zM0 128V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H271.1c-9.9 0-19.7 2.3-28.6 6.8L192 64H160V48c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16l0 16C28.7 64 0 92.7 0 128zM168 304a88 88 0 1 1 176 0 88 88 0 1 1 -176 0z"/></svg>',
            callback: () => {
                showTip("照好了嘛，是不是很可爱呢？", 6000, 9);
                Live2D.captureName = "photo.png";
                Live2D.captureFrame = true;
            }
        },
        info: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>',
            callback: () => {
                open("https://github.com/wuuconix/live2d-cdn");
            }
        },
        quit: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"/></svg>',
            callback: () => {
                localStorage.setItem("waifu-display", Date.now());
                showTip("愿你有一天能与重要的人重逢。", 2000, 11);
                document.getElementById("waifu").style.bottom = "-500px";
                setTimeout(() => {
                    document.getElementById("waifu").style.display = "none";
                    document.getElementById("waifu-toggle").classList.add("waifu-toggle-active");
                }, 3000);
            }
        }
    };

    // 加载小部件
    function loadWidget(config) {
        const model = new Model(config);

        // 注册事件监听器
        function registerEventListeners(data) {
            let userActivityTimer;
            let lastHoverElement;
            const defaultMessages = data.message.default;

            window.addEventListener("mousemove", () => userActivity = true);
            window.addEventListener("keydown", () => userActivity = true);

            setInterval(() => {
                if (userActivity) {
                    userActivity = false;
                    clearInterval(userActivityTimer);
                    userActivityTimer = null;
                } else if (!userActivityTimer) {
                    userActivityTimer = setInterval(() => {
                        showTip(defaultMessages, 6000, 9);
                    }, 20000);
                }
            }, 1000);

            showTip(getWelcomeMessage(data.time), 7000, 11);

            window.addEventListener("mouseover", (event) => {
                for (let { selector, text } of data.mouseover) {
                    if (event.target.closest(selector)) {
                        if (lastHoverElement === selector) {
                            return;
                        }
                        lastHoverElement = selector;
                        text = randomSelect(text);
                        text = text.replace("{text}", event.target.innerText);
                        showTip(text, 4000, 8);
                        return;
                    }
                }
            });

            window.addEventListener("click", (event) => {
                for (let { selector, text } of data.click) {
                    if (event.target.closest(selector)) {
                        text = randomSelect(text);
                        text = text.replace("{text}", event.target.innerText);
                        showTip(text, 4000, 8);
                        return;
                    }
                }
            });

            data.seasons.forEach(({ date, text }) => {
                const now = new Date();
                const startDate = date.split("-")[0];
                const endDate = date.split("-")[1] || startDate;
                const startMonth = parseInt(startDate.split("/")[0], 10);
                const startDay = parseInt(startDate.split("/")[1], 10);
                const endMonth = parseInt(endDate.split("/")[0], 10);
                const endDay = parseInt(endDate.split("/")[1], 10);

                if (startMonth <= now.getMonth() + 1 && now.getMonth() + 1 <= endMonth &&
                    startDay <= now.getDate() && now.getDate() <= endDay) {
                    text = randomSelect(text);
                    text = text.replace("{year}", now.getFullYear());
                    defaultMessages.push(text);
                }
            });

            const devtoolsFunction = () => {};
            console.log("%c", devtoolsFunction);
            devtoolsFunction.toString = () => {
                showTip(data.message.console, 6000, 9);
            };

            window.addEventListener("copy", () => {
                showTip(data.message.copy, 6000, 9);
            });

            window.addEventListener("visibilitychange", () => {
                if (!document.hidden) {
                    showTip(data.message.visibilitychange, 6000, 9);
                }
            });
        }

        // 获取欢迎消息
        function getWelcomeMessage(time) {
            if (location.pathname === "/") {
                for (let { hour, text } of time) {
                    const now = new Date();
                    const startHour = parseInt(hour.split("-")[0], 10);
                    const endHour = parseInt(hour.split("-")[1] || hour, 10);
                    if (startHour <= now.getHours() && now.getHours() <= endHour) {
                        return text;
                    }
                }
            }
            const title = document.title.split(" - ")[0];
            const welcomeText = `欢迎阅读<span>「${title}」</span>`;
            if (document.referrer!== "") {
                const referrer = new URL(document.referrer);
                const domain = referrer.hostname.split(".")[1];
                const domainMap = {
                    baidu: "百度",
                    so: "360搜索",
                    google: "谷歌搜索"
                };
                if (location.hostname === referrer.hostname) {
                    return welcomeText;
                }
                const from = domain in domainMap? domainMap[domain] : referrer.hostname;
                return `Hello！来自 <span>${from}</span> 的朋友<br>${welcomeText}`;
            }
            return welcomeText;
        }

        localStorage.removeItem("waifu-display");
        sessionStorage.removeItem("waifu-text");
        document.body.insertAdjacentHTML("beforeend", `
            <div id="waifu">
                <div id="waifu-tips"></div>
                <canvas id="live2d" width="800" height="800"></canvas>
                <div id="waifu-tool"></div>
            </div>
        `);

        setTimeout(() => {
            document.getElementById("waifu").style.bottom = 0;
        }, 0);

        // 注册工具按钮
        function registerTools() {
            tools["switch-model"].callback = () => model.loadOtherModel();
            tools["switch-texture"].callback = () => model.loadRandModel();
            if (!Array.isArray(config.tools)) {
                config.tools = Object.keys(tools);
            }
            for (let tool of config.tools) {
                if (tools[tool]) {
                    const { icon, callback } = tools[tool];
                    document.getElementById("waifu-tool").insertAdjacentHTML("beforeend", `<span id="waifu-tool-${tool}">${icon}</span>`);
                    document.getElementById(`waifu-tool-${tool}`).addEventListener("click", callback);
                }
            }
        }
        registerTools();

        // 初始化模型
        function initModel() {
            let modelId = localStorage.getItem("modelId");
            let texturesId = localStorage.getItem("modelTexturesId");
            if (modelId === null) {
                modelId = 0;
                texturesId = 53;
            }
            model.loadModel(modelId, texturesId);
            fetch(config.waifuPath)
               .then(response => response.json())
               .then(registerEventListeners);
        }
        initModel();
    }

    // 初始化小部件
    window.initWidget = function (config, apiPath) {
        if (typeof config === "string") {
            config = {
                waifuPath: config,
                apiPath: apiPath
            };
        }
        document.body.insertAdjacentHTML("beforeend", `
            <div id="waifu-toggle">
                <span>看板娘</span>
            </div>
        `);
        const toggle = document.getElementById("waifu-toggle");
        toggle.addEventListener("click", () => {
            toggle.classList.remove("waifu-toggle-active");
            if (toggle.getAttribute("first-time")) {
                loadWidget(config);
                toggle.removeAttribute("first-time");
            } else {
                localStorage.removeItem("waifu-display");
                document.getElementById("waifu").style.display = "";
                setTimeout(() => {
                    document.getElementById("waifu").style.bottom = 0;
                }, 0);
            }
        });
        if (localStorage.getItem("waifu-display") && Date.now() - parseInt(localStorage.getItem("waifu-display"), 10) <= 86400000) {
            toggle.setAttribute("first-time", "true");
            setTimeout(() => {
                toggle.classList.add("waifu-toggle-active");
            }, 0);
        } else {
            loadWidget(config);
        }
    };
})();
