/** Decoded audio: one Float64Array of samples in [-1, 1] per channel. */
export interface Audio {
  sampleRate: number;
  channels: Float64Array[];
}

export type SampleFormat = "pcm" | "float";

export interface WavInfo {
  format: SampleFormat;
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  frames: number;
}

export class WavError extends Error {}

export function frameCount(audio: Audio): number {
  return audio.channels[0]?.length ?? 0;
}
