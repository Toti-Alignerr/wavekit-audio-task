# wavekit

WAV reading, processing and writing for the podcast production pipeline.
Pure TypeScript on Node.js 22 (type stripping), no runtime dependencies.

```sh
npm ci
npm test
npm run typecheck
node src/cli.ts info episode.wav
node src/cli.ts convert raw.wav out.wav --mono --rate 22050 --normalize -1 --bits 16
node src/cli.ts concat show.wav intro.wav episode.wav outro.wav
```

## Library

```ts
import { parseWav, encodeWav } from "./src/wav.ts";
import { mixdown, resample, gain, normalize, trimSilence, concat, peak } from "./src/ops.ts";
```

`parseWav(buffer)` returns `{ info, audio }`, where `audio.channels` holds
one `Float64Array` per channel with samples in [-1, 1].
`encodeWav(audio, bits)` writes a WAV file.
