import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { GLTFExporter } from './three/GLTFExporter.js';

const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 1, 3);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(devicePixelRatio);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(2, 5, 3);
scene.add(dirLight);

let activeMesh;
let mode = 'orbit';
let tool = 'inflate';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();

const brushSize = document.getElementById('brushSize');
const brushStrength = document.getElementById('brushStrength');
const paintColor = document.getElementById('paintColor');

function setMode(m) {
  mode = m;
  controls.enabled = m === 'orbit';
}

document.getElementById('orbitBtn').onclick = () => setMode('orbit');
document.getElementById('sculptBtn').onclick = () => setMode('sculpt');
document.getElementById('paintBtn').onclick = () => setMode('paint');

document.getElementById('inflateBtn').onclick = () => tool = 'inflate';
document.getElementById('smoothBtn').onclick = () => tool = 'smooth';

document.getElementById('toggleToolbar').onclick = () => {
  document.getElementById('toolbar').classList.toggle('collapsed');
};

function addMesh(geometry) {
  if (activeMesh) scene.remove(activeMesh);
  const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, vertexColors: true });
  activeMesh = new THREE.Mesh(geometry, mat);
  geometry.computeVertexNormals();
  scene.add(activeMesh);
}

document.getElementById('addSphere').onclick = () =>
  addMesh(new THREE.SphereGeometry(0.6, 64, 64));

document.getElementById('addCube').onclick = () =>
  addMesh(new THREE.BoxGeometry(1, 1, 1, 32, 32, 32));

let isDragging = false;

canvas.addEventListener('pointerdown', () => {
  if (mode !== 'orbit') isDragging = true;
});

canvas.addEventListener('pointerup', () => isDragging = false);

canvas.addEventListener('pointermove', e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
});

function applyPaint(hit) {
  const geom = activeMesh.geometry;
  const pos = geom.attributes.position;
  let colorAttr = geom.attributes.color;

  if (!colorAttr) {
    const colors = new Float32Array(pos.count * 3);
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    colorAttr = geom.attributes.color;
  }

  const hitPoint = hit.point;
  const radius = +brushSize.value;
  const c = new THREE.Color(paintColor.value);

  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    if (v.distanceTo(hitPoint) > radius) continue;
    colorAttr.setXYZ(i, c.r, c.g, c.b);
  }

  colorAttr.needsUpdate = true;
}

function sculpt() {
  if (!isDragging || !activeMesh || mode === 'orbit') return;

  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObject(activeMesh)[0];
  if (!hit) return;

  if (mode === 'paint') {
    applyPaint(hit);
    return;
  }

  const geom = activeMesh.geometry;
  const pos = geom.attributes.position;
  const normal = geom.attributes.normal;

  const hitPoint = hit.point;
  const radius = +brushSize.value;
  const strength = +brushStrength.value * clock.getDelta();

  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    const d = v.distanceTo(hitPoint);
    if (d > radius) continue;

    const falloff = 1 - d / radius;

    if (tool === 'inflate') {
      const n = new THREE.Vector3().fromBufferAttribute(normal, i);
      v.addScaledVector(n, strength * falloff);
    } else {
      const dir = hitPoint.clone().sub(v);
      v.addScaledVector(dir, strength * falloff * 0.3);
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
    const mesh = gltf.scene.children.find(o => o.isMesh);
    if (!mesh) return;
    addMesh(mesh.geometry.clone());
    URL.revokeObjectURL(url);
  });
};

document.getElementById('exportBtn').onclick = () => {
  const exporter = new GLTFExporter();
  exporter.parse(activeMesh, gltf => {
    const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'model.gltf';
    a.click();
  });
};

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  sculpt();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});