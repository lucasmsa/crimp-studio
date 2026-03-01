## 1. Store Simplification

- [x] 1.1 Rewrite `wallStore.ts` — flat wall model (no panels array), add `wallColor` field, add optional `color` to `Hold`, remove panel CRUD actions, remove `activePanelId`
- [x] 1.2 Update `packages/shared/src/types.ts` — simplify `Wall` type (no `WallPanel`), add `wallColor` and hold `color` fields
- [x] 1.3 Remove panel-related i18n keys from all 3 language files, add color-related keys

## 2. Hold Geometry Rewrite

- [x] 2.1 Rewrite `holdGeometry.ts` — smooth PU holds with procedural randomization (rand for depth, scale, rotation per type). Jug=ExtrudeGeometry, Crimp=ExtrudeGeometry, Sloper=SphereGeometry, Pinch=ExtrudeGeometry, Pocket=ExtrudeGeometry with blob bezier outer + ellipse hole, Volume=IcosahedronGeometry
- [x] 2.2 Update `holdGeometryConfig.ts` — per-type sizeMultiplier and zOffset
- [x] 2.3 Update `Hold3D.tsx` — smooth shading (flatShading=false) for all types except volume (flatShading=true via FLAT_SHADED_TYPES), use per-type zOffset, roughness 0.85, metalness 0
- [x] 2.4 Verify all 6 hold types are solid, visible, and distinguishable at default camera distance

## 3. Wall Rendering

- [x] 3.1 Created `Wall3D.tsx` — single flat BoxGeometry, no panel layout logic, receives `wallColor` from store
- [x] 3.2 Deleted `wallLayout.ts` multi-panel position calculator and `WallPanel3D.tsx`
- [x] 3.3 Updated `WallScene.tsx` — presentational, uses hooks (useEditorCamera, useEditorKeyboard), renders Wall3D + HoldActionsOverlay
- [x] 3.4 Enable hard shadows on Canvas (`shadows` prop), directional light `castShadow`, holds `castShadow`, wall `receiveShadow`

## 4. Post-Processing & Visual Polish

- [x] 4.1 Add `<EffectComposer>` with `<Bloom>` (selective, luminanceThreshold=1) and `<Vignette>` to WallScene
- [x] 4.2 Hold selection uses emissiveIntensity=2.0, toneMapped=false so bloom picks up selected holds
- [x] 4.3 Actions overlay has solid `bg-surface` background with `border-border` for contrast

## 5. Spring Animations

- [x] 5.1 Install `@react-spring/three`
- [x] 5.2 Add pop-in animation on hold placement (scale 0 -> 1 with spring config tension=300, friction=15)
- [x] 5.4 Add smooth spring transitions for hover scale and selection scale via animated.mesh


## 6. Interactions — Fix Core

- [x] 6.1 Fix hold placement — accurate raycasting via worldToLocal, correct position mapping (world -> local -> cm)
- [x] 6.2 Fix hold dragging — raycast against invisible reference plane (`THREE.Plane`), clamp to wall bounds
- [x] 6.3 Fix orbit controls conflict — disable OrbitControls during hold drag, re-enable on pointer up
- [x] 6.4 Fix click-to-select — bloom glow on selection, `e.stopPropagation()` prevents placing new hold on hold click
- [x] 6.5 Fix click-on-wall-deselects — clicking empty wall space with hold selected deselects (no new hold placed)

## 7. Interactions — Keyboard Shortcuts

- [x] 7.1 R key to rotate selected hold by 45 degrees (uses `getNextRotation` from utils)
- [x] 7.2 Backspace/Delete key to remove selected hold
- [x] 7.3 Escape key to deselect current hold
- [x] 7.4 WASD and Arrow keys to nudge selected hold (5cm, Shift=20cm), clamped to wall bounds
- [x] 7.5 Pointer cursor on all interactive elements (holds via onPointerEnter/Leave)

## 8. Sidebar Simplification

- [x] 8.1 Remove panel list UI, add/remove panel buttons, and dimension/angle inputs from WallConfig
- [x] 8.2 Add wall color picker to sidebar
- [x] 8.3 Add hold color picker (for selected hold) to sidebar
- [x] 8.4 Keep hold type selector

## 9. Unit Tests

- [x] 9.1 Store tests: addHold, removeHold, updateHold, selectHold, clearHolds, setWallColor (14 tests)
- [x] 9.2 Geometry tests: each hold type produces valid BufferGeometry with non-empty position attribute, procedural variance, scaling (14 tests)
- [x] 9.3 Utility tests: getNextRotation (5 tests)

## 10. E2E Tests (Playwright MCP)

- [x] 10.1 E2E: open editor, click wall to place hold, verify hold appears (0 -> 1 hold)
- [x] 10.2 E2E: select hold, press Delete, verify hold removed (1 -> 0 holds)
- [x] 10.3 E2E: select hold, verify visual selection feedback (Hold Color picker appears)
- [x] 10.4 E2E: press R with hold selected, verify rotation changes
- [x] 10.5 E2E: press arrow key with hold selected, verify position changes
- [x] 10.6 E2E: place all 6 hold types, verify count = 6
- [x] 10.7 E2E: Escape key deselects hold (Hold Color picker disappears)
- [x] 10.8 E2E: Clear All removes all holds (back to 0)

## 11. Cleanup & Validation

- [x] 11.1 Remove dead code: deleted `wallLayout.ts`, `WallPanel3D.tsx`, panel CRUD from store
- [x] 11.2 Run `pnpm ci:flow` — lint, typecheck, tests all pass (33/33 tests, 0 lint errors)
- [x] 11.3 E2E verification via Playwright: place all 6 types, select, rotate, nudge, delete, escape, clear
