/* Desktop context menu: one persistent node, one set of listeners. */
(() => {
  'use strict';
  const menu = document.getElementById('rightMenu');
  const status = document.getElementById('rightmenu-status');
  if (!menu || window.__rightMenuReady) return;
  window.__rightMenuReady = true;
  menu.tabIndex = -1;

  let context = null;
  let epoch = 0;
  let messageTimer;
  let randomPosts;
  let lastPointerType = '';
  const configuredMinWidth = Number(menu.dataset.minWidth);
  const minWidth = Number.isFinite(configuredMinWidth) && configuredMinWidth >= 0 ? configuredMinWidth : 0;
  const buttons = () => [...menu.querySelectorAll('button[data-action]')]
    .filter(button => !button.hidden && !button.closest('[hidden]') && !button.disabled);

  function notify(message) {
    clearTimeout(messageTimer);
    status.textContent = message;
    messageTimer = setTimeout(() => { status.textContent = ''; }, 3500);
  }

  function close(restoreFocus = false) {
    const previous = context;
    menu.hidden = true;
    context = null;
    if (restoreFocus && previous && previous.focus && previous.focus.isConnected) {
      previous.focus.focus({ preventScroll: true });
    }
  }

  function cancelInteraction() {
    epoch++;
    close();
  }

  function clearMessage() {
    clearTimeout(messageTimer);
    status.textContent = '';
  }

  function httpURL(value, base = document.baseURI) {
    if (!value) return null;
    try {
      const url = new URL(value, base);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch (_) { return null; }
  }

  function selectedURL(text) {
    const value = text.trim();
    if (!value || /\s/.test(value)) return null;
    if (/^https?:\/\//i.test(value)) return httpURL(value);
    // Only infer a scheme for a host name, never javascript:, mailto:, etc.
    if (!/^(?:[\w-]+\.)+[\w-]+(?::\d+)?(?:[/?#].*)?$/.test(value)) return null;
    return httpURL('https://' + value);
  }

  function isNativeTarget(target, event) {
    // Input capabilities describe the device, not this particular interaction.
    // An explicit mouse event wins over an earlier touch on a hybrid device.
    const pointerType = event.pointerType || lastPointerType;
    const fromTouch = pointerType === 'touch' || event.sourceCapabilities?.firesTouchEvents;
    return event.ctrlKey || event.metaKey || event.shiftKey || fromTouch ||
      window.innerWidth < minWidth ||
      target.isContentEditable || !!target.closest('input, textarea, select, option, audio, video, dialog[open], .fancybox__container, .fancybox__dialog') ||
      (document.fullscreenElement && !document.fullscreenElement.contains(menu));
  }

  function show(event) {
    const target = event.target instanceof Element ? event.target : event.target.parentElement;
    if (!target || isNativeTarget(target, event)) { epoch++; close(); return; }
    if (menu.contains(target)) { event.preventDefault(); return; }
    epoch++;
    const anchor = target.closest('a[href]');
    const image = target.closest('img');
    const link = anchor && httpURL(anchor.href);
    const imageURL = image && httpURL(image.getAttribute('data-lazy-src') || image.currentSrc || image.src);
    if ((anchor && !link) || (image && !imageURL)) { close(); return; }

    const selection = window.getSelection();
    const text = selection ? selection.toString() : '';
    const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : [];
    const active = document.activeElement;
    context = Object.freeze({ text, ranges, link, image: imageURL, selectedURL: selectedURL(text),
      pageURL: location.href, epoch, focus: active && !menu.contains(active) ? active : context && context.focus });
    const groups = { selection: !!text.trim(), 'selected-url': !!context.selectedURL, link: !!link, image: !!imageURL };
    menu.querySelectorAll('[data-group]').forEach(group => { group.hidden = !groups[group.dataset.group]; });
    menu.querySelector('[data-action="dark"]').hidden = !document.getElementById('darkmode');
    menu.querySelector('[data-action="read"]').hidden = !document.getElementById('readmode') || document.body.classList.contains('read-mode');
    menu.querySelector('[data-action="fullscreen"]').hidden = !document.fullscreenEnabled || !document.documentElement.requestFullscreen;
    const fullscreen = menu.querySelector('[data-action="fullscreen"]');
    const fullLabel = document.fullscreenElement ? '退出全屏' : '进入全屏';
    fullscreen.querySelector('span').textContent = fullLabel;
    fullscreen.setAttribute('aria-label', fullLabel);
    fullscreen.title = fullLabel;
    menu.hidden = false;
    menu.style.visibility = 'hidden';
    menu.scrollTop = 0;
    const rect = menu.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const keyboard = event.clientX === 0 && event.clientY === 0;
    const x = keyboard ? targetRect.left : event.clientX;
    const y = keyboard ? targetRect.bottom : event.clientY;
    menu.style.left = Math.max(8, Math.min(x + 10, window.innerWidth - rect.width - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8)) + 'px';
    menu.style.visibility = '';
    event.preventDefault();
    // Mouse invocation should not look as though "Back" was already selected.
    // Keep keyboard focus inside the menu without preselecting a mouse action.
    (keyboard ? buttons()[0] : menu)?.focus({ preventScroll: true });
  }

  function restoreSelection(snapshot) {
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    snapshot.ranges.forEach(range => {
      if (range.commonAncestorContainer.isConnected) selection.addRange(range);
    });
  }

  function selectedText(snapshot) {
    const copyright = window.GLOBAL_CONFIG && window.GLOBAL_CONFIG.copyright;
    if (!copyright || snapshot.text.length <= copyright.limitCount) return snapshot.text;
    const { languages } = copyright;
    return `${snapshot.text}\n\n\n${languages.author}\n${languages.link}${snapshot.pageURL}\n${languages.source}\n${languages.info}`;
  }

  async function copy(text, snapshot) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
    } catch (_) {
      if (snapshot.epoch !== epoch) return;
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.readOnly = true;
      textarea.style.cssText = 'position:fixed;left:-9999px;top:0;';
      // The theme's body copy handler otherwise replaces URLs with window selection.
      const onCopy = event => {
        event.stopImmediatePropagation();
        if (event.clipboardData) {
          event.preventDefault();
          event.clipboardData.setData('text/plain', text);
        }
      };
      document.addEventListener('copy', onCopy, true);
      document.body.appendChild(textarea);
      try {
        textarea.select();
        if (!document.execCommand('copy')) throw new Error('复制失败，请使用浏览器原生菜单');
      } finally {
        document.removeEventListener('copy', onCopy, true);
        textarea.remove();
        if (snapshot.focus && snapshot.focus.isConnected) snapshot.focus.focus({ preventScroll: true });
        restoreSelection(snapshot);
      }
    }
    if (snapshot.epoch === epoch) notify('已复制');
  }

  function openTab(url) {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  function canonicalPath(url) {
    return new URL(url, location.href).pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
  }

  async function randomPost(snapshot) {
    if (!randomPosts) {
      randomPosts = fetch(menu.dataset.randomUrl, { credentials: 'same-origin' })
        .then(response => { if (!response.ok) throw new Error('暂时无法获取文章列表'); return response.json(); })
        .then(paths => {
          if (!Array.isArray(paths)) throw new Error('文章列表格式错误');
          return [...new Set(paths.filter(path => typeof path === 'string').map(path => httpURL(path)).filter(url => url && new URL(url).origin === location.origin))];
        }).catch(error => { randomPosts = null; throw error; });
    }
    const posts = await randomPosts;
    if (snapshot.epoch !== epoch) return;
    if (!posts.length) { notify('暂无可随机访问的文章'); return; }
    const otherPosts = posts.filter(url => canonicalPath(url) !== canonicalPath(location.href));
    const pool = otherPosts.length ? otherPosts : posts;
    const url = pool[Math.floor(Math.random() * pool.length)];
    if (window.pjax && typeof window.pjax.loadUrl === 'function') {
      try { window.pjax.loadUrl(url); return; } catch (_) { /* Fall back only for a synchronous API failure. */ }
    }
    location.assign(url);
  }

  function themeAction(id) {
    const button = document.getElementById(id);
    if (button) button.click();
  }

  const actions = {
    back: () => history.back(),
    forward: () => history.forward(),
    reload: () => location.reload(),
    top: () => themeAction('go-up'),
    'copy-selection': snapshot => copy(selectedText(snapshot), snapshot),
    'copy-link': snapshot => copy(snapshot.link, snapshot),
    'copy-image': snapshot => copy(snapshot.image, snapshot),
    'copy-page': snapshot => copy(snapshot.pageURL, snapshot),
    search: snapshot => {
      const url = new URL('https://www.baidu.com/s');
      url.searchParams.set('wd', snapshot.text);
      openTab(url.href);
    },
    'open-selection': snapshot => openTab(snapshot.selectedURL),
    'open-link': snapshot => openTab(snapshot.link),
    'open-image': snapshot => openTab(snapshot.image),
    random: randomPost,
    dark: () => themeAction('darkmode'),
    read: () => { if (!document.body.classList.contains('read-mode')) themeAction('readmode'); },
    fullscreen: async () => {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    }
  };

  menu.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button || !context || button.hidden || button.closest('[hidden]')) return;
    const snapshot = context;
    close(true);
    const action = actions[button.dataset.action];
    if (!action) return;
    try {
      Promise.resolve(action(snapshot)).catch(() => {
        if (snapshot.epoch === epoch) notify('操作未完成，请检查浏览器权限或网络');
      });
    } catch (_) { notify('操作未完成，请使用浏览器原生菜单'); }
  });

  document.addEventListener('contextmenu', show, true);
  document.addEventListener('pointerdown', event => {
    if (event.pointerType) lastPointerType = event.pointerType;
    if (!menu.contains(event.target)) cancelInteraction();
  }, true);
  // Some hybrid browsers emit a MouseEvent (without pointerType) for a long press.
  document.addEventListener('touchstart', () => { lastPointerType = 'touch'; }, { capture: true, passive: true });
  document.addEventListener('click', event => {
    if (!menu.contains(event.target) && event.target.closest?.('a[href]')) { epoch++; close(); }
  }, true);
  document.addEventListener('keydown', event => {
    if (menu.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); epoch++; close(true); return; }
    if (event.key === 'Tab') { epoch++; close(true); return; }
    const items = buttons();
    const index = items.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % items.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = items.length - 1;
    if (next !== undefined && items[next]) { event.preventDefault(); items[next].focus(); }
  });
  document.addEventListener('scroll', event => { if (!menu.contains(event.target)) cancelInteraction(); }, true);
  window.addEventListener('resize', cancelInteraction);
  window.addEventListener('blur', cancelInteraction);
  window.addEventListener('pagehide', () => { cancelInteraction(); clearMessage(); });
  document.addEventListener('pjax:send', () => {
    cancelInteraction();
    clearMessage();
    document.querySelectorAll('.exit-readmode').forEach(button => button.remove());
  });
  document.addEventListener('fullscreenchange', () => close());
})();
