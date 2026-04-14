(function () {
  if (window.__targetCursorHexoBootstrapped) {
    return;
  }

  window.__targetCursorHexoBootstrapped = true;
  window.__targetCursorHexoLoaded = false;
  // targetSelector: '#article-container img, #article-container a:not([data-fancybox]), #nav a, #aside-content a:not(.thumbnail):not(.title), #aside-content .aside-list-item, button, .cursor-target, .article-title'

  var config = Object.assign(
    {
      targetSelector:
        '#article-container img, #article-container a:not([data-fancybox]), #nav a, #aside-content a:not(.thumbnail):not(.title), #aside-content .aside-list-item, button, .cursor-target, .article-title',
      spinDuration: 3,
      hoverDuration: 0.3,
      targetGap: 8,
      hideDefaultCursor: true,
      parallaxOn: true,
      storageKey: 'target-cursor-enabled',
      defaultEnabled: true
    },
    window.TargetCursorOptions || {}
  );

  function readCursorEnabledState() {
    var fallback = config.defaultEnabled !== false;

    try {
      var storedValue = window.localStorage.getItem(config.storageKey);

      if (storedValue === null) {
        return fallback;
      }

      return storedValue !== '0' && storedValue !== 'false';
    } catch (error) {
      return fallback;
    }
  }

  function writeCursorEnabledState(enabled) {
    try {
      window.localStorage.setItem(config.storageKey, enabled ? '1' : '0');
    } catch (error) { }
  }

  function syncCursorEnabledState(enabled) {
    document.documentElement.classList.toggle('target-cursor-enabled', enabled);
    document.documentElement.classList.toggle('target-cursor-disabled', !enabled);
    document.dispatchEvent(
      new CustomEvent('target-cursor:change', {
        detail: { enabled: enabled }
      })
    );
  }

  function isMobileDevice() {
    var hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    var isSmallScreen = window.innerWidth <= 768;
    var mobileRegex =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    var userAgent = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();

    return (hasTouchScreen && isSmallScreen) || mobileRegex.test(userAgent);
  }

  function createCursor() {
    var wrapper = document.createElement('div');
    wrapper.className = 'target-cursor-wrapper';
    wrapper.innerHTML =
      '<div class="target-cursor-rotor">' +
      '<div class="target-cursor-dot"></div>' +
      '<div class="target-cursor-corner corner-tl"></div>' +
      '<div class="target-cursor-corner corner-tr"></div>' +
      '<div class="target-cursor-corner corner-br"></div>' +
      '<div class="target-cursor-corner corner-bl"></div>' +
      '</div>';

    document.body.appendChild(wrapper);
    return wrapper;
  }

  function setupTargetCursor() {
    if (window.__targetCursorHexoLoaded || !readCursorEnabledState()) {
      return;
    }

    if (isMobileDevice()) {
      return;
    }

    if (!window.gsap) {
      console.warn('[target-cursor] gsap is required.');
      return;
    }

    window.__targetCursorHexoLoaded = true;

    var gsap = window.gsap;
    var cursor = document.querySelector('.target-cursor-wrapper') || createCursor();
    var rotor = cursor.querySelector('.target-cursor-rotor');
    var corners = Array.prototype.slice.call(
      cursor.querySelectorAll('.target-cursor-corner')
    );
    var dot = cursor.querySelector('.target-cursor-dot');
    var spinTl = null;
    var activeTarget = null;
    var leaveHandler = null;
    var targetCornerPositions = null;
    var activeStrength = { current: 0 };
    var resumeTimeout = null;
    var originalCursor = document.body.style.cursor;

    var constants = {
      cornerSize: 12
    };

    function cleanupActiveTarget() {
      if (activeTarget && leaveHandler) {
        activeTarget.removeEventListener('mouseleave', leaveHandler);
      }

      activeTarget = null;
      leaveHandler = null;
    }

    function resetCorners() {
      var size = constants.cornerSize;
      var positions = [
        { x: -size * 1.5, y: -size * 1.5 },
        { x: size * 0.5, y: -size * 1.5 },
        { x: size * 0.5, y: size * 0.5 },
        { x: -size * 1.5, y: size * 0.5 }
      ];

      corners.forEach(function (corner, index) {
        gsap.to(corner, {
          x: positions[index].x,
          y: positions[index].y,
          duration: 0.3,
          ease: 'power3.out',
          overwrite: 'auto'
        });
      });
    }

    function createSpinTimeline() {
      if (spinTl) {
        spinTl.kill();
      }

      spinTl = gsap
        .timeline({ repeat: -1 })
        .to(rotor, {
          rotation: '+=360',
          duration: config.spinDuration,
          ease: 'none'
        });
    }

    function clearHoverState() {
      gsap.ticker.remove(tickerFn);
      gsap.killTweensOf(activeStrength);
      activeStrength.current = 0;
      targetCornerPositions = null;
      cleanupActiveTarget();
      resetCorners();
    }

    function moveCursor(x, y) {
      gsap.to(cursor, {
        x: x,
        y: y,
        duration: 0.1,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    }

    function tickerFn() {
      if (activeTarget) {
        var rect = activeTarget.getBoundingClientRect();
        var cornerSize = constants.cornerSize;
        var targetGap = Number(config.targetGap) || 0;

        targetCornerPositions = [
          { x: rect.left - targetGap, y: rect.top - targetGap },
          { x: rect.right + targetGap - cornerSize, y: rect.top - targetGap },
          {
            x: rect.right + targetGap - cornerSize,
            y: rect.bottom + targetGap - cornerSize
          },
          { x: rect.left - targetGap, y: rect.bottom + targetGap - cornerSize }
        ];
      }

      if (!targetCornerPositions) {
        return;
      }

      var strength = activeStrength.current;
      if (strength === 0) {
        return;
      }

      var cursorX = Number(gsap.getProperty(cursor, 'x'));
      var cursorY = Number(gsap.getProperty(cursor, 'y'));

      corners.forEach(function (corner, index) {
        var currentX = Number(gsap.getProperty(corner, 'x'));
        var currentY = Number(gsap.getProperty(corner, 'y'));
        var targetX = targetCornerPositions[index].x - cursorX;
        var targetY = targetCornerPositions[index].y - cursorY;
        var finalX = currentX + (targetX - currentX) * strength;
        var finalY = currentY + (targetY - currentY) * strength;
        var duration = strength >= 0.99 ? (config.parallaxOn ? 0.2 : 0) : 0.05;

        gsap.to(corner, {
          x: finalX,
          y: finalY,
          duration: duration,
          ease: duration === 0 ? 'none' : 'power1.out',
          overwrite: 'auto'
        });
      });
    }

    function enterTarget(target) {
      if (!target || activeTarget === target) {
        return;
      }

      cleanupActiveTarget();

      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }

      var cursorX = Number(gsap.getProperty(cursor, 'x'));
      var cursorY = Number(gsap.getProperty(cursor, 'y'));

      activeTarget = target;
      tickerFn();

      gsap.killTweensOf(rotor, 'rotation');
      gsap.killTweensOf(corners);
      gsap.killTweensOf(activeStrength);

      if (spinTl) {
        spinTl.pause();
      }

      gsap.set(rotor, { rotation: 0 });
      gsap.ticker.add(tickerFn);

      gsap.to(activeStrength, {
        current: 1,
        duration: config.hoverDuration,
        ease: 'power2.out',
        overwrite: 'auto'
      });

      corners.forEach(function (corner, index) {
        gsap.to(corner, {
          x: targetCornerPositions[index].x - cursorX,
          y: targetCornerPositions[index].y - cursorY,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });

      leaveHandler = function () {
        clearHoverState();

        resumeTimeout = window.setTimeout(function () {
          if (!activeTarget) {
            gsap.set(rotor, { rotation: 0 });
            createSpinTimeline();
          }

          resumeTimeout = null;
        }, 50);
      };

      target.addEventListener('mouseleave', leaveHandler);
    }

    function findTarget(startNode) {
      var current = startNode;

      while (current && current !== document.body) {
        if (current.matches && current.matches(config.targetSelector)) {
          return current;
        }

        current = current.parentElement;
      }

      return null;
    }

    function mouseMoveHandler(event) {
      moveCursor(event.clientX, event.clientY);
    }

    function mouseOverHandler(event) {
      enterTarget(findTarget(event.target));
    }

    function scrollHandler() {
      if (!activeTarget) {
        return;
      }

      var mouseX = Number(gsap.getProperty(cursor, 'x'));
      var mouseY = Number(gsap.getProperty(cursor, 'y'));
      var elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
      var stillOverTarget =
        elementUnderMouse &&
        (elementUnderMouse === activeTarget ||
          elementUnderMouse.closest(config.targetSelector) === activeTarget);

      if (!stillOverTarget && leaveHandler) {
        leaveHandler();
      }
    }

    function mouseDownHandler() {
      if (!dot) {
        return;
      }

      gsap.to(dot, { scale: 0.7, duration: 0.2, overwrite: 'auto' });
      gsap.to(cursor, { scale: 0.9, duration: 0.2, overwrite: 'auto' });
    }

    function mouseUpHandler() {
      if (!dot) {
        return;
      }

      gsap.to(dot, { scale: 1, duration: 0.2, overwrite: 'auto' });
      gsap.to(cursor, { scale: 1, duration: 0.2, overwrite: 'auto' });
    }

    function pjaxSendHandler() {
      clearHoverState();
    }

    function pjaxCompleteHandler() {
      if (!document.body.contains(cursor)) {
        document.body.appendChild(cursor);
      }
    }

    if (config.hideDefaultCursor) {
      document.body.style.cursor = 'none';
    }

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    createSpinTimeline();
    resetCorners();

    window.addEventListener('mousemove', mouseMoveHandler);
    window.addEventListener('mouseover', mouseOverHandler, { passive: true });
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('pjax:send', pjaxSendHandler);
    document.addEventListener('pjax:complete', pjaxCompleteHandler);

    window.__targetCursorHexoDestroy = function () {
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
      }

      gsap.ticker.remove(tickerFn);
      cleanupActiveTarget();
      spinTl && spinTl.kill();

      window.removeEventListener('mousemove', mouseMoveHandler);
      window.removeEventListener('mouseover', mouseOverHandler);
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('mousedown', mouseDownHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
      document.removeEventListener('pjax:send', pjaxSendHandler);
      document.removeEventListener('pjax:complete', pjaxCompleteHandler);

      document.body.style.cursor = originalCursor;

      if (cursor.parentNode) {
        cursor.parentNode.removeChild(cursor);
      }

      window.__targetCursorHexoDestroy = null;
      window.__targetCursorHexoLoaded = false;
    };
  }

  function enableTargetCursor() {
    writeCursorEnabledState(true);
    syncCursorEnabledState(true);
    setupTargetCursor();
  }

  function disableTargetCursor() {
    writeCursorEnabledState(false);

    if (window.__targetCursorHexoDestroy) {
      window.__targetCursorHexoDestroy();
    } else {
      window.__targetCursorHexoLoaded = false;
    }

    syncCursorEnabledState(false);
  }

  function toggleTargetCursor(forceState) {
    var nextState =
      typeof forceState === 'boolean' ? forceState : !readCursorEnabledState();

    if (nextState) {
      enableTargetCursor();
    } else {
      disableTargetCursor();
    }

    return nextState;
  }

  window.TargetCursorController = {
    enable: enableTargetCursor,
    disable: disableTargetCursor,
    toggle: toggleTargetCursor,
    isEnabled: readCursorEnabledState
  };

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      function () {
        syncCursorEnabledState(readCursorEnabledState());
        setupTargetCursor();
      },
      { once: true }
    );
  } else {
    syncCursorEnabledState(readCursorEnabledState());
    setupTargetCursor();
  }
})();
