import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { AGENT_VERSION, DATA_DIR } from "./env.js";

/**
 * playit.gg 隧道代管(一鍵公網):claim 綁定 → 保存 secret → 子行程跑官方
 * playitd(BSD-2-Clause,比照 palsav/DepotDownloader 模式下載官方 binary,
 * SHA256 驗證、不隨包發行)→ 用 HTTPS API 建 UDP 隧道、查公開位址。
 *
 * 事實依據(全部從官方原始碼 tag v1.0.10 逐字查證,見
 * .claude/notes/playit-integration-research.md):
 * - claim code 是本地 5-byte hex;claim URL = https://playit.gg/claim/{code}
 * - POST /claim/setup {code,agent_type,version} 輪詢狀態;UserAccepted 後
 *   POST /claim/exchange {code} → {secret_key}
 * - 認證 header:`Authorization: Agent-Key <secret>`
 * - 建隧道:POST /v1/tunnels/create(部署中的 API 是 OpenAPI/Java client 的
 *   舊版形狀,實測定案):{name?, port_type:"udp", port_count:1,
 *   origin:{type:"agent",data:{agent_id,local_ip:"127.0.0.1",local_port}}, enabled}
 * - 公開位址:POST /v1/agents/rundata → tunnels[].assigned_domain + port.from
 *   (Rust master 分支的 ports/display_address 新形狀「尚未」部署,勿用)
 * - secret 檔:toml `secret_key = "<hex>"`(playitd --secret_path 讀)
 */

const PLAYIT_TAG = "v1.0.10";
const API_BASE = process.env.PALSERVER_PLAYIT_API ?? "https://api.playit.gg";
const CLAIM_BASE = "https://playit.gg/claim/";

/** daemon binary(每平台一檔;SHA256 為 GitHub Releases API digest,pin 死) */
const DAEMON_ASSETS: Partial<Record<string, { name: string; sha256: string }>> = {
  "win32/x64": {
    name: "playit-windows-x86_64-signed.exe",
    sha256: "2dbdaad119844cbbc062cc9774b8b462afa5f1b4b7832a9fc5ef4676cae887cf",
  },
  "linux/x64": {
    name: "playit-linux-amd64",
    sha256: "2df7d9f10227ab312b1ad341853db4e8a8243df5cfcdbae58713a4271711c339",
  },
};

const playitDir = () => path.join(DATA_DIR, "playit");
const secretPath = () => path.join(playitDir(), "playit.toml");
const tunnelsMapPath = () => path.join(playitDir(), "tunnels.json");
const daemonLogPath = () => path.join(playitDir(), "playitd.log");

/* ── 狀態(agent 記憶體) ── */

interface ClaimState {
  code: string;
  url: string;
  status: "waiting-visit" | "waiting-user" | "accepted" | "rejected" | "error" | "claimed";
  error?: string;
}

let claim: ClaimState | null = null;
let daemon: ChildProcess | null = null;
let daemonStartedAt: number | null = null;

/* ── 基礎 ── */

export function daemonSupported(): boolean {
  return DAEMON_ASSETS[`${process.platform}/${process.arch}`] !== undefined;
}

export function hasSecret(): boolean {
  return fs.existsSync(secretPath());
}

function readSecret(): string | null {
  try {
    const raw = fs.readFileSync(secretPath(), "utf8");
    const m = raw.match(/secret_key\s*=\s*"([0-9a-fA-F]+)"/);
    return m ? m[1] : raw.trim();
  } catch {
    return null;
  }
}

/** playit API 回應信封:{"status":"success","data":…} / {"status":"fail"/"error",…} */
async function playitApi<T>(apiPath: string, body: unknown, secret?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${apiPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": `palserver-gui/${AGENT_VERSION}`,
      ...(secret ? { Authorization: `Agent-Key ${secret}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const json = (await res.json().catch(() => null)) as
    | { status: "success"; data: T }
    | { status: "fail" | "error"; data?: unknown }
    | null;
  if (!res.ok || !json || json.status !== "success") {
    throw new Error(
      `playit ${apiPath} 失敗(HTTP ${res.status}):${JSON.stringify(json && "data" in json ? json.data : json).slice(0, 300)}`,
    );
  }
  return json.data;
}

/* ── claim 綁定流程 ── */

/** 開始綁定:產生 claim code,回傳給 UI 顯示的 URL;背景輪詢直到使用者在網頁按同意。 */
export function startClaim(): { url: string; code: string } {
  if (hasSecret()) throw Object.assign(new Error("已綁定 playit 帳號"), { statusCode: 409 });
  if (claim && (claim.status === "waiting-visit" || claim.status === "waiting-user")) {
    return { url: claim.url, code: claim.code };
  }
  const code = crypto.randomBytes(5).toString("hex");
  claim = { code, url: `${CLAIM_BASE}${code}`, status: "waiting-visit" };
  void claimLoop(code);
  return { url: claim.url, code };
}

async function claimLoop(code: string): Promise<void> {
  const deadline = Date.now() + 15 * 60_000; // 15 分鐘沒完成就放棄
  try {
    while (Date.now() < deadline) {
      if (!claim || claim.code !== code) return; // 被重置/換了一輪
      const state = await playitApi<string>("/claim/setup", {
        code,
        // assignable(官方 playit setup 同款):agent 金鑰跑 daemon+讀 rundata;
        // 建隧道需先 /login/guest 換帳號 session(agent 金鑰唯讀)。
        // self-managed 的金鑰未經 daemon 握手前全端點 InvalidAgentKey(實測),不可用。
        agent_type: "assignable",
        version: PLAYIT_TAG.slice(1), // 官方 agent 版號(claim 介面依此顯示相容性)
      });
      if (state === "UserAccepted") {
        const data = await playitApi<{ secret_key: string }>("/claim/exchange", { code });
        fs.mkdirSync(playitDir(), { recursive: true });
        fs.writeFileSync(secretPath(), `secret_key = "${data.secret_key}"\n`, { mode: 0o600 });
        claim.status = "claimed";
        // 綁定完成就把 daemon 帶起來(平台支援的話),隧道才會上線
        if (daemonSupported()) void startDaemon().catch(() => {});
        return;
      }
      if (state === "UserRejected") {
        claim.status = "rejected";
        return;
      }
      claim.status = state === "WaitingForUserVisit" ? "waiting-visit" : "waiting-user";
      await new Promise((r) => setTimeout(r, 2000));
    }
    if (claim?.code === code) {
      claim.status = "error";
      claim.error = "綁定逾時(15 分鐘),請重新開始";
    }
  } catch (err) {
    if (claim?.code === code) {
      claim.status = "error";
      claim.error = err instanceof Error ? err.message : String(err);
    }
  }
}

/** 解除綁定:停 daemon、刪 secret 與隧道對照(playit 帳號端的隧道不動,可網頁上自行刪)。 */
export async function unlink(): Promise<void> {
  await stopDaemon();
  claim = null;
  fs.rmSync(secretPath(), { force: true });
  fs.rmSync(tunnelsMapPath(), { force: true });
}

/* ── daemon(playitd)生命週期 ── */

async function ensureDaemonBinary(): Promise<string> {
  const asset = DAEMON_ASSETS[`${process.platform}/${process.arch}`];
  if (!asset) throw new Error(`此平台不支援 playit daemon(${process.platform}/${process.arch})`);
  const bin = path.join(playitDir(), asset.name);
  if (fs.existsSync(bin)) {
    const hash = crypto.createHash("sha256");
    await pipeline(fs.createReadStream(bin), hash);
    if (hash.digest("hex") === asset.sha256) return bin;
    fs.rmSync(bin, { force: true }); // 壞檔重抓
  }
  fs.mkdirSync(playitDir(), { recursive: true });
  const url = `https://github.com/playit-cloud/playit-agent/releases/download/${PLAYIT_TAG}/${asset.name}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`下載 playit daemon 失敗:HTTP ${res.status}`);
  const tmp = `${bin}.part`;
  await pipeline(Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]), fs.createWriteStream(tmp));
  const hash = crypto.createHash("sha256");
  await pipeline(fs.createReadStream(tmp), hash);
  const actual = hash.digest("hex");
  if (actual !== asset.sha256) {
    fs.rmSync(tmp, { force: true });
    throw new Error("playit daemon 雜湊不符,已拒絕使用(可能下載不完整或被竄改)");
  }
  fs.renameSync(tmp, bin);
  if (process.platform !== "win32") fs.chmodSync(bin, 0o755);
  return bin;
}

export async function startDaemon(): Promise<void> {
  if (daemon && daemon.exitCode === null) return; // 已在跑
  if (!hasSecret()) throw Object.assign(new Error("尚未綁定 playit 帳號"), { statusCode: 409 });
  const bin = await ensureDaemonBinary();
  const child = spawn(bin, ["--secret_path", secretPath(), "-l", daemonLogPath()], {
    cwd: playitDir(),
    stdio: "ignore",
    windowsHide: true,
  });
  daemon = child;
  daemonStartedAt = Date.now();
  child.on("exit", () => {
    if (daemon === child) daemon = null;
  });
}

export async function stopDaemon(): Promise<void> {
  const child = daemon;
  if (!child || child.exitCode !== null) return;
  child.kill();
  for (let i = 0; i < 20 && child.exitCode === null; i++) {
    await new Promise((r) => setTimeout(r, 250));
  }
  if (child.exitCode === null) child.kill("SIGKILL");
  daemon = null;
}

/** agent 開機時呼叫:已綁定就把 daemon 帶起來(隧道自動恢復上線)。 */
export function initPlayit(): void {
  if (hasSecret() && daemonSupported()) {
    void startDaemon().catch(() => {
      /* 開機失敗不擋 agent;UI 的狀態會顯示 daemon 未運行,可手動重啟 */
    });
  }
}

/* ── 隧道 ── */

interface RunDataTunnel {
  id: string;
  name?: string | null;
  proto: string;
  port: { from: number; to?: number };
  local_ip: string;
  local_port: number;
  assigned_domain: string;
}

interface RunData {
  agent_id: string;
  tunnels: RunDataTunnel[];
  pending: { id?: string; name?: string | null; proto?: string }[];
}

/** 玩家要輸入的位址:assigned_domain:port.from。 */
const displayAddress = (tun: RunDataTunnel) => `${tun.assigned_domain}:${tun.port.from}`;

function readTunnelMap(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(tunnelsMapPath(), "utf8"));
  } catch {
    return {};
  }
}

function writeTunnelMap(map: Record<string, string>): void {
  fs.mkdirSync(playitDir(), { recursive: true });
  fs.writeFileSync(tunnelsMapPath(), JSON.stringify(map, null, 2));
}

async function rundata(secret: string): Promise<RunData> {
  return playitApi<RunData>("/v1/agents/rundata", {}, secret);
}

/**
 * 為實例解析公開位址(冪等):
 * 1. 先在 rundata 找「UDP 且 local_port == 遊戲埠」的隧道(含使用者在 playit 網頁建的)→ 直接用
 * 2. 找不到就嘗試 API create —— 目前部署版對 assignable 金鑰唯讀(401)、
 *    self-managed 需未知的 description 欄位(400),兩者都會落到 needWeb:true,
 *    引導使用者到 playit 網頁建一條,回來即被第 1 步自動偵測。
 */
export async function ensureTunnel(
  instanceId: string,
  gamePort: number,
  instanceName: string,
): Promise<{ address: string | null; pending: boolean; needWeb: boolean }> {
  const secret = readSecret();
  if (!secret) throw Object.assign(new Error("尚未綁定 playit 帳號"), { statusCode: 409 });

  const map = readTunnelMap();
  const data = await rundata(secret);

  // 1) 既有隧道匹配:記錄過的 id,或 UDP + local_port 對得上(網頁手建的也認得)
  const match =
    data.tunnels.find((tun) => tun.id === map[instanceId]) ??
    data.tunnels.find((tun) => (tun.proto === "udp" || tun.proto === "both") && tun.local_port === gamePort);
  if (match) {
    if (map[instanceId] !== match.id) {
      map[instanceId] = match.id;
      writeTunnelMap(map);
    }
    return { address: displayAddress(match), pending: false, needWeb: false };
  }
  if (data.pending.length > 0) return { address: null, pending: true, needWeb: false };

  // 2) 嘗試 API 建立(目前部署版兩種金鑰都不放行;保留在此,上游一開放就自動生效)
  try {
    const created = await playitApi<{ id: string }>(
      "/tunnels/create", // 部署版路徑沒有 /v1(實測;/v1 是尚未上線的新 schema)
      {
        name: `palserver-${instanceName}`.slice(0, 60),
        port_type: "udp",
        port_count: 1,
        origin: { type: "agent", data: { agent_id: data.agent_id, local_ip: "127.0.0.1", local_port: gamePort } },
        enabled: true,
      },
      secret,
    );
    map[instanceId] = created.id;
    writeTunnelMap(map);
    return { address: null, pending: true, needWeb: false };
  } catch {
    // 唯讀金鑰/schema 不符 → 走網頁建立引導
    return { address: null, pending: false, needWeb: true };
  }
}

/* ── 對 UI 的狀態總覽 ── */

export interface PlayitStatus {
  daemonSupported: boolean;
  claimed: boolean;
  claim: { url: string; status: ClaimState["status"]; error?: string } | null;
  daemonRunning: boolean;
  daemonUptimeSeconds: number | null;
  /** 已建立的隧道(rundata,best-effort;沒綁定/查詢失敗為 null) */
  tunnels: { id: string; displayAddress: string; portType: string }[] | null;
}

export async function playitStatus(): Promise<PlayitStatus> {
  const claimed = hasSecret();
  let tunnels: PlayitStatus["tunnels"] = null;
  if (claimed) {
    try {
      const secret = readSecret();
      if (secret) {
        const data = await rundata(secret);
        tunnels = data.tunnels.map((tun) => ({
          id: tun.id,
          displayAddress: displayAddress(tun),
          portType: tun.proto,
        }));
      }
    } catch {
      /* API 暫時失敗:tunnels 維持 null,UI 顯示查詢中 */
    }
  }
  return {
    daemonSupported: daemonSupported(),
    claimed,
    claim: claim ? { url: claim.url, status: claim.status, error: claim.error } : null,
    daemonRunning: daemon !== null && daemon.exitCode === null,
    daemonUptimeSeconds:
      daemon && daemon.exitCode === null && daemonStartedAt ? Math.round((Date.now() - daemonStartedAt) / 1000) : null,
    tunnels,
  };
}
