import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { WallScene } from './components/WallScene'
import { CAMERA } from './constants/editor3d'

export function WallCanvas3D() {
  return (
    <div className="relative w-full h-full min-h-[500px] bg-surface rounded-lg border border-border overflow-hidden">
      <Canvas
        camera={{
          fov: CAMERA.FOV,
          near: CAMERA.NEAR,
          far: CAMERA.FAR,
          position: [0, 0, CAMERA.INITIAL_DISTANCE],
        }}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <WallScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
