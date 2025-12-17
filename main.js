// main.js – MC Voxel Builder (Compass rotation, no autorotation)

import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { GLTFExporter } from './three/GLTFExporter.js';

let scene, camera, renderer, controls;
let currentObject = null;
let started = false;

/**
 * Entry point – guaranteed single execution
 */
function startApp() {
    if (started) return;
    started = true;

    init();
    animate();
}

/**
 * DOM-ready handling
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

function init() {
    const container = document.getElementById('canvasContainer');
    if (!container) {
        console.error('Canvas container not found');
        return;
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
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('canvas') });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

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

    // --- UI HOOKS ---
    bindButton('exportBtn', exportScene);
    bindButton('resetScene', resetScene);

    bindButton('newCube', () => spawnObject('cube'));
    bindButton('newSphere', () => spawnObject('sphere'));

    // --- COMPASS ---
    setupCompass();

    // --- RESIZE ---
    window.addEventListener('resize', onWindowResize);
}

// --- OBJECT SPAWNING ---
function spawnObject(type) {
    if (currentObject) scene.remove(currentObject);

    if (type === 'cube') {
        currentObject = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x44aa88 })
        );
    } else if (type === 'sphere') {
        currentObject = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xaa4444 })
        );
    }

    if (currentObject) {
        currentObject.position.y = 0.5;
        scene.add(currentObject);
    }

    document.getElementById('status').textContent = `${type} added`;
}

// --- UI SAFE BINDER ---
function bindButton(id, handler) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`UI element not found #${id}`);
        return;
    }
    el.addEventListener('click', handler);
}

// --- EXPORT SCENE ---
function exportScene() {
    const exporter = new GLTFExporter();
    exporter.parse(scene, (gltf) => {
        const blob = new Blob(
            [JSON.stringify(gltf, null, 2)],
            { type: 'application/json' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.gltf';
        a.click();
        URL.revokeObjectURL(url);
    });
}

// --- RESET SCENE ---
function resetScene() {
    if (currentObject) currentObject.rotation.set(0, 0, 0);
    controls.reset();
}

// --- WINDOW RESIZE ---
function onWindowResize() {
    const container = document.getElementById('canvasContainer');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// --- ANIMATE ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// --- COMPASS CONTROL ---
function setupCompass() {
    const compass = document.getElementById('compass');
    if (!compass) return;

    let dragging = false;
    compass.addEventListener('mousedown', () => dragging = true);
    window.addEventListener('mouseup', () => dragging = false);
    window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const deltaX = e.movementX;
        controls.rotateLeft(deltaX * 0.005);
    });

    // Touch support
    compass.addEventListener('touchstart', (e) => { dragging = true; e.preventDefault(); });
    window.addEventListener('touchend', () => dragging = false);
    window.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        const touch = e.touches[0];
        controls.rotateLeft(touch.movementX * 0.005);
    }, { passive: false });
}