import { useCallback } from 'react'
import type { Hold } from '@/stores/wallStore'
import { useWallStore } from '@/stores/wallStore'
import { getNextRotation } from '../utils/holdActions'

export function useHoldActions(hold: Hold) {
  const { updateHold, removeHold } = useWallStore()

  const handleRotate = useCallback(() => {
    updateHold(hold.id, { rotation: getNextRotation(hold.rotation) })
  }, [hold.id, hold.rotation, updateHold])

  const handleDelete = useCallback(() => {
    removeHold(hold.id)
  }, [hold.id, removeHold])

  return { handleRotate, handleDelete }
}
