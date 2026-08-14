import { useMemo } from 'react'
import { useWallStore } from '@/stores/wallStore'
import { getFace } from '../../WallCanvas3D/utils/faceTree'
import { computeFaceTransforms, getFaceTilt } from '../../WallCanvas3D/utils/faceTransform'
import { canCutFace } from '../../WallCanvas3D/utils/faceCut'
import type { CutAxis } from '../../WallCanvas3D/utils/faceCut'
import { stepFaceAngle } from '../../WallCanvas3D/config/faceAngleConfig'

/**
 * Everything the FACE section needs about the focused panel: its absolute
 * tilt (what the presets speak in), whether each cut is currently legal, and
 * the actions to change it.
 */
export function useFaceSection() {
  const { wall, selectedFaceId, setFaceAngle, cutFace, removeFace } = useWallStore()

  const face = selectedFaceId ? getFace(wall.faces, selectedFaceId) : null

  const tilt = useMemo(() => {
    if (!selectedFaceId) return 0
    return Math.round(getFaceTilt(computeFaceTransforms(wall.faces)[selectedFaceId]))
  }, [wall.faces, selectedFaceId])

  const cuts: Record<CutAxis, boolean> = {
    across: face ? canCutFace(wall.faces, wall.holds, face.id, 'across', face.height / 2).ok : false,
    up: face ? canCutFace(wall.faces, wall.holds, face.id, 'up', face.width / 2).ok : false,
  }

  return {
    face,
    tilt,
    cuts,
    canRemove: Boolean(face?.parentId),
    setAngle: (angle: number) => face && setFaceAngle(face.id, angle),
    stepAngle: (direction: 1 | -1, coarse: boolean) =>
      face && setFaceAngle(face.id, stepFaceAngle(tilt, direction, coarse)),
    /* Cuts land at the middle of the face for now; the seam becomes draggable
       once seam handles exist */
    cut: (axis: CutAxis) =>
      face && cutFace(face.id, axis, axis === 'across' ? face.height / 2 : face.width / 2),
    remove: () => face && removeFace(face.id),
  }
}
