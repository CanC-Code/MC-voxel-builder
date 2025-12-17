import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { GLTFExporter } from './three/GLTFExporter.js';

const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.01,
  100
);
camera.position.set(0, 1, 3);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(devicePixelRatio);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(2, 5, 3);
scene.add(light);

let activeMesh;
let mode = 'orbit';
let tool = 'inflate';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();

const brushSizeInput = document.getElementById('brushSize');
const brushStrengthInput = document.getElementById('brushStrength');

function createDefaultMesh() {
  const geo = new THREE.SphereGeometry(0.6, 64, 64);
  const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
  activeMesh = new THREE.Mesh(geo, mat);
  scene.add(activeMesh);
}

createDefaultMesh();

function setMode(newMode) {
  mode = newMode;
  controls.enabled = mode === 'orbit';
  document.getElementById('orbitBtn').classList.toggle('active', mode === 'orbit');
  document.getElementById('sculptBtn').classList.toggle('active', mode === 'sculpt');
}

document.getElementById('orbitBtn').onclick = () => setMode('orbit');
document.getElementById('sculptBtn').onclick = () => setMode('sculpt');

document.getElementById('inflateBtn').onclick = () => tool = 'inflate';
document.getElementById('smoothBtn').onclick = () => tool = 'smooth';

let isSculpting = false;

canvas.addEventListener('pointerdown', e => {
  if (mode !== 'sculpt') return;
  isSculpting = true;
});

canvas.addEventListener('pointerup', () => {
  isSculpting = false;
});

canvas.addEventListener('pointermove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

function sculpt() {
  if (!isSculpting || !activeMesh) return;

  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObject(activeMesh);
  if (!hit.length) return;

  const geom = activeMesh.geometry;
  const pos = geom.attributes.position;
  const normal = geom.attributes.normal;

  const hitPoint = hit[0].point;
  const radius = parseFloat(brushSizeInput.value);
  const strength = parseFloat(brushStrengthInput.value);
  const delta = clock.getDelta();

  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    const dist = v.distanceTo(hitPoint);
    if (dist > radius) continue;

    const falloff = 1 - dist / radius;
    const influence = falloff * strength * delta;

    if (tool === 'inflate') {
      const n = new THREE.Vector3().fromBufferAttribute(normal, i);
      v.addScaledVector(n, influence);
    } else if (tool === 'smooth') {
      const dir = hitPoint.clone().sub(v);
      v.addScaledVector(dir, influence * 0.3);
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  pos.needsUpdate = true;
  geom.computeVertexNormals();
}

const loader = new GLTFLoader();
document.getElementById('fileInput').onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  loader.load(url, gltf => {
    if (activeMesh) scene.remove(activeMesh);

    activeMesh = gltf.scene.children.find(o => o.isMesh);
    activeMesh.geometry = activeMesh.geometry.clone();
    scene.add(activeMesh);

    URL.revokeObjectURL(url);
  });
};

document.getElementById('exportBtn').onclick = () => {
  const exporter = new GLTFExporter();
  exporter.parse(
    activeMesh,
    gltf => {
      const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'model.gltf';
      a.click();
    },
    { binary: false }
  );
};

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  sculpt();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});