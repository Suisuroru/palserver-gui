import { useCallback, useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiFileText, FiServer, FiShield } from "react-icons/fi";
import {
  PALDEFENDER_OPTIONS,
  PD_CATEGORY_LABELS,
  type PalDefenderConfig,
  type PalDefenderConfigStatus,
  type PdOptionCategory,
  type PdOptionKey,
  type PdOptionMeta,
  type PdRestStatus,
} from "@palserver/shared";
import type { AgentClient } from "./api";
import { FileEditor } from "./FileManager";
import { btn, btnGhost, card, errorCls, inputCls } from "./ui";

const KEYS = Object.keys(PALDEFENDER_OPTIONS) as PdOptionKey[];
const RAW_PATH = "Pal/Binaries/Win64/PalDefender/Config.json";
const REST_CONFIG_PATH = "Pal/Binaries/Win64/PalDefender/RESTAPI/RESTConfig.json";
const effective = (values: PalDefenderConfig, k: PdOptionKey) =>
  values[k] ?? PALDEFENDER_OPTIONS[k].default;

export function PalDefenderTab({
  client,
  instanceId,
  running,
}: {
  client: AgentClient;
  instanceId: string;
  running: boolean;
}) {
  const [status, setStatus] = useState<PalDefenderConfigStatus | null>(null);
  const [draft, setDraft] = useState<PalDefenderConfig>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingRaw, setEditingRaw] = useState<string | null>(null);
  const [rest, setRest] = useState<PdRestStatus | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [next, restStatus] = await Promise.all([
        client.palDefenderConfig(instanceId),
        client.palDefenderRest(instanceId).catch(() => null),
      ]);
      setStatus(next);
      setRest(restStatus);
      setDraft(Object.fromEntries(KEYS.map((k) => [k, effective(next.values, k)])));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [client, instanceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const dirtyKeys = useMemo(() => {
    if (!status) return [];
    return KEYS.filter((k) => draft[k] !== effective(status.values, k));
  }, [draft, status]);

  if (!status) return <p className="text-ink-muted">{error ?? "載入中…"}</p>;

  if (!status.supported) {
    return (
      <div className="rounded-(--radius-cute) border-2 border-dashed border-line px-6 py-12 text-center text-ink-muted">
        <FiShield className="mx-auto mb-2 size-11" />
        <p className="mt-1 text-[13px]">{status.reason}</p>
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await client.updatePalDefenderConfig(instanceId, draft);
      setNotice("已儲存並嘗試熱重載(若 RCON 未啟用則於重啟後生效)");
      setTimeout(() => setNotice(null), 3500);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const grouped = new Map<string, PdOptionKey[]>();
  for (const key of KEYS) {
    const label = PD_CATEGORY_LABELS[PALDEFENDER_OPTIONS[key].category as PdOptionCategory];
    grouped.set(label, [...(grouped.get(label) ?? []), key]);
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className={errorCls}>{error}</p>}
      {notice && (
        <p className="rounded-xl bg-grass/10 px-3 py-2 text-[13px] font-bold text-grass">{notice}</p>
      )}

      <div className={`${card} flex flex-wrap items-center justify-between gap-2`}>
        <p className="inline-flex items-center gap-2 text-sm font-extrabold">
          <FiShield className="size-4 text-pal" /> PalDefender 反外掛設定
        </p>
        <button
          className={`${btnGhost} inline-flex items-center gap-1.5`}
          onClick={() => setEditingRaw(RAW_PATH)}
          disabled={!status.exists}
          title={status.exists ? "直接編輯 Config.json" : "檔案尚未產生"}
        >
          <FiFileText className="size-4" /> 編輯 Config.json
        </button>
      </div>
      {!status.exists && status.reason && <p className="text-[13px] text-sun">{status.reason}</p>}

      <RestStatusCard
        rest={rest}
        running={running}
        onEnable={async () => {
          setError(null);
          try {
            await client.enablePalDefenderRest(instanceId);
            setNotice("已啟用 REST API — 重啟伺服器後,玩家分頁即可查看帕魯與背包");
            setTimeout(() => setNotice(null), 4000);
            await refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          }
        }}
        onEditConfig={() => setEditingRaw(REST_CONFIG_PATH)}
      />

      {[...grouped.entries()].map(([category, keys]) => (
        <div key={category} className={card}>
          <h3 className="mb-1 text-sm font-extrabold text-ink-muted">{category}</h3>
          <div className="flex flex-col divide-y divide-line">
            {keys.map((key) => (
              <OptionRow
                key={key}
                optionKey={key}
                value={draft[key] ?? PALDEFENDER_OPTIONS[key].default}
                fileValue={status.values[key]}
                onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))}
              />
            ))}
          </div>
        </div>
      ))}

      {dirtyKeys.length > 0 && (
        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-(--radius-cute) border-2 border-sun/50 bg-card p-3 shadow-(--shadow-cute)">
          <span className="text-[13px] font-bold text-ink-muted">
            小心~您有 {dirtyKeys.length} 項變更尚未儲存!
          </span>
          <div className="flex gap-2">
            <button className={btnGhost} onClick={() => void refresh()} disabled={saving}>
              重置
            </button>
            <button className={btn} onClick={save} disabled={saving}>
              {saving ? "儲存中…" : "確定修改"}
            </button>
          </div>
        </div>
      )}

      {editingRaw && (
        <FileEditor
          client={client}
          instanceId={instanceId}
          path={editingRaw}
          onClose={() => setEditingRaw(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

/** REST API status: managers should know that enabling it unlocks player
 * detail (pals & inventory). Offers a one-click enable + raw config edit. */
function RestStatusCard({
  rest,
  running,
  onEnable,
  onEditConfig,
}: {
  rest: PdRestStatus | null;
  running: boolean;
  onEnable: () => void;
  onEditConfig: () => void;
}) {
  if (!rest || !rest.installed) return null;

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="inline-flex items-center gap-2 text-sm font-extrabold">
            <FiServer className="size-4 text-pal" /> PalDefender REST API
            {rest.enabled ? (
              <span className="rounded-full bg-grass/15 px-2 py-0.5 text-xs font-bold text-grass">已啟用</span>
            ) : (
              <span className="rounded-full bg-sun/15 px-2 py-0.5 text-xs font-bold text-sun">未啟用</span>
            )}
          </h3>
          <p className="mt-1 max-w-xl text-[13px] text-ink-muted">
            {rest.enabled
              ? rest.hasToken
                ? "已啟用且存取權杖就緒。玩家分頁點玩家即可查看其帕魯與背包。"
                : "已啟用。首次查看玩家細節時,agent 會自動建立存取權杖 — 若查詢顯示「權杖尚未生效」,重啟伺服器一次即可。"
              : rest.reason ?? "啟用後即可在玩家分頁查看玩家的帕魯與背包。"}
          </p>
        </div>
        <div className="flex gap-2">
          {rest.configExists && (
            <button className={`${btnGhost} inline-flex items-center gap-1.5`} onClick={onEditConfig}>
              <FiFileText className="size-4" /> 編輯 RESTConfig.json
            </button>
          )}
          {!rest.enabled && rest.configExists && (
            <button className={btn} onClick={onEnable} disabled={running} title={running ? "建議停止後啟用,並重啟以生效" : undefined}>
              一鍵啟用
            </button>
          )}
        </div>
      </div>
      {!rest.enabled && rest.configExists && (
        <p className="mt-2 text-xs text-ink-muted">啟用後需重啟伺服器才會生效。</p>
      )}
    </div>
  );
}

function OptionRow({
  optionKey,
  value,
  fileValue,
  onChange,
}: {
  optionKey: PdOptionKey;
  value: number | boolean;
  fileValue: number | boolean | undefined;
  onChange: (value: number | boolean) => void;
}) {
  const meta: PdOptionMeta = PALDEFENDER_OPTIONS[optionKey];
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
      <div className="min-w-64 flex-1">
        <p className="text-sm font-bold">
          {meta.label}
          {fileValue === undefined && (
            <span className="ml-2 text-xs font-normal text-ink-muted">(未設定,使用預設)</span>
          )}
        </p>
        <p className="font-mono text-xs text-ink-muted">{optionKey}</p>
        {meta.hint && <p className="mt-1 max-w-xl text-xs text-ink-muted">{meta.hint}</p>}
        {meta.warn && (
          <p className="mt-1 inline-flex max-w-xl items-start gap-1.5 text-xs text-sun">
            <FiAlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            {meta.warn}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {meta.type === "bool" ? (
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(value)}
            aria-label={meta.label}
            onClick={() => onChange(!value)}
            className={`relative h-7 w-12 rounded-full transition ${value ? "bg-grass" : "bg-line"}`}
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${value ? "left-6" : "left-1"}`}
            />
          </button>
        ) : (
          <input
            type="number"
            className={`${inputCls} w-28 text-right`}
            value={String(value)}
            min={meta.min}
            max={meta.max}
            step={meta.type === "float" ? meta.step : 1}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) onChange(meta.type === "int" ? Math.trunc(n) : n);
            }}
          />
        )}
      </div>
    </div>
  );
}
