import { Canvas } from '@react-three/fiber'
import { Environment, Float, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense } from 'react'
import { ClimbingShoe } from './ClimbingShoe'
import { cn } from '@/lib/utils'
import { colors } from '@/lib/colors'

interface SceneProps {
  className?: string
}

export function Scene({ className }: SceneProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Ambient glow - large, soft, centered */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[700px] rounded-full opacity-30 blur-[200px] pointer-events-none"
        style={{ backgroundColor: colors.primary }}
      />
      {/* Secondary glow - smaller, offset, creates depth */}
      <div
        className="absolute top-[60%] left-[55%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-20 blur-[80px] pointer-events-none"
        style={{ backgroundColor: colors.secondary }}
      />

      <Canvas
        camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          {/* Base ambient - subtle fill */}
          <ambientLight intensity={0.3} />

          {/* Key light - warm, primary illumination from top-right */}
          <spotLight
            position={[5, 5, 5]}
            angle={0.4}
            penumbra={1}
            intensity={2}
            color={colors.primary}
          />

          {/* Fill light - neutral, softens shadows */}
          <pointLight position={[-5, 0, 5]} intensity={0.4} color={colors.light.surface} />

          {/* Rim light - warm, creates edge definition from behind */}
          <pointLight position={[0, -3, -5]} intensity={1} color={colors.primary} />

          {/* Accent light - secondary color for visual interest */}
          <pointLight position={[-3, 3, 0]} intensity={0.3} color={colors.secondary} />

          <Float
            speed={1.5}
            rotationIntensity={0.5}
            floatIntensity={0.5}
          >
            <ClimbingShoe />
          </Float>

          <Environment preset="city" />

          {/* Post-processing effects */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.5}
              luminanceSmoothing={0.9}
              intensity={0.6}
            />
          </EffectComposer>
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}
