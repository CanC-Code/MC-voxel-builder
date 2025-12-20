import * as THREE from "../three/three.module.js";
import { OrbitControls } from "../three/OrbitControls.js";
import { TransformControls } from "../three/TransformControls.js";

/* ================= Renderer ================= */

const canvas = document.getElementById("viewport");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;

/* ================= Main Scene ================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e1e1e);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(3, 3, 3);

/* ================= Orbit Controls ================= */

const orbit = new OrbitControls(camera, canvas);
orbit.enableDamping = true;
orbit.mouseButtons = {
  LEFT: null,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE
};
orbit.touches = {
  ONE: null,
  TWO: THREE.TOUCH.ROTATE
};

/* ================= Lighting ================= */

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 5, 5);
scene.add(dir);

/* ================= Active Mesh ================= */

let activeMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshStandardMaterial({ color: 0xb0b0b0 })
);
scene.add(activeMesh);

/* ================= Transform Gizmo ================= */

const transform = new TransformControls(camera, canvas);
transform.attach(activeMesh);
transform.visible = true;
scene.add(transform);

transform.addEventListener("dragging-changed", e => {
  orbit.enabled = !e.value;
});

/* ================= View Cube ================= */

const viewScene = new THREE.Scene();

const viewCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
viewCamera.position.set(2, 2, 2);
viewCamera.lookAt(0, 0, 0);

const viewCube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshNormalMaterial()
);
viewScene.add(viewCube);

/* ================= UI Bindings ================= */

const toggleGizmoBtn = document.getElementById("toggleGizmo");
if (toggleGizmoBtn) {
  toggleGizmoBtn.onclick = () => {
    transform.visible = !transform.visible;
  };
}

/* ================= Render Loop ================= */

function render() {
  requestAnimationFrame(render);

  orbit.update();

  renderer.clear();

  // Main Scene
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissorTest(false);
  renderer.render(scene, camera);

  // View Cube (Top Right)
  const size = 120;
  const margin = 12;

  renderer.setScissorTest(true);
  renderer.setScissor(
    window.innerWidth - size - margin,
    window.innerHeight - size - margin,
    size,
    size
  );
  renderer.setViewport(
    window.innerWidth - size - margin,
    window.innerHeight - size - margin,
    size,
    size
  );

  viewCamera.quaternion.copy(camera.quaternion);
  renderer.render(viewScene, viewCamera);
  renderer.setScissorTest(false);
}

render();

/* ================= Resize ================= */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});