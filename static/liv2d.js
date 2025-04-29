        // 检查全局标志位，避免重复加载
        if (!window.live2DScriptLoaded) {
            if (window.innerWidth >= 1250) {
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = 'https://fastly.jsdelivr.net/gh/fox0666/live2d-widget@latest/autoload.js';
                document.body.appendChild(script);
            }
            // 设置全局标志位，表示脚本已加载
            window.live2DScriptLoaded = true;
        }
    