import * as THREE from 'three'
import type { WallPanel } from '@/stores/wallStore'
import { CM_TO_M, WALL_DEPTH } from '../constants/editor3d'

export interface PanelLayout {
  panelId: string
  /** World position of the panel's center */
  position: THREE.Vector3
  /** Euler rotation to apply */
  rotation: THREE.Euler
  /** Width in meters */
  width: number
  /** Height in meters */
  height: number
}

/**
 * Calculate world-space position and rotation for each panel.
 *
 * Panels stack bottom-to-top. Each panel's bottom edge connects
 * to the previous panel's top edge. The angle determines the tilt:
 *  - 0° = vertical (facing viewer)
 *  - positive = overhang (top tilts toward viewer)
 *  - negative = slab (top tilts away from viewer)
 *
 * We walk along the chain, accumulating position using the direction
 * each panel's surface faces and its height.
 */
export function calculatePanelLayouts(panels: WallPanel[]): PanelLayout[] {
  const layouts: PanelLayout[] = []

  // Current "cursor" position — the point where the next panel's bottom edge starts
  let cursorPos = new THREE.Vector3(0, 0, 0)
  // Accumulated angle from vertical (radians). 0 = straight up.
  let accumulatedAngle = 0

  for (const panel of panels) {
    const widthM = panel.width * CM_TO_M
    const heightM = panel.height * CM_TO_M
    const angleRad = THREE.MathUtils.degToRad(panel.angle)

    // This panel's rotation from vertical
    // Positive angle = overhang, which rotates the panel's top toward the viewer (+Z)
    accumulatedAngle += angleRad

    // Direction the panel extends (from bottom edge to top edge)
    // At 0 accumulated angle: straight up (0, 1, 0)
    // With overhang: the top curves toward +Z
    const upDir = new THREE.Vector3(
      0,
      Math.cos(accumulatedAngle),
      Math.sin(accumulatedAngle)
    )

    // Panel center is halfway along its height from the cursor
    const center = cursorPos.clone().add(upDir.clone().multiplyScalar(heightM / 2))

    // The panel face normal points outward (toward viewer in the un-rotated case)
    // Rotation: the panel is rotated around X-axis by the accumulated angle
    const rotation = new THREE.Euler(-accumulatedAngle, 0, 0)

    layouts.push({
      panelId: panel.id,
      position: center,
      rotation,
      width: widthM,
      height: heightM,
    })

    // Move cursor to the top edge of this panel
    cursorPos = cursorPos.clone().add(upDir.clone().multiplyScalar(heightM))
  }

  return layouts
}

/**
 * Calculate the bounding box center of all panels for camera targeting.
 */
export function getWallCenter(layouts: PanelLayout[]): THREE.Vector3 {
  if (layouts.length === 0) return new THREE.Vector3(0, 0, 0)

  const box = new THREE.Box3()

  for (const layout of layouts) {
    const halfW = layout.width / 2
    const halfH = layout.height / 2

    // Approximate panel bounding box using corner points
    const corners = [
      new THREE.Vector3(-halfW, -halfH, 0),
      new THREE.Vector3(halfW, -halfH, 0),
      new THREE.Vector3(-halfW, halfH, 0),
      new THREE.Vector3(halfW, halfH, 0),
      new THREE.Vector3(-halfW, -halfH, WALL_DEPTH),
      new THREE.Vector3(halfW, halfH, WALL_DEPTH),
    ]

    for (const corner of corners) {
      corner.applyEuler(layout.rotation)
      corner.add(layout.position)
      box.expandByPoint(corner)
    }
  }

  return box.getCenter(new THREE.Vector3())
}

/**
 * Calculate a good camera distance to frame the entire wall.
 */
export function getCameraDistance(layouts: PanelLayout[], fov: number): number {
  if (layouts.length === 0) return 6

  const box = new THREE.Box3()

  for (const layout of layouts) {
    const halfW = layout.width / 2
    const halfH = layout.height / 2

    const corners = [
      new THREE.Vector3(-halfW, -halfH, 0),
      new THREE.Vector3(halfW, -halfH, 0),
      new THREE.Vector3(-halfW, halfH, 0),
      new THREE.Vector3(halfW, halfH, 0),
    ]

    for (const corner of corners) {
      corner.applyEuler(layout.rotation)
      corner.add(layout.position)
      box.expandByPoint(corner)
    }
  }

  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y)
  const fovRad = THREE.MathUtils.degToRad(fov)

  // Distance to fit the wall in view with some padding
  return (maxDim / (2 * Math.tan(fovRad / 2))) * 1.3
}
