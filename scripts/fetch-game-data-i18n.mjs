#!/usr/bin/env node
/**
 * 從 paldb.cc 抓帕魯/道具的多語言名稱,合併進
 * packages/web/public/game-data/{items,pals}.json 的 name(en)/zh/ja 欄位。
 *
 * 資料來源:paldb.cc 的 /en、/tw、/ja 索引頁(維護者為 paldb.cc 貢獻者,
 * 已獲同意抓取;見 public/game-data/CREDITS.md)。
 *
 * 簡中不在這裡抓:上游簡中(zhCN 欄位)由 scripts/fetch-zh-cn.mjs 負責;
 * "zh-CN" 欄位是人工校對譯名,任何抓取腳本都不得寫入,只保留原值。
 *
 * 用法:node scripts/fetch-game-data-i18n.mjs
 * 之後遊戲改版要更新名稱,重跑一次再 commit 即可。
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "packages/web/public/game-data");
const UA = "palserver-gui-data-sync (maintainer-approved; github.com/io-software-ai/palserver-gui)";
const LANGS = [
  ["en", "en"],
  ["tw", "zh"],
  ["ja", "ja"],
];

async function fetchPage(lang, page) {
  const res = await fetch(`https://paldb.cc/${lang}/${page}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`paldb.cc/${lang}/${page} -> HTTP ${res.status}`);
  return res.text();
}

/** 解析索引頁:data-hover="?s=<kind>%2F<內部ID>" 的連結文字就是該語言名稱。
 *  名稱可能包住 <span>(稀有度上色),抓 inner HTML 再剝掉標籤。 */
function parseNames(html, kind) {
  const names = new Map();
  const re = new RegExp(
    `<a class="itemname" data-hover="\\?s=${kind}%2F([^"]+)"[^>]*>(.*?)</a>`,
    "gs",
  );
  for (const [, rawId, rawName] of html.matchAll(re)) {
    const id = decodeURIComponent(rawId);
    const name = rawName.replace(/<[^>]*>/g, "").trim();
    if (name && !names.has(id)) names.set(id, name);
  }
  return names;
}

async function updateCatalog(file, page, kind) {
  const catalog = JSON.parse(await readFile(path.join(DATA_DIR, file), "utf8"));
  const stats = {};
  for (const [site, field] of LANGS) {
    const names = parseNames(await fetchPage(site, page), kind);
    let filled = 0;
    let missing = 0;
    for (const entry of catalog) {
      const name = names.get(entry.id);
      if (!name) {
        // en 欄位是 `name`,一定存在;其他語言缺了就維持原值(fallback 英文)。
        if (field !== "en" && !entry[field]) missing++;
        continue;
      }
      if (field === "en") {
        // 既有的 en 名稱只在空白/佔位時補,避免覆蓋人工修正過的條目。
        if (!entry.name || entry.name === "-") {
          entry.name = name;
          filled++;
        }
      } else if (entry[field] !== name) {
        if (!entry[field] || entry[field] === "-") filled++;
        entry[field] = name;
      }
    }
    stats[field] = { filled, missing };
  }
  // 欄位順序固定(id, name, icon, zh, "zh-CN", zhCN, ja),diff 才好讀。
  const ordered = catalog.map(
    ({ id, name, icon, zh, "zh-CN": reviewed, zhCN, ja, ...rest }) => ({
      id,
      name,
      ...(icon ? { icon } : {}),
      ...(zh ? { zh } : {}),
      ...(reviewed ? { "zh-CN": reviewed } : {}),
      ...(zhCN ? { zhCN } : {}),
      ...(ja ? { ja } : {}),
      ...rest,
    }),
  );
  await writeFile(path.join(DATA_DIR, file), JSON.stringify(ordered) + "\n");
  console.log(`${file}: ${catalog.length} entries`, stats);
}

await updateCatalog("items.json", "Items", "Items");
await updateCatalog("pals.json", "Pals", "Pals");
