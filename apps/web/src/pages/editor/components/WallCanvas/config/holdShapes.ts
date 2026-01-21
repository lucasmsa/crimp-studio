import type { HoldType } from '@/stores/wallStore'

/**
 * Each hold type has a distinct visual shape:
 * - jug: large rounded shape (bucket, easy to grab)
 * - crimp: thin horizontal edge
 * - sloper: wide ellipse (rounded dome)
 * - pinch: narrow vertical shape
 * - pocket: circle with hole (donut)
 * - volume: geometric polygon
 */

export type ShapeType = 'roundedRect' | 'rect' | 'ellipse' | 'ring' | 'polygon'

export interface HoldShapeConfig {
  shape: ShapeType
  // Size multipliers relative to base hold size
  widthMultiplier: number
  heightMultiplier: number
  // Shape-specific props
  cornerRadius?: number
  sides?: number        // for polygon
  innerRadius?: number  // for ring (pocket)
}

export const holdShapeConfigs: Record<HoldType, HoldShapeConfig> = {
  jug: {
    shape: 'roundedRect',
    widthMultiplier: 2,
    heightMultiplier: 1.2,
    cornerRadius: 8,
  },
  crimp: {
    shape: 'rect',
    widthMultiplier: 2.5,
    heightMultiplier: 0.4,
    cornerRadius: 2,
  },
  sloper: {
    shape: 'ellipse',
    widthMultiplier: 2,
    heightMultiplier: 1,
  },
  pinch: {
    shape: 'rect',
    widthMultiplier: 0.6,
    heightMultiplier: 2,
    cornerRadius: 4,
  },
  pocket: {
    shape: 'ring',
    widthMultiplier: 1,
    heightMultiplier: 1,
    innerRadius: 0.4, // 40% of outer radius
  },
  volume: {
    shape: 'polygon',
    widthMultiplier: 2,
    heightMultiplier: 2,
    sides: 5,
  },
}
