/** The child edge glued to its parent. A face hinges on exactly one edge. */
export type HingeEdge = 'bottom' | 'left'

export interface WallFace {
  id: string
  /** null only for the root face */
  parentId: string | null
  /** null only for the root face */
  hinge: HingeEdge | null
  /** cm along u (across the face) */
  width: number
  /** cm along v (up the face) */
  height: number
  /** degrees about the hinge axis, relative to the parent */
  angle: number
  /** Paint on this panel alone, so a wall can be two tones the way gyms are */
  color: string
  childIds: string[]
}

export interface FaceTree {
  rootId: string
  byId: Record<string, WallFace>
}

const createFaceId = () => `face_${Math.random().toString(36).substring(2, 9)}`

export function createRootFaceTree(width: number, height: number, color: string): FaceTree {
  const root: WallFace = {
    id: createFaceId(),
    parentId: null,
    hinge: null,
    width,
    height,
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

/**
 * Where a face sits on the unrolled plywood, in cm from the sheet's bottom-left.
 * Bending never changes this, which is what keeps the T-nut grid continuous
 * across a seam once faces are textured independently.
 */
export function computeFaceSheetOrigin(tree: FaceTree, faceId: string): { u0: number; v0: number } {
  let u0 = 0
  let v0 = 0
  let face = getFace(tree, faceId)

  while (face.parentId) {
    const parent = getFace(tree, face.parentId)
    if (face.hinge === 'bottom') v0 += parent.height
    else u0 += parent.width
    face = parent
  }

  return { u0, v0 }
}

/** Total plywood across every face, in cm^2. Invariant under cutting and bending. */
export function computeSurfaceArea(tree: FaceTree): number {
  return listFaces(tree).reduce((total, face) => total + face.width * face.height, 0)
}
