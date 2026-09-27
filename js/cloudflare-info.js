/* Same-origin Cloudflare trace card. Cache only in this page's memory. */
(() => {
  'use strict';
  if (window.__cloudflareInfoReady) return;
  window.__cloudflareInfoReady = true;

  const TIMEOUT = 5000;
  const CACHE_TTL = 60000;
  const FAILURE_TTL = 10000;
  const fields = ['ip', 'loc', 'colo', 'tls', 'warp'];
  const cities = {
    HKG: 'Hong Kong', NRT: 'Tokyo, JP', KIX: 'Osaka, JP', ICN: 'Seoul, KR',
    SIN: 'Singapore', SJC: 'San Jose, US', SFO: 'San Francisco, US',
    LAX: 'Los Angeles, US', SEA: 'Seattle, US', FRA: 'Frankfurt, DE',
    LHR: 'London, GB', AMS: 'Amsterdam, NL', CDG: 'Paris, FR',
    MAD: 'Madrid, ES', SYD: 'Sydney, AU', MEL: 'Melbourne, AU'
  };
  let cached = null;
  let pending = null;
  let generation = 0;

  function isPreview() {
    if (document.querySelector('meta[name="cloudflare-trace-preview"][content="true"]')) return true;
    const host = window.location.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
        host === '::1' || host === '::' || /^(fc|fd)[\da-f]{2}:|^fe[89ab][\da-f]:/.test(host)) return true;
    const parts = host.split('.').map(Number);
    return parts.length === 4 && parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255) &&
      (parts[0] === 0 || parts[0] === 10 || parts[0] === 127 ||
       (parts[0] === 192 && parts[1] === 168) ||
       (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
       (parts[0] === 169 && parts[1] === 254));
  }

  function validIP(ip) {
    if (!ip) return false;
    if (ip.includes(':')) {
      if (!/^[\da-f:.]+$/i.test(ip)) return false;
      try { return new URL(`http://[${ip}]/`).hostname.startsWith('['); } catch { return false; }
    }
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && ip.split('.').every(n => Number(n) <= 255);
  }

  function parseTrace(text) {
    const data = Object.create(null);
    for (const line of text.split(/\r?\n/)) {
      const split = line.indexOf('=');
      if (split < 1) continue;
      const key = line.slice(0, split).trim();
      if (fields.includes(key)) data[key] = line.slice(split + 1).trim();
    }
    // A successful HTML fallback or an empty body must not look like valid trace data.
    if (!validIP(data.ip) || !/^[A-Z]{3}$/.test(data.colo || '') || /^\s*</.test(text)) {
      throw new Error('invalid');
    }
    return data;
  }

  function getTrace(force) {
    if (pending) return pending;
    if (!force && cached && Date.now() < cached.expires) return Promise.resolve(cached.result);
    const controller = new AbortController();
    let timer;
    const timeout = new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error('timeout'));
        controller.abort();
      }, TIMEOUT);
    });
    const request = Promise.resolve().then(async () => {
      const response = await fetch('/cdn-cgi/trace', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(response.status === 404 ? 'unavailable' : 'network');
      return parseTrace(await response.text());
    });
    pending = Promise.race([request, timeout])
      .then(data => ({ data }), error => ({ error: error.message }))
      .then(result => {
        cached = { result, expires: Date.now() + (result.data ? CACHE_TTL : FAILURE_TTL) };
        return result;
      })
      .finally(() => { clearTimeout(timer); pending = null; });
    return pending;
  }

  function show(card, state, result = {}) {
    card.dataset.cfState = state;
    card.setAttribute('aria-busy', String(state === 'loading'));
    const status = card.querySelector('[data-cf-status]');
    const retry = card.querySelector('[data-cf-retry]');
    const details = card.querySelector('[data-cf-fields]');
    if (details) details.hidden = state === 'preview';
    if (retry) {
      retry.hidden = state !== 'error';
      retry.disabled = state === 'loading';
    }
    if (status) {
      status.textContent = state === 'preview' ? '本地预览不提供 Cloudflare 节点信息' :
        state === 'loading' ? '正在获取节点信息…' : state === 'error' ?
          result.error === 'timeout' ? '获取节点信息超时，请重试' :
          result.error === 'unavailable' ? '当前站点未提供 Cloudflare 节点信息' :
          '暂时无法获取节点信息，请重试' : '';
      status.hidden = state === 'ready';
    }
    const data = result.data || {};
    for (const field of fields) {
      const el = card.querySelector(`#cf-${field}`);
      if (!el) continue;
      let value = state === 'ready' ? data[field] || '未知' : '—';
      if (state === 'ready' && field === 'colo' && cities[value]) value += ` (${cities[value]})`;
      if (state === 'ready' && field === 'warp') value = value === 'on' ? '启用' : value === 'off' ? '关闭' : value;
      el.textContent = value;
      if (field === 'ip') el.closest('.webinfo-item')?.classList.toggle('ip-wrap', value.length > 15);
    }
  }

  async function update(force = false) {
    const token = ++generation;
    const card = document.getElementById('colo-info');
    if (!card) return;
    if (isPreview()) { show(card, 'preview'); return; }
    show(card, 'loading');
    const result = await getTrace(force);
    if (token !== generation || !card.isConnected || document.getElementById('colo-info') !== card) return;
    show(card, result.data ? 'ready' : 'error', result);
  }

  // Navigation invalidates DOM writes, but keeps the shared request for the next card.
  document.addEventListener('pjax:send', () => { generation++; });
  document.addEventListener('pjax:complete', () => update());
  document.addEventListener('pjax:error', () => update());
  document.addEventListener('click', event => {
    if (event.target.closest?.('#colo-info [data-cf-retry]')) update(true);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => update(), { once: true });
  else update();
})();
