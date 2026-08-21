import { useTranslation } from 'react-i18next'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/stores/theme'
import { Button } from '@/components/ui/button'

const ICONS = { system: Monitor, light: Sun, dark: Moon } as const

/** One control that steps through system, light and dark */
export function ThemeToggle() {
  const { t } = useTranslation()
  const theme = useThemeStore((state) => state.theme)
  const cycleTheme = useThemeStore((state) => state.cycleTheme)

  const Icon = ICONS[theme]

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={cycleTheme}
      aria-label={t('common.theme.label', { theme: t(`common.theme.${theme}`) })}
      title={t('common.theme.label', { theme: t(`common.theme.${theme}`) })}
      data-testid="theme-toggle"
      data-theme-choice={theme}
    >
      <Icon size={15} aria-hidden />
    </Button>
  )
}
