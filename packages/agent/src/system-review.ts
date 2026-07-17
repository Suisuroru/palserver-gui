import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import crypto from "node:crypto";
import { DATA_DIR } from "./env.js";

/**
 * 配置評估健檢(進階顯示/贊助者):收集這台主機的硬體與網路狀況,
 * 用「開帕魯專用伺服器」的需求給逐項評級與總分;可另外串 Gemini 產生
 * 白話的 AI 評估(使用者自備 API key,存 agent 的 settings.json)。
 *
 * 設計原則:
 * - 規則評分永遠可用(離線、免 key),AI 只是加值。
 * - 磁碟不猜 SSD/HDD 型號,直接實測寫入速度(64MB 到 DATA_DIR,存檔就住這顆碟)。
 * - 網路量不到玩家到主機的 UDP 品質,用對外 TCP 連線 RTT/抖動當代理指標,誠實標示。
 */

export type Rating = "good" | "ok" | "poor";

export interface SystemSpecs {
  platform: string;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  /** os.cpus() 回報的時脈(MHz);部分平台拿不到就是 0。 */
  cpuSpeedMHz: number;
  ramTotalBytes: number;
  ramFreeBytes: number;
  diskTotalBytes: number;
  diskFreeBytes: number;
  /** 實測循序寫入(MB/s),寫在 DATA_DIR 所在磁碟。 */
  diskWriteMBps: number;
  /** 對外 TCP 443 連線 RTT(ms):取多個端點多次採樣。 */
  netAvgMs: number | null;
  netMinMs: number | null;
  /** RTT 抖動(樣本標準差,ms)。 */
  netJitterMs: number | null;
}

export interface DimensionReview {
  rating: Rating;
  /** 前端顯示用的主要數值(已格式化交給前端做,這裡給原始)。 */
  score: number;
}

export interface SystemReview {
  specs: SystemSpecs;
  ram: DimensionReview;
  cpu: DimensionReview;
  disk: DimensionReview;
  network: DimensionReview;
  /** 0–100 加權總分。 */
  overall: number;
  /** 是否已設定 Gemini API key(可用 AI 評估)。 */
  aiConfigured: boolean;
  generatedAt: string;
}

/** 實測循序寫入速度:64MB 寫進 DATA_DIR 再刪掉。存檔與伺服器檔案就住這顆碟,
 *  比猜磁碟型號誠實;HDD 通常 <150MB/s、SATA SSD ~300-500、NVMe >1000。 */
async function measureDiskWrite(): Promise<number> {
  const file = path.join(DATA_DIR, `.disk-bench-${crypto.randomBytes(4).toString("hex")}`);
  const chunk = crypto.randomBytes(4 * 1024 * 1024); // 4MB 亂數塊,避開壓縮/快取美化
  const chunks = 16; // 共 64MB
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const started = process.hrtime.bigint();
    const fd = fs.openSync(file, "w");
    for (let i = 0; i < chunks; i++) fs.writeSync(fd, chunk);
    fs.fsyncSync(fd); // 逼出 OS 寫入快取,量到的才是磁碟
    fs.closeSync(fd);
    const seconds = Number(process.hrtime.bigint() - started) / 1e9;
    return Math.round(((chunks * chunk.length) / (1 << 20)) / seconds);
  } catch {
    return 0;
  } finally {
    fs.rmSync(file, { force: true });
  }
}

/** 一次 TCP 連線的 RTT(ms);逾時/失敗回 null。 */
function tcpRtt(host: string, port: number, timeoutMs = 3000): Promise<number | null> {
  return new Promise((resolve) => {
    const started = process.hrtime.bigint();
    const sock = net.connect({ host, port });
    const done = (v: number | null) => {
      sock.destroy();
      resolve(v);
    };
    sock.setTimeout(timeoutMs, () => done(null));
    sock.once("connect", () => done(Number(process.hrtime.bigint() - started) / 1e6));
    sock.once("error", () => done(null));
  });
}

/** 對外連線品質:兩個端點各 4 次採樣(丟掉第一次的 DNS/暖機失真)。 */
async function measureNetwork(): Promise<{ avg: number | null; min: number | null; jitter: number | null }> {
  const hosts: [string, number][] = [
    ["api.steampowered.com", 443], // 與遊戲生態相關的實際端點
    ["www.google.com", 443],
  ];
  const samples: number[] = [];
  for (const [host, port] of hosts) {
    await tcpRtt(host, port); // 暖機(DNS/連線快取),不計入
    for (let i = 0; i < 4; i++) {
      const v = await tcpRtt(host, port);
      if (v !== null) samples.push(v);
    }
  }
  if (samples.length === 0) return { avg: null, min: null, jitter: null };
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  const min = Math.min(...samples);
  const jitter = Math.sqrt(samples.reduce((a, b) => a + (b - avg) ** 2, 0) / samples.length);
  return { avg: Math.round(avg * 10) / 10, min: Math.round(min * 10) / 10, jitter: Math.round(jitter * 10) / 10 };
}

export async function collectSpecs(): Promise<SystemSpecs> {
  const cpus = os.cpus();
  let diskTotal = 0;
  let diskFree = 0;
  try {
    const st = fs.statfsSync(DATA_DIR);
    diskTotal = st.blocks * st.bsize;
    diskFree = st.bavail * st.bsize;
  } catch {
    /* 平台不支援 statfs 就留 0,前端顯示 — */
  }
  const [diskWriteMBps, netStats] = await Promise.all([measureDiskWrite(), measureNetwork()]);
  return {
    platform: `${os.type()} ${os.release()}`,
    arch: os.arch(),
    cpuModel: cpus[0]?.model?.trim() ?? "unknown",
    cpuCores: cpus.length,
    cpuSpeedMHz: cpus[0]?.speed ?? 0,
    ramTotalBytes: os.totalmem(),
    ramFreeBytes: os.freemem(),
    diskTotalBytes: diskTotal,
    diskFreeBytes: diskFree,
    diskWriteMBps,
    netAvgMs: netStats.avg,
    netMinMs: netStats.min,
    netJitterMs: netStats.jitter,
  };
}

const RATING_SCORE: Record<Rating, number> = { good: 100, ok: 60, poor: 25 };

/** 規則評分:門檻依帕魯專用伺服器的實際需求(RAM 吃最兇,單核時脈次之)。 */
export function reviewSpecs(specs: SystemSpecs, aiConfigured: boolean): SystemReview {
  const gb = (n: number) => n / (1 << 30);

  // RAM:官方建議 16GB 起,實際 8-10 人以上/大量據點會吃到 16-24GB
  const ramRating: Rating = gb(specs.ramTotalBytes) >= 31 ? "good" : gb(specs.ramTotalBytes) >= 15 ? "ok" : "poor";
  // CPU:tick 主要吃單核;核心數留給遊戲+系統+GUI
  const cpuRating: Rating =
    specs.cpuCores >= 8 && (specs.cpuSpeedMHz === 0 || specs.cpuSpeedMHz >= 3000)
      ? "good"
      : specs.cpuCores >= 4
        ? "ok"
        : "poor";
  // 磁碟:自動備份/存檔寫入吃循序寫;剩餘空間要放得下伺服器(~20GB)+備份
  const diskSpeedRating: Rating = specs.diskWriteMBps >= 300 ? "good" : specs.diskWriteMBps >= 100 ? "ok" : "poor";
  const diskSpaceRating: Rating = gb(specs.diskFreeBytes) >= 60 ? "good" : gb(specs.diskFreeBytes) >= 25 ? "ok" : "poor";
  const diskRating: Rating = [diskSpeedRating, diskSpaceRating].includes("poor")
    ? "poor"
    : [diskSpeedRating, diskSpaceRating].includes("ok")
      ? "ok"
      : "good";
  // 網路:對外 RTT/抖動當代理;量不到(離線/防火牆)算 ok 不懲罰
  const netRating: Rating =
    specs.netAvgMs === null
      ? "ok"
      : specs.netAvgMs <= 45 && (specs.netJitterMs ?? 0) <= 20
        ? "good"
        : specs.netAvgMs <= 110 && (specs.netJitterMs ?? 0) <= 50
          ? "ok"
          : "poor";

  const overall = Math.round(
    RATING_SCORE[ramRating] * 0.35 +
      RATING_SCORE[cpuRating] * 0.3 +
      RATING_SCORE[diskRating] * 0.2 +
      RATING_SCORE[netRating] * 0.15,
  );

  return {
    specs,
    ram: { rating: ramRating, score: RATING_SCORE[ramRating] },
    cpu: { rating: cpuRating, score: RATING_SCORE[cpuRating] },
    disk: { rating: diskRating, score: RATING_SCORE[diskRating] },
    network: { rating: netRating, score: RATING_SCORE[netRating] },
    overall,
    aiConfigured,
    generatedAt: new Date().toISOString(),
  };
}

/** Gemini 白話評估。模型名經官方文件查證(2026-07):穩定版 gemini-3.5-flash。 */
export async function aiReview(review: SystemReview, apiKey: string, lang: string): Promise<string> {
  const s = review.specs;
  const langName =
    lang === "zh-CN" ? "簡體中文" : lang === "en" ? "English" : lang === "ja" ? "日本語" : "繁體中文(台灣用語)";
  const prompt = [
    `你是 Palworld(幻獸帕魯)專用伺服器的架站顧問。以下是一台準備開服的主機的實測配置,`,
    `請用${langName}寫一段給伺服器主看的評估(250 字以內,口語、直接、可執行):`,
    `1) 這台機器適合帶幾人的伺服器 2) 最大瓶頸與具體改善建議 3) 一句總結。`,
    `不要重複列規格,不要用 markdown 標題,可以用短段落或條列。`,
    ``,
    `實測資料:`,
    `- CPU:${s.cpuModel}(${s.cpuCores} 核,${s.cpuSpeedMHz ? `${s.cpuSpeedMHz}MHz` : "時脈未知"})`,
    `- 記憶體:總 ${(s.ramTotalBytes / (1 << 30)).toFixed(1)}GB / 可用 ${(s.ramFreeBytes / (1 << 30)).toFixed(1)}GB`,
    `- 磁碟:剩餘 ${(s.diskFreeBytes / (1 << 30)).toFixed(0)}GB,實測循序寫入 ${s.diskWriteMBps}MB/s`,
    `- 對外網路:平均 RTT ${s.netAvgMs ?? "量不到"}ms,抖動 ${s.netJitterMs ?? "—"}ms(TCP 連線代理指標,非玩家實際延遲)`,
    `- 系統:${s.platform}(${s.arch})`,
    `- 規則評分:RAM ${review.ram.rating} / CPU ${review.cpu.rating} / 磁碟 ${review.disk.rating} / 網路 ${review.network.rating},總分 ${review.overall}/100`,
    ``,
    `背景知識:帕魯專用伺服器單實例常駐吃 8-20GB RAM(據點與帕魯數量越多越兇),tick 吃單核,`,
    `自動備份會做大檔循序寫入;主機頻寬上行 10 人約需 3-5Mbps。`,
  ].join("\n");

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const hint = res.status === 400 || res.status === 403 ? "(API key 可能無效)" : res.status === 429 ? "(額度用盡,稍後再試)" : "";
    throw Object.assign(new Error(`Gemini API 回應 HTTP ${res.status}${hint} ${body.slice(0, 200)}`), {
      statusCode: 502,
    });
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw Object.assign(new Error("Gemini 回傳空內容,請稍後再試"), { statusCode: 502 });
  return text.trim();
}
