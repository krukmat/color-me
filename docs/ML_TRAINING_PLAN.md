# ML Training Plan — Hair Segmentation (DO GPU)

This document outlines options, effort, and assets needed to run a GPU-backed training/finetune session for hair segmentation using DigitalOcean (or similar) while keeping execution time and cost low.

## Mini-project status (current)
- Continue using the stub pipeline with the TTL output store already in place.
- F04.5–F04.8 (MediaPipe real masks, deterministic recolor, anti-bleed, full E2E) are deferred.
- BFF and Mobile can integrate against the current ML stub to validate flow and envelopes.
- Align the palette source-of-truth before building the real recolor stage.

## Future training (when reactivated)
### Options (ordered by cost/time)
1) **Zero-train reuse** (preferred upon resumption): use MediaPipe pre-trained models, validate masks with fixtures, polish post-processing.
2) **Light finetune**: adapt an open-source checkpoint (e.g., MODNet/BiSeNet hair), small dataset; ~1–2 GPU hours on DO.
3) **Full training**: only when quality demand justifies it; typically >10 GPU hours.

### Estimated effort (finetune)
- Setup/data prep: 2–3 h; training run: 1–2 GPU h; evaluation/export: 1 h. Total ~4–6 h (1–2 h GPU billed).

### DO GPU environment (when used)
- A10/V100-like droplet, Ubuntu 22.04 with CUDA, Python 3.10; dependencies: torch/torchvision (CUDA), opencv-headless, numpy, matplotlib, tqdm, optionally mediapipe.

### Notebooks (to prepare when active)
1. `notebooks/01_data_prep.ipynb`: ingest dataset, split, resize to 256–384 px, run visual QA.
2. `notebooks/02_train_finetune.ipynb`: load checkpoint, freeze backbone, train 3–5 epochs with batch 2–4, early stop.
3. `notebooks/03_eval_export.ipynb`: compute IoU/F1 on val set, export TorchScript/ONNX, record `model_version`.

### Scripts (optional)
- `scripts/train_hair_segmentation.sh`: bootstrap the environment and run notebooks through `papermill`/`nbconvert` for speed.

### Cost-control
- Use lower resolution and small batches; cap epochs; stop the droplet after export; cache the dataset to avoid reuploads.

### Future integration
- The exported model should hook into `core/segmenter.py` via `ModelCache`; keep the same normalization/resize pipeline and persist `model_version`.
