# Test Fixtures

## Test Images

Diverse selfie dataset for segmentation validation:
- 20-30 images covering:
  - Skin tones: Light, medium, dark
  - Hair types: Straight, wavy, curly, afro
  - Lighting: Natural, studio, backlit, low-light
  - Occlusion: Clear, partial, glasses, hat
  - Background: Plain, complex, outdoor, indoor

## Acceptance Criteria
- All images JPEG/PNG, 512x512 to 1024x1024 px
- Minimal PII (use public datasets or stock photos)
- Ground truth masks not required for Phase 1 (visual QA)

## Status
- [x] Directory created
- [ ] 20+ test images downloaded
- [ ] Fixture loader implemented
- [ ] Quality validation tests written
