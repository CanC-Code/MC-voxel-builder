import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { TransformControls } from './three/TransformControls.js';
import { GLTFExporter } from './three/GLTFExporter.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { SubdivisionModifier } from './three/SubdivisionModifier.js';

const canvas = document.getElementById('c');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a3a3a);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(2, 2, 2);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const transform = new TransformControls(camera, canvas);
scene.add(transform);

const light1 = new THREE.DirectionalLight(0xffffff, 1);
light1.position.set(3, 5, 3);
scene.add(light1);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

let mesh;
createBaseMesh();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let sculpting = false;

const brush = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff })
);
scene.add(brush);

let tool = 'inflate';
let radius = 0.2;
let strength = 0.3;
let cameraLocked = false;
let gizmoEnabled = false;

function createBaseMesh() {
  const geo = new THREE.BoxGeometry(1, 1, 1, 20, 20, 20);
  const mat = new THREE.MeshStandardMaterial({ color: 0x9ad3ff, roughness: 0.6 });
  mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
}

function sculpt(point, normal) {
  const pos = mesh.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    const d = v.distanceTo(point);
    if (d < radius) {
      const falloff = 1 - d / radius;
      let delta = normal.clone().multiplyScalar(strength * falloff * 0.1);
      if (tool === 'deflate') delta.negate();
      if (tool === 'smooth') {
        v.lerp(point, 0.02 * falloff);
      } else if (tool === 'flatten') {
        v.add(normal.clone().multiplyScalar(-normal.dot(v.clone().sub(point)) * falloff));
      } else {
        v.add(delta);
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
  }
  pos.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}

canvas.addEventListener('pointerdown', () => sculpting = true);
canvas.addEventListener('pointerup', () => sculpting = false);
canvas.addEventListener('pointermove', e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObject(mesh);
  if (!hit.length) return;

  brush.position.copy(hit[0].point);
  brush.scale.setScalar(radius * 2);

  if (sculpting) sculpt(hit[0].point, hit[0].face.normal);
});

document.getElementById('toolSelect').onchange = e => tool = e.target.value;
document.getElementById('radius').oninput = e => radius = +e.target.value;
document.getElementById('strength').oninput = e => strength = +e.target.value;

document.getElementById('cameraLockBtn').onclick = () => {
  cameraLocked = !cameraLocked;
  controls.enabled = !cameraLocked;
};

document.getElementById('gizmoBtn').onclick = () => {
  gizmoEnabled = !gizmoEnabled;
  gizmoEnabled ? transform.attach(mesh) : transform.detach();
};

document.getElementById('exportBtn').onclick = () => {
  const exporter = new GLTFExporter();
  exporter.parse(mesh, gltf => {
    const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'model.gltf';
    a.click();
  });
};

document.getElementById('loadInput').onchange = e => {
  const loader = new GLTFLoader();
  loader.load(URL.createObjectURL(e.target.files[0]), gltf => {
    scene.remove(mesh);
    mesh = gltf.scene.children[0];
    scene.add(mesh);
  });
};

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});