import * as THREE from "../three/three.module.js";
import { OrbitControls } from "../three/OrbitControls.js";
import { TransformControls } from "../three/TransformControls.js";
import { GLTFExporter } from "../three/GLTFExporter.js";
import { GLTFLoader } from "../three/GLTFLoader.js";
import { SculptBrush } from "./sculptBrush.js";
import { initUI } from "./ui.js";
import { ViewCube } from "./viewCube.js";

/* Core */
const canvas = document.getElementById("viewport");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfd1e5);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(4, 4, 6);

/* Controls */
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
controls.mouseButtons.LEFT = null;

const transform = new TransformControls(camera, canvas);
transform.enabled = false;
scene.add(transform);

/* Lights */
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
scene.add(dir);

/* State */
let activeMesh = null;
let brush = null;
let wireframe = false;

const state = {
  setTool: t => brush && brush.setTool(t),
  setRadius: r => brush && brush.setRadius(r),
  setStrength: s => brush && brush.setStrength(s),

  setTransformMode(mode) {
    if (mode === "sculpt") {
      transform.enabled = false;
      controls.enabled = true;
    } else {
      transform.enabled = true;
      transform.setMode(mode);
    }
  },

  toggleWireframe() {
    wireframe = !wireframe;
    if (activeMesh) activeMesh.material.wireframe = wireframe;
  },

  createCube,
  createSphere,
  exportGLTF,
  importGLTF
};

/* Mesh */
function setActive(mesh) {
  if (activeMesh) scene.remove(activeMesh);
  activeMesh = mesh;
  scene.add(mesh);
  transform.attach(mesh);
  brush = new SculptBrush(mesh);
}

function createCube() {
  setActive(
    new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2, 24, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0x88ccff, wireframe })
    )
  );
}

function createSphere() {
  setActive(
    new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 64, 64),
      new THREE.MeshStandardMaterial({ color: 0x88ff88, wireframe })
    )
  );
}

/* Sculpt input */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let sculpting = false;

canvas.addEventListener("pointerdown", e => {
  if (e.pointerType === "touch" && e.touches?.length > 1) return;
  sculpting = true;
});

canvas.addEventListener("pointerup", () => sculpting = false);

canvas.addEventListener("pointermove", e => {
  if (!sculpting || !brush) return;

  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObject(activeMesh)[0];
  if (hit) brush.apply(hit.point, camera.getWorldDirection(new THREE.Vector3()));
});

/* View Cube */
const viewCube = new ViewCube(camera, renderer);

/* UI */
initUI(state);
createCube();

/* Loop */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  viewCube.render();
}
animate();