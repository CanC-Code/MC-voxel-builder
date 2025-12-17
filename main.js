import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFExporter } from './three/GLTFExporter.js';
import { TransformControls } from './three/TransformControls.js';

let scene, camera, renderer, orbitControls, transformControls;
let activeObject = null;
let started = false;

/** Entry point */
function startApp() {
  if (started) return;
  started = true;
  init();
  animate();
}

/** DOM ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

function init() {
  const container = document.getElementById('viewport-container');

  // --- SCENE ---
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202025);

  // --- CAMERA ---
  camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 5);

  // --- RENDERER ---
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('canvas') });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // --- ORBIT CONTROLS ---
  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.08;
  orbitControls.target.set(0, 0.5, 0);

  // --- LIGHTS ---
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(5, 10, 7);
  scene.add(dir);

  // --- GRID ---
  scene.add(new THREE.GridHelper(20, 20));

  // --- INITIAL OBJECT ---
  addObject('cube');

  // --- TRANSFORM CONTROLS ---
  transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.attach(activeObject);
  transformControls.addEventListener('dragging-changed', function (event) {
    orbitControls.enabled = !event.value;
  });
  scene.add(transformControls);

  // --- UI HOOKS ---
  bindButton('exportGLTF', exportScene);
  bindButton('resetScene', resetScene);
  bindButton('newCube', () => switchObject('cube'));
  bindButton('newSphere', () => switchObject('sphere'));
  const modeSelect = document.getElementById('modeSelect');
  modeSelect.addEventListener('change', () => {
    transformControls.setMode(modeSelect.value);
  });

  // --- RESIZE ---
  window.addEventListener('resize', onWindowResize);
}

/** Safe button binding */
function bindButton(id, handler) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`UI element not found #${id}`);
    return;
  }
  el.addEventListener('click', handler);
}

/** Add object helper */
function addObject(type) {
  if (activeObject) scene.remove(activeObject);

  if (type === 'cube') {
    activeObject = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x44aa88 })
    );
  } else if (type === 'sphere') {
    activeObject = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xaa4444 })
    );
  }

  activeObject.position.y = 0.5;
  scene.add(activeObject);
  transformControls.attach(activeObject);
}

/** Switch object */
function switchObject(type) {
  addObject(type);
}

/** Export scene */
function exportScene() {
  const exporter = new GLTFExporter();
  exporter.parse(scene, (gltf) => {
    const blob = new Blob([JSON.stringify(gltf, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.gltf';
    a.click();
    URL.revokeObjectURL(url);
  });
}

/** Reset camera and controls */
function resetScene() {
  orbitControls.reset();
  if (activeObject) transformControls.attach(activeObject);
}

/** Handle window resize */
function onWindowResize() {
  const container = document.getElementById('viewport-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

/** Render loop */
function animate() {
  requestAnimationFrame(animate);
  orbitControls.update();
  renderer.render(scene, camera);
}