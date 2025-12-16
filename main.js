import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';

/* ---------- DOM ---------- */
const canvas = document.getElementById('canvas');
const statusEl = document.getElementById('status');

function setStatus(msg) {
  statusEl.textContent = msg;
  console.log(msg);
}

/* ---------- SCENE ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
scene.add(new THREE.AxesHelper(2));

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(4, 4, 4);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();

/* ---------- LIGHT ---------- */
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

/* ---------- BASE OBJECT ---------- */
let baseObject = null;

function clearBase() {
  if (!baseObject) return;
  scene.remove(baseObject);
  baseObject.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  baseObject = null;
}

function setBase(mesh) {
  clearBase();

  mesh.material = new THREE.MeshStandardMaterial({
    color: 0x7799ff,
    roughness: 0.7,
    metalness: 0.1
  });

  scene.add(mesh);
  baseObject = mesh;
  controls.target.set(0, 0, 0);
  controls.update();

  setStatus('Base model ready');
}

/* ---------- PRIMITIVES ---------- */
function createCube() {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.Mesh(geo);
  setBase(mesh);
}

function createSphere() {
  const geo = new THREE.SphereGeometry(0.7, 32, 24);
  const mesh = new THREE.Mesh(geo);
  setBase(mesh);
}

/* ---------- UI ---------- */
document.getElementById('newCube').onclick = createCube;
document.getElementById('newSphere').onclick = createSphere;

/* ---------- ANIMATE ---------- */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

/* ---------- RESIZE ---------- */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- START ---------- */
createCube();
setStatus('Ready – base model loaded');