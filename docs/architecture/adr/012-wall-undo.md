# ADR-012: The wall can be undone

## Status
Accepted

## Context

The editor has no undo. Every edit lands on the wall and stays there, and the one recovery
is the library, which holds named saves rather than the last few steps. That was tolerable
while every action was small and reversible by hand: a misplaced hold is dragged back, a bad
cut is merged into its parent with `removeFace`. ADR-011 adds TRIM, which discards plywood,
and autosave writes the wall 400ms after it stops changing, so a mistaken trim is on disk
before there is time to react. Undo has to exist before that lands.

The store is already shaped for it. Every edit is one `set()` producing a new immutable
`wall`, and autosave keys off `state.wall !== previous.wall`. Three things in the store are
not that simple. `useReportCollisionBox` writes a measured box into the wall after every hold
mounts, which is a change to `wall` that no user made. Keyboard nudges auto-repeat while a key
is held, one write per repeat. And delete is two-phase: `markHoldDeleting` starts the pop-off
animation and `removeHold` writes the wall when it rests.

## Decision

**History covers the wall document and nothing else.** An entry is one `Wall` value: faces,
holds, colours, angles, name. The armed hold type and model, the editor mode, the selection,
the pointer's held hold and the red flags for blocked holds are where you were, not what the
wall is, which is the boundary ADR-009 drew for the saved document. Undo can never put the
store in a state autosave would not have written.

**After a step, the thing that changed is selected.** The selection is computed by diffing
the two wall values: one hold differs and that hold is selected, one face differs and that
face is, a hold appeared or vanished and it is selected or the selection cleared, more than
one thing changed and the selection clears. The camera-focus swing then does what it already
does for a selection, so an undone edit off screen turns the camera toward it.

**Edits declare themselves; measurements stay silent.** Every user edit writes a
`lastEdit: { key, at }` marker beside the wall, with the key naming the action and its
target, such as `moveHold:<id>`. A write that does not touch the marker is not history. That
covers the collision-box measurement and the startup restore. `updateHold`, which today
serves both the colour swatch and the measurement, splits into `setHoldColor` and
`reportCollisionBox` so the boundary is in the action's name. A forgotten key on a new edit
makes that edit not undoable, which is noticed the first time someone tries; a forgotten
opt-out in the other design would have wiped the redo stack after every undo, silently, on
every remount.

**Same key within 300ms is one entry.** Holding an arrow for two seconds nudges the hold
thirty times and is one undo. Two deliberate clicks a second apart are two. Any change of
action or target closes the entry. A hold drag needs no rule: it writes the wall once, at
`dropHold`.

**Undo flushes pending deletes first.** `undo()` removes every hold still in
`deletingHoldIds`, which records that delete, and then steps back. Cmd+Z during the pop-off
therefore undoes the delete, which is what was meant, rather than the edit before it. Redo of
a delete goes through `markHoldDeleting` and animates like a fresh one.

**Loading clears history.** LOAD and NEW WALL both replace the wall, and both empty the stack.
The load dialog already warns that unsaved work is lost, and a stack that spans two walls
would have entries whose ids do not match the wall on screen.

**History is session state.** The saved document is unchanged. History lives in the store
and dies with the tab, capped at 100 entries. Each entry shares its hold and face objects with
its neighbours, so a hundred of them on a fifty-hold wall is on the order of 100KB; the cap is
hygiene rather than a memory need.

**The stack is zundo's, driven through its equality hook.** `temporal` wraps the store with
`limit: 100`, `partialize` selecting `wall` and `lastEdit`, and an `equality` function that
returns true, meaning skip, when the marker is unchanged or when its key matches within 300ms.
zundo 2.3.0's `index.ts` was read to confirm the load-bearing detail: a set the equality
function skips neither pushes a past state nor clears the future ones, so a measurement after
an undo leaves redo intact. The library has no per-call metadata of its own, so the marker is
how the two rules above reach it. The alternative was a hand-written stack of a few dozen
lines with the key as an argument to `set`; the same rules, stated as code rather than as an
equality test.

**Keys and buttons.** Cmd/Ctrl+Z undoes, Shift+Cmd+Z and Ctrl+Y redo, handled in
`useEditorKeyboard` beside the existing shortcuts and ignored when the event target is an
input, so the library's name field keeps its own undo. UNDO and REDO buttons sit in the header
before LOAD, disabled when their stack is empty. Strings land in en-us, pt-br and es-mx.

## Consequences

- TRIM (ADR-011) can ship without a per-face record of its previous outline and without a
  confirm dialog on a gesture whose release is its commit.
- `lastEdit` rides along in every snapshot and is restored by undo. It is harmless there and
  it is what lets the equality hook see the action that produced a state.
- Every new edit action from here on declares a key. A review of a store change asks one
  question: does this write touch `lastEdit`, and should it.
- Autosave and undo do not interact. An undo is a wall change like any other, and autosave
  writes it 400ms later. Undo, then reload within 400ms, loses the undo, exactly as any edit
  would.
- A held key that stops and restarts within 300ms coalesces across the pause. Two nudge runs
  separated by less than that are one entry. That is the cost of a timing rule rather than a
  keyup rule, and the keyup rule would not have covered the angle stepper's clicks.
- Undoing a `setFaceAngle` restores the stored angle exactly, including one that a bend
  stopped short of. Redo re-applies the stored value rather than re-running the search, which
  is correct: the wall it lands on is the wall it was measured against.
