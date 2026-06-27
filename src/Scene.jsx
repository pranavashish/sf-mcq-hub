import { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

function Shape({ geo, color, position, scale, speed = 1, distort = 0.35 }) {
  return (
    <Float speed={speed} rotationIntensity={1.1} floatIntensity={1.6}>
      <mesh position={position} scale={scale}>
        {geo}
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.45}
          roughness={0.18}
          metalness={0.65}
          distort={distort}
          speed={2}
        />
      </mesh>
    </Float>
  )
}

function Rig({ colors }) {
  const group = useRef()
  useFrame((state) => {
    if (!group.current) return
    // mouse-reactive parallax — camera-feel without moving the camera
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x * 0.35, 0.04)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * 0.25, 0.04)
  })
  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[10, 10, 10]} intensity={1.3} color={colors.a} />
      <pointLight position={[-10, -6, -4]} intensity={0.9} color={colors.b} />
      <pointLight position={[0, 6, 8]} intensity={0.6} color={colors.c} />
      <group ref={group}>
        <Shape geo={<icosahedronGeometry args={[1.4, 1]} />} color={colors.a} position={[-3.3, 1.3, 0]} scale={1} speed={1.1} />
        <Shape geo={<torusGeometry args={[1, 0.42, 24, 48]} />} color={colors.b} position={[3.3, -1.1, -1]} scale={0.95} speed={1.4} distort={0.25} />
        <Shape geo={<octahedronGeometry args={[1.25, 0]} />} color={colors.c} position={[2.6, 2.1, -2]} scale={0.8} speed={0.85} />
        <Shape geo={<dodecahedronGeometry args={[1.15, 0]} />} color={colors.a} position={[-3.1, -1.9, -1]} scale={0.72} speed={1.25} />
        <Shape geo={<icosahedronGeometry args={[0.7, 0]} />} color={colors.c} position={[0.4, -2.6, 1]} scale={0.7} speed={1.6} />
      </group>
      <Sparkles count={130} scale={[14, 9, 8]} size={2.4} speed={0.35} color={colors.points} opacity={0.7} />
      <EffectComposer>
        <Bloom intensity={0.95} luminanceThreshold={0.18} luminanceSmoothing={0.45} mipmapBlur />
      </EffectComposer>
    </>
  )
}

const PALETTE = {
  dark:  { a: '#1A9FFF', b: '#7C3AED', c: '#06D6F5', points: '#7CD4FF' },
  light: { a: '#3B82F6', b: '#8B5CF6', c: '#22D3EE', points: '#60A5FA' },
}

export default function Scene() {
  const [theme, setTheme] = useState(
    () => (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'dark'
  )
  useEffect(() => {
    const o = new MutationObserver(() =>
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark')
    )
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => o.disconnect()
  }, [])
  const colors = PALETTE[theme] || PALETTE.dark

  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 9], fov: 55 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <Rig colors={colors} />
        </Suspense>
      </Canvas>
    </div>
  )
}
