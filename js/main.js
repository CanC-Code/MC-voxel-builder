import * as THREE from "../three/three.module.js";
import { OrbitControls } from "../three/OrbitControls.js";
import { TransformControls } from "../three/TransformControls.js";
import { SculptBrush } from "./sculptBrush.js";
import { initUI } from "./ui.js";

/* ===============================
   Renderer / Scene
================================ */

const canvas = document.getElementById("viewport");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x1e1e1e);

const scene = new THREE.Scene();

/* ===============================
   Camera & Navigation
================================ */

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(3, 3, 3);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Sculpt-friendly camera rules
controls.mouseButtons.LEFT = null;
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
controls.touches.ONE = THREE.TOUCH.NONE;
controls.touches.TWO = THREE.TOUCH.ROTATE;

/* ===============================
   Lighting
================================ */

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
scene.add(dir);

/* ===============================
   Transform Gizmo (Object)
================================ */

const transform = new TransformControls(camera, canvas);
transform.size = 0.9;
scene.add(transform);

/* ===============================
   Active Mesh & Brush
================================ */

let activeMesh = null;
let brush = null;

function setActiveMesh(mesh) {
  if (activeMesh) scene.remove(activeMesh);

  activeMesh = mesh;
  scene.add(activeMesh);

  brush = new SculptBrush(activeMesh);
  transform.attach(activeMesh);
}

/* Default mesh */
setActiveMesh(
  new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1, 32, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0x4fa3ff,
      roughness: 0.35,
      metalness: 0.05
    })
  )
);

/* ===============================
   Sculpt Interaction
================================ */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener("pointerdown", e => {
  if (state.mode !== "sculpt") return;
  if (!brush) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObject(activeMesh, false);

  if (hit.length) {
    brush.apply(hit[0].point);
  }
});

/* ===============================
   Application State (SAFE)
================================ */

let gizmoVisible = true;

const state = {
  mode: "sculpt",

  setMode(mode) {
    this.mode = mode;

    if (mode === "move") transform.setMode("translate");
    if (mode === "rotate") transform.setMode("rotate");
    if (mode === "scale") transform.setMode("scale");

    controls.enabled = mode !== "sculpt";
  },

  toggleGizmo() {
    gizmoVisible = !gizmoVisible;
    transform.visible = gizmoVisible;
  },

  toggleWireframe() {
    if (activeMesh) {
      activeMesh.material.wireframe =
        !activeMesh.material.wireframe;
    }
  },

  setTool(t) {
    if (brush) brush.setTool(t);
  },

  setRadius(r) {
    if (brush) brush.setRadius(r);
  },

  setStrength(s) {
    if (brush) brush.setStrength(s);
  },

  createCube() {
    setActiveMesh(
      new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1, 32, 32, 32),
        activeMesh.material.clone()
      )
    );
  },

  createSphere() {
    setActiveMesh(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 48, 48),
        activeMesh.material.clone()
      )
    );
  },

  exportGLTF() {
    console.warn("GLTF export placeholder");
  }
};

initUI(state);

/* ===============================
   Resize
================================ */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ===============================
   Render Loop
================================ */

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();