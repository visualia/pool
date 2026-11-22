# visualia-pool

Visualia Pool: the app and `visualia-pool-cli` (Rust, `app/`), the pool Worker (`worker/`), and what goes over the wire
(`protocol/frames.md`). School IT audits this repository, so it holds only what runs on a computer in the pool and the
one server it talks to. The platform and its plans are `~/personal/visualia` (`plans/pool.md`, `plans/worker-app.md`,
`plans/repo-split.md`); its `CLAUDE.md` rules apply here too.

- A change to a frame, an address, or what is stored changes `protocol/frames.md` and the README's claims in the same
  commit.
- The pool keeps no data: no D1. Sign-in asks the gateway (`GATEWAY`, entrypoint `ForPool`); the gateway reaches the
  pool through `ForGateway`. Deploy order when both change: the side that adds a method first.
- `vendor/` is copied from visualia's `packages/` by `node vendor/sync.mjs`; never edit it here.
- UI words live in `worker/public/text.json` and `app/ui/text.json`; load visualia's `visualia-writing` skill
  (`~/personal/visualia/.claude/skills/`) before changing them.
- Dependencies pinned exactly (`.npmrc`). Releases are built by GitHub Actions from a tag (not yet; `plans/repo-split.md`).

## Pushing

Origin is `https://github.com/visualia/pool.git`, owned by the personal account. Switch, push, switch back:

```sh
gh auth switch -u kristjanjansen
git push origin main
gh auth switch -u Kristjan-Jansen_enefit
```
