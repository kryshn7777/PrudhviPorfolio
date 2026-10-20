import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html } from '@react-three/drei';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { scroll } from './scroll.js';
import { LINE, meshMaterial, clayMaterial, zebraMaterial, paintMaterial, withMaterial, asMesh, fit, usePartScene } from './parts.js';

// The belt runs along +x. Each gate is a world-space clipping plane: whatever part of a model has
// passed a gate is drawn with that gate's material, so a part straddling a gate shows both states.
const GATES = [-3.5, 0, 3.5];
const SPACING = 3.5;         // metres between parts on the belt
const BELT = 0.12;           // belt top surface height
const FLOOR = '#C9CCCF';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t) => t * t * (3 - 2 * t);
const clamp01 = (t) => Math.min(1, Math.max(0, t));

// Past the last part the belt runs on, so the finale shows every part painted.
const beltShift = (s) => (s + Math.max(0, s - LINE.length)) * SPACING;
const partX = (i, s) => beltShift(s) - (i + 1) * SPACING;   // part i sits at the zebra gate on stage i + 1

// Keep the half-space x >= lo and x <= hi
const between = (lo, hi) => [
  lo != null && new THREE.Plane(new THREE.Vector3(1, 0, 0), -lo),
  hi != null && new THREE.Plane(new THREE.Vector3(-1, 0, 0), hi),
].filter(Boolean);

const wire = meshMaterial(between(null, GATES[0]));
const clay = clayMaterial(between(GATES[0], GATES[1]));
const zebra = zebraMaterial(between(GATES[1], GATES[2]));

function Part({ i, p }) {
  const scene = usePartScene(p);
  const { layers, k, offset } = useMemo(() => {
    const { k, box } = fit(scene, p.rotY, p.size);
    const c = box.getCenter(new THREE.Vector3());
    return {
      k,
      offset: [-c.x * k, BELT - box.min.y * k, -c.z * k],   // centred on the belt, resting on it
      layers: [asMesh(scene, wire), withMaterial(scene, clay), withMaterial(scene, zebra),
        withMaterial(scene, paintMaterial(p, between(GATES[2], null)))],
    };
  }, [scene, p]);
  const ref = useRef();

  useFrame(() => {
    const x = partX(i, scroll.v);
    ref.current.position.x = x;
    ref.current.visible = Math.abs(x) < 34;
  });

  return (
    <group ref={ref}>
      <group position={offset}>
        <group scale={k} rotation-y={p.rotY}>
          {layers.map((o, j) => <primitive key={j} object={o} />)}
        </group>
      </group>
    </group>
  );
}

const GATE_STYLE = [
  { label: 'Class-A surface', sheet: '#19B5E6', opacity: 0.45 },
  { label: 'Zebra check', sheet: '#ffffff', opacity: 0.4 },
  { label: 'Paint', sheet: '#F2C230', opacity: 0.4 },
];

function Gates() {
  return GATES.map((x, i) => (
    <group key={i} position={[x, 0, 0]}>
      {/* One-sided gantry: the post stands behind the belt so it never hides a part */}
      <mesh position={[0, 1.45, -1.7]}>
        <boxGeometry args={[0.16, 2.9, 0.16]} />
        <meshStandardMaterial color="#2B3138" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.95, 0]}>
        <boxGeometry args={[0.3, 0.22, 3.56]} />
        <meshStandardMaterial color="#2B3138" roughness={0.6} />
      </mesh>
      {/* The light sheet marks the exact plane where the part changes */}
      <mesh position={[0, 1.45, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[3.3, 2.9]} />
        <meshBasicMaterial color={GATE_STYLE[i].sheet} transparent opacity={GATE_STYLE[i].opacity} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Html position={[0, 3.35, 0]} center className="gate-label">{GATE_STYLE[i].label}</Html>
      {i === 0 && <Html position={[-3.5, 3.35, 0]} center className="gate-label quiet">Scan mesh</Html>}
    </group>
  ));
}

function Belt() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 8;
    const g = c.getContext('2d');
    g.fillStyle = '#2A2F35'; g.fillRect(0, 0, 64, 8);
    g.fillStyle = '#3A4048'; g.fillRect(0, 0, 6, 8);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(140, 1);       // one rib every ~0.5 m on a 70 m belt
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useFrame(() => { tex.offset.x = -(beltShift(scroll.v) / 0.5) % 1; });

  return (
    <group>
      <mesh position={[0, BELT / 2, 0]}>
        <boxGeometry args={[70, BELT, 2.8]} />
        <meshStandardMaterial map={tex} roughness={0.85} />
      </mesh>
      {[-1.48, 1.48].map((z) => (
        <mesh key={z} position={[0, BELT + 0.02, z]}>
          <boxGeometry args={[70, 0.06, 0.12]} />
          <meshStandardMaterial color="#F2C230" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export function Environment({ background }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.6;
    if (background) {
      scene.background = new THREE.Color(background);
      scene.fog = new THREE.Fog(background, 16, 42);
    }
    return () => { env.dispose(); pmrem.dispose(); };
  }, [gl, scene, background]);
  return <directionalLight position={[-3, 7, 6]} intensity={1.2} />;
}

function CameraRig() {
  const [pos, look, a, b] = useMemo(() => [1, 2, 3, 4].map(() => new THREE.Vector3()), []);
  useFrame(({ camera, size }, dt) => {
    // Two cascaded dampers: belt eases in, then coasts and settles after scrolling stops
    if (reduceMotion) scroll.m = scroll.v = scroll.s;
    else {
      scroll.m = THREE.MathUtils.damp(scroll.m, scroll.s, 0.8, dt);
      scroll.v = THREE.MathUtils.damp(scroll.v, scroll.m, 1.25, dt);
    }
    const s = scroll.v;
    // Along the line: watch all three gates, with a slow sway. Finale: pull back over the finished parts.
    const f = ease(clamp01(s - LINE.length));
    pos.lerpVectors(a.set(-0.6 + Math.sin(s * 1.3) * 0.8, 5.6, 9.6), b.set(15, 7, 14.5), f);
    look.lerpVectors(a.set(0, -0.6, 0), b.set(15, -1.4, 0), f);
    if (size.width < size.height) pos.sub(look).multiplyScalar(1.9).add(look);   // portrait phones: pull back
    camera.position.copy(pos);
    camera.lookAt(look);
  });
  return null;
}

export default function SurfaceLine({ reached }) {
  return (
    <>
      <Environment background={FLOOR} />
      <CameraRig />
      <Belt />
      <Gates />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={FLOOR} roughness={1} />
      </mesh>
      {/* Parts load lazily, a couple of slots before they ride into view */}
      {LINE.map((p, i) => i <= reached && (
        <Suspense key={i} fallback={null}>
          <Part i={i} p={p} />
        </Suspense>
      ))}
      <ContactShadows position={[0, BELT + 0.005, 0]} scale={[40, 4]} blur={2} opacity={0.5} far={2.5} />
    </>
  );
}
