# The app and the program

One piece of Rust that puts a computer with Ollama into the pool, run two ways: `visualia-pool-cli` in a terminal, and
the Visualia Pool app, a window around the same code (`plans/worker-app.md`).

| Path | What |
|---|---|
| `pool-core/src/core.rs` | the decisions, no I/O: frames, models offered, the JSON check, the cool-down |
| `pool-core/src/native.rs` | the talking: one outbound WebSocket to pool.visualia.space, Ollama on 127.0.0.1 |
| `pool-core/src/meter.rs` | energy per job, temperature, memory |
| `pool-core/src/main.rs` | the `visualia-pool-cli` program |
| `src-tauri/` | the app: the window (`ui/`), the course key in the keychain, `capabilities/default.json` |
| `upscale/` | the upscaler, Real-ESRGAN in Rust ([its README](upscale/README.md)) |

## What it does

- Signs in with the course key and keeps the pool's cookie in memory. The key comes from the keychain (app) or
  `VISUALIA_KEY` (program), never from an argument or a URL.
- Opens one outbound WebSocket to the pool and offers the models it has: chat and decision models in Ollama, the
  upscalers' weights.
- Runs one job at a time on Ollama, thinking off, and streams the words back. Where Ollama can't enforce a JSON schema
  (its MLX runner), the answer is checked before it is sent, or the job goes back to the pool.
- Loads a model only when a job asks for it and keeps nothing warm.
- Measures each job's energy and sends it with the job: macmon on a Mac (the chip and the whole computer),
  `nvidia-smi` elsewhere (the NVIDIA card alone, rough).
- Refuses jobs while the graphics chip is over 85 °C.

## What it never does

- Opens a port or accepts a connection.
- Logs a prompt or an answer (only model, tokens, seconds, energy), or runs tools, files or programs for a job.
- Downloads an Ollama model without a click in the app. The program offers only what Ollama already has; with
  `UPSCALE_DIR` set it fetches missing upscaler weights from the pool, checked by SHA-256.

It talks to `https://pool.visualia.space` and `wss://pool.visualia.space/connect` (out), and to Ollama at
`http://127.0.0.1:11434`.

**To stop it:** Leave in the app, or Ctrl+C for the program. A running job is stopped and finished elsewhere.
Revoking the course key stops it at its next connect; blocking `pool.visualia.space` stops it for good.

## Build

Needs Rust (`rustup`) and Node (for the Tauri CLI only). On a Mac or on Windows:

```sh
cd app
cargo build --release -p pool-core     # the program: target/release/visualia-pool-cli
npm install && npm run build           # the app: target/release/bundle/
cargo test -p pool-core --no-default-features
cargo build -p pool-core --no-default-features --target wasm32-unknown-unknown   # the core alone, as WebAssembly
```

The upscaler needs its ONNX files first ([upscale/README.md](upscale/README.md)). Background removal (`cutout`) is
off: `cutout.rs` does not compile against `ort` 2.0.0-rc.15 yet.

## The program

`VISUALIA_KEY=<course key> visualia-pool-cli`. `--version` prints the version. Ctrl+C (or SIGTERM on a Mac) leaves
the pool and unloads the models.

| Variable | Default | What |
|---|---|---|
| `VISUALIA_KEY` | none, needed | the course key |
| `POOL` | `https://pool.visualia.space` | the pool |
| `OLLAMA` | `http://127.0.0.1:11434` | Ollama |
| `POOL_MODELS` | the built-in list | `name=tag,…`, e.g. `qwen3.5-9b=qwen3.5:9b,clef-flash=clef-flash-8k` |
| `UPSCALE_DIR` | none | where the files from the pool go (upscaler and picture weights) |
| `SD_CLI` | none | stable-diffusion.cpp's `sd-cli`, for picture models, installed separately |

## The app

Run it, or start it with `--join` to join at once (for a login item).

**First screen.** It checks for Ollama (else Get Ollama, which opens https://ollama.com/download), lists the models
on the pool's list (`/app/models`, checked by `core::check_list`; a built-in copy when the pool can't be reached)
with what this computer's memory and disk allow, downloads one with a percent, or removes one (×). It says when
Ollama is older than 0.35.1, which decisions need. Without a window: `cargo run -p pool-core --example onboard [tag]`.

**Updates.** The app asks `https://pool.visualia.space/app/update/…` at start and every 6 hours, shows "Version x is
ready", and installs only on a click: it leaves the pool, downloads, checks the signature against the key in
`tauri.conf.json`, replaces itself and restarts. IT turns this off with:

| | |
|---|---|
| Mac | `defaults write space.visualia.pool Updates off`, or the same key in a managed profile |
| Windows | the string value `Updates` = `off` under `HKLM` or `HKCU\SOFTWARE\Policies\Visualia\Pool` |

**Debug builds only:** `VISUALIA_KEY` in the environment replaces the keychain, and `VISUALIA_TEST_UPDATE=1` installs a
found update without a click.

## Publish a release

```sh
TAURI_SIGNING_PRIVATE_KEY=~/.config/visualia/pool-updater.key TAURI_SIGNING_PRIVATE_KEY_PASSWORD= npm run build
node publish-update.mjs --notes "what changed"     # to R2, then latest.json
```

The private key is on the teacher's work Mac only, outside the repo. Losing it means installed apps can't update
again. To test against `wrangler dev` instead of the live pool, build with
`--debug --config '{"version":"0.2.90","plugins":{"updater":{"endpoints":["http://127.0.0.1:8787/app/update/{{target}}/{{arch}}/{{current_version}}"],"dangerousInsecureTransportProtocol":true}}}'`
and publish with `--debug --local`.
