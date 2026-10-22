import { RM, Spring, anim, clamp01 } from './spring.js';

export function initNotebook() {
  /* ---------- Notebook: abertura / fechamento da galeria ----------
     Uma linha do tempo P (0 = fechado … 1 = tela tomando a página).
     Abertura: P segue o scroll. Fechamento: a mesma linha, ao contrário.
     Celular / movimento reduzido: sem scroll travado — uma spring leva
     o notebook até "aberto" quando ele aparece, e fecha no final. */
  (() => {
    const docEl = document.documentElement;
    const mq = matchMedia('(max-width: 760px)');
    const setVW = () => docEl.style.setProperty('--vw', docEl.clientWidth + 'px');
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const seg = (p, a, b) => clamp01((p - a) / (b - a));
    const lerp = (a, b, t) => a + (b - a) * t;
    const LITE_OPEN = 0.56;

    const rigs = [...document.querySelectorAll('[data-mac]')].map(box => {
      const r = {
        box, out: box.dataset.mac === 'out',
        stage: box.querySelector('.mac-stage'),
        scene: box.querySelector('.mac-scene'),
        mac: box.querySelector('.mac'),
        lid: box.querySelector('.mac-lid'),
        deck: box.querySelector('.mac-deck'),
        screen: box.querySelector('.mac-screen'),
        cap: box.querySelector('.mac-cap'),
        white: box.querySelector('.mac-white'),
        pops: [...box.querySelectorAll('[data-pop]')],
        Z: null, P: -1,
      };
      return r;
    });

    let lite = false;
    const lidT = (r, a) => {
      const mw = r.scene.offsetWidth;
      return `translateY(${-mw * 0.004}px) translateZ(${-mw * 0.69}px) rotateX(${a}deg)`;
    };

    function measure(r) {
      r.scene.style.transform = 'none';
      r.mac.style.transform = 'none';
      r.lid.style.transform = lidT(r, 0);
      const S = r.scene.getBoundingClientRect(), R = r.screen.getBoundingClientRect(), V = r.stage.getBoundingClientRect();
      r.Z = {
        sl: S.left, st: S.top,
        cx: R.left + R.width / 2, cy: R.top + R.height / 2,
        vx: V.left + V.width / 2, vy: V.top + V.height / 2,
        s: Math.max(V.width / R.width, V.height / R.height) * 1.06,
      };
      r.P = -1;
    }

    function render(r, P) {
      if (Math.abs(P - r.P) < 1e-4) return;
      r.P = P;
      const a = -90 * (1 - ease(seg(P, 0.06, 0.5)));          // tampa: fechada → aberta
      const tilt = 18 * (1 - ease(seg(P, 0.4, 0.8)));        // câmera de cima → de frente
      const e = lite ? 0 : ease(seg(P, 0.5, 0.93));          // zoom até a tela cobrir tudo
      const on = ease(seg(P, 0.16, 0.34));                   // tela "acende"
      // conteúdo some → branco puro (no fechamento, quase sem tela branca)
      const fade = r.out ? 1 - seg(P, 0.93, 0.97) : 1 - seg(P, 0.74, 0.9);

      const n = r.pops.length;
      const pops = r.pops.map((el, i) => {
        // fechamento: textos ficam até a tampa começar a fechar e somem rápido
        const st = r.out ? 0.36 + i * 0.04 : 0.24 + i * (0.2 / Math.max(1, n - 1));
        return ease(seg(P, st, st + (r.out ? 0.1 : 0.14)));
      });

      if (r.white) r.white.style.opacity = lite ? 0 : r.out ? seg(P, 0.96, 1) : seg(P, 0.86, 0.97);
      if (r.cap) {
        const c = lite ? 0 : seg(P, 0.14, 0.32);
        r.cap.style.opacity = 1 - c;
        r.cap.style.transform = `translate3d(0, ${-c * 50}px, 0)`;
      }

      if (r.gl) { r.gl.set({ open: 1 + a / 90, tilt: tilt / 18, e, on, fade, pops }); return; }

      r.mac.style.transform = `rotateX(${-tilt}deg)`;
      r.lid.style.transform = lidT(r, a);
      r.deck.style.opacity = a < -88 ? 0 : 1;
      r.box.style.setProperty('--on', on.toFixed(3));
      r.box.style.setProperty('--glass', (1 - e).toFixed(3));

      if (r.Z && e > 0) {
        const Z = r.Z, s = lerp(1, Z.s, e);
        const tx = lerp(Z.cx, Z.vx, e) - Z.sl - s * (Z.cx - Z.sl);
        const ty = lerp(Z.cy, Z.vy, e) - Z.st - s * (Z.cy - Z.st);
        r.scene.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
      } else r.scene.style.transform = '';

      r.pops.forEach((el, i) => {
        const t = pops[i];
        el.style.opacity = (t * fade).toFixed(3);
        el.style.transform = `translate3d(0, ${(1 - t) * 14}px, 0) scale(${0.94 + 0.06 * t})`;
      });
    }

    /* scroll-driven (desktop) */
    function onScroll() {
      const vh = innerHeight;
      if (!lite) rigs.forEach(r => {
        const b = r.box.getBoundingClientRect();
        const p = clamp01(-b.top / Math.max(1, b.height - vh));
        render(r, r.out ? 1 - p : p);
      });
      updateBar();
    }

    /* barra do "sistema": esconde a nav e mostra o case atual */
    const world = document.querySelector('.mac-world');
    const cases = world ? [...world.querySelectorAll('.case')] : [];
    const barIdx = world && world.querySelector('.mac-bar .idx');
    const barTtl = world && world.querySelector('.mac-bar .ttl');
    const barDots = world ? [...world.querySelectorAll('.mac-bar .dots i')] : [];
    let cur = -1, inMac = false;
    function updateBar() {
      if (!world) return;
      const wb = world.getBoundingClientRect();
      const now = wb.top <= 1 && wb.bottom > 60;
      if (now !== inMac) { inMac = now; docEl.classList.toggle('in-mac', now); }
      let k = 0;
      cases.forEach((c, i) => { if (c.getBoundingClientRect().top < innerHeight * 0.45) k = i; });
      if (k !== cur) {
        cur = k;
        const c = cases[k];
        const title = c.querySelector('.case-title').textContent.replace(/\s+/g, ' ').trim();
        barTtl.classList.add('swap');
        setTimeout(() => { barIdx.textContent = c.querySelector('.case-index').textContent; barTtl.textContent = title; barTtl.classList.remove('swap'); }, 160);
        barDots.forEach((d, i) => d.classList.toggle('on', i === k));
      }
    }

    /* modo leve (celular / reduced motion): spring dispara ao entrar na tela */
    const liteIO = new IntersectionObserver(entries => entries.forEach(en => {
      if (!lite || !en.isIntersecting) return;
      const r = en.target._rig; r.go && r.go();
    }), { threshold: 0.45 });
    rigs.forEach(r => {
      r.box._rig = r;
      const sp = new Spring(r.out ? LITE_OPEN : 0, { damping: 1, response: 1.6 });
      r.sp = sp;
      const kick = anim([sp], () => render(r, sp.x));
      r.go = () => {
        if (RM) { sp.snap(r.out ? 0 : LITE_OPEN); render(r, sp.x); return; }
        sp.to(r.out ? 0 : LITE_OPEN); kick();
      };
      liteIO.observe(r.scene);
    });
    rigs.forEach(r => { r.scene._rig = r; });

    function setup() {
      setVW();
      lite = mq.matches || RM;
      docEl.classList.toggle('mac-lite', lite);
      rigs.forEach(r => {
        if (lite) {
          r.Z = null; r.P = -1;
          render(r, r.sp.x);
        } else { measure(r); }
      });
      onScroll();
    }

    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => { ticking = false; onScroll(); });
    }, { passive: true });
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(setup, 120); });
    mq.addEventListener('change', setup);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setup);
    setup();

    // ganchos para o notebook 3D (módulo abaixo)
    window.macRigs = rigs;
    window.macRefresh = () => { rigs.forEach(r => { r.P = -1; if (lite) render(r, r.sp.x); }); onScroll(); };
  })();
}
