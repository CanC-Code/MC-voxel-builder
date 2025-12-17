// main.js — MC Voxel Builder (stable base + View Gizmo)

import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFExporter } from './three/GLTFExporter.js';

let scene, camera, renderer, controls;
let activeObject;
let started = false;

/* View Gizmo */
let gizmoScene, gizmoCamera, gizmoCube;
const gizmoSize = 100;

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

    /* View Gizmo Scene */
    gizmoScene = new THREE.Scene();

    gizmoCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 10);
    gizmoCamera.position.set(3, 3, 3);
    gizmoCamera.lookAt(0, 0, 0);

    const materials = [
        new THREE.MeshBasicMaterial({ color: 0xff5555 }), // +X
        new THREE.MeshBasicMaterial({ color: 0xaa0000 }), // -X
        new THREE.MeshBasicMaterial({ color: 0x55ff55 }), // +Y
        new THREE.MeshBasicMaterial({ color: 0x00aa00 }), // -Y
        new THREE.MeshBasicMaterial({ color: 0x5555ff }), // +Z
        new THREE.MeshBasicMaterial({ color: 0x0000aa })  // -Z
    ];

    gizmoCube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);
    gizmoScene.add(gizmoCube);

    renderer.domElement.addEventListener('pointerdown', onGizmoClick);

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

function createSphere() {
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xaa4444 })
    );
    mesh.position.y = 0.5;
    return mesh;
}

function setActiveObject(obj) {
    if (activeObject) scene.remove(activeObject);
    activeObject = obj;
    scene.add(activeObject);
}

/* ---------- VIEW GIZMO INTERACTION ---------- */

function onGizmoClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = rect.bottom - event.clientY;

    if (x < rect.width - gizmoSize || y > gizmoSize) return;

    const dir = new THREE.Vector3(
        Math.sign(camera.position.x),
        Math.sign(camera.position.y),
        Math.sign(camera.position.z)
    );

    camera.position.copy(dir.multiplyScalar(5));
    camera.lookAt(controls.target);
}

/* ---------- RENDER LOOP ---------- */

function animate() {
    requestAnimationFrame(animate);

    controls.update();

    renderer.clear();
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);

    gizmoCube.quaternion.copy(camera.quaternion).invert();

    renderer.clearDepth();
    renderer.setScissorTest(true);
    renderer.setScissor(
        window.innerWidth - gizmoSize - 10,
        window.innerHeight - gizmoSize - 10,
        gizmoSize,
        gizmoSize
    );
    renderer.setViewport(
        window.innerWidth - gizmoSize - 10,
        window.innerHeight - gizmoSize - 10,
        gizmoSize,
        gizmoSize
    );
    renderer.render(gizmoScene, gizmoCamera);
    renderer.setScissorTest(false);
}

/* ---------- RESIZE ---------- */

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}