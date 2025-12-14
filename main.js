let scene, camera, renderer, controls;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

let voxelSize = 1;
let voxelGrid = new Map(); // key = "x,y,z" -> Mesh

const canvas = document.getElementById("canvas");
const objInput = document.getElementById("objInput");
const voxelSizeInput = document.getElementById("voxelSizeInput");
const clearBtn = document.getElementById("clearBtn");
const exportGeoBtn = document.getElementById("exportGeoBtn");

init();
animate();

/* ---------- INIT ---------- */

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(
        70,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );
    camera.position.set(12, 12, 12);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);

    voxelSizeInput.addEventListener("change", () => {
        voxelSize = parseFloat(voxelSizeInput.value);
    });

    clearBtn.addEventListener("click", clearVoxels);
    objInput.addEventListener("change", loadOBJ);

    addVoxel(0, 0, 0);
}

/* ---------- RENDER ---------- */

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
}

/* ---------- GRID ---------- */

function gridKey(x, y, z) {
    return `${x},${y},${z}`;
}

function addVoxel(x, y, z) {
    const key = gridKey(x, y, z);
    if (voxelGrid.has(key)) return;

    const geo = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
    const mat = new THREE.MeshStandardMaterial({ color: 0x22cc55 });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.set(
        x * voxelSize + voxelSize / 2,
        y * voxelSize + voxelSize / 2,
        z * voxelSize + voxelSize / 2
    );

    mesh.userData.grid = { x, y, z };

    voxelGrid.set(key, mesh);
    scene.add(mesh);
}

function removeVoxel(x, y, z) {
    const key = gridKey(x, y, z);
    const mesh = voxelGrid.get(key);
    if (!mesh) return;
    scene.remove(mesh);
    voxelGrid.delete(key);
}

function clearVoxels() {
    voxelGrid.forEach(v => scene.remove(v));
    voxelGrid.clear();
}

/* ---------- INTERACTION ---------- */

function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects([...voxelGrid.values()]);

    if (!hits.length) return;

    const hit = hits[0];
    const voxel = hit.object;
    const { x, y, z } = voxel.userData.grid;

    if (event.shiftKey) {
        removeVoxel(x, y, z);
        return;
    }

    const n = hit.face.normal;
    addVoxel(
        x + Math.round(n.x),
        y + Math.round(n.y),
        z + Math.round(n.z)
    );
}

/* ---------- OBJ IMPORT ---------- */

function loadOBJ(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        const loader = new THREE.OBJLoader();
        const obj = loader.parse(e.target.result);
        voxelizeMesh(obj);
    };
    reader.readAsText(file);
}

/* ---------- VOXELIZATION ---------- */

function voxelizeMesh(object) {
    clearVoxels();

    object.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(object);
    const min = box.min;
    const max = box.max;

    const inv = new THREE.Matrix4().copy(object.matrixWorld).invert();
    const ray = new THREE.Raycaster();

    for (let x = min.x; x <= max.x; x += voxelSize) {
        for (let y = min.y; y <= max.y; y += voxelSize) {
            for (let z = min.z; z <= max.z; z += voxelSize) {
                const p = new THREE.Vector3(
                    x + voxelSize / 2,
                    y + voxelSize / 2,
                    z + voxelSize / 2
                ).applyMatrix4(inv);

                ray.set(p, new THREE.Vector3(1, 0, 0));
                const hits = ray.intersectObject(object, true);

                if (hits.length % 2 === 1) {
                    addVoxel(
                        Math.floor(x / voxelSize),
                        Math.floor(y / voxelSize),
                        Math.floor(z / voxelSize)
                    );
                }
            }
        }
    }
}

/* ---------- EXPORT (RAW GRID) ---------- */

exportGeoBtn.addEventListener("click", () => {
    const data = [];
    voxelGrid.forEach(v => data.push(v.userData.grid));

    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "voxels.json";
    a.click();
});