import type { FaceTree } from '@crimp-studio/wall-geometry'
import { holdPlacementIsClear } from '@crimp-studio/wall-geometry'
import type { CollisionBox, Hold, HoldType } from '@/stores/wallStore'
import {
  measureHoldFootprint,
  measureWorstCaseFootprint,
} from '../../WallCanvas3D/utils/holdFootprint'
import { refitHold } from '../../WallCanvas3D/utils/holdRefit'

/**
 * Whether a hold on the wall could become this type.
 *
 * Tested against the box that contains every model of the type rather than any
 * one of them, so a type is offered only when whichever model it lands on will
 * fit. That is what lets the click and a later random roll both be safe, and it
 * is why a type is sometimes greyed out where a smaller model of it would have
 * gone in (ADR-008).
 */
export function typeChangeFits(
  faces: FaceTree,
  holds: Hold[],
  hold: Hold,
  type: HoldType,
): boolean {
  return fitsWearing(
    faces,
    holds,
    hold,
    measureWorstCaseFootprint(type, hold.size, hold.rotation),
    { type },
  )
}

/** Whether a hold could take this model of its own type where it sits */
export function variantChangeFits(
  faces: FaceTree,
  holds: Hold[],
  hold: Hold,
  variant: string,
): boolean {
  return fitsWearing(
    faces,
    holds,
    hold,
    measureHoldFootprint(hold.type, variant, hold.size, hold.rotation),
    { variant },
  )
}

function fitsWearing(
  faces: FaceTree,
  holds: Hold[],
  hold: Hold,
  box: CollisionBox,
  changes: Partial<Hold>,
): boolean {
  return holdPlacementIsClear(faces, holds, refitHold(faces, hold, box, changes))
}
