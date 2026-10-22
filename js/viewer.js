import { RM, Spring, Loop, clamp01 } from './spring.js';

export function initViewer() {
  /* ---------- Viewer: multi-page popup (e-commerce + full pages) ---------- */
  const vw = document.getElementById('viewer'), vwScroll = document.getElementById('vwScroll'), vwImg = document.getElementById('vwImg');
  const vwTitle = document.getElementById('vwTitle'), vwPage = document.getElementById('vwPage'), vwThumbs = document.getElementById('vwThumbs');
  const vwPrev = document.getElementById('vwPrev'), vwNext = document.getElementById('vwNext');
  const va = new Spring(0, { response: 0.5 }), vx = new Spring(0, { response: 0.45 });
  let vList = [], vIdx = 0, vOrigin = '50% 50%';
  const vAnim = { springs: [va, vx], render() {
    const p = clamp01(va.x);
    vw.style.setProperty('--a', p);
    vwScroll.style.opacity = clamp01(p * 1.4) * (1 - Math.min(1, Math.abs(vx.x) / 60));
    if (!RM) vwScroll.style.transform = `perspective(1200px) translate3d(${vx.x}px, ${(1 - va.x) * 30}px, ${-(1 - va.x) * 220}px)`;
  }, done() { if (va.t === 0) { vw.classList.remove('open'); document.documentElement.style.overflow = ''; } } };
  function vShow(i, dir = 0) {
    vIdx = (i + vList.length) % vList.length;
    const it = vList[vIdx];
    vwImg.src = it.src; vwImg.alt = it.label || ''; vwScroll.scrollTop = 0;
    vwPage.textContent = vList.length > 1 ? `${it.label ? it.label + ' · ' : ''}${vIdx + 1} / ${vList.length}` : (it.label || '');
    vwPrev.hidden = vwNext.hidden = vList.length < 2;
    [...vwThumbs.children].forEach((b, k) => b.classList.toggle('on', k === vIdx));
    vwThumbs.children[vIdx]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    if (dir) { vx.snap(dir * 60); vx.to(0); Loop.add(vAnim); }        // arrive from the side we navigated toward
  }
  function vOpen(list, i, title, from) {
    vList = list;
    vwTitle.innerHTML = title;
    vwThumbs.innerHTML = list.length > 1 ? list.map((it, k) => `<button aria-label="${it.label || 'Página ' + (k + 1)}"><img src="${it.src}" alt="" loading="lazy"></button>`).join('') : '';
    [...vwThumbs.children].forEach((b, k) => b.addEventListener('click', () => vShow(k, k > vIdx ? 1 : -1)));
    if (from) { const r = from.getBoundingClientRect(); vScrollOrigin(r); }
    vw.classList.add('open'); document.documentElement.style.overflow = 'hidden';
    vShow(i);
    va.to(1, { damping: 0.9, response: 0.5 }); Loop.add(vAnim);
    document.getElementById('vwClose').focus({ preventScroll: true });
  }
  function vScrollOrigin(r) { vwScroll.style.transformOrigin = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`; }
  function vClose() { if (va.t === 0) return; va.to(0, { damping: 1, response: 0.4 }); Loop.add(vAnim); }
  vwPrev.addEventListener('click', () => vShow(vIdx - 1, -1));
  vwNext.addEventListener('click', () => vShow(vIdx + 1, 1));
  document.getElementById('vwClose').addEventListener('click', vClose);
  vw.addEventListener('click', e => { if (e.target === vwScroll || e.target.classList.contains('vw-stage')) vClose(); });
  addEventListener('keydown', e => {
    if (!vw.classList.contains('open') || va.t === 0) return;
    if (e.key === 'Escape') vClose();
    if (e.key === 'ArrowRight' && vList.length > 1) vShow(vIdx + 1, 1);
    if (e.key === 'ArrowLeft' && vList.length > 1) vShow(vIdx - 1, -1);
  });

  document.querySelectorAll('.showcase').forEach(b => b.addEventListener('click', () =>
    vOpen(JSON.parse(b.dataset.pages), 0, `${b.dataset.title} <em>e-commerce</em>`, b)));
  const allPages = [...document.querySelectorAll('.pg img')].map((im, k) => ({ src: im.getAttribute('src'), label: 'Página ' + (k + 1) }));
  document.querySelectorAll('.pg').forEach((pg, k) => {
    pg.querySelector('.pg-open').addEventListener('click', () => vOpen(allPages, k, 'Páginas de <em>venda</em>', pg));
    pg.querySelector('.pg-scroll img').addEventListener('click', () => vOpen(allPages, k, 'Páginas de <em>venda</em>', pg));
  });
}
