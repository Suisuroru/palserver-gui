import Shot from './Shot';
import type { Dictionary } from '@/i18n/dictionaries';

export default function GetStarted({ d }: { d: Dictionary['getStarted'] }) {
  return (
    <section id="start">
      <div className="wrap">
        <div className="col">
          <p className="eyebrow">{d.eyebrow}</p>
          <h2>{d.h2}</h2>
          <p className="sec-lead">{d.lead}</p>
        </div>
        <div className="steps">
          {d.steps.map((s) => (
            <div className="step reveal" key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 34 }}>
          <Shot src="/assets/login.jpg" alt={d.shotAlt} label={d.shotLabel} width={1320} height={984} />
        </div>
        <figcaption>{d.figcaption}</figcaption>
      </div>
    </section>
  );
}
