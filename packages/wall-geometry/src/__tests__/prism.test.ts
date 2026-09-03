import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { boxPrism, polygonPrism, prismsIntersect } from '../prism'

const upright = new THREE.Quaternion()

const boxAt = (x: number, y: number, z: number, half = 0.5, quaternion = upright) =>
  boxPrism(new THREE.Vector3(x, y, z), quaternion, new THREE.Vector3(half, half, half))

const rotated = (degrees: number, axis: THREE.Vector3) =>
  new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(degrees))

const flatFrame = { position: new THREE.Vector3(), quaternion: upright }

describe('prismsIntersect', () => {
  it('finds a box overlapping itself', () => {
    expect(prismsIntersect(boxAt(0, 0, 0), boxAt(0, 0, 0))).toBe(true)
  })

  it('separates boxes that are clear of each other', () => {
    expect(prismsIntersect(boxAt(0, 0, 0), boxAt(3, 0, 0))).toBe(false)
  })

  it('counts a requested gap as contact, which is how holds keep their room', () => {
    const apart = () => [boxAt(0, 0, 0), boxAt(1.02, 0, 0)] as const

    expect(prismsIntersect(...apart(), 0)).toBe(false)
    expect(prismsIntersect(...apart(), 0.05)).toBe(true)
  })

  it('reads orientation, not just position', () => {
    /* A slab standing in the way of a corner: axis aligned it clears, turned
       45 degrees its corner reaches across */
    const slab = boxPrism(new THREE.Vector3(0.7, 0, 0), upright, new THREE.Vector3(0.05, 1, 1))
    const turned = boxPrism(
      new THREE.Vector3(0.7, 0, 0),
      rotated(45, new THREE.Vector3(0, 1, 0)),
      new THREE.Vector3(0.05, 1, 1),
    )
    const wall = boxAt(0, 0, 0, 0.5)

    expect(prismsIntersect(wall, slab)).toBe(false)
    expect(prismsIntersect(wall, turned)).toBe(true)
  })

  it('catches an overlap that no face normal separates', () => {
    /* Two thin plates crossed like an X: every face normal of each plate finds
       the other spread across it, and only an edge cross product tells them
       apart. This is the case a naive axis test gets wrong. */
    const flat = boxPrism(new THREE.Vector3(0, 0, 0), upright, new THREE.Vector3(1, 1, 0.02))
    const crossed = boxPrism(
      new THREE.Vector3(0, 0, 0),
      rotated(90, new THREE.Vector3(1, 0, 0)),
      new THREE.Vector3(1, 1, 0.02),
    )

    expect(prismsIntersect(flat, crossed)).toBe(true)
  })

  it('knows where a triangular panel is not, which a bounding box would not', () => {
    /* A 2m right triangle of plywood. A hold sitting in the cut-away corner is
       inside the triangle's bounding box and outside the triangle */
    const panel = polygonPrism(
      [
        [0, 0],
        [200, 0],
        [0, 200],
      ],
      0.08,
      flatFrame,
    )
    const inTheCorner = boxAt(1.7, 1.7, 0.05, 0.1)
    const onThePlywood = boxAt(0.3, 0.3, 0.05, 0.1)

    expect(prismsIntersect(panel, inTheCorner)).toBe(false)
    expect(prismsIntersect(panel, onThePlywood)).toBe(true)
  })

  it('treats a touching hold as touching, so a tolerance can let it through', () => {
    /* A hold whose back sits exactly on the surface: contact, not penetration */
    const panel = polygonPrism(
      [
        [0, 0],
        [200, 0],
        [200, 200],
        [0, 200],
      ],
      0.08,
      flatFrame,
    )
    const bolted = boxAt(1, 1, 0.1, 0.1)

    expect(prismsIntersect(panel, bolted, 0)).toBe(true)
    expect(prismsIntersect(panel, bolted, -0.001)).toBe(false)
  })
})
