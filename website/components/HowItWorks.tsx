export default function HowItWorks() {
  return (
    <section id="how" className="band">
      <div className="wrap">
        <div className="col">
          <p className="eyebrow">一分鐘看懂</p>
          <h2>打開網頁, 人在哪都能顧。</h2>
          <p className="sec-lead">
            把 palserver GUI 裝在放伺服器的那台電腦上, 之後不管用電腦、手機還是平板,
            打開網頁就是管理畫面。遊戲和存檔都留在你自己的電腦裡,
            網頁只是遙控器——在家直接進, 出門在外點個連結也能連上。
          </p>
        </div>
        <div className="arch reveal">
          <div className="node">
            <div className="nt">你的裝置</div>
            <div className="nd">電腦、手機、平板。打開網頁就是管理畫面, 在家直接進, 出門點連結即連。</div>
          </div>
          <div className="node mid">
            <div className="mid-in">
              <div className="flow" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              安全連線
              <br />
              點一下就連上
            </div>
          </div>
          <div className="node">
            <div className="nt">放伺服器的電腦</div>
            <div className="nd">palserver GUI 在這裡幫你顧著伺服器:存檔、模組、備份, 通通打理好。</div>
          </div>
        </div>
      </div>
    </section>
  );
}
