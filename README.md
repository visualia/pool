# Visualia Pool

Visualia Pool lets a school share its own computers for AI work. A computer joins the pool, takes work from everyone
in the school's pool, and sends the result back. Only the model, time and energy of the work are recorded, never what
was asked or answered.

This repository has everything that runs on a computer in the pool, and the one server it talks to.

```
protocol/frames.md   what goes over the wire, both directions. Start here
app/                 the Visualia Pool app (Tauri) and the visualia-pool-cli program (Rust), README.md
worker/              pool.visualia.space: the join page (a browser tab can join too), sign-in, one Pool per school, README.md
vendor/              the style sheet and text helper, copied from visualia/visualia (vendor/SOURCE says which commit)
```

The rest of Visualia (the studio, the gateway that every model call goes through, the plans) is in
[visualia/visualia](https://github.com/visualia/visualia). A path like `plans/pool.md` in a comment here means that
repository.

## For IT: what to read

1. `protocol/frames.md`: the addresses, sign-in and every frame.
2. `worker/README.md`: what a computer in the pool does and never does, and how to stop it.
3. `app/pool-core/src/`: the code that runs and what it talks to (`native.rs` does all the talking, `core.rs` holds
   the decisions and does no I/O).
4. `app/src-tauri/capabilities/default.json` (what the window may ask for) and `app/src-tauri/tauri.conf.json` (its
   Content Security Policy and update key).

## Run it

You need Node 22 or newer. The app and the program also need Rust (`rustup`) and Ollama.

**The program against the live pool**, with a course key:

```sh
cd app
cargo build --release -p pool-core
VISUALIA_KEY=<course key> target/release/visualia-pool-cli
```

**The app**: `npm install`, then `cd app && npm run dev` (a window, debug build) or `npm run build`
(`app/target/release/bundle/macos/Visualia Pool.app`).

**The pool server on your own computer**: `npm install`, then `npm run dev -w worker` (needs `app/upscale/build-web.sh`
run once for the tab's upscaler, and `worker/.dev.vars` with `SESSION_SECRET=<any long random text>` and
`ORIGIN=http://pool.visualia.space`, since wrangler dev rewrites the Origin header to the route's host). Sign-in goes to the gateway, so for a whole local system start it from
visualia/visualia with `npm run dev` there (that README says how), and point the program at it:
`POOL=http://127.0.0.1:8788 VISUALIA_KEY=<key> target/release/visualia-pool-cli`.

**Tests**: `cd app && cargo test -p pool-core --no-default-features` (the core, no network),
`npm test -w worker` (depth jobs; needs the research checkout beside this one, or `DEPTH_DATA`).

**After visualia/packages changes**: `node vendor/sync.mjs` (copies from `../visualia` and records the commit).

## Builds

Every push runs `.github/workflows/check.yml`: the core's tests, the core built as WebAssembly, and the text checks.
Releases will be built by GitHub Actions from a tag, signed and attested, so anyone can check that a binary came from
the commit they read (`plans/repo-split.md`). Until then releases are built and ad-hoc signed by hand.
