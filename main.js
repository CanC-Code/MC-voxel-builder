import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { OBJLoader } from './three/OBJLoader.js';

let scene, camera, renderer, controls;
let currentObject = null;

function init() {
    const canvas = document.getElementById('canvas');
    const status = document.getElementById('status');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(3, 3, 3);

    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting (critical for OBJ visibility)
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Default cube (proof of life)
    createPrimitive('cube');

    // OBJ loader
    const objInput = document.getElementById('objInput');
    if (objInput) {
        objInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;

            status.textContent = 'Loading OBJ…';

            const reader = new FileReader();
            reader.onload = () => {
                const loader = new OBJLoader();
                const obj = loader.parse(reader.result);
                loadObject(obj);
                status.textContent = 'OBJ loaded';
            };
            reader.readAsText(file);
        });
    }

    // Convert button (stub)
    const convertBtn = document.getElementById('convertBtn');
    if (convertBtn) {
        convertBtn.onclick = () => {
            if (!currentObject) return;
            console.log('Voxelization placeholder');
            status.textContent = 'Voxelization not yet implemented';
        };
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.onclick = () => {
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
        };
    }

    window.addEventListener('resize', onResize);
}

function createPrimitive(type) {
    if (currentObject) scene.remove(currentObject);

    let geometry;
    const material = new THREE.MeshStandardMaterial({ color: 0x44aa88 });

    if (type === 'sphere') {
        geometry = new THREE.SphereGeometry(1, 32, 32);
    } else {
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    currentObject = new THREE.Mesh(geometry, material);
    scene.add(currentObject);
}

function loadObject(obj) {
    if (currentObject) scene.remove(currentObject);

    const group = new THREE.Group();
    const box = new THREE.Box3();

    obj.traverse(child => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: 0xcccccc
            });
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

document.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
});