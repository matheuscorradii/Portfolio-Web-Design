/* ---------- Spring engine ----------
   Apple-style params: damping ratio (1 = critically damped) + response (s).
   Springs always continue from their live value + velocity, so any
   re-target mid-flight is seamless (interruptible by construction). */
export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export class Spring {
  constructor(x = 0, o) { this.x = this.t = x; this.v = 0; this.cfg(o); }
  cfg({ damping = 1, response = 0.4 } = {}) {
    this.k = (2 * Math.PI / response) ** 2;
    this.c = 4 * Math.PI * damping / response;
    return this;
  }
  to(t, o) { this.t = t; if (o) this.cfg(o); return this; }
  snap(x) { this.x = this.t = x; this.v = 0; }
  step(dt) {
    const n = Math.ceil(dt / 0.004), h = dt / n;
    for (let i = 0; i < n; i++) {
      this.v += (-this.k * (this.x - this.t) - this.c * this.v) * h;
      this.x += this.v * h;
    }
  }
  get rest() { return Math.abs(this.x - this.t) < 1e-3 && Math.abs(this.v) < 1e-2; }
}
export const Loop = {
  set: new Set(), last: 0, raf: 0,
  add(a) {
    this.set.add(a);
    if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(Loop.tick); }
  },
  tick(now) {
    const dt = Math.min((now - Loop.last) / 1000, 1 / 30); Loop.last = now;
    for (const a of Loop.set) {
      let rest = true;
      for (const s of a.springs) { s.step(dt); if (!s.rest) rest = false; }
      if (rest) a.springs.forEach(s => s.snap(s.t));
      a.render();
      if (rest) { Loop.set.delete(a); a.done && a.done(); }
    }
    Loop.raf = Loop.set.size ? requestAnimationFrame(Loop.tick) : 0;
  }
};
export const anim = (springs, render, done) => { const a = { springs, render, done }; return () => Loop.add(a); };
export const clamp01 = v => Math.min(1, Math.max(0, v));
