# ADR-004: Retire OpenSpec in favor of ADRs, backlog, and feature docs

## Status
Accepted

## Context

The project ran two documentation systems in parallel: OpenSpec (`openspec/` with
proposals, designs, per-capability specs, and task checklists, driven by the opsx-*
skills) and the docs tree (`docs/architecture/adr/`, `docs/features/backlog.md`,
`docs/prd/`). Other personal projects settled on the ADR + docs pattern, and the
duplication showed here: the OpenSpec hold-system spec described icosahedron crimps
while the code had moved to bezier extrusions, and the v05-increment-a design chose
bounding-sphere collision while the shipped implementation uses measured AABBs.
Spec artifacts also lived outside the docs tree that actually gets read across sessions.

## Decision

Retire OpenSpec. The workflow becomes:

- `docs/features/backlog.md` is the single queue of upcoming work, organized by product pillar.
- `docs/features/*.md` describe current behavior per feature area and are updated in the same change that alters behavior.
- ADRs record significant decisions and checkpoints, numbered sequentially in `docs/architecture/adr/`.
- PRDs in `docs/prd/` frame larger product surfaces before implementation.

The `openspec/` directory and the opsx-* skills are deleted. Spec content worth keeping
was ported to `docs/features/wall-editor.md`. The unfinished v05-increment-a items
(T-nut wall texture, triangular volume) remain in the backlog; its shipped item
(hold collision) is documented in the feature doc.

## Consequences

- One place to look per question: backlog for what is next, feature docs for what is, ADRs for why.
- No task-checklist ceremony per change; discipline shifts to keeping feature docs in sync with behavior changes.
- Losing OpenSpec's scenario format means acceptance criteria now live in tests and PRD success criteria rather than spec files.
