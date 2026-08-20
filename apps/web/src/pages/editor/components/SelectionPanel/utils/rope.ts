export interface RopePoint {
  x: number
  y: number
  previousX: number
  previousY: number
}

export interface RopeSettings {
  /** Points along the rope, both ends included */
  points: number
  /** Pull downwards, in pixels per second squared */
  gravity: number
  /** How much longer the rope is than the gap it spans, so it hangs slack */
  slack: number
  /** Fraction of speed kept each step, which is what stops it swinging forever */
  damping: number
  /** Passes of length correction per step. More passes, stiffer rope */
  passes: number
}

export const ROPE: RopeSettings = {
  points: 12,
  gravity: 900,
  slack: 1.18,
  damping: 0.94,
  passes: 6,
}

export function createRope(
  from: { x: number; y: number },
  to: { x: number; y: number },
  points = ROPE.points,
): RopePoint[] {
  return Array.from({ length: points }, (_, index) => {
    const along = index / (points - 1)
    const x = from.x + (to.x - from.x) * along
    const y = from.y + (to.y - from.y) * along
    return { x, y, previousX: x, previousY: y }
  })
}

/**
 * Advances a hanging rope one step, with both ends pinned.
 *
 * Verlet integration: a point's speed is wherever it was last frame, so the
 * whole rope needs no velocity bookkeeping and stays stable when the ends are
 * yanked around. Length is not solved exactly but relaxed, a few passes per
 * step, which is what gives it the lag that reads as weight.
 */
export function stepRope(
  rope: RopePoint[],
  from: { x: number; y: number },
  to: { x: number; y: number },
  deltaSeconds: number,
  settings: RopeSettings = ROPE,
): void {
  const step = Math.min(deltaSeconds, 1 / 30)

  for (const point of rope) {
    const velocityX = (point.x - point.previousX) * settings.damping
    const velocityY = (point.y - point.previousY) * settings.damping

    point.previousX = point.x
    point.previousY = point.y
    point.x += velocityX
    point.y += velocityY + settings.gravity * step * step
  }

  const span = Math.hypot(to.x - from.x, to.y - from.y)
  const segment = (span * settings.slack) / (rope.length - 1)

  for (let pass = 0; pass < settings.passes; pass++) {
    pinEnds(rope, from, to)

    for (let i = 0; i < rope.length - 1; i++) {
      const a = rope[i]
      const b = rope[i + 1]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const distance = Math.hypot(dx, dy) || 1
      /* Only pull, never push: a rope goes slack, it does not spring apart */
      if (distance <= segment) continue

      const correction = (distance - segment) / distance / 2
      const shiftX = dx * correction
      const shiftY = dy * correction
      a.x += shiftX
      a.y += shiftY
      b.x -= shiftX
      b.y -= shiftY
    }
  }

  pinEnds(rope, from, to)
}

function pinEnds(
  rope: RopePoint[],
  from: { x: number; y: number },
  to: { x: number; y: number },
): void {
  rope[0].x = from.x
  rope[0].y = from.y
  rope[rope.length - 1].x = to.x
  rope[rope.length - 1].y = to.y
}

/** The rope as an SVG path, smoothed so the segments do not read as a chain */
export function ropePath(rope: RopePoint[]): string {
  const [head, ...rest] = rope
  let path = `M ${round(head.x)} ${round(head.y)}`

  for (let i = 0; i < rest.length - 1; i++) {
    const point = rest[i]
    const next = rest[i + 1]
    path += ` Q ${round(point.x)} ${round(point.y)} ${round((point.x + next.x) / 2)} ${round((point.y + next.y) / 2)}`
  }

  const tail = rest[rest.length - 1]
  return `${path} L ${round(tail.x)} ${round(tail.y)}`
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}
