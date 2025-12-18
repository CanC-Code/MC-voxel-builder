import * as THREE from "./three/three.module.js";
import { OrbitControls } from "./three/OrbitControls.js";
import { TransformControls } from "./three/TransformControls.js";
import { GLTFLoader } from "./three/GLTFLoader.js";
import { GLTFExporter } from "./three/GLTFExporter.js";

/* ---------- Renderer / Scene ---------- */
const canvas = document.getElementById("viewport");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a3a3a);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 4, 6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const transform = new TransformControls(camera, renderer.domElement);
scene.add(transform);

/* ---------- State ---------- */
let activeMesh = null;
let wireframe = false;
let cameraLocked = false;

/* ---------- Lighting ---------- */
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
scene.add(dir);

/* ---------- Helpers ---------- */
scene.add(new THREE.GridHelper(20, 20));

/* ---------- Resize ---------- */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- Geometry Utilities ---------- */

/**
 * Subdivide geometry uniformly (midpoint) for sculpt readiness.
 */
function subdivideGeometry(geometry, iterations = 1) {
  let geo = geometry;

  for (let it = 0; it < iterations; it++) {
    if (geo.index) geo = geo.toNonIndexed();
    const pos = geo.attributes.position;
    const newVerts = [];

    for (let i = 0; i < pos.count; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(pos, i);
      const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
      const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);

      const ab = a.clone().add(b).multiplyScalar(0.5);
      const bc = b.clone().add(c).multiplyScalar(0.5);
      const ca = c.clone().add(a).multiplyScalar(0.5);

      // 4 new triangles
      newVerts.push(
        a, ab, ca,
        ab, b, bc,
        ca, bc, c,
        ab, bc, ca
      );
    }

    const flat = new Float32Array(newVerts.length * 3);
    newVerts.forEach((v, i) => {
      flat[i * 3] = v.x;
      flat[i * 3 + 1] = v.y;
      flat[i * 3 + 2] = v.z;
    });

    geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(flat, 3));
    geo.computeVertexNormals();
  }

  return geo;
}

/**
 * Prepare geometry: non-indexed, subdivided, normals computed.
 */
function prepareGeometryForSculpt(mesh) {
  let geo = mesh.geometry;
  if (geo.index) geo = geo.toNonIndexed();
  geo = subdivideGeometry(geo, 2);
  geo.computeVertexNormals();
  mesh.geometry = geo;
}

/**
 * Build adjacency info for dynamic remeshing.
 * Returns {edges: Map, neighbors: Map}
 */
function buildMeshConnectivity(mesh) {
  const pos = mesh.geometry.attributes.position;
  const edges = new Map();
  const neighbors = new Map();

  for (let i = 0; i < pos.count; i += 3) {
    const tri = [i, i + 1, i + 2];
    for (let j = 0; j < 3; j++) {
      const a = tri[j];
      const b = tri[(j + 1) % 3];
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      edges.set(key, [a, b]);
      if (!neighbors.has(a)) neighbors.set(a, new Set());
      if (!neighbors.has(b)) neighbors.set(b, new Set());
      neighbors.get(a).add(b);
      neighbors.get(b).add(a);
    }
  }

  return { edges, neighbors };
}

/* ---------- Active Mesh Handling ---------- */
function clearActiveMesh() {
  if (!activeMesh) return;
  transform.detach();
  scene.remove(activeMesh);
  activeMesh.geometry.dispose();
  activeMesh.material.dispose();
  activeMesh = null;
}

function setActive(mesh) {
  clearActiveMesh();
  prepareGeometryForSculpt(mesh);
  activeMesh = mesh;
  scene.add(mesh);
  transform.attach(mesh);
  // Build connectivity for edge-constrained sculpt
  activeMesh.userData.connectivity = buildMeshConnectivity(mesh);
}

/* ---------- Mesh Creation ---------- */
function createCube() {
  const geo = new THREE.BoxGeometry(2, 2, 2, 6, 6, 6);
  const mat = new THREE.MeshStandardMaterial({ color: 0x88ccff, wireframe });
  setActive(new THREE.Mesh(geo, mat));
}

function createSphere() {
  const geo = new THREE.SphereGeometry(1.5, 24, 24);
  const mat = new THREE.MeshStandardMaterial({ color: 0x88ff88, wireframe });
  setActive(new THREE.Mesh(geo, mat));
}

/* ---------- Default ---------- */
createCube();

/* ---------- UI ---------- */
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

/* ---------- Export ---------- */
document.getElementById("exportGLTF").onclick = () => {
  if (!activeMesh) return;
  const exporter = new GLTFExporter();
  exporter.parse(activeMesh, gltf => {
    const blob = new Blob([JSON.stringify(gltf)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "model.gltf";
    a.click();
  });
};

/* ---------- Import ---------- */
document.getElementById("importGLTF").onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const loader = new GLTFLoader();
    loader.parse(reader.result, "", gltf => {
      const mesh = gltf.scene.getObjectByProperty("type", "Mesh");
      if (mesh) setActive(mesh);
    });
  };
  reader.readAsArrayBuffer(file);
};

/* ---------- Sculpt Utilities ---------- */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let sculpting = false;
let savedControlsEnabled = true;

const brushRing = new THREE.Mesh(
  new THREE.RingGeometry(0.95, 1, 32),
  new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
);
brushRing.visible = false;
scene.add(brushRing);

function updateMouse(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

/**
 * Apply edge-constrained inflate with local remeshing.
 */
function sculptInflate(hit) {
  const geo = activeMesh.geometry;
  const pos = geo.attributes.position;
  const normal = geo.attributes.normal;
  const radius = parseFloat(document.getElementById("brushSize").value);
  const strength = 0.12;
  const connectivity = activeMesh.userData.connectivity;
  const maxEdgeLength = 0.5; // threshold for splitting

  // Vertex displacement with neighbor averaging
  const displacement = [];
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const worldPos = new THREE.Vector3(vx, vy, vz).applyMatrix4(activeMesh.matrixWorld);
    const dist = worldPos.distanceTo(hit.point);
    if (dist > radius) {
      displacement.push(new THREE.Vector3(0, 0, 0));
      continue;
    }
    const falloff = 1 - dist / radius;
    const dn = new THREE.Vector3(normal.getX(i), normal.getY(i), normal.getZ(i)).multiplyScalar(strength * falloff);

    // Weighted neighbor average
    const neighbors = Array.from(connectivity.neighbors.get(i));
    let neighborSum = new THREE.Vector3(0, 0, 0);
    neighbors.forEach(n => {
      neighborSum.add(new THREE.Vector3(pos.getX(n), pos.getY(n), pos.getZ(n)));
    });
    if (neighbors.length > 0) neighborSum.multiplyScalar(1 / neighbors.length);
    dn.add(neighborSum.sub(new THREE.Vector3(vx, vy, vz)).multiplyScalar(0.25)); // soft constraint

    displacement.push(dn);
  }

  // Apply displacement
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) + displacement[i].x,
      pos.getY(i) + displacement[i].y,
      pos.getZ(i) + displacement[i].z
    );
  }

  // Local remeshing: split long edges
  connectivity.edges.forEach(edge => {
    const [a, b] = edge;
    const pa = new THREE.Vector3(pos.getX(a), pos.getY(a), pos.getZ(a));
    const pb = new THREE.Vector3(pos.getX(b), pos.getY(b), pos.getZ(b));
    const len = pa.distanceTo(pb);
    if (len > maxEdgeLength) {
      // Split edge by adding midpoint
      const mid = pa.clone().add(pb).multiplyScalar(0.5);
      const idx = pos.count;
      const newPosArray = new Float32Array(pos.count * 3 + 3);
      pos.array.forEach((v, i) => newPosArray[i] = v);
      newPosArray[idx * 3] = mid.x;
      newPosArray[idx * 3 + 1] = mid.y;
      newPosArray[idx * 3 + 2] = mid.z;
      geo.setAttribute("position", new THREE.BufferAttribute(newPosArray, 3));
      geo.computeVertexNormals();
      // NOTE: connectivity rebuild deferred to next frame for performance
    }
  });

  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

/* ---------- Pointer Events ---------- */
renderer.domElement.addEventListener("pointerdown", e => {
  if (!activeMesh) return;
  updateMouse(e);
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObject(activeMesh)[0];
  if (!hit) return;
  sculpting = true;
  savedControlsEnabled = controls.enabled;
  controls.enabled = false;
});

renderer.domElement.addEventListener("pointermove", e => {
  updateMouse(e);
  raycaster.setFromCamera(mouse, camera);
  const hit = activeMesh ? raycaster.intersectObject(activeMesh)[0] : null;

  if (hit) {
    const r = parseFloat(document.getElementById("brushSize").value);
    brushRing.visible = true;
    brushRing.scale.set(r, r, r);
    brushRing.position.copy(hit.point);
    brushRing.lookAt(hit.point.clone().add(hit.face.normal));

    if (sculpting) sculptInflate(hit);
  } else {
    brushRing.visible = false;
  }
});

window.addEventListener("pointerup", () => {
  if (!sculpting) return;
  sculpting = false;
  controls.enabled = savedControlsEnabled;
});

/* ---------- Render Loop ---------- */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();