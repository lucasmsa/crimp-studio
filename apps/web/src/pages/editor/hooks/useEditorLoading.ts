import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

/**
 * Tracks the hold-model preload (drei's global loading manager) for the
 * editor entry overlay. Ready = no active loads for a 400ms grace window,
 * which covers both the pre-start gap and the fully-cached case where
 * no load ever becomes active.
 */
export function useEditorLoading() {
  const { active, progress } = useProgress()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (active) return
    const timer = setTimeout(() => setReady(true), 400)
    return () => clearTimeout(timer)
  }, [active])

  return { ready, progress: Math.round(progress) }
}
