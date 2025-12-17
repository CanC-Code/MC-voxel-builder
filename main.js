// main.js – MC Voxel Builder (DOM-safe, cache-safe)

import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { GLTFExporter } from './three/GLTFExporter.js';
import { TransformControls } from './three/TransformControls.js';

let scene, camera, renderer, orbitControls, transformControls;
let activeObject; // cube or sphere
let started = false;

// Container for responsive sizing
let container;

// --- Application Entry Point ---
function startApp() {
    if (started) return;
    started = true;

    init();
    animate();
}

// DOM-ready handling
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

// --- INIT ---
function init() {
    // Container div for canvas sizing
    container = document.getElementById('canvas-container');
    if (!container) {
        console.warn('Canvas container not found, defaulting to body');
        container = document.body;
    }

    // --- SCENE ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202025);

    // --- CAMERA ---
    camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(5, 5, 5);

    // --- RENDERER ---
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- ORBIT CONTROLS ---
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;
    orbitControls.target.set(0, 0.5, 0);

    // --- LIGHTS ---
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // --- GRID ---
    scene.add(new THREE.GridHelper(20, 20));

    // --- INITIAL OBJECT ---
    addObject('cube');

    // --- TRANSFORM CONTROLS ---
    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('dragging-changed', (event) => {
        orbitControls.enabled = !event.value;
    });
    scene.add(transformControls);
    transformControls.attach(activeObject);

    // --- UI HOOKS ---
    bindButton('exportGLTF', exportScene);
    bindButton('resetScene', resetScene);
    bindButton('newCube', () => addObject('cube'));
    bindButton('newSphere', () => addObject('sphere'));

    // --- RESIZE ---
    window.addEventListener('resize', onWindowResize);
}

// --- BUTTON BINDING ---
function bindButton(id, handler) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`UI element not found #${id}`);
        return;
    }
    el.addEventListener('click', handler);
}

// --- ADD OBJECT ---
function addObject(type) {
    if (activeObject) {
        scene.remove(activeObject);
    }

    if (type === 'cube') {
        activeObject = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x44aa88 })
        );
    } else if (type === 'sphere') {
        activeObject = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xaa4444 })
        );
    }

    activeObject.position.y = 0.5;
    scene.add(activeObject);
    if (transformControls) transformControls.attach(activeObject);
}

// --- RESET SCENE ---
function resetScene() {
    if (activeObject) activeObject.rotation.set(0, 0, 0);
    if (transformControls && activeObject) transformControls.attach(activeObject);
    orbitControls.reset();
}

// --- EXPORT SCENE ---
function exportScene() {
    const exporter = new GLTFExporter();

    // Only export mesh objects to avoid cyclic references
    const exportScene = new THREE.Scene();
    scene.traverse((obj) => {
        if (obj.isMesh) exportScene.add(obj.clone());
    });

    exporter.parse(exportScene, (gltf) => {
        const blob = new Blob([JSON.stringify(gltf, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.gltf';
        a.click();
        URL.revokeObjectURL(url);
    });
}

// --- WINDOW RESIZE ---
function onWindowResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
}