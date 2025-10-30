function initVisitorInfo(){ 
  const ipinfoPromise=fetch("https://ipinfo.io/json/").then(r=>r.json()).catch(()=>({})); 
  const ipapiPromise=fetch("https://ipapi.co/json/").then(r=>r.json()).catch(()=>({})); 

  Promise.all([ipinfoPromise,ipapiPromise]).then(([ipinfo,ipapi])=>{ 
    const data={...ipapi,...ipinfo}; 
    displayVisitorInfo(data); 
  }).catch(()=>displayVisitorInfo({})); 

  function displayVisitorInfo(data){ 
    const container=document.createElement("div");  
    document.body.appendChild(container); 

    // 容器样式
    Object.assign(container.style,{ 
      position:"fixed", 
      top:"20px", 
      left:"20px", // 改到左上角
      zIndex:"1000", 
      padding:"10px", 
      borderRadius:"5px", 
      fontSize:"14px", 
      fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
      boxShadow:"0 2px 6px rgba(0,0,0,0.15)", 
      display:"block", 
      transition:"opacity 0.3s ease", 
      backgroundColor:"rgba(245, 255, 245, 0.5)", 
      pointerEvents:"auto" // 确保显示时可点击
    }); 

    const flag=countryCodeToFlagEmoji(data.country||""); 
    let countryFull=""; 
    if(data.country){try{countryFull=new Intl.DisplayNames(["en"],{type:"region"}).of(data.country);}catch{countryFull=data.country;}} 
    const asnInfo=data.asn||data.org||"N/A"; 
    const infoContent=[ 
      {name:"Country",value:`${flag} ${countryFull} ${data.region||""} ${data.city||""}`.trim(),icon:"icon-earth-full"}, 
      {name:"Date",value:getCurrentDate(),icon:"icon-calendar-days"}, 
      {name:"IP Info",value:data.ip||"Unknown",icon:"icon-location-dot"}, 
      {name:"ASN",value:asnInfo,icon:"icon-shenfengzheng"}, 
      {name:"System",value:getOS(),icon:"icon-hollow-computer"}, 
      {name:"Browser",value:getBrowser(),icon:"icon-guge"} 
    ]; 
    container.innerHTML=infoContent.map(item=>` 
      <div style="display:flex;align-items:center;margin-bottom:2px;"> 
        <i class="iconfont ${item.icon}" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;"></i> 
        <span style="font-weight:bold;margin-left:4px;">${item.name}:&nbsp;</span> 
        <span>${item.value}</span> 
      </div>`).join(""); 

    // 主题适配 
    const updateTheme=()=>{ 
      const theme=document.documentElement.getAttribute("data-theme"); 
      const isDark=theme==="dark"||document.documentElement.classList.contains("dark")||(!theme||theme!=="light")&&window.matchMedia("(prefers-color-scheme: dark)").matches; 
      Object.assign(container.style,{backgroundColor:isDark?"rgba(30,30,30,0.85)":"rgba(245, 255, 245, 0.5)",color:isDark?"#fff":"#333"}); 
      container.querySelectorAll("i.iconfont").forEach(icon=>{icon.style.color=isDark?"#fff":"#242c36"}); 
    }; 
    updateTheme(); 
    document.documentElement.addEventListener("themechange",updateTheme); 
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",updateTheme); 

    if(window.innerWidth>768){ 
      // 桌面端自动隐藏 3.6s
      let hidden=false; 
      setTimeout(()=>{ 
        container.style.opacity="0"; 
        container.style.pointerEvents="none"; // 隐藏后不阻挡点击
        hidden=true; 
      }, 3600); 

      // 鼠标悬停显示
      document.addEventListener("mousemove",(e)=>{ 
        if(hidden && e.clientX<window.VisitorInfoHoverArea && e.clientY<window.VisitorInfoHoverArea){ 
          container.style.opacity="1"; 
          container.style.pointerEvents="auto"; 
          hidden=false; 
          setTimeout(()=>{ 
            container.style.opacity="0"; 
            container.style.pointerEvents="none"; 
            hidden=true; 
          }, 3600); 
        } 
      }); 
    } else { 
      // 移动端也改到左上角
      Object.assign(container.style,{position:"fixed",top:"20px",left:"20px",width:"auto"}); 
      setTimeout(()=>{ 
        container.style.opacity="0"; 
        container.style.pointerEvents="none"; 
        setTimeout(()=>{container.style.opacity="1"; container.style.pointerEvents="auto";},500); 
      },3600); 
    } 
  } 
} 

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initVisitorInfo); 
else initVisitorInfo();
