import { useCallback } from 'react'
import type { Hold } from '@/stores/wallStore'
import { useWallStore } from '@/stores/wallStore'
import { getNextRotation } from '../utils/holdActions'

export function useHoldActions(hold: Hold) {
  const { updateHold, markHoldDeleting } = useWallStore()

  const handleRotate = useCallback(() => {
    updateHold(hold.id, { rotation: getNextRotation(hold.rotation) })
  }, [hold.id, hold.rotation, updateHold])

  const handleDelete = useCallback(() => {
    markHoldDeleting(hold.id)
  }, [hold.id, markHoldDeleting])

  return { handleRotate, handleDelete }
}
