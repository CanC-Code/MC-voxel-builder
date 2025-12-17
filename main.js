import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { GLTFExporter } from './three/GLTFExporter.js';

let scene, camera, renderer, controls;
let currentMesh = null; // only one active mesh at a time
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

// --- DEVICE DETECTION ---
function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// --- DYNAMIC CANVAS SIZE ---
function getContainerSize() {
    const container = document.getElementById('canvasContainer');

    if (container) {
        if (isMobile()) {
            return {
                width: container.clientWidth || window.innerWidth,
                height: container.clientHeight || window.innerHeight * 0.6
            };
        } else {
            return {
                width: window.innerWidth * 0.9,
                height: window.innerHeight * 0.7
            };
        }
    } else {
        return { width: window.innerWidth, height: window.innerHeight * 0.6 };
    }
}

function init() {
    // --- SCENE ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202025);

    // --- CAMERA ---
    const size = getContainerSize();
    camera = new THREE.PerspectiveCamera(60, size.width / size.height, 0.1, 1000);
    camera.position.set(5, 5, 5);

    // --- RENDERER ---
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('canvas') });
    renderer.setSize(size.width, size.height);
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
    bindButton('newCube', () => addMesh('cube'));
    bindButton('newSphere', () => addMesh('sphere'));
    bindButton('exportBtn', exportScene);
    bindButton('resetScene', resetScene);

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

// --- MESH HANDLING ---
function addMesh(type) {
    if (currentMesh) scene.remove(currentMesh);

    if (type === 'cube') {
        currentMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x44aa88 })
        );
    } else if (type === 'sphere') {
        currentMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xaa4444 })
        );
    }

    if (currentMesh) {
        currentMesh.position.y = 0.5;
        scene.add(currentMesh);
    }

    document.getElementById('status').textContent = `${type} added`;
}

// --- EXPORT SCENE ---
function exportScene() {
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

// --- RESET SCENE ---
function resetScene() {
    if (currentMesh) {
        currentMesh.rotation.set(0, 0, 0);
    }
    controls.reset();
    document.getElementById('status').textContent = 'Ready';
}

// --- RESIZE HANDLER ---
function onWindowResize() {
    const size = getContainerSize();
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
}

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}