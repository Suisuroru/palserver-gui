import Shot from './Shot';

export default function Hero() {
  return (
    <header id="top">
      <div className="wrap">
        <p className="eyebrow">開源 · 免費 · 帕魯專用伺服器管理</p>
        <h1>
          <span className="pal">一鍵</span>開一台帕魯伺服器。
          <br />
          零指令、零設定檔。
        </h1>
        <p className="sub">
          palserver GUI 把開服、改設定、備份、邀朋友、救崩潰, 全部變成畫面上的按鈕。
          裝在放伺服器的電腦上, 手機、平板、電腦打開網頁就能管理——人在外面, 也能一鍵重開伺服器。
        </p>
        <div className="cta">
          <a className="btn btn-p" href="https://github.com/io-software-ai/palserver-gui/releases">
            免費下載
          </a>
          <a className="btn btn-g" href="#features">
            看看能做什麼
          </a>
        </div>
        <div className="chips">
          <span className="chip">
            <b>免安裝</b> 下載就能用
          </span>
          <span className="chip">
            本機管理 <b>免密碼</b>
          </span>
          <span className="chip">
            手機平板 <b>都能管</b>
          </span>
          <span className="chip">中／英／日 · 深淺色</span>
        </div>
        <div className="hero-shot">
          <Shot
            src="/assets/overview.jpg"
            alt="palserver GUI 伺服器總覽畫面:狀態、玩家、效能一目了然"
            label="palserver GUI"
            width={1320}
            height={848}
            priority
          />
        </div>
      </div>
    </header>
  );
}
