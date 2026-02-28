import * as THREE from 'three'
import type { HoldType } from '@/stores/wallStore'

/**
 * Randomly displaces each vertex for an organic, rocky feel.
 * Used on all hold geometries to break the synthetic look.
 */
function perturbVertices(geometry: THREE.BufferGeometry, magnitude: number): THREE.BufferGeometry {
  const positions = geometry.attributes.position
  for (let i = 0; i < positions.count; i++) {
    positions.setXYZ(
      i,
      positions.getX(i) + (Math.random() - 0.5) * magnitude,
      positions.getY(i) + (Math.random() - 0.5) * magnitude,
      positions.getZ(i) + (Math.random() - 0.5) * magnitude,
    )
  }
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Jug — Large, positive hold. Partial torus like a big handle.
 */
function createJugGeometry(scale: number): THREE.BufferGeometry {
  const geometry = new THREE.TorusGeometry(
    scale * 0.4,   // ring radius
    scale * 0.15,  // tube radius
    8,             // radial segments
    16,            // tubular segments
    Math.PI * 1.2, // arc
  )
  geometry.rotateX(Math.PI / 2)
  geometry.rotateZ(Math.PI / 1.2)
  return perturbVertices(geometry, scale * 0.03)
}

/**
 * Crimp — Thin, flat edge. Flattened box.
 */
function createCrimpGeometry(scale: number): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(
    scale * 0.5,  // width
    scale * 0.08, // height (very thin)
    scale * 0.15, // depth
    6, 1, 2,
  )
  return perturbVertices(geometry, scale * 0.015)
}

/**
 * Sloper — Rounded dome. Half-sphere.
 */
function createSloperGeometry(scale: number): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(
    scale * 0.35,       // radius
    16, 8,              // segments
    0, Math.PI * 2,     // horizontal sweep
    0, Math.PI / 2,     // vertical sweep (half sphere)
  )
  return perturbVertices(geometry, scale * 0.02)
}

/**
 * Pinch — Tall, narrow block. Gripped from both sides.
 */
function createPinchGeometry(scale: number): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(
    scale * 0.2,  // narrow width
    scale * 0.5,  // tall
    scale * 0.2,  // depth
    4, 6, 4,
  )
  return perturbVertices(geometry, scale * 0.025)
}

/**
 * Pocket — Small cylindrical cup. Finger hole.
 */
function createPocketGeometry(scale: number): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(
    scale * 0.12, // top radius
    scale * 0.1,  // bottom radius
    scale * 0.2,  // height
    12,           // radial segments
    1,            // height segments
    true,         // open-ended
  )
  // Orient so opening faces outward from wall (+Z)
  geometry.rotateX(Math.PI / 2)
  return perturbVertices(geometry, scale * 0.01)
}

/**
 * Volume — Large geometric feature. Dodecahedron for interesting shape.
 */
function createVolumeGeometry(scale: number): THREE.BufferGeometry {
  const geometry = new THREE.DodecahedronGeometry(scale * 0.4, 0)
  return perturbVertices(geometry, scale * 0.04)
}

const geometryFactories: Record<HoldType, (scale: number) => THREE.BufferGeometry> = {
  jug: createJugGeometry,
  crimp: createCrimpGeometry,
  sloper: createSloperGeometry,
  pinch: createPinchGeometry,
  pocket: createPocketGeometry,
  volume: createVolumeGeometry,
}

/**
 * Create a procedural geometry for a given hold type.
 * The `scale` param controls overall size (derived from hold.size in cm).
 */
export function createHoldGeometry(type: HoldType, scale: number): THREE.BufferGeometry {
  return geometryFactories[type](scale)
}
