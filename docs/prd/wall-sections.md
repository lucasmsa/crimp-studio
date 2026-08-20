# PRD: Wall sections

## Thesis

Bend the wall the way a real gym is built: slab into vertical into overhang into
roof, with an arete or corner across the width, and holds staying where they were
bolted through every change.

## Problem

The editor models one flat 400x500cm panel. Angle is a field on the wall and it is
fixed at 0. Every problem designed in it therefore climbs the same way, which rules
out the thing that most changes how a boulder feels. A setter or a home-wall builder
sizing up a real space cannot represent that space at all today.

This is also a dependency for problem generation (ADR-002): angle per hold is a
first-order difficulty input, and a generator that only ever sees a vertical plane
cannot grade or shape anything realistically.

## Model

The wall is a tree of flat faces. Each face is a polygon; each non-root face hinges
on its parent along one shared edge and carries an angle. Because a hinge shares an
edge rather than reconstructing one, the surface cannot crack open.

- **Cutting** splits one face into two along a line, the new face keeping the parent
  as its hinge. v1 draws that line across or up only. Diagonal cuts are the same
  operation with a different input and are backlogged.
- **Bending preserves the plywood.** The wall is 400x500cm of surface and stays that
  size; adding a 30 degree overhang to the top 200cm leaves the surface unchanged,
  lowers the top of the wall to 473cm, and pushes it 100cm out from the base.
- **The floor edge is pinned.** The bottom edge of the root face never moves, so the
  base of the wall is a stable reference while angles are tuned.
- **Angles** read as tilt from vertical: negative leans back (slab), positive leans
  out (overhang), 90 is a roof. Presets cover -15, 0, 30, 90; free input is clamped
  to -45..135, and any angle that folds a face into its parent is rejected.

Holds become face-local: `{ faceId, u, v }` where u and v are cm along the face.
Existing holds need no migration, since a flat wall is one root face and u,v are
today's x,y.

**Invariant: a hold's footprint lies entirely within one face.** Real holds do not
span a bend, and the invariant keeps every downstream calculation on one plane.

## Flow

1. Click a face on the wall. The sidebar shows its angle, with presets, a stepper,
   cut buttons, and remove.
2. Cut across or up. The split lands where the click landed; the resulting seam stays
   draggable afterwards.
3. Set the angle. The face and everything hinged above it swing into place; holds
   re-pose with their face.
4. Keep setting holds. Placement, dragging, rotation and deletion work per face as
   they do today.

## Behavior

- **Cutting through a hold is blocked**, and the holds in the way are highlighted.
  Same rule for dragging a seam across a hold.
- **Dragging a hold across a seam re-parents it live**: it hops to the face under the
  cursor on crossing the seam line rather than on proximity, its tilt springs to that
  face's angle, and it stays clear of the seam throughout the drag rather than only on
  drop, since every frame is validated (ADR-007).
- **Shrinking the surface past a hold clamps the hold** onto what remains, animated,
  the same way edge clamping already works. Nothing is removed silently.
- **Nothing may overlap, ever** (ADR-007). Panels and holds are oriented boxes in one
  world space, kept 1cm apart rather than merely non-overlapping. The floor is a solid
  too, which retires the root panel's arbitrary 60 degree cap. Hinged pairs are exempt,
  since they share their seam by construction.
- **A bend stops at contact.** Setting an angle bisects to within half a degree of the
  real limit and commits that, so a panel stops where the plywood meets whatever is in
  the way. A preset that would clip is disabled rather than doing something else, and
  the stepper stops moving at the limit.
- **Holds count in the clamp, and say so.** A hold near a seam stops a bend earlier than
  bare plywood would, so the hold that stopped it flashes. This is the same idiom as a
  refused cut pointing at the holds in the way.
- **The invariant is enforced at the store boundary**, not per consumer: angle, place,
  each frame of a drag, cut and merge all ask first, so no invalid wall reaches the
  renderer, a save file or the generator.
- **The geometry lives in `packages/wall-geometry`**, with no React and no store import,
  because scan and route generation query the same solids.
- **Camera eases toward a selected face's normal** only when the face is more than
  ~35 degrees oblique. It keeps the current side-of-the-wall bias, never interrupts
  an orbit in progress, and eases back to the whole profile on deselect.
- **Transitions are sprung**, not snapped: angle changes, hold re-poses, clamps, and
  camera moves.

## Scope

### In
- Face tree with hinge-per-face and axis-aligned cuts, up to 4 sections on the profile
- Face selection in 3D plus angle editing (presets, stepper, cut, merge), now in the
  panel popover rather than a sidebar (`docs/prd/editor-surface.md`)
- Face-local hold coordinates, live re-parenting on drag, clamping on shrink
- World-space oriented-box collision for panels, holds and the floor, in its own package
- Bends that stop at contact, and the hold that stopped one flashing
- Focus and refit camera behavior, sprung transitions

### Out
- Reachability and generation queries over the solids: shapes and legality land, the
  questions route generation will ask do not
- Scan angle fitting, which consumes this geometry later
- Blade-mode diagonal cuts (backlogged; the data model already supports them, and they
  need a convex hull alongside the box)
- Per-vertex bulges and dishes: faces stay flat planes
- Saving and loading walls: Save and Load remain placeholders
- Route generation on bent walls (ADR-002, phase 2)

## Success criteria

- A slab/vertical/overhang/roof profile plus one arete can be built in under a minute
  of clicking, and the surface shows no gap at any seam from any camera angle.
- Holds set before a bend keep their spot on the plywood after it: same face, same
  u,v, re-posed and re-tilted.
- No hold ever straddles a seam, in any sequence of cutting, dragging, angling and
  shrinking.
- No two solids overlap in any sequence of those operations: not two panels, not two
  holds across a seam, not a hold and a panel it is not bolted to, not a panel and the
  floor. This is a property test, not an example test.
- A panel bent toward another panel stops within half a degree of contact, and the
  readout shows the angle it actually stopped at.
- A bend stopped by a hold flashes that hold.
- A roof face can be selected and set on without manual orbiting.

## Risks

- Hinge math compounding: a face's world transform is its parent chain applied in
  order, so an error at the root shows up everywhere above it. Mitigation: the
  transform is a pure function of the tree, unit tested against known profiles.
- The 3D collision test replaces a 2D box test that the store, drag preview, and
  planned generator all depend on. Mitigation: swap behind the existing
  `hasCollision` signature so callers do not change.
- Re-parenting during a drag is the fiddliest interaction here, and it fires every
  frame while the pointer sits near a seam. Mitigation: re-parent on crossing the
  seam line, not on proximity.
- Per-frame validation during a drag sets a budget. Roughly 10 panels and 30 holds is a
  few hundred axis tests per frame, which is fine; a 200-hold wall needs broad-phase
  culling first. Mitigation: measure at that size before promising it.
- A bend stopping for a reason off screen (a panel behind, a hold on the far side) reads
  as the control being broken. Mitigation: the flashing hold covers one case, and the
  popover may have to name the others.

## Open questions

- Does a cut span the full face width, or can it stop partway and leave an L-shaped
  face? v1 assumes full width, which keeps every face convex.
- Does the wall get a maximum reach out from the base, so a profile cannot be built
  that no room could contain?
