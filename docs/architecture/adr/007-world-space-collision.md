# ADR-007: World-space solids as the wall's foundation

## Status
Accepted

## Context

The face tree (ADR-006) made the wall watertight and holds face-local, and it left the
consequence written down: collision has to become a 3D test. Using the editor showed
what that costs to skip. A panel folded far enough passes clean through a panel it is
not hinged to. A hold bolted near a seam pokes out of the neighbouring panel. Two holds
on different panels can overlap in world space while their face-local boxes, which only
compare `u` and `v` on a shared face, report nothing.

The root panel's 60 degree cap is the same problem wearing a workaround: the real limit
is the floor, and a number picked by eye stands in for it.

This is not only an editor polish item. Scan reads a wall's angles off a photograph and
has to reject a fit no gym could build. Route generation asks whether a hand can reach
from one hold to the next, which is a question about world positions and what is in the
way. Difficulty scoring reads the angle a hold sits at. All three need the same
geometry, and each deriving its own would drift.

## Decision

Panels and holds become solids in one shared world space, and nothing may overlap.

**Shape.** An oriented bounding box for both. A panel is a rectangular slab, so a box is
exact rather than an approximation, and the separating-axis test between two boxes is
closed form. A hold's box extends its measured face-plane footprint with the model's own
depth. A tapered volume reserves more air than it occupies; a convex hull per GLB is the
upgrade path if that ever bites.

**Tolerance.** Solids must stay 1cm apart rather than merely not overlap. Exact contact
z-fights along the touching face and puts float error in charge of which side wins, and
real plywood has a gap too.

**The floor is a solid.** A panel swings until it reaches the ground and stops there.
`ROOT_ANGLE_MAX` goes: the floor states the same limit honestly, and it applies to every
panel rather than only the root.

**Hinged pairs are exempt.** A parent and child share their hinge edge by construction,
so testing them would report contact at every angle. The existing relative angle limits
(-45 to 135) stop a hinged pair folding through each other.

**Contact by bisection.** Setting an angle rebuilds the tree at a candidate angle and
tests every non-hinged pair. When the requested angle is illegal, bisecting between the
last legal angle and the requested one lands within half a degree in eight rounds. The
same path serves the presets and the stepper, so a preset that would clip is disabled
rather than silently doing something else.

**Holds count in the clamp.** A hold near a seam stops a bend earlier than bare plywood
would. That is the price of the invariant, and it is invisible without feedback, so the
hold that stopped the bend flashes. This reuses the refusal idiom the cut buttons
already have, where a blocked cut points at the holds in the way.

**Enforced at the store boundary.** Every committed change asks the layer first: setting
an angle, placing a hold, each frame of a drag, cutting, merging. Invalid state never
reaches the store, so the renderer, save files and generation can trust what they read
instead of each re-validating it.

**It lives in `packages/wall-geometry`**, with no React and no store import. The editor,
route-gen and a future scan fitter depend on it. Keeping it out of the app is what stops
it quietly growing a UI dependency and becoming un-shareable.

Rejected: convex hulls from the start (real cost today for blade-mode cuts that are
backlogged), triangle meshes (needs a BVH to stay at 60fps, exact about geometry we
cannot build), validating on drop rather than per frame (the wall renders an illegal pose
while you drag, and generation would have to defend against states the editor allows),
and letting bends win with buried holds flagged in red (a wall that cannot be built is
still a wall you can save).

## Consequences

- The wall becomes the project's first real physical model rather than a picture of one.
  Scan and generation query it instead of re-deriving geometry, which is why it is a
  package and not a folder in the editor.
- A bend can stop somewhere odd, and the honest reasons (a hold, the floor, a panel
  behind it) are not all visible from the front. The flashing hold covers one of them;
  the others may need saying out loud in the popover.
- Angles stop being round numbers. A clamp lands on 73.5 degrees, not 75.
- Every hold gains a depth, which means the placement path measures three extents rather
  than two, and the fallback box for an unmeasured hold needs one too.
- Per-frame testing during a drag sets a budget: roughly 10 panels and 30 holds is a few
  hundred axis tests per frame, fine, and a 200-hold wall will need broad-phase culling
  before it is.
- Holds and panels can no longer be reasoned about separately. A tool that moves either
  one has to ask the same question, which is the point.
