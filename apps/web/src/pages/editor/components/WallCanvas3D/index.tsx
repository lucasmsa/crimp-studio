import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { WallScene } from './components/WallScene'
import { useWallStore } from '@/stores/wallStore'
import { colors } from '@/lib/colors'
import { CAMERA } from './constants/editor3d'

export function WallCanvas3D() {
  const { selectHold, selectFace } = useWallStore()

  /* Clicking past the wall lets go of whatever was focused */
  const handleMissed = () => {
    selectHold(null)
    selectFace(null)
  }

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-lg border-2 border-border overflow-hidden"
      style={{ backgroundColor: colors.scene.viewport }}>
      <Canvas
        camera={{
          fov: CAMERA.FOV,
          near: CAMERA.NEAR,
          far: CAMERA.FAR,
          position: [0, 0, CAMERA.INITIAL_DISTANCE],
        }}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{ antialias: true }}
        onPointerMissed={handleMissed}
      >
        <Suspense fallback={null}>
          <WallScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
