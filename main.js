import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { GLTFExporter } from './three/GLTFExporter.js';
import { TransformControls } from './three/TransformControls.js';

let scene, camera, renderer, orbitControls, transformControls;
let cube;
let started = false;

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

function init() {
    const container = document.getElementById('viewportContainer');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202025);

    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(5, 5, 5);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('canvas') });
    renderer.setPixelRatio(window.devicePixelRatio);
    syncRendererSize();

    // Orbit Controls
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;
    orbitControls.target.set(0, 0.5, 0);

    // Lights
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Grid
    scene.add(new THREE.GridHelper(20, 20));

    // Initial cube
    cube = createCube();
    scene.add(cube);

    // Transform Controls (Gizmo)
    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.attach(cube);
    transformControls.addEventListener('dragging-changed', function(event){
        orbitControls.enabled = !event.value;
    });
    scene.add(transformControls);

    // UI hooks
    bindButton('exportGLTF', exportScene);
    bindButton('resetScene', resetScene);
    bindButton('newCube', () => switchObject('cube'));
    bindButton('newSphere', () => switchObject('sphere'));

    window.addEventListener('resize', onWindowResize);
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
    if (cube) scene.remove(cube);
    if (type === 'cube') {
        cube = createCube();
    } else {
        cube = createSphere();
    }
    scene.add(cube);
    transformControls.attach(cube);
}

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
    exporter.parse(scene, gltf => {
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
    if (cube) cube.rotation.set(0, 0, 0);
    if (transformControls.object) transformControls.attach(cube);
    orbitControls.reset();
}

function onWindowResize() {
    syncRendererSize();
}

function syncRendererSize() {
    const container = document.getElementById('viewportContainer');
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
}

function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
}