/** Builds canonical 44-byte-header PCM WAV files from integer sample values. */
export function pcm16(sampleRate: number, channels: number[][]): Buffer {
  const frames = channels[0]?.length ?? 0;
  const dataSize = frames * channels.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVEfmt ", 8, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(channels.length, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * channels.length * 2, 28);
  buf.writeUInt16LE(channels.length * 2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(dataSize, 40);
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (const ch of channels) {
      buf.writeInt16LE(ch[i]!, offset);
      offset += 2;
    }
  }
  return buf;
}
