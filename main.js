// main.js – MC Voxel Builder (stable, mobile-safe)

import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFExporter } from './three/GLTFExporter.js';

let scene, camera, renderer, controls;
let activeMesh = null;
let started = false;

/* ---------- BOOTSTRAP ---------- */

function startApp() {
  if (started) return;
  started = true;

  init();
  animate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

/* ---------- INIT ---------- */

function init() {
  const container = document.getElementById('three-container');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202025);

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0.5, 0);

  // Lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));

  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(5, 10, 7);
  scene.add(dir);

  // Grid
  scene.add(new THREE.GridHelper(20, 20));

  // UI
  bindButton('newCube', createCube);
  bindButton('newSphere', createSphere);
  bindButton('resetScene', resetScene);
  bindButton('exportGLTF', exportScene);

  window.addEventListener('resize', onResize);
}

/* ---------- UI HELPERS ---------- */

function bindButton(id, fn) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`UI element not found #${id}`);
    return;
  }
  el.addEventListener('click', fn);
}

function setStatus(text) {
  const s = document.getElementById('status');
  if (s) s.textContent = text;
}

/* ---------- SCENE CONTENT ---------- */

function clearActiveMesh() {
  if (!activeMesh) return;

  scene.remove(activeMesh);
  activeMesh.geometry.dispose();
  activeMesh.material.dispose();
  activeMesh = null;
}

function createCube() {
  clearActiveMesh();

  activeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x44aa88 })
  );

  activeMesh.position.y = 0.5;
  scene.add(activeMesh);
  setStatus('Cube created');
}

function createSphere() {
  clearActiveMesh();

  activeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xaa4444 })
  );

  activeMesh.position.y = 0.6;
  scene.add(activeMesh);
  setStatus('Sphere created');
}

function resetScene() {
  clearActiveMesh();
  controls.reset();
  setStatus('Scene reset');
}

/* ---------- EXPORT ---------- */

function exportScene() {
  const exporter = new GLTFExporter();

  exporter.parse(
    scene,
    (gltf) => {
      const blob = new Blob(
        [JSON.stringify(gltf, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'scene.gltf';
      a.click();

      URL.revokeObjectURL(url);
    },
    { binary: false }
  );
}

/* ---------- RESIZE ---------- */

function onResize() {
  const container = document.getElementById('three-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

/* ---------- LOOP ---------- */

function animate() {
  requestAnimationFrame(animate);

  if (activeMesh) {
    activeMesh.rotation.y += 0.01;
  }

  controls.update();
  renderer.render(scene, camera);
}