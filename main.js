// main.js – MC Voxel Builder (ES module, responsive)

import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { GLTFExporter } from './three/GLTFExporter.js';

let scene, camera, renderer, controls;
let currentObject = null; // only one object displayed
let container, canvas;

function startApp() {
    container = document.getElementById('canvasContainer');
    canvas = document.getElementById('canvas');

    if (!container || !canvas) {
        console.error("Canvas container or canvas not found");
        return;
    }

    initScene();
    bindUI();
    animate();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

function initScene() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202025);

    // Camera
    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    resizeRenderer();

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.5, 0);

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Grid
    scene.add(new THREE.GridHelper(20, 20));

    // Default cube
    addCube();

    window.addEventListener('resize', resizeRenderer);
}

function resizeRenderer() {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function bindUI() {
    bindButton('newCube', () => { replaceObject(createCube()); });
    bindButton('newSphere', () => { replaceObject(createSphere()); });
    bindButton('exportBtn', exportScene);
}

function bindButton(id, handler) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`UI element not found #${id}`);
        return;
    }
    el.addEventListener('click', handler);
}

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

function addCube() {
    replaceObject(createCube());
}

function replaceObject(newObj) {
    if (currentObject) scene.remove(currentObject);
    currentObject = newObj;
    scene.add(currentObject);
}

function exportScene() {
    if (!scene) return;
    const exporter = new GLTFExporter();
    exporter.parse(scene, (gltf) => {
        const blob = new Blob([JSON.stringify(gltf, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.gltf';
        a.click();
        URL.revokeObjectURL(url);
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}