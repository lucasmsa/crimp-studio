/**
 * Where the selected thing sits on screen, in pixels inside the canvas.
 *
 * The card that controls a selection is pinned to a corner, and a line runs from
 * it to whatever is selected. The line lives in DOM over the canvas while the
 * point it aims at lives in the scene, so the scene writes the projected point
 * here and the line reads it. A mutable box rather than state: the projection
 * changes every frame the camera moves, and neither side wants a re-render for
 * that.
 */
export interface SelectionAnchorPoint {
  x: number
  y: number
  /** False while nothing is selected, or the anchor sits behind the camera */
  onScreen: boolean
}

export const selectionAnchor: SelectionAnchorPoint = { x: 0, y: 0, onScreen: false }

export function publishSelectionAnchor(x: number, y: number, onScreen: boolean): void {
  selectionAnchor.x = x
  selectionAnchor.y = y
  selectionAnchor.onScreen = onScreen
}
