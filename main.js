// main.js – MC Voxel Builder (GitHub Pages safe)

import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { TransformControls } from './three/TransformControls.js';
import { CSS2DRenderer } from './three/CSS2DRenderer.js';
import { GLTFExporter } from './three/GLTFExporter.js';

let scene, camera, renderer, labelRenderer;
let orbitControls, transformControls;
let activeObject;
let started = false;

/* -------------------- BOOTSTRAP -------------------- */

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

/* -------------------- INIT -------------------- */

function init() {
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
    document.body.appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    scene.add(new THREE.GridHelper(20, 20));

    createCube();

    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.attach(activeObject);
    transformControls.addEventListener('dragging-changed', e => {
        orbitControls.enabled = !e.value;
    });
    scene.add(transformControls);

    bindUI();

    window.addEventListener('resize', onResize);
}

/* -------------------- OBJECTS -------------------- */

function createCube() {
    if (activeObject) scene.remove(activeObject);

    activeObject = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x44aa88 })
    );
    activeObject.position.y = 0.5;
    scene.add(activeObject);
}

function createSphere() {
    if (activeObject) scene.remove(activeObject);

    activeObject = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xaa4444 })
    );
    activeObject.position.y = 0.5;
    scene.add(activeObject);
}

/* -------------------- UI -------------------- */

function bindUI() {
    safeBind('newCube', createCube);
    safeBind('newSphere', createSphere);
    safeBind('resetScene', () => {
        activeObject.rotation.set(0, 0, 0);
        orbitControls.reset();
        transformControls.attach(activeObject);
    });
    safeBind('exportGLTF', exportGLTF);
}

function safeBind(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
}

/* -------------------- EXPORT -------------------- */

function exportGLTF() {
    const exporter = new GLTFExporter();
    exporter.parse(scene, gltf => {
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

/* -------------------- RESIZE -------------------- */

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

/* -------------------- LOOP -------------------- */

function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}