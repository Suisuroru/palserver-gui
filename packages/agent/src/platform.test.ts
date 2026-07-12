import assert from "node:assert/strict";
import test from "node:test";
import type { InstanceRecord } from "./store.js";

function expectedPlatform(backend: InstanceRecord["backend"], agentPlatform: string): "windows" | "linux" {
  if (backend === "native") return agentPlatform === "win32" ? "windows" : "linux";
  return "linux";
}

test("serverPlatform: native reflects agent platform", () => {
  assert.equal(expectedPlatform("native", "win32"), "windows");
  assert.equal(expectedPlatform("native", "linux"), "linux");
  assert.equal(expectedPlatform("native", "darwin"), "linux");
});

test("serverPlatform: docker always linux", () => {
  assert.equal(expectedPlatform("docker", "win32"), "linux");
  assert.equal(expectedPlatform("docker", "linux"), "linux");
});

test("serverPlatform: k8s always linux", () => {
  assert.equal(expectedPlatform("k8s", "win32"), "linux");
  assert.equal(expectedPlatform("k8s", "linux"), "linux");
});
