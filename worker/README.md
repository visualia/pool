# The pool server

`pool.visualia.space`: the join page, sign-in, and one `Pool` Durable Object per school, in `src/index.js`
(`plans/pool.md`). It keeps no data: sign-in asks the gateway (`ForPool`), and the gateway reaches the pool only
through the `ForGateway` service binding. The frames are in [`../protocol/frames.md`](../protocol/frames.md).

## Routes

| Route | What |
|---|---|
| `GET /join` | the join page (`public/join.html`): sign in, pick a model, join from the browser tab |
| `POST /login`, `POST /logout`, `GET /me` | the course key in, a signed cookie out |
| `GET /connect` | the WebSocket a worker (tab, app or program) joins with |
| `GET /app/models` | the model list (`src/models.js`); the app checks it against its own limits |
| `GET /app/update/<target>/<arch>/<version>` | the update manifest when a newer app exists, else 204 |
| `GET /app/files/<name>` | updates and model files, from the R2 bucket `visualia-pool-app` |

The `/app/` routes need no sign-in: the app checks each update's signature and each file's SHA-256. Changing
`src/models.js` needs a deploy here, not an app update.

## Run and deploy

| What | How |
|---|---|
| Locally, with the rest of Visualia | `npm run dev` in visualia/visualia: the pool at http://127.0.0.1:8788/join |
| Locally, alone | `npm run dev -w worker` (sign-in then fails: it needs the gateway) |
| Deploy | `npm run deploy -w worker` |

Locally it needs `worker/.dev.vars` with `SESSION_SECRET=<any long random text>` and
`ORIGIN=http://pool.visualia.space` (wrangler dev rewrites the Origin header to the route's host), and
`app/upscale/build-web.sh` run once for the tab's upscaler.

## Tests and measurements

- `npm test -w worker`: depth jobs, in Node and in the page. Needs the research checkout beside this one, or
  `DEPTH_DATA`.
- `node meter.mjs [model] [runs]`: a model's energy on a fixed prompt, on a Mac. It waits a minute, and for the GPU to
  be under 60 °C, before each run.
