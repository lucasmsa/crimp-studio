import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

/**
 * Inverted-hull outline geometry: vertices displaced along smoothed normals
 * by a world-unit thickness.
 *
 * Scaling a hull about the origin breaks on flat-shaded meshes (uneven rims,
 * cracks at sharp edges). Instead: strip to positions only so welding ignores
 * split per-face normals, weld, average the normals, and bake the offset.
 * One uniform stroke on any geometry, no shader.
 */
export interface OutlineOptions {
  /**
   * Floor for displaced z values. Wall-mounted meshes (base at z=0) need it:
   * base-rim normals point outward AND backward, so the displaced hull dips
   * behind the wall plane, the wall depth-wins, and the stroke detaches from
   * the silhouette at glancing angles.
   */
  minZ?: number
}

export function createOutlineGeometry(
  source: THREE.BufferGeometry,
  thickness: number,
  { minZ }: OutlineOptions = {},
): THREE.BufferGeometry {
  const bare = new THREE.BufferGeometry()
  bare.setAttribute('position', source.getAttribute('position').clone())
  if (source.index) bare.setIndex(source.index.clone())

  const welded = mergeVertices(bare, 1e-4)
  welded.computeVertexNormals()

  const positions = welded.getAttribute('position') as THREE.BufferAttribute
  const normals = welded.getAttribute('normal') as THREE.BufferAttribute
  for (let i = 0; i < positions.count; i++) {
    const z = positions.getZ(i) + normals.getZ(i) * thickness
    positions.setXYZ(
      i,
      positions.getX(i) + normals.getX(i) * thickness,
      positions.getY(i) + normals.getY(i) * thickness,
      minZ !== undefined ? Math.max(minZ, z) : z,
    )
  }
  positions.needsUpdate = true

  return welded
}
