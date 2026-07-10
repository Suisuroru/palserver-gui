'use client';

import { useEffect, useRef } from 'react';

const STATS: { value: number | string; label: string }[] = [
  { value: 0, label: '需要記的指令' },
  { value: 12, label: '管理分頁, 一頁包辦' },
  { value: 3, label: '介面語言' },
  { value: '免費', label: '開源 · 非商業用途' },
];

/** 數字帶:進入視野時 count-up + 依序彈入。預渲染 HTML 直接是最終數值, SEO 不受影響。 */
export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          const el = e.target as HTMLElement;
          const target = Number(el.dataset.target);
          const t0 = performance.now();
          const dur = 900;
          const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / dur);
            el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    root.querySelectorAll<HTMLElement>('b[data-target]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section aria-label="重點數字">
      <div className="wrap">
        <div className="stats reveal" ref={ref}>
          {STATS.map((s) => (
            <div className="stat" key={s.label}>
              {typeof s.value === 'number' ? (
                <b data-target={s.value}>{s.value}</b>
              ) : (
                <b>{s.value}</b>
              )}
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
