// Shared between DOM and the render loop without re-rendering React every frame.
// s = target stage (from scrollbar), v = smoothed stage used for animation.
export const scroll = { s: 0, v: 0 };

// Heavy, inertial page scroll: wheel input moves a target, the page eases toward it
// and keeps drifting after the wheel stops. Touch, keyboard, scrollbar drag and
// anchor links stay native; we just resync to wherever they put the page.
const EASE = 0.07;   // lower = heavier / longer glide
export function initHeavyScroll() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  let cur = scrollY, target = scrollY, raf = 0;
  const max = () => document.documentElement.scrollHeight - innerHeight;
  const jump = (y) => scrollTo({ top: y, behavior: 'instant' });   // CSS scroll-behavior:smooth would otherwise re-animate every frame

  const tick = () => {
    cur += (target - cur) * EASE;
    if (Math.abs(target - cur) < 0.1) cur = target;
    jump(cur);
    raf = cur === target ? 0 : requestAnimationFrame(tick);
  };
  const onWheel = (e) => {
    if (e.defaultPrevented || e.ctrlKey) return;   // OrbitControls zoom / pinch-zoom handle their own
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
    target = Math.min(max(), Math.max(0, target + e.deltaY * unit));
    raf ||= requestAnimationFrame(tick);
  };
  const onScroll = () => {   // moved by something other than us: follow it
    if (Math.abs(scrollY - cur) > 2) { cancelAnimationFrame(raf); raf = 0; cur = target = scrollY; }
  };
  addEventListener('wheel', onWheel, { passive: false });
  addEventListener('scroll', onScroll, { passive: true });
  return () => { removeEventListener('wheel', onWheel); removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
}
