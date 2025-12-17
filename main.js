// main.js — MC Voxel Builder (stable + functional View Gizmo)

import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';

let scene, camera, renderer, controls;
let activeObject;
let started = false;

/* ---------- VIEW GIZMO ---------- */
let gizmoScene, gizmoCamera, gizmoCube;
const GIZMO_SIZE = 96;
const GIZMO_MARGIN = 12;

/* ---------- BOOTSTRAP ---------- */

function startApp() {
    if (started) return;
    started = true;
    init();
    animate();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

/* ---------- INIT ---------- */

function init() {

    /* Main Scene */
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202025);

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(5, 5, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.5, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    scene.add(new THREE.GridHelper(20, 20));

    setActiveObject(createCube());

    /* ---------- VIEW GIZMO SCENE ---------- */

    gizmoScene = new THREE.Scene();

    gizmoCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 10);
    gizmoCamera.position.set(3, 3, 3);
    gizmoCamera.lookAt(0, 0, 0);

    const faceMaterials = [
        new THREE.MeshBasicMaterial({ color: 0xff5555 }), // +X
        new THREE.MeshBasicMaterial({ color: 0xaa0000 }), // -X
        new THREE.MeshBasicMaterial({ color: 0x55ff55 }), // +Y
        new THREE.MeshBasicMaterial({ color: 0x00aa00 }), // -Y
        new THREE.MeshBasicMaterial({ color: 0x5555ff }), // +Z
        new THREE.MeshBasicMaterial({ color: 0x0000aa })  // -Z
    ];

    gizmoCube = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 1.2),
        faceMaterials
    );
    gizmoScene.add(gizmoCube);

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    window.addEventListener('resize', onWindowResize);
}

/* ---------- OBJECT MANAGEMENT ---------- */

function createCube() {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x44aa88 })
    );
    mesh.position.y = 0.5;
    return mesh;
}

function setActiveObject(obj) {
    if (activeObject) scene.remove(activeObject);
    activeObject = obj;
    scene.add(activeObject);
}

/* ---------- GIZMO INTERACTION ---------- */

function onPointerDown(event) {
    const dpr = window.devicePixelRatio || 1;
    const rect = renderer.domElement.getBoundingClientRect();

    const x = (event.clientX - rect.left) * dpr;
    const y = (rect.height - (event.clientY - rect.top)) * dpr;

    const gx = window.innerWidth * dpr - GIZMO_SIZE * dpr - GIZMO_MARGIN * dpr;
    const gy = window.innerHeight * dpr - GIZMO_SIZE * dpr - GIZMO_MARGIN * dpr;

    if (
        x < gx || x > gx + GIZMO_SIZE * dpr ||
        y < gy || y > gy + GIZMO_SIZE * dpr
    ) return;

    // Snap camera to nearest axis
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    const snap = new THREE.Vector3(
        Math.sign(dir.x),
        Math.sign(dir.y),
        Math.sign(dir.z)
    );

    camera.position.copy(snap.multiplyScalar(5));
    camera.lookAt(controls.target);
    controls.update();
}

/* ---------- RENDER LOOP ---------- */

function animate() {
    requestAnimationFrame(animate);

    controls.update();

    renderer.clear();
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);

    // Sync gizmo orientation
    gizmoCube.quaternion.copy(camera.quaternion).invert();

    renderer.clearDepth();

    const dpr = window.devicePixelRatio || 1;
    const size = GIZMO_SIZE * dpr;
    const x = window.innerWidth * dpr - size - GIZMO_MARGIN * dpr;
    const y = window.innerHeight * dpr - size - GIZMO_MARGIN * dpr;

    renderer.setScissorTest(true);
    renderer.setScissor(x, y, size, size);
    renderer.setViewport(x, y, size, size);
    renderer.render(gizmoScene, gizmoCamera);
    renderer.setScissorTest(false);
}

/* ---------- RESIZE ---------- */

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}