(function () {
  'use strict';
  if (window.__titleLightBootstrapped) return;
  window.__titleLightBootstrapped = true;

  var hue = 0;
  var interval = null;
  var elements = null;
  var navigating = false;

  function collectElements() {
    return {
      titles: document.querySelectorAll('#site-title, .post-title, #page-header.full_page #subtitle'),
      meta: document.getElementById('post-meta'),
      siteNames: document.querySelectorAll('#nav .nav-site-title .site-name'),
      authorInfo: document.querySelectorAll('#aside-content .author-info-name, #aside-content .author-info-description')
    };
  }

  function paint() {
    if (document.hidden || navigating) return;
    if (!elements) elements = collectElements();
    var color = 'hsl(' + hue + ', 73%, 50%)';
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    elements.titles.forEach(function (element) {
      element.style.textShadow = color + ' 0 0 20px';
    });
    if (elements.meta) elements.meta.style.textShadow = color + ' 0 0 8px';
    elements.siteNames.forEach(function (element) {
      element.style.textShadow = dark ? color + ' 0 0 16px' : 'none';
    });
    elements.authorInfo.forEach(function (element) {
      element.style.textShadow = dark ? color + ' 0 0 16px' : '';
    });
  }

  function stop() {
    window.clearInterval(interval);
    interval = null;
  }

  function start() {
    if (document.hidden || navigating || interval !== null) return;
    paint();
    interval = window.setInterval(function () {
      hue = (hue + 6) % 360;
      paint();
    }, 500);
  }

  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });
  document.addEventListener('pjax:send', function () {
    navigating = true;
    stop();
    elements = null;
  });
  function refresh() {
    stop();
    elements = null;
    navigating = false;
    start();
  }
  document.addEventListener('pjax:complete', refresh);
  document.addEventListener('pjax:error', refresh);

  // React to manual and automatic theme switches without waiting for a tick.
  new MutationObserver(paint).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
