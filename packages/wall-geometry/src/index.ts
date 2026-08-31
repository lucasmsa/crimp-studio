export type { FaceTree, HingeEdge, WallFace } from './faceTree'
export {
  computeFaceSheetOrigin,
  computeSurfaceArea,
  createRootFaceTree,
  getFace,
  getRootFace,
  listFaces,
} from './faceTree'

export type { FaceTransform, FaceTransforms } from './faceTransform'
export {
  computeFaceTransforms,
  faceLocalToWorld,
  faceNormal,
  getFaceTilt,
  relativeFaceAngle,
} from './faceTransform'

export type { Obb } from './obb'
export { makeObb, obbsIntersect } from './obb'

export type { HoldBox, HoldPlacement, WallSolid } from './wallSolids'
export { collectWallSolids, floorSolid, holdSolid, panelSolid } from './wallSolids'

export type { AngleLimit, HoldObstruction, HoldPosition, SolidPair } from './wallLegality'
export {
  ANGLE_PRECISION,
  BUILD_GAP,
  MOVE_PRECISION,
  faceAngleIsClear,
  findHoldObstruction,
  findLegalFaceAngle,
  findLegalHoldMove,
  findWallOverlaps,
  holdPlacementIsClear,
  wallIsClear,
} from './wallLegality'

export { CM_TO_M, HOLD_EMBED_DEPTH, WALL_DEPTH } from './units'
