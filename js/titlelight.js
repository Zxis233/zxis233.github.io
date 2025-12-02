var hue = 0;
var cachedElements = null;
var intervalId = null;

// 初始化并缓存 DOM 元素
function initElements() {
    var isFullPage = document.querySelector('.full_page') !== null;
    var isPostPage = document.body.querySelector('.post') !== null;
    
    return {
        siteName: document.getElementById("site-name"),
        authorName: document.getElementsByClassName("author-info__name")[0],
        authorDesc: document.getElementsByClassName("author-info__description")[0],
        subtitle: document.getElementById("subtitle"),
        siteTitle: document.getElementById("site-title"),
        postTitle: document.querySelector(".post-title"),
        postMeta: document.getElementById("post-meta"),
        // titleElement: isPostPage 
        //     ? document.querySelector(".post-title") 
        //     : document.getElementById("site-title"),
        isFullPage: isFullPage,
        htmlElement: document.getElementsByTagName("html")[0]
    };
}

function changeColor() {
    // 首次调用时初始化缓存
    if (!cachedElements) {
        cachedElements = initElements();
    }
    
    var color = `hsl(${hue}, 73%, 50%)`;
    hue = (hue + 6) % 360; // 色相值在0到360之间循环
    
    var isDarkTheme = "dark" == cachedElements.htmlElement.getAttribute("data-theme");
    var elements = cachedElements;

    if (elements.siteTitle) elements.siteTitle.style.textShadow = `${color} 0 0 20px`;
    if (elements.postTitle) elements.postTitle.style.textShadow = `${color} 0 0 20px`;
    if (elements.postMeta)  elements.postMeta.style.textShadow  = `${color} 0 0 8px`;

    if (elements.isFullPage && elements.subtitle) {
        elements.subtitle.style.textShadow = `${color} 0 0 20px`;
    }

    if (isDarkTheme) {
        if (elements.siteName) elements.siteName.style.textShadow = `${color} 0 0 16px`;
        if (elements.authorName) elements.authorName.style.textShadow = `${color} 0 0 16px`;
        if (elements.authorDesc) elements.authorDesc.style.textShadow = `${color} 0 0 16px`;
    } else {
        if (elements.siteName) elements.siteName.style.textShadow = "none";
        if (elements.authorName) elements.authorName.style.textShadow = "";
        if (elements.authorDesc) elements.authorDesc.style.textShadow = "";
    }
}

// 启动动画
function startAnimation() {
    if (!intervalId) {
        intervalId = window.setInterval(changeColor, 500);
    }
}

// 停止动画
function stopAnimation() {
    if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
    }
}

// 页面可见性检测 - 页面隐藏时停止动画以节省资源
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        stopAnimation();
    } else {
        startAnimation();
    }
});

// PJAX 页面切换时重新初始化
document.addEventListener('pjax:complete', function() {
    cachedElements = null; // 清除缓存，强制重新获取 DOM 元素
});

// 如果使用的是其他路由方式，也监听相应事件
document.addEventListener('DOMContentLoaded', function() {
    cachedElements = null; // 页面加载完成时重新初始化
});

// 启动动画
startAnimation();
