# Wall editor

Current behavior of the 3D wall editor (`apps/web/src/pages/editor/`). Ported from the
retired OpenSpec specs (see ADR-004) and updated to match the code. When behavior
changes, update this doc in the same PR.

## Wall surface

- The wall is a tree of hinged flat panels (ADR-006), 400cm x 500cm of plywood to start.
  One root face means a flat wall; cutting adds faces hinged on the seam. Bending
  preserves plywood, not height, and the root face's bottom edge is pinned to the floor.
- Each face carries its own `color`, so neighbouring panels can be painted differently.
  A cut gives both halves the paint the panel had. Defaults come from `colors.ts`.
- Store model: one `Wall` with `id`, `name`, `width`, `height`, `faces`, `holds[]`.
  Holds are face-local (`faceId`, `u`, `v`).
- Wall resizing is a backlog item. Panel angles are per-face and animate as springs on
  the angles, rebuilding the tree each frame so no seam cracks mid-animation.
- Directional key light with shadows; panels cast, holds receive. Post-processing:
  composer multisampling plus SMAA, subtle vignette.

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
- The tool rail exposes the six types and the model variants for the next placement.
  A placed hold's type, model and colour are changed from its own popover, which
  re-measures the footprint and refuses a change that would land on a neighbour.

## Editor chrome

- The canvas owns the screen. Chrome is the header, a tool rail down the left, a status
  strip along the bottom, and whichever popover the selection calls for (PRD
  `docs/prd/editor-surface.md`).
- Tool rail: place holds or shape panels, which is what a click on the wall aims at.
  It collapses to icons and remembers that across sessions. The armed tool's own
  settings sit under it, so hold type and model appear with the holds tool.
- Status strip: hold count, panel count, and the profile readout (height, reach, plywood).
  The readout comes from the settled tree, not the animating one.
- Selection popovers are drei `Html` without `transform`, so they stay upright whatever
  the panel is doing. They anchor on the settled face transform rather than the animated
  one, sit beside their subject, flip sides near the canvas edge, and ride up or down to
  stay on screen. Focus moves into an open popover and Tab cycles within it.

## Interactions

- Click wall (holds tool): place hold of selected type at click position. Positions stored
  in cm from the panel's bottom-left corner.
- Click wall (panels tool): select the panel and open its popover: angle presets, a degree
  stepper, cut across, cut up, panel colour, merge down.
- Click hold: select (single selection). Selected hold gets emissive glow, slight scale-up,
  and its popover.
- Click empty canvas or press Escape: everything closes. Clicks on a popover do not count
  as clicking empty canvas.
- Drag: hold follows pointer via raycast against an invisible wall-aligned plane, clamped to wall bounds. Orbit controls disabled during drag, re-enabled on release.
- Keyboard: R rotates by the configured step, Delete/Backspace removes, Escape deselects,
  WASD/arrows nudge 5cm (20cm with Shift), clamped to bounds. Enter is left alone because
  it activates whatever control the popover has focused.
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

- Store actions, collision utils, geometry factories, hold action utils, the face tree
  (transforms, cuts, profile, UVs), popover anchoring and placement, and the status
  readout formatting have unit tests (`__tests__/` folders next to the code).
- E2E flows exercised via Playwright MCP: place, select, delete, keyboard shortcuts, drag.
- Conventions in CLAUDE.md apply: every store action, hook, and utility gets tests before a feature is done.
