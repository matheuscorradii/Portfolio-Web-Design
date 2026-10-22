/* ---------- Notebook 3D (Three.js) ----------
   Notebook genérico modelado em geometria real: corpo em alumínio
   chanfrado, teclado com teclas individuais, trackpad, dobradiça e tela
   de vidro com reflexo. A tela é desenhada num canvas 2D a partir do
   HTML escondido em .scr (mesmo conteúdo, mesmas fontes).
   Se o WebGL/CDN falhar, o notebook em CSS continua como fallback. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const rigs = window.macRigs || [];
const deg = Math.PI / 180;
const W = 3.0, D = 2.06, BH = 0.07;            // base
const LW = 2.97, LH = 2.0, LT = 0.026;         // tampa
const SW = 2.86, SH = SW / 1.6, SY = 0.112 + SH / 2;   // tela
const PIVOT_Y = 0.01, OPEN = -14, FOV = 26;
const TX_W = 2048, TX_H = 1280;
const ACC = '#c4560a';
// aberto via file:// as imagens "sujam" o canvas e o WebGL recusa a textura
const NO_IMG = location.protocol === 'file:';

function rrect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// placa com cantos arredondados e bordas chanfradas, espessura em z (0 → t)
function slab(w, h, r, t, bev) {
  const g = new THREE.ExtrudeGeometry(rrect(w - 2 * bev, h - 2 * bev, Math.max(.001, r - bev)), {
    depth: t - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 5, curveSegments: 20,
  });
  g.translate(0, 0, bev);
  return g;
}

function buildLaptop() {
  const alu = new THREE.MeshPhysicalMaterial({ color: 0xc9cbd0, metalness: 1, roughness: .32 });
  const aluTop = new THREE.MeshPhysicalMaterial({ color: 0xbdbfc4, metalness: 1, roughness: .4 });
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x151517, metalness: .15, roughness: .62 });
  const wellMat = new THREE.MeshStandardMaterial({ color: 0x2b2c2f, metalness: .5, roughness: .55 });
  const padMat = new THREE.MeshPhysicalMaterial({ color: 0xb7b9be, metalness: .85, roughness: .2 });
  const bezelMat = new THREE.MeshPhysicalMaterial({ color: 0x060607, roughness: .14, clearcoat: 1, clearcoatRoughness: .04 });
  const hingeMat = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, metalness: .7, roughness: .4 });

  const laptop = new THREE.Group();

  // base
  const base = new THREE.Mesh(slab(W, D, .15, BH, .022), alu);
  base.rotation.x = -Math.PI / 2; base.position.y = -BH;
  laptop.add(base);
  const deckTop = new THREE.Mesh(new THREE.ShapeGeometry(rrect(W - .05, D - .05, .13), 24), aluTop);
  deckTop.rotation.x = -Math.PI / 2; deckTop.position.y = .0004;
  laptop.add(deckTop);

  // teclado
  const kbZ = -D / 2 + .17, kbW = 2.5, u = kbW / 14.5, gap = .022;
  const rows = [
    { w: [...Array(13).fill(1), 1.5], h: .55 },
    { w: [...Array(13).fill(1), 1.5] },
    { w: [1.5, ...Array(13).fill(1)] },
    { w: [1.75, ...Array(11).fill(1), 1.75] },
    { w: [2.25, ...Array(10).fill(1), 2.25] },
    { w: [1, 1, 1, 1.25, 5, 1.25, 1, 1, 1, 1] },
  ];
  const keys = [];
  let z = kbZ;
  rows.forEach(row => {
    const h = (row.h || 1) * u;
    let x = -kbW / 2;
    row.w.forEach(k => { keys.push([x + k * u / 2, z + h / 2, k * u - gap, h - gap]); x += k * u; });
    z += h;
  });
  const well = new THREE.Mesh(new THREE.ShapeGeometry(rrect(kbW + .05, z - kbZ + .05, .03), 8), wellMat);
  well.rotation.x = -Math.PI / 2; well.position.set(0, .0008, (kbZ + z) / 2);
  laptop.add(well);
  const keyGeo = new RoundedBoxGeometry(1, 1, 1, 2, .18);
  const keyMesh = new THREE.InstancedMesh(keyGeo, keyMat, keys.length);
  const m = new THREE.Matrix4();
  keys.forEach(([x, kz, w, d], i) => {
    m.compose(new THREE.Vector3(x, .001, kz), new THREE.Quaternion(), new THREE.Vector3(w, .008, d));
    keyMesh.setMatrixAt(i, m);
  });
  laptop.add(keyMesh);

  // trackpad
  const pad = new THREE.Mesh(new THREE.ShapeGeometry(rrect(1.3, .8, .05), 12), padMat);
  pad.rotation.x = -Math.PI / 2; pad.position.set(0, .0009, D / 2 - .14 - .4);
  laptop.add(pad);

  // dobradiça
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.3, 24), hingeMat);
  hinge.rotation.z = Math.PI / 2; hinge.position.set(0, -.012, -D / 2 + .025);
  laptop.add(hinge);

  // tampa (pivô na dobradiça)
  const lid = new THREE.Group();
  lid.position.set(0, PIVOT_Y, -D / 2 + .02);
  const lidBody = new THREE.Mesh(slab(LW, LH, .13, LT, .011), alu);
  lidBody.position.set(0, LH / 2, -LT);
  lid.add(lidBody);
  const bezel = new THREE.Mesh(new THREE.ShapeGeometry(rrect(LW - .03, LH - .03, .12), 24), bezelMat);
  bezel.position.set(0, LH / 2, .0006);
  lid.add(bezel);

  const tex = document.createElement('canvas');
  tex.width = TX_W; tex.height = TX_H;
  const map = new THREE.CanvasTexture(tex);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const screenMat = new THREE.MeshBasicMaterial({ map, color: 0x000000, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), screenMat);
  screen.position.set(0, SY, .0012);
  lid.add(screen);

  // vidro: só soma o reflexo do ambiente por cima da tela
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x000000, roughness: .05, transparent: true, opacity: .55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(rrect(LW - .03, LH - .03, .12), 24), glassMat);
  glass.position.set(0, LH / 2, .0018);
  lid.add(glass);
  laptop.add(lid);

  // sombra de contato
  const sh = document.createElement('canvas'); sh.width = sh.height = 256;
  const sx = sh.getContext('2d'), grd = sx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,.6)'); grd.addColorStop(.6, 'rgba(0,0,0,.25)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  sx.fillStyle = grd; sx.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.45, D * 1.5),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -BH - .002;
  laptop.add(shadow);

  return { laptop, lid, keys: keyMesh, screen, screenMat, glassMat, map, tex };
}

/* ---------- tela: redesenha o HTML de .scr num canvas ---------- */
const F_SANS = '"Archivo", system-ui, sans-serif', F_SERIF = '"Fraunces", serif';
function spacing(ctx, v) { if ('letterSpacing' in ctx) ctx.letterSpacing = v + 'px'; }

// texto rico: nós de texto em Archivo caixa-alta, <em> em Fraunces itálico laranja
function richParts(el) {
  return [...el.childNodes].map(nd => nd.nodeType === 3
    ? { t: nd.textContent.toUpperCase(), f: `800 SIZE ${F_SANS}`, c: '#1d1d1f', ls: -.035 }
    : { t: nd.textContent, f: `italic 400 SIZE ${F_SERIF}`, c: ACC, ls: 0 }).filter(p => p.t);
}
function drawRich(ctx, parts, x, y, size, align) {
  const font = p => p.f.replace('SIZE', size + 'px');
  const widths = parts.map(p => { ctx.font = font(p); spacing(ctx, p.ls * size); return ctx.measureText(p.t).width; });
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = align === 'center' ? x - total / 2 : x;
  ctx.textAlign = 'left';
  parts.forEach((p, i) => { ctx.font = font(p); spacing(ctx, p.ls * size); ctx.fillStyle = p.c; ctx.fillText(p.t, cx, y); cx += widths[i]; });
  spacing(ctx, 0);
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
// aplica a animação "pop" (sobe + escala + fade) em volta de um ponto
function pop(ctx, t, fade, cx, cy, draw) {
  const a = t * fade; if (a <= .002) return;
  ctx.save();
  ctx.globalAlpha = a;
  const s = .94 + .06 * t;
  ctx.translate(cx, cy + (1 - t) * 32); ctx.scale(s, s); ctx.translate(-cx, -cy);
  draw(); ctx.restore();
}

function makePainter(r, onDirty) {
  const scr = r.box.querySelector('.scr');
  const title = scr.querySelector('.scr-bar span').textContent;
  const fs = 29, barH = 62;
  let paint;

  if (!r.out) {
    const head = scr.querySelector('.scr-head');
    const headParts = richParts(head.querySelector('b'));
    const small = head.querySelector('small').textContent.toUpperCase();
    const figs = [...scr.querySelectorAll('.scr-grid figure')].map(f => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = onDirty;
      img.src = f.querySelector('img').getAttribute('src');
      const cap = f.querySelector('figcaption');
      return { img, a: cap.firstChild.textContent.trim(), b: cap.querySelector('span').textContent.trim() };
    });
    paint = (ctx, s) => {
      const px = TX_W * .05, top = barH + TX_W * .042, hs = fs * 2.3;
      pop(ctx, s.pops[0], s.fade, TX_W / 2, top + hs / 2, () => {
        ctx.textBaseline = 'alphabetic';
        drawRich(ctx, headParts, px, top + hs * .82, hs, 'left');
        ctx.font = `700 ${fs * .74}px ${F_SANS}`; spacing(ctx, fs * .074); ctx.fillStyle = '#86868b'; ctx.textAlign = 'right';
        ctx.fillText(small, TX_W - px, top + hs * .82); spacing(ctx, 0);
      });
      const gy = top + hs + TX_W * .034, g = TX_W * .016, cw = (TX_W - 2 * px - 4 * g) / 5, ch = cw * 5 / 4;
      figs.forEach((f, i) => {
        const x = px + i * (cw + g);
        pop(ctx, s.pops[i + 1], s.fade, x + cw / 2, gy + ch / 2, () => {
          ctx.save(); rr(ctx, x, gy, cw, ch, 13); ctx.clip();
          ctx.fillStyle = '#f2f2f4'; ctx.fillRect(x, gy, cw, ch);
          const im = f.img;
          if (!NO_IMG && im.complete && im.naturalWidth) {   // object-fit: cover; object-position: top
            const k = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
            const w = im.naturalWidth * k, h = im.naturalHeight * k;
            ctx.drawImage(im, x + (cw - w) / 2, gy, w, h);
          }
          ctx.restore();
          ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.lineWidth = 2; rr(ctx, x, gy, cw, ch, 13); ctx.stroke();
          ctx.textAlign = 'left'; ctx.fillStyle = '#1d1d1f';
          ctx.font = `700 ${fs * .78}px ${F_SANS}`; ctx.fillText(f.a, x, gy + ch + fs * 1.45);
          ctx.fillStyle = '#86868b'; ctx.font = `italic 400 ${fs * .78}px ${F_SERIF}`; ctx.fillText(f.b, x, gy + ch + fs * 2.45);
        });
      });
    };
  } else {
    const end = scr.querySelector('.scr-end');
    const small = end.querySelector('small').textContent.toUpperCase();
    const bigParts = richParts(end.querySelector('b'));
    const note = end.querySelector('span').textContent;
    paint = (ctx, s) => {
      const big = fs * 4.2, cy = barH + (TX_H - barH) / 2, cx = TX_W / 2;
      const y0 = cy - big * .5 - fs * 1.6, y1 = cy + big * .36, y2 = cy + big * .5 + fs * 2.1;
      ctx.textBaseline = 'alphabetic';
      pop(ctx, s.pops[0], s.fade, cx, y0, () => {
        ctx.font = `800 ${fs * .8}px ${F_SANS}`; spacing(ctx, fs * .096); ctx.fillStyle = ACC; ctx.textAlign = 'center';
        ctx.fillText(small, cx, y0); spacing(ctx, 0);
      });
      pop(ctx, s.pops[1], s.fade, cx, cy, () => drawRich(ctx, bigParts, cx, y1, big, 'center'));
      pop(ctx, s.pops[2], s.fade, cx, y2, () => {
        ctx.font = `500 ${fs * .9}px ${F_SANS}`; ctx.fillStyle = '#6e6e73'; ctx.textAlign = 'center';
        ctx.fillText(note, cx, y2);
      });
    };
  }

  return (ctx, s) => {
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, TX_W, TX_H);
    // barra de título
    ctx.fillStyle = '#f6f6f8'; ctx.fillRect(0, 0, TX_W, barH);
    ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(0, barH - 2, TX_W, 2);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(fs * 1.2 + 12 + i * 40, barH / 2, 12, 0, Math.PI * 2); ctx.fill();
    });
    ctx.font = `700 ${fs * .78}px ${F_SANS}`; ctx.fillStyle = '#6e6e73'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(title, TX_W / 2, barH / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    paint(ctx, s);
  };
}

/* ---------- um renderer por palco ---------- */
function createGL(r) {
  const canvas = document.createElement('canvas');
  canvas.className = 'mac-gl';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-3, 6, 5);
  scene.add(key);

  const L = buildLaptop();
  scene.add(L.laptop);
  const camera = new THREE.PerspectiveCamera(FOV, 1, .5, 60);
  const ctx = L.tex.getContext('2d');

  let state = null, raf = 0, texKey = '', imgTick = 0, size = '';
  const draw = makePainter(r, () => { imgTick++; queue(); });
  const T = new THREE.Vector3(0, .95, .05), pos0 = new THREE.Vector3(), pos1 = new THREE.Vector3(), tgt = new THREE.Vector3();
  const sc = new THREE.Vector3(), nrm = new THREE.Vector3(), q = new THREE.Quaternion();

  function frame() {
    raf = 0;
    if (!state) return;
    const s = state, stage = r.stage;
    const Wc = stage.clientWidth, Hc = stage.clientHeight;
    if (!Wc || !Hc) return;
    if (size !== Wc + 'x' + Hc) { size = Wc + 'x' + Hc; renderer.setSize(Wc, Hc, false); camera.aspect = Wc / Hc; }

    // tampa
    L.lid.rotation.x = (90 + (OPEN - 90) * s.open) * deg;
    L.keys.visible = s.open > .03;   // fechado: evita as teclas vazarem pela tampa
    L.screenMat.color.setScalar(s.on);
    L.glassMat.opacity = .55 * (1 - s.e);

    // conteúdo da tela
    const k = s.pops.map(v => v.toFixed(3)).join() + s.fade.toFixed(3) + imgTick;
    if (s.on > 0 && k !== texKey) { texKey = k; draw(ctx, s); L.map.needsUpdate = true; }

    // câmera: enquadra o notebook na caixa do .mac-scene, depois mergulha na tela
    const sb = r.scene.getBoundingClientRect(), st = stage.getBoundingClientRect();
    const cx = sb.left - st.left + sb.width / 2, cy = sb.top - st.top + sb.height / 2;
    const tanH = Math.tan(FOV * deg / 2);
    // escala: cabe na largura (3.0) e na altura do notebook aberto (~2.3) da caixa
    const d = Hc / (2 * tanH) * Math.max(W / sb.width, 2.3 / sb.height) * 1.02;
    const phi = (8 + 32 * s.tilt) * deg;
    pos0.set(0, Math.sin(phi) * d, Math.cos(phi) * d).add(T);

    const e = s.e;
    if (e > 0) {
      L.lid.updateMatrixWorld(true);
      L.screen.getWorldPosition(sc);
      L.lid.getWorldQuaternion(q);
      nrm.set(0, 0, 1).applyQuaternion(q);
      const dz = Math.min(SH / (2 * tanH), SW / (2 * tanH * camera.aspect)) / 1.06;
      pos1.copy(sc).addScaledVector(nrm, dz);
      camera.position.lerpVectors(pos0, pos1, e);
      tgt.lerpVectors(T, sc, e);
    } else { camera.position.copy(pos0); tgt.copy(T); }
    camera.lookAt(tgt);
    camera.setViewOffset(Wc, Hc, (Wc / 2 - cx) * (1 - e), (Hc / 2 - cy) * (1 - e), Wc, Hc);
    renderer.render(scene, camera);
  }
  function queue() { if (!raf) raf = requestAnimationFrame(frame); }

  r.scene.style.transform = r.mac.style.transform = r.lid.style.transform = '';
  r.stage.appendChild(canvas);
  r.stage.classList.add('gl');
  addEventListener('resize', queue);
  return { set(s) { state = s; queue(); } };
}

(async () => {
  if (!rigs.length) return;
  try {
    const test = document.createElement('canvas');
    if (!(test.getContext('webgl2') || test.getContext('webgl'))) return;
    if (document.fonts) {
      await Promise.all([
        document.fonts.load(`800 40px ${F_SANS}`), document.fonts.load(`700 40px ${F_SANS}`),
        document.fonts.load(`italic 400 40px ${F_SERIF}`),
      ]).catch(() => {});
    }
    rigs.forEach(r => { r.gl = createGL(r); });
    window.macRefresh && window.macRefresh();
  } catch (err) {
    console.warn('Notebook 3D indisponível, usando a versão CSS.', err);
    rigs.forEach(r => { r.gl = null; r.stage.classList.remove('gl'); r.stage.querySelector('.mac-gl')?.remove(); });
  }
})();
