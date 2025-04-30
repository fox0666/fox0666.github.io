/*!
 * Live2D Widget
 * https://github.com/linji1/live2d
 */ !(function () {
    'use strict';
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
        // ...（其余类定义代码不变）...

        async loadRandModel() {
            const t = localStorage.getItem('modelId'),
                s = localStorage.getItem('modelTexturesId');
            if (this.useCDN) {
                this.modelList || (await this.loadModelList());
                const s = e(this.modelList.models[t]);
                loadlive2d('live2d', `${this.cdnPath}model/${s}/index.json`), o('换上新衣裳啦，你觉得这件怎么样呀？', 4e3, 10);
            } else
                fetch(`${this.apiPath}rand_textures/?id=${t}-${s}`)
                    .then(e => e.json())
                    .then(e => {
                        1 !== e.textures.id || (1 !== s && 0 !== s) ? this.loadModel(t, e.textures.id, '新裙子的裙摆会跟着风摆动哦~') : o('目前只有这一身穿搭呢，期待更多漂亮衣服呀！', 4e3, 10);
                    });
        }

        // ...（其余方法代码不变）...
    }

    const n = {
        hitokoto: {
            // ...（其余属性不变）...
            callback: function () {
                fetch('https://v1.hitokoto.cn')
                    .then(e => e.json())
                    .then(e => {
                        const t = `这句温暖的话来自 <span>「${e.from}」</span>，是 <span>${e.creator}</span> 的心意呢~`;
                        o(`${e.hitokoto} ✨`, 6e3, 9),
                            setTimeout(() => {
                                o(t, 4e3, 9);
                            }, 6e3);
                    });
            }
        },
        photo: {
            // ...（其余属性不变）...
            callback: () => {
                o('咔嚓~ 这张要珍藏起来哦，人家超上镜的呢！', 6e3, 9), (Live2D.captureName = 'photo.png'), (Live2D.captureFrame = !0);
            }
        },
        quit: {
            // ...（其余属性不变）...
            callback: () => {
                localStorage.setItem('waifu-display', Date.now()),
                    o('要暂时说再见啦，愿我们下次相遇时阳光正好~', 2e3, 11),
                    (document.getElementById('waifu').style.bottom = '-500px'),
                    setTimeout(() => {
                        (document.getElementById('waifu').style.display = 'none'), document.getElementById('waifu-toggle').classList.add('waifu-toggle-active');
                    }, 3e3);
            }
        }
        // ...（其他工具按钮回调保持原有结构，文本优化如下）...
    };

    function i(t) {
        // ...（初始化代码不变）...
                o(
                    (function (e) {
                        if ('/' === location.pathname)
                            for (let { hour: t, text: o } of e) {
                                const e = new Date(),
                                    s = t.split('-')[0],
                                    n = t.split('-')[1] || s;
                                if (s <= e.getHours() && e.getHours() <= n) return o;
                            }
                        const welcomeText = `欢迎来到「<span>${document.title.split(' - ')[0]}</span>」，今天也要元气满满哦！`;
                        let o;
                        if ('' !== document.referrer) {
                            const e = new URL(document.referrer),
                                s = e.hostname.split('.')[1],
                                n = { baidu: '百度', so: '360搜索', google: '谷歌搜索' };
                            return location.hostname === e.hostname ? welcomeText : `你好呀！发现来自 <span>${s in n ? n[s] : e.hostname}</span> 的朋友~<br>${welcomeText}`;
                        }
                        return welcomeText;
                    })(t.time),
                    7e3,
                    11
                ),
        // ...（鼠标事件代码不变）...
                        n.split('/')[1] <= s.getDate() &&
                        s.getDate() <= i.split('/')[1] &&
                        ((o = (o = e(o)).replace('{year}', s.getFullYear())), c.push(`✨ ${o} ~`));
        // ...（其余初始化代码不变）...
    }

    // ...（窗口初始化代码不变）...
})();
