interface HoldVisualState {
  scale: number
  emissiveIntensity: number
}

const selectedState: HoldVisualState = {
  scale: 1.06,
  emissiveIntensity: 0.25,
}

const hoveredState: HoldVisualState = {
  scale: 1.03,
  emissiveIntensity: 0.1,
}

const defaultState: HoldVisualState = {
  scale: 1,
  emissiveIntensity: 0,
}

interface HoldVisualOptions {
  isSelected: boolean
  isHovered: boolean
}

export function getHoldVisualState({ isSelected, isHovered }: HoldVisualOptions): HoldVisualState {
  if (isSelected) return selectedState
  if (isHovered) return hoveredState
  return defaultState
}
