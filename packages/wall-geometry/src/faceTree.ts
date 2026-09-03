/** A point in a face's own frame, in cm: u along the seam, v into the face */
export type Point2 = readonly [number, number]

export interface WallFace {
  id: string
  /** null only for the root face */
  parentId: string | null
  /** The edge of the parent's outline this face hinges on. null only for the root */
  seamEdge: number | null
  /**
   * Convex and counter-clockwise, in the face's own frame. Edge i runs from
   * outline[i] to outline[i + 1]. The outline lies in v >= 0 and meets v = 0
   * along the segment it hinges on, which is the u axis (ADR-010).
   */
  outline: Point2[]
  /** degrees about the seam, relative to the parent */
  angle: number
  /** Paint on this panel alone, so a wall can be two tones the way gyms are */
  color: string
  childIds: string[]
}

export interface FaceTree {
  rootId: string
  byId: Record<string, WallFace>
}

/** Below this, a length or an area is a rounding artefact rather than geometry */
const EPSILON = 1e-6

const createFaceId = () => `face_${Math.random().toString(36).substring(2, 9)}`

/** The four corners of a sheet from its bottom-left, counter-clockwise */
export function rectOutline(width: number, height: number): Point2[] {
  return [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ]
}

export function createRootFaceTree(width: number, height: number, color: string): FaceTree {
  const root: WallFace = {
    id: createFaceId(),
    parentId: null,
    seamEdge: null,
    outline: rectOutline(width, height),
    angle: 0,
    color,
    childIds: [],
  }

  return { rootId: root.id, byId: { [root.id]: root } }
}

export function getFace(tree: FaceTree, faceId: string): WallFace {
  const face = tree.byId[faceId]
  if (!face) throw new Error(`Unknown face: ${faceId}`)
  return face
}

export function getRootFace(tree: FaceTree): WallFace {
  return getFace(tree, tree.rootId)
}

/** Root first, then children in insertion order. */
export function listFaces(tree: FaceTree): WallFace[] {
  const ordered: WallFace[] = []
  const walk = (faceId: string) => {
    const face = getFace(tree, faceId)
    ordered.push(face)
    face.childIds.forEach(walk)
  }
  walk(tree.rootId)
  return ordered
}

/** Edge i of an outline, from its start to its end */
export function edgeOf(outline: Point2[], index: number): [Point2, Point2] {
  const count = outline.length
  return [outline[index % count], outline[(index + 1) % count]]
}

export function edgeLength(outline: Point2[], index: number): number {
  const [a, b] = edgeOf(outline, index)
  return Math.hypot(b[0] - a[0], b[1] - a[1])
}

/** Signed area by the shoelace formula: positive for a counter-clockwise outline */
export function outlineArea(outline: Point2[]): number {
  let twice = 0
  for (let i = 0; i < outline.length; i++) {
    const [a, b] = edgeOf(outline, i)
    twice += a[0] * b[1] - b[0] * a[1]
  }
  return twice / 2
}

export function outlineCentroid(outline: Point2[]): Point2 {
  const area = outlineArea(outline)
  if (Math.abs(area) < EPSILON) {
    const count = outline.length
    return [
      outline.reduce((sum, [u]) => sum + u, 0) / count,
      outline.reduce((sum, [, v]) => sum + v, 0) / count,
    ]
  }

  let cu = 0
  let cv = 0
  for (let i = 0; i < outline.length; i++) {
    const [a, b] = edgeOf(outline, i)
    const cross = a[0] * b[1] - b[0] * a[1]
    cu += (a[0] + b[0]) * cross
    cv += (a[1] + b[1]) * cross
  }
  return [cu / (6 * area), cv / (6 * area)]
}

export interface OutlineBounds {
  uMin: number
  uMax: number
  vMin: number
  vMax: number
}

export function outlineBounds(outline: Point2[]): OutlineBounds {
  return {
    uMin: Math.min(...outline.map(([u]) => u)),
    uMax: Math.max(...outline.map(([u]) => u)),
    vMin: Math.min(...outline.map(([, v]) => v)),
    vMax: Math.max(...outline.map(([, v]) => v)),
  }
}

/** Whether every turn is a left turn and the area is positive, which the cuts and the collision test both rely on */
export function isConvexCCW(outline: Point2[]): boolean {
  if (outline.length < 3 || outlineArea(outline) <= EPSILON) return false

  for (let i = 0; i < outline.length; i++) {
    const [a, b] = edgeOf(outline, i)
    const c = outline[(i + 2) % outline.length]
    const turn = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
    if (turn < -EPSILON) return false
  }

  return true
}

/** Distance from a point to the line through an edge, positive on the outline's inside */
function distanceInside(a: Point2, b: Point2, point: Point2): number {
  const du = b[0] - a[0]
  const dv = b[1] - a[1]
  return (du * (point[1] - a[1]) - dv * (point[0] - a[0])) / Math.hypot(du, dv)
}

/**
 * The edge whose line carries both points within its own span, or -1. A child's
 * hinge is a segment of one of its parent's edges, and this is how the parent
 * edge is found again after a cut or a merge has renumbered them.
 */
export function findEdgeThrough(outline: Point2[], p: Point2, q: Point2): number {
  return outline.findIndex((_, i) => {
    const [a, b] = edgeOf(outline, i)
    const du = b[0] - a[0]
    const dv = b[1] - a[1]
    const lengthSq = du * du + dv * dv

    return [p, q].every((point) => {
      const ou = point[0] - a[0]
      const ov = point[1] - a[1]
      const along = (ou * du + ov * dv) / lengthSq
      const off = Math.abs(du * ov - dv * ou) / Math.sqrt(lengthSq)
      return off < EPSILON && along > -EPSILON && along < 1 + EPSILON
    })
  })
}

/**
 * The narrowest the piece gets: the smallest distance between two parallel
 * lines that enclose it. For a rectangle that is its shorter side; for a
 * sliver of any shape and orientation it is small, which is what a minimum
 * panel size has to catch (ADR-010).
 */
export function minWidthAcross(outline: Point2[]): number {
  let narrowest = Infinity

  for (let i = 0; i < outline.length; i++) {
    const [a, b] = edgeOf(outline, i)
    const across = Math.max(...outline.map((point) => distanceInside(a, b, point)))
    narrowest = Math.min(narrowest, across)
  }

  return narrowest
}

export interface HingeSegment {
  from: number
  to: number
}

/** The u range along which the outline meets its hinge line, v = 0 */
export function hingeSegment(face: WallFace): HingeSegment {
  const vMin = Math.min(...face.outline.map(([, v]) => v))
  const onHinge = face.outline.filter(([, v]) => v <= vMin + EPSILON).map(([u]) => u)
  return { from: Math.min(...onHinge), to: Math.max(...onHinge) }
}

/** A child's frame placed in its parent's: where its origin sits and which way its axes point */
export interface SeamFrame {
  origin: Point2
  u: Point2
  v: Point2
}

/**
 * The frame a face hinged on `seamEdge` of this outline lives in.
 *
 * The edge runs A to B with the parent's inside on its left. The child's origin
 * is B and its u axis runs back toward A, so its v axis, a quarter turn to the
 * left of u, points away from the parent: outward, where the child is.
 */
export function seamFrame(parent: WallFace, seamEdge: number): SeamFrame {
  const [a, b] = edgeOf(parent.outline, seamEdge)
  const length = Math.hypot(a[0] - b[0], a[1] - b[1])
  const u: Point2 = [(a[0] - b[0]) / length, (a[1] - b[1]) / length]
  /* 0 - x rather than -x: a negated zero is -0, which is not toEqual(0) */
  return { origin: b, u, v: [0 - u[1], u[0]] }
}

export function pointToParent(frame: SeamFrame, point: Point2): Point2 {
  return [
    frame.origin[0] + point[0] * frame.u[0] + point[1] * frame.v[0],
    frame.origin[1] + point[0] * frame.u[1] + point[1] * frame.v[1],
  ]
}

export function pointToChild(frame: SeamFrame, point: Point2): Point2 {
  const du = point[0] - frame.origin[0]
  const dv = point[1] - frame.origin[1]
  return [du * frame.u[0] + dv * frame.u[1], du * frame.v[0] + dv * frame.v[1]]
}

/**
 * Which way is up the plywood, in this face's own frame. The root's v axis is
 * up; each seam turns the frame, so a face hinged on a vertical seam finds up
 * along its own u axis. Structural, so exact for the square seams a cut makes.
 */
export function sheetUp(tree: FaceTree, faceId: string): Point2 {
  const face = getFace(tree, faceId)
  if (face.parentId === null || face.seamEdge === null) return [0, 1]

  const parent = getFace(tree, face.parentId)
  const up = sheetUp(tree, parent.id)
  const frame = seamFrame(parent, face.seamEdge)
  return [up[0] * frame.u[0] + up[1] * frame.u[1], up[0] * frame.v[0] + up[1] * frame.v[1]]
}

export type SeamOrientation = 'floor' | 'horizontal' | 'vertical' | 'diagonal'

/** Seams within this many degrees of square are treated as square */
const SQUARE_BAND_DEG = 15

/** How a face's seam runs on the plywood, which decides what its bend is called */
export function seamOrientation(tree: FaceTree, faceId: string): SeamOrientation {
  const face = getFace(tree, faceId)
  if (face.parentId === null || face.seamEdge === null) return 'floor'

  const parent = getFace(tree, face.parentId)
  const up = sheetUp(tree, parent.id)
  const frame = seamFrame(parent, face.seamEdge)
  const alongUp = Math.abs(up[0] * frame.u[0] + up[1] * frame.u[1])

  if (alongUp > Math.cos((SQUARE_BAND_DEG * Math.PI) / 180)) return 'vertical'
  if (alongUp < Math.sin((SQUARE_BAND_DEG * Math.PI) / 180)) return 'horizontal'
  return 'diagonal'
}

/** Total plywood across every face, in cm^2. Invariant under cutting and bending. */
export function computeSurfaceArea(tree: FaceTree): number {
  return listFaces(tree).reduce((total, face) => total + outlineArea(face.outline), 0)
}
