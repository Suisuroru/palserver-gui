export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <a
          className="flogo"
          href="https://iosoftware.ai"
          aria-label="io software 官方網站"
        >
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
          由{' '}
          <a className="pal" style={{ fontWeight: 700 }} href="https://github.com/Dalufishe">
            Eason Lu (Dalufish)
          </a>{' '}
          與核心團隊用愛製作 ·{' '}
          <a className="pal" style={{ fontWeight: 700 }} href="https://iosoftware.ai">
            io software
          </a>
        </p>
        <span>
          palserver GUI 2.0 · 開源免費 · 僅限非商業使用(PolyForm Noncommercial), 不得用於營利
        </span>
      </div>
    </footer>
  );
}
