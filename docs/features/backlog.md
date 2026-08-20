# Feature Backlog

The single queue of upcoming work (see ADR-004). Two product pillars:

- **Studio**: design walls and problems by hand or procedurally. The playground.
- **Scan**: photo of a real wall in, detected problems and a demonstrated beta out.

---

## Done

### V0: Wall Editor Stabilization (2026-03-01)

- [x] Single flat wall, hold geometries (jug, crimp, sloper, pinch, pocket, volume)
- [x] Hold placement, dragging (useFrame-based), selection (emissive glow)
- [x] Keyboard shortcuts (rotate, delete, nudge, deselect)
- [x] Wall/hold color pickers, grip texture, shadow anti-aliasing
- [x] 33 unit tests, E2E via Playwright
- [x] Spring animations (pop-in, hover, selection)

### V0.5 Increment A (partial, 2026-03-01)

- [x] Hold collision detection (AABB, measured boxes, red drag feedback, snap-back). See `docs/features/wall-editor.md`.

---

## Studio

### Now: BHToolset hold models

- [x] Replace procedural hold geometries with GLB models from the BHToolset packs (`tools/holds/` pipeline; CC BY-SA attribution shipped in holds-manifest.json); procedural stays as fallback
- [x] Variant picker (2026-08-13): sidebar MODEL section per type, AUTO or explicit variant; volumes trimmed to tetras/rails/box (stars cut), outline stroke reworked to smoothed-normal displacement, editor AA fixed via composer multisampling
- [x] Toon shadow fix (2026-08-13): frontal key light (steep overhead angle raked long detached shadows across the wall), harder cel bands; animated pop-off delete (markHoldDeleting + spring to zero with spin, removeHold on rest); curated climbing names for model chips (BUCKET, RAZOR, TUFA, HUECO...); rail tower replaced with a doorstop RAMP so the two rails stop looking identical
- [x] Edge + embed fixes (2026-08-13): placement/drag/nudge clamp by hold extents (clampHoldToWall), not center point, so volumes stop overhanging the wall edge; HOLD_EMBED_DEPTH cut 15mm -> 2mm so holds stop sinking into the wall at glancing angles; delete shrink clamps (no negative-scale flip) and drops the spin
- [x] Stroke detach + shadow bias (2026-08-13): outline hulls clamp z >= 0 (base-rim smoothed normals point backward, the displaced hull dipped behind the wall and the wall depth-won, detaching the stroke at glancing angles); shadow-bias flipped negative with normalBias (positive bias peter-panned shadows off contact points, previously masked by the 15mm embed)
- [x] Stroke + AA round 2 (2026-08-13): the hull z-floor must clear HOLD_EMBED_DEPTH (a floor below it stays buried in the wall and the stroke detaches on bulging holds' upper contours; minZ = embed + 2mm); SMAA added on both composers (MSAA alone still steps on dpr-1 displays); normalBias eased to 0.008 so the tight frontal shadows survive
- [x] Shadow consistency (2026-08-14): key raked to [8, 12, 5] and normalBias cut to 0.002. A hold's shadow lands (x/z, y/z) per unit of height, so the near-frontal [5, 7, 10] key parked every shadow under its own hold: flat holds (slopers, pinches, pockets) showed nothing, and sloped volumes showed nothing at any position on the wall, since a pyramid's projected apex stays inside its own base until y/z clears ~2. The 8mm normal offset erased what was left on the flat holds. Cost: jug and pocket shadows run ~60% longer

### Editor UX (former V0.5)

- [x] Palette v4 + selection pass (2026-08-17): graphite chrome and a birch wall (ADR-005 amended; blue behind sand read as sea and beach), chalk-white selected state (beige read as a material sample, not as 'on'), Clash Display labels (Anton was illegible at 12px, Bagnard worse), focus shown by dimming the other panels rather than thickening a hull stroke that juts out flat edge-on, mode picker actually gates what a click selects, click-away deselects
- [x] Wall sections increment 1-2 (2026-08-17): face tree, cutting, angles, sprung bending, panel picker. Round of fixes after first real use: panels never cast shadows (only holds did), so an overhang left the wall below it lit and holds glowed inside their own shadow; the shadow map was spread over a 14m frustum, which speckled holds with acne and gave shadow edges a staircase; clicks obeyed click history rather than the mode picker; the base panel could be laid flat as a ceiling at floor height; a vertical seam offered roof and overhang, which mean nothing sideways.

- [x] Editor surface rework (2026-08-19): the sidebar is gone. Panel and hold popovers (drei `Html`, upright whatever the panel does, anchored on the settled transform so they hold still through a bend), a collapsible tool rail carrying the armed tool's settings, a status strip with counts and the height/reach/plywood readout, `wallColor` moved onto each face so panels paint one at a time and a cut keeps the paint. Three things found by using it: the 3D canvas had been 150px tall since the editor was built (R3F asks for `height: 100%`, the flex-grown box gave it nothing to resolve against, and the matching background hid it), a click on a popover control also read as a click on empty canvas and closed the popover, and the status chips were muted text on scene blue at under 2:1. "Bend on: across / up" landed as a readout, not a picker: a face hinges on one edge, so there was never a choice to offer.
- [ ] Panels and holds must never clip: a panel folded far enough passes through a
  panel it is not hinged to, and a hold on one panel pokes through the next one.
  Needs the 3D oriented-box collision from `docs/prd/wall-sections.md` (increment 4)
  plus an angle limit that stops a bend at the point of contact rather than after it.
- [ ] Copy a real wall's angles from a photo, with an angle input as the manual path
  (noted 2026-08-18). Feeds the Scan pillar: measure the profile off an image rather
  than dialling each panel by hand.
- [ ] Import a texture for the wall (noted 2026-08-20), so a wall can wear the finish
  the gym actually has instead of the procedural plywood.
- [ ] Paint all panels / paint all holds at once (after the per-panel colour lands)
- [ ] Custom colour picker behind a "custom" swatch, for the colour the curated sets do not have
- [ ] Hold resizing: drag border handles to scale, live preview
- [ ] Wall resizing: drag wall edges; clamp or warn when shrinking would orphan holds
- [x] Wall surface realism (2026-08-12): T-nut grid + plywood seams via procedural canvas texture
- [x] Triangular volumes (2026-08-12): the volume type IS now a plywood wedge prism; the icosahedron is gone
- [ ] Wall sections: the wall becomes a tree of hinged flat faces (slab, vertical, overhang, roof, plus aretes across the width), holds go face-local and stay bolted through every angle change, collision goes 3D. Shaped 2026-08-14: PRD `docs/prd/wall-sections.md`, model in ADR-006. Last big piece of the wall-and-route-creation pillar.
- [ ] Blade-mode cuts: draw the seam anywhere instead of picking across or up. Wanted sooner rather than later (2026-08-17): a drawn line says exactly where the cut lands, where the current buttons cut at the last tap and slide off any hold in the way, which is hard to aim. Same face tree (ADR-006), new input only. Cuts must not cross each other, or the vertex where they meet cannot stay watertight.

### Problem generation

- [ ] Procedural problem builder (genetic algorithm, see ADR-002); fitness must penalize hold collisions (store already exposes collision state). Runs on the wall you already have, sections and all; proposing a wall with its own sections is a second mode, not the only one. Generated problems must be humanly climbable and graded, not decorative.
- [ ] Angle as a difficulty input: a hold's face angle (ADR-006) feeds the grade estimate and the generator's fitness
- [ ] Difficulty assessment: heuristic grade estimate per problem. Must be interrogable: visible factor weights, per-factor contributions, no single unexplained number.
- [ ] Style preferences (crimpy, dynamic, technical)
- [ ] User feedback loop (rate routes to improve fitness function)
- [ ] Hybrid Genetic-WFC for better constraint handling

---

## Scan

- [x] Teaser page (/scan) while the pillar is built (2026-08-13)
- [ ] Train YOLOv8 on Kaggle climbing hold dataset
- [ ] FastAPI endpoint for image upload
- [ ] Auto-detect holds from wall photo
- [ ] Color-based route detection (identify circuits/problems on the wall)
- [ ] Hold type classification
- [ ] Evaluate NVIDIA MotionBricks for the animated beta (https://nvlabs.github.io/motionbricks/, found via r/TopologyAI 2026-08-17). A generative character-animation model: one backbone over ~350k motion clips, quoted at 15k FPS and 2ms latency, combining locomotion, style and interactions from "smart primitives" instead of a hand-built animation graph. Code and pretrained checkpoints are out. Caveats worth checking before betting on it: the release is a preview (an interactive G1 demo plus a synthetic training pipeline), the full version was said to be about a month out, and the demos read as physically plausible bumbling rather than directed movement, which is the opposite of what a beta needs. The climbing case is also far outside its locomotion training distribution.
- [ ] Beta generation: given a detected problem, generate a movement sequence and demonstrate it with an animated climber character. PRD: `docs/prd/scan.md`. The sequence has to look like a body actually moving, so the solver leans on physical constraints (reach, balance, center of mass over the feet) the way Endorphin-style motion tools do, not on keyframes alone.
- [ ] Wall angle auto-detection from photo

---

## Platform and later

### V2: Social & Sharing

- [ ] Supabase auth integration
- [ ] Save walls to cloud
- [ ] Public wall gallery
- [ ] Share routes with link
- [ ] Embed widget for gyms
- [ ] Comments / beta sharing
- [ ] Route difficulty voting

### Safety and legal

- [ ] Build-safety notice (about page or its own page, all three locales): the app designs walls, it does not certify them. A real wall's material, fixings, backing structure and foundation depend on load and construction, and federal, state, municipal and international standards govern them. Anyone building from a design here needs a qualified professional. Wording needs a check by someone who knows the local rules before it ships.

### V3: Advanced

- [ ] Body type consideration (height, ape index, wingspan)
- [ ] T-nut layout planning for blank walls
- [ ] Export to shopping list (hold brands/links)
- [ ] Training plan generator based on weaknesses

### V4: Game (maybe separate project)

- [ ] "Type to Crimp" climbing game
- [ ] Matter.js physics for ragdoll climber
- [ ] Leaderboards
- [ ] Daily challenges

### Now: THPS art direction rollout (ADR-005)

- [x] Tokens + primitives (2026-08-11): Clash Display headings, sharp radius, Button restyled with offset shadows; success/error foregrounds flipped to ink (white-on-green was 2.28:1)
- [x] Palette v2 (2026-08-12): industrial blues/beige replaces hot orange (eye strain; corrected contrast math also showed orange display on light at 2.97:1, under the 3:1 large bar). Matrix recomputed after fixing an sRGB threshold bug in the checker.
- [x] Scene render spike (2026-08-12): toon cel shading + inverted-hull ink outlines vs improved PBR rig, switchable via SCENE_STYLE (toon default). Wall got T-nut grid + plywood seam texture. Fixed two pipeline bugs found on the way: GLBs shipped without NORMAL attribute (hemisphere light rendered them black; flat look overall) and grip bump/roughness maps sampled on UV-less GLB geometry.
- [x] Editor loading overlay + full model preload (2026-08-12): no more procedural flash when placing holds
- [x] Toon band tuning, editor chrome (sticker hold-type selector, sectioned sidebar), landing poster restyle, about restyle + content refresh (2026-08-12)
- [x] Landing shoe cel-shaded via shared lib/three/toon.ts; poster titles settle on white + ink shadow (2026-08-12)
- [x] Volume GLB variants (2026-08-13): 7 original models from Blender headless (tools/holds/volumes_blender.py), three families: asymmetric tetras, beveled rails, tri-blade stars; procedural wedge stays as fallback
- [ ] Landing restyle (shoe scene stays, poster treatment around it)
- [ ] About restyle
- [ ] Editor chrome restyle (header, sidebar, overlays)
- [ ] HUD banner on route generation (blocked until generation exists). The "BLOCKED" collision stamp was cut 2026-08-14: the red hold already says it, and stamping every refused click gets old.
- [ ] Copy pass: light slang at key moments, all three locales
- [ ] Shaping session for the points/combo system (blocked until shaped; no score feedback before then)

### Nice to have (no priority)

- [ ] AR mode (see routes on real wall via phone camera)
- [ ] Integration with MoonBoard/Kilter APIs
- [ ] Progress tracking / send log
- [ ] Offline PWA support
- [ ] Mobile app (React Native)
- [ ] Collaborative real-time editing
- [ ] 3D grade tags on the wall (BHToolset grade tags pack is in the same Printables catalog)

---

## Ideas Parking Lot

*Random ideas, might be good or bad:*

- Voice-controlled route setting ("add a crimp at top left")
- Integration with climbing gym management systems
- Route comparison tool (overlay two routes)
- "Remix" feature: modify generated routes slightly
- Difficulty progression generator (V2 -> V3 -> V4 sequence)
- Hold wear simulation (older holds = more polished = harder)
