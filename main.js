import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { OBJLoader } from './three/OBJLoader.js';

let scene, camera, renderer, controls;
let currentObject = null;

init();
animate();

function init() {
    const canvas = document.getElementById('canvas');
    const status = document.getElementById('status');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.01,
        10000
    );
    camera.position.set(3, 3, 3);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    createCube();

    document.getElementById('newCube').onclick = createCube;
    document.getElementById('newSphere').onclick = createSphere;
    document.getElementById('objInput').addEventListener('change', loadOBJ);

    window.addEventListener('resize', onResize);
}

function clearCurrent() {
    if (!currentObject) return;

    scene.remove(currentObject);
    currentObject.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });
    currentObject = null;
}

function createCube() {
    clearCurrent();
    currentObject = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x44aa88 })
    );
    scene.add(currentObject);
}

function createSphere() {
    clearCurrent();
    currentObject = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xaa8844 })
    );
    scene.add(currentObject);
}

function loadOBJ(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const loader = new OBJLoader();
        const obj = loader.parse(reader.result);
        placeImportedObject(obj);
        document.getElementById('status').textContent = 'OBJ loaded';
    };
    reader.readAsText(file);
}

function placeImportedObject(obj) {
    clearCurrent();

    // Force visible, lighting-independent materials
    obj.traverse(child => {
        if (child.isMesh) {
            child.geometry.computeBoundingBox();
            child.geometry.computeVertexNormals();

            child.material = new THREE.MeshNormalMaterial();
        }
    });

    // Wrap in a pivot so transforms are stable
    const pivot = new THREE.Group();
    pivot.add(obj);

    // Compute bounds AFTER material + geometry setup
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Hard fail protection
    if (size.length() === 0 || !isFinite(size.length())) {
        console.error('OBJ has invalid bounds');
        return;
    }

    // Normalize scale to viewable size
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    pivot.scale.setScalar(scale);

    // Center geometry
    obj.position.sub(center);

    scene.add(pivot);
    currentObject = pivot;

    // Auto-frame camera (critical)
    controls.target.set(0, 0, 0);
    camera.position.set(3, 3, 3);
    controls.update();
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}