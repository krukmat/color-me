# Palette & UX Definition

## Core Palette (10 colors)
1. `Midnight Espresso` – #2C1B2F. Deep neutral for dramatic contrast.
2. `Copper Bloom` – #A15C3E. Warm auburn with orange highlights.
3. `Rosewood Fade` – #7E3C3C. Raspberry burgundy for rich tones.
4. `Saffron Glaze` – #D9902D. Bright copper that keeps warmth.
5. `Sunlit Amber` – #F4B55E. Honey gold for soft metallic shine.
6. `Forest Veil` – #375A40. Muted forest for edgy balance.
7. `Lilac Mist` – #A78EBB. Dusty lavender for playful looks.
8. `Soft Slate` – #54616F. Cool ash that neutralizes warmth.
9. `Blush Garnet` – #94425E. Deep pinkish-red for bold finishes.
10. `Champagne Frost` – #BFAF99. Pale beige with cool highlights.

Each color entry includes a friendly name, hex, and brief intent so that design, mobile, and ML teams can share vocabulary. Store this list in the doc for reference when building the palette UI and backend mapping.

## Slider of Intensity
- Range: `0–100` (integer steps).  
- Neutral start at `50` (50% intensity). Values below 50 should favor subtler overlays; above 50 are full saturation.  
- ML API payload: `{ "color": "Rosewood Fade", "intensity": 72 }`.  
- Slider updates only the opacity layer sent to ML; keep 10 discrete base colors and factor intensity server-side (interpolation between original color and neutral tone).

## Before/After Interaction
- Primary control is a **horizontal slider** that blends between “before” (left) and “after” (right) states.  
- Alternative toggle should switch between the two full-screen states when the slider is at either end.  
- Mobile UI should expose text: `Antes`, `Después`, `Mostrar original` and a microcopy for touch states (e.g., “Mantén para comparar”).  
- Backend receives `request_id` + final image metadata; front-end keeps a cached copy of the original preview to avoid re-fetching the selfie.

## Acceptance Notes
- Selecting each color should display its name plus a brief descriptor under the picker.  
- Slider moves in increments of `5` for quick adjustments and reports values 0–100.  
- The before/after slider must show a label that updates text based on position (e.g., `Antes 60%`, `Después 40%`).  
- Document any changes in `AGENTS.md` or `PROJECT_PLAN.md` if new UI controls emerge.
