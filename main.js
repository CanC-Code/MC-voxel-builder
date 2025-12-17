// main.js – MC Voxel Builder (DOM-safe, cache-safe)

import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { GLTFExporter } from './three/GLTFExporter.js';
import { CSS2DRenderer, CSS2DObject } from './three/CSS2DRenderer.js';
import { TransformControls } from './three/TransformControls.js';

let scene, camera, renderer, labelRenderer, orbitControls, transformControls;
let cube;
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
    document.body.appendChild(renderer.domElement);

    // --- LABEL RENDERER (CSS2D) ---
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    // --- ORBIT CONTROLS ---
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;
    orbitControls.target.set(0, 0.5, 0);

    // --- LIGHTS ---
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // --- GRID ---
    scene.add(new THREE.GridHelper(20, 20));

    // --- INITIAL OBJECT ---
    cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x44aa88 })
    );
    cube.position.y = 0.5;
    scene.add(cube);

    // --- TRANSFORM CONTROLS ---
    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.attach(cube);
    transformControls.addEventListener('dragging-changed', function (event) {
        orbitControls.enabled = !event.value;
    });
    scene.add(transformControls);

    // --- UI HOOKS ---
    bindButton('exportGLTF', exportScene);
    bindButton('resetScene', resetScene);
    bindButton('newCube', () => switchObject('cube'));
    bindButton('newSphere', () => switchObject('sphere'));

    // --- RESIZE ---
    window.addEventListener('resize', onWindowResize);
}

/**
 * Safe button binder
 */
function bindButton(id, handler) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`UI element not found #${id}`);
        return;
    }
    el.addEventListener('click', handler);
}

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

function resetScene() {
    cube.rotation.set(0, 0, 0);
    if (transformControls.object) transformControls.attach(cube);
    orbitControls.reset();
}

function switchObject(type) {
    if (scene && cube) {
        scene.remove(cube);
    }
    if (type === 'cube') {
        cube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x44aa88 })
        );
    } else if (type === 'sphere') {
        cube = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xaa4444 })
        );
    }
    cube.position.y = 0.5;
    scene.add(cube);
    transformControls.attach(cube);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}