import { RM, Spring, anim, clamp01 } from './spring.js';

export function initLightbox() {
  /* ---------- Lightbox: shared-element transition ---------- */
  const lb = document.getElementById('lightbox');
  const lbFrame = document.getElementById('lbFrame');
  const lbImg = document.getElementById('lbImg');
  const lp = new Spring(0, { response: 0.55 });
  let srcImg = null, geo = null;

  function measure() {
    const S = srcImg.closest('.gi').getBoundingClientRect();
    lbFrame.style.transform = 'none'; lbImg.style.clipPath = 'none';
    const F = lbImg.getBoundingClientRect();
    const s = Math.max(S.width / F.width, S.height / F.height);      // "cover" the card
    geo = {
      s,
      dx: S.left + S.width / 2 - (F.left + F.width / 2),
      dy: S.top + S.height / 2 - (F.top + F.height / 2),
      ix: Math.max(0, (F.width - S.width / s) / 2),
      iy: Math.max(0, (F.height - S.height / s) / 2)
    };
  }
  const kickLb = anim([lp], () => {
    const p = lp.x, q = 1 - p, a = clamp01(p);
    lb.style.setProperty('--a', a);
    if (RM) { lbFrame.style.opacity = a; return; }
    const z = Math.sin(Math.PI * a) * 70;                           // arc toward the camera mid-flight
    lbFrame.style.transform =
      `translate3d(${geo.dx * q}px, ${geo.dy * q}px, 0) perspective(1000px) translateZ(${z}px) scale(${1 + (geo.s - 1) * q})`;
    lbImg.style.clipPath = `inset(${geo.iy * q}px ${geo.ix * q}px round ${(6 / geo.s) * q + 10 * p}px)`;
  }, () => {
    if (lp.t === 0) {
      lb.classList.remove('open');
      if (srcImg) srcImg.style.visibility = '';
      lbFrame.style.transform = lbImg.style.clipPath = lbFrame.style.opacity = '';
      srcImg = null;
    }
  });

  function openLb(img) {
    if (srcImg && srcImg !== img) srcImg.style.visibility = '';
    srcImg = img;
    lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt;
    // size from the card image's natural ratio so geometry is known before decode
    const maxW = Math.min(innerWidth * 0.9, 1000, innerWidth - 80), maxH = Math.min(innerHeight * 0.86, innerHeight - 80);
    const card = img.closest('.gi').getBoundingClientRect();
    const nw = img.naturalWidth || card.width, nh = img.naturalHeight || card.height;   // not decoded yet → card ratio
    const k = Math.min(maxW / nw, maxH / nh);
    lbImg.style.width = nw * k + 'px'; lbImg.style.height = nh * k + 'px';
    lb.classList.add('open'); lb.style.pointerEvents = '';
    measure();
    img.style.visibility = 'hidden';
    lp.to(1, { damping: 0.86, response: 0.55 }); kickLb();
  }
  function closeLb() {
    if (!srcImg || lp.t === 0) return;
    measure();                                                     // card may have moved (scroll/resize)
    lb.style.pointerEvents = 'none';
    lp.to(0, { damping: 1, response: 0.45 }); kickLb();
  }
  document.querySelectorAll('.gi img').forEach(img => img.addEventListener('click', () => openLb(img)));
  document.getElementById('lbClose').addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb || e.target === lbImg) closeLb(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
}
