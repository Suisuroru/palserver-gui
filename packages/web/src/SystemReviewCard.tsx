import { useState } from "react";
import { FiActivity, FiCpu, FiHardDrive, FiKey, FiRefreshCw, FiWifi, FiZap } from "react-icons/fi";
import { GiBrain } from "react-icons/gi";
import type { AgentClient, ReviewRating, SystemReview } from "./api";
import { getLang, t, useI18n } from "./i18n";
import { btn, btnGhost, card, errorCls, inputCls } from "./ui";

/**
 * 配置評估健檢(進階顯示/贊助者):按一下實測主機的 CPU/RAM/磁碟寫入/對外網路,
 * 給逐項評級與總分;可選串 Gemini(使用者自備 key,存 agent 端)產生白話評估。
 * 測試會實寫 64MB 到資料碟 + 對外連線採樣,約 2-5 秒,所以做成手動觸發不自動輪詢。
 */

const RATING_LABEL: Record<ReviewRating, string> = {
  good: "充裕",
  ok: "夠用",
  poor: "吃緊",
};
const RATING_CLS: Record<ReviewRating, string> = {
  good: "bg-grass/15 text-grass",
  ok: "bg-sun/15 text-sun",
  poor: "bg-berry/15 text-berry",
};

const fmtGB = (n: number) => `${(n / (1 << 30)).toFixed(n >= 100 * (1 << 30) ? 0 : 1)} GB`;

function RatingChip({ rating }: { rating: ReviewRating }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${RATING_CLS[rating]}`}>
      {t(RATING_LABEL[rating])}
    </span>
  );
}

export function SystemReviewCard({ client }: { client: AgentClient }) {
  useI18n();
  const [review, setReview] = useState<SystemReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ai, setAi] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [showKeyForm, setShowKeyForm] = useState(false);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      setReview(await client.systemReview());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const runAi = async () => {
    setAiBusy(true);
    setError(null);
    try {
      setAi((await client.systemReviewAi(getLang())).text);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAiBusy(false);
    }
  };

  const saveKey = async () => {
    if (!keyInput.trim()) return;
    setSavingKey(true);
    setError(null);
    try {
      await client.saveAgentSettings({ geminiApiKey: keyInput.trim() });
      setKeyInput("");
      setShowKeyForm(false);
      if (review) setReview({ ...review, aiConfigured: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingKey(false);
    }
  };

  const s = review?.specs;
  const rows = review && s
    ? [
        {
          icon: <FiCpu className="size-4" />,
          label: t("處理器"),
          value: `${s.cpuModel}(${t("{n} 核", { n: s.cpuCores })}${s.cpuSpeedMHz ? ` · ${(s.cpuSpeedMHz / 1000).toFixed(1)}GHz` : ""})`,
          rating: review.cpu.rating,
        },
        {
          icon: <FiZap className="size-4" />,
          label: t("記憶體"),
          value: `${fmtGB(s.ramTotalBytes)}(${t("可用 {v}", { v: fmtGB(s.ramFreeBytes) })})`,
          rating: review.ram.rating,
        },
        {
          icon: <FiHardDrive className="size-4" />,
          label: t("資料碟"),
          value: `${t("剩餘 {v}", { v: fmtGB(s.diskFreeBytes) })} · ${t("實測寫入 {n} MB/s", { n: s.diskWriteMBps })}`,
          rating: review.disk.rating,
        },
        {
          icon: <FiWifi className="size-4" />,
          label: t("對外網路"),
          value:
            s.netAvgMs === null
              ? t("量不到(離線或防火牆)")
              : `${t("平均 {n} ms", { n: s.netAvgMs })} · ${t("抖動 {n} ms", { n: s.netJitterMs ?? 0 })}`,
          rating: review.network.rating,
        },
      ]
    : [];

  return (
    <div className={`${card} mb-3.5 flex flex-col gap-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-sm font-extrabold text-ink-muted">
          <FiActivity className="size-4 text-pal" /> {t("配置評估健檢")}
        </h3>
        <button
          className={`${btnGhost} inline-flex shrink-0 items-center gap-1.5`}
          onClick={() => void run()}
          disabled={busy}
        >
          <FiRefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
          {busy ? t("檢測中(實測磁碟與網路,約 5 秒)…") : review ? t("重新檢測") : t("開始檢測")}
        </button>
      </div>

      {error && <p className={errorCls}>{error}</p>}

      {!review && !busy && (
        <p className="text-[13px] text-ink-muted">
          {t("實測這台主機的處理器 / 記憶體 / 磁碟寫入 / 對外網路,以「開帕魯專用伺服器」的需求給逐項評級與總分。")}
        </p>
      )}

      {review && s && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-ink-muted">{t("綜合評分")}</span>
              <span className={`text-3xl font-extrabold ${review.overall >= 80 ? "text-grass" : review.overall >= 55 ? "text-sun" : "text-berry"}`}>
                {review.overall}
                <span className="text-base text-ink-muted"> / 100</span>
              </span>
            </div>
            <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-ink-muted">
              {t("門檻以帕魯專用伺服器需求為準:記憶體吃最兇(單實例 8-20GB),tick 吃單核,自動備份吃循序寫入。網路為對外連線代理指標,非玩家實際延遲。")}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-2 rounded-xl bg-card-soft px-3 py-2">
                <span className="inline-flex min-w-0 items-center gap-2 text-[13px]">
                  <span className="shrink-0 text-pal">{r.icon}</span>
                  <span className="shrink-0 font-bold text-ink-muted">{r.label}</span>
                  <span className="truncate" title={r.value}>{r.value}</span>
                </span>
                <RatingChip rating={r.rating} />
              </div>
            ))}
          </div>

          {/* AI 評估(選配):Gemini,使用者自備 key,存 agent 端 */}
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-ink-muted">
                <GiBrain className="size-4 text-pal" /> {t("AI 白話評估(Gemini)")}
              </span>
              <div className="flex items-center gap-2">
                {review.aiConfigured && (
                  <button
                    className={`${btn} btn-sm inline-flex items-center gap-1.5`}
                    onClick={() => void runAi()}
                    disabled={aiBusy}
                  >
                    {aiBusy ? t("評估中…") : t("產生評估")}
                  </button>
                )}
                <button
                  className={`${btnGhost} inline-flex items-center gap-1.5`}
                  onClick={() => setShowKeyForm((v) => !v)}
                >
                  <FiKey className="size-4" />
                  {review.aiConfigured ? t("更換 API key") : t("設定 API key")}
                </button>
              </div>
            </div>
            {showKeyForm && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className={`${inputCls} min-w-52 flex-1`}
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={t("貼上 Gemini API key(aistudio.google.com 免費申請;只存在你的 agent 主機)")}
                />
                <button
                  className={`${btn} btn-sm`}
                  onClick={() => void saveKey()}
                  disabled={savingKey || !keyInput.trim()}
                >
                  {savingKey ? t("儲存中…") : t("儲存")}
                </button>
              </div>
            )}
            {ai && <p className="rounded-xl bg-card-soft px-3 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap">{ai}</p>}
            {!review.aiConfigured && !showKeyForm && (
              <p className="text-[12px] text-ink-muted">
                {t("串接你自己的 Gemini API key(免費方案即可),把實測數據交給 AI 產生白話的開服建議。key 只存在 agent 主機,不會上傳。")}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
