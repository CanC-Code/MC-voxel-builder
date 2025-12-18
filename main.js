import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFExporter } from './three/GLTFExporter.js';
import GUI from './three/lil-gui.esm.min.js';

/* =======================
   GLOBALS
======================= */
let scene, camera, renderer, controls;
let sculptMesh;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isSculpting = false;
let cameraLocked = false;

/* Sculpt params */
const sculpt = {
    mode: 'inflate',
    radius: 0.4,
    strength: 0.15
};

/* =======================
   INIT
======================= */
init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2b2b2b);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 100);
    camera.position.set(2.5, 2.2, 2.5);

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('viewport') });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(devicePixelRatio);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    /* Lights */
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
    const d = new THREE.DirectionalLight(0xffffff, 0.8);
    d.position.set(5, 10, 5);
    scene.add(d);

    /* Base mesh */
    sculptMesh = createClay();
    scene.add(sculptMesh);

    /* GUI */
    setupGUI();

    /* Events */
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', () => isSculpting = false);
    window.addEventListener('resize', onResize);

    setupViewCube();
}

/* =======================
   CLAY MESH
======================= */
function createClay() {
    const geo = new THREE.IcosahedronGeometry(1, 4);
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
        color: 0x8ac5ff,
        roughness: 0.4,
        metalness: 0.05
    });
    return new THREE.Mesh(geo, mat);
}

/* =======================
   SCULPTING
======================= */
function onPointerDown(e) {
    if (cameraLocked) {
        isSculpting = true;
        controls.enabled = false;
    }
}

function onPointerMove(e) {
    if (!isSculpting) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObject(sculptMesh)[0];
    if (!hit) return;

    applyBrush(hit);
}

function applyBrush(hit) {
    const geo = sculptMesh.geometry;
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;

    const center = hit.point;

    for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(pos, i);
        const dist = v.distanceTo(center);
        if (dist > sculpt.radius) continue;

        const falloff = 1 - dist / sculpt.radius;
        const n = new THREE.Vector3().fromBufferAttribute(norm, i);

        if (sculpt.mode === 'inflate')
            v.addScaledVector(n, sculpt.strength * falloff);

        if (sculpt.mode === 'deflate')
            v.addScaledVector(n, -sculpt.strength * falloff);

        if (sculpt.mode === 'smooth')
            v.lerp(center, sculpt.strength * falloff * 0.1);

        if (sculpt.mode === 'flatten')
            v.projectOnPlane(hit.face.normal).add(center);

        pos.setXYZ(i, v.x, v.y, v.z);
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();
}

/* =======================
   GUI
======================= */
function setupGUI() {
    const gui = new GUI({ width: 260 });

    const sculptTab = gui.addFolder('Sculpt');
    sculptTab.add(sculpt, 'mode', ['inflate', 'deflate', 'smooth', 'flatten']);
    sculptTab.add(sculpt, 'radius', 0.05, 1);
    sculptTab.add(sculpt, 'strength', 0.01, 0.5);

    const viewTab = gui.addFolder('View');
    viewTab.add({ lockCamera: toggleCamera }, 'lockCamera');
    viewTab.add({ exportGLTF }, 'exportGLTF');
}

function toggleCamera() {
    cameraLocked = !cameraLocked;
    controls.enabled = !cameraLocked;
}

/* =======================
   VIEW CUBE (REAL)
======================= */
let viewScene, viewCamera, viewRenderer, viewCube;

function setupViewCube() {
    viewScene = new THREE.Scene();
    viewCamera = new THREE.OrthographicCamera(-1,1,1,-1,0.1,10);
    viewCamera.position.set(2,2,2);
    viewCamera.lookAt(0,0,0);

    viewCube = new THREE.Mesh(
        new THREE.BoxGeometry(1,1,1),
        new THREE.MeshNormalMaterial()
    );
    viewScene.add(viewCube);
}

function renderViewCube() {
    const size = 90;
    renderer.clearDepth();
    renderer.setScissorTest(true);
    renderer.setScissor(window.innerWidth - size - 10, 10, size, size);
    renderer.setViewport(window.innerWidth - size - 10, 10, size, size);

    viewCube.quaternion.copy(camera.quaternion).invert();
    renderer.render(viewScene, viewCamera);
    renderer.setScissorTest(false);
}

/* =======================
   EXPORT
======================= */
function exportGLTF() {
    const exporter = new GLTFExporter();
    exporter.parse(sculptMesh, gltf => {
        const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'model.gltf';
        a.click();
    });
}

/* =======================
   RENDER
======================= */
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    renderViewCube();
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}