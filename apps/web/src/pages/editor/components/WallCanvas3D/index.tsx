import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { WallScene } from './components/WallScene'
import { CAMERA } from './constants/editor3d'
import { useCanvasDeselect } from './hooks/useCanvasDeselect'
import { useSceneRoom } from './hooks/useSceneRoom'

export function WallCanvas3D() {
  const handleMissed = useCanvasDeselect()
  const room = useSceneRoom()

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-lg border-2 border-border"
      style={{ backgroundImage: `linear-gradient(to bottom, ${room.top}, ${room.bottom})` }}
    >
      <Canvas
        camera={{
          fov: CAMERA.FOV,
          near: CAMERA.NEAR,
          far: CAMERA.FAR,
          position: [0, 0, CAMERA.INITIAL_DISTANCE],
        }}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        /* No tone mapping: the filmic curve rolls the top of the range off, which
           turns a white painted panel grey and softens the cel bands it is
           supposed to keep hard */
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
        onPointerMissed={handleMissed}
      >
        <Suspense fallback={null}>
          <WallScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
