import { useMemo } from 'react'
import { useWallStore } from '@/stores/wallStore'
import { getFace } from '../utils/faceTree'
import { computeFaceTransforms, getFaceTilt } from '../utils/faceTransform'
import { canCutFace, findCutPosition, MIN_FACE_SIZE } from '../utils/faceCut'
import type { CutAxis, CutCheck } from '../utils/faceCut'
import { getAngleLimits, getFaceAnglePresets, stepFaceAngle } from '../config/faceAngleConfig'
import { getSeamLabelKey } from '../utils/panelSeam'

/**
 * Everything the panel popover needs about the selected panel: its angle in the
 * terms its hinge speaks, which seam that angle drives, where a cut would land,
 * why a cut is refused, and its paint.
 */
export function usePanelControls() {
  const {
    wall,
    selectedFaceId,
    faceCutPoint,
    setFaceAngle,
    setFaceColor,
    cutFace,
    removeFace,
  } = useWallStore()

  const face = selectedFaceId ? getFace(wall.faces, selectedFaceId) : null

  /* A left-hinged panel yaws around a vertical seam, and yaw has no reading as
     tilt from vertical, so it shows its own angle instead */
  const tilt = useMemo(() => {
    if (!selectedFaceId || !face) return 0
    if (face.hinge === 'left') return Math.round(face.angle)
    return Math.round(getFaceTilt(computeFaceTransforms(wall.faces)[selectedFaceId]))
  }, [wall.faces, selectedFaceId, face])

  /** Where the last tap landed on this panel, or its middle if it has none yet */
  const aimedAt = (axis: CutAxis): number => {
    if (!face) return 0
    const extent = axis === 'across' ? face.height : face.width
    if (!faceCutPoint || faceCutPoint.faceId !== face.id) return extent / 2

    const tapped = axis === 'across' ? faceCutPoint.v : faceCutPoint.u
    return Math.max(MIN_FACE_SIZE, Math.min(extent - MIN_FACE_SIZE, tapped))
  }

  const cutAt = (axis: CutAxis): number | null =>
    face ? findCutPosition(wall.faces, wall.holds, face.id, axis, aimedAt(axis)) : null

  const check = (axis: CutAxis): CutCheck => {
    if (!face) return { ok: false, blockingHoldIds: [] }
    const at = cutAt(axis)
    return at === null
      ? canCutFace(wall.faces, wall.holds, face.id, axis, aimedAt(axis))
      : { ok: true, blockingHoldIds: [] }
  }

  const cuts: Record<CutAxis, CutCheck> = { across: check('across'), up: check('up') }
  const limits = getAngleLimits(face?.parentId === null)

  return {
    face,
    tilt,
    limits,
    presets: getFaceAnglePresets(face?.hinge ?? null),
    /* One face owns one hinge, so the seam its angle drives is a readout and
       not a choice: the popover says which one is moving */
    seamLabelKey: getSeamLabelKey(face?.hinge ?? null),
    cuts,
    canRemove: Boolean(face?.parentId),
    setAngle: (angle: number) => face && setFaceAngle(face.id, angle),
    stepAngle: (direction: 1 | -1, coarse: boolean) =>
      face && setFaceAngle(face.id, stepFaceAngle(tilt, direction, coarse, limits)),
    setColor: (color: string) => face && setFaceColor(face.id, color),
    cut: (axis: CutAxis) => {
      if (!face) return
      const at = cutAt(axis)
      if (at !== null) cutFace(face.id, axis, at)
    },
    remove: () => face && removeFace(face.id),
  }
}
