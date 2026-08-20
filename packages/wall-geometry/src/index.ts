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

export type { AngleLimit, SolidPair } from './wallLegality'
export {
  ANGLE_PRECISION,
  BUILD_GAP,
  faceAngleIsClear,
  findLegalFaceAngle,
  findWallOverlaps,
  holdPlacementIsClear,
  wallIsClear,
} from './wallLegality'

export { CM_TO_M, HOLD_EMBED_DEPTH, WALL_DEPTH } from './units'
