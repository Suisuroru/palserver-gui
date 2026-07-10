import { GitHubIcon } from './icons';

export default function ClosingCta() {
  return (
    <section>
      <div className="wrap">
        <div className="close reveal">
          <p className="eyebrow">開始吧</p>
          <h2>把開伺服器的麻煩, 交給 palserver GUI。</h2>
          <p className="sec-lead" style={{ margin: '0 auto 26px' }}>
            完全免費、開源。喜歡的話到 GitHub 給顆星、到 Discord 一起聊。
          </p>
          <div className="cta" style={{ marginTop: 0 }}>
            <a className="btn btn-p" href="https://github.com/io-software-ai/palserver-gui/releases">
              免費下載
            </a>
            <a className="btn btn-g" href="https://github.com/io-software-ai/palserver-gui">
              <GitHubIcon />
              GitHub
            </a>
            <a className="btn btn-g" href="https://discord.gg/sgMMdUZd3V">
              Discord
            </a>
          </div>
          <div className="note">
            不想自己顧?我們也提供{' '}
            <a className="pal" style={{ fontWeight: 800 }} href="https://iosoftware.ai/server-maintain-service">
              遊戲伺服器代管維護服務
            </a>
            ——版本更新、備份、崩潰救援交給我們。
          </div>
        </div>
      </div>
    </section>
  );
}
