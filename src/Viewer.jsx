import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Environment } from './SurfaceLine.jsx';
import { meshMaterial, clayMaterial, zebraMaterial, paintMaterial, withMaterial, asMesh, fit, usePartScene } from './parts.js';

const MODES = [
  { id: 'mesh', label: 'Mesh' },
  { id: 'surface', label: 'Surface' },
  { id: 'zebra', label: 'Zebra' },
  { id: 'paint', label: 'Paint' },
];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function Model({ p, mode }) {
  const scene = usePartScene(p);
  const { layers, k, offset } = useMemo(() => {
    const { k, box } = fit(scene, p.rotY, 2.6);
    const c = box.getCenter(new THREE.Vector3());
    return {
      k,
      offset: [-c.x * k, -c.y * k, -c.z * k],
      layers: {
        mesh: asMesh(scene, meshMaterial()),
        surface: withMaterial(scene, clayMaterial()),
        zebra: withMaterial(scene, zebraMaterial()),
        paint: withMaterial(scene, paintMaterial(p)),
      },
    };
  }, [scene, p]);

  return (
    <group position={offset}>
      <group scale={k} rotation-y={p.rotY}>
        <primitive object={layers[mode]} />
      </group>
    </group>
  );
}

// Rotatable model with workflow modes. The canvas only exists while the card is near the viewport,
// so the page never holds more WebGL contexts than the browser allows.
export default function Viewer({ p }) {
  const [mode, setMode] = useState('surface');
  const [near, setNear] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '300px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div className="viewer" ref={ref}>
      {near && (
        <Canvas dpr={[1, 2]} camera={{ fov: 30, position: [3.6, 2.2, 4.4] }}>
          <Environment />
          <Suspense fallback={null}><Model p={p} mode={mode} /></Suspense>
          <OrbitControls makeDefault enablePan={false} autoRotate={!reduceMotion} autoRotateSpeed={0.7} minDistance={2.6} maxDistance={9} />
        </Canvas>
      )}
      <div className="modes" role="group" aria-label={`Display mode for ${p.name}`}>
        {MODES.map((m) => (
          <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>
      <span className="hint">Drag to rotate</span>
    </div>
  );
}
