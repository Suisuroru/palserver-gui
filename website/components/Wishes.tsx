import { Check } from './icons';

export type Wish = { q: string; head: string; body: string };

/** 也用來產生 FAQPage JSON-LD(見 app/page.tsx)。 */
export const WISHES: Wish[] = [
  {
    q: '能不能把既有的存檔導進去?',
    head: '存檔遷移',
    body: '——別台專用伺服器、v1 舊版、本機四人邀請碼存檔都能接管。',
  },
  {
    q: '好怕存檔壞掉…',
    head: '備份排程 + 一鍵還原',
    body: ', 還會偵測存檔損壞並協助重建。',
  },
  {
    q: '想開伺服器玩模組',
    head: '反外掛與模組一鍵',
    body: '安裝、更新、移除, 模組在畫面上直接開關。',
  },
  {
    q: '死亡掉落、孵化時間也能調嗎?',
    head: '80+ 世界參數視覺化',
    body: ', 分類、附說明, 不用再開設定檔。',
  },
  {
    q: '朋友延遲太高連不進來',
    head: 'VPN 一鍵邀請',
    body: ', 或選公司的 IP 直連設定服務。',
  },
  {
    q: '不想每次都打一長串指令更新',
    head: '版本檢查 + 一鍵更新',
    body: ', 零指令。',
  },
];

export default function Wishes() {
  return (
    <section aria-label="社群需求與回應">
      <div className="wrap">
        <div className="col">
          <p className="eyebrow">社群一路陪著長大</p>
          <h2>你許願的, 我們都做了。</h2>
          <p className="sec-lead">
            palserver GUI 從一個「懶得改設定檔」的小工具開始, 這兩年社群提的需求, 一個一個補上。
          </p>
        </div>
        <div className="wishg">
          {WISHES.map((w) => (
            <div className="wish reveal" key={w.q}>
              <div className="q">「{w.q}」</div>
              <div className="a">
                <Check />
                <span>
                  <b>{w.head}</b>
                  {w.body}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
