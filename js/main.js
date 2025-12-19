import * as THREE from "./three/three.module.js";
import { OrbitControls } from "./three/OrbitControls.js";
import { TransformControls } from "./three/TransformControls.js";
import { GLTFLoader } from "./three/GLTFLoader.js";
import { GLTFExporter } from "./three/GLTFExporter.js";
import { initUI } from "./ui.js";

/* ===============================
   Core Setup
================================ */

const canvas = document.getElementById("viewport");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb0c4de); // light steel blue

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 4, 6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const transform = new TransformControls(camera, renderer.domElement);
scene.add(transform);

/* ===============================
   Lighting & Helpers
================================ */

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
scene.add(dir);
scene.add(new THREE.GridHelper(20, 20));

/* ===============================
   State
================================ */

let activeMesh = null;
let wireframe = false;
let cameraLocked = false;
let sculpting = false;

const state = {
  controls,
  cameraLocked,
  wireframe,
  brush: null
};

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
  transform.attach(mesh);
  state.brush = mesh.sculptBrush || null;
  mesh.material.wireframe = state.wireframe;
}

/* ===============================
   Mesh Creation
================================ */

function createCube() {
  const geo = new THREE.BoxGeometry(2, 2, 2, 24, 24, 24);
  const mat = new THREE.MeshStandardMaterial({ color: 0x88ccff, wireframe });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.sculptBrush = new SculptBrush(mesh);
  setActive(mesh);
}

function createSphere() {
  const geo = new THREE.SphereGeometry(1.5, 64, 64);
  const mat = new THREE.MeshStandardMaterial({ color: 0x88ff88, wireframe });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.sculptBrush = new SculptBrush(mesh);
  setActive(mesh);
}

/* ===============================
   Default Mesh
================================ */

createCube();

/* ===============================
   UI Wiring
================================ */

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
    controls.enableRotate = !state.cameraLocked;
  }
});

/* ===============================
   Sculpting
================================ */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const cursorBrush = document.getElementById("cursorBrush");

// Pointer / touch helpers
function getPointerPos(e) {
  if (e.touches) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1
    };
  } else {
    return {
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1
    };
  }
}

function handleSculpt(e) {
  if (!sculpting || !activeMesh || !state.brush) return;
  const pos = getPointerPos(e);
  mouse.x = pos.x;
  mouse.y = pos.y;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(activeMesh);
  if (!hits.length) return;

  const viewDir = new THREE.Vector3();
  camera.getWorldDirection(viewDir);

  state.brush.apply(hits[0].point, viewDir);
}

// Desktop mouse
canvas.addEventListener("pointerdown", e => { if (e.button === 0) sculpting = true; });
canvas.addEventListener("pointerup", () => sculpting = false);
canvas.addEventListener("pointerleave", () => sculpting = false);
canvas.addEventListener("pointermove", e => {
  handleSculpt(e);
  cursorBrush.style.left = e.clientX + "px";
  cursorBrush.style.top = e.clientY + "px";
  cursorBrush.style.display = "block";
});
canvas.addEventListener("pointerout", () => { cursorBrush.style.display = "none"; });

// Touch
let touchState = { isSculpt: false, isOrbit: false, lastDistance: 0, lastTouchPos: null };

canvas.addEventListener("touchstart", e => {
  if (e.touches.length === 1) {
    sculpting = true;
    touchState.isSculpt = true;
  } else if (e.touches.length === 2) {
    sculpting = false;
    touchState.isOrbit = true;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    touchState.lastDistance = Math.hypot(dx, dy);
    touchState.lastTouchPos = { x: (e.touches[0].clientX + e.touches[1].clientX)/2, y: (e.touches[0].clientY + e.touches[1].clientY)/2 };
  }
});

canvas.addEventListener("touchmove", e => {
  if (touchState.isSculpt) handleSculpt(e);
  else if (touchState.isOrbit && e.touches.length === 2) {
    if (state.cameraLocked) return;

    const dx = (e.touches[0].clientX + e.touches[1].clientX)/2 - touchState.lastTouchPos.x;
    const dy = (e.touches[0].clientY + e.touches[1].clientY)/2 - touchState.lastTouchPos.y;

    controls.rotateLeft(dx * 0.005);
    controls.rotateUp(dy * 0.005);

    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    camera.position.multiplyScalar(touchState.lastDistance / dist);
    touchState.lastDistance = dist;

    touchState.lastTouchPos = { x: (e.touches[0].clientX + e.touches[1].clientX)/2, y: (e.touches[0].clientY + e.touches[1].clientY)/2 };
  }
});

canvas.addEventListener("touchend", e => { sculpting = false; touchState.isSculpt = false; touchState.isOrbit = false; });

/* ===============================
   Export / Import
================================ */

document.getElementById("exportGLTF").onclick = () => {
  if (!activeMesh) return;
  new GLTFExporter().parse(activeMesh, gltf => {
    const blob = new Blob([JSON.stringify(gltf)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "model.gltf";
    a.click();
  });
};

document.getElementById("importGLTF").onchange = e => {
  const reader = new FileReader();
  reader.onload = () => {
    new GLTFLoader().parse(reader.result, "", gltf => {
      const mesh = gltf.scene.getObjectByProperty("type", "Mesh");
      if (mesh) setActive(mesh);
    });
  };
  reader.readAsArrayBuffer(e.target.files[0]);
};

/* ===============================
   Resize & Render
================================ */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();