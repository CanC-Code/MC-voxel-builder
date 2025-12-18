import * as THREE from '../three/three.module.js';
import { OrbitControls } from '../three/OrbitControls.js';

import { SculptBrush } from './sculptBrush.js';
import { ensureTopology } from './topology.js';

const canvas = document.getElementById('viewport');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(3, 3, 6);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

let cameraLocked = false;

export function setCameraLocked(state) {
  cameraLocked = state;
  controls.enabled = !state;

  const btn = document.getElementById('lockCamera');
  btn.textContent = state ? 'Camera Locked' : 'Camera Free';
  btn.classList.toggle('active', state);
}

/* ---------- Lighting ---------- */

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 5);
scene.add(dir);

/* ---------- Mesh ---------- */

let activeMesh = null;

function createCube() {
  if (activeMesh) scene.remove(activeMesh);

  const geo = new THREE.BoxGeometry(1, 1, 1, 10, 10, 10);
  ensureTopology(geo);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    flatShading: false
  });

  activeMesh = new THREE.Mesh(geo, mat);
  scene.add(activeMesh);
}

createCube();

/* ---------- Sculpt Brush ---------- */

const sculpt = new SculptBrush({
  scene,
  camera,
  canvas,
  getMesh: () => activeMesh,
  onStart: () => setCameraLocked(true),
  onEnd: () => setCameraLocked(false)
});

/* ---------- UI ---------- */

document.getElementById('lockCamera').onclick = () => {
  setCameraLocked(!cameraLocked);
};

document.getElementById('newCube').onclick = createCube;

/* ---------- Resize ---------- */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- Render Loop ---------- */

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();