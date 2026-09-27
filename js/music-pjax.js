/* Keep the existing Meting integration working after Butterfly 5 PJAX navigation. */
(() => {
  document.addEventListener('pjax:send', () => {
    for (const player of window.aplayers || []) {
      if (player.container.classList.contains('no-destroy')) continue;
      try { player.destroy(); } catch (error) { console.debug('Player cleanup:', error); }
    }
    window.aplayers = (window.aplayers || []).filter(player =>
      player.container.classList.contains('no-destroy'));
  });
  document.addEventListener('pjax:complete', () => {
    if (typeof window.loadMeting === 'function') window.loadMeting();
  });
})();
