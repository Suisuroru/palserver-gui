import Shot from './Shot';

export default function NiceDetails() {
  return (
    <section className="band">
      <div className="wrap">
        <div className="col">
          <p className="eyebrow">細節控的貼心</p>
          <h2>連「開場白」都幫你想好了。</h2>
          <p className="sec-lead">
            內建公告系統、存檔損壞偵測與一鍵重建、自動重啟(排程 / 記憶體門檻 /
            崩潰救援)、玩家 ID 全站打碼、線上地圖、三語介面與深淺色——很多你之後才會感謝的小地方。
          </p>
        </div>
        <Shot
          src="/assets/announcement.jpg"
          alt="palserver GUI 內建公告系統"
          label="公告系統"
          width={1320}
          height={984}
        />
      </div>
    </section>
  );
}
