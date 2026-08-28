# ADR-009: Walls persist in the browser

## Status
Accepted

## Context

SAVE WALL and LOAD WALL have been in the editor header since it was built, with no
handler behind either. A wall dies on refresh. That was tolerable while a wall was a flat
sheet with some holds on it, and it stopped being tolerable once the wall became a real
model: a tree of hinged faces (ADR-006), holds bolted through every angle change, and a
profile that takes minutes of shaping to arrive at (ADR-007). Losing that to a reload
makes the rest of the editor feel disposable.

There is no backend. Supabase is on the roadmap and nothing depends on it yet, so the
choice is between waiting for it and keeping walls where the editor already runs.

## Decision

**The browser is the store.** Walls live in `localStorage` as a named library with no
fixed number of slots: a wall is kilobytes and the budget is megabytes. Supabase later
changes where the bytes go, not what a saved wall is, so the document below is the
contract and the storage behind it is swappable.

**Autosave is what actually saves you.** The wall being edited is written continuously and
restored on the next visit without asking. The buttons are then for keeping and naming
versions rather than for rescuing work, which is the job they are good at.

**Saving is game-style.** SAVE opens the library and you either overwrite a slot or make a
new named one. A single "save updates the current entry" rule reads as safer than it is:
the wall is the thing you have been shaping for ten minutes, and being able to branch it
without renaming is worth one extra click.

**Loading warns.** Autosave holds the wall you are on and nothing else, so loading over
unsaved changes is the one action in the editor that can actually lose work. It says so,
and offers to save first.

**The document carries choices, not derived values.**

```
{ version, id, name, savedAt, wall: { width, height, faces, holds } }
```

A hold keeps its type, face, u, v, rotation, size, colour and model. It does not keep its
collision box: that is measured from the GLB, so a stored box goes stale the moment a
model is rescaled or replaced, and measuring again on load costs nothing. The camera, the
selection and the armed tool are not in the document either. They are where you were, not
what the wall is.

**A save that does not check out is refused**, with the reason, leaving the wall on screen
untouched. Versioned, shape-checked, all or nothing: a half-loaded wall is worse than a
refused one.

**A wall that overlaps itself loads anyway**, and the holds that clip are flagged through
`blockingHoldIds`, the same red flash a blocked bend already uses. This is the one place
the ADR-007 invariant bends, and deliberately: the likeliest way a saved wall becomes
illegal is the editor's own rules changing under it, and refusing to open a wall someone
built under the old rules strands it. Nothing else in the editor deletes work silently, so
dropping the offenders is not an option either.

**The library is a dialog**, the shadcn one on `@radix-ui/react-dialog`, styled in the
poster chrome (ADR-005). Radix rather than Base UI because the Button already carries
`@radix-ui/react-slot`, so the app stays in one component family. Hand-rolling it was
considered: the selection card's focus trap is reusable, but scroll lock, aria wiring and
focus restoration are where hand-rolled dialogs go wrong.

**A slot shows what tells two walls apart**: its name, when it was saved, its panel and
hold counts, and a picture of the wall. The picture is drawn from the face tree when the
row renders, three quarters on: every panel as a quad, holds as dots in the colours they
are painted. A slab, a roof and an arete are different shapes and read as different shapes
at 100px, which a dark 3D screenshot of the same three does not. It is generated rather
than stored, so it is always current and always sharp. Bytes were not the deciding factor:
a screenshot is roughly 8KB an entry against a budget in megabytes.

Drawn straight from the side was the first attempt and it was wrong: a flat wall, which is
most walls, is a line seen that way, and the drawing read as broken rather than as flat.

**A slot can be deleted**, from its own row, behind a confirm.

**CLEAR ALL keeps meaning holds.** Starting a fresh wall is its own row at the top of the
library, under the same unsaved-changes warning as loading any other wall.

## Consequences

- A wall is tied to one browser on one machine. That is the honest limit of this decision
  and the reason the document is versioned from the start: the migration to Supabase is a
  new storage adapter plus a sync of rows, not a new format.
- `localStorage` is synchronous and capped around 5MB. A wall is kilobytes, so the cap is
  far off, but a full store throws on write and the save has to say so rather than fail
  quietly.
- Recomputing collision boxes on load means a wall can come back legal today and illegal
  tomorrow, when a model is rescaled. That is the case the overlap flagging is for.
- The editor gains its first text input and its first dialog. Both need styling against
  the poster chrome rather than inheriting shadcn's defaults, or they will read as a
  different application.
- Autosave means the editor is never empty on arrival. The first-run experience is now
  whatever you left, which is right for a tool and does need the new-wall row to exist.
- Save files are hand-editable JSON in devtools. That is a feature for debugging and the
  reason the loader shape-checks rather than trusting what it reads.
