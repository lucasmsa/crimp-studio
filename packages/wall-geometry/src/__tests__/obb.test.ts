import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { makeObb, obbsIntersect } from '../obb'

const upright = new THREE.Quaternion()

const boxAt = (x: number, y: number, z: number, half = 0.5, quaternion = upright) =>
  makeObb(new THREE.Vector3(x, y, z), quaternion, new THREE.Vector3(half, half, half))

const rotated = (degrees: number, axis: THREE.Vector3) =>
  new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(degrees))

describe('obbsIntersect', () => {
  it('finds a box overlapping itself', () => {
    expect(obbsIntersect(boxAt(0, 0, 0), boxAt(0, 0, 0))).toBe(true)
  })

  it('separates boxes that are clear of each other', () => {
    expect(obbsIntersect(boxAt(0, 0, 0), boxAt(3, 0, 0))).toBe(false)
  })

  it('counts a requested gap as contact, which is how holds keep their room', () => {
    const apart = () => [boxAt(0, 0, 0), boxAt(1.02, 0, 0)] as const

    expect(obbsIntersect(...apart(), 0)).toBe(false)
    expect(obbsIntersect(...apart(), 0.05)).toBe(true)
  })

  it('reads orientation, not just position', () => {
    /* A slab standing in the way of a corner: axis aligned it clears, turned
       45 degrees its corner reaches across */
    const slab = makeObb(
      new THREE.Vector3(0.7, 0, 0),
      upright,
      new THREE.Vector3(0.05, 1, 1),
    )
    const turned = makeObb(
      new THREE.Vector3(0.7, 0, 0),
      rotated(45, new THREE.Vector3(0, 1, 0)),
      new THREE.Vector3(0.05, 1, 1),
    )
    const wall = boxAt(0, 0, 0, 0.5)

    expect(obbsIntersect(wall, slab)).toBe(false)
    expect(obbsIntersect(wall, turned)).toBe(true)
  })

  it('catches an overlap that no face normal separates', () => {
    /* Two thin plates crossed like an X: every face normal of each plate finds
       the other spread across it, and only an edge cross product tells them
       apart. This is the case a naive axis test gets wrong. */
    const flat = makeObb(
      new THREE.Vector3(0, 0, 0),
      upright,
      new THREE.Vector3(1, 1, 0.02),
    )
    const crossed = makeObb(
      new THREE.Vector3(0, 0, 0),
      rotated(90, new THREE.Vector3(1, 0, 0)),
      new THREE.Vector3(1, 1, 0.02),
    )

    expect(obbsIntersect(flat, crossed)).toBe(true)
  })
})
