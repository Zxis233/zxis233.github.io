(function () {
  if (window.__live2dBootstrapped || screen.width < 768) return;
  window.__live2dBootstrapped = true;

  var base = 'https://cdn.jsdelivr.net/gh/Zxis233/live2d-widget@latest/';

  function loadResource(url, type) {
    return new Promise(function (resolve, reject) {
      var tag = document.createElement(type === 'css' ? 'link' : 'script');
      if (type === 'css') {
        tag.rel = 'stylesheet';
        tag.href = url;
      } else {
        tag.src = url;
      }
      tag.onload = resolve;
      tag.onerror = function () { reject(new Error('Failed to load ' + url)); };
      document.head.appendChild(tag);
    });
  }

  // Keep the widget outside PJAX fragments and initialize only once.
  Promise.all([
    loadResource(base + 'waifu.css', 'css'),
    loadResource(base + 'live2d.min.js', 'js').then(function () {
      return loadResource(base + 'waifu-tips.js', 'js');
    })
  ]).then(function () {
    if (typeof window.initWidget !== 'function') {
      throw new Error('Live2D initWidget is unavailable');
    }
    return window.initWidget({
      waifuPath: base + 'waifu-tips.json',
      apiPath: 'https://live2d.esing.dev/',
      tools: ['hitokoto', 'switch-model', 'switch-texture', 'info', 'quit']
    });
  }).catch(function (error) {
    console.warn('[Live2D] Widget initialization failed:', error);
  });
})();
