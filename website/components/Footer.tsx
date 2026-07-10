import type { Dictionary } from '@/i18n/dictionaries';

export default function Footer({ d }: { d: Dictionary['footer'] }) {
  return (
    <footer>
      <div className="wrap">
        <a className="flogo" href="https://iosoftware.ai" aria-label="io software">
          <img
            src="/assets/iosoftware-logo.svg"
            alt="io software"
            width={168}
            height={84}
            loading="lazy"
            draggable={false}
          />
        </a>
        <p>
          {d.madePre}
          <a className="pal" style={{ fontWeight: 700 }} href="https://github.com/Dalufishe">
            Eason Lu (Dalufish)
          </a>
          {d.madeMid}
          <a className="pal" style={{ fontWeight: 700 }} href="https://iosoftware.ai">
            io software
          </a>
        </p>
        <span>{d.license}</span>
      </div>
    </footer>
  );
}
