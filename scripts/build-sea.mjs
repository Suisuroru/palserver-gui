// 把打包好的 agent.cjs 做成 Node SEA 免安裝執行檔(玩家不用先裝 Node)。
// 只會為「當前作業系統」產生執行檔 —— Windows exe 需在 Windows 上(或 CI 的
// windows runner)執行本腳本。流程參考 Node 官方 Single Executable Applications。
//
// 產物放在 release/:
//   palserver-agent(或 .exe)  免安裝執行檔
//   web/                        前端靜態檔(執行檔會找它旁邊的 web/)
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const isMac = process.platform === "darwin";

const bundle = path.join(root, "packages/agent/bundle/agent.cjs");
if (!fs.existsSync(bundle)) {
  console.error("找不到 bundle,請先跑 `pnpm bundle:agent`");
  process.exit(1);
}

const releaseDir = path.join(root, "release");
fs.mkdirSync(releaseDir, { recursive: true });
const exeName = isWin ? "palserver-agent.exe" : "palserver-agent";
const exePath = path.join(releaseDir, exeName);
const blobPath = path.join(root, "sea-prep.blob");
const configPath = path.join(root, "sea-config.json");

// 1) 產生 SEA 設定與 blob
fs.writeFileSync(
  configPath,
  JSON.stringify({ main: bundle, output: blobPath, disableExperimentalSEAWarning: true }),
);
execFileSync(process.execPath, ["--experimental-sea-config", configPath], { stdio: "inherit" });

// 2) 複製一份 node 執行檔當作載體
fs.copyFileSync(process.execPath, exePath);

// 3) macOS:注入前要先移除既有簽章
if (isMac) execSync(`codesign --remove-signature "${exePath}"`);

// 4) 用 postject 把 blob 注入執行檔
const fuse = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";
const args = ["postject", exePath, "NODE_SEA_BLOB", blobPath, "--sentinel-fuse", fuse];
if (isMac) args.push("--macho-segment-name", "NODE_SEA");
execFileSync(isWin ? "npx.cmd" : "npx", ["--yes", ...args], { stdio: "inherit" });

// 5) macOS:重新做 ad-hoc 簽章,否則會被 Gatekeeper 擋
if (isMac) execSync(`codesign --sign - "${exePath}"`);

// 6) 把前端靜態檔放到執行檔旁的 web/,agent 會自動找它
const webSrc = path.join(root, "packages/web/dist");
const webDst = path.join(releaseDir, "web");
if (fs.existsSync(webSrc)) {
  fs.rmSync(webDst, { recursive: true, force: true });
  fs.cpSync(webSrc, webDst, { recursive: true });
}

// 7) 附上授權條款 —— PolyForm Noncommercial 的 Notices 條款要求:拿到軟體副本的人
// 也要拿到條款(或條款網址)。發佈的壓縮檔因此必須含這一份。
const licenseDst = path.join(releaseDir, "LICENSE.md");
fs.copyFileSync(path.join(root, "LICENSE.md"), licenseDst);

// 8) 清理中間檔
fs.rmSync(blobPath, { force: true });
fs.rmSync(configPath, { force: true });

console.log(`\nSEA 執行檔 → ${exePath}`);
console.log(`前端 → ${webDst}`);
console.log(`授權 → ${licenseDst}`);
