import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { ORBIT_CONTROLS } from '../../constants/editor3d'
import { OBLIQUE_LIMIT_DEG, obliqueness, swungDirection, withinOrbitLimits } from '../cameraFocus'

/** Straight out of a vertical wall, which is what the editor opens looking at */
const FACING_WALL = new THREE.Vector3(0, 0, 1)
/** A roof's climbing surface points at the floor */
const ROOF = new THREE.Vector3(0, -1, 0)
/** An arete faces across the width, where the orbit cannot follow */
const ARETE = new THREE.Vector3(1, 0, 0)

const polarOf = (direction: THREE.Vector3) => new THREE.Spherical().setFromVector3(direction).phi
const azimuthOf = (direction: THREE.Vector3) => new THREE.Spherical().setFromVector3(direction).theta

describe('swungDirection', () => {
  it('leaves the camera alone when the panel is already workable', () => {
    const slightlyOff = new THREE.Vector3(0.2, 0.2, 1).normalize()

    expect(swungDirection(slightlyOff, FACING_WALL)).toBeNull()
  })

  it('turns only as far as it has to', () => {
    /* Well off to the side of a vertical wall, past the limit */
    const oblique = new THREE.Vector3(1, 0, 0.4).normalize()
    expect(obliqueness(oblique, FACING_WALL)).toBeGreaterThan(OBLIQUE_LIMIT_DEG)

    const swung = swungDirection(oblique, FACING_WALL)!

    expect(obliqueness(swung, FACING_WALL)).toBeCloseTo(OBLIQUE_LIMIT_DEG, 4)
  })

  it('gets under a roof rather than staying above it', () => {
    const above = new THREE.Vector3(0, 0.5, 0.87).normalize()

    const swung = swungDirection(above, ROOF)!

    expect(swung.y).toBeLessThan(0)
    expect(obliqueness(swung, ROOF)).toBeLessThan(obliqueness(above, ROOF))
  })

  it('stops a roof swing at the lowest angle the orbit allows', () => {
    const above = new THREE.Vector3(0, 0.5, 0.87).normalize()

    const swung = swungDirection(above, ROOF)!

    /* Square on to a roof means underneath it looking straight up, which the
       orbit does not go to. It goes as low as it is allowed and stops */
    expect(polarOf(swung)).toBeCloseTo(ORBIT_CONTROLS.MAX_POLAR_ANGLE, 6)
  })

  it('meets an arete at the edge of the wedge the camera lives in', () => {
    const front = new THREE.Vector3(0, 0, 1)

    const swung = swungDirection(front, ARETE)!

    expect(azimuthOf(swung)).toBeCloseTo(ORBIT_CONTROLS.MAX_AZIMUTH_ANGLE, 6)
    expect(obliqueness(swung, ARETE)).toBeGreaterThan(OBLIQUE_LIMIT_DEG)
  })

  it('turns toward a panel from whichever side the camera is on', () => {
    const fromTheLeft = new THREE.Vector3(-1, 0, 0.4).normalize()
    const fromTheRight = new THREE.Vector3(1, 0, 0.4).normalize()

    expect(swungDirection(fromTheLeft, FACING_WALL)!.x).toBeLessThan(0)
    expect(swungDirection(fromTheRight, FACING_WALL)!.x).toBeGreaterThan(0)
  })
})

describe('withinOrbitLimits', () => {
  it('passes a direction the orbit already allows', () => {
    const inside = new THREE.Vector3(0.2, 0.3, 1).normalize()

    expect(withinOrbitLimits(inside).angleTo(inside)).toBeLessThan(1e-6)
  })

  it('pulls one outside back to the nearest edge', () => {
    const behindTheWall = new THREE.Vector3(0, 0, -1)

    const pulled = withinOrbitLimits(behindTheWall)

    expect(Math.abs(azimuthOf(pulled))).toBeLessThanOrEqual(ORBIT_CONTROLS.MAX_AZIMUTH_ANGLE + 1e-6)
    expect(polarOf(pulled)).toBeGreaterThanOrEqual(ORBIT_CONTROLS.MIN_POLAR_ANGLE - 1e-6)
    expect(polarOf(pulled)).toBeLessThanOrEqual(ORBIT_CONTROLS.MAX_POLAR_ANGLE + 1e-6)
  })
})
