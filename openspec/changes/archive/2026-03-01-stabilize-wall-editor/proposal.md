## Why

The 3D wall editor was migrated from 2D Konva.js to React Three Fiber in a vibe-coding session. It shipped ~15 files with no specs or tests. The wall model is conceptually wrong (separate floating panels instead of one continuous surface), hold geometries are poorly sized, and core interactions (dragging, selection, camera) are broken. The editor needs to be stabilized before wall subdivisions or the genetic algorithm can be built on top of it.

## What Changes

- **BREAKING**: Simplify wall from multi-panel array to a single flat panel (one surface, one angle)
- Rewrite hold geometries — all holds become solid volumetric rocks (IcosahedronGeometry/ExtrudeGeometry), replacing hollow shells
- Fix hold placement — click should place hold at the correct raycasted position on the wall
- Fix hold dragging — hold should follow the pointer, clamped to wall bounds
- Fix hold selection — visible glow effect, working actions toolbar (currently same color as background, nearly transparent)
- Fix camera controls — OrbitControls currently fight with hold click/drag interactions
- Remove width/height number inputs (error-prone, causes orphaned holds outside wall bounds)
- Add wall and hold color customization
- Add visual polish: hard shadows, bloom post-processing on selected holds, vignette, spring animations on placement/deletion/hover
- Add keyboard-driven workflow: R=rotate, WASD/Arrows=nudge, Delete=remove, Esc=deselect
- Add unit tests for store and geometry utils
- Add E2E tests via Playwright MCP for core interactions

## Capabilities

### New Capabilities
- `wall-surface`: Single flat wall surface with correct dimensions, rendering, and future-ready for subdivisions
- `hold-system`: Procedural 3D hold geometries (jug, crimp, sloper, pinch, pocket, volume) with correct sizing, placement, dragging, selection, and color customization
- `editor-interactions`: Click-to-place, drag-to-move, select, rotate, delete holds with camera controls that don't conflict
- `editor-testing`: Unit tests for store/utils and E2E tests for core editor workflows

### Modified Capabilities

## Impact

- `apps/web/src/stores/wallStore.ts` — Simplify from `panels: WallPanel[]` to single panel model
- `apps/web/src/pages/editor/components/WallCanvas3D/` — All components, hooks, utils, and configs
- `apps/web/src/pages/editor/components/WallConfig/` — Remove panel list UI, remove width/height inputs, add color controls
- `packages/shared/src/types.ts` — Simplify `Wall` and `WallPanel` types
- `apps/web/src/lib/colors.ts` — Hold and wall color definitions
- `apps/web/src/i18n/*.json` — Remove panel-related keys, add color-related keys
