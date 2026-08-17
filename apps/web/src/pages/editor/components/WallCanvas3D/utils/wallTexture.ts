import * as THREE from 'three'

const PIXELS_PER_METER = 256
/** Plywood sheets are 1.22m (4ft) square, so seams land every 1.22m */
export const PANEL_WIDTH_M = 1.22
/** Real walls drill T-nuts on a 6 inch grid, which fits a sheet exactly 8 times */
const TNUTS_PER_PANEL = 8

/**
 * One plywood sheet: white base (so the material color tints it), a T-nut grid
 * and the seam along two edges. Every face samples this same tile with its own
 * offset, so the grid runs continuously across a seam instead of restarting at
 * each panel's edge.
 */
function createPlywoodTile(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(PANEL_WIDTH_M * PIXELS_PER_METER)
  canvas.height = canvas.width
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  /* Seam along the left and bottom edges; tiling turns them into the grid of
     sheet joins across the whole wall */
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.13)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(1.5, 0)
  ctx.lineTo(1.5, canvas.height)
  ctx.moveTo(0, canvas.height - 1.5)
  ctx.lineTo(canvas.width, canvas.height - 1.5)
  ctx.stroke()

  const spacing = canvas.width / TNUTS_PER_PANEL
  const radius = 0.008 * PIXELS_PER_METER
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
  for (let y = spacing / 2; y < canvas.height; y += spacing) {
    for (let x = spacing / 2; x < canvas.width; x += spacing) {
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

let sharedTile: THREE.CanvasTexture | null = null

/**
 * The one plywood texture, shared by every panel. Each panel carries its own
 * phase in its UVs instead of in a texture clone: clones share their image, so
 * the first one disposed takes the pixels away from all the others and the
 * panels render blank.
 */
export function getPlywoodTexture(): THREE.CanvasTexture {
  if (!sharedTile) sharedTile = createPlywoodTile()
  return sharedTile
}
