import assert from "node:assert/strict";
import { test } from "node:test";
import type { Audio } from "../src/audio.ts";
import { concat, gain, normalize, peak, resample } from "../src/ops.ts";

const audio = (rate: number, ...channels: number[][]): Audio => ({ sampleRate: rate, channels: channels.map((c) => Float64Array.from(c)) });
const close = (a: Float64Array, b: number[]) => a.forEach((x, i) => assert.ok(Math.abs(x - b[i]!) < 1e-9, `${x} vs ${b[i]}`));

test("gain of 0 dB is the identity and -20 dB divides by ten", () => {
  const a = audio(8000, [0.5, -0.25, 0.1]);
  assert.deepEqual(Array.from(gain(a, 0).channels[0]!), [0.5, -0.25, 0.1]);
  close(gain(a, -20).channels[0]!, [0.05, -0.025, 0.01]);
});

test("normalize scales the peak to the target", () => {
  const out = normalize(audio(8000, [0.25, -0.5, 0.125]), -6.020599913279624);
  assert.ok(Math.abs(peak(out) - 0.5) < 1e-9);
});

test("resample to the same rate keeps samples, halving keeps every other sample", () => {
  const a = audio(16000, [0, 0.1, 0.2, 0.3, 0.4, 0.5]);
  assert.deepEqual(Array.from(resample(a, 16000).channels[0]!), [0, 0.1, 0.2, 0.3, 0.4, 0.5]);
  const half = resample(a, 8000);
  assert.equal(half.sampleRate, 8000);
  assert.deepEqual(Array.from(half.channels[0]!), [0, 0.2, 0.4]);
});

test("concat appends", () => {
  const out = concat(audio(8000, [0.1, 0.2]), audio(8000, [0.3]));
  assert.deepEqual(Array.from(out.channels[0]!), [0.1, 0.2, 0.3]);
});
