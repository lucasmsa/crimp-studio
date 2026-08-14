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
- [x] Stroke + AA round 2 (2026-08-13): the hull z-floor must clear HOLD_EMBED_DEPTH (a floor below it stays buried in the wall and the stroke detaches on bulging holds' upper contours; minZ = embed + 2mm); SMAA added on both composers (MSAA alone still steps on dpr-1 displays); normalBias eased to 0.012 so the tight frontal shadows survive

### Editor UX (former V0.5)

- [ ] Hold resizing: drag border handles to scale, live preview
- [ ] Wall resizing: drag wall edges; clamp or warn when shrinking would orphan holds
- [x] Wall surface realism (2026-08-12): T-nut grid + plywood seams via procedural canvas texture
- [x] Triangular volumes (2026-08-12): the volume type IS now a plywood wedge prism; the icosahedron is gone
- [ ] Wall subdivisions with angle bending (slab, vertical, overhang, roof per section; holds stay attached). Needs a PRD before implementation.

### Problem generation

- [ ] Procedural problem builder (genetic algorithm, see ADR-002); fitness must penalize hold collisions (store already exposes collision state)
- [ ] Difficulty assessment: heuristic grade estimate per problem. Must be interrogable: visible factor weights, per-factor contributions, no single unexplained number.
- [ ] Style preferences (crimpy, dynamic, technical)
- [ ] User feedback loop (rate routes to improve fitness function)
- [ ] Hybrid Genetic-WFC for better constraint handling

---

## Scan

- [ ] Teaser page (/scan) while the pillar is built
- [ ] Train YOLOv8 on Kaggle climbing hold dataset
- [ ] FastAPI endpoint for image upload
- [ ] Auto-detect holds from wall photo
- [ ] Color-based route detection (identify circuits/problems on the wall)
- [ ] Hold type classification
- [ ] Beta generation: given a detected problem, generate a movement sequence and demonstrate it with an animated climber character. PRD: `docs/prd/scan.md`.
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
- [ ] HUD stamps: "BLOCKED" on collision rejection, banner on route generation
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
