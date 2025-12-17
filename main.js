// main.js – MC Voxel Builder with ViewCube
let scene, camera, renderer, controls;
let gizmoScene, gizmoCamera, gizmoRenderer;
let currentObject = null;
let started = false;

async function startApp() {
    if (started) return;
    started = true;

    const THREE = await import('./three/three.module.js');
    const { OrbitControls } = await import('./three/OrbitControls.js');
    const { GLTFLoader } = await import('./three/GLTFLoader.js');
    const { GLTFExporter } = await import('./three/GLTFExporter.js');

    init(THREE, OrbitControls, GLTFLoader);
    initGizmo(THREE);
    animate(THREE);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

function init(THREE, OrbitControls, GLTFLoader) {
    const container = document.getElementById('canvasContainer');
    if (!container) return console.error('Canvas container not found');

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

    addCube(THREE);

    bindButton('newCube', () => replaceObject(THREE, 'cube'));
    bindButton('newSphere', () => replaceObject(THREE, 'sphere'));
    bindButton('exportBtn', () => exportScene(THREE, GLTFExporter));

    window.addEventListener('resize', () => onWindowResize(THREE, container));
}

// --- OBJECT MANAGEMENT ---
function bindButton(id, handler) {
    const el = document.getElementById(id);
    if (!el) return console.warn(`UI element not found #${id}`);
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

// --- RESIZE ---
function onWindowResize(THREE, container) {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);

    if (gizmoRenderer) {
        gizmoRenderer.setSize(150, 150); // fixed gizmo size
    }
}

// --- VIEW CUBE / GIZMO ---
function initGizmo(THREE) {
    gizmoScene = new THREE.Scene();
    gizmoCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 10);
    gizmoCamera.position.set(5, 5, 5);
    gizmoCamera.lookAt(0, 0, 0);

    const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
    const cubeMat = new THREE.MeshNormalMaterial();
    const gizmoCube = new THREE.Mesh(cubeGeo, cubeMat);
    gizmoScene.add(gizmoCube);

    gizmoRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    gizmoRenderer.setSize(150, 150);
    gizmoRenderer.domElement.style.position = 'absolute';
    gizmoRenderer.domElement.style.top = '10px';
    gizmoRenderer.domElement.style.right = '10px';
    document.body.appendChild(gizmoRenderer.domElement);
}

// --- ANIMATION LOOP ---
function animate(THREE) {
    requestAnimationFrame(() => animate(THREE));
    controls.update();
    renderer.render(scene, camera);

    if (gizmoRenderer && gizmoScene && gizmoCamera) {
        // sync gizmo rotation with main camera
        gizmoScene.rotation.copy(scene.rotation);
        gizmoRenderer.render(gizmoScene, gizmoCamera);
    }
}