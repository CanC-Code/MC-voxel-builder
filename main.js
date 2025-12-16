import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { OBJLoader } from './three/OBJLoader.js';
import {
    MeshBVH,
    acceleratedRaycast,
    computeBoundsTree,
    disposeBoundsTree
} from './lib/index.module.js';

/* =========================================================
   REQUIRED BVH PATCHING
   ========================================================= */
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

/* =========================================================
   GLOBALS
   ========================================================= */
let scene, camera, renderer, controls;
let sourceGroup;
let activeMesh = null;

/* =========================================================
   INIT
   ========================================================= */
function init() {
    const canvas = document.getElementById('canvas');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    scene.add(new THREE.GridHelper(10, 10));
    scene.add(new THREE.AxesHelper(2));

    sourceGroup = new THREE.Group();
    scene.add(sourceGroup);

    // Default object
    createCube();

    // UI hooks
    document.getElementById('newCube').onclick = createCube;
    document.getElementById('newSphere').onclick = createSphere;
    document.getElementById('objInput').addEventListener('change', loadOBJ);

    window.addEventListener('resize', onResize);
}

/* =========================================================
   MESH MANAGEMENT
   ========================================================= */
function setActiveMesh(mesh) {
    if (activeMesh) {
        if (activeMesh.geometry.disposeBoundsTree) {
            activeMesh.geometry.disposeBoundsTree();
        }
        sourceGroup.remove(activeMesh);
    }

    activeMesh = mesh;
    sourceGroup.add(activeMesh);
}

/* =========================================================
   PRIMITIVES
   ========================================================= */
function createCube() {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.computeBoundsTree();

    const mat = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
    const mesh = new THREE.Mesh(geo, mat);

    setActiveMesh(mesh);
}

function createSphere() {
    const geo = new THREE.SphereGeometry(0.75, 32, 32);
    geo.computeBoundsTree();

    const mat = new THREE.MeshStandardMaterial({ color: 0x2196f3 });
    const mesh = new THREE.Mesh(geo, mat);

    setActiveMesh(mesh);
}

/* =========================================================
   OBJ LOADING
   ========================================================= */
function loadOBJ(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        const loader = new OBJLoader();
        const object = loader.parse(ev.target.result);

        let mesh = null;
        object.traverse(child => {
            if (child.isMesh) mesh = child;
        });

        if (!mesh) return;

        // Normalize size
        const box = new THREE.Box3().setFromObject(mesh);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;

        const scale = 2 / maxDim;
        mesh.scale.setScalar(scale);

        box.setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        mesh.position.sub(center);

        mesh.material = new THREE.MeshStandardMaterial({
            color: 0xcccccc
        });

        mesh.geometry.computeBoundsTree();

        setActiveMesh(mesh);
    };

    reader.readAsText(file);
}

/* =========================================================
   RESIZE
   ========================================================= */
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/* =========================================================
   LOOP
   ========================================================= */
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
});
