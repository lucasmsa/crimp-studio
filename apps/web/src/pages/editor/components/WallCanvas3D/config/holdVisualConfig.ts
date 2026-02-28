import { colors } from '@/lib/colors'

interface HoldVisualState {
  scale: number
  emissive: string
  emissiveIntensity: number
}

const selectedState: HoldVisualState = {
  scale: 1.1,
  emissive: colors.primary,
  emissiveIntensity: 0.4,
}

const hoveredState: HoldVisualState = {
  scale: 1.05,
  emissive: '#000000',
  emissiveIntensity: 0,
}

const defaultState: HoldVisualState = {
  scale: 1,
  emissive: '#000000',
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
