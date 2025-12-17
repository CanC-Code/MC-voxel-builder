// main.js – MC Voxel Builder (DOM-safe, ViewCube, single object)

import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { GLTFExporter } from './three/GLTFExporter.js';
import { ViewCube } from './three/ViewCube.js'; // assume we added this

let scene, camera, renderer, controls;
let gizmoScene, gizmoCamera, gizmoRenderer;
let currentObject = null; // cube, sphere, or loaded model
let started = false;

// --- ENTRY POINT ---
function startApp() {
    if (started) return;
    started = true;

    init();
    animate();
}

// --- DOM READY ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

// --- INIT SCENE ---
function init() {
    // --- SCENE ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202025);

    // --- CAMERA ---
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(5, 5, 5);

    // --- RENDERER ---
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas')?.appendChild(renderer.domElement);

    // --- CONTROLS ---
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.5, 0);

    // --- LIGHTS ---
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // --- GRID ---
    scene.add(new THREE.GridHelper(20, 20));

    // --- INITIAL OBJECT ---
    addCube(); // start with cube

    // --- VIEWCUBE ---
    initGizmo();

    // --- SAFE BUTTON BINDINGS ---
    bindButton('newCube', addCube);
    bindButton('newSphere', addSphere);
    bindButton('exportBtn', exportScene);
    bindButton('resetScene', resetScene);

    // --- RESIZE ---
    window.addEventListener('resize', onWindowResize);
}

// --- VIEWCUBE INIT ---
function initGizmo() {
    gizmoScene = new THREE.Scene();
    gizmoCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    gizmoRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    gizmoRenderer.setSize(100, 100);
    document.body.appendChild(gizmoRenderer.domElement);

    const cubeGizmo = new ViewCube();
    gizmoScene.add(cubeGizmo.mesh);

    // Rotate camera in gizmo
    cubeGizmo.onChange((quat) => {
        if (currentObject) currentObject.quaternion.copy(quat);
    });
}

// --- BUTTON SAFETY ---
function bindButton(id, handler) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`UI element not found #${id}`);
        return;
    }
    el.addEventListener('click', handler);
}

// --- ADD / REPLACE OBJECT ---
function addCube() {
    if (currentObject) scene.remove(currentObject);
    currentObject = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x44aa88 })
    );
    currentObject.position.y = 0.5;
    scene.add(currentObject);
}

function addSphere() {
    if (currentObject) scene.remove(currentObject);
    currentObject = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xaa4444 })
    );
    currentObject.position.y = 0.5;
    scene.add(currentObject);
}

// --- EXPORT SCENE ---
function exportScene() {
    const exporter = new GLTFExporter();
    exporter.parse(scene, (gltf) => {
        const blob = new Blob([JSON.stringify(gltf, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.gltf';
        a.click();
        URL.revokeObjectURL(url);
    });
}

// --- RESET ---
function resetScene() {
    if (currentObject) currentObject.rotation.set(0, 0, 0);
    controls.reset();
}

// --- RESIZE HANDLER ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- ANIMATE LOOP ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);

    // Render gizmo separately
    if (gizmoRenderer) gizmoRenderer.render(gizmoScene, gizmoCamera);
}