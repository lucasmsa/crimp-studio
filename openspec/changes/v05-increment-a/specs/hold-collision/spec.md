# Hold Collision Detection

## Overview

Bounding-sphere collision detection that prevents holds from overlapping during placement, dragging, and keyboard nudging. Visual feedback shows when a collision would occur.

## Behaviors

### Collision Detection Logic
- Each hold type has a `collisionRadius` (cm) in `holdGeometryConfig`
- Two holds collide when `distance(a, b) < radiusA + radiusB`
- Distance is 2D Euclidean (x, y in cm) — holds live on a flat wall plane
- A hold never collides with itself

### Placement (click on wall)
- Before adding a hold, check the candidate position against all existing holds
- If collision detected: hold is **not placed** (no-op, silent rejection)
- No visual feedback needed — the user simply clicks again elsewhere

### Dragging (hold drag via pointer)
- During drag, check candidate position each frame against all other holds
- If collision detected: **block the move** — hold stays at its last valid position
- While blocked, the dragged hold shows **collision visual feedback** (red tint + semi-transparent)
- When the pointer moves to a non-colliding position, the hold resumes following and feedback clears

### Keyboard Nudge (WASD/arrows)
- Before applying the nudge offset, check candidate position against all other holds
- If collision detected: **block the nudge** (no-op, hold stays put)
- No persistent visual feedback needed for keyboard nudge

### Collision Visual Feedback
- Colliding hold material: color shifts toward `colors.error` (#EF4444), opacity drops to 0.5
- Feedback is applied via `getHoldVisualState` with a new `isColliding` option
- Feedback clears immediately when collision resolves

## Integration Points

### New Files
- `utils/holdCollision.ts` — pure collision functions
- `utils/__tests__/holdCollision.test.ts` — unit tests

### Modified Files
- `config/holdGeometryConfig.ts` — add `collisionRadius` per hold type
- `config/holdVisualConfig.ts` — add `isColliding` visual state
- `stores/wallStore.ts` — collision checks in `addHold`, expose collision util for hooks
- `hooks/useWallInteraction.ts` — collision checks during drag
- `hooks/useEditorKeyboard.ts` — collision checks before nudge
- `components/Hold3D.tsx` — pass `isColliding` prop, apply visual feedback
- `i18n/*.json` — collision-related labels (if any UI messages needed)

## Success Criteria
- [ ] Two holds of the same type cannot overlap when placed by clicking
- [ ] Dragging a hold into another hold is visually blocked with red feedback
- [ ] Keyboard nudging into another hold is blocked
- [ ] Collision radii are configurable per hold type
- [ ] All collision logic is in pure utility functions with full test coverage
- [ ] Existing tests still pass (`pnpm ci:flow`)
