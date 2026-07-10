import Shot from './Shot';
import { Check } from './icons';

type Feature = {
  kick: string;
  title: string;
  body: React.ReactNode;
  bullets?: string[];
  shot: { src: string; alt: string; label: string; width: number; height: number };
  reverse?: boolean;
};

const FEATURES: Feature[] = [
  {
    kick: 'Dashboard',
    title: '所有伺服器, 一眼掌握',
    body: '每台的狀態、原味/強化、遊戲埠、可更新提示都在卡片上, 點進去就是完整管理。',
    shot: { src: '/assets/dashboard.jpg', alt: 'palserver GUI 伺服器列表', label: '伺服器列表', width: 1320, height: 848 },
  },
  {
    kick: 'Settings & Tuning',
    title: '設定與引擎微調, 附白話說明',
    body: (
      <>
        世界規則、經驗倍率、掉落、PvP 全部有中文標籤與提示; 進階玩家想調的
        <span className="pal">引擎參數</span>也備好預設組合, 一鍵套用。
      </>
    ),
    bullets: ['每一項都告訴你調高調低會怎樣', '寫檔保留你手動加的設定'],
    shot: { src: '/assets/engine.jpg', alt: '引擎微調與效能預設', label: '引擎微調', width: 1320, height: 848 },
    reverse: true,
  },
  {
    kick: 'Mods',
    title: '反外掛與模組, 一鍵管理',
    body: '反外掛與模組載入器一鍵裝、更新、移除, 還會提醒「遊戲改版後模組可能暫時失效」。模組直接在畫面上開關。',
    shot: { src: '/assets/mods.jpg', alt: '模組安裝與管理', label: '模組管理', width: 1320, height: 848 },
  },
  {
    kick: 'Performance',
    title: '即時效能, 走勢一目了然',
    body: 'CPU、記憶體、運行時間, 加上伺服器流暢度指標, 配上即時走勢圖。撐不住的時候, 你會第一個知道。',
    shot: { src: '/assets/performance.jpg', alt: '效能分析與即時走勢', label: '效能分析', width: 1300, height: 835 },
    reverse: true,
  },
  {
    kick: 'World settings',
    title: '80+ 世界參數, 不用開檔案',
    body: '難度、資源、繁殖、據點、傷害倍率……全部整理成分類、附說明的表單, 改完提示你重啟生效。存檔損壞還會偵測並一鍵重建。',
    shot: { src: '/assets/world.jpg', alt: '世界設定編輯器', label: '世界設定', width: 1320, height: 848 },
  },
  {
    kick: 'Multi-device',
    title: '換裝置、邀朋友, 一頁搞定',
    body: '設定頁幫你準備好「一鍵登入連結」, 複製給手機或另一台電腦, 點開就能連; 也能一鍵清除瀏覽器暫存重連。',
    shot: { src: '/assets/settings-modal.jpg', alt: '設定頁與多裝置連線', label: '在其他裝置連線', width: 1320, height: 1012 },
    reverse: true,
  },
];

export default function Features() {
  return (
    <section id="features">
      <div className="wrap">
        <div className="col">
          <p className="eyebrow">功能巡禮</p>
          <h2>從開服到救火, 一頁全包。</h2>
          <p className="sec-lead">
            每一台伺服器點進去就是完整面板:總覽、效能、玩家、地圖、指令、設定、引擎、模組、備份、自動重啟、日誌——12
            個分頁一行排開。
          </p>
        </div>
        <div className="feat">
          {FEATURES.map((f) => (
            <div className={`frow reveal${f.reverse ? ' rev' : ''}`} key={f.kick}>
              <div className="txt">
                <p className="kick">{f.kick}</p>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
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
              <Shot {...f.shot} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
