import { colors } from '@/lib/colors'

interface HoldStyleConfig {
  stroke: string
  strokeWidth: number
  shadowColor: string
  shadowBlur: number
}

const selectedStyle: HoldStyleConfig = {
  stroke: colors.primary,
  strokeWidth: 3,
  shadowColor: colors.primary,
  shadowBlur: 10,
}

const unselectedStyle: HoldStyleConfig = {
  stroke: 'transparent',
  strokeWidth: 0,
  shadowColor: 'transparent',
  shadowBlur: 0,
}

export const getHoldStyle = (isSelected: boolean): HoldStyleConfig => {
  return isSelected ? selectedStyle : unselectedStyle
}
