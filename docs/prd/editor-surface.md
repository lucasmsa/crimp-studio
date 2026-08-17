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
black, white and a couple of extras. A custom picker stays available behind a
"custom" swatch, so nothing is taken away.

Constraint: hold colour carries meaning in this editor, so a swatch set that
collides with the type legend is worse than no swatch set. The panel swatches stay
in materials, the hold swatches stay in the setter palette, and the two sets never
share a tone.

## Flow

1. Open the editor. The wall is focused, the rail sits on the left, the canvas has
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
- Curated swatch sets for panel and hold colour, with a custom escape hatch
- "Bend on: across / up" when a panel touches more than one seam

### Out
- Painting all panels or all holds at once
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

## Open questions

- Does the popover live in the canvas (drei `Html`, moves with the wall) or float
  over it in DOM anchored to a projected point? The overlay already uses `Html`,
  but a popover that rotates with a roof panel is unusable.
- How many swatches before a set stops being curated? Eight per set is the
  starting guess.
