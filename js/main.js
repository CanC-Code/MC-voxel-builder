import * as THREE from "../three/three.module.js";
import { OrbitControls } from "../three/OrbitControls.js";
import { SculptBrush } from "./sculptBrush.js";
import { initUI } from "./ui.js";

/* ---------- Renderer / Scene ---------- */

const canvas = document.getElementById("viewport");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4a4a4a);

/* ---------- Camera ---------- */

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(3.5, 3.5, 5);

/* ---------- Controls ---------- */

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/* ---------- Lighting (studio-style) ---------- */

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const key = new THREE.DirectionalLight(0xffffff, 0.6);
key.position.set(5, 10, 5);
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 0.3);
fill.position.set(-5, 5, -5);
scene.add(fill);

/* ---------- Grid ---------- */

const grid = new THREE.GridHelper(10, 10, 0x666666, 0x444444);
scene.add(grid);

/* ---------- State ---------- */

let activeMesh = null;

const state = {
  cameraLocked: false,
  wireframe: false,
  brush: null,

  setTool: t => state.brush && state.brush.setTool(t),
  setRadius: r => state.brush && state.brush.setRadius(r),
  setStrength: s => state.brush && state.brush.setStrength(s)
};

/* ---------- Mesh Helpers ---------- */

function clearMesh() {
  if (!activeMesh) return;

  scene.remove(activeMesh);
  activeMesh.geometry.dispose();
  activeMesh.material.dispose();
  activeMesh = null;
  state.brush = null;
}

function setMesh(mesh) {
  clearMesh();
  activeMesh = mesh;
  scene.add(mesh);
  state.brush = new SculptBrush(mesh);
}

/* ---------- Primitives ---------- */

function createCube() {
  const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5, 24, 24, 24);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xbfdfff,
    roughness: 0.6,
    metalness: 0,
    wireframe: state.wireframe
  });
  setMesh(new THREE.Mesh(geo, mat));
}

function createSphere() {
  const geo = new THREE.SphereGeometry(1.2, 48, 48);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xbfffd0,
    roughness: 0.6,
    metalness: 0,
    wireframe: state.wireframe
  });
  setMesh(new THREE.Mesh(geo, mat));
}

/* ---------- Default ---------- */

createCube();

/* ---------- UI Wiring ---------- */

initUI({
  ...state,
  createCube,
  createSphere,
  toggleWireframe: () => {
    state.wireframe = !state.wireframe;
    if (activeMesh) {
      activeMesh.material.wireframe = state.wireframe;
      activeMesh.material.needsUpdate = true;
    }
  }
});

/* ---------- Sculpt Interaction ---------- */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let sculpting = false;

canvas.addEventListener("pointerdown", () => sculpting = true);
canvas.addEventListener("pointerup", () => sculpting = false);
canvas.addEventListener("pointerleave", () => sculpting = false);

canvas.addEventListener("pointermove", e => {
  if (!sculpting || !activeMesh || !state.brush) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(activeMesh);
  if (!hits.length) return;

  const viewDir = new THREE.Vector3();
  camera.getWorldDirection(viewDir);

  state.brush.apply(hits[0].point, viewDir);
});

/* ---------- Resize ---------- */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- Loop ---------- */

function animate() {
  requestAnimationFrame(animate);
  controls.enabled = !state.cameraLocked;
  controls.update();
  renderer.render(scene, camera);
}
animate();