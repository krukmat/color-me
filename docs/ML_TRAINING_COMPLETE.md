# ML Training Plan — Complete Guide
## Phases, Tasks, Subtasks with Dependency Analysis, ROI & Cyclomatic Complexity

---

## 📋 Table of Contents
1. Executive Summary
2. Phase 1: Zero-Train (MediaPipe) — RECOMMENDED
3. Phase 2: Light Finetune (Optional)
4. Phase 3: Full Training (Rare)
5. Phase 4: Integration & Deployment
6. Dependency Graph & Critical Path
7. ROI Analysis
8. Cyclomatic Complexity Breakdown
9. Execution Timeline
10. Quick Reference & Decision Tree

---

## 📊 Executive Summary

| Phase | Strategy | Cost | Time | ROI | Max CC | Risk |
|-------|----------|------|------|-----|--------|------|
| **1. Zero-Train** | MediaPipe | **$0** | 1-2h | 🔥🔥🔥 | 8 | 🟢 Low |
| **2. Finetune** | MODNet | **$1-2** | 4-6h | 🔥🔥 | 12 | 🟡 Med |
| **3. Full Train** | From Scratch | **$50-200** | 20-40h | 🔥 | 15 | 🔴 High |
| **4. Integration** | Deployment | **$0** | 2-3h | 🔥🔥 | 8 | 🟢 Low |

**Recommendation**: Start Phase 1. Only Phase 2 if IoU <0.85. Skip Phase 3.

**Path to Production**: 4.5-5.5 hours (Phases 1 + 4)

---

# PHASE 1: Zero-Train Reuse (RECOMMENDED)

## Overview
- **Status**: 🟢 Ready to implement immediately
- **Cost**: $0 (no GPU)
- **Time**: 1-2 hours total
- **Risk**: Very low (proven Google technology)
- **ROI**: 🔥🔥🔥 (infinite — zero cost, 4/5 quality)
- **Quality Target**: IoU >0.85

### Why Phase 1 is Optimal
- MediaPipe models trained on millions of images (Google's standard)
- Zero GPU cost, instant deployment
- Covers 95% of use cases
- If insufficient, Phase 2 adds only $1-2

---

## Task 1.1: Environment Setup

**Complexity**: ⭐ (CC=1) | **Effort**: 30 min | **Dependencies**: None

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Install MediaPipe SDK (`pip install mediapipe`) | 1 | 2 min | ⏳ |
| Verify CUDA availability (if GPU available) | 2 | 5 min | ⏳ |
| Create test fixtures directory `tests/fixtures/` | 1 | 2 min | ⏳ |
| Download test images (20-30 diverse faces) | 1 | 15 min | ⏳ |
| Setup TensorBoard for metrics (optional) | 2 | 5 min | ⏳ |

**Deliverable**: `tests/fixtures/` with 20-30 test images ready for validation

---

## Task 1.2: MediaPipe Integration into core/segmenter.py

**Complexity**: ⭐⭐ (CC=5) | **Effort**: 45 min | **Dependencies**: ✅ Task 1.1

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Load MediaPipe SelfieSegmentation model | 1 | 5 min | ⏳ |
| Configure model selection (general vs landscape) | 2 | 10 min | ⏳ |
| Implement `segment_hair()` with preprocess + inference | 3 | 20 min | ⏳ |
| Handle inference errors gracefully (fallback mask) | 4 | 10 min | ⏳ |

**Code Pattern** (CC=5):
```python
def segment_hair(image: np.ndarray) -> np.ndarray:
    if not validate(image):  # CC+1
        return fallback_mask()  # CC+1

    model = ModelCache.segmenter()

    if use_gpu():  # CC+1
        mask = gpu_inference(model, image)  # CC+1
    else:
        mask = cpu_inference(model, image)

    return mask  # CC+1
```

**Deliverable**: `core/segmenter.py` with real MediaPipe integration

---

## Task 1.3: Fixture Testing & Quality Validation

**Complexity**: ⭐⭐ (CC=6) | **Effort**: 45 min | **Dependencies**: ✅ Task 1.1, 1.2

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Load 20+ fixtures (diverse skin tones, hair types) | 1 | 5 min | ⏳ |
| Run inference on each fixture | 2 | 10 min | ⏳ |
| Visual QA: inspect masks (acceptance: IoU >0.80) | 3 | 20 min | ⏳ |
| Log failures & categorize (lighting, hair, occlusion) | 4 | 10 min | ⏳ |

**Decision Logic** (CC=6):
```python
for fixture in fixtures:
    mask = segment_hair(fixture.image)
    iou = compute_iou(mask, fixture.gt_mask)

    if iou > 0.90:          # CC+1
        results['excellent'].append(fixture)  # CC+1
    elif iou > 0.85:        # CC+1
        results['good'].append(fixture)  # CC+1
    elif iou > 0.75:        # CC+1
        results['acceptable'].append(fixture)  # CC+1
    else:                   # CC+1
        failures.append(fixture)  # CC+1
```

**Success Criteria**: ≥95% of fixtures IoU >0.80, failures documented

---

## Task 1.4: Post-Processing Tuning

**Complexity**: ⭐⭐⭐ (CC=8) | **Effort**: 30 min | **Dependencies**: ✅ Task 1.3

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Configure blur radius for feathering | 1 | 5 min | ⏳ |
| Tune morphological operations (erosion/dilation) | 2 | 10 min | ⏳ |
| Implement edge anti-bleed (mask refinement) | 3 | 10 min | ⏳ |
| Benchmark visual results (side-by-side) | 2 | 5 min | ⏳ |

**Deliverable**: Optimized `postprocess_mask()` function with 10-20% visual quality improvement

---

## Task 1.5: Inference Benchmarking

**Complexity**: ⭐ (CC=2) | **Effort**: 15 min | **Dependencies**: ✅ Task 1.2 | **Can run parallel**: Yes

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Measure CPU inference time (50 runs, median) | 1 | 5 min | ⏳ |
| Measure GPU inference time (if available) | 1 | 5 min | ⏳ |
| Log p50, p95, p99 latencies | 2 | 5 min | ⏳ |

**Expected Results**:
- CPU: 100-150ms (target: <500ms)
- GPU: 30-50ms (target: <100ms)
- If >500ms CPU: optimize or require GPU

---

## Task 1.6: Deploy to Staging

**Complexity**: ⭐ (CC=1) | **Effort**: 15 min | **Dependencies**: ✅ Task 1.5, 1.4

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Update `model_registry.json` with MediaPipe v1.0 | 1 | 5 min | ⏳ |
| Deploy to staging environment | 1 | 5 min | ⏳ |
| Run E2E smoke test (mobile → BFF → ML API → result) | 1 | 5 min | ⏳ |

**Success Criteria**:
- ✅ IoU >0.85 on 20+ fixtures
- ✅ Inference <500ms CPU / <100ms GPU
- ✅ E2E test: request received, image processed, response sent

### Phase 1 Summary
```
Critical Path: 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6
Parallel: 1.5 can run while 1.3-1.4 run
Total Effort: 2-2.5 hours
Cost: $0
Risk: 🟢 Minimal
Result: Production-ready MediaPipe baseline
```

---

# PHASE 2: Light Finetune (IF NEEDED)

## Overview
- **Status**: 🟡 Only if Phase 1 insufficient (IoU <0.85)
- **Cost**: $1-2 (spot GPU instance)
- **Time**: 4-6 hours (90 min GPU, rest CPU)
- **Risk**: Medium (GPU cost, dataset quality)
- **ROI**: 🔥🔥 (3-4x quality improvement per dollar)
- **Quality Target**: IoU >0.90

### When to Escalate to Phase 2
- Phase 1 IoU <0.85 overall
- Edge cases failing >20% (curly hair, specific lighting, occlusion)
- Production metrics indicate insufficient mask quality

---

## Task 2.1: Dataset Preparation

**Complexity**: ⭐⭐ (CC=4) | **Effort**: 60 min | **Dependencies**: None | **Can run parallel**: Yes

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Download Figaro-1k dataset (1050 images + masks) | 1 | 10 min | ⏳ |
| Visual QA: remove corrupted images | 2 | 15 min | ⏳ |
| Train/val/test split (70%/15%/15%) | 3 | 10 min | ⏳ |
| Pre-resize to 384x384, cache as .npy files | 3 | 20 min | ⏳ |
| Compute dataset statistics (mean, std) | 1 | 5 min | ⏳ |

**Dataset Pipeline** (CC=4):
```python
for img_path in figaro_paths:
    if is_corrupted(img_path):       # CC+1
        skip()
    else:
        resize_and_cache(img_path)    # CC+1

stats = compute_stats(dataset)        # CC+1
create_splits(dataset, [0.7, 0.15, 0.15])  # CC+1
```

**Deliverable**: `datasets/figaro-1k-cached/` with 1000+ images ready for training

---

## Task 2.2: GPU Provider Selection & Setup

**Complexity**: ⭐ (CC=2) | **Effort**: 15 min | **Dependencies**: None | **Can run parallel**: Yes

**Provider Comparison**:
| Provider | GPU | Cost/hr | Spot Cost | Recommendation |
|----------|-----|---------|-----------|----------------|
| Lambda Labs | A10 (24GB) | $0.75 | N/A | ⭐ Best price |
| Vast.ai | RTX 3090 | $0.30 | $0.15 | ⭐⭐ Cheapest |
| GCP | T4 (16GB) | $0.35 | $0.11 | ✅ Spot pricing |
| Paperspace | A4000 | $0.76 | N/A | ✅ Good value |
| DigitalOcean | A10 | $3.00 | N/A | Simple, expensive |

**Recommendation**: Lambda Labs ($0.75/hr) for balance of price and reliability

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Select provider (Lambda Labs recommended) | 1 | 2 min | ⏳ |
| Create account, verify billing | 1 | 5 min | ⏳ |
| Test SSH access & GPU (`nvidia-smi`) | 1 | 5 min | ⏳ |
| Prepare SSH keys, security groups | 1 | 3 min | ⏳ |

**Cost Projection**:
- Setup + data validation: 30 min × $0.75/hr = $0.38
- Training: 70 min × $0.75/hr = $0.88
- Export + test: 20 min × $0.75/hr = $0.25
- **Total**: ~$1.50 (1.25 GPU hours)

---

## Task 2.3: Model Baseline Selection

**Complexity**: ⭐ (CC=1) | **Effort**: 10 min | **Dependencies**: None

**Model Comparison**:
| Model | Params | CPU Speed | GPU Speed | Quality | Finetune |
|-------|--------|-----------|-----------|---------|----------|
| MediaPipe | 2M | 100ms | 30ms | ⭐⭐⭐⭐ | N/A |
| MODNet (MobileNetV2) | 6.5M | 200ms | 50ms | ⭐⭐⭐⭐ | Low ✅ |
| BiSeNet V2 | 5.6M | 180ms | 45ms | ⭐⭐⭐⭐⭐ | Medium |
| DeepLabV3+ | 5.8M | 220ms | 60ms | ⭐⭐⭐⭐ | Medium |
| U-Net (ResNet34) | 24M | 400ms | 100ms | ⭐⭐⭐⭐⭐ | High |

**Recommendation**: **MODNet (MobileNetV2)** — best quality/speed/effort balance

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Compare MODNet vs BiSeNet vs DeepLabV3+ | 2 | 5 min | ⏳ |
| Select MODNet (MobileNetV2) | 1 | 2 min | ⏳ |
| Download pre-trained checkpoint | 1 | 3 min | ⏳ |

---

## Task 2.4: Training on GPU Instance

**Complexity**: ⭐⭐⭐⭐ (CC=12) | **Effort**: 90 min GPU | **Dependencies**: ✅ Task 2.1, 2.2, 2.3

### Subtask 2.4a: Data Loading & Validation (30 min)

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Load .npy cached dataset | 1 | 2 min | ⏳ |
| Create DataLoader (4 workers + pin_memory) | 2 | 5 min | ⏳ |
| Verify data shape and batch integrity | 3 | 5 min | ⏳ |
| Inspect augmentation pipeline (albumentations) | 4 | 10 min | ⏳ |
| Compute class weights (hair vs background) | 2 | 5 min | ⏳ |

**Albumentations Pipeline**:
```python
transform = A.Compose([
    A.HorizontalFlip(p=0.5),
    A.Rotate(limit=15, p=0.3),
    A.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1, p=0.5),
    A.GaussianBlur(blur_limit=3, p=0.2),
    A.RandomBrightnessContrast(p=0.3),
    A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=20, val_shift_limit=10, p=0.3),
    A.Resize(384, 384),
    A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])
```

### Subtask 2.4b: Training Loop (60 min GPU)

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Load MODNet checkpoint, freeze backbone | 1 | 3 min | ⏳ |
| Configure mixed precision (FP16) + GradScaler | 2 | 5 min | ⏳ |
| Setup gradient accumulation (steps=4) | 3 | 5 min | ⏳ |
| Define loss (BCE + Dice) with class weighting | 2 | 5 min | ⏳ |
| Setup optimizer (AdamW) + LR scheduler (cosine) | 4 | 5 min | ⏳ |
| Configure early stopping (patience=3) | 2 | 3 min | ⏳ |
| **Training loop**: 5 epochs | 8 | 60-75 min | ⏳ |
| Save best checkpoint (by val IoU) | 1 | 2 min | ⏳ |

**Training Hyperparameters**:
```python
config = {
    'epochs': 5,              # Light finetune
    'batch_size': 4,          # Fits in 16GB GPU with FP16
    'accumulation_steps': 4,  # Effective batch=16
    'lr': 1e-4,               # Conservative
    'weight_decay': 1e-5,
    'optimizer': 'AdamW',
    'scheduler': 'cosine',
    'warmup_steps': 100,
    'early_stopping_patience': 3,
    'mixed_precision': True,  # FP16 → 2x speedup
    'gradient_clip': 1.0,
}
```

**Training Loop CC Breakdown** (CC=8):
```python
for epoch in range(5):  # CC+1
    for batch_idx, (images, masks) in enumerate(train_loader):
        if should_accumulate(batch_idx):  # CC+1
            loss = forward_pass(images, masks)  # CC+1
            loss.backward()
        else:  # CC+1
            optimizer.step()
            optimizer.zero_grad()

    val_loss, val_iou = validate()  # CC+1

    if early_stop_check():  # CC+1
        break  # CC+1

    if val_loss < best_loss:  # CC+1
        save_checkpoint()  # CC+1
```

**Expected Timeline**:
- Epoch 1: 15 min (first, includes overhead)
- Epochs 2-5: 12 min each
- Early stopping likely at epoch 3-4: saves 30-50% GPU time
- Total: 60-75 min GPU

---

## Task 2.5: Export & Evaluation

**Complexity**: ⭐⭐ (CC=5) | **Effort**: 25 min | **Dependencies**: ✅ Task 2.4

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Load best checkpoint | 1 | 2 min | ⏳ |
| Compute metrics (IoU, F1, precision, recall) | 3 | 8 min | ⏳ |
| Generate visual comparisons (20 samples) | 2 | 5 min | ⏳ |
| Export to TorchScript (.pt) | 2 | 3 min | ⏳ |
| Export to ONNX (.onnx) | 2 | 3 min | ⏳ |
| Update `model_registry.json` | 1 | 3 min | ⏳ |

**Evaluation Decision Tree** (CC=5):
```python
def evaluate_model(checkpoint):
    metrics = compute_metrics(checkpoint)  # CC+1

    if metrics['iou'] > 0.90:    # CC+1
        print("PRODUCTION READY")
        return APPROVED           # CC+1
    elif metrics['iou'] > 0.85:  # CC+1
        print("ACCEPTABLE, MONITOR")
        return CONDITIONAL        # CC+1
    else:
        print("REJECT, RETRAIN")
        return REJECTED
```

**model_registry.json**:
```json
{
  "hair_segmenter": {
    "version": "1.1",
    "created_at": "2025-01-15T10:30:00Z",
    "base_model": "MODNet_MobileNetV2",
    "dataset": "Figaro-1k + augmentation (1000 samples)",
    "metrics": {
      "val_iou": 0.92,
      "val_f1": 0.94,
      "inference_time_cpu": "280ms",
      "inference_time_gpu": "45ms"
    },
    "file": "hair_segmenter_v1.1.pt",
    "size_mb": 26.4
  }
}
```

---

## Task 2.6: Cost Minimization

**Complexity**: ⭐ (CC=1) | **Effort**: 5 min | **Dependencies**: ✅ Task 2.5

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Download model to local machine | 1 | 2 min | ⏳ |
| Terminate GPU instance immediately | 1 | 1 min | ⏳ |
| Verify termination in provider console | 1 | 2 min | ⏳ |

**Critical**: Terminate instance immediately or lose $15-20 per idle hour.

### Phase 2 Summary
```
Critical Path: 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6
Parallel: 2.2, 2.3 can run parallel with 2.1
Total Effort: 4-6 hours (1.5h CPU + 1.5h waiting + 90 min GPU)
Cost: $0.94-1.50 (1.25-2 GPU hours)
Risk: 🟡 Medium
Result: MODNet v1.1 with IoU >0.90
```

---

# PHASE 3: Full Training (RARE)

## Overview
- **Status**: 🔴 Only if Phase 2 still insufficient (IoU <0.90)
- **Cost**: $50-200 (10-20 GPU hours)
- **Time**: 20-40 hours
- **Risk**: High (expensive, long, uncertain)
- **ROI**: 🔥 (low — diminishing returns)
- **When**: Very rare, only if extreme quality needed

### Not Recommended for MVP
- Diminishing returns: 90→95 IoU improvement costs $50-200
- Phase 1 + Phase 2 covers 99% of use cases
- Only if production traffic reveals systematic failures

---

## Task 3.1: Dataset Expansion

**Complexity**: ⭐⭐ (CC=4) | **Effort**: 170 min

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Collect additional datasets (CelebA-HQ, LFW) | 2 | 60 min | ⏳ |
| Annotate custom images (manual hair masks) | 3 | 90 min | ⏳ |
| Merge, deduplicate, create 5000+ samples | 2 | 15 min | ⏳ |
| Validate balanced distribution | 1 | 5 min | ⏳ |

---

## Task 3.2: Full Training from Scratch

**Complexity**: ⭐⭐⭐⭐ (CC=15) | **Effort**: 600-1200 min GPU

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Train DeepLabV3+ from scratch | 15 | 600-1200 min | ⏳ |
| Monitor loss curves & validation metrics | 2 | 30 min | ⏳ |
| Implement learning rate decay & warmup | 3 | 30 min | ⏳ |

---

## Task 3.3: Post-Training Analysis

**Complexity**: ⭐⭐⭐ (CC=7) | **Effort**: 120 min

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Hyperparameter sensitivity analysis | 3 | 60 min | ⏳ |
| Error analysis (worst cases) | 2 | 30 min | ⏳ |
| Model compression & quantization | 4 | 30 min | ⏳ |

### Phase 3 Summary
```
Total Effort: 20-40 hours
Cost: $50-200 (10-20 GPU hours)
Risk: 🔴 High
Result: Highest possible quality (IoU >0.95)
Recommendation: AVOID for MVP
```

---

# PHASE 4: Integration & Production Deployment

## Overview
- **Status**: 🟢 Required after Phase 1 or Phase 2
- **Cost**: $0 (deployment only)
- **Time**: 2-3 hours
- **Risk**: 🟢 Low (rollback plan in place)
- **ROI**: 🔥🔥 (enables production use, risk-controlled)

---

## Task 4.1: Model Versioning & Registry

**Complexity**: ⭐ (CC=2) | **Effort**: 15 min | **Dependencies**: Phase 1 or 2 complete

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Create `model_registry.json` with metadata | 1 | 5 min | ⏳ |
| Store model in Git LFS or S3 with checksums | 1 | 5 min | ⏳ |
| Document training command & hyperparameters | 1 | 5 min | ⏳ |

---

## Task 4.2: Update segmenter.py with Production Model

**Complexity**: ⭐⭐ (CC=5) | **Effort**: 30 min | **Dependencies**: ✅ Task 4.1

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Replace stub with real model inference | 2 | 10 min | ⏳ |
| Update ModelCache to load production model | 3 | 10 min | ⏳ |
| Test integration: image → mask → output | 1 | 5 min | ⏳ |
| Add version logging to every request | 2 | 5 min | ⏳ |

---

## Task 4.3: A/B Testing Setup

**Complexity**: ⭐⭐⭐ (CC=8) | **Effort**: 45 min | **Dependencies**: ✅ Task 4.2

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Implement feature flag (10%→50%→100%) | 2 | 15 min | ⏳ |
| Setup metrics collection | 3 | 15 min | ⏳ |
| Define rollback thresholds | 1 | 5 min | ⏳ |
| Test rollback procedure | 2 | 10 min | ⏳ |

**A/B Testing Decision Tree** (CC=8):
```python
def should_rollout(metrics):
    if metrics['error_rate'] > 0.02:      # CC+1
        return ROLLBACK                    # CC+1
    elif metrics['latency_p95'] > 1000:   # CC+1
        return ROLLBACK                    # CC+1
    elif current_traffic == 0.10:         # CC+1
        return INCREASE_TO_50              # CC+1
    elif current_traffic == 0.50:         # CC+1
        return INCREASE_TO_100             # CC+1
    else:
        return MONITOR                     # CC+1
```

**Rollout Schedule**:
- Week 1: 10% traffic (monitor for errors)
- Week 2: 50% traffic (if metrics OK)
- Week 3: 100% traffic (full deployment)

**Rollback Thresholds**:
- Error rate >2% → ROLLBACK immediately
- Latency p95 >1000ms → ROLLBACK
- IoU metric shows regression → ROLLBACK

---

## Task 4.4: Monitoring & Alerting

**Complexity**: ⭐⭐⭐ (CC=7) | **Effort**: 30 min | **Dependencies**: ✅ Task 4.3

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Setup TensorBoard dashboard | 2 | 10 min | ⏳ |
| Create alerts for error/latency thresholds | 3 | 10 min | ⏳ |
| Log segmentation failures for analysis | 2 | 5 min | ⏳ |
| Setup Slack/email notifications | 2 | 5 min | ⏳ |

**Metrics to Monitor**:
- Inference latency (p50, p95, p99)
- Error rate (segmentation failures per 1000 requests)
- Model version running on each instance
- Edge case categorization (what fails)

---

## Task 4.5: Documentation & Handoff

**Complexity**: ⭐ (CC=1) | **Effort**: 20 min | **Dependencies**: ✅ Task 4.4

| Subtask | CC | Time | Status |
|---------|-----|------|--------|
| Update README.md with deployed version | 1 | 5 min | ⏳ |
| Document rollback procedure | 1 | 5 min | ⏳ |
| Create incident response playbook | 2 | 10 min | ⏳ |

### Phase 4 Summary
```
Critical Path: 4.1 → 4.2 → 4.3 → 4.4 → 4.5
Parallel: 4.3, 4.4 can run after 4.2
Total Effort: 2-3 hours
Cost: $0
Risk: 🟢 Minimal
Result: Safe production deployment with rollback
```

---

# 📊 Dependency Graph & Critical Path

## Dependency Flow

```
PHASE 1                          PHASE 2 (Optional)         PHASE 4
────────                         ──────────────             ─────────
1.1 Env
 ↓
1.2 Integration    2.1 Data ◄─┐
 ↓                  ↓         │ (Parallel)
1.3 Testing ◄────  2.2 GPU ──┤
 ↓                  ↓         │
1.4 Post-Proc      2.3 Model ◄┘
 ↓
1.5 Bench ◄────────┐
 ↓                 │
1.6 Deploy ────────┴──────→ 4.1 Versioning
                             ↓
                           4.2 Integration
                             ↓
                           4.3 A/B Testing
                             ↓
                           4.4 Monitoring
                             ↓
                           4.5 Documentation
                             ↓
                          🎉 PRODUCTION
```

## Critical Paths to Production

**Fast Track (Phase 1 only)**: 2.5-3 hours
```
1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 4.1 → 4.2 → 4.3||4.4 → 4.5
```

**With Optional Finetune (Phase 1+2)**: 5-7 hours work + 90 min GPU wait
```
2.1||2.2||2.3 (1h) → 2.4 (90 min GPU) → 2.5 → 2.6 (5 min)
Parallel: 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 (can run while 2.4 trains)
Then: 4.1 → 4.2 → 4.3||4.4 → 4.5 (2-3 hours)
```

---

# 📈 ROI Analysis

## Cost vs Quality Trade-off

| Phase | Cost | Quality | ROI Score | Decision |
|-------|------|---------|-----------|----------|
| Phase 1 (Zero-Train) | $0 | 4/5 | 🔥🔥🔥 INFINITE | ✅ ALWAYS START |
| Phase 2 (Finetune) | $1-2 | 4.5-5/5 | 🔥🔥 (3-4x per $) | ✅ IF IoU <0.85 |
| Phase 3 (Full Train) | $50-200 | 5/5 | 🔥 (1x per $) | ❌ AVOID |
| Phase 4 (Deploy) | $0 | N/A | 🔥🔥 REQUIRED | ✅ ALWAYS DO |

## Cost Breakdown (Phase 1)
```
Environment setup:       $0
Integration:             $0
Testing & validation:    $0
Post-processing:         $0
Benchmarking:            $0
Deployment:              $0
────────────────────────
TOTAL:                   $0 ← FREE
```

## Cost Breakdown (Phase 2)
```
Data preparation:        $0 (CPU work at home)
GPU setup:               $0
Model selection:         $0
Training (90 min GPU):   1.25 × $0.75 = $0.94
Export & evaluation:     $0.19 (15 min GPU)
Cost minimization:       $0
────────────────────────
TOTAL:                   $1.13 ← ~$1-2
```

## Quality Improvement

```
Phase 1:  IoU 0.85  → Baseline (4/5 stars)
Phase 2:  IoU 0.92  → +0.07 improvement (4.5-5/5 stars)
Phase 3:  IoU 0.95  → +0.03 improvement (5/5 stars, overkill)
```

---

# 🔍 Cyclomatic Complexity Analysis

## CC by Task

| Phase | Task | CC | Risk | Testability |
|-------|------|-----|------|------------|
| 1 | 1.1 Setup | 1 | 🟢 Minimal | 🟢 Excellent |
| 1 | 1.2 Integration | 5 | 🟡 Low | 🟡 Good |
| 1 | 1.3 Testing | 6 | 🟡 Low | 🟡 Good |
| 1 | 1.4 Post-Process | 8 | 🟡 Medium | 🟡 Fair |
| 1 | 1.5 Benchmark | 2 | 🟢 Minimal | 🟢 Excellent |
| 1 | 1.6 Deploy | 1 | 🟢 Minimal | 🟢 Excellent |
| 2 | 2.1 Data Prep | 4 | 🟡 Low | 🟡 Good |
| 2 | 2.2 GPU Setup | 2 | 🟢 Minimal | 🟢 Excellent |
| 2 | 2.3 Model Select | 1 | 🟢 Minimal | 🟢 Excellent |
| 2 | 2.4 Training | 12 | 🔴 High | 🟡 Fair |
| 2 | 2.5 Export | 5 | 🟡 Low | 🟡 Good |
| 2 | 2.6 Cost Min | 1 | 🟢 Minimal | 🟢 Excellent |
| 4 | 4.1 Version | 2 | 🟢 Minimal | 🟢 Excellent |
| 4 | 4.2 Integration | 5 | 🟡 Low | 🟡 Good |
| 4 | 4.3 A/B Test | 8 | 🟡 Medium | 🟡 Fair |
| 4 | 4.4 Monitor | 7 | 🟡 Medium | 🟡 Fair |
| 4 | 4.5 Docs | 1 | 🟢 Minimal | 🟢 Excellent |

## Complexity Legend

- **⭐ (CC 1-2)**: Simple, trivial — basic if/for statements
- **⭐⭐ (CC 3-5)**: Low-moderate — straightforward control flow
- **⭐⭐⭐ (CC 6-8)**: Moderate — multiple branches, needs attention
- **⭐⭐⭐⭐ (CC 9+)**: Complex — high risk, needs extensive testing

## High-Risk Areas

**Task 2.4 Training (CC=12)**:
- Nested loops (epochs, batches)
- Multiple conditional branches (early stopping, accumulation, precision)
- Multiple branches in validation logic
- Mitigation: Use well-tested frameworks (PyTorch), add assertions, monitor metrics

---

# 🚀 Recommended Execution Timeline

## Week 1: Phase 1 (Zero-Train to Production)

```
Monday-Tuesday:   Tasks 1.1-1.2 (Environment + Integration)
                  Effort: 75 min total
                  Cost: $0

Wednesday:        Tasks 1.3-1.4 (Testing + Post-Processing)
                  Effort: 75 min total
                  Cost: $0

Thursday:         Tasks 1.5-1.6 (Benchmarking + Deploy)
                  Effort: 30 min total
                  Cost: $0

TOTAL WEEK 1:     2-2.5 hours → MediaPipe in staging
                  Cost: $0
                  Risk: Minimal
```

## Week 2: Phase 2 (IF IoU <0.85)

```
Only if Phase 1 failed acceptance criteria

Monday-Tuesday:   Tasks 2.1-2.3 (Data Prep + GPU Setup + Model Select)
                  Effort: 85 min CPU
                  Cost: $0

Wednesday-Thursday: Task 2.4 (Training)
                  Effort: 90 min GPU (can run overnight)
                  Cost: $0.94

Friday:           Tasks 2.5-2.6 (Export + Shutdown)
                  Effort: 30 min
                  Cost: $0.25

TOTAL WEEK 2:     4-6 hours → MODNet in staging
                  Cost: $1.19
                  Risk: Low
```

## Week 3: Phase 4 (Production Integration)

```
Monday:           Tasks 4.1-4.2 (Versioning + Integration)
                  Effort: 45 min
                  Cost: $0

Tuesday:          Task 4.3 (A/B Testing Setup)
                  Effort: 45 min
                  Cost: $0

Wednesday:        Task 4.4 (Monitoring)
                  Effort: 30 min
                  Cost: $0

Thursday:         Task 4.5 (Documentation)
                  Effort: 20 min
                  Cost: $0

TOTAL WEEK 3:     2.5-3 hours → Safe rollout procedure
                  Cost: $0
                  Risk: Minimal

FINAL: 10% → 50% → 100% traffic rollout with rollback ready
```

---

# 🎯 Decision Tree & Success Criteria

## Go/No-Go Criteria by Phase

```
START
  ↓
PHASE 1: Zero-Train (Mandatory)
  ├─ Run Tasks 1.1-1.6
  ├─ Check: IoU >0.85? ✅ GO to Phase 4
  └─ Check: IoU <0.85? ⚠️ ESCALATE to Phase 2

PHASE 2: Finetune (Conditional)
  ├─ Check: IoU <0.85 failures <20%? ✅ GO to Phase 4
  ├─ Check: Cost will exceed $10? ❌ CANCEL
  ├─ Run Tasks 2.1-2.6
  ├─ Check: IoU >0.90? ✅ GO to Phase 4
  └─ Check: IoU <0.90? 🔴 RARE → Phase 3 or accept Phase 2

PHASE 4: Integration (Required)
  ├─ Run Tasks 4.1-4.5
  ├─ Check: Error rate <2%? ✅ PROCEED with rollout
  ├─ Check: Latency p95 <1000ms? ✅ PROCEED
  ├─ Week 1: 10% traffic → ✅ metrics OK?
  ├─ Week 2: 50% traffic → ✅ metrics OK?
  └─ Week 3: 100% traffic → 🎉 PRODUCTION LIVE

DONE: Model in production, monitoring active, rollback ready
```

## Success Criteria

### Phase 1 Exit Criteria
- ✅ IoU >0.85 on 20+ diverse test fixtures
- ✅ Inference latency <500ms CPU / <100ms GPU
- ✅ Zero segmentation crashes
- ✅ E2E test: request → processed image → response

### Phase 2 Exit Criteria (if needed)
- ✅ Val IoU >0.90 on test set
- ✅ Training completed in <120 min
- ✅ Model checkpoints versioned and backed up
- ✅ Inference latency within acceptable range

### Phase 4 Exit Criteria
- ✅ Error rate <2% during rollout
- ✅ Latency p95 <1000ms sustained
- ✅ Rollback procedure tested successfully
- ✅ Monitoring alerts configured and tested

---

# 📋 Quick Reference Checklist

## Phase 1 (2-2.5 hours, $0)

```
□ 1.1 Install MediaPipe, create fixtures dir          (30 min)
□ 1.2 Integrate MediaPipe into segmenter.py           (45 min)
□ 1.3 Test on 20+ fixtures, validate IoU >0.85       (45 min)
□ 1.4 Tune post-processing (blur, feathering)         (30 min)
□ 1.5 Benchmark CPU/GPU inference time                (15 min)
□ 1.6 Deploy to staging, run E2E test                 (15 min)

✅ Exit: IoU >0.85, latency <500ms, E2E passes
```

## Phase 2 IF NEEDED (4-6 hours, $1-2)

```
□ 2.1 Download Figaro-1k, prepare dataset             (60 min)
□ 2.2 Select GPU provider (Lambda Labs)               (15 min)
□ 2.3 Choose MODNet baseline                          (10 min)
□ 2.4 Run training on GPU (can be overnight)          (90 min GPU)
□ 2.5 Export model, compute metrics                   (25 min)
□ 2.6 Terminate GPU instance immediately              (5 min)

✅ Exit: IoU >0.90, model versioned, cost <$2
```

## Phase 4 REQUIRED (2-3 hours, $0)

```
□ 4.1 Create model_registry.json                      (15 min)
□ 4.2 Update segmenter.py with production model       (30 min)
□ 4.3 Implement feature flag & A/B testing            (45 min)
□ 4.4 Setup monitoring & alerts                       (30 min)
□ 4.5 Update docs & create runbooks                   (20 min)

✅ Exit: Safe rollout procedure ready, rollback tested
```

---

# 🔗 Related Documents

- `docs/ML_REQUIREMENTS.md` — ML API specifications
- `docs/CONTRIBUTING.md` — PR and deployment procedures
- `scripts/train_hair_segmentation.sh` — Automated training script
- `docker/Dockerfile.training` — GPU environment dockerfile

---

**Document Version**: 2.0 (Complete)
**Last Updated**: 2025-12-20
**Owner**: ML Team
**Review Cycle**: After each model deployment
