# Feature Backlog

Ideas and features to not forget. Prioritized loosely.

---

## V0 — Wall Editor Stabilization (DONE)

Completed 2026-03-01. See `openspec/changes/archive/2026-03-01-stabilize-wall-editor/`.

- [x] Single flat wall, hold geometries (jug, crimp, sloper, pinch, pocket, volume)
- [x] Hold placement, dragging (useFrame-based), selection (emissive glow)
- [x] Keyboard shortcuts (rotate, delete, nudge, deselect)
- [x] Wall/hold color pickers, grip texture, shadow anti-aliasing
- [x] 33 unit tests, E2E via Playwright
- [x] Spring animations (pop-in, hover, selection)

---

## V0.5 — Editor UX Refinement (Next)

### Hold resizing
- [ ] Drag hold border to resize (Photoshop-style handles on edges)
  - Show resize handles when hold is selected
  - Drag handle to scale hold size
  - Visual feedback during resize (ghost outline or live preview)

### Wall resizing
- [ ] Drag wall border to resize (similar to hold resize, but on the wall edges)
  - Needs careful handling: holds near edges might go out of bounds
  - Clamp or warn when shrinking would orphan holds
  - Visual guides/grid lines during resize

### Wall surface realism
- [ ] Small texture diffusions on wall to simulate T-nut screw holes
  - Subtle bump/normal mapped dots in a grid pattern
  - Should feel like real plywood wall panels

### Hold collision detection
- [ ] Prevent holds from overlapping each other
  - Manual placement: snap away or block placement on occupied space
  - Manual dragging: prevent dropping a hold on top of another
  - Genetic algorithm: fitness function must penalize overlapping holds
  - Use bounding sphere/radius per hold type for fast collision checks

### Triangular volumes
- [ ] Add triangular module hold type (or rework existing volume)
  - Triangular prism shape — very typical in climbing gyms
  - Bolted flat to the wall, creates a local angle change
  - Could replace or complement the current icosahedron volume

### Wall subdivisions
- [ ] Create wall subdivisions with angle bending
  - "Cut the wall" to create angle joints between sections
  - Each section can be tilted independently (slab, vertical, overhang, roof)
  - Holds stay attached to their section
  - Extremely sensitive — needs careful UX design and spec before implementation

---

## V1 - AI Hold Detection + Algorithm Refinement

- [ ] Train YOLOv8 on Kaggle dataset
- [ ] FastAPI endpoint for image upload
- [ ] Auto-detect holds from wall photo
- [ ] Color-based route detection (identify circuits)
- [ ] Hold type classification
- [ ] User feedback loop (rate routes → improve fitness function)
- [ ] Style preferences (crimpy, dynamic, technical)
- [ ] Hybrid Genetic-WFC for better constraint handling

## V2 - Social & Sharing

- [ ] Supabase auth integration
- [ ] Save walls to cloud
- [ ] Public wall gallery
- [ ] Share routes with link
- [ ] Embed widget for gyms
- [ ] Comments / beta sharing
- [ ] Route difficulty voting

## V3 - Advanced Features

- [ ] Body type consideration (height, ape index, wingspan)
- [ ] T-nut layout planning for blank walls
- [ ] Export to shopping list (hold brands/links)
- [ ] Training plan generator based on weaknesses

## V4 - Game (Maybe Separate Project)

- [ ] "Type to Crimp" climbing game
- [ ] Matter.js physics for ragdoll climber
- [ ] Leaderboards
- [ ] Daily challenges

---

## Nice to Have (No Priority)

- [ ] AR mode (see routes on real wall via phone camera)
- [ ] Integration with MoonBoard/Kilter APIs
- [ ] Progress tracking / send log
- [ ] Offline PWA support
- [ ] Mobile app (React Native)
- [ ] Multi-language support (i18n)
- [ ] Collaborative real-time editing

---

## Ideas Parking Lot

*Random ideas - might be good or bad:*

- Wall angle auto-detection from photo
- Climber pose estimation for beta visualization
- Voice-controlled route setting ("add a crimp at top left")
- Integration with climbing gym management systems
- Route comparison tool (overlay two routes)
- "Remix" feature - modify generated routes slightly
- Difficulty progression generator (V2 → V3 → V4 sequence)
- Hold wear simulation (older holds = more polished = harder)
