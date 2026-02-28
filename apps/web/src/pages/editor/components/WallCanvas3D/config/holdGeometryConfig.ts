import type { HoldType } from '@/stores/wallStore'

export interface HoldGeometryConfig {
  /** Multiplier applied to the hold's base size for geometry generation */
  sizeMultiplier: number
}

export const holdGeometryConfigs: Record<HoldType, HoldGeometryConfig> = {
  jug: { sizeMultiplier: 1.4 },
  crimp: { sizeMultiplier: 0.8 },
  sloper: { sizeMultiplier: 1.6 },
  pinch: { sizeMultiplier: 1.0 },
  pocket: { sizeMultiplier: 0.9 },
  volume: { sizeMultiplier: 2.0 },
}
