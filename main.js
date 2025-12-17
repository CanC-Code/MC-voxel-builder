let scene, camera, renderer, controls;
let activeObject = null; // only one object at a time
let started = false;

/** Entry point */
function startApp() {
    if (started) return;
    started = true;
    init();
    animate();
}

/** DOM-ready handling */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

function init() {
    // --- SCENE ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202025);

    // --- CAMERA ---
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);

    // --- RENDERER ---
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // --- CONTROLS ---
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.5, 0);

    // --- LIGHTS ---
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // --- GRID ---
    scene.add(new THREE.GridHelper(20, 20));

    // --- INITIAL CUBE ---
    addCube();

    // --- UI HOOKS ---
    bindButton('newCube', addCube);
    bindButton('newSphere', addSphere);

    // --- RESIZE ---
    window.addEventListener('resize', onWindowResize);
}

/** Add cube to scene */
function addCube() {
    swapActiveObject(new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x44aa88 })
    ));
}

/** Add sphere to scene */
function addSphere() {
    swapActiveObject(new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xaa4444 })
    ));
}

/** Swap active object, keeping only one in scene */
function swapActiveObject(newObj) {
    if (activeObject) scene.remove(activeObject);
    activeObject = newObj;
    activeObject.position.y = 0.5;
    scene.add(activeObject);
}

/** Safe button binder */
function bindButton(id, handler) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`UI element not found #${id}`);
        return;
    }
    el.addEventListener('click', handler);
}

/** Animation loop */
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

/** Handle window resize */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}