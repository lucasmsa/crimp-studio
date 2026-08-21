import { colors } from '@/lib/colors'
import { useResolvedTheme } from '@/stores/theme'

/**
 * The room the wall stands in: the two ends of the gradient behind it, and the
 * colour an unfocused panel or hold fades toward.
 *
 * The scene has no stylesheet, so this reads the resolved theme rather than a CSS
 * token, which also keeps one source for both the canvas and the fade.
 */
export function useSceneRoom() {
  return colors.scene.room[useResolvedTheme()]
}
