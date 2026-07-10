import { Check, RocketIcon, WrenchIcon } from './icons';

type Point = { head: string; body: string };

const BEGINNER: Point[] = [
  { head: '一鍵開服。', body: '建立、啟動、更新全部用按的, 不背指令、不改設定檔。' },
  { head: '本機免密碼直進。', body: '在自己電腦打開就是管理畫面, 零設定。' },
  { head: '邀朋友零門檻。', body: '傳一條設定連結, 朋友點一下就連上。' },
  { head: '可愛又直覺。', body: '中文介面、附說明, 滑鼠點一點就能調。' },
];

const POWER: Point[] = [
  { head: '原生 / Docker 雙後端。', body: '直接開 PalServer 或跑容器; 可接管既有安裝或指定空資料夾安裝。' },
  { head: 'Schema 驅動設定。', body: '80+ 世界參數 + Engine.ini 引擎微調, 型別一致、保留未管理的鍵。' },
  { head: 'RCON 指令台 + 模組。', body: '內建 RCON; PalDefender / UE4SS 一鍵裝更新移除。' },
  { head: '備份排程與遷移。', body: 'tar.gz 定期備份、一鍵還原、跨來源存檔搬家、REST API 代理。' },
];

function AudienceCard({
  tag,
  title,
  icon,
  points,
}: {
  tag: string;
  title: string;
  icon: React.ReactNode;
  points: Point[];
}) {
  return (
    <div className="aud reveal">
      <p className="tag">{tag}</p>
      <h3>
        {icon} {title}
      </h3>
      <ul>
        {points.map((p) => (
          <li key={p.head}>
            <Check />
            <div>
              <b>{p.head}</b>
              <span> {p.body}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Audience() {
  return (
    <section className="band">
      <div className="wrap">
        <div className="col">
          <p className="eyebrow">兩種人都合用</p>
          <h2>新手覺得簡單, 老手覺得夠力。</h2>
        </div>
        <div className="split">
          <AudienceCard tag="For beginners" title="第一次開伺服器" icon={<RocketIcon />} points={BEGINNER} />
          <AudienceCard tag="For power users" title="老手想要的控制力" icon={<WrenchIcon />} points={POWER} />
        </div>
      </div>
    </section>
  );
}
