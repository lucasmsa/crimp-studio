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

Every angle limit in the editor is a number picked by eye standing in for geometry that
was never computed: a panel stops where the control says, not where the plywood does.

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

**Tolerance, per pair.** Two holds must stay 1cm apart: a hand needs room, and the
measured boxes are coarse enough that touching boxes can mean touching plastic. Anything
involving plywood is tested for penetration alone, with a millimetre of slack. Building
this showed why: the panels are one folded sheet, so a panel meets the panel across a
seam from it and a hold is bolted flush against a surface. Demanding air there made a
plain flat wall illegal, and exact face contact is indistinguishable from penetration to
a separating-axis test.

**The floor is a solid**, and it stops the panels that do not already stand on it. A
panel above a horizontal seam swings until it reaches the ground. The root panel and
anything hinged sideways off it (an arete) rest on the floor by construction, so the
floor cannot be what stops those.

`ROOT_ANGLE_MAX` stays at 60 for the root panel. The floor cannot state that limit,
because the root is hinged to it: at 90 the whole wall lies down as a ceiling at floor
height, which is a product decision about what counts as a wall rather than a geometric
one.

**Hinged pairs are exempt.** A parent and child share their hinge edge by construction,
so testing them would report contact at every angle. The existing relative angle limits
(-45 to 135) keep that exemption cheap: a hinged pair folded to 135 degrees overlaps only
in a thin wedge at the seam, which is what a real folded sheet does before the edge is
bevelled.

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
  before it is. A blocked frame costs about fifty of those tests rather than one, which
  is why the transforms and the other solids are built once per move instead of per test.
- Holds and panels can no longer be reasoned about separately. A tool that moves either
  one has to ask the same question, which is the point.
- A panel folded hard onto the panel it hinges from still overlaps it slightly at the
  seam, because that pair is exempt. Catching that needs the exemption to apply near the
  shared edge only, which is more geometry than the wedge is worth today.
- The 2D face-local collision test is gone. `holdCollision.ts` and its tests are deleted
  rather than kept alongside: two answers to the same question is how they drift.

## Amendment, 2026-08-21: a blocked drag slides

Refusing a frame outright was the wrong half of the invariant. Nothing clipped, but a
hold dragged against its neighbour stopped dead and stayed there for the rest of the
gesture: every later frame asked for a spot inside the neighbour and was refused too, so
the hold sat still while the pointer walked away from it. The wall was correct and the
drag felt broken.

A move now resolves one axis at a time. Each axis bisects between where the hold is and
where it is asked to go, which brings it to within a couple of millimetres of contact
instead of leaving it at whatever the last frame happened to fit at. Both orders are
tried, because they answer different questions: across-then-up keeps the sideways travel
and gives up the climb, up-then-across does the opposite. Whichever lands nearer the
pointer wins, so a hold pushed up under a neighbour stops under it rather than stepping
aside, and a hold dragged past one travels around it.

Crossing a seam stays all-or-nothing. `u` and `v` measure different plywood on each
panel, so there is no axis to slide along between two of them: the hold either lands on
the panel under the pointer or stays where it is.

The 1cm gap between two holds is unchanged, and it is now the only thing visible at the
stop: the hold comes to rest a centimetre short of touching. That is the tolerance doing
what it was written for, not the drag failing, and it is a number to judge on a real wall
rather than a bug to fix.
