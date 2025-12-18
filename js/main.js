import * as THREE from '../three/three.module.js';
import { OrbitControls } from '../three/OrbitControls.js';
import { SculptBrush } from './sculptBrush.js';
import { ensureTopology } from './topology.js';

let scene, camera, renderer, controls;
let activeMesh = null;
let cameraLocked = false;
let sculpt;

/* ---------- Camera Lock ---------- */

export function setCameraLocked(state) {
  cameraLocked = state;
  if (controls) controls.enabled = !state;

  const btn = document.getElementById('lockCamera');
  if (btn) {
    btn.textContent = state ? 'Camera Locked' : 'Camera Free';
    btn.classList.toggle('active', state);
  }
}

/* ---------- Scene Setup ---------- */

function initThree() {
  const canvas = document.getElementById('viewport');

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(3, 3, 6);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 5);
  scene.add(dir);

  createCube();

  sculpt = new SculptBrush({
    scene,
    camera,
    canvas,
    getMesh: () => activeMesh,
    onStart: () => setCameraLocked(true),
    onEnd: () => setCameraLocked(false)
  });

  animate();
}

/* ---------- Mesh ---------- */

function createCube() {
  if (activeMesh) scene.remove(activeMesh);

  const geo = new THREE.BoxGeometry(1, 1, 1, 10, 10, 10);
  ensureTopology(geo);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa
  });

  activeMesh = new THREE.Mesh(geo, mat);
  scene.add(activeMesh);
}

/* ---------- UI ---------- */

function initUI() {
  const lockBtn = document.getElementById('lockCamera');
  const cubeBtn = document.getElementById('newCube');

  if (lockBtn) {
    lockBtn.onclick = () => {
      setCameraLocked(!cameraLocked);
    };
  }

  if (cubeBtn) {
    cubeBtn.onclick = createCube;
  }
}

/* ---------- Resize ---------- */

window.addEventListener('resize', () => {
  if (!camera || !renderer) return;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- Render ---------- */

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

/* ---------- DOM Ready ---------- */

window.addEventListener('DOMContentLoaded', () => {
  initUI();
  initThree();
});