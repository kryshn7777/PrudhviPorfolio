import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Display axes: x right, y up, z towards the front. `axes` maps each CATIA export into that (row-major 3x3).
const NOSE_X = [0, 1, 0, 0, 0, 1, 1, 0, 0];    // Mustang: length along CATIA x, nose at +x
const NOSE_MINUS_Y = [1, 0, 0, 0, 0, 1, 0, -1, 0]; // width along x, nose at -y, z up
const UPRIGHT = [1, 0, 0, 0, 1, 0, 0, 0, 1];

// Every project with a model. Order = order on the surface line and in the project grid.
// size: display size in metres for the line (parts come from different vehicles, so not to scale).
export const PARTS = [
  {
    file: 'mustang', axes: NOSE_X, size: 2.9, rotY: Math.PI / 2,
    name: 'Ford Mustang hood & fender', tool: 'CATIA V5',
    text: 'Front hood and fender surfaces rebuilt from a reference mesh, focused on panel-gap accuracy and curvature continuity.',
    paintName: 'Grabber blue', paint: { color: '#1F5FD1', metalness: 0.35, roughness: 0.25 },
  },
  {
    file: 'hood', axes: NOSE_MINUS_Y, size: 2.8, rotY: Math.PI / 2,
    name: 'Hood & side panel', tool: 'CATIA V5',
    text: 'Adjoining hood and side panel surfaces developed together, matching curvature across the shutline.',
    paintName: 'Glacier white', paint: { color: '#E9ECEE', metalness: 0.05, roughness: 0.25 },
  },
  {
    file: 'fender', axes: NOSE_MINUS_Y, size: 2.9, rotY: Math.PI / 2,
    name: 'Front fender', tool: 'CATIA V5',
    text: 'Standalone fender panel reconstructed to Class-A tolerance with a structured patch layout.',
    paintName: 'Racing green', paint: { color: '#1E4D3A', metalness: 0.3, roughness: 0.3 },
  },
  {
    file: 'hard-spoiler', axes: NOSE_MINUS_Y, size: 2.8, rotY: 0,
    name: 'Automotive spoiler', tool: 'CATIA V5',
    text: 'Spoiler geometry reverse-engineered from mesh data into a clean, manufacturable Class-A surface.',
    paintName: 'Race red', paint: { color: '#C3201F', metalness: 0.1, roughness: 0.3 },
  },
  {
    file: 'spoiler', axes: NOSE_MINUS_Y, size: 2.7, rotY: 0,
    name: 'RC car spoiler', tool: 'CATIA V5',
    text: 'Small-scale surfacing exercise applying the same Class-A workflow at a reduced form factor.',
    paintName: 'Carbon black', paint: { color: '#1A1C1F', metalness: 0.2, roughness: 0.35 },
  },
  {
    file: 'mech', axes: UPRIGHT, size: 1.4, rotY: 0,
    name: 'Gear & tube', tool: 'CATIA V5',
    text: 'Mechanical components: a knurled gear on a stepped tube, modelled as solids.',
    paintName: 'Brushed aluminium', paint: { color: '#C9CDD2', metalness: 1, roughness: 0.32 },
  },
];

// Projects without a model on the site yet
export const MORE_PROJECTS = [
  { name: 'Toyota Supra, full surface reconstruction', tool: 'CATIA V5', text: 'Complete Class-A body reconstruction from scan mesh, including patch layout and reflection analysis for surface quality.' },
  { name: 'Fender & headlight surface development', tool: 'CATIA V5', text: 'Surface development around a complex fender–headlight intersection, with continuity checks across the boundary.' },
];

// Display modes, in workflow order. `planes` are optional clipping planes (used by the surface line).
const DOUBLE = { side: THREE.DoubleSide };

function stripes() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  for (let i = 0; i < 18; i++) { g.fillStyle = i % 2 ? '#15181c' : '#f4f5f6'; g.fillRect(0, (i * 256) / 18, 256, 256 / 18 + 1); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const zebraMatcap = stripes();

export const meshMaterial = (planes = []) =>
  new THREE.LineBasicMaterial({ color: '#0E8FC0', transparent: true, opacity: 0.55, clippingPlanes: planes });
export const clayMaterial = (planes = []) =>
  new THREE.MeshPhysicalMaterial({ color: '#B9B3A8', roughness: 0.6, ...DOUBLE, clippingPlanes: planes });
// Striped matcap: bands follow the surface normal, so they bend like zebra lines on a real panel
export const zebraMaterial = (planes = []) =>
  new THREE.MeshMatcapMaterial({ matcap: zebraMatcap, ...DOUBLE, clippingPlanes: planes });
export const paintMaterial = (p, planes = []) =>
  new THREE.MeshPhysicalMaterial({ ...p.paint, clearcoat: 1, clearcoatRoughness: 0.05, ...DOUBLE, clippingPlanes: planes });

export function withMaterial(scene, material) {
  const o = scene.clone();
  o.traverse((m) => { if (m.isMesh) m.material = material; });
  return o;
}

// Every mesh swapped for its triangle wireframe: the STL mesh itself
export function asMesh(scene, material) {
  const o = scene.clone();
  const meshes = [];
  o.traverse((m) => m.isMesh && meshes.push(m));
  for (const m of meshes) {
    const lines = new THREE.LineSegments(new THREE.WireframeGeometry(m.geometry), material);
    lines.position.copy(m.position); lines.quaternion.copy(m.quaternion); lines.scale.copy(m.scale);
    m.parent.add(lines);
    m.removeFromParent();
  }
  return o;
}

// Loads the original STL exactly as exported (every triangle kept). Only the display changes:
// rotate into display axes and centre; shared vertices are merged so shading is smooth, not faceted.
export function usePartScene(p) {
  const raw = useLoader(STLLoader, `${import.meta.env.BASE_URL}models/${p.file}.stl`);
  return useMemo(() => {
    const a = p.axes;
    let g = raw.clone();
    g.deleteAttribute('normal');
    g.applyMatrix4(new THREE.Matrix4().set(a[0], a[1], a[2], 0, a[3], a[4], a[5], 0, a[6], a[7], a[8], 0, 0, 0, 0, 1));
    g = mergeVertices(g);
    g.computeVertexNormals();
    g.center();
    const scene = new THREE.Group();
    scene.add(new THREE.Mesh(g));
    return scene;
  }, [raw, p.axes]);
}

// Scale so the longest side is `size`, after rotating by rotY. Returns scale and the rotated bounds.
export function fit(scene, rotY, size) {
  const probe = new THREE.Group();
  probe.rotation.y = rotY;
  probe.add(scene.clone());
  probe.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(probe);
  const s = box.getSize(new THREE.Vector3());
  return { k: size / Math.max(s.x, s.y, s.z), box };
}

// The surface line runs smallest to flagship, so the Mustang finishes the show
export const LINE = [...PARTS].reverse();
