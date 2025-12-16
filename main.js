import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { OBJLoader } from './three/OBJLoader.js';

/* ---------------- DOM ELEMENTS ---------------- */
const canvas = document.getElementById('canvas');
const statusEl = document.getElementById('status');

function setStatus(msg) {
  statusEl.textContent = msg;
  console.log('Status:', msg);
}

/* ---------------- SCENE SETUP ---------------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);
scene.add(new THREE.AxesHelper(5)); // Larger axes for better visibility

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(6, 6, 6);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

/* ---------------- CONTROLS ---------------- */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();

/* ---------------- LIGHTING ---------------- */
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(10, 15, 10);
dirLight.castShadow = true;
scene.add(dirLight);

/* ---------------- CURRENT MODEL ---------------- */
let currentObject = null;

function removeCurrentObject() {
  if (currentObject) {
    scene.remove(currentObject);
    currentObject = null;
  }
}

function placeObject(object) {
  removeCurrentObject();

  const meshes = [];
  object.traverse((child) => {
    if (child.isMesh) {
      const pos = child.geometry.attributes.position;
      if (pos && pos.count >= 3) { // Minimum for a possible triangle
        meshes.push(child);
      }
    }
  });

  if (meshes.length === 0) {
    setStatus('Error: No valid meshes found in model');
    return;
  }

  let totalVertices = 0;
  meshes.forEach(mesh => {
    const geo = mesh.geometry;
    const posCount = geo.attributes.position.count;
    const indexCount = geo.index ? geo.index.count : 0;
    const faceEstimate = indexCount ? indexCount / 3 : Math.floor(posCount / 3);

    console.log(`Mesh "${mesh.name}": ${posCount} vertices, ${indexCount} indices, ~${faceEstimate} faces`);

    totalVertices += posCount;

    // Compute normals (critical for MeshStandardMaterial)
    geo.computeVertexNormals();

    // Override material for reliable visibility
    mesh.material = new THREE.MeshStandardMaterial({
      color: 0x7799ff,
      metalness: 0.1,
      roughness: 0.8,
      side: THREE.DoubleSide
    });

    // DEBUG: Uncomment for bright red wireframe (ignores lighting/normals)
    // mesh.material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });

    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  // Temporary add for correct world-space bounding box
  scene.add(object);
  const box = new THREE.Box3().setFromObject(object);
  scene.remove(object);

  const size = box.getSize(new THREE.Vector3());
  if (size.length() < 0.0001) {
    setStatus('Error: Model degenerate (zero size)');
    console.warn('Degenerate box:', box);
    return;
  }

  const center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const targetSize = 5; // Slightly larger view fit
  const scale = targetSize / maxDim;
  object.scale.setScalar(scale);

  scene.add(object);
  currentObject = object;

  controls.target.set(0, 0, 0);
  controls.reset();
  controls.update();

  setStatus(`Loaded: ${meshes.length} mesh(s), ${totalVertices} vertices total`);
}

/* ---------------- PRIMITIVES ---------------- */
function createCube() {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x44aa88 })
  );
  placeObject(mesh);
}

function createSphere() {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 32, 24),
    new THREE.MeshStandardMaterial({ color: 0xaa8844 })
  );
  placeObject(mesh);
}

/* ---------------- OBJ LOADING ---------------- */
document.getElementById('objInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file || !file.name.toLowerCase().endsWith('.obj')) {
    setStatus('Please select a valid .obj file');
    return;
  }

  setStatus('Loading OBJ...');

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const loader = new OBJLoader();
      const object = loader.parse(event.target.result);

      if (object.children.length === 0) {
        setStatus('Error: Parsed OBJ is empty');
        return;
      }

      placeObject(object);
    } catch (err) {
      setStatus('Failed to parse OBJ');
      console.error(err);
    }
  };
  reader.onerror = () => setStatus('Error reading file');
  reader.readAsText(file);
});

/* ---------------- UI BUTTONS ---------------- */
document.getElementById('newCube').onclick = createCube;
document.getElementById('newSphere').onclick = createSphere;

// Stubs for future voxel features
document.getElementById('convertBtn').onclick = () => setStatus('Voxel conversion: Not implemented yet');
document.getElementById('exportBtn').onclick = () => setStatus('Export JSON: Not implemented yet');
document.getElementById('paintBtn').onclick = () => setStatus('Paint tool: Coming soon');
document.getElementById('scaleBtn').onclick = () => setStatus('Scale tool: Coming soon');
document.getElementById('moveBtn').onclick = () => setStatus('Move tool: Coming soon');

/* ---------------- ANIMATION LOOP ---------------- */
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

/* ---------------- INITIALIZE ---------------- */
createCube();
setStatus('Ready – Load an OBJ or create a primitive');