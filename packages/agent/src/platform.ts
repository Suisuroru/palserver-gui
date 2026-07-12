import type { InstanceRecord } from "./store.js";

/**
 * Platform detection that distinguishes the *agent's* OS from the *game
 * server's* OS. PalDefender availability depends on where the server process
 * runs, not where the agent runs. For docker/k8s the server always runs
 * inside a Linux container.
 */

/** The OS the game server process runs on, not the agent's OS. */
export function serverPlatform(rec: InstanceRecord): "windows" | "linux" {
  if (rec.backend === "native") {
    return process.platform === "win32" ? "windows" : "linux";
  }
  return "linux";
}
