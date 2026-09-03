# Wall editor

Current behavior of the 3D wall editor (`apps/web/src/pages/editor/`). Ported from the
retired OpenSpec specs (see ADR-004) and updated to match the code. When behavior
changes, update this doc in the same PR.

## Wall surface

- The wall is a tree of hinged flat panels (ADR-006), 400cm x 500cm of plywood to start.
  One root face means a flat wall; cutting adds faces hinged on the seam. Bending
  preserves plywood, not height, and the root face's bottom edge is pinned to the floor.
- Each face is a convex outline in its own frame, with its seam along the u axis, and a
  child names the parent edge it hinges on (ADR-010). Every face bends about its own seam
  with one rotation; a level seam tilts, an upright one yaws. Panels are extruded from
  the outline, collision runs on convex prisms, and a hold is clamped into the outline
  shrunk by its own footprint, so a hold beside a slanted edge stays on plywood. Saved
  walls from before this (document version 1) migrate on load.
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
- All six types render GLB models from the BHToolset packs (see `tools/holds/`), preloaded
  at editor mount, listed in `config/holdModelConfig.generated.ts`: crimp 6, volume 6, and
  four each for jug, pinch, pocket and sloper. A hold with no model recorded falls back to
  the procedural geometry in `utils/holdGeometry.ts`. Per-type `sizeMultiplier` and
  z-offset live in `config/holdGeometryConfig.ts`.
- Render style is switchable via `SCENE_STYLE` in `config/sceneStyleConfig.ts`:
  'toon' (default; cel bands + inverted-hull ink outlines) or 'standard' (PBR rig).
  The wall carries a procedural T-nut grid + plywood seam texture in both styles.
- Material: `MeshStandardMaterial`, roughness 0.9, metalness 0.1, flat shading.
- Each type has a default colour in `colors.ts`, and every one of them is a value from
  `HOLD_SWATCHES`, so an unpainted hold always lights up a swatch in the card and the
  rail's legend dot matches the wall. A per-hold `color` overrides it, which is set only
  when a swatch is actually picked: an unpainted hold follows its type, so retyping a jug
  to a crimp turns it red, and a painted one keeps its paint (ADR-008).
- The rail's type and model rows are both the brush and the selection's inspector
  (ADR-008). With nothing selected they arm the next placement. Selecting a hold
  highlights its actual type and model, and clicking a different one changes that hold
  and arms it for the next placement from the same click. Selecting also arms what the
  hold is, so letting go of it leaves the rail where the hold left it.
- A type or model the wall has no room for is greyed out rather than refused after the
  click, with a not-allowed cursor and a tooltip saying why. A type is tested against the
  box that contains every model of it (`measureWorstCaseFootprint`), so whichever model
  it lands on will fit.
- `RANDOM` sits last in the model row, on its own full-width line. With nothing selected
  it arms random placement, which spreads models by hold id. With a hold selected it is a
  verb: each click rolls that hold onto a different model of its type that fits where it
  sits, never the one it already wears, and never highlights, since the row shows the
  model the hold actually is. Rolling arms random for the next placement.
- Each type remembers its own model for the session (`variantByType` in the store), so
  switching type and back restores the pick. Not persisted across reloads.

## Editor chrome

- The canvas owns the screen. Chrome is the header, a tool rail down the left, a status
  strip along the bottom, and whichever popover the selection calls for (PRD
  `docs/prd/editor-surface.md`).
- Tool rail: place holds, shape panels, blade, or trim, which is what a click on the wall
  aims at. It collapses to icons and remembers that across sessions. The armed tool's own
  settings sit under it, so hold type and model appear with the holds tool, where they
  double as the selected hold's controls.
- Blade and trim (ADR-011): press a panel and drag. The seam runs through the press point
  and the cursor out to the panel's border both ways, drawn on the plywood with a degree
  chip at the cursor end, in ink where it can be cut and red where it cannot. Release
  commits; a tap with no drag selects the panel; Escape cancels. Two refusals: the seam
  passes through a hold, or through an edge a child panel hinges on. Blade hinges the far
  piece on the seam; it opens a few degrees and settles flush while its seam flashes, and
  is selected. Trim throws the far piece away with its holds and every panel hinged on it,
  all hatched and tinted red during the drag; the offcut falls away on release and undo
  brings everything back.
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
  stepper, panel colour, merge down. Cutting is a drag on the wall with blade or trim
  armed, not a button here. A preset the wall cannot reach is disabled, and the stepper
  stops where the plywood does (ADR-007). The card reads two
  numbers: the bend about the seam, which the stepper sets, and the steepness from
  vertical, measured off the face normal. On a level seam the presets are steepnesses
  (slab, vertical, overhang, roof); on an upright one they are bends (corner in, flush,
  prow, side wall); a slanted seam offers none. Merge down is disabled, with the reason,
  when the piece no longer spans the whole edge it hinges on: the union would be an L.
- Click hold: select (single selection). Selected hold gets emissive glow, slight scale-up,
  and the card shows its colour, rotate and delete. A hold that stopped a bend flashes red
  for a moment.
- Click empty canvas or press Escape: the card and its cord go. Clicks on the card do not
  count as clicking empty canvas.
- Drag: the hold follows the pointer, onto whichever panel is under it, so dragging across
  a seam hands it to the neighbour and it re-poses with that panel's angle. Past the edge
  of the wall it clamps to the panel it is over. A drag is a preview and only the release
  commits it: while the hold is somewhere it cannot be let go, it and whatever it sits on
  both go red, and letting go there springs it back where it was picked up (ADR-007,
  amended). Orbit controls are disabled during a drag and re-enabled on release.
- Keyboard: R rotates by the configured step, Delete/Backspace removes, Escape deselects,
  WASD/arrows nudge 5cm (20cm with Shift), clamped to bounds. Enter is left alone because
  it activates whatever control the popover has focused.
- Placement animates scale 0 to 1 with a spring; hover scales up with a spring and shows pointer cursor. Hover scale is suppressed while any hold is being dragged.
- Camera: orbit constrained to polar 30 to 120 degrees, azimuth +-45 degrees, zoom 2m to 15m.
- Two things move the camera, and they own different halves of the shot. The framing
  (`useEditorCamera`) sets the orbit target and how far back the camera sits, refitting
  when the profile changes shape. The swing (`useSelectionSwing`) sets which direction it
  sits in: selecting a panel more than 35 degrees off square turns the camera toward it,
  as far as it takes and no further, stopping at the orbit limits for a roof or an arete.
  A pointer down on the canvas cancels the swing for good, and deselecting hands back the
  direction the camera had before it. It fires on selection, not on bending.

## Hold collision

- Panels, holds and the floor are oriented boxes in one world space, tested by separating
  axis in `packages/wall-geometry` (ADR-007). Two holds keep 1cm apart; anything involving
  plywood is tested for penetration alone.
- Each hold stores a `collisionBox` (half-extents plus depth, in cm) measured from its
  actual geometry: synchronously at placement via `measureHoldFootprint`, then refined by
  `Hold3D` from the mounted mesh. Fallback box is 15x15x10cm until measured.
- Placement into an occupied space is rejected silently, and so is a rotation whose turned
  box no longer fits.
- A keyboard nudge that does not fit resolves one axis at a time, bisecting each to
  contact, and takes whichever order lands nearer the target. Crossing a seam stays
  all-or-nothing, since `u` and `v` mean different plywood on each panel. Drags no longer
  use this: they show rather than refuse.
- Changing a hold's type or model re-measures its box and pulls it back onto its face if
  the new box would hang off an edge (`utils/holdRefit.ts`), then refuses the change
  outright if it would land on a neighbour.
- Nothing illegal reaches the store, so the renderer, save files and the route generator
  read a wall that can be built.

## Saving and loading

- Walls live in this browser's `localStorage`, one key per wall plus one for the wall being
  worked on (`lib/walls/browserWallStorage.ts`). The `WallStorage` interface in front of it
  is async so a server can go behind it without the callers changing (ADR-009).
- The wall being edited is written 400ms after it stops changing and restored on the next
  visit, so a reload costs nothing. Nothing is written until that read comes back, or the
  empty wall the editor starts with would land on top of the saved one.
- SAVE WALL and LOAD WALL open the same card: a Radix dialog restyled to the poster
  chrome. SAVE writes into an existing slot or a new named one, LOAD opens one, and both
  list every wall with its name, when it was saved, its panel and hold counts, a delete
  behind a confirm, and a drawing of the wall.
- The drawing is the wall itself, three quarters on, generated from the face tree when the
  row renders (`WallLibrary/utils/wallSilhouette.ts`): every panel as its outline, far ones
  first, with holds as dots in the colours they are painted, over the same room grey the
  scene uses. Nothing is captured or stored. Straight from the side was tried first and
  cut: a flat wall, which is most of them, came out as a line.
- A save carries a version and what was chosen. Collision boxes are not saved: they are
  measured from the model, so they are measured again on load and a rescaled model does
  not leave a wall carrying stale geometry.
- A save that does not parse or does not have the shape of a wall is refused with the
  reason, and the wall on screen is untouched. A broken entry is skipped in the list and
  left in storage rather than swept up.
- A saved wall whose holds overlap loads as it was saved, and the offenders flash red
  through the same `blockingHoldIds` a blocked bend uses. Refusing would strand a wall
  built under older rules; dropping the holds would delete work silently.
- Replacing the wall on screen (loading another, or New Wall) warns first when it has
  changes the library does not have, and offers to save it first.

## Test coverage

- Store actions, geometry factories, hold action utils, popover anchoring and placement,
  and the status readout formatting have unit tests (`__tests__/` folders next to the
  code). The face tree, its transforms and every legality query are tested in
  `packages/wall-geometry`.
- E2E flows exercised via Playwright MCP: place, select, delete, keyboard shortcuts, drag.
- Conventions in CLAUDE.md apply: every store action, hook, and utility gets tests before a feature is done.
