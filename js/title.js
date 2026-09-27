(function () {
  if (window.__titleEffectBootstrapped) return;
  window.__titleEffectBootstrapped = true;

  var normalTitle = document.title;
  var lastEffectTitle = null;
  var interval = null;
  var navigating = false;

  function stop() {
    clearInterval(interval);
    interval = null;
    // Do not overwrite a newer title supplied by navigation or another script.
    if (lastEffectTitle !== null && document.title === lastEffectTitle) {
      document.title = normalTitle;
    }
    lastEffectTitle = null;
  }

  function start() {
    stop();
    normalTitle = document.title;
    if (!document.hidden || navigating) return;
    var state = 0;
    interval = setInterval(function () {
      if (document.title !== (lastEffectTitle === null ? normalTitle : lastEffectTitle)) {
        normalTitle = document.title;
      }
      var titles = [normalTitle, '♪~(¯◡◝)  啥时再来看看我 ...', ' Ciallo~ (∠・ω< )⌒★!'];
      lastEffectTitle = titles[state];
      document.title = lastEffectTitle;
      state = (state + 1) % titles.length;
    }, 8000);
  }

  document.addEventListener('visibilitychange', start);
  document.addEventListener('pjax:send', function () {
    navigating = true;
    stop();
  });
  function finishNavigation() {
    navigating = false;
    start();
  }
  document.addEventListener('pjax:complete', finishNavigation);
  document.addEventListener('pjax:error', finishNavigation);
  start();
})();
