import { type Audio, type WavInfo, WavError } from "./audio.ts";

export interface DecodedWav {
  info: WavInfo;
  audio: Audio;
}

/** Parses a RIFF/WAVE file. */
export function parseWav(buf: Buffer): DecodedWav {
  if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") {
    throw new WavError("not a WAV file");
  }
  const formatTag = buf.readUInt16LE(20);
  const channels = buf.readUInt16LE(22);
  const sampleRate = buf.readUInt32LE(24);
  const bitsPerSample = buf.readUInt16LE(34);
  if (formatTag !== 1) throw new WavError(`unsupported format tag ${formatTag}`);
  const dataSize = buf.readUInt32LE(40);
  const bytesPerSample = bitsPerSample / 8;
  const frames = Math.floor(dataSize / (bytesPerSample * channels));

  const out: Float64Array[] = Array.from({ length: channels }, () => new Float64Array(frames));
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      let value: number;
      if (bitsPerSample === 8) value = buf.readInt8(offset) / 128;
      else if (bitsPerSample === 16) value = buf.readInt16LE(offset) / 32768;
      else if (bitsPerSample === 24) value = buf.readUIntLE(offset, 3) / 8388608;
      else throw new WavError(`unsupported bit depth ${bitsPerSample}`);
      out[c]![i] = value;
      offset += bytesPerSample;
    }
  }
  return {
    info: { format: "pcm", sampleRate, channels, bitsPerSample, frames },
    audio: { sampleRate, channels: out },
  };
}

/** Encodes audio as a canonical 44-byte-header PCM WAV file. */
export function encodeWav(audio: Audio, bitsPerSample: 8 | 16 | 24 = 16): Buffer {
  if (bitsPerSample !== 16) throw new WavError(`cannot write ${bitsPerSample}-bit audio`);
  const channels = audio.channels.length;
  const frames = audio.channels[0]?.length ?? 0;
  const dataSize = frames * channels * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(channels, 22);
  buf.writeUInt32LE(audio.sampleRate, 24);
  buf.writeUInt32LE(audio.sampleRate * channels * 2, 28);
  buf.writeUInt16LE(channels * 2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(dataSize, 40);
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      buf.writeInt16LE(Math.round(audio.channels[c]![i]! * 32768), offset);
      offset += 2;
    }
  }
  return buf;
}
