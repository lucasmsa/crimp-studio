/**
 * Core domain types for Crimp Studio
 */

/* Wall */

export interface Wall {
  id: string
  name: string

  // Plywood dimensions in centimeters; bending preserves these
  width: number
  height: number

  // Flat panels hinged into a profile (ADR-006). One root face = a flat wall
  faces: FaceTree

  wallColor: string

  holds: Hold[]

  createdAt: Date
  updatedAt: Date
}

// The child edge glued to its parent
export type HingeEdge = 'bottom' | 'left'

export interface WallFace {
  id: string
  parentId: string | null
  hinge: HingeEdge | null

  // Face dimensions in centimeters
  width: number
  height: number

  // Degrees about the hinge axis, relative to the parent.
  // 0 = flush with the parent, negative = slab, positive = overhang, 90 = roof
  angle: number

  childIds: string[]
}

export interface FaceTree {
  rootId: string
  byId: Record<string, WallFace>
}

/* Holds */

// jug = big friendly hold, crimp = small edge, sloper = round friction hold
// pinch = thumb opposition, pocket = finger holes, volume = large 3D shape
export type HoldType = 'jug' | 'crimp' | 'sloper' | 'pinch' | 'pocket' | 'volume'

export interface Hold {
  id: string
  type: HoldType

  // The face this hold is bolted to
  faceId: string

  // Position from that face's bottom-left corner (cm)
  u: number
  v: number

  rotation?: number
  size: number

  // Optional per-hold color override (hex string)
  color?: string

  // GLB model variant for this hold; undefined = procedural geometry
  variant?: string

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
