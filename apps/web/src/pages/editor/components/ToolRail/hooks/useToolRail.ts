import { useCallback, useState } from 'react'
import { useWallStore } from '@/stores/wallStore'

/** Collapsed or not outlives the session, so the rail opens the way it was left */
const RAIL_COLLAPSED_KEY = 'crimp.editor.railCollapsed'

export function useToolRail() {
  const { editorMode, setEditorMode, clearHolds } = useWallStore()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(RAIL_COLLAPSED_KEY) === 'true',
  )

  const toggleCollapsed = useCallback(() => {
    setCollapsed((previous) => {
      localStorage.setItem(RAIL_COLLAPSED_KEY, String(!previous))
      return !previous
    })
  }, [])

  return { editorMode, setEditorMode, collapsed, toggleCollapsed, clearHolds }
}
