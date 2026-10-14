/**
 * wavekit CLI.
 *
 *   node src/cli.ts info <file.wav>
 *   node src/cli.ts convert <in.wav> <out.wav> [--mono] [--rate N] [--gain DB] [--normalize DB] [--trim DB] [--bits 8|16|24|32f]
 *   node src/cli.ts concat <out.wav> <in1.wav> <in2.wav> [...]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { WavError } from "./audio.ts";
import { concat, gain, mixdown, normalize, peak, resample, trimSilence } from "./ops.ts";
import { encodeWav, parseWav } from "./wav.ts";

class UsageError extends Error {}

function numberArg(name: string, value: string | undefined): number {
  const n = Number(value);
  if (value === undefined || value.trim() === "" || !Number.isFinite(n)) throw new UsageError(`${name} needs a number`);
  return n;
}

function info(path: string): void {
  const { info, audio } = parseWav(readFileSync(path));
  const p = peak(audio);
  console.log(
    JSON.stringify({
      ...info,
      durationSeconds: info.frames / info.sampleRate,
      peakDb: 20 * Math.log10(p),
    }),
  );
}

function convert(args: string[]): void {
  const [input, output, ...rest] = args;
  if (!input || !output) throw new UsageError("convert needs <in> <out>");
  let { audio } = parseWav(readFileSync(input));
  let bits: 8 | 16 | 24 = 16;
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    if (flag === "--mono") audio = mixdown(audio);
    else if (flag === "--rate") audio = resample(audio, numberArg(flag, rest[++i]));
    else if (flag === "--gain") audio = gain(audio, numberArg(flag, rest[++i]));
    else if (flag === "--normalize") audio = normalize(audio, numberArg(flag, rest[++i]));
    else if (flag === "--trim") audio = trimSilence(audio, numberArg(flag, rest[++i]));
    else if (flag === "--bits") bits = numberArg(flag, rest[++i]) as 8 | 16 | 24;
    else throw new UsageError(`unknown option ${flag}`);
  }
  writeFileSync(output, encodeWav(audio, bits));
}

function concatFiles(args: string[]): void {
  const [output, ...inputs] = args;
  if (!output || inputs.length < 2) throw new UsageError("concat needs <out> and at least two inputs");
  let result = parseWav(readFileSync(inputs[0]!)).audio;
  for (const path of inputs.slice(1)) result = concat(result, parseWav(readFileSync(path)).audio);
  writeFileSync(output, encodeWav(result));
}

function main(argv: string[]): number {
  const [command, ...args] = argv;
  try {
    if (command === "info" && args.length === 1) info(args[0]!);
    else if (command === "convert") convert(args);
    else if (command === "concat") concatFiles(args);
    else throw new UsageError("usage: wavekit info|convert|concat ...");
    return 0;
  } catch (err) {
    if (err instanceof UsageError) {
      console.error(`wavekit: ${err.message}`);
      return 2;
    }
    if (err instanceof WavError || (err as NodeJS.ErrnoException).code === "ENOENT") {
      console.error(`wavekit: ${(err as Error).message}`);
      return 1;
    }
    throw err;
  }
}

process.exitCode = main(process.argv.slice(2));
