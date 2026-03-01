import type { HoldType } from '@/stores/wallStore'

export interface HoldGeometryConfig {
  /** Multiplier applied to the hold's base size for geometry generation */
  sizeMultiplier: number
  /** Z-offset from wall surface (meters). 0 = geometry center at wall face (half embeds, half protrudes) */
  zOffset: number
}

export const holdGeometryConfigs: Record<HoldType, HoldGeometryConfig> = {
  jug: { sizeMultiplier: 1.4, zOffset: 0 },
  crimp: { sizeMultiplier: 1.1, zOffset: 0 },
  sloper: { sizeMultiplier: 1.3, zOffset: 0 },
  pinch: { sizeMultiplier: 0.7, zOffset: 0 },
  pocket: { sizeMultiplier: 1.2, zOffset: 0 },
  volume: { sizeMultiplier: 2.0, zOffset: 0 },
}
