(function () {
  if (window.__cursorToggleBootstrapped) {
    return;
  }

  window.__cursorToggleBootstrapped = true;

  function renderCursorToggle() {
    var button = document.getElementById('cursor-toggle');

    if (!button || !window.TargetCursorController) {
      return;
    }

    var enabled = window.TargetCursorController.isEnabled();
    var icon = button.querySelector('i');

    button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    button.setAttribute('title', enabled ? '关闭鼠标特效' : '开启鼠标特效');
    button.classList.toggle('is-disabled', !enabled);

    if (icon) {
      icon.classList.toggle('fa-mouse-pointer', enabled);
      icon.classList.toggle('fa-ban', !enabled);
    }
  }

  function bindCursorToggle() {
    var button = document.getElementById('cursor-toggle');

    if (!button || !window.TargetCursorController) {
      return;
    }

    if (button.dataset.cursorToggleBound !== '1') {
      button.dataset.cursorToggleBound = '1';
      button.addEventListener('click', function () {
        window.TargetCursorController.toggle();
        renderCursorToggle();
      });
    }

    renderCursorToggle();
  }

  document.addEventListener('target-cursor:change', renderCursorToggle);
  document.addEventListener('pjax:complete', bindCursorToggle);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindCursorToggle, { once: true });
  } else {
    bindCursorToggle();
  }
})();
