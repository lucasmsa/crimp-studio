import * as THREE from 'three'

/** Bounding sphere radius with padding for reliable pointer capture */
export function computeHitRadius(geometry: THREE.BufferGeometry): number {
  geometry.computeBoundingSphere()
  const radius = geometry.boundingSphere?.radius ?? 0.1
  return radius * 1.2
}

/** Hit sphere center: geometry back face is at z=0, so center sits at half depth */
export function computeHitCenter(geometry: THREE.BufferGeometry): THREE.Vector3 {
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  return new THREE.Vector3(0, 0, (box.max.z - box.min.z) / 2)
}
