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

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(3, 3, 3);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights (critical)
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Default object
    createCube();

    // Buttons
    document.getElementById('newCube').onclick = () => {
        createCube();
        status.textContent = 'Cube created';
    };

    document.getElementById('newSphere').onclick = () => {
        createSphere();
        status.textContent = 'Sphere created';
    };

    document.getElementById('objInput').addEventListener('change', loadOBJ);

    document.getElementById('convertBtn').onclick = () => {
        status.textContent = 'Voxelization coming next';
        console.log('Voxelization placeholder');
    };

    document.getElementById('exportBtn').onclick = exportScene;

    // Resize
    window.addEventListener('resize', onResize);
}

function clearCurrent() {
    if (currentObject) {
        scene.remove(currentObject);
        currentObject.traverse?.(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
        });
        currentObject = null;
    }
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

function loadOBJ(e) {
    const file = e.target.files[0];
    if (!file) return;

    const status = document.getElementById('status');
    status.textContent = 'Loading OBJ…';

    const reader = new FileReader();
    reader.onload = () => {
        const loader = new OBJLoader();
        const obj = loader.parse(reader.result);
        placeImportedObject(obj);
        status.textContent = 'OBJ loaded';
    };
    reader.readAsText(file);
}

function placeImportedObject(obj) {
    clearCurrent();

    const group = new THREE.Group();
    const box = new THREE.Box3();

    obj.traverse(child => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            box.expandByObject(child);
            group.add(child);
        }
    });

    if (group.children.length === 0) {
        console.warn('OBJ contained no meshes');
        return;
    }

    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    const scale = 2 / size;
    group.scale.setScalar(scale);
    group.position.sub(center.multiplyScalar(scale));

    scene.add(group);
    currentObject = group;
}

function exportScene() {
    const data = {
        voxels: [],
        skeleton: {}
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
    });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scene.json';
    a.click();
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