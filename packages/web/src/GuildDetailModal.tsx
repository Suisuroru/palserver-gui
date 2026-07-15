import { FiHome, FiMapPin, FiPackage, FiUsers, FiX, FiZap } from "react-icons/fi";
import { GiBookshelf } from "react-icons/gi";
import { savToMap, type SaveGuild } from "@palserver/shared";
import { useGameData, displayName, findCharacter, itemIconUrl, type GameData } from "./gameData";
import { t, useI18n } from "./i18n";
import { Overlay, btnGhost, card } from "./ui";

/**
 * 公會詳情彈窗(存檔快照驅動)— 與 PlayerDetailModal 同款 UX。
 * 公會分頁與線上地圖共用:基礎資訊格 + 成員/據點駐守帕魯/公會倉庫/研究。
 */
export function GuildDetailModal({
  guild,
  generatedAt,
  onShowOnMap,
  onClose,
}: {
  guild: SaveGuild;
  /** 快照掃描時間(有給就顯示資料時效說明) */
  generatedAt?: string | null;
  /** 據點「在地圖上查看」(地圖座標);地圖頁傳 flyTo、其他頁傳切分頁 */
  onShowOnMap?: (x: number, y: number) => void;
  onClose: () => void;
}) {
  useI18n();
  const gameData = useGameData();
  const adminNorm = (guild.adminUid ?? "").replace(/[^0-9a-f]/gi, "").toLowerCase();
  const admin = guild.members.find((m) => m.uid.replace(/[^0-9a-f]/gi, "").toLowerCase() === adminNorm);

  return (
    <Overlay onClose={onClose}>
      <div
        className={`${card} flex max-h-[85vh] w-[720px] max-w-full flex-col gap-4 overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="inline-flex min-w-0 items-center gap-2 text-lg font-extrabold">
            <FiHome className="size-5 shrink-0 text-pal" />
            <span className="truncate">{guild.name}</span>
          </h2>
          <button className={btnGhost} onClick={onClose}>
            <FiX className="inline size-4" /> {t("關閉")}
          </button>
        </div>

        {generatedAt && (
          <p className="-mt-2 text-xs text-ink-muted">
            {t("資料來自存檔掃描(掃描於 {when})。", { when: new Date(generatedAt).toLocaleString() })}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 rounded-cute bg-card-soft/60 p-3 text-sm sm:grid-cols-4">
          <Info label={t("會長")} value={admin?.name ?? "—"} />
          <Info label={t("成員")} value={String(guild.members.length)} />
          <Info label={t("據點")} value={String(guild.bases.length)} />
          <Info
            label={t("據點等級")}
            value={guild.baseCampLevel !== null ? `Lv.${guild.baseCampLevel}` : "—"}
          />
        </div>

        {/* 成員 */}
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-[13px] font-extrabold text-ink-muted">
            <FiUsers className="size-4 text-pal" /> {t("成員")}
            <span className="rounded-full bg-card-soft px-2 py-0.5 text-xs font-bold">{guild.members.length}</span>
          </h4>
          <div className="flex flex-col divide-y divide-line rounded-cute border-2 border-line">
            {guild.members.map((m) => {
              const isAdmin = m.uid.replace(/[^0-9a-f]/gi, "").toLowerCase() === adminNorm;
              return (
                <div key={m.uid} className="flex flex-wrap items-center gap-x-3 px-3 py-1.5 text-[13px]">
                  <span className="min-w-28 font-bold">{m.name}</span>
                  {isAdmin && (
                    <span className="rounded-full bg-sun/15 px-2 py-0.5 text-xs font-bold text-sun">{t("會長")}</span>
                  )}
                  <span className="ml-auto text-xs text-ink-muted">
                    {m.lastOnlineDaysAgo === null
                      ? ""
                      : m.lastOnlineDaysAgo === 0
                        ? t("今天上線")
                        : t("{n} 天前上線", { n: m.lastOnlineDaysAgo })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 據點 + 駐守帕魯 */}
        {guild.bases.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-[13px] font-extrabold text-ink-muted">
              <FiMapPin className="size-4 text-pal" /> {t("據點")}
              <span className="rounded-full bg-card-soft px-2 py-0.5 text-xs font-bold">{guild.bases.length}</span>
            </h4>
            <div className="flex flex-col gap-2">
              {guild.bases.map((b, i) => {
                const m = savToMap(b.x, b.y);
                return (
                  <div key={b.id} className="rounded-cute border-2 border-line p-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-bold">{b.name || t("據點 {n}", { n: i + 1 })}</span>
                      <span className="font-mono text-xs text-ink-muted">
                        ({Math.round(m.x)}, {Math.round(m.y)})
                      </span>
                      {onShowOnMap && (
                        <button
                          className="inline-flex items-center gap-1 rounded-full border-2 border-line px-2 py-0.5 text-xs font-bold text-ink-muted transition hover:border-pal hover:text-pal"
                          onClick={() => onShowOnMap(m.x, m.y)}
                        >
                          <FiMapPin className="size-3" /> {t("在地圖上查看")}
                        </button>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-ink-muted">
                        <FiZap className="size-3.5" /> {t("{n} 隻工作帕魯", { n: b.workers.length })}
                      </span>
                    </div>
                    {b.workers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {b.workers.map((w, j) => {
                          const hit = findCharacter(gameData, w.characterId);
                          return (
                            <span
                              key={`${w.characterId}-${j}`}
                              className="inline-flex items-center gap-1 rounded-full bg-card-soft px-2 py-0.5 text-xs font-bold"
                              title={w.characterId}
                            >
                              {hit?.iconUrl && <img src={hit.iconUrl} alt="" className="size-4" />}
                              {hit ? displayName(hit.entity) : w.characterId}
                              {w.level !== null && (
                                <span className="font-mono font-normal text-ink-muted">Lv.{w.level}</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 公會倉庫 */}
        {guild.storage !== null && (
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-[13px] font-extrabold text-ink-muted">
              <FiPackage className="size-4 text-pal" /> {t("公會倉庫")}
              <span className="rounded-full bg-card-soft px-2 py-0.5 text-xs font-bold">{guild.storage.length}</span>
            </h4>
            {guild.storage.length === 0 ? (
              <p className="text-[13px] text-ink-muted">{t("公會倉庫是空的。")}</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
                {guild.storage.map(({ itemId, count }, i) => {
                  const entity = gameData?.itemById.get(itemId);
                  return (
                    <div key={`${itemId}-${i}`} className="flex items-center gap-2 rounded-xl border-2 border-line p-2">
                      {entity?.icon ? (
                        <img src={itemIconUrl(entity.icon)} alt="" className="size-8 shrink-0" />
                      ) : (
                        <span className="size-8 shrink-0 rounded bg-card-soft" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold">{entity ? displayName(entity) : itemId}</p>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold text-pal">×{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 研究:存檔的 research_info 是整份目錄(含零進度),只列有進度的 */}
        {guild.research && <ResearchSection research={guild.research} gameData={gameData} />}
      </div>
    </Overlay>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="font-bold break-all">{value}</p>
    </div>
  );
}

function ResearchSection({
  research,
  gameData,
}: {
  research: NonNullable<SaveGuild["research"]>;
  gameData: GameData | null;
}) {
  const progressed = research.entries.filter((r) => r.workAmount > 0);
  if (progressed.length === 0 && !research.currentId) return null;
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-[13px] font-extrabold text-ink-muted">
        <GiBookshelf className="size-4 text-pal" /> {t("公會研究")}
        <span className="rounded-full bg-card-soft px-2 py-0.5 text-xs font-bold">{progressed.length}</span>
        {research.currentId && (
          <span className="rounded-full bg-grass/10 px-2 py-0.5 text-xs font-bold text-grass">
            {t("研究中:{id}", { id: researchName(gameData, research.currentId) })}
          </span>
        )}
      </h4>
      {progressed.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {progressed.map((r) => (
            <span key={r.id} className="rounded-full bg-card-soft px-2 py-0.5 text-xs font-bold text-ink-muted" title={r.id}>
              {researchName(gameData, r.id)}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-ink-muted">{t("還沒有任何研究進度。")}</p>
      )}
    </div>
  );
}

/** 研究名稱:優先 game-data 對照表(research.json),查無退回可讀化 id。
 *  真實 research_id 形如 "EmitFlame1"/"Cool3_2"(無前綴),fallback 只做底線轉空格。 */
export function researchName(gameData: GameData | null, id: string): string {
  const meta = gameData?.researchById.get(id) ?? gameData?.researchById.get(id.toLowerCase());
  if (meta) return displayName(meta);
  return id.replace(/_/g, " ");
}
