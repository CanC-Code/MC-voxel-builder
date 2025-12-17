// main.js – MC Voxel Builder (DOM-safe, mobile & desktop ready)

import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { GLTFExporter } from './three/GLTFExporter.js';
import { CSS2DRenderer, CSS2DObject } from './three/CSS2DRenderer.js';
import { TransformControls } from './three/TransformControls.js';

let scene, camera, renderer, labelRenderer;
let orbitControls, transformControls;
let currentObject;
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
    const container = document.getElementById('viewportContainer');

    const width = container ? container.clientWidth : window.innerWidth;
    const height = container ? container.clientHeight : window.innerHeight;

    // --- SCENE ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202025);

    // --- CAMERA ---
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(5, 5, 5);

    // --- RENDERER ---
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    if (container) container.appendChild(renderer.domElement);
    else document.body.appendChild(renderer.domElement);

    // --- LABEL RENDERER (CSS2D) ---
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    if (container) container.appendChild(labelRenderer.domElement);
    else document.body.appendChild(labelRenderer.domElement);

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
    currentObject = createCube();
    scene.add(currentObject);

    // --- TRANSFORM CONTROLS ---
    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.attach(currentObject);
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

function switchObject(type) {
    if (currentObject) scene.remove(currentObject);

    if (type === 'cube') currentObject = createCube();
    else if (type === 'sphere') currentObject = createSphere();

    scene.add(currentObject);
    transformControls.attach(currentObject);
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
    if (!currentObject) return;
    currentObject.rotation.set(0, 0, 0);
    transformControls.attach(currentObject);
    orbitControls.reset();
}

function onWindowResize() {
    const container = document.getElementById('viewportContainer');
    const width = container ? container.clientWidth : window.innerWidth;
    const height = container ? container.clientHeight : window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}