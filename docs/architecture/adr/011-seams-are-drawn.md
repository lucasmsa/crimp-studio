# ADR-011: Seams are drawn, not picked from an axis

## Status
Accepted

## Context

A face is cut by pressing ACROSS or UP. Where the seam lands comes from `faceCutPoint`,
wherever the pointer last touched the panel, and if a hold sits on that line
`findCutPosition` walks outward in 5cm steps until it finds a clear one. Its own docstring
gives the reason: aiming and placing are the same click, so the aimed spot is often exactly
where a hold just landed.

The result is a cut that gives no indication of where it will be made. The line is never
drawn, the two buttons name a direction rather than a position, and the seam that commits is
frequently not the one the pointer implied. ADR-007's 2026-08-31 amendment settled the
opposite rule for holds: a continuous gesture shows what is in the way and lets go rather
than refusing or relocating itself. Cutting is the last gesture in the editor that still
relocates itself silently.

ADR-010 makes any straight seam expressible. This records the gesture that draws one.

## Decision

**Two tools share one geometry.** BLADE splits a face and hinges the far piece on the seam,
conserving plywood. TRIM discards the far piece and the plywood readout drops. Both draw the
same line the same way, and the expensive half is ADR-010, paid once.

**A seam is a slash.** Press anywhere on the face and drag; the line through the press point
and the cursor extends to the outline in both directions and draws in world space on the
plywood, so it stays on the surface of a steeply bent panel. Neither end has to land on an
edge, and the whole seam is on screen for the whole gesture, which is the thing ACROSS and UP
never gave.

**Any angle, with the degrees shown.** The seam does not quantise. Snapping to 15 degree steps
is the known fallback if free angles prove hard to aim, so the snap stays isolated behind one
function on the gesture and switching it on is one change.

**Only the release commits.** Following ADR-007's amendment, the seam follows the cursor and
reddens where it cannot go, and letting go there springs it back with nothing committed.
There are exactly three refusals and they look identical:

- the seam crosses the face's own `v = 0` edge, which would leave both pieces attached to the
  parent, and a face hinges on exactly one edge
- the seam crosses a hold, which would put one hold across a bend
- the offcut of a TRIM carries a child facet, which would orphan it

The crossed hold or the doomed child reddens alongside the seam, so the obstacle names itself
the way `findHoldObstruction` already does for a dragged hold.

**The piece holding `v = 0` keeps the face.** The floor pin never moves, which is the rule
today generalised from a named edge to any seam. The far piece becomes the new child for a
BLADE, and the offcut for a TRIM.

**TRIM always discards the far piece,** hatched for the whole drag so what is leaving is
visible before the release. It cannot trim the hinge side; redrawing is the answer. The
common real shape, a wall hinged at the floor trimmed to an angled top, is the far piece.

**The cut opens and settles.** On a BLADE release the seam flashes, the far piece rotates out
about 8 degrees and springs back flush on the same spring the hold drop uses, and is then
selected. A TRIM's offcut rotates away and falls out of frame, fading. The animation says two
things at once: which piece is new, and that it is the one that now bends.

**Undo ships first.** Wall-level undo and redo (ADR-012) land as their own feature before this
one. It makes TRIM recoverable without a per-face record of the outline it used to have, and
without a confirm dialog, which a gesture whose release is its commit should not have.

**ACROSS, UP and `findCutPosition` are deleted,** along with their tests. `findCutPosition`
exists only because the cut could not be seen, and 0 and 90 degrees reproduce both buttons
exactly.

## Consequences

- The cut gesture stops relocating itself, so every continuous gesture in the editor now
  behaves the same way: follow, redden, commit on release.
- Cutting moves out of the panel popover and into a drag on the wall. The popover keeps the
  angle controls and the paint.
- The one-click square cut becomes a drag. That is the cost of free angles, and it is what
  the snapping fallback exists to buy back.
- TRIM is the first action in the editor that destroys plywood. Autosave writes the wall
  400ms after it stops changing, so undo has to exist before this lands rather than after.
- Three facets meeting at a point stays unreachable: the refusal on a seam crossing `v = 0`
  is exactly where it would be needed. Recorded in ADR-010 as the limit of the tree.
- Curved and polyline seams are out. A hinge has to be one straight axis to bend as a rigid
  piece, so a curve could only ever be a trim, and it would break the convexity that ADR-010's
  minimum width test and prism collision both rely on. Gym walls are built from flat facets.
- Plywood sheet buildability warnings and facet resizing are out of this feature and stay on
  the backlog.
