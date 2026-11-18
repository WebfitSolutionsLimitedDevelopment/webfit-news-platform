/**
 * Light canvas effect drawn inside the masthead band only: rain streaks,
 * snow, sleet, or a few seasonal leaves or petals on calm days. It never
 * takes clicks (pointer-events: none), runs at about 30 frames a second and
 * pauses when the tab is hidden or the masthead has scrolled out of view. It
 * is not started at all for people who ask their device to reduce motion.
 */
export type FxKind = 'rain' | 'drizzle' | 'storm' | 'sleet' | 'snow' | 'leaves' | 'petals';

type P = { x: number; y: number; vx: number; vy: number; size: number; spin: number; angle: number; tint: number };

const DENSITY: Record<FxKind, number> = { drizzle: 45, rain: 85, storm: 140, sleet: 70, snow: 55, leaves: 9, petals: 12 };
const LEAF = ['#b5651d', '#c9822b', '#9a4a1c', '#d4a03a'];
const PETAL = ['#f6c6d4', '#fbe1e8', '#f3b0c3', '#ffffff'];

export function startWeatherFx(canvas: HTMLCanvasElement, kind: FxKind, wind: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const dpr = Math.min(1.5, window.devicePixelRatio || 1);
  let w = 0, h = 0, raf = 0, last = 0, stopped = false;
  const lean = Math.max(-0.45, Math.min(0.45, wind / 30)); // sideways drift from wind speed
  const parts: P[] = [];

  function resize() {
    w = canvas.clientWidth || window.innerWidth; h = canvas.clientHeight || 300;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.round(DENSITY[kind] * Math.min(1.6, (w / 1280) * (h / 150)) + (kind === 'leaves' || kind === 'petals' ? 3 : 10));
    while (parts.length < target) parts.push(spawn(true));
    parts.length = target;
  }

  function spawn(anywhere: boolean): P {
    const falling = kind === 'rain' || kind === 'drizzle' || kind === 'storm';
    const speed = kind === 'storm' ? 15 : kind === 'rain' ? 11 : kind === 'drizzle' ? 7 : kind === 'sleet' ? 6 : kind === 'snow' ? 1.1 : 0.9;
    const vy = speed * (0.75 + Math.random() * 0.5);
    return {
      x: Math.random() * (w + 200) - 100,
      y: anywhere ? Math.random() * h : -20 - Math.random() * 60,
      vx: vy * lean + (falling ? 0 : (Math.random() - 0.5) * 0.6),
      vy,
      size: falling ? 8 + Math.random() * (kind === 'drizzle' ? 6 : 14) : kind === 'snow' ? 1.8 + Math.random() * 2.6 : kind === 'sleet' ? 1.5 : 5 + Math.random() * 5,
      spin: (Math.random() - 0.5) * 0.04,
      angle: Math.random() * Math.PI * 2,
      tint: Math.floor(Math.random() * 4),
    };
  }

  function draw(p: P) {
    if (kind === 'rain' || kind === 'drizzle' || kind === 'storm' || kind === 'sleet') {
      const len = kind === 'sleet' ? 5 : p.size;
      ctx!.moveTo(p.x, p.y);
      ctx!.lineTo(p.x - (p.vx / p.vy) * len, p.y - len);
      return;
    }
    if (kind === 'snow') {
      ctx!.moveTo(p.x + p.size, p.y);
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      return;
    }
    // Leaves and petals: a small rotated ellipse.
    ctx!.save();
    ctx!.translate(p.x, p.y);
    ctx!.rotate(p.angle);
    ctx!.fillStyle = (kind === 'leaves' ? LEAF : PETAL)[p.tint];
    ctx!.beginPath();
    ctx!.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.restore();
  }

  function frame(t: number) {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    if (t - last < 33) return; // about 30 fps is plenty and saves battery
    const step = Math.min(3, (t - last) / 16.7 || 1);
    last = t;
    ctx!.clearRect(0, 0, w, h);
    const lines = kind !== 'snow' && kind !== 'leaves' && kind !== 'petals';
    if (lines) {
      ctx!.strokeStyle = kind === 'sleet' ? 'rgba(235,242,250,.75)' : 'rgba(84,108,134,.55)';
      ctx!.lineWidth = kind === 'storm' ? 1.3 : 1;
      ctx!.lineCap = 'round';
      ctx!.beginPath();
    } else if (kind === 'snow') {
      ctx!.fillStyle = 'rgba(255,255,255,.92)';
      ctx!.shadowColor = 'rgba(80,100,130,.35)';
      ctx!.shadowBlur = 2;
      ctx!.beginPath();
    }
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.y += p.vy * step;
      p.x += p.vx * step + (lines ? 0 : Math.sin((t / 1000 + i) * (kind === 'snow' ? 0.8 : 1.4)) * 0.5 * step);
      p.angle += p.spin * step;
      if (p.y > h + 30 || p.x < -120 || p.x > w + 120) parts[i] = spawn(false);
      draw(parts[i]);
    }
    if (lines) ctx!.stroke();
    else if (kind === 'snow') ctx!.fill();
  }

  let onScreen = true;
  function sync() {
    const run = onScreen && !document.hidden && !stopped;
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
    else if (run && !raf) { last = 0; raf = requestAnimationFrame(frame); }
  }
  const sizeWatch = new ResizeObserver(resize);
  const viewWatch = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });

  resize();
  sizeWatch.observe(canvas);
  viewWatch.observe(canvas);
  document.addEventListener('visibilitychange', sync);
  raf = requestAnimationFrame(frame);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    sizeWatch.disconnect();
    viewWatch.disconnect();
    document.removeEventListener('visibilitychange', sync);
    ctx.clearRect(0, 0, w, h);
  };
}
