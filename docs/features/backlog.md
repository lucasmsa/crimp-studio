# Feature Backlog

Ideas and features to not forget. Prioritized loosely.

---

## V0 — Wall Editor Stabilization (Current Priority)

### Must fix (before genetic algorithm)
- [ ] Fix wall as single flat panel (drop multi-panel, one angle)
- [ ] Fix hold geometries — proper sizes, better shapes (pocket/crimp too small, volume ugly)
- [ ] Fix hold placement — click places hold at correct position
- [ ] Fix hold dragging — follows pointer, clamped to wall bounds
- [ ] Fix hold selection — visible glow, working toolbar (not transparent)
- [ ] Fix camera controls — don't fight with hold interactions
- [ ] Drop width/height number inputs (error-prone, causes orphaned holds)

### Testing
- [ ] Install Playwright MCP for E2E testing
- [ ] Unit tests for wallStore (panel CRUD, hold CRUD)
- [ ] Unit tests for holdGeometry (each type generates valid geometry)
- [ ] Unit tests for wallLayout utility
- [ ] E2E: place hold → verify in store
- [ ] E2E: select hold → verify visual feedback
- [ ] E2E: delete hold → verify removed

### Polish (after bugs fixed)
- [ ] Wall and hold color painting (custom colors)
- [ ] Drag-to-resize wall borders
- [ ] Drag-to-resize holds
- [ ] Hold visibility improvements (T-nut bolt holes on wall surface for realism)

### Deferred (complex, do last)
- [ ] Wall subdivisions with angle bending (one wall, sections at different angles)
  - "Cut the wall" to create angle joints
  - Each section can be tilted independently
  - Holds stay attached to their section

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
