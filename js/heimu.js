(() => {
  'use strict';
  if (window.__heimuReady) return;
  window.__heimuReady = true;
  let states = new WeakMap();
  let keyboardInput = false;
  const interactive = 'a, button:not(.heimu-toggle), input, select, textarea, [contenteditable="true"]';
  const find = target => target?.closest?.('.heimu');

  function eachHeimu(target, callback) {
    for (let heimu = find(target); heimu; heimu = find(heimu.parentElement)) callback(heimu);
  }

  function stateFor(heimu) {
    if (!states.has(heimu)) states.set(heimu, { hover: false, focus: false, pinned: false, dismissed: false });
    return states.get(heimu);
  }

  function update(heimu) {
    const state = stateFor(heimu);
    const visible = !state.dismissed && (state.hover || state.focus || state.pinned);
    const button = heimu.querySelector(':scope > .heimu-toggle');
    const content = heimu.querySelector(':scope > .heimu-content');
    heimu.classList.toggle('is-revealed', visible);
    button.setAttribute('aria-expanded', String(visible));
    button.setAttribute('aria-label', visible ? '隐藏防剧透内容' : '显示防剧透内容');
    content.setAttribute('aria-hidden', String(!visible));
    content.inert = !visible;
  }

  document.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    eachHeimu(event.target, heimu => {
      if (heimu.contains(event.relatedTarget)) return;
      Object.assign(stateFor(heimu), { hover: true, dismissed: false });
      update(heimu);
    });
  });

  document.addEventListener('pointerout', event => {
    if (event.pointerType === 'touch') return;
    eachHeimu(event.target, heimu => {
      if (heimu.contains(event.relatedTarget)) return;
      stateFor(heimu).hover = false;
      update(heimu);
    });
  });

  document.addEventListener('focusin', event => {
    if (!keyboardInput) return;
    eachHeimu(event.target, heimu => {
      Object.assign(stateFor(heimu), { focus: true, dismissed: false });
      update(heimu);
    });
  });

  document.addEventListener('pointerdown', () => { keyboardInput = false; }, true);

  document.addEventListener('focusout', event => {
    eachHeimu(event.target, heimu => {
      if (heimu.contains(event.relatedTarget)) return;
      stateFor(heimu).focus = false;
      update(heimu);
    });
  });

  document.addEventListener('click', event => {
    const heimu = find(event.target);
    if (!heimu) {
      document.querySelectorAll('.heimu.is-revealed').forEach(element => {
        stateFor(element).pinned = false;
        update(element);
      });
      return;
    }
    if (event.target.closest(interactive)) return;
    const visible = heimu.classList.contains('is-revealed');
    Object.assign(stateFor(heimu), { pinned: !visible, dismissed: visible });
    update(heimu);
  });

  document.addEventListener('keydown', event => {
    if (!event.ctrlKey && !event.metaKey && !event.altKey) keyboardInput = true;
    const heimu = find(event.target);
    if (!heimu || event.key !== 'Escape') return;
    event.preventDefault();
    heimu.querySelector(':scope > .heimu-toggle').focus({ preventScroll: true });
    Object.assign(stateFor(heimu), { pinned: false, dismissed: true });
    update(heimu);
  });

  // Delegated listeners also handle new articles inserted by Butterfly PJAX.
  document.addEventListener('pjax:send', () => {
    document.querySelectorAll('.heimu').forEach(heimu => {
      states.delete(heimu);
      update(heimu);
    });
    states = new WeakMap();
  });
})();
