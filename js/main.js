import * as THREE from "../three/three.module.js";
import { OrbitControls } from "../three/OrbitControls.js";
import { TransformControls } from "../three/TransformControls.js";
import { GLTFLoader } from "../three/GLTFLoader.js";
import { GLTFExporter } from "../three/GLTFExporter.js";
import { SculptBrush } from "./sculptBrush.js";
import { initUI } from "./ui.js";

/* ===============================
   Core Setup
================================ */
const canvas = document.getElementById("viewport");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb0c4de);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 4, 6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = true;
controls.enableRotate = true;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,   // Override later in sculpt mode
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE
};

const transform = new TransformControls(camera, renderer.domElement);
scene.add(transform);

/* ===============================
   State
================================ */
let activeMesh = null;
let cameraLocked = false;
let sculpting = false;
let wireframe = false;

const state = {
  brush: null,
  controls,
  cameraLocked,
  wireframe,
  mode: "sculpt",
  gizmoEnabled: true,
  setMode: m => {
    state.mode = m;
    switch (m) {
      case "sculpt":
        transform.detach();
        controls.enabled = !cameraLocked;
        break;
      case "move":
      case "rotate":
      case "scale":
        if (activeMesh && state.gizmoEnabled) transform.attach(activeMesh);
        break;
    }
  },
  toggleGizmo: () => {
    state.gizmoEnabled = !state.gizmoEnabled;
    if (!state.gizmoEnabled) transform.detach();
    else if (activeMesh) transform.attach(activeMesh);
  },
  resetCamera: () => {
    camera.position.set(4, 4, 6);
    camera.lookAt(0, 0, 0);
  },
  toggleWireframe: () => {
    wireframe = !wireframe;
    if (activeMesh) activeMesh.material.wireframe = wireframe;
  },
  createCube,
  createSphere,
  exportGLTF,
  importGLTF
};

/* ===============================
   Lighting & Helpers
================================ */
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
scene.add(dir);
scene.add(new THREE.GridHelper(20, 20));

/* ===============================
   Resize
================================ */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ===============================
   Active Mesh Handling
================================ */
function clearActiveMesh() {
  if (!activeMesh) return;
  transform.detach();
  scene.remove(activeMesh);
  activeMesh.geometry.dispose();
  activeMesh.material.dispose();
  activeMesh = null;
  state.brush = null;
}

function setActive(mesh) {
  clearActiveMesh();
  activeMesh = mesh;
  scene.add(mesh);
  if (state.gizmoEnabled && state.mode !== "sculpt") transform.attach(mesh);
  if (!state.brush) state.brush = new SculptBrush(activeMesh);
}

/* ===============================
   Mesh Creation
================================ */
function createCube() {
  setActive(new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2, 24, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0x88ccff, wireframe })
  ));
}

function createSphere() {
  setActive(new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 64, 64),
    new THREE.MeshStandardMaterial({ color: 0x88ff88, wireframe })
  ));
}

/* ===============================
   GLTF Export / Import
================================ */
function exportGLTF() {
  if (!activeMesh) return;
  new GLTFExporter().parse(activeMesh, gltf => {
    const blob = new Blob([JSON.stringify(gltf)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "model.gltf";
    a.click();
  });
}

function importGLTF(e) {
  const reader = new FileReader();
  reader.onload = () => {
    new GLTFLoader().parse(reader.result, "", gltf => {
      const mesh = gltf.scene.getObjectByProperty("type", "Mesh");
      if (mesh) setActive(mesh);
    });
  };
  reader.readAsArrayBuffer(e.target.files[0]);
}

/* ===============================
   Cursor Brush
================================ */
const cursorBrush = document.getElementById("cursorBrush");
renderer.domElement.addEventListener("pointermove", e => {
  cursorBrush.style.left = e.clientX + "px";
  cursorBrush.style.top = e.clientY + "px";
  cursorBrush.style.display = "block";
});
renderer.domElement.addEventListener("pointerleave", () => {
  cursorBrush.style.display = "none";
});

/* ===============================
   Sculpting Core
================================ */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener("pointerdown", e => {
  if (!activeMesh || state.mode !== "sculpt") return;
  sculpting = true;
  transform.detach();
  applyBrush(e);
});

renderer.domElement.addEventListener("pointerup", () => {
  sculpting = false;
  if (activeMesh && state.gizmoEnabled && state.mode !== "sculpt") transform.attach(activeMesh);
});

renderer.domElement.addEventListener("pointermove", e => {
  if (sculpting) applyBrush(e);
});

function applyBrush(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObject(activeMesh)[0];
  if (!hit) return;

  state.brush.apply(hit.point, camera.getWorldDirection(new THREE.Vector3()));
}

/* ===============================
   Default Cube
================================ */
createCube();

/* ===============================
   Initialize UI
================================ */
initUI(state);

/* ===============================
   Render Loop
================================ */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();