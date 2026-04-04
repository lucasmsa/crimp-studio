# Hold Collision Detection — Tasks

## Tasks

- [x] Add `collisionBox` to Hold interface in wallStore
- [x] Create `holdCollision.ts` utility with AABB-based `checkCollision`, `findCollisions`, `hasCollision`
- [x] Write unit tests for collision utility (same type, different axes, asymmetric boxes, self-collision)
- [x] Add `measureCollisionBox` to holdGeometry.ts for synchronous measurement at placement time
- [x] Integrate collision check into `addHold` store action (block placement + measure box)
- [x] Hold3D measures actual geometry bounding box and reports to store via `updateHold`
- [x] Wall3D computes colliding hold IDs set and passes `isColliding` to Hold3D
- [x] Add `isColliding` visual state to holdVisualConfig (red emissive glow + semi-transparent)
- [x] Snap-back on drop: save pre-drag position, revert on pointer-up if still colliding
- [x] Suppress hover scale effect while any hold is being dragged
- [x] Update store tests for collision-aware `addHold`
- [x] All tests, typecheck, lint pass
