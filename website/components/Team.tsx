const MEMBERS = [
  { av: 'D', name: 'Dalufish', role: '核心開發人員' },
  { av: 'M', name: 'Ming Chen', role: '核心開發人員' },
  { av: '1', name: '147', role: '核心團隊維護者' },
  { av: '墨', name: '墨殘', role: '核心團隊維護者' },
  { av: 'L', name: 'LilaS', role: '核心團隊維護者・資安' },
  { av: '咖', name: '咖啡', role: '核心團隊維護者' },
];

export default function Team() {
  return (
    <section id="team">
      <div className="wrap">
        <div className="col">
          <p className="eyebrow">誰做的</p>
          <h2>一群喜歡帕魯的人, 用愛維護。</h2>
          <p className="sec-lead">
            palserver GUI 完全免費開源, 由核心團隊持續維護。喜歡的話, 一杯咖啡就是最大的鼓勵。
          </p>
        </div>
        <div className="teamg reveal">
          {MEMBERS.map((m) => (
            <div className="mem" key={m.name}>
              <div className="av" aria-hidden="true">
                {m.av}
              </div>
              <b>{m.name}</b>
              <span>{m.role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
