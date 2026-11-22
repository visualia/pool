# upscale

Real-ESRGAN 4× upscaling in Rust with [Burn](https://burn.dev): the ONNX
models become Burn code at build time (`build.rs`, `burn-onnx`), so no Python,
ONNX runtime or extra program runs a model. Spike for the pool's upscale job;
results in `plans/local-images.md` ("Upscaling").

| Name here | Model | Size | Licence |
| --- | --- | --- | --- |
| `fast` | Real-ESRGAN-General-x4v3 (SRVGGNetCompact) | 4.9 MB | BSD-3 |
| `quality` | Real-ESRGAN-x4plus (RRDBNet) | 67 MB | BSD-3 |

## Fetch the models (not in git)

Qualcomm AI Hub's float ONNX exports, release v0.66.0 (input 1×3×128×128 in
0..1, but any size works):

```sh
cd app/upscale && mkdir -p models && cd models
for m in real_esrgan_general_x4v3 real_esrgan_x4plus; do
  curl -sLO "https://qaihub-public-assets.s3.us-west-2.amazonaws.com/qai-hub-models/models/$m/releases/v0.66.0/$m-onnx-float.zip"
  unzip -oq $m-onnx-float.zip -d $m
done
shasum -a 256 *.zip
# fc094329b24a00c936ebc1cc4c51bc59633e7dc36f4a553344342171cbd3c7cf  real_esrgan_general_x4v3-onnx-float.zip
# 05aa31323c6a7e831493171cac970e398697709cae7e7ae8e0760e6da4d64ca4  real_esrgan_x4plus-onnx-float.zip
```

## Build for tabs, publish the weights

```sh
./build-web.sh   # WebAssembly + glue into worker/public/upscale/, weights into weights/
node publish-weights.mjs            # R2 visualia-pool-app/files/<name> (checks the SHA-256s in worker/src/models.js)
node publish-weights.mjs --local --persist-to <dir>   # wrangler dev's R2
```

The weights (.bpk) are never built into the app: it downloads them from the
pool (Get in the window, `UPSCALE_DIR` for the CLI); a tab fetches the fast one.

## Run

```sh
UPSCALE_DIR=weights cargo run --release --example run -- fast in.png out.png
```

Tiles are 112 px + 2 × 8 px padding = 128 px (the fastest measured).
Default features: `metal`, `codec`; also `wgpu`, `cpu`, and `web` for tabs.
