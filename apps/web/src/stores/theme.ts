import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

/** System first, so the app opens as the machine asks and a choice is deliberate */
const THEME_ORDER: Theme[] = ['system', 'light', 'dark']

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  /** Steps to the next theme, which is what a single control offers */
  cycleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      cycleTheme: () => {
        const next =
          THEME_ORDER[(THEME_ORDER.indexOf(get().theme) + 1) % THEME_ORDER.length]
        set({ theme: next })
        applyTheme(next)
      },
    }),
    {
      name: 'crimp-studio-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme)
        }
      },
    }
  )
)

function applyTheme(theme: Theme) {
  const root = document.documentElement

  if (theme === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * The theme actually in effect. 'system' is a preference rather than a look, and
 * anything picking a colour in JavaScript (the 3D scene, which has no
 * stylesheet) needs the look.
 */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useThemeStore((state) => state.theme)
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia(DARK_QUERY).matches,
  )

  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY)
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches)

    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  if (theme !== 'system') return theme
  return systemPrefersDark ? 'dark' : 'light'
}
