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
scene.background = new THREE.Color(0x2e2e2e);

/* ---------- Camera ---------- */

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(3.5, 3.5, 5);

/* ---------- Controls ---------- */

let controls = null;

function enableControls() {
  if (controls) return;
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
}

function disableControls() {
  if (!controls) return;
  controls.dispose();
  controls = null;
}

/* ---------- Lighting ---------- */

scene.add(new THREE.AmbientLight(0xffffff, 0.35));

const key = new THREE.DirectionalLight(0xffffff, 0.9);
key.position.set(6, 10, 4);
scene.add(key);

const rim = new THREE.DirectionalLight(0xffffff, 0.4);
rim.position.set(-6, 4, -6);
scene.add(rim);

/* ---------- Grid ---------- */

const grid = new THREE.GridHelper(10, 10, 0x555555, 0x333333);
grid.position.y = -1.5;
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

/* ---------- Material ---------- */

function createClayMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xd8bfa3,
    roughness: 0.75,
    metalness: 0,
    wireframe: state.wireframe
  });
}

/* ---------- Primitives ---------- */

function createCube() {
  const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5, 24, 24, 24);
  setMesh(new THREE.Mesh(geo, createClayMaterial()));
}

function createSphere() {
  const geo = new THREE.SphereGeometry(1.2, 48, 48);
  setMesh(new THREE.Mesh(geo, createClayMaterial()));
}

/* ---------- Default ---------- */

createCube();
enableControls();

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
  },
  toggleCameraLock: () => {
    state.cameraLocked = !state.cameraLocked;

    if (state.cameraLocked) {
      disableControls();
    } else {
      enableControls();
    }
  }
});

/* ---------- Sculpt Interaction (ONLY when locked) ---------- */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let sculpting = false;

canvas.addEventListener("pointerdown", e => {
  if (!state.cameraLocked) return;
  if (e.button !== 0) return;
  sculpting = true;
});

canvas.addEventListener("pointerup", () => sculpting = false);
canvas.addEventListener("pointerleave", () => sculpting = false);

canvas.addEventListener("pointermove", e => {
  if (!sculpting || !state.cameraLocked || !state.brush || !activeMesh) return;

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
  if (controls) controls.update();
  renderer.render(scene, camera);
}
animate();