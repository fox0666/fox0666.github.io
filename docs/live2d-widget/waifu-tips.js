/*!
 * Live2D Widget
 * https://github.com/stevenjoezhang/live2d-widget
 */
var live2d_widget = function () {
    "use strict";
    function e(e) {
        return Array.isArray(e) ? e[Math.floor(Math.random() * e.length)] : e;
    }
    let t;
    function o(o, s, n) {
        if (!o || (sessionStorage.getItem('waifu-text') && sessionStorage.getItem('waifu-text') > n)) return;
        t && (clearTimeout(t), (t = null)), (o = e(o)), sessionStorage.setItem('waifu-text', n);
        const i = document.getElementById('waifu-tips');
        (i.innerHTML = o),
            i.classList.add('waifu-tips-active'),
            (t = setTimeout(() => {
                sessionStorage.removeItem('waifu-text'), i.classList.remove('waifu-tips-active');
            }, s));
    }
    class s {
        constructor(e) {
            let { apiPath: t, cdnPath: o } = e,
                useCDN = false;
            if ('string' == typeof o) (useCDN = true), o.endsWith('/') || (o += '/');
            else {
                if ('string' != typeof t) throw 'Invalid initWidget argument!';
                t.endsWith('/') || (t += '/');
            }
            this.useCDN = useCDN, this.apiPath = t, this.cdnPath = o;
        }
        async loadModelList() {
            const e = await fetch(`${this.cdnPath}model_list.json`);
            this.modelList = await e.json();
        }
        async loadModel(t, s, n) {
            localStorage.setItem('modelId', t), localStorage.setItem('modelTexturesId', s);
            o(n, 4e3, 10);
            if (this.useCDN) {
                if (!this.modelList) await this.loadModelList();
                const modelName = e(this.modelList.models[t]);
                loadlive2d('live2d', `${this.cdnPath}model/${modelName}/index.json`);
            } else {
                loadlive2d('live2d', `${this.apiPath}get/?id=${t}-${s}`);
                console.log(`Live2D 模型 ${t}-${s} 加载完成`);
            }
        }
        async loadRandModel() {
            const modelId = localStorage.getItem('modelId'),
                texturesId = localStorage.getItem('modelTexturesId');
            if (this.useCDN) {
                if (!this.modelList) await this.loadModelList();
                const modelName = e(this.modelList.models[modelId]);
                loadlive2d('live2d', `${this.cdnPath}model/${modelName}/index.json`);
                o('新衣服有没有让我更可爱呀～', 4e3, 10);
            } else {
                fetch(`${this.apiPath}rand_textures/?id=${modelId}-${texturesId}`)
                   .then(e => e.json())
                   .then(e => {
                        if (e.textures.id !== 1 || (texturesId !== '1' && texturesId !== '0')) {
                            this.loadModel(modelId, e.textures.id, '新衣服有没有让我更可爱呀～');
                        } else {
                            o('目前只有这一套衣服啦，下次给我换套新的吧～', 4e3, 10);
                        }
                    });
            }
        }
        async loadOtherModel() {
            let modelId = localStorage.getItem('modelId');
            if (this.useCDN) {
                if (!this.modelList) await this.loadModelList();
                const nextModelId = ++modelId >= this.modelList.models.length ? 0 : modelId;
                this.loadModel(nextModelId, 0, this.modelList.messages[nextModelId]);
            } else {
                fetch(`${this.apiPath}switch/?id=${modelId}`)
                   .then(e => e.json())
                   .then(e => {
                        this.loadModel(e.model.id, 0, e.model.message);
                    });
            }
        }
    }
    const n = {
        hitokoto: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M512 240c0 114.9-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4c0 0 0 0 0 0s0 0 0 0s0 0 0 0c0 0 0 0 0 0l.3-.3c.3-.3 .7-.7 1.3-1.4c1.1-1.2 2.8-3.1 4.9-5.7c4.1-5 9.6-12.4 15.2-21.6c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208z"/></svg>',
            callback: function () {
                fetch('https://v1.hitokoto.cn')
                   .then(e => e.json())
                   .then(e => {
                        const t = `这句一言来自 <span>「${e.from}」</span>，是 <span>${e.creator}</span> 在 hitokoto.cn 投稿的。`;
                        o(e.hitokoto, 6e3, 9);
                        setTimeout(() => {
                            o(t, 4e3, 9);
                        }, 6e3);
                    });
            }
        },
        asteroids: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"/></svg>',
            callback: () => {
                if (window.Asteroids) window.ASTEROIDSPLAYERS || (window.ASTEROIDSPLAYERS = []), window.ASTEROIDSPLAYERS.push(new Asteroids());
                else {
                    const e = document.createElement('script');
                    e.src = 'https://fastly.jsdelivr.net/gh/stevenjoezhang/asteroids/asteroids.js';
                    document.head.appendChild(e);
                }
            }
        },
        'switch-model': {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M399 384.2C376.9 345.8 335.4 320 288 320l-64 0c-47.4 0-88.9 25.8-111 64.2c35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 16a72 72 0 1 0 0-144 72 72 0 1 0 0 144z"/></svg>',
            callback: () => {}
        },
        'switch-texture': {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M320 64A64 64 0 1 0 192 64a64 64 0 1 0 128 0zm-96 96c-35.3 0-64 28.7-64 64l0 48c0 17.7 14.3 32 32 32l1.8 0 11.1 99.5c1.8 16.2 15.5 28.5 31.8 28.5l38.7 0c16.3 0 30-12.3 31.8-28.5L318.2 304l1.8 0c17.7 0 32-14.3 32-32l0-48c0-35.3-28.7-64-64-64l-64 0zM132.3 394.2c13-2.4 21.7-14.9 19.3-27.9s-14.9-21.7-27.9-19.3c-32.4 5.9-60.9 14.2-82 24.8c-10.5 5.3-20.3 11.7-27.8 19.6C6.4 399.5 0 410.5 0 424c0 21.4 15.5 36.1 29.1 45c14.7 9.6 34.3 17.3 56.4 23.4C130.2 504.7 190.4 512 256 512s125.8-7.3 170.4-19.6c22.1-6.1 41.8-13.8 56.4-23.4c13.7-8.9 29.1-23.6 29.1-45c0-13.5-6.4-24.5-14-32.6c-7.5-7.9-17.3-14.3-27.8-19.6c-21-10.6-49.5-18.9-82-24.8c-13-2.4-25.5 6.3-27.9 19.3s6.3 25.5 19.3 27.9c30.2 5.5 53.7 12.8 69 20.5c3.2 1.6 5.8 3.1 7.9 4.5c3.6 2.4 3.6 7.2 0 9.6c-8.8 5.7-23.1 11.8-43 17.3C374.3 457 318.5 464 256 464s-118.3-7-157.7-17.9c-19.9-5.5-34.2-11.6-43-17.3c-3.6-2.4-3.6-7.2 0-9.6c2.1-1.4 4.8-2.9 7.9-4.5c15.3-7.7 38.8-14.9 69-20.5z"/></svg>',
            callback: () => {}
        },
        photo: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M220.6 121.2L271.1 96 448 96l0 96-114.8 0c-21.9-15.1-48.5-24-77.2-24s-55.2 8.9-77.2 24L64 192l0-64 128 0c9.9 0 19.7-2.3 28.6-6.8zM0 128L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L271.1 32c-9.9 0-19.7 2.3-28.6 6.8L192 64l-32 0 0-16c0-8.8-7.2-16-16-16L80 32c-8.8 0-16 7.2-16 16l0 16C28.7 64 0 92.7 0 128zM168 304a88 88 0 1 1 176 0 88 88 0 1 1 -176 0z"/></svg>',
            callback: () => {
                o('咔嚓！这张照片一定超萌，快保存下来吧～', 6e3, 9);
                Live2D.captureName = 'photo.png';
                Live2D.captureFrame = true;
            }
        },
        info: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>',
            callback: () => {
                open('https://github.com/stevenjoezhang/live2d-widget');
            }
        },
        quit: {
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>',
            callback: () => {
                localStorage.setItem('waifu-display', Date.now().toString());
                o('下次再见呀，记得想我哦～', 2e3, 11);
                const e = document.getElementById('waifu');
                if (e) {
                    e.style.bottom = '-500px';
                    setTimeout(() => {
                        e.style.display = 'none';
                        const t = document.getElementById('waifu-toggle');
                        if (t) t.classList.add('waifu-toggle-active');
                    }, 3e3);
                }
            }
        }
    };
    function i(t) {
        const instance = new s(t);
        function c(t) {
            let s,
                n,
                i = false,
                c = t.message.default;
            window.addEventListener('mousemove', () => (i = true));
            window.addEventListener('keydown', () => (i = true));
            setInterval(() => {
                i
                   ? ((i = false), clearInterval(s), (s = null))
                    : s ||
                      (s = setInterval(() => {
                            o(c, 6e3, 9);
                        }, 2e4));
            }, 1e3);
            o(
                (function (e) {
                    if ('/' === location.pathname)
                        for (let { hour: t, text: o } of e) {
                            const e = new Date(),
                                s = t.split('-')[0],
                                n = t.split('-')[1] || s;
                            if (s <= e.getHours() && e.getHours() <= n) return o;
                        }
                    const t = `欢迎来到「${document.title.split(' - ')[0]}」！今天也要元气满满呀～`;
                    let o;
                    if ('' !== document.referrer) {
                        const e = new URL(document.referrer),
                            s = e.hostname.split('.')[1],
                            n = { baidu: '百度', so: '360搜索', google: '谷歌搜索' };
                        return location.hostname === e.hostname ? t : ((o = s in n ? n[s] : e.hostname), `Hello！来自 <span>${o}</span> 的朋友<br>${t}`);
                    }
                    return t;
                })(t.time),
                7e3, 11
            );
            window.addEventListener('mouseover', s => {
                for (let { selector: i, text: c } of t.mouseover)
                    if (s.target.closest(i)) {
                        if (n === i) return;
                        return (n = i), (c = e(c)), (c = c.replace('{text}', s.target.innerText)), void o(c, 4e3, 8);
                    }
            });
            window.addEventListener('click', s => {
                for (let { selector: n, text: i } of t.click) if (s.target.closest(n)) return (i = e(i)), (i = i.replace('{text}', s.target.innerText)), void o(i, 4e3, 8);
            });
            t.seasons.forEach(({ date: t, text: o }) => {
                const s = new Date(),
                    n = t.split('-')[0],
                    i = t.split('-')[1] || n;
                n.split('/')[0] <= s.getMonth() + 1 &&
                    s.getMonth() + 1 <= i.split('/')[0] &&
                    n.split('/')[1] <= s.getDate() &&
                    s.getDate() <= i.split('/')[1] &&
                    ((o = (o = e(o)).replace('{year}', s.getFullYear())), c.push(o));
            });
            const a = () => {};
            console.log('%c', a);
            a.toString = () => {
                o(t.message.console, 6e3, 9);
            };
            window.addEventListener('copy', () => {
                o(t.message.copy, 6e3, 9);
            });
            window.addEventListener('visibilitychange', () => {
                document.hidden || o(t.message.visibilitychange, 6e3, 9);
            });
        }
        localStorage.removeItem('waifu-display');
        sessionStorage.removeItem('waifu-text');
        document.body.insertAdjacentHTML(
            'beforeend',
            '<div id="waifu">\n            <div id="waifu-tips"></div>\n            <canvas id="live2d" width="800" height="800"></canvas>\n            <div id="waifu-tool"></div>\n        </div>'
        );
        setTimeout(() => {
            document.getElementById('waifu').style.bottom = 0;
        }, 0);
        (function () {
            n['switch-model'].callback = () => instance.loadOtherModel();
            n['switch-texture'].callback = () => instance.loadRandModel();
            Array.isArray(t.tools) || (t.tools = Object.keys(n));
            for (let e of t.tools)
                if (n[e]) {
                    const { icon: t, callback: o } = n[e];
                    document.getElementById('waifu-tool').insertAdjacentHTML('beforeend', `<span id="waifu-tool-${e}">${t}</span>`);
                    document.getElementById(`waifu-tool-${e}`).addEventListener('click', o);
                }
        })();
        let modelId = localStorage.getItem('modelId'),
            texturesId = localStorage.getItem('modelTexturesId');
        null === modelId && ((modelId = 0), (texturesId = 53));
        instance.loadModel(modelId, texturesId, '');
        fetch(t.waifuPath)
           .then(e => e.json())
           .then(c);
    }
    window.initWidget = function (e, t) {
        'string' == typeof e && (e = { waifuPath: e, apiPath: t });
        document.body.insertAdjacentHTML('beforeend', '<div id="waifu-toggle">\n       <span>看板娘</span>\n     </div>');
        const o = document.getElementById('waifu-toggle');
        if (o) {
            o.addEventListener('click', () => {
                o.classList.remove('waifu-toggle-active');
                if (o.getAttribute('first-time')) {
                    i(e);
                    o.removeAttribute('first-time');
                } else {
                    localStorage.removeItem('waifu-display');
                    document.getElementById('waifu').style.display = '';
                    setTimeout(() => {
                        document.getElementById('waifu').style.bottom = 0;
                    }, 0);
                }
            });
        }
        if (localStorage.getItem('waifu-display') && Date.now() - Number(localStorage.getItem('waifu-display')) <= 864e5) {
            if (o) {
                o.setAttribute('first-time', 'true');
                setTimeout(() => {
                    if (o) o.classList.add('waifu-toggle-active');
                }, 0);
            }
        } else {
            i(e);
        }
    };
}();    
