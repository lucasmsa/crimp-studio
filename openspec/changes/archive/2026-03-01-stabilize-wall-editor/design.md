## Context

The wall editor was migrated from 2D Konva.js to 3D React Three Fiber. The current implementation has a multi-panel model (`panels: WallPanel[]`) where each panel is a separate floating `BoxGeometry`. This doesn't match how real bouldering gym walls work — they are ONE continuous surface with angle changes at joints.

Core interactions (placement, dragging, selection) are broken due to incorrect raycasting math and OrbitControls conflicting with pointer events. Hold geometries are poorly scaled (pocket/crimp invisible, volume spiky). The actions toolbar is invisible against the wall background.

There are zero tests covering ~15 files of 3D code.

## Goals / Non-Goals

**Goals:**
- Simplify the wall to a single flat panel with fixed dimensions that renders correctly
- Fix all 6 hold geometries to look good and have appropriate sizes
- Make hold placement, dragging, and selection work reliably
- Prevent camera controls from stealing pointer events during hold interactions
- Add color customization for wall surface and individual holds
- Add visual polish: shadows, bloom, vignette, spring animations
- Add keyboard-driven workflow: R=rotate, WASD/Arrows=nudge, Delete=remove, Esc=deselect
- Achieve test coverage for the store, geometry utils, and core E2E workflows

**Non-Goals:**
- Wall subdivisions / angle bending (deferred — most complex feature, done after basics are solid)
- Genetic algorithm (needs subdivisions first)
- Width/height/angle editing (removed — causes orphaned holds, clunky UX; will return as drag-to-resize later)
- Drag-to-resize wall or holds
- T-nut grid visualization
- Mobile/touch interactions

## Decisions

### 1. Single flat wall with fixed dimensions, no user-editable width/height/angle

**Choice**: Replace `panels: WallPanel[]` with a single `Wall` that has fixed width (300cm), height (400cm), and angle (0° vertical). Remove all dimension/angle inputs from the sidebar.

**Why**: The multi-panel model was premature. Panels float disconnected in 3D space. Width/height number inputs are error-prone and cause holds to float outside wall bounds when resized. Starting with one fixed-size flat surface lets us nail the basics (placement, dragging, geometry) on a stable foundation. Subdivisions and dimension editing will be re-introduced later with proper specs.

**Alternative considered**: Keep dimension inputs but clamp/reposition holds on resize. Adds complexity for a feature that's better solved by drag-to-resize later.

### 2. Disable OrbitControls during hold drag

**Choice**: Set `orbitControls.enabled = false` when a hold drag starts, re-enable on pointer up.

**Why**: OrbitControls and hold dragging both consume pointer events. Disabling orbit during drag is the simplest fix. R3F's event system (`stopPropagation()`) alone isn't sufficient because OrbitControls listens at the DOM level, not through R3F's event pipeline.

**Alternative considered**: Use `makeDefault` and `regress` on orbit controls. More complex, same result.

### 3. Raycast against wall plane for dragging, not wall mesh

**Choice**: During hold drag, raycast against an infinite plane aligned with the wall surface, then clamp to wall bounds.

**Why**: Raycasting against the wall mesh fails at edges (pointer goes off-mesh and drag stops). An invisible plane ensures continuous tracking. Clamping to `[0, width] x [0, height]` keeps holds within bounds.

**Alternative considered**: Raycast against mesh with extended invisible margins. More geometry, same problem at extreme angles.

### 4. Complete hold geometry rewrite — solid rocks, not shells

**Choice**: Replace all hold geometries with solid volumetric shapes. Use `IcosahedronGeometry` (naturally rocky, low-poly) as base for crimp, sloper, pinch, and volume (scaled per type). Use `ExtrudeGeometry` for jug (extruded shape with lip) and pocket (solid block with hole cut in). Remove random vertex perturbation entirely — the icosahedron's natural facets provide the rocky look.

**Geometry per type:**
| Type | Geometry | Scale (x, y, z) | Notes |
|------|----------|------------------|-------|
| Jug | `ExtrudeGeometry` (shape with lip) | base size | Thick block with pronounced top lip for gripping, beveled |
| Crimp | `IcosahedronGeometry(1, 1)` | 1.5, 0.2, 0.4 | Wide, flat, thin edge |
| Sloper | `IcosahedronGeometry(1, 1)` | 1.5, 1.5, 0.6 | Wide dome squashed against wall |
| Pinch | `IcosahedronGeometry(1, 1)` | 0.5, 1.8, 0.8 | Tall, narrow vertical grip |
| Pocket | `ExtrudeGeometry` (block + hole) | base size | Solid block with circular hole via `Shape.holes` |
| Volume | `IcosahedronGeometry(2, 0)` | 1.5, 1.5, 0.5 | Sharp flat panels, large, detail=0 |

**Why**: Current holds are thin shells (torus, half-sphere, open cylinder) that look 2D from many angles. Real climbing holds are solid chunks of polyurethane bolted to the wall. `IcosahedronGeometry` gives natural rocky facets without needing perturbation. `ExtrudeGeometry` gives the jug its signature lip and the pocket its functional hole.

### 5. Vitest for unit tests, Playwright MCP for E2E

**Choice**: Unit test store and geometry utils with Vitest (already in devDeps). E2E test editor interactions via Playwright MCP (already installed).

**Why**: Vitest is the standard for Vite projects — zero extra config. Playwright MCP lets Claude Code drive a real browser for interaction testing, catching visual/interaction bugs that unit tests miss.

### 6. Color customization via store + color picker

**Choice**: Add `wallColor` to store (default: wall surface color from `colors.ts`). Add optional `color` field to `Hold` interface. Expose color pickers in the sidebar config.

**Why**: Minimal store change. Color pickers in the sidebar keep the UI pattern consistent. Per-hold color allows route color coding (standard in climbing gyms).

### 7. Post-processing: Bloom + Vignette (skip SSAO and motion blur)

**Choice**: Add `<EffectComposer>` with selective `<Bloom>` (luminanceThreshold=1, only emissive holds glow) and `<Vignette>` (subtle dark edges). Skip SSAO (heavy) and motion blur (complex setup, not worth it for a mostly-static editor).

**Why**: Bloom makes selected hold glow look premium. Vignette adds mood for zero performance cost. Both are one-liners with `@react-three/postprocessing` (already installed). SSAO and motion blur have poor effort-to-value ratio for this use case.

### 8. Spring animations via @react-spring/three

**Choice**: Use `@react-spring/three` for hold pop-in on placement (scale 0->1), fade-out on deletion (opacity 1->0), and smooth scale transitions on hover/selection. New dependency.

**Why**: `framer-motion-3d` and `motion` only support React 18; this project uses React 19. `@react-spring/three` works with React 19 and runs animations outside React's render cycle (imperative Three.js updates, no re-renders).

**Alternative considered**: Manual `useFrame` lerping (zero deps). Gets tedious for multiple animated properties.

### 9. Hard shadows (skip soft shadows for now)

**Choice**: Enable hard shadows via `shadows` prop on Canvas, `castShadow` on directional light + holds, `receiveShadow` on wall. Skip `<SoftShadows />`.

**Why**: Hard shadows are a one-liner and look good. `<SoftShadows />` (PCSS) is broken on `three@0.182.0` + `drei@10.7.7` (drei issue #2583). Upgrade to soft shadows when drei publishes the fix.

### 10. Keyboard-driven design-tool workflow

**Choice**: R=rotate (45deg), Backspace/Delete=remove, Escape=deselect, WASD/Arrow keys=nudge (5cm, Shift=20cm). Scroll=zoom (OrbitControls default).

**Why**: Design tools (Figma, Photoshop, Blender) are keyboard-heavy. Nudging with arrow keys gives precision that dragging can't. WASD mirrors gaming muscle memory. Scroll-to-zoom is the universal 3D standard.

## Risks / Trade-offs

- **[Single panel limits testing of multi-panel later]** -> The store simplification removes panel CRUD code. When subdivisions are added later, panel logic will be re-implemented with a proper spec. This is intentional — throwaway code is better than buggy code that shapes future architecture.

- **[Fixed dimensions limit flexibility]** -> Users can't customize wall size for now. Acceptable because: (a) 300x400cm is a reasonable default, (b) drag-to-resize is a better UX than number inputs, (c) fewer moving parts = faster stabilization.

- **[Raycast plane can give coordinates behind wall at extreme angles]** -> Clamp coordinates to wall bounds. For the single flat panel this is trivial. For future subdivisions, each section will need its own reference plane.

- **[New dependency: @react-spring/three]** -> Adds a dependency. Justified because it's the only React 19-compatible spring animation library for R3F, and animations are core to the "premium feel" goal.

- **[Hard shadows have sharp edges]** -> Acceptable for now. Soft shadows will be added when the drei/three.js bug is fixed. Hard shadows still look good and provide depth cues.
