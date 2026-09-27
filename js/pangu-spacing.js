/* Preserve the old site's safe, text-node-only Pangu spacing on PJAX pages. */
(() => {
  'use strict';
  if (window.__panguSpacingReady) return;
  window.__panguSpacingReady = true;
  const field = document.currentScript?.dataset.field === 'site' ? 'site' : 'post';
  const ignoredSelector = [
    'script', 'style', 'noscript', 'template', 'input', 'textarea', 'select',
    'pre', 'code', 'kbd', 'samp', 'svg', 'math', 'mjx-container',
    '.katex', '.MathJax', '.MathJax_Display', '.mermaid', '.mermaid-wrap',
    '.aplayer', '#waifu', '#rightMenu', '#rightmenu-status', '[data-pangu-ignore]'
  ].join(',');
  let generation = 0;
  let frame = null;

  function eligiblePage() {
    return !!document.body && (field === 'site' || document.getElementById('body-wrap')?.classList.contains('post'));
  }

  function eligibleNode(node) {
    const parent = node.parentElement;
    return parent && !parent.isContentEditable && !parent.closest(ignoredSelector);
  }

  async function applySpacing(token) {
    if (token !== generation || !eligiblePage()) return;
    const engine = window.pangu;
    const spacing = engine && (typeof engine.spaceText === 'function' ? engine.spaceText :
      typeof engine.spacingText === 'function' ? engine.spacingText : engine.spacing);
    if (typeof spacing !== 'function') {
      console.warn('[Pangu] Spacing library is unavailable; keeping original text.');
      return;
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.nodeValue.trim() && eligibleNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push([node, node.nodeValue]);

    for (const [node, original] of nodes) {
      if (token !== generation || !eligiblePage()) return;
      if (!node.isConnected || node.nodeValue !== original || !eligibleNode(node)) continue;
      const result = await spacing.call(engine, original);
      // Navigation, a renderer or an editable control may have changed the node
      // while an async spacing implementation was running.
      if (token !== generation || !eligiblePage()) return;
      if (typeof result === 'string' && result !== original && node.isConnected &&
          node.nodeValue === original && eligibleNode(node)) node.nodeValue = result;
    }
  }

  function cancel() {
    generation++;
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
  }

  function schedule() {
    cancel();
    if (!eligiblePage()) return;
    const token = generation;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      applySpacing(token).catch(error => {
        if (token === generation) console.warn('[Pangu] Spacing failed; remaining text was left intact.', error);
      });
    });
  }

  document.addEventListener('pjax:send', cancel);
  document.addEventListener('pjax:complete', schedule);
  document.addEventListener('pjax:error', schedule);
  if (document.readyState === 'complete') schedule();
  else document.addEventListener('DOMContentLoaded', schedule, { once: true });
})();
