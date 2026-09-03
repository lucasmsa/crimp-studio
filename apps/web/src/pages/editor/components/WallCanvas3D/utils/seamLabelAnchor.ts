/**
 * Where the cursor end of a seam being drawn sits on screen, in pixels inside
 * the canvas, for the degree readout that follows it. The same arrangement as
 * `selectionAnchor`: the scene projects, the DOM reads, and neither side wants
 * a re-render for a point that moves every frame.
 */
export interface SeamLabelAnchor {
  x: number
  y: number
  /** False while no seam is being drawn, or its end sits behind the camera */
  onScreen: boolean
}

export const seamLabelAnchor: SeamLabelAnchor = { x: 0, y: 0, onScreen: false }

export function publishSeamLabelAnchor(x: number, y: number, onScreen: boolean): void {
  seamLabelAnchor.x = x
  seamLabelAnchor.y = y
  seamLabelAnchor.onScreen = onScreen
}
