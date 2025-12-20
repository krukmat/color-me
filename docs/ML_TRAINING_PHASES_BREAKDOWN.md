# ML Training Plan — Phases, Tasks & Subtasks Breakdown
## With Dependency Analysis, ROI, and Cyclomatic Complexity

---

## 📊 Executive Summary

| Phase | Strategy | Est. Cost | Est. Time | ROI | Complexity |
|-------|----------|-----------|-----------|-----|------------|
| **Phase 1: Zero-Train (MediaPipe)** | Pre-trained model | **$0** | **1-2h** | 🔥🔥🔥 HIGH | ⭐ LOW (3) |
| **Phase 2: Light Finetune (Optional)** | MODNet + Figaro-1k | **$1-2** | **4-6h** | 🔥🔥 MEDIUM | ⭐⭐ MEDIUM (7) |
| **Phase 3: Full Training (Rare)** | From scratch | **$50-200** | **20-40h** | 🔥 LOW | ⭐⭐⭐ HIGH (12+) |
| **Phase 4: Integration & Monitoring** | Prod deployment | **$0** | **2-3h** | 🔥🔥 MEDIUM | ⭐⭐ MEDIUM (8) |

---

## PHASE 1: Zero-Train Reuse (RECOMMENDED)

### Overview
- **Status**: 🟢 Ready to implement immediately
- **Cost**: $0 (no GPU)
- **Time**: 1-2 hours
- **Risk**: Very low (proven technology)
- **ROI**: Extremely high (1x effort = 4x quality gain vs custom training)

### Task 1.1: Environment Setup
**Complexity**: ⭐ (CC = 1)
**ROI**: 🔥🔥🔥 (prerequisite for all downstream tasks)
**Effort**: 30 min

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Install MediaPipe SDK (`pip install mediapipe`) | ⭐ (1) | None | 2 min | ⏳ |
| Verify CUDA availability (if GPU available) | ⭐ (2) | None | 5 min | ⏳ |
| Create test fixtures directory `tests/fixtures/` | ⭐ (1) | None | 2 min | ⏳ |
| Download test images (20-30 diverse faces) | ⭐ (1) | None | 15 min | ⏳ |
| Setup TensorBoard for metrics (optional) | ⭐ (2) | None | 5 min | ⏳ |

**Dependencies**: None (standalone task)

**Rollback**: `pip uninstall mediapipe`, delete fixtures dir

---

### Task 1.2: MediaPipe Integration into core/segmenter.py
**Complexity**: ⭐⭐ (CC = 5)
**ROI**: 🔥🔥🔥 (enables full pipeline)
**Effort**: 45 min
**Dependencies**: Task 1.1 ✅

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Load MediaPipe SelfieSegmentation model | ⭐ (1) | 1.1 | 5 min | ⏳ |
| Configure model selection (general vs landscape) | ⭐⭐ (2) | 1.1 | 10 min | ⏳ |
| Implement `segment_hair()` function with preprocess + inference | ⭐⭐ (3) | 1.1 | 20 min | ⏳ |
| Handle inference errors gracefully (fallback mask) | ⭐⭐ (4) | 1.1 | 10 min | ⏳ |

**Code Structure** (CC = 5):
```python
def segment_hair(image):  # CC=1
    if not validate(image):  # CC=2
        return fallback()  # CC=3

    model = ModelCache.segmenter()  # CC=3

    if use_gpu():  # CC=4
        mask = gpu_infer(model, image)  # CC=5
    else:
        mask = cpu_infer(model, image)

    return postprocess(mask)
```

---

### Task 1.3: Fixture Testing & Quality Validation
**Complexity**: ⭐⭐ (CC = 6)
**ROI**: 🔥🔥🔥 (prevents bad model deployment)
**Effort**: 45 min
**Dependencies**: Task 1.1 ✅, Task 1.2 ✅

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Load 20+ test fixtures (diverse skin tones, hair types) | ⭐ (1) | 1.1 | 5 min | ⏳ |
| Run inference on each fixture | ⭐⭐ (2) | 1.2 | 10 min | ⏳ |
| Visual QA: inspect masks (acceptance: IoU >0.80) | ⭐⭐ (3) | 1.2 | 20 min | ⏳ |
| Log failures and categorize (lighting, hair type, occlusion) | ⭐⭐⭐ (4) | 1.2 | 10 min | ⏳ |

**Decision Logic** (CC = 6):
```python
for fixture in fixtures:
    mask = segment_hair(fixture.image)
    iou = compute_iou(mask, fixture.gt_mask)

    if iou > 0.90:  # CC+1
        print("EXCELLENT")
    elif iou > 0.85:  # CC+1
        print("GOOD, monitor")
    elif iou > 0.75:  # CC+1
        print("ACCEPTABLE, edge case")
    else:  # CC+1
        failures.append(fixture.name)  # CC+1
        categorize_failure(fixture)  # CC+1
```

---

### Task 1.4: Post-Processing Tuning
**Complexity**: ⭐⭐⭐ (CC = 8)
**ROI**: 🔥🔥 (visual quality improvement 10-20%)
**Effort**: 30 min
**Dependencies**: Task 1.3 ✅

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Configure blur radius for feathering | ⭐ (1) | 1.3 | 5 min | ⏳ |
| Tune morphological operations (erosion/dilation) | ⭐⭐ (2) | 1.3 | 10 min | ⏳ |
| Implement edge anti-bleed (mask refinement) | ⭐⭐⭐ (3) | 1.3 | 10 min | ⏳ |
| Benchmark visual results (side-by-side comparison) | ⭐⭐ (2) | 1.3 | 5 min | ⏳ |

---

### Task 1.5: Inference Benchmarking
**Complexity**: ⭐ (CC = 2)
**ROI**: 🔥🔥 (informs scaling decisions)
**Effort**: 15 min
**Dependencies**: Task 1.2 ✅

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Measure CPU inference time (50 runs, take median) | ⭐ (1) | 1.2 | 5 min | ⏳ |
| Measure GPU inference time (if available) | ⭐ (1) | 1.2 | 5 min | ⏳ |
| Log p50, p95, p99 latencies | ⭐⭐ (2) | 1.2 | 5 min | ⏳ |

**Expected Results**:
- CPU: 100-150ms
- GPU: 30-50ms
- If >500ms on CPU: optimize or use GPU requirement

---

### Task 1.6: Deployment to Staging
**Complexity**: ⭐ (CC = 1)
**ROI**: 🔥🔥 (enables end-to-end testing)
**Effort**: 15 min
**Dependencies**: Task 1.5 ✅, Task 1.4 ✅

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Update `model_registry.json` with MediaPipe version | ⭐ (1) | 1.4 | 5 min | ⏳ |
| Deploy to staging environment | ⭐ (1) | 1.4 | 5 min | ⏳ |
| Run smoke test: mobile → BFF → ML API → response | ⭐ (1) | 1.4 | 5 min | ⏳ |

---

## Summary: Phase 1 (Zero-Train)

```
Total Effort: 2-2.5 hours
Total Cost: $0
Max Complexity: CC=8 (post-processing tuning)
Critical Path: 1.1 → 1.2 → 1.3 → 1.5 → 1.6
Parallel Tasks: 1.1 (environment), 1.5 (benchmarking after 1.2 done)
ROI: 🔥🔥🔥 (immediate production deployment, zero cost)
```

**Success Criteria**:
- ✅ IoU >0.85 on 20+ fixtures
- ✅ Inference <500ms CPU / <100ms GPU
- ✅ End-to-end test passes (mobile request → processed image)

---

## PHASE 2: Light Finetune (IF NEEDED)

### Overview
- **Status**: 🟡 Only if Phase 1 insufficient (IoU <0.85)
- **Cost**: $1-2 (spot GPU instance)
- **Time**: 4-6 hours
- **Risk**: Medium (GPU cost, dataset quality)
- **ROI**: Medium (improves quality 5-10%)
- **When**: Edge case failures >20% of production traffic

### Task 2.1: Dataset Preparation
**Complexity**: ⭐⭐ (CC = 4)
**ROI**: 🔥🔥 (determines training quality ceiling)
**Effort**: 1 hour
**Dependencies**: None (parallel with Phase 1)

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Download Figaro-1k dataset (1050 images + masks) | ⭐ (1) | None | 10 min | ⏳ |
| Visual QA: remove corrupted images | ⭐⭐ (2) | None | 15 min | ⏳ |
| Train/val/test split (70% / 15% / 15%) | ⭐⭐ (3) | None | 10 min | ⏳ |
| Pre-resize to 384x384, cache as .npy files | ⭐⭐ (3) | None | 20 min | ⏳ |
| Compute dataset statistics (mean, std normalization) | ⭐ (1) | None | 5 min | ⏳ |

**Complexity Analysis** (CC = 4):
```python
def prepare_dataset():
    for img_path in figaro_paths:  # CC+1
        if is_corrupted(img_path):  # CC+1
            skip()
        else:
            resize_and_cache(img_path)  # CC+1

    stats = compute_stats(dataset)  # CC+1
```

---

### Task 2.2: GPU Provider Selection & Setup
**Complexity**: ⭐ (CC = 2)
**ROI**: 🔥🔥🔥 (5x cost reduction if spot selected)
**Effort**: 15 min
**Dependencies**: None (parallel with 2.1)

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Select provider (Lambda Labs $0.75/hr recommended) | ⭐ (1) | None | 2 min | ⏳ |
| Create account and verify billing | ⭐ (1) | None | 5 min | ⏳ |
| Test SSH access and GPU availability (`nvidia-smi`) | ⭐ (1) | None | 5 min | ⏳ |
| Prepare SSH keys and security groups | ⭐ (1) | None | 3 min | ⏳ |

---

### Task 2.3: Model Baseline Selection
**Complexity**: ⭐ (CC = 1)
**ROI**: 🔥🔥 (model choice affects all downstream training)
**Effort**: 10 min
**Dependencies**: None

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Compare MODNet vs BiSeNet vs DeepLabV3+ (quality/speed tradeoff) | ⭐⭐ (2) | None | 5 min | ⏳ |
| Select MODNet (MobileNetV2 backbone) | ⭐ (1) | None | 2 min | ⏳ |
| Download pre-trained checkpoint | ⭐ (1) | None | 3 min | ⏳ |

---

### Task 2.4: Training Notebook Execution (GPU Instance)
**Complexity**: ⭐⭐⭐⭐ (CC = 12)
**ROI**: 🔥🔥 (core ML work, expensive)
**Effort**: 1.5-2 hours GPU time
**Dependencies**: Task 2.1 ✅, Task 2.2 ✅, Task 2.3 ✅

**Notebook 2.4a: Data Loading & Validation** (30 min)
| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Load .npy cached dataset | ⭐ (1) | 2.1 | 2 min | ⏳ |
| Create DataLoader with 4 workers + pin_memory | ⭐⭐ (2) | 2.1 | 5 min | ⏳ |
| Verify data shape and batch integrity | ⭐⭐ (3) | 2.1 | 5 min | ⏳ |
| Inspect augmentation pipeline (albumentations) | ⭐⭐⭐ (4) | 2.1 | 10 min | ⏳ |
| Compute class weights (hair vs background imbalance) | ⭐⭐ (2) | 2.1 | 5 min | ⏳ |

**Notebook 2.4b: Model Setup & Training Loop** (80-100 min GPU)
| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Load MODNet checkpoint, freeze backbone | ⭐ (1) | 2.3 | 3 min | ⏳ |
| Configure mixed precision (FP16) + GradScaler | ⭐⭐ (2) | 2.3 | 5 min | ⏳ |
| Setup gradient accumulation (steps=4) | ⭐⭐⭐ (3) | 2.3 | 5 min | ⏳ |
| Define loss (BCE + Dice) with class weighting | ⭐⭐ (2) | 2.3 | 5 min | ⏳ |
| Setup optimizer (AdamW) + LR scheduler (cosine) | ⭐⭐⭐ (4) | 2.3 | 5 min | ⏳ |
| Configure early stopping (patience=3) | ⭐⭐ (2) | 2.3 | 3 min | ⏳ |
| **Training loop**: 5 epochs × 12-15 min each | ⭐⭐⭐⭐ (8) | 2.3 | 60-75 min | ⏳ |
| Save best checkpoint (by val IoU) | ⭐ (1) | 2.3 | 2 min | ⏳ |
| Log metrics to TensorBoard | ⭐⭐ (2) | 2.3 | 2 min | ⏳ |

**Training Loop CC Breakdown** (CC = 8):
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

---

### Task 2.5: Evaluation & Export
**Complexity**: ⭐⭐ (CC = 5)
**ROI**: 🔥🔥 (validates quality, enables deployment)
**Effort**: 20-30 min
**Dependencies**: Task 2.4 ✅

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Load best checkpoint | ⭐ (1) | 2.4 | 2 min | ⏳ |
| Compute metrics (IoU, F1, precision, recall) on val/test sets | ⭐⭐ (3) | 2.4 | 8 min | ⏳ |
| Generate visual comparisons (20 samples side-by-side) | ⭐⭐ (2) | 2.4 | 5 min | ⏳ |
| Export to TorchScript (.pt) | ⭐⭐ (2) | 2.4 | 3 min | ⏳ |
| Export to ONNX (.onnx) | ⭐⭐ (2) | 2.4 | 3 min | ⏳ |
| Update `model_registry.json` with version, metrics, file path | ⭐ (1) | 2.4 | 3 min | ⏳ |

**Evaluation Decision Tree** (CC = 5):
```python
def evaluate_model(checkpoint):
    metrics = compute_metrics(checkpoint)  # CC+1

    if metrics['iou'] > 0.90:  # CC+1
        print("PRODUCTION READY")
        return APPROVED
    elif metrics['iou'] > 0.85:  # CC+1
        print("ACCEPTABLE, MONITOR")
        return CONDITIONAL
    else:  # CC+1
        print("REJECT, RETRAIN")
        return REJECTED  # CC+1
```

---

### Task 2.6: Cost Minimization
**Complexity**: ⭐ (CC = 1)
**ROI**: 🔥🔥🔥 (saves $50+ per training session)
**Effort**: 5 min (at end)
**Dependencies**: Task 2.5 ✅

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Download model to local machine | ⭐ (1) | 2.5 | 2 min | ⏳ |
| Terminate GPU instance immediately | ⭐ (1) | 2.5 | 1 min | ⏳ |
| Verify termination in provider console | ⭐ (1) | 2.5 | 2 min | ⏳ |

---

## Summary: Phase 2 (Light Finetune)

```
Total Effort: 4-6 hours (90 min GPU, rest CPU)
Total Cost: $1.25 GPU hours × $0.75/hr = $0.94 (Lambda Labs)
Max Complexity: CC=12 (training loop)
Critical Path: 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6
Parallel Tasks: 2.2 (while 2.1 runs), 2.3 (while 2.1 runs)
ROI: 🔥🔥 (improves quality 5-10%, still very cheap)
```

**Success Criteria**:
- ✅ Val IoU >0.90 (production-ready)
- ✅ Inference <500ms CPU (acceptable)
- ✅ Training time <120 min (cost-controlled)
- ✅ Checkpoints exported and versioned

---

## PHASE 3: Full Training (RARE)

### Overview
- **Status**: 🔴 Only if Phase 2 still insufficient (IoU <0.90)
- **Cost**: $50-200 (10-20 GPU hours)
- **Time**: 20-40 hours
- **Risk**: High (expensive, long)
- **ROI**: Low (diminishing returns)
- **When**: Very rare, only if extreme quality needed

### Task 3.1: Dataset Expansion
**Complexity**: ⭐⭐ (CC = 4)
**Effort**: 2-3 hours
**Dependencies**: Phase 2 complete

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Collect additional datasets (CelebA-HQ, LFW, custom) | ⭐⭐ (2) | None | 60 min | ⏳ |
| Annotate custom images (manual hair masks) | ⭐⭐⭐ (3) | None | 90 min | ⏳ |
| Merge and deduplicate (check for overlaps) | ⭐⭐ (2) | None | 15 min | ⏳ |
| Create 5000+ sample training set | ⭐ (1) | None | 5 min | ⏳ |

---

### Task 3.2: Training from Scratch
**Complexity**: ⭐⭐⭐⭐ (CC = 15)
**Effort**: 15-20 GPU hours
**Dependencies**: Task 3.1 ✅

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Train DeepLabV3+ from scratch (full backbone) | ⭐⭐⭐⭐ (15) | 3.1 | 600-1200 min | ⏳ |
| Monitor loss curves and validation metrics | ⭐⭐ (2) | 3.1 | 30 min | ⏳ |
| Implement learning rate decay and warmup | ⭐⭐⭐ (3) | 3.1 | 30 min | ⏳ |

---

### Task 3.3: Post-Training Analysis
**Complexity**: ⭐⭐⭐ (CC = 7)
**Effort**: 2-3 hours
**Dependencies**: Task 3.2 ✅

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Hyperparameter sensitivity analysis | ⭐⭐⭐ (3) | 3.2 | 60 min | ⏳ |
| Error analysis (worst cases) | ⭐⭐ (2) | 3.2 | 30 min | ⏳ |
| Model compression & quantization | ⭐⭐⭐ (4) | 3.2 | 30 min | ⏳ |

---

## PHASE 4: Integration & Production Deployment

### Overview
- **Status**: 🟡 Ready after Phase 1 or Phase 2 complete
- **Cost**: $0 (deployment only)
- **Time**: 2-3 hours
- **Risk**: Low (rollback plan in place)
- **ROI**: 🔥🔥 (enables production use)

### Task 4.1: Model Versioning & Registry
**Complexity**: ⭐ (CC = 2)
**Effort**: 15 min
**Dependencies**: Phase 1 complete (Task 1.6) OR Phase 2 complete (Task 2.5)

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Create `model_registry.json` with version, metrics, metadata | ⭐ (1) | 1.6 or 2.5 | 5 min | ⏳ |
| Store model in Git LFS or S3 with checksums | ⭐ (1) | 1.6 or 2.5 | 5 min | ⏳ |
| Document training command and hyperparameters | ⭐ (1) | 1.6 or 2.5 | 5 min | ⏳ |

---

### Task 4.2: Update segmenter.py with Production Model
**Complexity**: ⭐⭐ (CC = 5)
**Effort**: 30 min
**Dependencies**: Task 4.1 ✅

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Replace stub segment_hair() with real model inference | ⭐⭐ (2) | 4.1 | 10 min | ⏳ |
| Update ModelCache.segmenter() to load production model | ⭐⭐ (3) | 4.1 | 10 min | ⏳ |
| Test integration: image → mask → output | ⭐ (1) | 4.1 | 5 min | ⏳ |
| Add version logging to every request | ⭐⭐ (2) | 4.1 | 5 min | ⏳ |

---

### Task 4.3: A/B Testing Setup
**Complexity**: ⭐⭐⭐ (CC = 8)
**Effort**: 45 min
**Dependencies**: Task 4.2 ✅

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Implement feature flag (10% → 50% → 100% rollout) | ⭐⭐ (2) | 4.2 | 15 min | ⏳ |
| Setup metrics collection (response time, error rate, IoU) | ⭐⭐⭐ (3) | 4.2 | 15 min | ⏳ |
| Define rollback thresholds (error >2%, latency p95 >1000ms) | ⭐ (1) | 4.2 | 5 min | ⏳ |
| Test rollback procedure (git revert + redeploy) | ⭐⭐ (2) | 4.2 | 10 min | ⏳ |

**A/B Testing Decision Tree** (CC = 8):
```python
def should_rollout(metrics):
    if metrics['error_rate'] > 0.02:  # CC+1
        return ROLLBACK  # CC+1
    elif metrics['latency_p95'] > 1000:  # CC+1
        return ROLLBACK  # CC+1
    elif current_traffic == 0.10:  # CC+1
        return INCREASE_TO_50  # CC+1
    elif current_traffic == 0.50:  # CC+1
        return INCREASE_TO_100  # CC+1
    elif current_traffic == 1.00:  # CC+1
        return MONITOR  # CC+1
    else:
        return HOLD  # CC+1
```

---

### Task 4.4: Monitoring & Alerting
**Complexity**: ⭐⭐⭐ (CC = 7)
**Effort**: 30 min
**Dependencies**: Task 4.3 ✅

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Setup TensorBoard dashboard for inference metrics | ⭐⭐ (2) | 4.3 | 10 min | ⏳ |
| Create alerts for error rate >2%, latency p95 >1000ms | ⭐⭐⭐ (3) | 4.3 | 10 min | ⏳ |
| Log segmentation failures for categorization (edge cases) | ⭐⭐ (2) | 4.3 | 5 min | ⏳ |
| Setup email/Slack notification on threshold breach | ⭐⭐ (2) | 4.3 | 5 min | ⏳ |

---

### Task 4.5: Documentation & Handoff
**Complexity**: ⭐ (CC = 1)
**Effort**: 20 min
**Dependencies**: Task 4.4 ✅

| Subtask | Complexity | Deps | Time | Status |
|---------|------------|------|------|--------|
| Update README.md with deployed model version + performance | ⭐ (1) | 4.4 | 5 min | ⏳ |
| Document rollback procedure in CONTRIBUTING.md | ⭐ (1) | 4.4 | 5 min | ⏳ |
| Create incident response playbook (what if fails) | ⭐⭐ (2) | 4.4 | 10 min | ⏳ |

---

## Summary: Phase 4 (Integration)

```
Total Effort: 2-3 hours
Total Cost: $0 (deployment only)
Max Complexity: CC=8 (A/B testing)
Critical Path: 4.1 → 4.2 → 4.3 → 4.4 → 4.5
Parallel Tasks: 4.3, 4.4 (after 4.2)
ROI: 🔥🔥 (enables production use, risk-controlled)
```

---

## 📊 Cross-Phase Dependency Graph

```
PHASE 1 (Zero-Train)          PHASE 2 (Optional Finetune)      PHASE 3 (Rare)      PHASE 4 (Deploy)
────────────────────          ──────────────────────────        ──────────           ────────────
1.1 Environment
 ↓
1.2 MediaPipe Integration      2.1 Dataset Prep ──────┐
 ↓                               ↓                     ├─→ 2.4 Training
1.3 Fixture Testing            2.2 GPU Setup ────────┤
 ↓                               ↓                     │
1.4 Post-Processing            2.3 Model Select ─────┘
 ↓
1.5 Benchmarking                              2.5 Export
 ↓                                             ↓
1.6 Deploy to Staging  ────────────────→    4.1 Versioning
                                             ↓
                                           4.2 Integration
                                             ↓
                                           4.3 A/B Testing
                                             ↓
                                           4.4 Monitoring
                                             ↓
                                           4.5 Documentation
```

---

## 📈 ROI Analysis by Phase

### Phase 1 (Zero-Train) — HIGHEST ROI
- **Cost**: $0
- **Time**: 2 hours
- **Quality**: 4/5 (MediaPipe is state-of-the-art)
- **ROI Score**: 🔥🔥🔥 (infinite)
- **Decision**: ALWAYS START HERE

### Phase 2 (Light Finetune) — MEDIUM ROI
- **Cost**: $1-2
- **Time**: 4-6 hours
- **Quality**: 4.5-5/5 (custom optimized)
- **ROI Score**: 🔥🔥 (3x-4x quality improvement per $)
- **Decision**: Only if Phase 1 IoU <0.85

### Phase 3 (Full Training) — LOW ROI
- **Cost**: $50-200
- **Time**: 20-40 hours
- **Quality**: 5/5 (unlimited)
- **ROI Score**: 🔥 (1.01x quality improvement per $)
- **Decision**: AVOID unless extreme quality needed

### Phase 4 (Integration) — MEDIUM ROI
- **Cost**: $0
- **Time**: 2-3 hours
- **Quality**: N/A (deployment)
- **ROI Score**: 🔥🔥 (enables production)
- **Decision**: REQUIRED after Phase 1 or 2

---

## 🎯 Cyclomatic Complexity Summary

| Phase | Task | CC | Risk | Testability |
|-------|------|-----|------|-------------|
| 1 | 1.1 Setup | 1 | 🟢 Minimal | 🟢 Excellent |
| 1 | 1.2 Integration | 5 | 🟡 Low | 🟡 Good |
| 1 | 1.3 Testing | 6 | 🟡 Low | 🟡 Good |
| 1 | 1.4 Post-Processing | 8 | 🟡 Medium | 🟡 Fair |
| 1 | 1.5 Benchmarking | 2 | 🟢 Minimal | 🟢 Excellent |
| 1 | 1.6 Deployment | 1 | 🟢 Minimal | 🟢 Excellent |
| 2 | 2.1 Data Prep | 4 | 🟡 Low | 🟡 Good |
| 2 | 2.2 GPU Setup | 2 | 🟢 Minimal | 🟢 Excellent |
| 2 | 2.3 Model Selection | 1 | 🟢 Minimal | 🟢 Excellent |
| 2 | 2.4 Training | 12 | 🔴 High | 🟡 Fair |
| 2 | 2.5 Export | 5 | 🟡 Low | 🟡 Good |
| 2 | 2.6 Cost Minimization | 1 | 🟢 Minimal | 🟢 Excellent |
| 3 | 3.1 Dataset Expansion | 4 | 🟡 Low | 🟡 Good |
| 3 | 3.2 Full Training | 15 | 🔴 High | 🟡 Fair |
| 3 | 3.3 Analysis | 7 | 🟡 Medium | 🟡 Fair |
| 4 | 4.1 Versioning | 2 | 🟢 Minimal | 🟢 Excellent |
| 4 | 4.2 Integration | 5 | 🟡 Low | 🟡 Good |
| 4 | 4.3 A/B Testing | 8 | 🟡 Medium | 🟡 Fair |
| 4 | 4.4 Monitoring | 7 | 🟡 Medium | 🟡 Fair |
| 4 | 4.5 Documentation | 1 | 🟢 Minimal | 🟢 Excellent |

**Key Insights**:
- **Low CC (1-2)**: Setup, deployment, cost control — easy, test with simple unit tests
- **Medium CC (4-8)**: Integration, testing, monitoring — moderate, need branch coverage
- **High CC (12-15)**: Training loops — complex, need integration tests + visual validation

---

## 🚦 Recommended Execution Path

### Week 1: Phase 1 (Zero-Train)
```
Day 1 (Mon-Tue):    Tasks 1.1-1.2 (env + integration)
Day 2 (Wed):        Tasks 1.3-1.4 (testing + post-processing)
Day 3 (Thu):        Tasks 1.5-1.6 (benchmarking + deploy)

Effort: 2-2.5 hours total
Cost: $0
Risk: 🟢 Minimal
Result: Production-ready MediaPipe baseline
```

### Week 2: Phase 2 (IF NEEDED)
```
Only if Phase 1 IoU <0.85 on edge cases

Day 1 (Mon-Tue):    Tasks 2.1-2.3 (prep + GPU setup)
Day 2-3 (Wed-Thu):  Task 2.4 (training, run overnight)
Day 4 (Fri):        Tasks 2.5-2.6 (export + shutdown)

Effort: 4-6 hours total (including GPU time)
Cost: $1-2
Risk: 🟡 Low
Result: Improved model v1.1 with better edge case handling
```

### Week 3: Phase 4 (After Phase 1 or 2)
```
Day 1 (Mon):        Tasks 4.1-4.2 (versioning + integration)
Day 2 (Tue):        Task 4.3 (A/B testing setup)
Day 3 (Wed):        Task 4.4 (monitoring)
Day 4 (Thu):        Task 4.5 (documentation)

Effort: 2-3 hours total
Cost: $0
Risk: 🟢 Minimal
Result: Production deployment with safety rollback
```

---

**Document Version**: 1.0 (Phases Breakdown)
**Last Updated**: 2025-12-20
**Owner**: ML Team
**Review Cycle**: After each phase completion
