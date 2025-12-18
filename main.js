import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.159/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/controls/TransformControls.js";

let scene, camera, renderer;
let orbit, transform;
let activeObject = null;
let cameraLocked = false;
let activeBrush = "add";

const canvas = document.getElementById("viewport");

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 5);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;

  transform = new TransformControls(camera, renderer.domElement);
  transform.addEventListener("dragging-changed", e => {
    orbit.enabled = !e.value;
  });
  scene.add(transform);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040));

  const grid = new THREE.GridHelper(50, 50);
  scene.add(grid);

  wireUI();
  window.addEventListener("resize", resize);
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function createPrimitive(type) {
  let geo;
  if (type === "cube") geo = new THREE.BoxGeometry(1, 1, 1);
  if (type === "sphere") geo = new THREE.SphereGeometry(0.5, 24, 24);

  const mat = new THREE.MeshStandardMaterial({ color: 0x88ccff });
  const mesh = new THREE.Mesh(geo, mat);

  scene.add(mesh);
  selectObject(mesh);
}

function selectObject(obj) {
  activeObject = obj;
  transform.attach(obj);
}

function wireUI() {
  document.querySelectorAll("[data-primitive]").forEach(btn => {
    btn.onclick = () => createPrimitive(btn.dataset.primitive);
  });

  document.querySelectorAll("[data-brush]").forEach(btn => {
    btn.onclick = () => activeBrush = btn.dataset.brush;
  });

  document.getElementById("cameraLock").onclick = () => {
    cameraLocked = !cameraLocked;
    orbit.enabled = !cameraLocked;
  };

  document.getElementById("gizmoToggle").onclick = () => {
    if (!activeObject) return;
    transform.visible = !transform.visible;
  };

  document.getElementById("newModel").onclick = () => {
    scene.children
      .filter(o => o.isMesh)
      .forEach(o => scene.remove(o));
    transform.detach();
    activeObject = null;
  };

  document.getElementById("saveModel").onclick = () => {
    const data = scene.children
      .filter(o => o.isMesh)
      .map(o => ({
        type: o.geometry.type,
        position: o.position.toArray()
      }));
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    download(blob, "model.json");
  };

  document.getElementById("loadModel").onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then(txt => {
      const data = JSON.parse(txt);
      data.forEach(d => {
        createPrimitive(d.type === "BoxGeometry" ? "cube" : "sphere");
        activeObject.position.fromArray(d.position);
      });
    });
  };
}

function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function animate() {
  requestAnimationFrame(animate);
  orbit.update();
  renderer.render(scene, camera);
}