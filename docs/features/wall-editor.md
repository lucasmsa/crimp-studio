# Wall editor

Current behavior of the 3D wall editor (`apps/web/src/pages/editor/`). Ported from the
retired OpenSpec specs (see ADR-004) and updated to match the code. When behavior
changes, update this doc in the same PR.

## Wall surface

- Single flat `BoxGeometry` wall, fixed 300cm x 400cm x 5cm, vertical, centered in the scene.
- No user-editable dimensions or angle. Wall resizing and angled subdivisions are backlog items.
- `wallColor` in the store, editable via sidebar color picker. Default comes from `colors.ts`.
- Store model is flat: one `Wall` with `id`, `name`, `width`, `height`, `angle`, `wallColor`, `holds[]`. No panels.
- Directional key light with hard shadows; holds cast onto the wall. Post-processing: selective bloom on the selected hold, subtle vignette.

## Hold system

- Six types: `jug`, `crimp`, `sloper`, `pinch`, `pocket`, `volume` (`HoldType` in `packages/shared/src/types.ts`).
- Five types render GLB models from the BHToolset packs (see `tools/holds/`), preloaded
  at editor mount, with deterministic variant picks per hold id. `volume` is procedural:
  a plywood wedge (triangular prism, flat-shaded) built in `utils/holdGeometry.ts`.
  Procedural geometries for the other types remain as dev fallback. Per-type
  `sizeMultiplier` and z-offset live in `config/holdGeometryConfig.ts`.
- Render style is switchable via `SCENE_STYLE` in `config/sceneStyleConfig.ts`:
  'toon' (default; cel bands + inverted-hull ink outlines) or 'standard' (PBR rig).
  The wall carries a procedural T-nut grid + plywood seam texture in both styles.
- Material: `MeshStandardMaterial`, roughness 0.9, metalness 0.1, flat shading.
- Each type has a default color in `colors.ts`; a per-hold `color` field overrides it.
- Sidebar exposes the six types; the selected type is used for the next placement.

## Interactions

- Click wall: place hold of selected type at click position. Positions stored in cm from the wall's bottom-left corner.
- Click hold: select (single selection). Selected hold gets emissive glow, slight scale-up, and a floating overlay with rotate and delete buttons.
- Click empty wall with a selection: deselect, no placement.
- Drag: hold follows pointer via raycast against an invisible wall-aligned plane, clamped to wall bounds. Orbit controls disabled during drag, re-enabled on release.
- Keyboard: R rotates by the configured step, Delete/Backspace removes, Escape/Enter deselects, WASD/arrows nudge 5cm (20cm with Shift), clamped to bounds.
- Placement animates scale 0 to 1 with a spring; hover scales up with a spring and shows pointer cursor. Hover scale is suppressed while any hold is being dragged.
- Camera: orbit constrained to polar 30 to 120 degrees, azimuth +-45 degrees, zoom 2m to 15m.

## Hold collision

- AABB overlap checks in `utils/holdCollision.ts` (pure functions: `checkCollision`, `findCollisions`, `hasCollision`).
- Each hold stores a `collisionBox` (half-extents in cm) measured from its actual geometry:
  synchronously at placement via `measureCollisionBox`, then refined by `Hold3D` from the
  mounted mesh. Fallback box is 15x15cm half-extents until measured.
- Placement into an occupied space is rejected silently. Dragging onto another hold shows
  red semi-transparent feedback and snaps back to the pre-drag position on release if still
  colliding. Nudging into a collision is blocked.
- Collision state is exposed in the store so the route generator can penalize overlaps later.

## Test coverage

- Store actions, collision utils, geometry factories, and hold action utils have unit tests
  (`__tests__/` folders next to the code).
- E2E flows exercised via Playwright MCP: place, select, delete, keyboard shortcuts, drag.
- Conventions in CLAUDE.md apply: every store action, hook, and utility gets tests before a feature is done.
