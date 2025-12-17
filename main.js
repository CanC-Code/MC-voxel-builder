// main.js – MC Voxel Builder
let scene, camera, renderer, controls;
let currentObject = null;
let started = false;

async function startApp() {
    if (started) return;
    started = true;

    // Dynamic imports
    const THREE = await import('./three/three.module.js');
    const { OrbitControls } = await import('./three/OrbitControls.js');
    const { GLTFLoader } = await import('./three/GLTFLoader.js');
    const { GLTFExporter } = await import('./three/GLTFExporter.js');

    init(THREE, OrbitControls, GLTFLoader);
    animate(THREE);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

function init(THREE, OrbitControls, GLTFLoader) {
    const container = document.getElementById('canvasContainer');
    if (!container) {
        console.error('Canvas container not found');
        return;
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202025);

    camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(5, 5, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('canvas') });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.5, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    scene.add(new THREE.GridHelper(20, 20));

    // Initialize with cube only
    addCube(THREE);

    // UI bindings
    bindButton('newCube', () => replaceObject(THREE, 'cube'));
    bindButton('newSphere', () => replaceObject(THREE, 'sphere'));
    bindButton('exportBtn', () => exportScene(THREE, GLTFExporter));

    window.addEventListener('resize', () => onWindowResize(THREE, container));
}

function bindButton(id, handler) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`UI element not found #${id}`);
        return;
    }
    el.addEventListener('click', handler);
}

function addCube(THREE) {
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x44aa88 })
    );
    cube.position.y = 0.5;
    scene.add(cube);
    currentObject = cube;
}

function addSphere(THREE) {
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xaa4444 })
    );
    sphere.position.y = 0.5;
    scene.add(sphere);
    currentObject = sphere;
}

function replaceObject(THREE, type) {
    if (currentObject) scene.remove(currentObject);
    if (type === 'cube') addCube(THREE);
    else if (type === 'sphere') addSphere(THREE);
}

function exportScene(THREE, GLTFExporter) {
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

function onWindowResize(THREE, container) {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate(THREE) {
    requestAnimationFrame(() => animate(THREE));
    controls.update();
    renderer.render(scene, camera);
}