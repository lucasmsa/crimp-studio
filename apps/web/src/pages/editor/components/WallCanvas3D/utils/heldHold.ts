import type { HeldHold, Hold } from '@/stores/wallStore'

/**
 * The holds as they are being seen, which is not quite where they are.
 *
 * A hold under the pointer is drawn where the pointer has it, including on a
 * panel it has not been given to yet, while the wall itself still has it at the
 * last spot it fitted (ADR-007, amended).
 */
export function heldHoldsOnFace(holds: Hold[], held: HeldHold | null, faceId: string): Hold[] {
  if (!held) return holds.filter((hold) => hold.faceId === faceId)

  const carried = holds.find((hold) => hold.id === held.id)
  const others = holds.filter((hold) => hold.id !== held.id && hold.faceId === faceId)
  if (!carried || held.faceId !== faceId) return others

  return [...others, { ...carried, faceId: held.faceId, u: held.u, v: held.v }]
}

/**
 * The holds saying they are in the way: the one being carried, and whatever it
 * is sitting on. Both ends, so a crowded wall says which neighbour is the
 * problem rather than only that there is one.
 */
export function heldHoldWarnings(held: HeldHold | null): string[] {
  if (!held || held.clear) return []

  return [held.id, ...held.blockedHoldIds]
}
