interface HoldVisualState {
  scale: number
  emissiveIntensity: number
  colorOverride?: string
  opacity: number
}

const selectedState: HoldVisualState = {
  scale: 1.06,
  emissiveIntensity: 0.25,
  opacity: 1,
}

const hoveredState: HoldVisualState = {
  scale: 1.03,
  emissiveIntensity: 0.1,
  opacity: 1,
}

const defaultState: HoldVisualState = {
  scale: 1,
  emissiveIntensity: 0,
  opacity: 1,
}

/**
 * Collision state: hold keeps its original scale, goes semi-transparent
 * with a strong red emissive glow so it clearly reads as "warning/error"
 * rather than just a red-colored hold.
 */
const collidingState: HoldVisualState = {
  scale: 1,
  emissiveIntensity: 0.6,
  colorOverride: '#EF4444',
  opacity: 0.4,
}

interface HoldVisualOptions {
  isSelected: boolean
  isHovered: boolean
  isColliding?: boolean
}

export function getHoldVisualState({ isSelected, isHovered, isColliding }: HoldVisualOptions): HoldVisualState {
  if (isColliding) return collidingState
  if (isSelected) return selectedState
  if (isHovered) return hoveredState
  return defaultState
}
