# What goes over the wire

Everything a pool worker (a browser tab on `/join`, `visualia-pool-cli`, or the Visualia Pool app) sends to the pool
and gets back. The worker opens every connection. It opens no port and accepts no connection.

Written from the code on 2026-11-22: `worker/src/index.js` (the pool) and `app/pool-core/src/core.rs` (`parse_frame`
and the frame builders, the app's side). When this file and the code disagree, the code is right and this file is a
bug.

## Addresses

| From | To | What |
|---|---|---|
| worker | `https://pool.visualia.space/login` | the course key, once, as a form body (never in the URL) |
| worker | `wss://pool.visualia.space/connect` | one WebSocket, kept open while the worker is in the pool |
| app | `https://pool.visualia.space/app/models`, `/app/update/...`, `/app/files/...` | the model list and updates, no sign-in |
| app, CLI | `http://127.0.0.1:11434` | Ollama on the same computer |
| tab | `cdn.jsdelivr.net` | WebLLM 0.2.86 and ONNX Runtime 1.31.1, pinned (`worker/public/join.html`) |
| tab | `huggingface.co`, `*.hf.co` | the chat model's files, downloaded once, on Join |
| tab | `raw.githubusercontent.com` | the model's graphics code (`mlc-ai/binary-mlc-llm-libs`) |
| tab | `https://pool.visualia.space/app/files/...` | the depth model, checked by SHA-256 |

The join page's Content Security Policy (`worker/src/index.js`) blocks every other address for the tab.

The pool itself talks to nothing else on the internet. The platform's gateway reaches it through a Cloudflare service
binding (`ForGateway`), and the pool asks the gateway who a course key belongs to (`ForPool`). Neither is reachable
from outside.

## Signing in

1. `POST /login` with `key=<course key>`, and `Origin: https://pool.visualia.space`. The pool asks the gateway whether
   the key exists and isn't revoked. Yes: `303` with a signed, host-only cookie (`__Host-pool`, 120 days). No: `303`
   to `/join?wrong`. 10 tries a minute per address.
2. `GET /connect` with the cookie and the same `Origin` header, as a WebSocket upgrade. The pool checks again that the
   person still holds a key that isn't revoked, so revoking a key stops that person's worker at its next connect.

The key is never stored by the pool. The CLI and the app keep the cookie in memory only.

## Frames

JSON text frames. `"ping"` gets `"pong"` without waking the pool. `id` ties a job to its answer.

### When a worker joins

| Direction | Frame |
|---|---|
| worker to pool | `{ type: 'hello', kind?: 'node', models: [names] }` once its models are ready. A tab sends no `kind` |
| pool to worker | `{ type: 'welcome', person, workers }` |

### Chat

| Direction | Frame |
|---|---|
| pool to worker | `{ type: 'job', id, model, messages, max_tokens, temperature, top_p, stop, seed, response_format? }` |
| worker to pool | `{ type: 'delta', id, content }` per token, or a few |
| worker to pool | `{ type: 'done', id, usage: { prompt_tokens, completion_tokens }, finish_reason }` |

`response_format` is `{ type: 'json_object', schema: '<JSON schema as a string>' }` when the asker wants JSON.

### Other job kinds (`kind` on the job)

| `kind` | Who takes it | Job | Answer (`done`) |
|---|---|---|---|
| `decide` | app, CLI | `model, state, questions` | `answers, usage` |
| `upscale` | app, CLI; tabs for `upscale-fast` | `model, image` (base64 PNG, JPEG or WebP) | `image` (base64 JPEG, 4x), `width, height, usage` |
| `image` | app, CLI | `model, prompt, width, height, seed, negative?` | `image` (base64 PNG or JPEG), `width, height, usage` |
| `cutout` | app, CLI | `model, image` | `image` (base64 PNG with alpha), `width, height, usage` |
| `depth` | tabs | `model, image` | `image` (base64 grey PNG, near is white), `width, height, usage` |

### Ending a job

| Direction | Frame |
|---|---|
| worker to pool | `{ type: 'error', id, message }` (the app cuts `message` to 200 characters) |
| pool to worker | `{ type: 'cancel', id }` when the asker left or the worker is too slow |

### Energy

A worker that measures energy adds to `usage`: `energy_j`, `energy_net_j`, `sys_energy_j` (joules) and
`energy_source`: `'macmon'` on a Mac (the chip, and the whole computer), `'nvidia-smi'` elsewhere (roughly: the
NVIDIA card's power draw alone, so the chip and system figures are the same). These, with the model, tokens and time, are what ends up in
the school's usage rows. The prompt and the answer pass through the pool's memory to one worker and back, and are not
stored by the pool.

## To the platform

To the gateway, a job is an OpenAI-style event stream. If the worker leaves, errs or stalls, the stream ends with
`{ pool_error }` instead of `[DONE]`, so the gateway can finish the answer elsewhere.

## Next

- Fixtures: one JSON file per frame, parsed by both `cargo test` and the Worker's tests, so a change to the wire shows
  up as a change here.
- `visualia-pool-cli --trace`: print each frame in and out (type, size, model; never prompt or answer unless asked).
