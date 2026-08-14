# PRD: Scan

## Thesis

Point your camera at a real bouldering wall and get back its problems, each one
demonstrated by an animated climber.

## Problem

Reading an unfamiliar spray wall or gym wall is slow: which holds belong to which
problem, and how does it climb? Setters photograph walls constantly; nothing turns
those photos into something you can interact with.

## Flow

1. Upload or take a photo of a climbing wall.
2. Detection: YOLOv8 finds holds (bounding boxes + type classification).
3. Problem grouping: cluster detected holds into problems by tape/hold color.
4. The wall becomes interactive: select a problem to highlight its holds.
5. Beta: for a selected problem, solve a movement sequence (which limb moves to
   which hold, in what order) and play it back with an animated climber character.

## Scope

### Phase 1: Detection
- YOLOv8 fine-tuned on a public climbing hold dataset (Kaggle) plus own photos
- FastAPI endpoint: image in, detections out (`apps/api`)
- Web UI: photo upload, detection overlay, problem selection by color grouping

### Phase 2: Beta
- Beta solver: search over the problem's hold graph under body constraints
  (limb reach from configurable climber dimensions). Heuristic cost per move,
  no ML to start. Same interrogability rule as Studio's difficulty model:
  the factors and weights are visible and adjustable.
- Climber character: IK-posed rig in R3F stepping through the solved sequence

### Out of scope for now
- Video input, live AR overlay
- Pose estimation of real climbers in footage
- Wall geometry reconstruction (angle estimation stays a stretch goal)

## Success criteria

- Phase 1: on a clear photo of a home wall, at least 90% of holds detected; problems
  grouped correctly when hold colors are distinct; overlay renders in under 3s after upload.
- Phase 2: for a 4 to 10 hold problem on a vertical wall, the solver produces a
  physically plausible sequence (no move exceeds configured reach) and the character
  plays it back without visual glitches.

## Risks

- Dataset transfer: public datasets skew toward colorful commercial gym holds; wooden
  home-wall holds may need own labeled photos.
- Color-based problem grouping fails on monochrome walls (common for spray walls).
  Mitigation: manual problem assignment in the UI as fallback.
- Beta plausibility is a research rabbit hole. Keeping the solver heuristic and
  transparent bounds it.

## Open questions

- Does detection run server-side only (FastAPI + GPU/CPU) or is an ONNX-in-browser
  path worth it for the no-backend deploy story?
- Minimum photo quality to promise anything (resolution, angle, lighting)?
