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
- The selection's controls sit in a card parked in the canvas's top right corner, with a
  cord hanging from it to whatever is selected. A card that follows its subject ends up
  over the wall it is editing; the cord keeps them connected instead. It is a verlet rope
  simulated in the DOM (`SelectionPanel/utils/rope.ts`), pinned at the card and at the
  subject's projected point, so it sags, lags and swings as the wall moves or the camera
  turns. Focus moves into an open card and Tab cycles within it.

## Interactions

- Click wall (holds tool): place hold of selected type at click position. Positions stored
  in cm from the panel's bottom-left corner.
- Click wall (panels tool): select the panel and fill the card: angle presets, a degree
  stepper, cut across, cut up, panel colour, merge down. A preset the wall cannot reach is
  disabled, and the stepper stops where the plywood does (ADR-007).
- Click hold: select (single selection). Selected hold gets emissive glow, slight scale-up,
  and the card shows its colour, rotate and delete. A hold that stopped a bend flashes red
  for a moment.
- Click empty canvas or press Escape: the card and its cord go. Clicks on the card do not
  count as clicking empty canvas.
- Drag: the hold goes to whichever panel is under the pointer, so dragging across a seam
  hands it to the neighbour and it re-poses with that panel's angle. Past the edge of the
  wall it keeps sliding on the plane of the panel it is on, clamped to that panel. Every
  frame is validated: a spot the hold does not fit in takes it as far toward the pointer
  as it goes and slides it along whatever stopped it (ADR-007). Orbit controls are
  disabled during a drag and re-enabled on release.
- Keyboard: R rotates by the configured step, Delete/Backspace removes, Escape deselects,
  WASD/arrows nudge 5cm (20cm with Shift), clamped to bounds. Enter is left alone because
  it activates whatever control the popover has focused.
- Placement animates scale 0 to 1 with a spring; hover scales up with a spring and shows pointer cursor. Hover scale is suppressed while any hold is being dragged.
- Camera: orbit constrained to polar 30 to 120 degrees, azimuth +-45 degrees, zoom 2m to 15m.

## Hold collision

- Panels, holds and the floor are oriented boxes in one world space, tested by separating
  axis in `packages/wall-geometry` (ADR-007). Two holds keep 1cm apart; anything involving
  plywood is tested for penetration alone.
- Each hold stores a `collisionBox` (half-extents plus depth, in cm) measured from its
  actual geometry: synchronously at placement via `measureHoldFootprint`, then refined by
  `Hold3D` from the mounted mesh. Fallback box is 15x15x10cm until measured.
- Placement into an occupied space is rejected silently, and so is a rotation whose turned
  box no longer fits.
- A drag or a nudge that does not fit resolves one axis at a time, bisecting each to
  contact, and takes whichever order lands nearer the pointer. Crossing a seam stays
  all-or-nothing, since `u` and `v` mean different plywood on each panel.
- Nothing illegal reaches the store, so the renderer, save files and the route generator
  read a wall that can be built.

## Test coverage

- Store actions, geometry factories, hold action utils, popover anchoring and placement,
  and the status readout formatting have unit tests (`__tests__/` folders next to the
  code). The face tree, its transforms and every legality query are tested in
  `packages/wall-geometry`.
- E2E flows exercised via Playwright MCP: place, select, delete, keyboard shortcuts, drag.
- Conventions in CLAUDE.md apply: every store action, hook, and utility gets tests before a feature is done.
