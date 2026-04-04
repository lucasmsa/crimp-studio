## Why

V0 delivered a stable wall editor with hold placement, dragging, and selection. But holds can overlap freely, the wall surface looks flat/artificial, and the volume hold type (icosahedron) doesn't match real climbing gym geometry. These three gaps hurt the editor's realism and usability — collision detection is foundational for V0.5's resizing features, T-nut textures make the wall feel like a real climbing wall, and triangular volumes are the most common volume shape in gyms.

## What Changes

- **Hold collision detection**: Bounding-sphere checks prevent holds from overlapping during placement and dragging. Visual feedback when a collision is detected (e.g., hold turns red/semi-transparent). Collision state exposed in the store for future use by the genetic algorithm fitness function.
- **Wall surface T-nut texture**: Normal-mapped grid of T-nut screw holes on the wall surface. Subtle bump pattern that gives the wall a realistic plywood panel feel without affecting geometry or shadows.
- **Triangular volume hold type**: New `triangle` hold type — a triangular prism bolted flat to the wall, typical in climbing gyms. Complements the existing icosahedron `volume` type rather than replacing it.

## Capabilities

### New Capabilities
- `hold-collision`: Bounding-sphere collision detection for hold placement and dragging, with visual feedback and store-level collision state
- `wall-tnut-texture`: Normal-mapped T-nut grid pattern on the wall surface for realism
- `triangle-volume`: Triangular prism hold type added to the hold system

### Modified Capabilities
- `hold-system`: Adding `triangle` to the HoldType union and its geometry/config
- `editor-interactions`: Placement and drag behaviors now check for collisions before committing

## Impact

- **Types**: `HoldType` union in `packages/shared/src/types.ts` gains `'triangle'`
- **Store**: `wallStore` gains collision detection utility functions
- **Components**: `Hold3D` needs collision visual feedback state; `Wall3D` gets T-nut normal map
- **Config**: New geometry config for triangle type; collision radius config per hold type
- **i18n**: New labels for triangle hold type and collision feedback
- **Tests**: Unit tests for collision logic, geometry generation; E2E for placement blocking
