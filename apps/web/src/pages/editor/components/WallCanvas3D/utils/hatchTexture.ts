import * as THREE from 'three'
import { colors } from '@/lib/colors'

/** One tile of hatching covers this much plywood, in metres */
const HATCH_TILE_M = 0.2
const TILE_PX = 64
const LINE_PX = 3
const LINES_PER_TILE = 4

let cached: THREE.CanvasTexture | null = null

/**
 * Diagonal hatching for plywood that is about to leave the wall. Transparent
 * between the lines so the panel shows through, and tinted by the material
 * that carries it, so one texture serves the ink and the red.
 */
export function getHatchTexture(): THREE.CanvasTexture {
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = TILE_PX
  canvas.height = TILE_PX
  const context = canvas.getContext('2d')!

  context.strokeStyle = colors.wall.surface
  context.lineWidth = LINE_PX
  context.lineCap = 'butt'
  const spacing = TILE_PX / LINES_PER_TILE
  /* Lines run corner to corner; the extra pair either side keeps the tile
     seamless where a line crosses its edge */
  for (let offset = -TILE_PX; offset <= 2 * TILE_PX; offset += spacing) {
    context.beginPath()
    context.moveTo(offset, 0)
    context.lineTo(offset + TILE_PX, TILE_PX)
    context.stroke()
  }

  cached = new THREE.CanvasTexture(canvas)
  cached.wrapS = THREE.RepeatWrapping
  cached.wrapT = THREE.RepeatWrapping
  cached.repeat.set(1 / HATCH_TILE_M, 1 / HATCH_TILE_M)
  return cached
}
