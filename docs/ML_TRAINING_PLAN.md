# ML Training Plan — Hair Segmentation (GPU Optimized)

This document outlines **maximum-optimized** options for GPU-backed training/finetuning of hair segmentation models using DigitalOcean or similar providers, with focus on **minimal cost, minimal time, maximum quality**.

---

## Current Status (F02 MVP)

- ✅ Stub pipeline with TTL output store operational
- ✅ BFF and Mobile integrated against ML stub
- ✅ Palette source-of-truth aligned (10 colors)
- ⏸️ Deferred: F04.5–F04.8 (MediaPipe real masks, deterministic recolor, anti-bleed)

**Decision**: Continue with stub until F03 completion, then activate real segmentation.

---

## Training Strategy (Maximum Optimization)

### 1. Zero-Train Reuse (RECOMMENDED — $0, 0 GPU hours)

**Approach**: Use pre-trained MediaPipe models without any training
- **Model**: MediaPipe Hair Segmentation (pre-trained on massive dataset)
- **Quality**: Production-grade, validated on diverse hair types
- **Cost**: $0 (no GPU needed)
- **Time**: 1-2 hours integration + testing
- **Effort breakdown**:
  - Integration: 30 min (update `segmenter.py`)
  - Fixture testing: 30 min (validate masks on test images)
  - Post-processing tuning: 30-60 min (feathering, anti-bleed)

**Why this is optimal**:
- MediaPipe models are state-of-the-art, trained on millions of images
- No dataset collection/labeling required
- Zero GPU cost
- Instant deployment
- Proven in production (Google products)

**Implementation checklist**:
- [ ] Install MediaPipe Python SDK (`pip install mediapipe`)
- [ ] Update `core/segmenter.py` to use MediaPipe SelfieSegmentation
- [ ] Configure model selection (general vs landscape model)
- [ ] Test on 20+ diverse fixtures (skin tones, hair types, lighting)
- [ ] Tune post-processing (blur radius, edge feathering)
- [ ] Benchmark inference time (target: <500ms on CPU, <100ms on GPU)

---

### 2. Light Finetune (IF MediaPipe Quality Insufficient — ~$5-10, 1-2 GPU hours)

**When to use**: Only if MediaPipe fails on edge cases (very curly hair, specific lighting, etc.)

#### 2.1 GPU Provider Selection (Cost-Optimized)

| Provider | Instance | GPU | RAM | $/hour | Spot $/hour | Recommendation |
|----------|----------|-----|-----|--------|-------------|----------------|
| **DigitalOcean** | GPU Droplet | A10 (24GB) | 32GB | $3.00 | N/A | ✅ Simple, predictable |
| **Lambda Labs** | gpu_1x_a10 | A10 (24GB) | 30GB | $0.75 | N/A | ⭐ Best price |
| **Paperspace** | A4000 | RTX A4000 (16GB) | 45GB | $0.76 | N/A | ✅ Good value |
| **Vast.ai** | RTX 3090 | RTX 3090 (24GB) | 32GB | $0.30 | $0.15 | ⭐ Cheapest spot |
| **GCP** | n1-standard-4 + T4 | T4 (16GB) | 15GB | $0.35 | $0.11 | ✅ Spot pricing |

**Recommendation**:
1. **Production**: Lambda Labs ($0.75/hr) — best balance of price and reliability
2. **Experimentation**: Vast.ai spot ($0.15/hr) — cheapest, interruptible
3. **Enterprise**: DigitalOcean ($3.00/hr) — most predictable billing

**Cost estimate**:
- Setup/validation: 30 min ($0.06-0.25)
- Training: 1-2 hours ($0.15-1.50)
- Export/test: 30 min ($0.06-0.25)
- **Total**: $0.27-2.00 for 2-3 hour session

#### 2.2 Base Model Selection (Quality/Speed Tradeoff)

| Model | Params | Speed (CPU) | Speed (GPU) | Quality | Finetune Effort |
|-------|--------|-------------|-------------|---------|-----------------|
| **MediaPipe** | ~2M | 100ms | 30ms | ⭐⭐⭐⭐ | N/A (pre-trained) |
| **MODNet (MobileNetV2)** | 6.5M | 200ms | 50ms | ⭐⭐⭐⭐ | Low (2-3 epochs) |
| **BiSeNet V2** | 5.6M | 180ms | 45ms | ⭐⭐⭐⭐⭐ | Medium (5 epochs) |
| **DeepLabV3+ (MobileNet)** | 5.8M | 220ms | 60ms | ⭐⭐⭐⭐ | Medium (5 epochs) |
| **U-Net (ResNet34)** | 24M | 400ms | 100ms | ⭐⭐⭐⭐⭐ | High (10+ epochs) |

**Recommendation**: **MODNet (MobileNetV2)** — best quality/speed/finetune-effort balance

#### 2.3 Dataset Requirements (Minimal Viable)

**Minimum dataset size**: 500-1000 images (200 train, 50 val, 50 test)

**Sources** (free/low-cost):
1. **CelebA-HQ** (30k faces, many with varied hair) — free
2. **Figaro-1k** (1050 images with hair masks) — free, hair-specific
3. **LFW (Labeled Faces in the Wild)** (13k faces) — free
4. **Custom scraping** (Instagram/Pinterest with attribution) — manual effort
5. **Synthetic augmentation** (StyleGAN2 faces + mask transfer) — computational cost

**Recommended**: **Figaro-1k** (already annotated for hair) + augmentation to 2000 samples

**Data augmentation pipeline** (maximize dataset efficiency):
```python
# Albumentations pipeline (fast, GPU-compatible)
transform = A.Compose([
    A.HorizontalFlip(p=0.5),
    A.Rotate(limit=15, p=0.3),
    A.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1, p=0.5),
    A.GaussianBlur(blur_limit=3, p=0.2),
    A.RandomBrightnessContrast(p=0.3),
    A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=20, val_shift_limit=10, p=0.3),
    A.Resize(384, 384),  # Fixed size for training
    A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])
```

**Dataset preprocessing optimization**:
- Pre-resize all images to 384x384 (saves GPU memory, faster loading)
- Cache to disk as `.npy` files (10x faster loading than JPEG)
- Use `torch.utils.data.DataLoader` with `num_workers=4` and `pin_memory=True`

#### 2.4 Training Optimization (Maximum Speed)

**Optimizations to minimize GPU time**:

1. **Mixed Precision Training (FP16)**:
   - 2x faster training
   - 2x less GPU memory (allows larger batches)
   - Implementation: `torch.cuda.amp.GradScaler` + `autocast()`

2. **Gradient Accumulation**:
   - Simulate batch_size=16 while using batch_size=4 (fits in 16GB GPU)
   - No quality loss, 4x less memory

3. **Learning Rate Scheduling**:
   - Warmup: 100 steps (prevent early divergence)
   - Cosine annealing: smooth convergence
   - Early stopping: patience=3 epochs (stop if val loss plateaus)

4. **Efficient Loss Function**:
   - Binary Cross-Entropy + Dice Loss (faster than IoU loss)
   - Class balancing (hair vs background ratio)

5. **Checkpoint Strategy**:
   - Save only best model (by val IoU)
   - Don't save optimizer state (saves 50% disk space)

**Training hyperparameters (optimized)**:
```python
config = {
    'epochs': 5,              # Light finetune (not from scratch)
    'batch_size': 4,          # Fits in 16GB GPU with FP16
    'accumulation_steps': 4,  # Effective batch_size = 16
    'lr': 1e-4,               # Conservative for finetuning
    'weight_decay': 1e-5,
    'optimizer': 'AdamW',
    'scheduler': 'cosine',
    'warmup_steps': 100,
    'early_stopping_patience': 3,
    'mixed_precision': True,  # FP16
    'gradient_clip': 1.0,
}
```

**Expected training time**:
- Setup/data loading: 5 min
- Epoch 1: 15 min (500 images, batch_size=4, FP16)
- Epochs 2-5: 12 min each (early stopping may trigger at epoch 3-4)
- **Total**: ~60-75 minutes GPU time

**Cost**: 1.25 hours × $0.75/hr (Lambda Labs) = **$0.94**

#### 2.5 Training Notebooks (Execution Order)

**Notebook 1: `notebooks/01_data_prep.ipynb`** (10-15 min, CPU)
- Download Figaro-1k dataset
- Visual QA (check masks, remove corrupted images)
- Train/val/test split (200/50/50)
- Pre-resize to 384x384
- Cache as `.npy` files
- Compute dataset statistics (mean, std for normalization)

**Notebook 2: `notebooks/02_train_finetune.ipynb`** (60-75 min, GPU)
- Load pre-trained MODNet checkpoint
- Freeze backbone (train only decoder)
- Setup mixed precision + gradient accumulation
- Train with early stopping
- Log metrics to TensorBoard
- Save best checkpoint

**Notebook 3: `notebooks/03_eval_export.ipynb`** (10-15 min, GPU)
- Load best checkpoint
- Compute val/test metrics (IoU, F1, precision, recall)
- Visual qualitative results (20 samples)
- Export to TorchScript (for production)
- Export to ONNX (for cross-platform)
- Record `model_version` and metrics in `model_registry.json`

**Total time**: 80-105 minutes (1.3-1.75 hours)

#### 2.6 Automated Execution Script

**`scripts/train_hair_segmentation.sh`** (for hands-free execution):
```bash
#!/bin/bash
set -e

echo "🚀 Starting automated training pipeline..."

# 1. Setup environment (5 min)
echo "📦 Installing dependencies..."
pip install -q torch torchvision albumentations opencv-python-headless \
    numpy matplotlib tqdm tensorboard papermill nbconvert

# 2. Data prep (10 min, CPU)
echo "📊 Running data preparation..."
papermill notebooks/01_data_prep.ipynb /tmp/01_output.ipynb

# 3. Training (60-75 min, GPU)
echo "🔥 Running training (this will take ~1 hour)..."
papermill notebooks/02_train_finetune.ipynb /tmp/02_output.ipynb

# 4. Evaluation & Export (10 min, GPU)
echo "📈 Running evaluation and export..."
papermill notebooks/03_eval_export.ipynb /tmp/03_output.ipynb

# 5. Auto-shutdown (save $$$)
echo "✅ Training complete! Shutting down in 5 minutes..."
echo "shutdown -h +5" | at now

echo "🎉 Done! Check /tmp/*_output.ipynb for results"
```

**Usage**:
```bash
# SSH into GPU instance
ssh user@gpu-instance

# Clone repo and run
git clone https://github.com/yourorg/color-me.git
cd color-me
chmod +x scripts/train_hair_segmentation.sh
./scripts/train_hair_segmentation.sh

# Script runs for ~90 min, then auto-shuts down instance
```

#### 2.7 Cost Optimization Strategies

**Pre-training**:
- [ ] Prepare dataset locally (don't waste GPU time on data prep)
- [ ] Test notebooks on CPU/small subset before GPU run
- [ ] Cache dataset to S3/DO Spaces (avoid re-downloading on each run)

**During training**:
- [ ] Use spot/preemptible instances (50-70% cheaper)
- [ ] Set auto-shutdown after training (avoid idle billing)
- [ ] Monitor GPU utilization (`nvidia-smi` every 5 min)
- [ ] Use TensorBoard to detect early stopping sooner

**Post-training**:
- [ ] Download model immediately, delete instance
- [ ] Store model in version control (Git LFS) or S3
- [ ] Document `model_version` and metrics in repo

**Expected cost breakdown**:
```
Setup + data validation:   15 min × $0.75/hr = $0.19
Training:                  70 min × $0.75/hr = $0.88
Evaluation + export:       15 min × $0.75/hr = $0.19
Buffer:                    20 min × $0.75/hr = $0.25
─────────────────────────────────────────────────────
Total:                    120 min           = $1.50
```

**With spot pricing (Vast.ai)**:
```
Total:                    120 min × $0.15/hr = $0.30
```

---

### 3. Full Training (NOT RECOMMENDED — $50-200, 10+ GPU hours)

**Only if**:
- MediaPipe fails on >30% of use cases
- Finetuned model still underperforms
- Budget allows for extensive experimentation

**Cost estimate**: 10-20 hours × $0.75-3.00/hr = **$7.50-60**

**Not recommended for MVP** — diminishing returns on quality.

---

## Model Performance Benchmarks (Target Metrics)

### Quality Metrics (on validation set)

| Metric | Threshold | Target | Excellent |
|--------|-----------|--------|-----------|
| **IoU (Intersection over Union)** | >0.85 | 0.90 | 0.95 |
| **F1 Score** | >0.90 | 0.93 | 0.97 |
| **Precision** | >0.90 | 0.93 | 0.96 |
| **Recall** | >0.88 | 0.92 | 0.95 |

**Evaluation criteria**:
- IoU <0.85: Reject model, investigate dataset quality
- IoU 0.85-0.90: Acceptable for MVP, monitor edge cases
- IoU >0.90: Production-ready

### Speed Metrics (inference time)

| Hardware | Target | Acceptable | Too Slow |
|----------|--------|------------|----------|
| **CPU (Intel i7)** | <300ms | <500ms | >500ms |
| **GPU (CUDA)** | <50ms | <100ms | >100ms |
| **Mobile (TFLite)** | <200ms | <400ms | >400ms |

**Optimization techniques** (if too slow):
- [ ] Quantization (INT8) — 2-4x speedup, minimal quality loss
- [ ] TorchScript compilation — 1.5-2x speedup
- [ ] ONNX Runtime — 1.3-1.8x speedup
- [ ] TensorRT (NVIDIA) — 3-5x speedup on GPU
- [ ] Model pruning — remove 30-50% of weights, 1.5-2x speedup

---

## Integration Plan (into ML API)

### Step 1: Export Model in Production Format

**Formats to export**:
1. **TorchScript** (`.pt`) — for PyTorch backend in ML API
2. **ONNX** (`.onnx`) — for cross-platform compatibility
3. **TFLite** (`.tflite`) — for mobile deployment (future)

**Export script** (`scripts/export_model.py`):
```python
import torch
import torch.onnx

# Load trained model
model = load_trained_model('checkpoints/best_model.pth')
model.eval()

# Export TorchScript
scripted_model = torch.jit.script(model)
scripted_model.save('models/hair_segmenter_v1.0.pt')

# Export ONNX
dummy_input = torch.randn(1, 3, 384, 384)
torch.onnx.export(
    model, dummy_input, 'models/hair_segmenter_v1.0.onnx',
    opset_version=13, input_names=['image'], output_names=['mask']
)
```

### Step 2: Update `core/segmenter.py`

**Before** (stub):
```python
def segment_hair(image: np.ndarray) -> np.ndarray:
    # Stub: return dummy mask
    return np.ones((image.shape[0], image.shape[1]), dtype=np.uint8) * 255
```

**After** (real model):
```python
import torch
from core.models import ModelCache

def segment_hair(image: np.ndarray) -> np.ndarray:
    # Load model via singleton cache
    model = ModelCache.segmenter()

    # Preprocess
    input_tensor = preprocess_image(image)  # Resize, normalize

    # Inference
    with torch.no_grad():
        mask = model(input_tensor)

    # Postprocess
    mask = postprocess_mask(mask, original_size=image.shape[:2])

    return mask
```

### Step 3: Model Versioning

**`models/model_registry.json`**:
```json
{
  "hair_segmenter": {
    "version": "1.0",
    "created_at": "2025-01-15T10:30:00Z",
    "base_model": "MODNet_MobileNetV2",
    "dataset": "Figaro-1k + augmentation (2000 samples)",
    "metrics": {
      "val_iou": 0.92,
      "val_f1": 0.94,
      "inference_time_cpu": "280ms",
      "inference_time_gpu": "45ms"
    },
    "file": "hair_segmenter_v1.0.pt",
    "size_mb": 26.4
  }
}
```

### Step 4: A/B Testing Strategy

**Gradual rollout**:
1. **Week 1**: 10% of traffic uses new model (90% stub)
2. **Week 2**: 50% traffic (if metrics OK)
3. **Week 3**: 100% traffic

**Metrics to monitor**:
- API response time (p50, p95, p99)
- Error rate (segmentation failures)
- User feedback (via app analytics)
- Processing time distribution

**Rollback plan**:
- If error rate >2% → rollback to stub
- If p95 latency >1000ms → rollback to stub
- Rollback command: `git revert <commit>` + redeploy

---

## Docker Environment (Reproducibility)

**`docker/Dockerfile.training`**:
```dockerfile
FROM nvidia/cuda:11.8.0-cudnn8-devel-ubuntu22.04

# Install Python 3.10
RUN apt-get update && apt-get install -y python3.10 python3-pip git

# Install PyTorch with CUDA support
RUN pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Install training dependencies
RUN pip3 install albumentations opencv-python-headless numpy matplotlib \
    tqdm tensorboard papermill nbconvert jupyter

# Set working directory
WORKDIR /workspace

# Copy training code
COPY notebooks/ /workspace/notebooks/
COPY scripts/ /workspace/scripts/

# Default command
CMD ["/bin/bash"]
```

**Usage**:
```bash
# Build image
docker build -f docker/Dockerfile.training -t color-me-training .

# Run on GPU instance
docker run --gpus all -v $(pwd):/workspace color-me-training \
    bash /workspace/scripts/train_hair_segmentation.sh
```

---

## Continuous Improvement Loop

### Phase 1: Initial Deployment (Week 1-2)
- Deploy MediaPipe baseline
- Collect 100-200 edge case failures (via app error logging)
- Categorize failures (lighting, hair type, occlusion, etc.)

### Phase 2: Targeted Finetuning (Week 3-4)
- Annotate edge cases (manual masking in 1-2 hours)
- Finetune on edge cases + original dataset
- Deploy v1.1 with improved edge case handling

### Phase 3: Production Monitoring (Ongoing)
- Track quality metrics per hair color category
- A/B test new models on 10% traffic
- Quarterly model updates with latest edge cases

**Effort per iteration**: 4-6 hours (annotation + training + testing)

**Cost per iteration**: $1-2 GPU time

---

## Summary: Optimization Decision Tree

```
START
  ↓
Q: Do we have budget for GPU training?
  ↓ No  → Use MediaPipe (RECOMMENDED) — $0, 1-2 hours
  ↓ Yes
  ↓
Q: Is MediaPipe quality sufficient (IoU >0.85)?
  ↓ Yes → Done! Deploy MediaPipe
  ↓ No
  ↓
Q: Can we collect/annotate 500-1000 images?
  ↓ No  → Use MediaPipe + aggressive post-processing
  ↓ Yes → Finetune MODNet — $1-2, 1.5-2 hours
  ↓
Q: Is finetuned model quality sufficient (IoU >0.90)?
  ↓ Yes → Done! Deploy finetuned model
  ↓ No  → Consider full training or alternative models
```

---

## Action Items (Priority Order)

**Immediate (F03 - Next Sprint)**:
- [ ] Integrate MediaPipe into `core/segmenter.py`
- [ ] Test on 20+ diverse fixtures
- [ ] Benchmark inference time (CPU + GPU)
- [ ] Update `model_registry.json` with MediaPipe version
- [ ] Deploy to staging environment

**If MediaPipe insufficient (F04)**:
- [ ] Prepare Figaro-1k dataset locally
- [ ] Set up Lambda Labs account ($0.75/hr)
- [ ] Run `notebooks/01_data_prep.ipynb` locally
- [ ] Execute `scripts/train_hair_segmentation.sh` on GPU
- [ ] Validate quality metrics (IoU >0.90)
- [ ] Deploy finetuned model to production

**Long-term (F05+)**:
- [ ] Set up continuous monitoring for edge cases
- [ ] Implement quarterly model update cycle
- [ ] Explore quantization for mobile deployment
- [ ] Consider TensorRT optimization for 3-5x GPU speedup

---

## Cost Summary

| Approach | GPU Cost | Time Cost | Quality |
|----------|----------|-----------|---------|
| **MediaPipe** | $0 | 1-2 hours | ⭐⭐⭐⭐ |
| **Light Finetune** | $1-2 | 4-6 hours | ⭐⭐⭐⭐⭐ |
| **Full Training** | $50-200 | 20-40 hours | ⭐⭐⭐⭐⭐ |

**Recommendation**: Start with MediaPipe ($0), finetune only if necessary ($1-2).

---

**Document version**: 2.0 (Optimized)
**Last updated**: 2025-12-20
**Owner**: ML Team
**Review cycle**: After each model deployment
