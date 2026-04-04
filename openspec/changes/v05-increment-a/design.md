## Context

V0 delivered a stable wall editor with 6 hold types, placement/drag/selection, keyboard shortcuts, and 33+ tests. The editor works well but lacks physical realism: holds can overlap freely, the wall is a plain flat surface, and the only large-form hold (volume) is an icosahedron that doesn't match real gym geometry.

V0.5 Increment A addresses three independent gaps before tackling resizing (which depends on collision detection). The existing codebase uses Zustand for state, R3F for rendering, and procedural `ExtrudeGeometry`/`SphereGeometry`/`IcosahedronGeometry` for holds.

## Goals / Non-Goals

**Goals:**
- Prevent holds from overlapping during placement and dragging
- Give the wall surface a realistic plywood + T-nut appearance via normal maps
- Add a triangular prism volume type common in climbing gyms
- Keep all three features independent so they can be tested and shipped incrementally
- Maintain existing shadow quality and rendering performance

**Non-Goals:**
- Hold resizing (Increment B — depends on collision)
- Wall resizing (Increment B)
- Wall subdivisions / angle bending (separate spec, high complexity)
- Genetic algorithm collision integration (future — we expose the API now, integrate later)
- Vertex displacement or geometry-level surface detail (causes shadow artifacts — use normal maps instead)

## Decisions

### 1. Bounding-sphere collision detection

**Decision:** Use bounding spheres centered on each hold's XY position with a per-type radius from config.

**Why over bounding boxes:** Holds are organic shapes with arbitrary rotation. Sphere-sphere intersection is rotation-invariant and O(1) per pair — just `distance(a, b) < radiusA + radiusB`. Bounding boxes would need rotation handling and produce worse fits for round holds (slopers, pockets).

**Alternatives considered:**
- Mesh-level intersection: Too expensive for real-time drag feedback
- Grid-based spatial partitioning: Over-engineered for <100 holds on a wall

### 2. Collision logic lives in a pure utility, not the store

**Decision:** Create `utils/holdCollision.ts` with pure functions: `checkCollision(holdA, holdB, radii)` and `findCollisions(hold, allHolds, radii)`. The store calls these during `addHold` and `updateHold`.

**Why:** Keeps collision math testable without mocking Zustand. The store orchestrates (reject placement, revert drag) but doesn't own the geometry math.

### 3. Collision feedback: red tint + blocked action

**Decision:** On placement collision, the hold is simply not placed (no-op). On drag collision, the hold snaps back to its previous position. During drag, a colliding hold shows a red semi-transparent preview.

**Why over snap-away:** Snap-away (moving the hold to the nearest non-colliding position) is more complex and can produce surprising results. Blocking + visual feedback is simpler and gives the user clear control.

### 4. T-nut texture via procedural normal map on canvas

**Decision:** Generate a T-nut grid pattern as a canvas-based normal map applied to the wall's `MeshStandardMaterial.normalMap`. Grid spacing ~15cm to match real T-nut panels.

**Why normal map over geometry:** Adding actual geometry (cylinders for each T-nut) would be expensive and complicate shadows. A normal map creates the visual impression of recessed holes without affecting the mesh. This avoids the shadow artifacts we hit with vertex displacement.

**Why procedural over image asset:** Keeps the project zero-asset for the wall surface. The canvas texture is generated once and cached.

### 5. Triangle hold type as `triangle` (not replacing `volume`)

**Decision:** Add `'triangle'` to the `HoldType` union. Keep the existing `'volume'` (icosahedron) as-is. The triangle is a separate hold type with its own geometry, config, and color.

**Why not replace volume:** They serve different purposes. Icosahedron volumes are large blocky features; triangular volumes create angled surfaces. Real gyms use both.

**Geometry:** `ExtrudeGeometry` from a triangular `Shape` with bevel, similar to existing hold patterns. Flat shading like the current volume type.

### 6. Collision radius config alongside geometry config

**Decision:** Add `collisionRadius` to `HoldGeometryConfig`. This is separate from the visual bounding sphere — it defines the exclusion zone. Slightly larger than the visual radius for comfortable spacing.

**Why in config over computed:** Computing from geometry requires `computeBoundingSphere()` which varies with random scale jitter. A fixed config value per type is predictable and testable.

## Risks / Trade-offs

- **Bounding spheres are approximate** → Some visual overlap may occur at edges of non-round holds (crimps, pinches). Acceptable for V0.5 — tighter collision shapes can come later if needed.
- **T-nut normal map is purely visual** → It won't affect hold placement snapping to T-nut positions. That's a future feature (T-nut layout planning, V3 backlog).
- **Adding a 7th hold type touches many files** → Types, store, config, geometry, sidebar, i18n, tests. But each touch is small and mechanical.
- **Canvas normal map quality** → Procedural normal maps can look flat if not tuned well. Mitigate by testing with the existing lighting rig and adjusting bump intensity.
