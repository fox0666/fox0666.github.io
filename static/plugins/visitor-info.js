/**
 * 访客信息显示模块（桌面左上角自动隐藏 + 鼠标悬停显示）
 */
window.VisitorInfoAutoHideDelay = 3600; // 默认隐藏延迟时间（毫秒）
window.VisitorInfoHoverArea = 60; // 鼠标悬停触发区域大小（px）

function countryCodeToFlagEmoji(code) {
    if (!code || code.length !== 2) return "";
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 0x1f1a5));
}

function getOS() {
    const ua = navigator.userAgent;
    const map = [
        { r: /Windows NT 10\.0/, n: "Windows 10/11" },
        { r: /Windows NT 6\.3/, n: "Windows 8.1" },
        { r: /Windows NT 6\.2/, n: "Windows 8" },
        { r: /Windows NT 6\.1/, n: "Windows 7" },
        { r: /Mac OS X/, n: "macOS" },
        { r: /Android/, n: "Android" },
        { r: /iPhone|iPad|iPod/, n: "iOS" },
        { r: /Linux/, n: "Linux" }
    ];
    let os = map.find(({ r }) => r.test(ua))?.n || "Unknown OS";
    let bit = "";
    if (os.startsWith("Windows")) bit = /WOW64|Win64/.test(ua) ? "64-bit" : "32-bit";
    if (os === "macOS") bit = /MacIntel/.test(ua) ? "64-bit" : "32-bit";
    return `${os} ${bit}`.trim();
}

function getBrowser() {
    const ua = navigator.userAgent;
    const map = [
        { r: /Edg\/([\d.]+)/, n: "Edge" },
        { r: /OPR\/([\d.]+)/, n: "Opera" },
        { r: /Chrome\/([\d.]+)/, n: "Chrome", e: /Edg|OPR/ },
        { r: /Firefox\/([\d.]+)/, n: "Firefox" },
        { r: /Version\/([\d.]+).*Safari/, n: "Safari" }
    ];
    for (const { r, n, e } of map) {
        if (e?.test(ua)) continue;
        const m = ua.match(r);
        if (m) return `${n} ${m[1]}`;
    }
    return "Unknown Browser";
}

function getCurrentDate() {
    return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
}

function initVisitorInfo() {
    const ipinfoPromise = fetch("https://ipinfo.io/json/").then(r => r.json()).catch(() => ({}));
    const ipapiPromise = fetch("https://ipapi.co/json/").then(r => r.json()).catch(() => ({}));

    Promise.all([ipinfoPromise, ipapiPromise]).then(([ipinfo, ipapi]) => {
        const data = { ...ipapi, ...ipinfo };
        displayVisitorInfo(data);
    }).catch(() => displayVisitorInfo({}));

    function displayVisitorInfo(data) {
        const container = document.createElement("div");
        document.body.appendChild(container);

        // 容器样式 (修改为左上角)
        Object.assign(container.style, {
            position: "fixed",
            top: "20px",
            left: "20px", // Changed from right to left
            zIndex: "1000",
            padding: "10px",
            borderRadius: "5px",
            fontSize: "14px",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            display: "block",
            transition: "opacity 0.3s ease",
            pointerEvents: "auto" // Initially allow clicks
        });

        // 信息内容
        const flag = countryCodeToFlagEmoji(data.country || "");
        let countryFull = "";
        if (data.country) {
            try {
                countryFull = new Intl.DisplayNames(["en"], { type: "region" }).of(data.country);
            } catch {
                countryFull = data.country;
            }
        }
        const asnInfo = data.asn || data.org || "N/A";
        const infoContent = [
            { name: "Country", value: `${flag} ${countryFull} ${data.region || ""} ${data.city || ""}`.trim(), icon: "icon-earth-full" },
            { name: "Date", value: getCurrentDate(), icon: "icon-calendar-days" },
            { name: "IP Info", value: data.ip || "Unknown", icon: "icon-location-dot" },
            { name: "ASN", value: asnInfo, icon: "icon-shenfengzheng" },
            { name: "System", value: getOS(), icon: "icon-hollow-computer" },
            { name: "Browser", value: getBrowser(), icon: "icon-guge" }
        ];

        container.innerHTML = infoContent.map(item =>
            `<div style="display:flex;align-items:center;margin-bottom:2px;">
                <i class="iconfont ${item.icon}" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;"></i>
                <span style="font-weight:bold;margin-left:4px;">${item.name}:&nbsp;</span>
                <span>${item.value}</span>
            </div>`
        ).join("");

        // 主题适配 (修改背景色和文字颜色)
        const updateTheme = () => {
            const theme = document.documentElement.getAttribute("data-theme");
            const isDark = theme === "dark" || document.documentElement.classList.contains("dark") || (!theme && theme !== "light") && window.matchMedia("(prefers-color-scheme: dark)").matches;
            
            Object.assign(container.style, {
                backgroundColor: isDark ? "rgba(235, 255, 235, 0.5)" : "rgba(245, 255, 245, 0.5)",
                color: "#333" // Use dark text for both themes for better readability
            });
            container.querySelectorAll("i.iconfont").forEach(icon => {
                icon.style.color = "#242c36"; // Use dark icon color for both themes
            });
        };

        updateTheme();
        document.documentElement.addEventListener("themechange", updateTheme);
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateTheme);

        if (window.innerWidth > 768) {
            // 桌面端自动隐藏
            let hidden = false;
            const hideTimeout = () => {
                container.style.opacity = "0";
                container.style.pointerEvents = "none"; // Make it non-interactive
                hidden = true;
            };
            let timeoutId = setTimeout(hideTimeout, window.VisitorInfoAutoHideDelay || 3600);

            // 鼠标悬停显示 (修改为左上角区域)
            document.addEventListener("mousemove", (e) => {
                if (hidden && e.clientX < window.VisitorInfoHoverArea && e.clientY < window.VisitorInfoHoverArea) {
                    clearTimeout(timeoutId); // Clear previous hide timer
                    container.style.opacity = "1";
                    container.style.pointerEvents = "auto"; // Make it interactive again
                    hidden = false;
                    timeoutId = setTimeout(hideTimeout, window.VisitorInfoAutoHideDelay || 3600);
                }
            });

        } else {
            // 移动端底部弹出 (保持原逻辑, 但应用新颜色)
            Object.assign(container.style, { position: "fixed", left: "0", bottom: "0", width: "100%", borderRadius: "5px 5px 0 0" });
            setTimeout(() => {
                container.style.opacity = "0";
                container.style.transform = "translateY(100%)";
                setTimeout(() => {
                    Object.assign(container.style, { position: "absolute", display: "none", opacity: "1", transform: "translateY(0)" });
                    container.style.bottom = "";
                    window.addEventListener("scroll", () => {
                        container.style.display = window.scrollY + window.innerHeight >= document.body.scrollHeight ? "block" : "none";
                    });
                }, 500);
            }, window.VisitorInfoAutoHideDelay || 2000);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisitorInfo);
} else {
    initVisitorInfo();
}
