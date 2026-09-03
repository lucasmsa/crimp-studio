# ADR-006: Wall geometry as a tree of hinged faces

## Status
Accepted

## Context

The wall is a single flat panel with a fixed angle of 0. Giving it a real gym profile
(slab, vertical, overhang, roof) and a corner across the width needs a geometry model,
and the obvious ones break in different ways.

Independent angled panels crack apart: nothing forces neighbours to share an edge. A
grid of cells with a free pair of angles each has the same failure at every interior
vertex, where four cells disagree about where the shared corner sits. A product of two
chained profiles (one up the wall, one across) is watertight, but only expresses what
those two axes can express, and diagonal seams are permanently out of reach.

Blade-mode cutting, where the seam is drawn anywhere rather than picked from an axis,
is the interaction worth building toward. Folding a flat panel along one drawn line is
always watertight; the failure only appears when two non-parallel seams cross.

## Decision

The wall is a tree of flat faces. Each face is a polygon. Each non-root face hinges on
its parent along one shared edge and carries an angle relative to it. A cut splits one
face into two, so faces never cross and every seam is a hinge shared by exactly two
faces.

- The surface is watertight by construction, since a hinge shares its edge rather than
  reconstructing one.
- A face's world transform is its parent chain applied in order, with the root face's
  bottom edge pinned to the floor.
- Bending preserves surface area. The wall stays 400x500cm of plywood, and its height
  and reach fall out of the angles.
- Holds are face-local `{ faceId, u, v }`. A hold's footprint lies entirely within one
  face, always.
- v1 exposes axis-aligned cuts and angle presets. Blade-mode cuts are a different
  input producing the same data.

Rejected: independent panels (cracks), free-angle grids (cracks at interior vertices),
the two-profile product (watertight but closes the door on diagonals), and per-vertex
height fields (expressive, but replaces "set the overhang to 30 degrees" with dragging
points, and states no gym could be built).

## Consequences

- Diagonal cuts cost UI work only. No migration when they land, which is the point of
  paying for the tree now instead of the profile product.
- Hold coordinates move from wall-space to face-space. Existing holds carry over
  unchanged because a flat wall is one root face, but every consumer of hold positions
  now goes through the face transform.
- Collision has to become a 3D oriented-box test: holds on different faces can overlap
  in world space while their 2D boxes say nothing. The store's placement check, the
  drag preview, and the planned generator's fitness all read the new test.
- Dragging a hold across a seam becomes a re-parenting operation rather than a
  coordinate update.
- Angle per face gives the difficulty model and the generator (ADR-002) the input they
  need most, and it is available per hold through the hold's face.
- Faces stay flat. Dished or bulging panels need a different model, and are out.

## Amendment, 2026-09-01: the polygon arrives

The decision above stands. What it did not specify was how a face stores its shape, and the
implementation used a `width` and a `height` with the hinge named `'bottom'` or `'left'`.
Splitting a rectangle along an axis leaves rectangles, so that held until seams could be
drawn. ADR-010 replaces it with an outline and a `seamEdge`, which is the polygon this
record assumed. ADR-011 records the gesture that draws one.
