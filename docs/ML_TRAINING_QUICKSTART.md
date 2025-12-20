# ML Training Quick Start Guide

**For Developers**: Token-optimized execution path
**Date**: 2025-12-20
**Estimated Total Time**: 5 hours (Phase 1 + Phase 4)
**Estimated Total Cost**: $0

---

## Decision Tree (Start Here)

```
Do you need to train the ML model?
│
├─ YES, quality insufficient (<85% IoU) → Follow Phase 2 (9-11 hours, ~$1-2)
│
└─ NO, use pre-trained MediaPipe → Follow Phase 1 + Phase 4 (5 hours, $0) ← RECOMMENDED
```

**Default Path**: Phase 1 → Phase 4 (MediaPipe zero-train)

---

## Phase 1: MediaPipe Integration (2.5 hours, $0)

### Pre-Flight Checklist
```bash
cd /Users/matiasleandrokruk/Documents/color-me/services/ml-api
git checkout -b feature/ml-phase1-mediapipe
```

### Task Sequence

#### 1.1 Environment Setup (30 min) — Tokens: 5k
```bash
# Add dependencies
echo "mediapipe==0.10.14
opencv-python==4.10.0.84
pillow==10.4.0
numpy==1.26.4" >> requirements.txt

pip install -r requirements.txt

# Create fixtures directory
mkdir -p tests/fixtures/test_images

# Download 20+ test images (diverse: skin tones, hair types, lighting)
# Save to tests/fixtures/test_images/
```

**Checkpoint**: Commit after fixture setup
```bash
git add requirements.txt tests/fixtures/
git commit -m "feat(ml-api): Add MediaPipe dependencies and test fixtures [Task 1.1]"
```

---

#### 1.2 MediaPipe Integration (45 min) — Tokens: 12k

**Files to Edit**:
- `app/core/models.py`: Load MediaPipe SelfieSegmentation
- `app/core/segmenter.py`: Implement real segmentation logic

**Key Changes**:
1. Update `ModelCache.segmenter()` to load MediaPipe model
2. Implement `_segment_with_mediapipe()` with OpenCV image decoding
3. Add graceful fallback to stub on errors
4. Add error logging

**Tests to Add**:
```bash
# tests/test_segmentation.py
def test_segment_real_image(sample_fixture_path):
    result = segment_selfie(selfie_from_path(sample_fixture_path))
    assert result.backend in {"mediapipe", "stub"}
    if result.backend == "mediapipe":
        assert result.mask is not None
        assert result.mask.shape[0] > 0
```

**Run Tests**:
```bash
pytest tests/ -v -k segmentation
```

**Checkpoint**: Commit after integration
```bash
git add app/core/models.py app/core/segmenter.py tests/
git commit -m "feat(ml-api): Integrate MediaPipe SelfieSegmentation [Task 1.2]"
```

---

#### 1.3 Quality Validation (45 min) — Tokens: 15k

**Create**: `tests/test_segmentation_quality.py`

**Run Quality Tests**:
```bash
pytest tests/test_segmentation_quality.py -v -s
```

**Expected Output**:
```
Total Fixtures: 20
MediaPipe Used: 19 (95%)
Failures: 1 (5%)

Quality Distribution:
- Excellent: 12
- Good: 6
- Acceptable: 1
- Failures: 1
```

**Decision Point**:
- ✅ If failures <20%: Proceed to Task 1.4
- ⚠️ If failures ≥20%: Escalate to Phase 2

**Checkpoint**: Commit after validation
```bash
git add tests/test_segmentation_quality.py
git commit -m "test(ml-api): Add quality validation for MediaPipe [Task 1.3]"
```

---

#### 1.4 Post-Processing Tuning (30 min) — Tokens: 12k

**Edit**: `app/core/postprocess.py`

**Add**:
- `postprocess_mask()`: Feathering, morphological ops, anti-bleed
- `PostprocessConfig`: Tunable parameters

**Tests**:
```bash
pytest tests/ -v -k postprocess
```

**Checkpoint**: Commit after tuning
```bash
git add app/core/postprocess.py tests/
git commit -m "feat(ml-api): Implement mask post-processing [Task 1.4]"
```

---

#### 1.5 Benchmarking (15 min) — Tokens: 5k

**Create**: `tests/test_segmentation_benchmark.py`

**Run Benchmarks**:
```bash
pytest tests/test_segmentation_benchmark.py -v -s
```

**Expected Output**:
```
Inference Latency (CPU, n=10):
  p50: 120.3 ms
  p95: 180.7 ms
  p99: 220.1 ms

Throughput: 8.3 req/s
```

**Acceptance**: p95 < 500ms ✅

**Checkpoint**: Commit after benchmarks
```bash
git add tests/test_segmentation_benchmark.py
git commit -m "test(ml-api): Add inference benchmarks [Task 1.5]"
```

---

#### 1.6 Deploy to Staging (15 min) — Tokens: 3k

**Create**: `model_registry.json`

**Update**: `app/core/models.py` (add version logging)

**E2E Smoke Test**:
```bash
# Start ML API
uvicorn app.main:app --reload

# In another terminal:
curl -X POST http://localhost:8000/try-on \
  -H "Content-Type: application/json" \
  -H "x-request-id: test-phase1" \
  -d '{
    "selfie": "data:image/png;base64,iVBORw0KGg...",
    "color": "Sunlit Amber",
    "intensity": 50,
    "request_id": "test-phase1"
  }'

# Expected: 200 OK, image_url returned
```

**Checkpoint**: Commit and push
```bash
git add model_registry.json app/core/models.py
git commit -m "feat(ml-api): Deploy Phase 1 MediaPipe to staging [Task 1.6]"
git push origin feature/ml-phase1-mediapipe
```

---

### Phase 1 Complete

**Total Tokens Used**: ~52,000 / 200,000 (26%)
**Remaining Budget**: ~148,000 tokens

**Exit Criteria**:
- ✅ MediaPipe segmentation working
- ✅ Quality ≥85% (failures <20%)
- ✅ Latency p95 < 500ms
- ✅ E2E test passing

**Next**: Proceed to Phase 4 (Integration & Deployment)

---

## Phase 4: Production Integration (2.5 hours, $0)

### Pre-Flight Checklist
```bash
git checkout -b feature/ml-phase4-production
git merge feature/ml-phase1-mediapipe
```

---

#### 4.1 Model Versioning (15 min) — Tokens: 3k

**Finalize**: `model_registry.json`
**Add**: SHA256 checksum for integrity

**Store Checkpoint**:
```bash
# Option A: Git LFS (for small models)
git lfs track "checkpoints/*.pt"
git add .gitattributes

# Option B: S3 (for large models)
aws s3 cp checkpoints/hair_segmenter_v1.0.pt s3://bucket/models/
```

**Checkpoint**: Commit
```bash
git add model_registry.json
git commit -m "feat(ml-api): Finalize model registry [Task 4.1]"
```

---

#### 4.2 Production Model Integration (30 min) — Tokens: 10k

**Update**: `app/core/models.py` (load production checkpoint)

**Run All Tests**:
```bash
pytest tests/ -v
```

**E2E Smoke Test** (verify no regressions):
```bash
uvicorn app.main:app --reload
curl -X POST http://localhost:8000/try-on -H "..." -d '{...}'
```

**Checkpoint**: Commit
```bash
git add app/core/models.py
git commit -m "feat(ml-api): Integrate production model [Task 4.2]"
```

---

#### 4.3 A/B Testing Setup (45 min) — Tokens: 12k

**Create**: `app/core/ab_testing.py`

**Features**:
- Feature flag logic (10% → 50% → 100%)
- Consistent hashing (same request_id → same model)
- Env var configurable (`ROLLOUT_STAGE`)

**Update**: `app/core/pipeline.py` (integrate A/B logic)

**Tests**:
```bash
pytest tests/ -v -k ab_testing
```

**Checkpoint**: Commit
```bash
git add app/core/ab_testing.py app/core/pipeline.py tests/ docs/ROLLOUT_PLAN.md
git commit -m "feat(ml-api): Implement A/B testing [Task 4.3]"
```

---

#### 4.4 Monitoring & Alerting (30 min) — Tokens: 10k

**Create**: `app/core/metrics.py`

**Add Metrics Endpoint**:
```python
@app.get("/metrics")
def get_metrics():
    return METRICS.get_summary()
```

**Test**:
```bash
curl http://localhost:8000/metrics

# Expected:
{
  "requests": 0,
  "errors": 0,
  "error_rate": 0,
  "latency_p50": 0,
  "latency_p95": 0,
  "latency_p99": 0,
  "model_versions": {},
  "ab_assignments": {}
}
```

**Checkpoint**: Commit
```bash
git add app/core/metrics.py app/main.py docs/MONITORING.md
git commit -m "feat(ml-api): Add metrics and monitoring [Task 4.4]"
```

---

#### 4.5 Documentation & Handoff (20 min) — Tokens: 5k

**Update**:
- `README.md`: Deployment instructions
- `docs/ROLLBACK_PROCEDURE.md`: Rollback steps
- `docs/INCIDENT_RESPONSE.md`: Incident playbook

**Checkpoint**: Commit and push
```bash
git add README.md docs/
git commit -m "docs(ml-api): Complete deployment documentation [Task 4.5]"
git push origin feature/ml-phase4-production
```

---

### Phase 4 Complete

**Total Tokens Used**: ~41,000 / 200,000 (20%)
**Cumulative**: ~93,000 / 200,000 (46%)
**Remaining Budget**: ~107,000 tokens

**Exit Criteria**:
- ✅ Model registry finalized
- ✅ A/B testing implemented
- ✅ Monitoring active
- ✅ Documentation complete
- ✅ Rollback procedure ready

**Next**: Create Pull Request and deploy to staging

---

## Final Deployment Checklist

### Pre-Production
- [ ] All tests passing (`pytest tests/ -v`)
- [ ] E2E smoke test successful
- [ ] Monitoring endpoint active (`/metrics`)
- [ ] Rollback procedure tested
- [ ] Documentation reviewed

### Rollout Schedule

**Week 1: 10% Traffic**
```bash
export ROLLOUT_STAGE=TEN_PERCENT
docker-compose restart ml-api
```
- Monitor: Error rate, latency, user feedback
- Rollback if: Error rate >2% OR latency p95 >1000ms

**Week 2: 50% Traffic**
```bash
export ROLLOUT_STAGE=FIFTY_PERCENT
docker-compose restart ml-api
```
- Continue monitoring
- Rollback if metrics degrade

**Week 3: 100% Traffic**
```bash
export ROLLOUT_STAGE=FULL
docker-compose restart ml-api
```
- Production fully migrated
- Monitor for 7 days

---

## Troubleshooting

### Issue: Tests failing after MediaPipe integration
**Solution**:
1. Check MediaPipe installation: `python -c "import mediapipe; print(mediapipe.__version__)"`
2. Verify fixtures exist: `ls tests/fixtures/test_images/`
3. Check logs for specific errors

### Issue: Latency p95 > 500ms
**Solution**:
1. Profile code: `pytest tests/test_segmentation_benchmark.py -v -s --profile`
2. Check image sizes (should be <1024x1024)
3. Consider GPU if CPU too slow

### Issue: Quality insufficient (failures >20%)
**Solution**:
1. Review failed fixtures: `pytest tests/test_segmentation_quality.py -v`
2. Categorize failures (lighting, occlusion, hair type)
3. If systematic: Escalate to Phase 2 (Light Finetune)

### Issue: E2E test failing
**Solution**:
1. Check ML API logs: `docker logs ml-api`
2. Verify payload format (base64, MIME type)
3. Test with minimal payload: `{"selfie": "data:image/png;base64,iVBORw0KGg...", "color": "Sunlit Amber", "intensity": 50, "request_id": "test"}`

---

## Token Budget Tracking

| Phase | Task | Tokens Used | Cumulative | Remaining |
|-------|------|-------------|------------|-----------|
| 1 | 1.1 Setup | 5,000 | 5,000 | 195,000 |
| 1 | 1.2 Integration | 12,000 | 17,000 | 183,000 |
| 1 | 1.3 Quality | 15,000 | 32,000 | 168,000 |
| 1 | 1.4 Post-Process | 12,000 | 44,000 | 156,000 |
| 1 | 1.5 Benchmark | 5,000 | 49,000 | 151,000 |
| 1 | 1.6 Deploy | 3,000 | 52,000 | 148,000 |
| 4 | 4.1 Versioning | 3,000 | 55,000 | 145,000 |
| 4 | 4.2 Integration | 10,000 | 65,000 | 135,000 |
| 4 | 4.3 A/B Testing | 12,000 | 77,000 | 123,000 |
| 4 | 4.4 Monitoring | 10,000 | 87,000 | 113,000 |
| 4 | 4.5 Docs | 5,000 | 92,000 | 108,000 |
| **TOTAL** | **11 tasks** | **92,000** | **92,000** | **108,000** |

**Safety Margin**: 108,000 tokens remaining (54% of budget)

---

## Emergency Stop Protocol

**If tokens <20,000 remaining**:

1. **Document current state**:
   ```bash
   # Create checkpoint file
   echo "CURRENT_TASK: [Task ID from commit message]
   NEXT_STEPS: [Next task from execution plan]
   BRANCH: $(git branch --show-current)
   LAST_COMMIT: $(git log -1 --oneline)" > CHECKPOINT.md

   git add CHECKPOINT.md
   git commit -m "chore: Emergency checkpoint (low tokens)"
   git push
   ```

2. **Recovery** (in new conversation):
   ```bash
   git checkout [branch from CHECKPOINT.md]
   cat CHECKPOINT.md  # Resume from next task
   ```

---

## Success Metrics

### Phase 1 Success
- MediaPipe segmentation working (backend="mediapipe")
- Quality ≥85% (IoU or visual QA)
- Latency p95 < 500ms
- Failures <20%

### Phase 4 Success
- A/B testing functional (10% → 50% → 100%)
- Monitoring active (/metrics endpoint)
- Rollback procedure tested
- Documentation complete

### Production Success
- Error rate <2% sustained
- Latency p95 <1000ms sustained
- No rollbacks in 7 days
- User satisfaction positive

---

## Quick Commands Reference

```bash
# Install dependencies
pip install -r requirements.txt

# Run all tests
pytest tests/ -v

# Run quality tests
pytest tests/test_segmentation_quality.py -v -s

# Run benchmarks
pytest tests/test_segmentation_benchmark.py -v -s

# Start ML API
uvicorn app.main:app --reload

# Check metrics
curl http://localhost:8000/metrics

# E2E smoke test
curl -X POST http://localhost:8000/try-on -H "Content-Type: application/json" -H "x-request-id: test" -d '{...}'

# Rollback
export ROLLOUT_STAGE=DISABLED
docker-compose restart ml-api
```

---

**Ready to Start?** Begin with Phase 1, Task 1.1 (Environment Setup)

**Questions?** Refer to `ML_TRAINING_EXECUTION_PLAN.md` for detailed task breakdowns
