// main.js — MC Voxel Builder (stable base, scene-safe)

import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { TransformControls } from './three/TransformControls.js';
import { GLTFExporter } from './three/GLTFExporter.js';

let scene, camera, renderer;
let orbitControls, transformControls;
let activeObject = null;
let started = false;

/* -------------------------
   APP ENTRY (SAFE)
------------------------- */
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

/* -------------------------
   INIT
------------------------- */
function init() {
    const canvas = document.getElementById('canvas');

    /* --- SCENE --- */
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202025);

    /* --- CAMERA --- */
    camera = new THREE.PerspectiveCamera(
        60,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );
    camera.position.set(5, 5, 5);

    /* --- RENDERER --- */
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    /* --- ORBIT CONTROLS --- */
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;
    orbitControls.target.set(0, 0.5, 0);

    /* --- TRANSFORM CONTROLS --- */
    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('dragging-changed', (e) => {
        orbitControls.enabled = !e.value;
    });
    scene.add(transformControls);

    /* --- LIGHTS --- */
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    /* --- GRID --- */
    scene.add(new THREE.GridHelper(20, 20));

    /* --- INITIAL OBJECT --- */
    createCube();

    /* --- UI --- */
    bindButton('newCube', createCube);
    bindButton('newSphere', createSphere);
    bindButton('exportBtn', exportScene);

    /* --- RESIZE --- */
    window.addEventListener('resize', onResize);
}

/* -------------------------
   SAFE OBJECT HANDLING
------------------------- */
function setActiveObject(obj) {
    if (activeObject) {
        scene.remove(activeObject);
        transformControls.detach();
    }

    activeObject = obj;
    activeObject.position.y = 0.5;

    scene.add(activeObject);              // MUST be first
    transformControls.attach(activeObject); // THEN attach
}

/* -------------------------
   OBJECT CREATORS
------------------------- */
function createCube() {
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x44aa88 })
    );
    setActiveObject(cube);
    setStatus('Cube created');
}

function createSphere() {
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xaa4444 })
    );
    setActiveObject(sphere);
    setStatus('Sphere created');
}

/* -------------------------
   EXPORT
------------------------- */
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

/* -------------------------
   UI HELPERS
------------------------- */
function bindButton(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.onclick = fn;
}

function setStatus(text) {
    const el = document.getElementById('status');
    if (el) el.textContent = text;
}

/* -------------------------
   RESIZE
------------------------- */
function onResize() {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
}

/* -------------------------
   LOOP
------------------------- */
function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
}