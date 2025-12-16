import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { OBJLoader } from './three/OBJLoader.js';

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

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 3, 3);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

/* ---------------- CONTROLS ---------------- */

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* ---------------- LIGHTING ---------------- */

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
scene.add(dir);

/* ---------------- ACTIVE OBJECT ---------------- */

let currentObject = null;

/* ---------------- CORE FIX ---------------- */

function placeImportedObject(object) {
  if (currentObject) scene.remove(currentObject);

  object.traverse(child => {
    if (child.isMesh) {
      // Force geometry validity
      child.geometry.computeBoundingBox();
      child.geometry.computeVertexNormals();

      // Force visible material
      child.material = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        side: THREE.DoubleSide
      });

      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  object.updateWorldMatrix(true, true);

  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  // Center model
  object.position.sub(center);

  // Normalize scale (CRITICAL)
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 1.5 / maxDim;
  object.scale.setScalar(scale);

  scene.add(object);
  currentObject = object;

  controls.target.set(0, 0, 0);
  controls.update();

  setStatus('Object placed and visible');
}

/* ---------------- PRIMITIVES ---------------- */

function createCube() {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x44aa88 })
  );
  placeImportedObject(mesh);
}

function createSphere() {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xaa8844 })
  );
  placeImportedObject(mesh);
}

/* ---------------- OBJ LOADING ---------------- */

document.getElementById('objInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  setStatus('Loading OBJ…');

  const reader = new FileReader();
  reader.onload = () => {
    const loader = new OBJLoader();
    const obj = loader.parse(reader.result);

    placeImportedObject(obj);
    setStatus('OBJ loaded successfully');
  };

  reader.readAsText(file);
});

/* ---------------- UI ---------------- */

document.getElementById('newCube').onclick = createCube;
document.getElementById('newSphere').onclick = createSphere;

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
setStatus('Ready');