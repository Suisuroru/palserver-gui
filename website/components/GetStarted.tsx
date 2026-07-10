import Shot from './Shot';

const STEPS = [
  { title: '下載', body: '到下載頁抓對應你系統的檔案, 解壓縮就好。' },
  { title: '雙擊執行', body: '視窗會顯示你的管理網址, 和邀請朋友用的連結, 讓它開著就好。' },
  { title: '打開瀏覽器', body: '點視窗裡的管理網址, 進入畫面, 開你的第一台伺服器。' },
];

export default function GetStarted() {
  return (
    <section id="start">
      <div className="wrap">
        <div className="col">
          <p className="eyebrow">三步開始</p>
          <h2>下載、執行、打開瀏覽器。</h2>
          <p className="sec-lead">不用先裝任何環境、不用碰命令列。免安裝執行檔把需要的都包好了。</p>
        </div>
        <div className="steps">
          {STEPS.map((s) => (
            <div className="step reveal" key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 34 }}>
          <Shot
            src="/assets/login.jpg"
            alt="palserver GUI 首次連線與配對畫面"
            label="第一次連線"
            width={1320}
            height={984}
          />
        </div>
        <figcaption>換裝置或幫朋友設定?把設定連結傳過去, 點一下就連上——不用手動輸入一長串密碼。</figcaption>
      </div>
    </section>
  );
}
