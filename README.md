# Visualia Pool

A school shares its own computers for AI work. A computer joins the pool, does work for everyone in the school's pool,
and sends the result back. The pool records the model, tokens, time, energy and who served each job, never what was
asked or answered.

This repository holds everything that runs on a computer in the pool, and the one server it talks to. The rest of
Visualia (the studio, the gateway, the plans) is [visualia/visualia](https://github.com/visualia/visualia); a path
like `plans/pool.md` in a comment here means that repository.

| Folder | What |
|---|---|
| [`protocol/frames.md`](protocol/frames.md) | what goes over the wire, both directions. **Start here** |
| [`app/`](app/README.md) | the Visualia Pool app and the `visualia-pool-cli` program (Rust, macOS and Windows) |
| [`worker/`](worker/README.md) | `pool.visualia.space`: the join page (a browser tab can join too), sign-in, one pool per school |
| `vendor/` | the style sheet and text helper |

## For IT

1. [`protocol/frames.md`](protocol/frames.md): every address, the sign-in, every frame.
2. [`app/README.md`](app/README.md): what a computer in the pool does, never does, and how to stop it.
3. `app/pool-core/src/`: the code that runs. `native.rs` does all the talking, `core.rs` holds the decisions and does
   no I/O.
4. `app/src-tauri/capabilities/default.json` (what the window may ask for) and `app/src-tauri/tauri.conf.json` (its
   Content Security Policy and update key).

## Run

Needs Node 22 or newer. The app and the program also need Rust (`rustup`) and Ollama.

| What | How |
|---|---|
| The program, against the live pool | `cd app && cargo build --release -p pool-core`, then `VISUALIA_KEY=<course key> target/release/visualia-pool-cli` |
| The app | `npm install`, then `cd app && npm run dev` (debug window) or `npm run build` |
| The pool server, locally | `npm run dev` in visualia/visualia (it starts this one too); see [`worker/README.md`](worker/README.md) |
| Tests | `cd app && cargo test -p pool-core --no-default-features`; `npm test -w worker` |
| After visualia's `packages/` change | `node vendor/sync.mjs` |

## Builds

Every push runs [`check.yml`](.github/workflows/check.yml): the core's tests, the core as WebAssembly, the text checks,
and a Windows build of the program and the app (kept 14 days on the run's page). Releases will be built in GitHub
Actions from a tag, signed and attested, so anyone can check a binary came from the commit they read. Until then they
are built and ad-hoc signed by hand.
