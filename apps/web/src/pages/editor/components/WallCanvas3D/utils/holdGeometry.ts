import * as THREE from 'three'
import type { HoldType } from '@/stores/wallStore'

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * Centers geometry in XY, translates Z so the back face (minZ) sits at z=0.
 * Holds protrude fully from the wall surface — no embedding = no shadow artifacts.
 */
function flushBackFace(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  geometry.center()
  geometry.computeBoundingBox()
  geometry.translate(0, 0, -geometry.boundingBox!.min.z)
  return geometry
}

/**
 * Jug — Crescent / moon shape with two horns and a smooth scoop.
 *
 * Modeled after real wooden jugs: wider than tall, two horn tips
 * at the upper corners with a gentle concave curve between them
 * (the grip area). Convex bottom. Thick bevel for dome volume.
 *
 *    /‾‾‾\__________/‾‾‾\    ← horns, gentle scoop between
 *   |                      |
 *    \                    /
 *      \________________/     ← wide convex base
 */
function createJugGeometry(scale: number): THREE.BufferGeometry {
  const s = scale

  const hornY = 1.1 * s
  const scoopY = 0.65 * s
  const bodyW = 2.0 * s
  const hornX = 1.5 * s

  const shape = new THREE.Shape()

  /* Bottom center */
  shape.moveTo(0, -0.9 * s)

  /* Bottom right curve */
  shape.bezierCurveTo(1.2 * s, -0.9 * s, bodyW, -0.4 * s, bodyW, 0.15 * s)

  /* Right side up to right horn tip */
  shape.bezierCurveTo(bodyW, 0.7 * s, 1.8 * s, hornY, hornX, hornY)

  /* Right horn → gentle scoop dip (wide smooth curve) */
  shape.bezierCurveTo(1.1 * s, hornY, 0.5 * s, scoopY, 0, scoopY)

  /* Scoop dip → left horn (mirror) */
  shape.bezierCurveTo(-0.5 * s, scoopY, -1.1 * s, hornY, -hornX, hornY)

  /* Left horn down the left side */
  shape.bezierCurveTo(-1.8 * s, hornY, -bodyW, 0.7 * s, -bodyW, 0.15 * s)

  /* Left side back to bottom center */
  shape.bezierCurveTo(-bodyW, -0.4 * s, -1.2 * s, -0.9 * s, 0, -0.9 * s)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: rand(0.05, 0.15) * s,
    bevelEnabled: true,
    bevelThickness: rand(0.4, 0.55) * s,
    bevelSize: rand(0.3, 0.45) * s,
    bevelSegments: 16,
    curveSegments: 32,
  })

  geometry.scale(rand(0.9, 1.1), rand(0.9, 1.1), 1)
  geometry.rotateZ(rand(-0.15, 0.15))
  flushBackFace(geometry)

  return geometry
}

/**
 * Crimp — Thin, wide curved ledge gripped with fingertips.
 */
function createCrimpGeometry(scale: number): THREE.BufferGeometry {
  const s = scale

  const shape = new THREE.Shape()
  shape.moveTo(-1.2 * s, -0.1 * s)
  shape.quadraticCurveTo(0, -0.3 * s, 1.2 * s, -0.1 * s)
  shape.lineTo(1.1 * s, 0.2 * s)
  shape.lineTo(-1.1 * s, 0.2 * s)
  shape.lineTo(-1.2 * s, -0.1 * s)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: rand(0.1, 0.25) * s,
    bevelEnabled: true,
    bevelSegments: 6,
    bevelSize: 0.05 * s,
    bevelThickness: 0.05 * s,
    curveSegments: 24,
  })
  geometry.scale(rand(0.8, 1.3), rand(0.9, 1.1), 1)
  geometry.rotateZ(rand(-0.3, 0.3))
  flushBackFace(geometry)

  return geometry
}

/**
 * Sloper — Full sphere squashed flat. Dome protrudes from wall.
 */
function createSloperGeometry(scale: number): THREE.BufferGeometry {
  const s = scale

  const geometry = new THREE.SphereGeometry(1.4 * s, 32, 32)
  geometry.scale(rand(1.0, 1.4), rand(0.9, 1.3), rand(0.3, 0.5))
  geometry.rotateZ(rand(0, Math.PI * 2))
  flushBackFace(geometry)

  return geometry
}

/**
 * Pinch — Tall, narrow shape with indented sides for squeeze grip.
 * Shallow extrusion with large bevel so the profile is dome-like,
 * keeping shadow contact tight against the wall.
 */
function createPinchGeometry(scale: number): THREE.BufferGeometry {
  const s = scale

  const shape = new THREE.Shape()
  shape.moveTo(-0.5 * s, -1.5 * s)
  shape.quadraticCurveTo(-0.1 * s, 0, -0.5 * s, 1.5 * s)
  shape.lineTo(0.5 * s, 1.5 * s)
  shape.quadraticCurveTo(0.1 * s, 0, 0.5 * s, -1.5 * s)
  shape.lineTo(-0.5 * s, -1.5 * s)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: rand(0.05, 0.15) * s,
    bevelEnabled: true,
    bevelThickness: 0.35 * s,
    bevelSize: 0.3 * s,
    bevelSegments: 12,
    curveSegments: 24,
  })
  geometry.scale(rand(0.8, 1.2), rand(0.8, 1.4), 1)
  geometry.rotateZ(rand(0, Math.PI * 2))
  flushBackFace(geometry)

  return geometry
}

/**
 * Pocket — Organic blob body with a scooped-out finger hole.
 * Shallow extrusion with large bevel creates a dome profile,
 * keeping shadow contact tight against the wall.
 */
function createPocketGeometry(scale: number): THREE.BufferGeometry {
  const s = scale
  const holeRadius = rand(0.55, 0.7) * s

  const shape = new THREE.Shape()
  shape.moveTo(0, 1.3 * s)
  shape.bezierCurveTo(1.4 * s, 1.3 * s, 1.6 * s, 0.2 * s, 1.1 * s, -1.0 * s)
  shape.bezierCurveTo(0.5 * s, -1.4 * s, -0.5 * s, -1.4 * s, -1.1 * s, -1.0 * s)
  shape.bezierCurveTo(-1.6 * s, 0.2 * s, -1.4 * s, 1.3 * s, 0, 1.3 * s)

  const hole = new THREE.Path()
  hole.absellipse(0, -0.1 * s, holeRadius, holeRadius * rand(0.85, 1.0), 0, Math.PI * 2, false, 0)
  shape.holes.push(hole)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: rand(0.05, 0.15) * s,
    bevelEnabled: true,
    bevelThickness: rand(0.25, 0.35) * s,
    bevelSize: rand(0.2, 0.3) * s,
    bevelSegments: 16,
    curveSegments: 32,
  })
  geometry.scale(rand(0.9, 1.1), rand(0.9, 1.1), 1)
  geometry.rotateZ(rand(0, Math.PI * 2))
  flushBackFace(geometry)

  return geometry
}

/**
 * Volume — Large geometric polyhedron with flat triangular faces.
 */
function createVolumeGeometry(scale: number): THREE.BufferGeometry {
  const s = scale

  const geometry = new THREE.IcosahedronGeometry(2.0 * s, 0)
  geometry.scale(rand(1.3, 1.7), rand(1.3, 1.7), rand(0.4, 0.6))
  geometry.rotateZ(rand(0, Math.PI * 2))
  flushBackFace(geometry)

  return geometry
}

const geometryFactories: Record<HoldType, (scale: number) => THREE.BufferGeometry> = {
  jug: createJugGeometry,
  crimp: createCrimpGeometry,
  sloper: createSloperGeometry,
  pinch: createPinchGeometry,
  pocket: createPocketGeometry,
  volume: createVolumeGeometry,
}

/** Hold types that should use flat shading (architectural look) */
export const FLAT_SHADED_TYPES: ReadonlySet<HoldType> = new Set(['volume'])

export function createHoldGeometry(type: HoldType, scale: number): THREE.BufferGeometry {
  return geometryFactories[type](scale)
}

/**
 * Creates a procedural grip texture (fine noise bump map)
 * giving holds a sandy/textured surface like real PU climbing holds.
 */
export function createGripTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const imgData = ctx.createImageData(size, size)

  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = Math.random() * 255
    imgData.data[i] = noise
    imgData.data[i + 1] = noise
    imgData.data[i + 2] = noise
    imgData.data[i + 3] = 255
  }

  ctx.putImageData(imgData, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4)
  return texture
}
