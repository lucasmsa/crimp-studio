import * as THREE from 'three'

const PIXELS_PER_METER = 256
/** Real climbing walls drill T-nuts on a ~15cm grid */
const TNUT_SPACING_M = 0.15
/** Plywood sheets are 1.22m (4ft) wide, so seams land every 1.22m */
const PANEL_WIDTH_M = 1.22

/**
 * Procedural wall map: white base (so material color tints it), T-nut hole
 * grid, and plywood panel seams. Shared by both scene styles.
 */
export function createWallTexture(widthM: number, heightM: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(widthM * PIXELS_PER_METER)
  canvas.height = Math.round(heightM * PIXELS_PER_METER)
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  /* Panel seams: thin vertical lines every plywood-sheet width */
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.13)'
  ctx.lineWidth = 3
  for (let x = PANEL_WIDTH_M; x < widthM; x += PANEL_WIDTH_M) {
    const px = x * PIXELS_PER_METER
    ctx.beginPath()
    ctx.moveTo(px, 0)
    ctx.lineTo(px, canvas.height)
    ctx.stroke()
  }

  /* T-nut grid: small recessed holes, offset half a cell from the edges */
  const spacing = TNUT_SPACING_M * PIXELS_PER_METER
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
  return texture
}
