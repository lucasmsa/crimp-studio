export type {
  FaceTree,
  HingeSegment,
  OutlineBounds,
  Point2,
  SeamFrame,
  SeamOrientation,
  WallFace,
} from './faceTree'
export {
  computeSurfaceArea,
  createRootFaceTree,
  edgeLength,
  edgeOf,
  findEdgeThrough,
  getFace,
  getRootFace,
  hingeSegment,
  isConvexCCW,
  listFaces,
  minWidthAcross,
  outlineArea,
  outlineBounds,
  outlineCentroid,
  pointToChild,
  pointToParent,
  rectOutline,
  seamFrame,
  seamOrientation,
  sheetUp,
} from './faceTree'

export type { FaceTransform, FaceTransforms } from './faceTransform'
export {
  computeFaceTransforms,
  faceLocalToWorld,
  faceNormal,
  faceSteepness,
} from './faceTransform'

export type { Prism } from './prism'
export { boxPrism, polygonPrism, prismsIntersect } from './prism'

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
