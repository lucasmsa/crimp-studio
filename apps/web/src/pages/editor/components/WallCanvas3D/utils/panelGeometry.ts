import * as THREE from 'three'
import type { Point2 } from '@crimp-studio/wall-geometry'
import { CM_TO_M, WALL_DEPTH } from '@crimp-studio/wall-geometry'

/**
 * A panel as plywood: its outline at the surface, z = 0 in the face frame,
 * extruded backwards through the sheet's thickness. Built in the face frame
 * itself, so a pointer hit converts to face coordinates with no offset. The
 * extrusion leaves metre-space UVs, which the plywood tile is laid over.
 */
export function panelGeometry(outline: Point2[]): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(panelShape(outline), {
    depth: WALL_DEPTH,
    bevelEnabled: false,
  })
  geometry.translate(0, 0, -WALL_DEPTH)
  return geometry
}

/** The outline as a flat shape in metres, for surfaces drawn on the panel */
export function panelShape(outline: Point2[]): THREE.Shape {
  return new THREE.Shape(outline.map(([u, v]) => new THREE.Vector2(u * CM_TO_M, v * CM_TO_M)))
}
