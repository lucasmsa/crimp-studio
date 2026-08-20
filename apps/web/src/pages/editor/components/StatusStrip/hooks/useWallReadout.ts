import { useMemo } from 'react'
import { useWallStore } from '@/stores/wallStore'
import { computeFaceTransforms } from '../../WallCanvas3D/utils/faceTransform'
import { computeWallProfile } from '../../WallCanvas3D/utils/faceProfile'
import { formatWallReadout } from '../utils/formatReadout'

/** What the wall currently measures, plus what is on it */
export function useWallReadout() {
  const { wall } = useWallStore()

  /* The settled tree, not the animating one: a number that ticks through the
     bend is unreadable, and the spring lands on this value anyway */
  const readout = useMemo(() => {
    const transforms = computeFaceTransforms(wall.faces)
    return formatWallReadout(computeWallProfile(wall.faces, transforms))
  }, [wall.faces])

  return {
    readout,
    holdCount: wall.holds.length,
    panelCount: Object.keys(wall.faces.byId).length,
  }
}
