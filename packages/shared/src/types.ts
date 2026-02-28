/**
 * Core domain types for Crimp Studio
 */

/* Wall */

export interface WallPanel {
  id: string

  // Dimensions in centimeters
  width: number
  height: number

  // 0° = vertical, negative = slab (leaning back), positive = overhang, 90° = roof
  angle: number

  holds: Hold[]
}

export interface Wall {
  id: string
  name: string

  // Panels ordered bottom-to-top, joined at edges (like real gym walls)
  panels: WallPanel[]

  createdAt: Date
  updatedAt: Date
}

/* Holds */

// jug = big friendly hold, crimp = small edge, sloper = round friction hold
// pinch = thumb opposition, pocket = finger holes, volume = large 3D shape
export type HoldType = 'jug' | 'crimp' | 'sloper' | 'pinch' | 'pocket' | 'volume'

export interface Hold {
  id: string
  type: HoldType

  // Position from bottom-left corner (cm)
  x: number
  y: number

  rotation?: number
  size: number

  // 1 = neutral, <1 = easier, >1 = harder
  difficultyModifier?: number
}

/* Routes */

// V-scale: VB (beginner) to V17 (elite)
export type VGrade =
  | 'VB' | 'V0' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5'
  | 'V6' | 'V7' | 'V8' | 'V9' | 'V10' | 'V11' | 'V12'
  | 'V13' | 'V14' | 'V15' | 'V16' | 'V17'

export interface Route {
  id: string
  name?: string
  wallId: string

  // Ordered sequence of holds from start to top
  holdSequence: string[]
  startHolds: string[]
  finishHolds: string[]

  grade: VGrade
  gradeConfidence?: number // 0-1, algorithm confidence
  footHolds?: string[]

  createdAt: Date
  generatedBy: 'manual' | 'algorithm'
}

/* Route Generation */

export interface RouteGenerationParams {
  targetGrade: VGrade
  startHoldIds?: string[]
  finishHoldIds?: string[]
  minMoves?: number
  maxMoves?: number
}
