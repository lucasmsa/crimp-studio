# ADR-008: The tool rail edits the selection, not only the next placement

## Status
Accepted

## Context

The rail down the left edge arms the next tap on the wall: hold type, and which model
of that type. The card in the corner edits what is selected: colour, rotate, delete.
The split was written down as a rule, that type and model belong to the next placement
and so are not repeated in the card.

Using it says the rule is wrong. Selecting a sloper leaves the rail showing whatever was
armed last, so the rail is stating something false about the thing you are looking at,
and there is no way at all to change a hold's type or model once it is on the wall.
The only route is delete and place again, which loses the position you picked.

The card has a second, smaller version of the same problem. A hold that has never been
painted carries no colour of its own and renders in its type's colour, and those six
type colours are not in the swatch set the card offers. So a freshly placed hold shows
nine swatches with none of them marked, and the card is again describing something that
is not on screen.

## Decision

**One control, one meaning.** A hold type button says "this is the current hold type".
With a hold selected it changes that hold and arms the type for the next placement, both
from the same click. Nothing is stashed and restored on deselect, so the rail after an
edit says what the next placement will be, which is what it just did.

**The rail reflects the selection.** Selecting a hold highlights its actual type and its
actual model. Deselecting leaves them where they are.

**A change that would not fit is greyed out**, rather than refused after the click. This
is the idiom the angle presets already use (ADR-007), extended to the two rows that can
now change a hold's footprint. A type is tested against the box that contains every model
of it rather than against any one of them: models of a type are scaled to a common target
footprint but keep their own aspect, so the widest is rarely the tallest and no single
model is the worst case. A type is therefore offered only when every model of it fits, so
a click never fails and a random roll can land anywhere safely. It costs one fit test per
button, at most six per row, on selection.

**Greyed out says why.** Disabled buttons take a not-allowed cursor and a tooltip naming
what is in the way. Both need `pointer-events-none` gone from the shared disabled style,
which is what has been hiding the "would clip" tooltip the angle presets were already
written to have.

**AUTO becomes RANDOM, and moves last.** The name says what the button does, and every
type has an even number of models (crimp 6, jug 4, pinch 4, pocket 4, sloper 4, volume 6),
so moving it out of the first slot pairs the real models two to a row and leaves the odd
control alone on the last row, which is what it is.

On a selected hold, RANDOM rolls: it gives the hold a different model of its type, never
the one it already has, and rolls again on the next click. It never highlights while a
hold is selected, because the hold has one concrete model and that is what the row shows.
RANDOM is a verb in that state, not a mode.

**Each type remembers its own model**, for the session. Switching from jug to crimp and
back restores the jug model rather than resetting it. Not persisted: reloading starts
every type at RANDOM, so there is no stored list to keep in step with the model registry.

**A hold's colour starts as a swatch.** The six type colours become values from the hold
swatch set, so an unpainted hold always lights one swatch and the rail's legend dot and
the wall agree. Grey joins the set for volumes as RAL 7037 dusty grey (#7D7F7D), which
keeps the set's rule that every colour traces to a published standard, and stays clear of
the panel set's grey (#8A8F94) so a grey volume does not read as a painted panel.

Colour stays in the card. It is a property of the thing selected rather than a mode the
editor is in, and there is no second copy of it in the rail to disagree with.

`color` stays optional on a hold. An unpainted hold follows its type, so changing a jug
to a crimp turns it red; a hold you painted keeps what you gave it.

Rejected: the rail as a readout that shows the selection but still only arms placement
(states the truth, but leaves a hold's type uneditable, which is the actual complaint);
stashing the armed type and restoring it on deselect (two hidden values behind one
button); dropping RANDOM entirely (ten identical jugs, and placement variety is what
makes a wall look like a wall); and adding the six type colours to the swatch row
alongside the nine (fifteen swatches carrying near-duplicate greens and reds).

## Consequences

- Changing type or model re-measures the collision box and clamps the hold to its face,
  the way rotating one already does. A bigger model near an edge moves inward rather than
  hanging off the plywood.
- The rail is now read on every selection, not only on placement, so the fit tests run
  whenever the selection changes rather than once per click.
- The type row's conservatism is visible: a type can be greyed out where a smaller model
  of it would have fitted. Volumes make it obvious, running from a narrow rail to a box
  three times its width. The alternative is a click that lands on a model that does not
  fit and has to be undone.
- Volumes change colour slightly, from #6B7280 to #7D7F7D, and every unpainted hold shifts
  to the RAL tone of its colour. The wall gets more saturated greens and reds.
- Holds saved before this change carry no model and render as procedural geometry. The
  model row shows nothing highlighted for one of those, and clicking any model gives it
  that model with no way back. Not worth a migration while saves are local.
- The card is now only what you do to a hold rather than what a hold is: colour, rotate,
  delete. If it ever shrinks further, the question of whether it should exist at all is
  worth asking again.
