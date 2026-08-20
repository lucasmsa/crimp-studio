# PRD: Editor surface

## Thesis

The wall gets the screen. Controls come to whatever you selected, and leave when
you are done with it.

## Problem

Every control the editor has ever needed lives in one permanent stack down the
right side: panel angle, cut, merge, hold type, hold model, wall colour, hold
colour, clear, counts. Nothing is contextual, so the sidebar shows panel controls
while you are placing holds and hold controls while you are shaping panels. It is
already crowded at eleven controls, and the features still queued (problem
generation, difficulty readout, save and load, wall resizing, hold resizing,
blade-mode cuts) all want a home in the same column.

Two capability gaps make it worse. Wall colour is one value for the whole wall,
so a wall cannot have a dark panel and a light one, which is how gyms actually
paint. Hold colour is a raw colour picker offering sixteen million options for a
decision with about eight real answers.

## Model

**The canvas owns the screen.** Chrome is a header, a left tool rail, and
whatever popover the current selection calls for.

**Selection summons its own controls.** A popover anchors to the thing selected,
in the canvas, near it:

- **Panel**: angle presets and stepper, which seam the angle drives, cut across,
  cut up, colour, merge down.
- **Hold**: type, model variant, colour, rotate, delete.

The popover follows the thing while it animates, never covers it, and flips to
the other side when it would run off screen. Escape or a click on empty canvas
dismisses it, which is the same gesture that clears the selection today.

**The rail replaces the mode picker.** A vertical strip of tools on the left:
place holds, shape panels, and later generate. It collapses to icons and remembers
its state. The current "CLICKING SELECTS" box becomes the rail's two top entries.

**Counts move to a status strip** along the bottom of the canvas: hold count,
panel count, and the profile readout (height, reach, plywood) the wall-sections
PRD asked for.

## Colour

**Per panel, per hold.** `wallColor` moves from the wall onto each face, so a
panel can be painted on its own; `hold.color` already exists per hold. Painting
every panel or every hold at once is a later item, not this one.

**Curated swatches, not a colour wheel.** Panels get plywood and gym-paint tones;
holds get the set real setters buy, which is roughly the hold-type palette plus
black, white and a couple of extras. A custom picker behind a "custom" swatch is
a later item; see the decisions below.

Constraint: hold colour carries meaning in this editor, so a swatch set that
collides with the type legend is worse than no swatch set. The panel swatches stay
in materials, the hold swatches stay in the setter palette, and the two sets never
share a tone.

## Flow

1. Open the editor. Nothing is selected, the rail sits on the left, the canvas has
   the rest.
2. Click a hold. Its popover appears beside it with type, model and colour.
3. Click a panel. Its popover appears at the panel with angle, cuts and colour.
4. Click empty canvas. Everything closes; the wall is just a wall again.

## Scope

### In
- Contextual popovers for panel and hold, anchored in the canvas
- Left tool rail, collapsible, replacing the mode picker
- Status strip with counts and the profile readout
- Per-panel wall colour
- Curated swatch sets for panel and hold colour
- A readout of which seam the selected panel's angle drives

### Out
- Painting all panels or all holds at once
- A custom colour picker behind a "custom" swatch
- Generation controls (nothing to control yet)
- Save and load (still placeholders)
- Blade-mode cuts (backlogged, unchanged by this)
- Any change to the art direction, which ADR-005 settles

## Success criteria

- Placing ten holds and shaping three panels never requires reading a control that
  does not apply to what is selected.
- A panel can be painted a different colour from its neighbour, and the colour
  survives cutting that panel in two.
- Every popover control is reachable by keyboard, and the popover traps focus
  while open.
- The canvas keeps at least 80% of the viewport width at 1440px, against roughly
  62% today.
- Nothing regresses on frame time: the popover is DOM, not a second 3D pass.

## Risks

- A popover that follows an animating panel can chase it around the screen. It
  should anchor on the panel's settled position, not its per-frame one.
- Contextual UI hides discoverability: a first-time user sees an empty rail and a
  wall. The rail's tool names stay visible until collapsed by choice.
- Moving `wallColor` onto faces changes the wall shape in the store, so save and
  load will need a migration when they arrive. Cheap now, since nothing persists.

## Resolved questions

- **The popover lives in the canvas**, as drei `Html` without `transform`. That
  mode is already plain DOM projected to a screen point, so a roof panel rotating
  to face the ceiling leaves its controls upright. It costs no camera-to-DOM
  bridge and no second projection.
- **The set size follows the domain, not a number.** Holds get the nine setter
  colours both sources agree on; panels get six material tones. Eight per set was
  a guess at a tidy grid, and trimming a colour setters buy to reach it would make
  the set less useful, not more curated.

## Decisions taken while building

- **Popovers sit beside their subject, not above it.** The camera frames the whole
  wall, so a panel's top edge is at the top of the canvas and there is never room
  over it. `placePopover` puts the box to the right of the anchor, flips it left
  near the right edge, and rides it up or down so it stays inside the canvas.
- **"Bend on: across / up" is a readout, not a picker.** A face hinges on exactly
  one edge, so the seam its angle drives is never ambiguous and a picker would
  have one option. The popover names the seam instead.
- **The rail carries the armed tool's settings.** Hold type and model belong to
  the next placement rather than to anything on the wall, so they cannot live in a
  selection popover. They sit under the holds tool and disappear with it.
- **The custom colour escape hatch is deferred.** The curated sets cover the
  decision; a picker behind a "custom" swatch is a later item, tracked in the
  backlog next to painting every panel at once.
- **Placement is written to the DOM, not held in state.** Orbiting moves an
  anchor across the screen every frame, and a re-render per frame costs more than
  the wall does.

## Fixed on the way through

- The 3D canvas had been rendering 150px tall since the editor was built: R3F's
  wrapper asks for `height: 100%`, and the flex-grown box it sat in never gave a
  percentage anything to resolve against. The container's background matched the
  scene, so the wall just looked small. It now sits in an absolutely positioned
  box, which has a height.
- A click on a popover control also read as a click on empty canvas, because the
  popover's DOM events bubble to the element R3F watches for a missed pointer.
  Setting a colour closed the popover it came from. `useCanvasDeselect` now only
  clears the selection for clicks that land on the canvas itself.
- The status strip's chips were muted text straight on the scene blue, under 2:1.
  They carry a card fill now.
