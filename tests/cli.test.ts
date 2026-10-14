import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pcm16 } from "./helpers.ts";

const dir = mkdtempSync(join(tmpdir(), "wavekit-test-"));
const cli = (...args: string[]) => spawnSync(process.execPath, ["src/cli.ts", ...args], { encoding: "utf8" });

test("info prints format details as JSON", () => {
  const path = join(dir, "a.wav");
  writeFileSync(path, pcm16(8000, [[0, 16384, -16384, 0], [0, 0, 0, 0]]));
  const result = cli("info", path);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.equal(data.format, "pcm");
  assert.equal(data.sampleRate, 8000);
  assert.equal(data.channels, 2);
  assert.equal(data.bitsPerSample, 16);
  assert.equal(data.frames, 4);
  assert.equal(data.durationSeconds, 0.0005);
  assert.ok("peakDb" in data);
});

test("convert with no options rewrites 16-bit audio identically", () => {
  const src = join(dir, "b.wav");
  const out = join(dir, "b-out.wav");
  writeFileSync(src, pcm16(16000, [[1, -2, 300, -32768, 32767]]));
  execFileSync(process.execPath, ["src/cli.ts", "convert", src, out]);
  assert.deepEqual(readFileSync(out), readFileSync(src));
});

test("errors: missing file exits 1, bad usage exits 2", () => {
  assert.equal(cli("info", join(dir, "missing.wav")).status, 1);
  assert.equal(cli("frobnicate").status, 2);
  assert.equal(cli("convert", "only-one-arg").status, 2);
  const src = join(dir, "c.wav");
  writeFileSync(src, pcm16(8000, [[0]]));
  assert.equal(cli("convert", src, join(dir, "c2.wav"), "--gain", "loud").status, 2);
});
