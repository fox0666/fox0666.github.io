/** 
 * Nezha-UI 访客信息显示模块（优化版） 
 * - 桌面端显示右上角 
 * - 保留按钮展开/收起 
 * - 支持暗黑/亮色主题切换 
 */ 

window.VisitorInfoAutoHideDelay = 2600; // 首次加载时自动隐藏的延迟时间 (ms)

function countryCodeToFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "";
  return String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => c.charCodeAt(0) + 0x1f1a5));
}

function getOS() {
  const ua = navigator.userAgent;
  const osMap = [
    { r: /Windows NT 10\.0/, n: "Windows 10/11" },
    { r: /Windows NT 6\.3/, n: "Windows 8.1" },
    { r: /Windows NT 6\.2/, n: "Windows 8" },
    { r: /Windows NT 6\.1/, n: "Windows 7" },
    { r: /Mac OS X/, n: "macOS" },
    { r: /Android/, n: "Android" },
    { r: /iPhone|iPad|iPod/, n: "iOS" },
    { r: /Linux/, n: "Linux" },
  ];
  let os = osMap.find(({ r }) => r.test(ua))?.n || "Unknown OS";
  let bit = "";
  if (os.startsWith("Windows")) bit = /WOW64|Win64/.test(ua) ? "64-bit" : "32-bit";
  if (os === "macOS") bit = /MacIntel/.test(ua) ? "64-bit" : "32-bit";
  return `${os} ${bit}`.trim();
}

function getBrowser() {
  const ua = navigator.userAgent;
  const browserMap = [
    { r: /Edg\/([\d.]+)/, n: "Edge" },
    { r: /OPR\/([\d.]+)/, n: "Opera" },
    { r: /Chrome\/([\d.]+)/, n: "Chrome", e: /Edg|OPR/ },
    { r: /Firefox\/([\d.]+)/, n: "Firefox" },
    { r: /Version\/([\d.]+).*Safari/, n: "Safari" },
  ];
  for (const { r, n, e } of browserMap) {
    if (e?.test(ua)) continue;
    const match = ua.match(r);
    if (match) return `${n} ${match[1]}`;
  }
  return "Unknown Browser";
}

function getCurrentDate() {
  return new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric", weekday:"long" });
}

function initVisitorInfo() {
  // 获取 IP 信息
  const ipinfoPromise = fetch("https://ipinfo.io/json/").then(r=>r.json()).catch(()=>({}));
  const ipapiPromise = fetch("https://ipapi.co/json/").then(r=>r.json()).catch(()=>({}));

  Promise.all([ipinfoPromise, ipapiPromise]).then(([ipinfo, ipapi]) => {
    const data = { ...ipapi, ...ipinfo };
    displayVisitorInfo(data);
  }).catch(()=>displayVisitorInfo({}));

  function displayVisitorInfo(data) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let btn = null;

    // 容器样式
    Object.assign(container.style, {
      position: "fixed",
      zIndex: "1000",
      padding: "10px",
      borderRadius: "5px",
      fontSize: "14px",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      display: "none",
    });

    // 信息内容
    const flag = countryCodeToFlagEmoji(data.country || "");
    let countryFull = "";
    if(data.country){
      try{countryFull = new Intl.DisplayNames(["en"],{type:"region"}).of(data.country);}
      catch{countryFull = data.country;}
    }
    const asnInfo = data.asn || data.org || "N/A";
    const infoContent = [
      { name:"Country", value:`${flag} ${countryFull} ${data.region||""} ${data.city||""}`.trim(), icon:"icon-earth-full" },
      { name:"Date", value:getCurrentDate(), icon:"icon-calendar-days" },
      { name:"IP Info", value:data.ip||"Unknown", icon:"icon-location-dot" },
      { name:"ASN", value:asnInfo, icon:"icon-shenfengzheng" },
      { name:"System", value:getOS(), icon:"icon-hollow-computer" },
      { name:"Browser", value:getBrowser(), icon:"icon-guge" }
    ];
    container.innerHTML = infoContent.map(item=>`
      <div style="display:flex;align-items:center;margin-bottom:2px;">
        <i class="iconfont ${item.icon}" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;"></i>
        <span style="font-weight:bold;margin-left:4px;">${item.name}:&nbsp;</span>
        <span>${item.value}</span>
      </div>`).join("");

    // 主题适配
    const updateTheme = ()=>{
      const theme = document.documentElement.getAttribute("data-theme");
      const isDark = theme==="dark" || document.documentElement.classList.contains("dark") || (!theme || theme!=="light") && window.matchMedia("(prefers-color-scheme: dark)").matches;
      Object.assign(container.style,{backgroundColor:isDark?"rgba(30,30,30,0.85)":"rgba(255,255,255,0.85)", color:isDark?"#fff":"#333"});
      container.querySelectorAll("i.iconfont").forEach(icon=>{icon.style.color=isDark?"#ffffff":"#242c36"});
    };
    updateTheme();
    document.documentElement.addEventListener("themechange", updateTheme);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateTheme);

    // 桌面端逻辑
    if(window.innerWidth>768){
      Object.assign(container.style,{top:"20px", right:"20px", width:"auto"}); // 右上角

      // 按钮
      btn = document.createElement("button");
      const icon = document.createElement("i");
      icon.className="iconfont icon-footprint-full";
      Object.assign(icon.style,{color:"#fff", fontSize:"22px"});
      Object.assign(btn.style,{
        position:"fixed",
        top:"20px",
        right:"20px",
        zIndex:"1100",
        transition:"opacity 0.3s, background-color 0.3s ease",
        cursor:"pointer",
        border:"none",
        boxShadow:"0 2px 8px rgba(45,54,61,.5)",
        width:"40px",
        height:"40px",
        padding:"0",
        borderRadius:"8px",
        display:"flex",
        alignItems:"center",
        justifyContent:"center"
      });
      btn.append(icon);
      document.body.append(btn);
      updateTheme();

      const showContainer=({autoHide=false}={})=>{
        container.style.display="block"; container.style.opacity="1"; container.style.transition="opacity 0.3s ease"; btn.style.display="none";
        if(autoHide){ clearTimeout(window._autoHideTimer); window._autoHideTimer=setTimeout(hideContainer, window.VisitorInfoAutoHideDelay||2600);}
        else setTimeout(()=>document.addEventListener("click",handleClickOutside),0);
      };
      const hideContainer=()=>{
        container.style.transition="opacity 0.3s ease"; container.style.opacity="0";
        setTimeout(()=>{ container.style.display="none"; btn.style.display="flex"; btn.style.opacity="1"; document.removeEventListener("click",handleClickOutside); window._opacityTimer=setTimeout(()=>{ if(container.style.display==="none") btn.style.opacity="0.3"; },2600); },300);
      };
      const handleClickOutside=(e)=>!container.contains(e.target)&&hideContainer();
      btn.onclick=(e)=>{e.stopPropagation(); showContainer({autoHide:false});};
      btn.onmouseenter=()=>{btn.style.opacity="1";};
      btn.onmouseleave=()=>{if(container.style.display==="none") btn.style.opacity="0.3";};

      document.addEventListener("visibilitychange",()=>{
        if(document.hidden || window.innerWidth<=768) return;
        showContainer({autoHide:true});
      });
      showContainer({autoHide:true});
      window.addEventListener("resize",()=>{
        if(window.innerWidth>768) btn.style.display=container.style.display==="none"?"flex":"none";
        else btn.style.display="none";
      });
    }
  }
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initVisitorInfo);
else initVisitorInfo();
