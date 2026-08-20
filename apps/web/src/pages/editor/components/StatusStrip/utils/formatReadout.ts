import type { WallProfile } from '../../WallCanvas3D/utils/faceProfile'

const CM_PER_M = 100
const CM2_PER_M2 = 10_000

export interface WallReadout {
  /** Floor to the highest point, metres */
  height: string
  /** Floor space the profile occupies, metres */
  depth: string
  /** Plywood across every panel, square metres */
  plywood: string
}

/**
 * The profile in the units a gym talks in. Centimetres are the store's unit
 * because holds are placed in them; a wall is discussed in metres.
 */
export function formatWallReadout(profile: WallProfile): WallReadout {
  return {
    height: (profile.heightCm / CM_PER_M).toFixed(2),
    depth: (profile.depthCm / CM_PER_M).toFixed(2),
    plywood: (profile.surfaceAreaCm2 / CM2_PER_M2).toFixed(1),
  }
}
