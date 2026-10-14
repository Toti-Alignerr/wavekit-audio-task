import assert from "node:assert/strict";
import { test } from "node:test";
import { encodeWav, parseWav } from "../src/wav.ts";
import { pcm16 } from "./helpers.ts";

test("parses a canonical 16-bit mono file", () => {
  const { info, audio } = parseWav(pcm16(8000, [[0, 16384, -16384, -32768, 32767]]));
  assert.deepEqual(info, { format: "pcm", sampleRate: 8000, channels: 1, bitsPerSample: 16, frames: 5 });
  assert.deepEqual(Array.from(audio.channels[0]!), [0, 0.5, -0.5, -1, 32767 / 32768]);
});

test("parses interleaved stereo", () => {
  const { info, audio } = parseWav(pcm16(44100, [[1, 2, 3], [-1, -2, -3]]));
  assert.equal(info.channels, 2);
  assert.deepEqual(Array.from(audio.channels[0]!).map((x) => x * 32768), [1, 2, 3]);
  assert.deepEqual(Array.from(audio.channels[1]!).map((x) => x * 32768), [-1, -2, -3]);
});

test("16-bit encode/parse round trip is lossless", () => {
  const original = pcm16(22050, [[0, 100, -100, 12345, -32768, 32767], [5, 6, 7, 8, 9, 10]]);
  const { audio } = parseWav(original);
  assert.deepEqual(encodeWav(audio, 16), original);
});

test("rejects files that are not WAV", () => {
  assert.throws(() => parseWav(Buffer.from("definitely not a wav file, long enough to have a header")), /not a WAV/);
});
