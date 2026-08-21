# ADR-005: App-wide THPS 1-2 art direction

## Status
Accepted

## Context

The /scan teaser piloted a Tony Hawk's Pro Skater-inspired treatment (Anton poster
type with hard offset shadows, sticker cards, tape crosses, ticker tape) and it fits
the product: climbing gym culture and early-2000s skate culture share the same visual
language. The rest of the app still has the quieter Resend-like look from V0. Decided
2026-08-11: the whole app adopts the direction.

## Decision

THPS 1-2 grunge is the app-wide art direction. Concretely:

- **Reference**: stickers, climbing tape, spray stencils, torn paper, condensed poster
  type with hard offset shadows. Not THPS 3/4 neon-chrome, not THUG graffiti.
- **Themes**: both palettes stay, dark-first. Poster-on-black dark, zine-paper light.
- **Type**: Anton for posters and stamps, Clash Display for UI headings (replaces
  Space Grotesk), Satoshi for body, JetBrains Mono for data.
- **Palette** (amended 2026-08-17 evening, final): the deep-water blue set is
  restored and the accents become pastels. Two detours are recorded below and
  both are rejected: graphite chrome read as bleak, and a white/silver posh
  direction fought the THPS language on every other page, which is what made
  the app stop looking like one product. The art direction itself was never the
  problem. Sky `#87CEFA` leads interaction and marks the selected state, pink
  `#FFB6C1` marks attention, mint `#98FB98` means success; on deep-water blue
  each clears 5.5-9:1 as text and 12-15.6:1 as a fill carrying ink text, so one
  set covers both jobs. Borders lift to `#6B8EAB` for 3.35:1 against the
  background. On the light theme the same three need their deep siblings
  (`#C2185B`, `#0B6FB4`, `#1B7F4B`), since pastels on white are 1.3-1.7:1.
- **Palette** (rejected detour, 2026-08-17): graphite chrome with a chalk primary. Deep-water blue behind a sand-coloured
  wall read as sea and beach once the wall filled the viewport, and the beige
  primary never read as "selected" because it looked like another material
  sample. New roles: `#14161A` graphite background, `#1E2229` surfaces,
  `#6B7480` borders, `#9BA5B0` muted text, `#FAFAFA` chalk primary with ink
  text; light theme is `#F5F4F2` paper with an ink primary. The wall itself
  moves from `#E8D5B7` sand to `#CFC5B4` birch, which is closer to real
  plywood. Full matrix passes AA: chalk on graphite 17.35:1, muted on graphite
  7.25:1, ink on chalk 18.97:1, muted on paper 5.47:1.
- **Palette** (amended 2026-08-12, superseded by the graphite set above): an
  industrial set replaces hot orange after a day of use showed the orange caused
  eye strain, and corrected contrast math put orange display text on light at
  2.97:1, under the 3:1 large-text bar. New roles: `#1B3C53` deep-water background
  (dark), `#234C6A` steel surfaces, `#456882` slate accents and borders, `#D2C1B6`
  chalk-beige primary with ink text on dark; light theme flips primary to
  deep-water with white text on `#F2EDE7` paper. Full matrix passes 4.5:1.
- **Palette (original, superseded)**: primary becomes a hot orange. WCAG AA
  constraint: orange is a fill with near-black text on it, or large display type
  on dark backgrounds. It never colors body text and never carries small text on
  light backgrounds.
- **Primitives**: Button, inputs, and panels are restyled directly (2px borders,
  hard offset shadows, condensed labels) so every surface inherits.
- **Editor**: full treatment on the chrome. In-canvas THPS is HUD feedback plus,
  since the 2026-08-12 scene spike, an optional cel-shaded render style: toon
  materials with hard luminance bands and inverted-hull ink outlines on holds and
  wall, No More Heroes-style. `SCENE_STYLE` in `sceneStyleConfig.ts` flips between
  'toon' (default) and 'standard' (PBR three-point rig) in one line. This
  supersedes the original wall-stays-realistic note; the Scan pillar's detection
  quality never depended on the editor's render style. The planned "BLOCKED" stamp
  on collision was dropped 2026-08-14: the holds already turn red on a rejected
  placement, and a slam-in stamp on every refused click wears out fast. A banner on
  route generation stays planned for when generation exists.
- **Texture and motion**: static print texture (grain, halftone, torn edges). Motion
  only at entrances, hovers, and HUD stamps; prefers-reduced-motion respected; no
  ambient animation competing with the editor's frame budget.
- **Copy**: light climbing/skate voice at key moments (headlines, CTAs, stamps) in
  all three locales; body copy stays plain.
- **Landing**: the shoe scene stays; the poster treatment happens around it.
- **Rollout**: tokens and primitives first with WCAG checks on both themes, then
  landing, about, editor, and HUD as separate browser-verified increments.

Out of scope: a points/combo scoring system (a rules feature, needs its own shaping
session before any "+50" style feedback exists), spray-paint marks on the wall
texture, THPS 3/4 chrome elements.

## Consequences

- The Space Grotesk heading font is retired, which also resolves the standing
  design-hook finding against it.
- The app looks mixed for a short stretch of commits during the page-by-page rollout.
- The hot orange primary constrains component design: any small text sits on
  neutral surfaces, orange works as blocks and stamps.
- Collision and generation feedback gain a HUD layer; score-like feedback stays
  blocked on the future points shaping.
- The /scan teaser stops being a special case and becomes the reference
  implementation for the rest of the app.

## Amendment, 2026-08-20: the gym look

Tried at the request that the editor read like a real gym rather than a blue void,
and that the plywood tone show up beyond the wall. Recorded here to be judged
rather than settled: it is one browser pass, not a decision.

- **The scene backdrop is white to grey**, top to bottom, in place of the
  deep-water blue. The wall keeps its silhouette against it through the ink
  outline rather than through a contrasting backdrop.
- **Panels start painted**, a warm white (#F6F4F0), rather than raw plywood. Most
  gyms paint every panel; plywood stays a swatch away.
- **Sand is a token** (`--sand`, the plywood tone, ink text on it at 13.9:1) and
  the editor's selected chip uses it, so the chrome is warm where the wall is.
- **Tone mapping is off** and the cel ramp's floor is raised (95 to 165 of 255).
  Both follow from painting the panels white: the filmic curve rolls the top of
  the range off, and on the old ramp a lit white wall landed in the middle band,
  which is grey. The rig's fill and key came down to match (0.62/2.0 to
  0.45/1.1).

What is still not right: a flat wall reads a shade darker than the room behind it,
so it looks like a grey panel in a white room rather than a white panel. Getting
past that means either lighting the wall separately from the backdrop or dropping
the backdrop's brightness, and both deserve a look with fresh eyes before either
is chosen.
