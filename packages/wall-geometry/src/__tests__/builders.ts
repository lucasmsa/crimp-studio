import type { FaceTree, Point2 } from '../faceTree'
import { edgeLength, getFace, rectOutline } from '../faceTree'

export const PANEL = '#E8D5B7'

/** Edge indices of an outline made by rectOutline */
export const RECT = { bottom: 0, right: 1, top: 2, left: 3 } as const

/**
 * Hinges a rectangular face on one edge of its parent, the way a cut does. The
 * face runs the whole edge and stands `out` cm off it.
 */
export function attach(
  tree: FaceTree,
  parentId: string,
  seamEdge: number,
  out: number,
  angle = 0,
): { tree: FaceTree; id: string } {
  const parent = getFace(tree, parentId)
  return attachOutline(tree, parentId, seamEdge, rectOutline(edgeLength(parent.outline, seamEdge), out), angle)
}

/** Hinges a face with the given outline, already in its own frame, on an edge of its parent */
export function attachOutline(
  tree: FaceTree,
  parentId: string,
  seamEdge: number,
  outline: Point2[],
  angle = 0,
): { tree: FaceTree; id: string } {
  const parent = getFace(tree, parentId)
  const id = `face_${Object.keys(tree.byId).length}`

  return {
    id,
    tree: {
      rootId: tree.rootId,
      byId: {
        ...tree.byId,
        [parentId]: { ...parent, childIds: [...parent.childIds, id] },
        [id]: { id, parentId, seamEdge, outline, angle, color: PANEL, childIds: [] },
      },
    },
  }
}
