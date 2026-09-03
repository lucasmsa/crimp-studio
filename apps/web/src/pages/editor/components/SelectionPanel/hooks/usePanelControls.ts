import { useMemo } from 'react'
import { useWallStore } from '@/stores/wallStore'
import {
  computeFaceTransforms,
  faceAngleIsClear,
  faceSteepness,
  getFace,
  seamOrientation,
} from '@crimp-studio/wall-geometry'
import { canMergeIntoParent } from '../../WallCanvas3D/utils/faceCut'
import {
  clampFaceAngle,
  getAngleLimits,
  getFaceAnglePresets,
  speaksSteepness,
  stepFaceAngle,
} from '../../WallCanvas3D/config/faceAngleConfig'
import { getSeamLabelKey } from '../../WallCanvas3D/utils/panelSeam'

/** Half degrees, because a bend stopped at contact lands between the whole ones */
const toHalfDegrees = (degrees: number) => Math.round(degrees * 2) / 2

/**
 * Everything the panel popover needs about the selected panel: the bend it is
 * set to and the steepness that produces, which seam the bend is about, why a
 * merge is refused, and its paint (ADR-010). Cutting is a drag on the wall,
 * not a button here (ADR-011).
 */
export function usePanelControls() {
  const { wall, selectedFaceId, setFaceAngle, setFaceColor, removeFace } = useWallStore()

  const face = selectedFaceId ? getFace(wall.faces, selectedFaceId) : null

  const measured = useMemo(() => {
    if (!face) return { bend: 0, steepness: 0, parentSteepness: 0 }
    const transforms = computeFaceTransforms(wall.faces)
    return {
      bend: toHalfDegrees(face.angle),
      steepness: toHalfDegrees(faceSteepness(transforms[face.id])),
      parentSteepness: face.parentId ? faceSteepness(transforms[face.parentId]) : 0,
    }
  }, [wall.faces, face])

  const orientation = face ? seamOrientation(wall.faces, face.id) : 'floor'
  const inSteepness = speaksSteepness(orientation)
  const limits = getAngleLimits(face?.parentId === null)

  /* On a level seam the control speaks in steepness from vertical, which is
     what the gym says; the bend that produces it is the steepness less the
     parent's own. On any other seam the bend is the number */
  const toBend = (value: number) =>
    inSteepness ? clampFaceAngle(value, limits) - measured.parentSteepness : clampFaceAngle(value, limits)
  const spoken = inSteepness ? measured.steepness : measured.bend

  /* A preset the wall cannot reach is offered as disabled rather than as a
     button that quietly does something else (ADR-007) */
  const presets = getFaceAnglePresets(orientation).map((preset) => ({
    ...preset,
    selected: spoken === preset.angle,
    reachable:
      Boolean(face) &&
      preset.angle >= limits.min &&
      preset.angle <= limits.max &&
      faceAngleIsClear(wall.faces, wall.holds, face!.id, toBend(preset.angle)),
  }))

  return {
    face,
    bend: measured.bend,
    steepness: measured.steepness,
    presets,
    /* One face owns one hinge, so the seam its angle drives is a readout and
       not a choice: the popover says which one is moving */
    seamLabelKey: getSeamLabelKey(orientation),
    canRemove: Boolean(face?.parentId),
    /* A piece that no longer spans the edge it hinges on would merge into an L,
       which is not a panel (ADR-010) */
    canMerge: Boolean(face?.parentId) && canMergeIntoParent(wall.faces, face!.id),
    setAngle: (angle: number) => face && setFaceAngle(face.id, toBend(angle)),
    stepAngle: (direction: 1 | -1, coarse: boolean) =>
      face && setFaceAngle(face.id, toBend(stepFaceAngle(spoken, direction, coarse, limits))),
    setColor: (color: string) => face && setFaceColor(face.id, color),
    remove: () => face && removeFace(face.id),
  }
}
