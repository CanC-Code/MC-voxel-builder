import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { OBJLoader } from './three/OBJLoader.js';
import { FBXLoader } from './three/FBXLoader.js';
import { acceleratedRaycast, computeBoundsTree } from './lib/index.module.js';

/* --------------------------
   BVH PATCH
--------------------------- */
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;

/* --------------------------
   GLOBALS
--------------------------- */
let scene, camera, renderer, controls;
let activeMesh = null;
let voxelGroup = new THREE.Group();
let voxelSize = 0.1;

/* --------------------------
   INIT
--------------------------- */
function init() {
    const canvas = document.getElementById('canvas');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(3,3,3);

    renderer = new THREE.WebGLRenderer({canvas, antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10,10,10);
    scene.add(dirLight);

    scene.add(new THREE.GridHelper(10,10));
    scene.add(new THREE.AxesHelper(2));
    scene.add(voxelGroup);

    bindUI();
    createCube();

    window.addEventListener('resize', onResize);
}

/* --------------------------
   UI
--------------------------- */
function bindUI() {
    document.getElementById('objInput').addEventListener('change', loadModel);
    document.getElementById('fbxInput')?.addEventListener('change', loadModel);
    document.getElementById('newCube')?.addEventListener('click', createCube);
    document.getElementById('newSphere')?.addEventListener('click', createSphere);
}

/* --------------------------
   CREATE PRIMITIVES
--------------------------- */
function createCube() {
    const geo = new THREE.BoxGeometry(1,1,1);
    geo.computeBoundsTree();
    const mat = new THREE.MeshStandardMaterial({color:0x4caf50});
    setActiveMesh(new THREE.Mesh(geo, mat));
    voxelizeMesh(activeMesh);
}

function createSphere() {
    const geo = new THREE.SphereGeometry(0.75,32,32);
    geo.computeBoundsTree();
    const mat = new THREE.MeshStandardMaterial({color:0x2196f3});
    setActiveMesh(new THREE.Mesh(geo, mat));
    voxelizeMesh(activeMesh);
}

/* --------------------------
   SET ACTIVE MESH
--------------------------- */
function setActiveMesh(mesh) {
    if(activeMesh) scene.remove(activeMesh);
    activeMesh = mesh;
    scene.add(activeMesh);
    voxelGroup.clear();
}

/* --------------------------
   LOAD OBJ / FBX
--------------------------- */
function loadModel(e) {
    const file = e.target.files[0];
    if(!file) return;
    const ext = file.name.split('.').pop().toLowerCase();

    const reader = new FileReader();
    reader.onload = ev => {
        let loader;
        if(ext==='obj') loader = new OBJLoader();
        else if(ext==='fbx') loader = new FBXLoader();
        else { alert('Unsupported file'); return; }

        let obj;
        try { obj = loader.parse(ev.target.result); } 
        catch(err){ console.error('Parse failed', err); return; }

        // flatten to mesh for voxelization
        const group = new THREE.Group();
        obj.traverse(child=>{
            if(child.isMesh){
                if(!child.material) child.material = new THREE.MeshStandardMaterial({color:0xcccccc});
                child.geometry.computeBoundsTree();
                group.add(child);
            }
        });

        if(group.children.length===0){ alert('No meshes found'); return; }

        // scale & center
        const box = new THREE.Box3().setFromObject(group);
        const size = box.getSize(new THREE.Vector3()).length();
        const scale = 2/Math.max(size,1);
        group.scale.setScalar(scale);
        const center = box.getCenter(new THREE.Vector3());
        group.position.sub(center);

        setActiveMesh(group);
        voxelizeMesh(activeMesh);
    };

    reader.readAsText(file);
}

/* --------------------------
   VOXELIZATION
--------------------------- */
function voxelizeMesh(mesh) {
    voxelGroup.clear();
    if(!mesh) return;

    const box = new THREE.Box3().setFromObject(mesh);
    const min = box.min, max = box.max;
    const size = new THREE.Vector3().subVectors(max,min);
    const stepsX = Math.ceil(size.x/voxelSize);
    const stepsY = Math.ceil(size.y/voxelSize);
    const stepsZ = Math.ceil(size.z/voxelSize);

    const voxelMat = new THREE.MeshStandardMaterial({color:0xffcc00});

    for(let i=0;i<stepsX;i++){
        for(let j=0;j<stepsY;j++){
            for(let k=0;k<stepsZ;k++){
                const cx = min.x + (i+0.5)*voxelSize;
                const cy = min.y + (j+0.5)*voxelSize;
                const cz = min.z + (k+0.5)*voxelSize;

                // raycast to see if voxel intersects mesh
                const voxelGeo = new THREE.BoxGeometry(voxelSize,voxelSize,voxelSize);
                const voxel = new THREE.Mesh(voxelGeo, voxelMat);
                voxel.position.set(cx,cy,cz);

                // simple intersection test
                const raycaster = new THREE.Raycaster();
                raycaster.set(new THREE.Vector3(cx,cy,cz+voxelSize*2), new THREE.Vector3(0,0,-1));
                const intersects = raycaster.intersectObject(mesh,true);
                if(intersects.length%2===1) voxelGroup.add(voxel);
            }
        }
    }
}

/* --------------------------
   RENDER LOOP
--------------------------- */
function onResize(){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
}

function animate(){
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene,camera);
}

document.addEventListener('DOMContentLoaded',()=>{ init(); animate(); });
