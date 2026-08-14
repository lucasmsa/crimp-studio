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
- **Palette** (amended 2026-08-12, supersedes the hot-orange decision below): an
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
