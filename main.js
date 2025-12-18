import * as THREE from "./three/three.module.js";
import { OrbitControls } from "./three/OrbitControls.js";
import { TransformControls } from "./three/TransformControls.js";
import { GLTFLoader } from "./three/GLTFLoader.js";
import { GLTFExporter } from "./three/GLTFExporter.js";

const canvas = document.getElementById("viewport");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a3a3a);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(4, 4, 6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const transform = new TransformControls(camera, renderer.domElement);
scene.add(transform);

let activeMesh = null;
let wireframe = false;
let cameraLocked = false;

/* Lighting */
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
scene.add(dir);

/* Helpers */
scene.add(new THREE.GridHelper(20, 20));

/* Resize */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* Mesh creation */
function setActive(mesh) {
  if (activeMesh) {
    transform.detach();
  }
  activeMesh = mesh;
  transform.attach(mesh);
}

function createCube() {
  const geo = new THREE.BoxGeometry(2, 2, 2, 10, 10, 10);
  const mat = new THREE.MeshStandardMaterial({ color: 0x88ccff });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  setActive(mesh);
}

function createSphere() {
  const geo = new THREE.SphereGeometry(1.5, 32, 32);
  const mat = new THREE.MeshStandardMaterial({ color: 0x88ff88 });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  setActive(mesh);
}

/* Default object */
createCube();

/* UI */
document.getElementById("toggleMenu").onclick = () => {
  document.getElementById("menu").classList.toggle("collapsed");
};

document.getElementById("lockCamera").onclick = () => {
  cameraLocked = !cameraLocked;
  controls.enabled = !cameraLocked;
};

document.getElementById("toggleWire").onclick = () => {
  wireframe = !wireframe;
  if (activeMesh) activeMesh.material.wireframe = wireframe;
};

document.getElementById("newCube").onclick = createCube;
document.getElementById("newSphere").onclick = createSphere;

/* Export */
document.getElementById("exportGLTF").onclick = () => {
  if (!activeMesh) return;
  const exporter = new GLTFExporter();
  exporter.parse(
    activeMesh,
    (gltf) => {
      const blob = new Blob([JSON.stringify(gltf)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "model.gltf";
      a.click();
    },
    { binary: false }
  );
};

/* Import */
document.getElementById("importGLTF").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const loader = new GLTFLoader();
    loader.parse(reader.result, "", (gltf) => {
      scene.add(gltf.scene);
      setActive(gltf.scene.children[0]);
    });
  };
  reader.readAsArrayBuffer(file);
};

/* Loop */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();