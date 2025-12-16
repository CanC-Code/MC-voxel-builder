import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';

/* ---------------- DOM ---------------- */
const canvas = document.getElementById('canvas');
const statusEl = document.getElementById('status');

function setStatus(msg) {
  statusEl.textContent = msg;
  console.log(msg);
}

/* ---------------- SCENE ---------------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
scene.add(new THREE.AxesHelper(3));

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(5, 5, 5);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* ---------------- LIGHTING ---------------- */
scene.add(new THREE.AmbientLight(0xffffff, 0.9));

const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
dirLight.position.set(10, 15, 10);
dirLight.castShadow = true;
scene.add(dirLight);

/* ---------------- BASE MODEL ---------------- */
let baseMesh = null;
let wireframeEnabled = false;

function clearBaseMesh() {
  if (!baseMesh) return;
  scene.remove(baseMesh);
  baseMesh.geometry.dispose();
  baseMesh.material.dispose();
  baseMesh = null;
}

function prepareGeometry(geometry) {
  let g = geometry.clone();
  if (g.index) g = g.toNonIndexed();
  g.computeVertexNormals();
  return g;
}

function createBaseMesh(geometry) {
  clearBaseMesh();

  const geo = prepareGeometry(geometry);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x7799ff,
    roughness: 0.8,
    metalness: 0.1,
    wireframe: wireframeEnabled
  });

  baseMesh = new THREE.Mesh(geo, mat);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;

  // Center + scale
  const box = new THREE.Box3().setFromObject(baseMesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  baseMesh.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  baseMesh.scale.setScalar(4 / maxDim);

  scene.add(baseMesh);
  controls.target.set(0, 0, 0);
  controls.update();

  setStatus(`Editable mesh ready (${geo.attributes.position.count} vertices)`);
}

/* ---------------- PRIMITIVES ---------------- */
function createCube() {
  createBaseMesh(new THREE.BoxGeometry(1, 1, 1, 10, 10, 10));
}

function createSphere() {
  createBaseMesh(new THREE.SphereGeometry(0.8, 32, 24));
}

/* ---------------- UI ---------------- */
document.getElementById('newCube').onclick = createCube;
document.getElementById('newSphere').onclick = createSphere;

document.getElementById('wireframeBtn').onclick = (e) => {
  wireframeEnabled = !wireframeEnabled;
  if (baseMesh) {
    baseMesh.material.wireframe = wireframeEnabled;
  }
  e.target.classList.toggle('active', wireframeEnabled);
  setStatus(wireframeEnabled ? 'Mesh view enabled' : 'Mesh view disabled');
};

document.getElementById('convertBtn').onclick = () =>
  setStatus('Voxelization not implemented yet');

document.getElementById('exportBtn').onclick = () =>
  setStatus('Exporter coming next');

document.getElementById('paintBtn').onclick = () =>
  setStatus('Paint mode coming soon');

document.getElementById('scaleBtn').onclick = () =>
  setStatus('Scale tool coming soon');

document.getElementById('moveBtn').onclick = () =>
  setStatus('Move tool coming soon');

/* ---------------- LOOP ---------------- */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

/* ---------------- RESIZE ---------------- */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------------- INIT ---------------- */
createCube();