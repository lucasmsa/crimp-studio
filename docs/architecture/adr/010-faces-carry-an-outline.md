# ADR-010: Faces carry an outline, not a width and a height

## Status
Accepted

## Context

ADR-006 decided the wall is a tree of flat polygon faces hinged along shared edges, and
said blade-mode cuts would be "a different input producing the same data". The
implementation never built the polygon. `WallFace` carries a `width` and a `height`, and a
child names its hinge as `'bottom'` or `'left'`. Splitting a rectangle along an axis
leaves two rectangles, so the stand-in has held for every cut the editor can currently
make.

A drawn seam ends that on the first use. A line between two points on a panel's border
leaves a triangle, a trapezoid or a pentagon, and none of them has a width and a height.
The rectangle is load-bearing well outside the face itself: `panelSolid` builds an oriented
box from the two numbers, `computeSurfaceArea` multiplies them, `computeWallProfile` reads
four corners, `clampHoldToFace` clamps a hold's centre between them, `computeFaceSheetOrigin`
walks parent sizes to phase the plywood texture, and the saved document stores them.

The named hinge is the second half of the problem. A seam drawn at 40 degrees is neither a
bottom edge nor a left one. `hingeRotation` picks a different rotation axis per name, and
`getFaceTilt`, `relativeFaceAngle` and `standsOnFloor` each read the result differently
again, so a third name would mean a third branch in four places.

## Decision

**A face is an outline.** `WallFace` carries an ordered vertex list in its own frame in
place of `width` and `height`. The root is the four corners of the sheet. Every piece a cut
produces is convex, which the collision test and the minimum size rule below both rely on.

**A child names an edge of its parent's outline.** `seamEdge` is an index, not a pair of
points. A split leaves the seam as an edge of both pieces, so the reference always resolves,
and the child's origin is re-derived from the parent's current shape on every read. Storing
the seam's endpoints would drift the moment a later cut resized the parent, which is why the
hinge was an edge reference rather than an offset in the first place. A cut renumbers the
edges it touches and remaps every surviving child's `seamEdge` in the same operation.

**Every face hinges on `v = 0`.** A face's frame puts its seam along the u axis with v
running into the face, so `hingeRotation` becomes one rotation about local +X for every face
and `hinge: 'bottom' | 'left'` is deleted. A horizontal seam tilts, a vertical seam yaws, and
a diagonal one does both, under one rule instead of three special cases.

**An angle is set as a bend and read as a steepness.** The stepper drives rotation about the
seam, which moves by the amount asked for on every seam. Beside it sits the steepness from
vertical, measured off the face normal, which is the number a gym talks in. On a horizontal
seam the two coincide, which is the current behaviour. On an 85 degree seam a degree of bend
moves steepness by 0.09 degrees, so a single number would make the control read as broken.

**Presets come from the seam's own angle.** Within 15 degrees of horizontal a face offers
slab, vertical, overhang and roof. Within 15 degrees of vertical it offers the arete presets.
A genuine diagonal offers bend steps and no names, on the same grounds a hold type is offered
only when every model of it fits: a name is offered only when it is true.

**A face is exempt from the floor test when its seam reaches the floor.** `standsOnFloor`
walked the chain for `hinge === 'bottom'`. It now asks whether the face's seam has an endpoint
on the floor plane. A vertical seam off the root reaches the ground, so that facet stands there
exactly as the root does; a seam two metres up does not, and the floor should stop it. A
diagonal seam rising from the floor is exempt, and correctly so. The alternative, treating a
seam within some degrees of vertical as the old `'left'`, would block a facet that genuinely
stands on the ground behind a threshold with nothing to justify it.

**Solids are convex prisms.** `obb.ts` generalises from an oriented box to an outline, a depth
and a transform, with separating-axis run over both face normals and the edge cross products.
An oriented box becomes the four-vertex case, so holds and panels keep one collision routine.
A bounding box around a triangular facet contains plywood that is not there, and
`findLegalFaceAngle` would then stop a bend against nothing visible, which is the failure
ADR-007's amendment exists to prevent. A broad phase gets added only if a bend measures
sluggish under that bisection, which is a measurement and not an assumption.

**Texture phase is per face.** `computeFaceSheetOrigin` feeds only the UV repeat and offset, so
the plywood grain is the whole of what it decides. Across a diagonal seam the frames are
rotated relative to each other and a continuous tile would have to shear, which a repeat and
offset cannot express. Each facet takes its phase from its own frame and the grain changes
direction at a diagonal seam, which is how a facet wall is skinned anyway.

**Too small is a width, not an extent.** `MIN_FACE_SIZE` keeps its 40cm and its meaning, read
as the smallest distance between two parallel lines enclosing the piece: the minimum over
edges of the greatest vertex distance from that edge. An area threshold would pass a 200 by
10 strip at 2000cm2, which is the trim the rule exists to reject.

**Holds clamp into the eroded outline.** `clampHoldToFace` shrinks the outline inward by the
hold's support in each edge's inward normal, `halfW * |n.x| + halfH * |n.y|`, and clamps the
centre to the closest point in what remains. Clamping to the outline's bounding box would let
a hold sit beside a diagonal edge bolted to nothing, which is the failure the current clamp
was written to prevent. A hold too large for the remaining region is centred rather than given
an inverted clamp range, as it is today.

**The document version bumps and old walls migrate on load.** A rect face becomes its four
corners, `hinge: 'bottom'` becomes the parent's top edge index and `'left'` its right edge
index. Every existing save opens identically. The document keeps carrying choices rather than
measurements: an outline and a `seamEdge` are both chosen, and collision boxes are still
measured from the GLB on load.

## Consequences

- ADR-006's tree stands. What is replaced is the rectangular representation its
  implementation used, which ADR-006 itself described as a polygon.
- Three named-hinge branches collapse into one rotation, and `standsOnFloor` stops being a
  pure tree walk: it needs the transforms, which `findWallOverlaps` already computes.
- Collision becomes exact for non-rectangular facets and more expensive per test, under a
  bisection that already runs dozens of tests per bend. Bend responsiveness is the thing to
  watch when this lands.
- `computeSurfaceArea` becomes a shoelace sum, and `wallSilhouette` and `computeWallProfile`
  walk outline vertices instead of four corners. A trim reduces the plywood readout, which is
  the first time that number has moved for a reason other than the sheet size.
- A face still hinges on exactly one edge, so three or more facets meeting at a point cannot
  be expressed. That is the known limit of the tree and it is why a seam crossing a face's own
  `v = 0` edge is refused rather than split into siblings.
- Faces stay flat, as in ADR-006. Dished and bulging panels are still out.
