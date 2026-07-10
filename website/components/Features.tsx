import Shot from './Shot';
import { Check } from './icons';
import type { Dictionary } from '@/i18n/dictionaries';

/** 每個功能對應的截圖與版面(圖片檔、尺寸、左右交錯、技術小標),文字則來自字典。 */
const SHOTS: { kick: string; src: string; width: number; height: number; reverse?: boolean }[] = [
  { kick: 'Dashboard', src: '/assets/dashboard.jpg', width: 1320, height: 848 },
  { kick: 'Settings & Tuning', src: '/assets/engine.jpg', width: 1320, height: 848, reverse: true },
  { kick: 'Mods', src: '/assets/mods.jpg', width: 1320, height: 848 },
  { kick: 'Performance', src: '/assets/performance.jpg', width: 1300, height: 835, reverse: true },
  { kick: 'World settings', src: '/assets/world.jpg', width: 1320, height: 848 },
  { kick: 'Multi-device', src: '/assets/settings-modal.jpg', width: 1320, height: 1012, reverse: true },
];

export default function Features({ d }: { d: Dictionary['features'] }) {
  return (
    <section id="features">
      <div className="wrap">
        <div className="col">
          <p className="eyebrow">{d.eyebrow}</p>
          <h2>{d.h2}</h2>
          <p className="sec-lead">{d.lead}</p>
        </div>
        <div className="feat">
          {d.items.map((f, i) => {
            const s = SHOTS[i];
            return (
              <div className={`frow reveal${s.reverse ? ' rev' : ''}`} key={s.kick}>
                <div className="txt">
                  <p className="kick">{s.kick}</p>
                  <h3>{f.title}</h3>
                  <p>
                    {f.bodyPre}
                    {f.bodyEmph && <span className="pal">{f.bodyEmph}</span>}
                    {f.bodyPost}
                  </p>
                  {f.bullets && (
                    <ul>
                      {f.bullets.map((b) => (
                        <li key={b}>
                          <Check />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Shot src={s.src} alt={f.alt} label={f.label} width={s.width} height={s.height} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
