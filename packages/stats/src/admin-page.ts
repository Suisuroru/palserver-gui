/**
 * 授權管理後台(單頁,worker 的 GET /admin 直接吐這串 HTML)。
 * 頁面本身公開;所有操作都要在頁內輸入 ADMIN_TOKEN,呼叫 /api/license/* 時帶
 * X-Admin-Token(存在 sessionStorage,關掉分頁即清)。
 *
 * 注意:這是「外層 TS template literal」,字串內請勿使用反引號或 ${...}
 * (會被 TS 當成插值)。頁內 JS 一律用單/雙引號 + 字串相接。
 */
export const ADMIN_HTML = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>palserver GUI · 授權後台</title>
<style>
  :root{
    --bg1:#eef4ff; --bg2:#f7fbf9; --card:#ffffff; --ink:#0f172a; --muted:#64748b;
    --line:#e6ebf2; --soft:#f1f5f9; --accent:#10b981; --accent-d:#059669;
    --danger:#ef4444; --warn:#f59e0b; --info:#6366f1; --radius:18px;
    --shadow:0 10px 30px rgba(15,23,42,.08),0 2px 6px rgba(15,23,42,.05);
  }
  @media (prefers-color-scheme: dark){
    :root{ --bg1:#0b1220; --bg2:#0e1627; --card:#151e30; --ink:#e8eefb; --muted:#93a1b8;
      --line:#243043; --soft:#1c2740; --shadow:0 10px 30px rgba(0,0,0,.4); }
  }
  *{ box-sizing:border-box; }
  body{ margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang TC","Noto Sans TC",sans-serif;
    color:var(--ink); background:linear-gradient(160deg,var(--bg1),var(--bg2)); min-height:100vh;
    -webkit-font-smoothing:antialiased; }
  .wrap{ max-width:1000px; margin:0 auto; padding:28px 20px 80px; }
  header{ display:flex; align-items:center; gap:12px; margin-bottom:22px; }
  .logo{ width:38px; height:38px; border-radius:12px; background:linear-gradient(135deg,var(--accent),var(--info));
    display:grid; place-items:center; color:#fff; font-weight:900; box-shadow:var(--shadow); }
  h1{ font-size:19px; margin:0; font-weight:800; letter-spacing:.3px; }
  .sub{ color:var(--muted); font-size:13px; margin-top:2px; }
  .spacer{ flex:1; }
  .card{ background:var(--card); border:1.5px solid var(--line); border-radius:var(--radius);
    box-shadow:var(--shadow); padding:22px; margin-bottom:20px; }
  .card h2{ font-size:15px; margin:0 0 4px; font-weight:800; display:flex; align-items:center; gap:8px; }
  .card .hint{ color:var(--muted); font-size:12.5px; margin:0 0 16px; }
  label{ display:block; font-size:12.5px; font-weight:700; color:var(--muted); margin-bottom:6px; }
  input[type=text],input[type=number],input[type=date],input[type=password]{
    width:100%; padding:10px 12px; border:1.5px solid var(--line); border-radius:12px; background:var(--soft);
    color:var(--ink); font-size:14px; font-family:inherit; }
  input:focus{ outline:none; border-color:var(--accent); background:var(--card); }
  .grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:14px; }
  .seg{ display:inline-flex; background:var(--soft); border:1.5px solid var(--line); border-radius:12px; padding:3px; gap:2px; }
  .seg button{ border:0; background:transparent; color:var(--muted); font-weight:700; font-size:13px;
    padding:7px 14px; border-radius:9px; cursor:pointer; font-family:inherit; }
  .seg button.on{ background:var(--card); color:var(--ink); box-shadow:0 1px 4px rgba(15,23,42,.12); }
  .row{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .btn{ border:0; border-radius:999px; padding:11px 20px; font-weight:800; font-size:14px; cursor:pointer;
    font-family:inherit; background:var(--accent); color:#fff; box-shadow:0 6px 16px rgba(16,185,129,.28);
    transition:transform .08s, filter .15s; }
  .btn:hover{ filter:brightness(1.05); } .btn:active{ transform:translateY(1px); }
  .btn:disabled{ opacity:.5; cursor:not-allowed; box-shadow:none; }
  .btn.ghost{ background:transparent; color:var(--ink); border:1.5px solid var(--line); box-shadow:none; }
  .btn.sm{ padding:6px 12px; font-size:12.5px; }
  .btn.danger{ background:var(--danger); box-shadow:none; }
  .feat{ display:flex; flex-wrap:wrap; gap:8px 16px; }
  .feat label{ display:inline-flex; align-items:center; gap:7px; font-weight:600; color:var(--ink);
    font-size:13px; margin:0; cursor:pointer; }
  .chips{ display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
  .chip{ font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-weight:700; font-size:13px;
    background:var(--soft); border:1.5px solid var(--line); border-radius:10px; padding:7px 11px; cursor:pointer; }
  .chip:hover{ border-color:var(--accent); }
  .stats{ display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:10px; margin-bottom:14px; }
  .stat{ background:var(--soft); border:1.5px solid var(--line); border-radius:12px; padding:10px 14px;
    cursor:pointer; transition:border-color .15s, box-shadow .15s; }
  .stat:hover{ border-color:var(--accent); }
  .stat.on{ border-color:var(--accent); background:var(--card); box-shadow:0 1px 6px rgba(16,185,129,.22); }
  .stat .n{ font-size:20px; font-weight:800; line-height:1.1; }
  .stat .l{ font-size:11.5px; color:var(--muted); font-weight:700; margin-top:3px; }
  .stat.c-green .n{ color:var(--accent-d); } .stat.c-red .n{ color:var(--danger); }
  .stat.c-amber .n{ color:#b45309; } .stat.c-info .n{ color:var(--info); }
  .toolbar{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:14px; }
  .toolbar input{ max-width:240px; }
  .seg .cnt{ font-weight:600; opacity:.6; margin-left:4px; font-size:11.5px; }
  th.sortable{ cursor:pointer; user-select:none; white-space:nowrap; }
  th.sortable:hover{ color:var(--ink); }
  .src{ display:inline-block; padding:2px 9px; border-radius:999px; font-size:11.5px; font-weight:800; }
  .src.bmc{ background:rgba(99,102,241,.14); color:var(--info); }
  .src.campaign{ background:rgba(245,158,11,.16); color:#b45309; }
  .src.manual{ background:var(--soft); color:var(--muted); }
  td .mail{ font-size:12px; color:var(--muted); }
  table{ width:100%; border-collapse:collapse; font-size:13px; }
  th{ text-align:left; color:var(--muted); font-weight:700; font-size:11.5px; text-transform:uppercase;
    letter-spacing:.4px; padding:8px 10px; border-bottom:1.5px solid var(--line); }
  td{ padding:10px; border-bottom:1px solid var(--line); vertical-align:middle; }
  td.code{ font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-weight:700; white-space:nowrap; }
  .tag{ display:inline-block; padding:2px 9px; border-radius:999px; font-size:11.5px; font-weight:800; white-space:nowrap; }
  .tag.on{ background:rgba(16,185,129,.15); color:var(--accent-d); }
  .tag.off{ background:var(--soft); color:var(--muted); }
  .tag.exp{ background:rgba(239,68,68,.14); color:var(--danger); }
  .tag.warn{ background:rgba(245,158,11,.16); color:#b45309; }
  .muted{ color:var(--muted); }
  .empty{ text-align:center; color:var(--muted); padding:34px; }
  .tablewrap{ overflow-x:auto; }
  .acts{ display:flex; gap:6px; justify-content:flex-end; }
  .toast{ position:fixed; left:50%; bottom:26px; transform:translateX(-50%) translateY(20px);
    background:var(--ink); color:var(--card); padding:11px 18px; border-radius:12px; font-weight:700; font-size:13.5px;
    opacity:0; transition:.25s; pointer-events:none; box-shadow:var(--shadow); z-index:9; }
  .toast.show{ opacity:1; transform:translateX(-50%) translateY(0); }
  .toast.err{ background:var(--danger); color:#fff; }
  .gate{ max-width:420px; margin:8vh auto 0; }
  .hide{ display:none !important; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="logo">P</div>
    <div>
      <h1>palserver GUI · 授權後台</h1>
      <div class="sub">發放 / 管理贊助者與試用識別碼</div>
    </div>
    <div class="spacer"></div>
    <button id="lock" class="btn ghost sm hide" onclick="lock()">變更 Token</button>
  </header>

  <div id="gate" class="card gate">
    <h2>管理員登入</h2>
    <p class="hint">輸入 worker 的 ADMIN_TOKEN。只存在這個分頁(sessionStorage),不會上傳。</p>
    <label>ADMIN_TOKEN</label>
    <input id="tok" type="password" placeholder="貼上 ADMIN_TOKEN" onkeydown="if(event.key==='Enter')unlock()" />
    <div class="row" style="margin-top:14px"><button class="btn" onclick="unlock()">解鎖</button></div>
  </div>

  <div id="app" class="hide">
    <!-- 發碼 -->
    <div class="card">
      <h2>🎟️ 發碼</h2>
      <p class="hint">一次可發多張。有效授權即解鎖全部早鳥功能;一碼綁一台伺服器。</p>
      <div class="grid">
        <div>
          <label>數量</label>
          <input id="count" type="number" value="1" min="1" max="500" />
        </div>
        <div>
          <label>效期</label>
          <div class="seg" id="modeSeg">
            <button type="button" class="on" data-mode="trial" onclick="setMode('trial')">試用</button>
            <button type="button" data-mode="date" onclick="setMode('date')">固定到期</button>
            <button type="button" data-mode="perm" onclick="setMode('perm')">永久</button>
          </div>
        </div>
        <div id="trialBox">
          <label>啟用後天數</label>
          <input id="trialDays" type="number" value="14" min="1" max="3650" />
        </div>
        <div id="dateBox" class="hide">
          <label>到期日</label>
          <input id="expDate" type="date" />
        </div>
        <div>
          <label>活動標籤(選填)</label>
          <input id="sponsor" type="text" placeholder="例:2026 夏季試用" />
        </div>
      </div>
      <div style="margin-top:16px">
        <label>解鎖功能(顯示用;有效授權一律全解)</label>
        <div class="feat" id="feats"></div>
      </div>
      <div class="row" style="margin-top:18px">
        <button class="btn" id="issueBtn" onclick="issue()">發碼</button>
        <span id="issueMsg" class="muted"></span>
      </div>
      <div id="result" class="hide">
        <div class="row" style="margin-top:18px">
          <strong id="resultTitle"></strong>
          <div class="spacer"></div>
          <button class="btn ghost sm" onclick="copyAll()">複製全部</button>
          <button class="btn ghost sm" onclick="downloadCsv()">下載 CSV</button>
        </div>
        <div class="chips" id="chips"></div>
      </div>
    </div>

    <!-- 管理 -->
    <div class="card">
      <h2>📋 已發識別碼</h2>
      <p class="hint">點統計卡依狀態分類;來源、搜尋可再疊加過濾。</p>
      <div class="stats" id="stats"></div>
      <div class="toolbar">
        <input id="q" type="text" placeholder="搜尋識別碼 / 標籤 / Email…" oninput="applyView()" />
        <div class="seg" id="srcSeg"></div>
        <div class="spacer"></div>
        <button class="btn ghost sm" onclick="exportView()">匯出檢視 CSV</button>
        <button class="btn ghost sm" onclick="refresh()">重新整理</button>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr>
            <th>識別碼</th><th>對象 / 標籤</th>
            <th class="sortable" onclick="setSort('created')">建立 <span id="arrowCreated"></span></th>
            <th class="sortable" onclick="setSort('expiry')">效期 <span id="arrowExpiry"></span></th>
            <th>狀態</th><th>來源</th><th></th>
          </tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
      <div id="listEmpty" class="empty hide">目前沒有符合的識別碼。</div>
      <div class="row" style="margin-top:10px"><span id="listMeta" class="muted"></span></div>
    </div>
  </div>
</div>
<div id="toast" class="toast"></div>

<script>
  var FEATURES = [
    ["custom-pal","自訂帕魯"],["guild-map","公會地圖"],["pal-stats","物種數值"],
    ["bulk-items","批量道具"],["teleport","傳送玩家"]
  ];
  var mode = "trial";
  var lastCodes = [];

  // ── 清單狀態(全部抓回來,分類/搜尋/排序都在前端做)──
  var ALL = [];            // 上次 refresh 抓回的完整清單
  var stFilter = "all";    // all | active | unused | expiring | expired
  var srcFilter = "all";   // all | bmc | campaign | manual
  var sortKey = "created"; // created | expiry
  var sortAsc = false;

  var ST_OPTS = [
    ["all","總數",""],["active","已啟用","c-green"],["unused","未使用",""],
    ["expiring","30 天內到期","c-amber"],["expired","已過期","c-red"]
  ];
  var SRC_OPTS = [["all","全部來源"],["bmc","BMC 贊助"],["campaign","活動"],["manual","手動"]];

  function statusOf(l){
    if(l.expiresAt && new Date(l.expiresAt).getTime() < Date.now()) return "expired";
    return l.bound ? "active" : "unused";
  }
  function daysLeft(l){
    return l.expiresAt ? Math.ceil((new Date(l.expiresAt).getTime() - Date.now())/86400000) : null;
  }
  function isExpiring(l){ var d = daysLeft(l); return d !== null && d > 0 && d <= 30; }
  function matchSt(l, st){
    if(st === "all") return true;
    if(st === "expiring") return statusOf(l) !== "expired" && isExpiring(l);
    return statusOf(l) === st;
  }

  function tok(){ return sessionStorage.getItem("palAdminTok") || ""; }
  function toast(msg, err){
    var t = document.getElementById("toast");
    t.textContent = msg; t.className = "toast show" + (err ? " err" : "");
    clearTimeout(t._h); t._h = setTimeout(function(){ t.className = "toast"; }, 2600);
  }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]; }); }

  async function api(path, body){
    var res = await fetch(path, {
      method:"POST",
      headers:{ "Content-Type":"application/json", "X-Admin-Token": tok() },
      body: JSON.stringify(body||{})
    });
    var data = await res.json().catch(function(){ return {}; });
    if(res.status===401){ toast("Token 無效", true); lock(); throw new Error("unauthorized"); }
    if(!res.ok) throw new Error(data.error || ("HTTP "+res.status));
    return data;
  }

  function unlock(){
    var v = document.getElementById("tok").value.trim();
    if(!v){ toast("請輸入 Token", true); return; }
    sessionStorage.setItem("palAdminTok", v);
    showApp();
    refresh();
  }
  function lock(){
    sessionStorage.removeItem("palAdminTok");
    document.getElementById("app").classList.add("hide");
    document.getElementById("lock").classList.add("hide");
    document.getElementById("gate").classList.remove("hide");
    document.getElementById("tok").value = "";
  }
  function showApp(){
    document.getElementById("gate").classList.add("hide");
    document.getElementById("app").classList.remove("hide");
    document.getElementById("lock").classList.remove("hide");
  }

  function setMode(m){
    mode = m;
    var segs = document.querySelectorAll("#modeSeg button");
    for(var i=0;i<segs.length;i++) segs[i].classList.toggle("on", segs[i].dataset.mode===m);
    document.getElementById("trialBox").classList.toggle("hide", m!=="trial");
    document.getElementById("dateBox").classList.toggle("hide", m!=="date");
  }

  function renderFeats(){
    var el = document.getElementById("feats"); el.innerHTML = "";
    FEATURES.forEach(function(f){
      var l = document.createElement("label");
      l.innerHTML = '<input type="checkbox" value="'+f[0]+'" checked> '+esc(f[1]);
      el.appendChild(l);
    });
  }
  function selectedFeats(){
    var out = [];
    document.querySelectorAll("#feats input:checked").forEach(function(c){ out.push(c.value); });
    return out;
  }

  async function issue(){
    var btn = document.getElementById("issueBtn");
    var body = {
      count: Number(document.getElementById("count").value)||1,
      sponsor: document.getElementById("sponsor").value.trim() || null,
      features: selectedFeats(),
      source: "campaign"
    };
    if(mode==="trial") body.trialDays = Number(document.getElementById("trialDays").value)||14;
    else if(mode==="date"){
      var d = document.getElementById("expDate").value;
      if(!d){ toast("請選到期日", true); return; }
      body.expiresAt = d + "T23:59:59Z";
    }
    btn.disabled = true; document.getElementById("issueMsg").textContent = "發碼中…";
    try{
      var r = await api("/api/license/issue", body);
      lastCodes = r.codes || [];
      var res = document.getElementById("result"); res.classList.remove("hide");
      document.getElementById("resultTitle").textContent = "已發 " + lastCodes.length + " 張(點一下複製)";
      var chips = document.getElementById("chips"); chips.innerHTML = "";
      lastCodes.forEach(function(c){
        var s = document.createElement("span"); s.className="chip"; s.textContent=c;
        s.onclick = function(){ copy(c); };
        chips.appendChild(s);
      });
      toast("已發 " + lastCodes.length + " 張");
      document.getElementById("issueMsg").textContent = "";
      refresh();
    }catch(e){ toast("發碼失敗:" + e.message, true); document.getElementById("issueMsg").textContent=""; }
    btn.disabled = false;
  }

  function copy(text){
    navigator.clipboard.writeText(text).then(function(){ toast("已複製"); },
      function(){ toast("複製失敗", true); });
  }
  function copyAll(){ if(lastCodes.length) copy(lastCodes.join("\\n")); }
  function downloadCsv(){
    if(!lastCodes.length) return;
    var csv = "code\\n" + lastCodes.join("\\n") + "\\n";
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
    a.download = "palserver-codes.csv"; a.click();
  }

  function expiryText(l){
    if(l.trialDays && !l.activatedAt) return "試用 " + l.trialDays + " 天(啟用後起算)";
    if(l.expiresAt){
      var d = l.expiresAt.slice(0,10);
      if(l.activatedAt){
        var left = daysLeft(l);
        return d + (left>0 ? "(剩 "+left+" 天)" : "");
      }
      return "至 " + d;
    }
    return "永久";
  }
  function statusTag(l){
    var st = statusOf(l);
    if(st==="expired") return '<span class="tag exp">已過期</span>';
    var extra = isExpiring(l) ? ' <span class="tag warn">快到期</span>' : '';
    if(st==="active") return '<span class="tag on">已啟用</span>' + extra;
    return '<span class="tag off">未使用</span>' + extra;
  }
  function targetCell(l){
    if(l.email) return '<span class="mail">'+esc(l.email)+'</span>';
    return l.sponsor ? esc(l.sponsor) : '<span class="muted">—</span>';
  }

  function renderStats(){
    var el = document.getElementById("stats"); el.innerHTML = "";
    ST_OPTS.forEach(function(o){
      var n = 0;
      ALL.forEach(function(l){ if(matchSt(l, o[0])) n++; });
      var d = document.createElement("div");
      d.className = "stat " + o[2] + (stFilter===o[0] ? " on" : "");
      d.innerHTML = '<div class="n">'+n+'</div><div class="l">'+o[1]+'</div>';
      d.onclick = function(){ stFilter = o[0]; renderStats(); applyView(); };
      el.appendChild(d);
    });
  }
  function renderSrcSeg(){
    var el = document.getElementById("srcSeg"); el.innerHTML = "";
    SRC_OPTS.forEach(function(o){
      var n = 0;
      ALL.forEach(function(l){ if(o[0]==="all" || (l.source||"manual")===o[0]) n++; });
      var b = document.createElement("button");
      b.type = "button";
      b.className = srcFilter===o[0] ? "on" : "";
      b.innerHTML = esc(o[1]) + '<span class="cnt">'+n+'</span>';
      b.onclick = function(){ srcFilter = o[0]; renderSrcSeg(); applyView(); };
      el.appendChild(b);
    });
  }

  function setSort(k){
    if(sortKey === k) sortAsc = !sortAsc;
    else { sortKey = k; sortAsc = (k === "expiry"); } // 效期預設由近到遠,建立預設新到舊
    applyView();
  }
  function expiryVal(l){
    // 排序用:無到期(永久/試用未啟用)排最後
    return l.expiresAt ? new Date(l.expiresAt).getTime() : Infinity;
  }
  function currentView(){
    var q = document.getElementById("q").value.trim().toLowerCase();
    var out = ALL.filter(function(l){
      if(!matchSt(l, stFilter)) return false;
      if(srcFilter !== "all" && (l.source||"manual") !== srcFilter) return false;
      if(q){
        var hay = (l.code+" "+(l.sponsor||"")+" "+(l.email||"")).toLowerCase();
        if(hay.indexOf(q) < 0) return false;
      }
      return true;
    });
    out.sort(function(a,b){
      var va = sortKey==="expiry" ? expiryVal(a) : new Date(a.createdAt).getTime();
      var vb = sortKey==="expiry" ? expiryVal(b) : new Date(b.createdAt).getTime();
      return sortAsc ? va - vb : vb - va;
    });
    return out;
  }

  function applyView(){
    var list = currentView();
    document.getElementById("arrowCreated").textContent = sortKey==="created" ? (sortAsc?"▲":"▼") : "";
    document.getElementById("arrowExpiry").textContent  = sortKey==="expiry"  ? (sortAsc?"▲":"▼") : "";
    var rows = document.getElementById("rows"); rows.innerHTML = "";
    list.forEach(function(l){
      var src = l.source || "manual";
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td class="code">'+esc(l.code)+'</td>' +
        '<td>'+targetCell(l)+'</td>' +
        '<td class="muted">'+esc((l.createdAt||"").slice(0,10))+'</td>' +
        '<td>'+esc(expiryText(l))+'</td>' +
        '<td>'+statusTag(l)+'</td>' +
        '<td><span class="src '+esc(src)+'">'+esc(src)+'</span></td>' +
        '<td><div class="acts">' +
          '<button class="btn ghost sm" onclick="copy(\\''+l.code+'\\')">複製</button>' +
          (l.bound?'<button class="btn ghost sm" onclick="doReset(\\''+l.code+'\\')">解綁</button>':'') +
          '<button class="btn danger sm" onclick="doRevoke(\\''+l.code+'\\')">撤銷</button>' +
        '</div></td>';
      rows.appendChild(tr);
    });
    document.getElementById("listMeta").textContent = "顯示 " + list.length + " / 共 " + ALL.length + " 張";
    document.getElementById("listEmpty").classList.toggle("hide", list.length>0);
  }

  function exportView(){
    var list = currentView();
    if(!list.length){ toast("目前檢視沒有資料", true); return; }
    var lines = ["code,target,created,expires,status,source"];
    list.forEach(function(l){
      var target = l.email || l.sponsor || "";
      lines.push([l.code, '"'+target.replace(/"/g,'""')+'"', (l.createdAt||"").slice(0,10),
        l.expiresAt ? l.expiresAt.slice(0,10) : "permanent", statusOf(l), l.source||"manual"].join(","));
    });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\\n")+"\\n"], {type:"text/csv"}));
    a.download = "palserver-licenses.csv"; a.click();
    toast("已匯出 " + list.length + " 筆");
  }

  async function refresh(){
    try{
      var r = await api("/api/license/list", { limit: 2000 });
      ALL = r.licenses || [];
      renderStats(); renderSrcSeg(); applyView();
    }catch(e){ if(e.message!=="unauthorized") toast("讀取失敗:"+e.message, true); }
  }

  async function doReset(code){
    if(!confirm("解除 " + code + " 的機器綁定?贊助者可換到別台啟用。")) return;
    try{ await api("/api/license/reset", {code:code}); toast("已解綁"); refresh(); }
    catch(e){ toast("失敗:"+e.message, true); }
  }
  async function doRevoke(code){
    if(!confirm("撤銷(刪除)" + code + "?啟用中的機器下次重驗會失效,無法復原。")) return;
    try{ await api("/api/license/delete", {code:code}); toast("已撤銷"); refresh(); }
    catch(e){ toast("失敗:"+e.message, true); }
  }

  renderFeats();
  if(tok()){ showApp(); refresh(); }
</script>
</body>
</html>`;
