import { type Audio, WavError, frameCount } from "./audio.ts";

const dbToGain = (db: number) => Math.pow(10, db / 20);

/** Mixes all channels down to one. */
export function mixdown(audio: Audio): Audio {
  const frames = frameCount(audio);
  const mono = new Float64Array(frames);
  for (const channel of audio.channels) {
    for (let i = 0; i < frames; i++) mono[i]! += channel[i]!;
  }
  return { sampleRate: audio.sampleRate, channels: [mono] };
}

export function gain(audio: Audio, db: number): Audio {
  const g = dbToGain(db);
  return { sampleRate: audio.sampleRate, channels: audio.channels.map((ch) => ch.map((x) => x * g)) };
}

export function peak(audio: Audio): number {
  let max = 0;
  for (const ch of audio.channels) for (const x of ch) max = Math.max(max, Math.abs(x));
  return max;
}

/** Scales audio so its peak reaches `targetDb` dBFS. */
export function normalize(audio: Audio, targetDb: number): Audio {
  const p = peak(audio);
  return gain(audio, targetDb - 20 * Math.log10(p));
}

/** Removes silence (below `thresholdDb`) at the start and end. */
export function trimSilence(audio: Audio, thresholdDb: number): Audio {
  const threshold = Math.abs(thresholdDb) / 1000;
  const frames = frameCount(audio);
  const loud = (i: number) => audio.channels.some((ch) => Math.abs(ch[i]!) > threshold);
  const kept: number[] = [];
  for (let i = 0; i < frames; i++) if (loud(i)) kept.push(i);
  return { sampleRate: audio.sampleRate, channels: audio.channels.map((ch) => Float64Array.from(kept, (i) => ch[i]!)) };
}

/** Changes the sample rate. */
export function resample(audio: Audio, rate: number): Audio {
  if (!Number.isInteger(rate) || rate <= 0) throw new WavError(`invalid sample rate ${rate}`);
  const ratio = audio.sampleRate / rate;
  const frames = frameCount(audio);
  const outFrames = Math.round(frames / ratio);
  const channels = audio.channels.map((ch) => {
    const out = new Float64Array(outFrames);
    let pos = 0;
    for (let i = 0; i < outFrames; i++) {
      out[i] = ch[Math.min(Math.floor(pos), frames - 1)]!;
      pos += ratio;
    }
    return out;
  });
  return { sampleRate: rate, channels };
}

/** Appends `b` after `a`. */
export function concat(a: Audio, b: Audio): Audio {
  return {
    sampleRate: a.sampleRate,
    channels: a.channels.map((ch, c) => {
      const other = b.channels[c] ?? new Float64Array(0);
      const out = new Float64Array(ch.length + other.length);
      out.set(ch, 0);
      out.set(other, ch.length);
      return out;
    }),
  };
}
