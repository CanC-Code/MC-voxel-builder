import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFExporter } from './three/GLTFExporter.js';

let scene, camera, renderer, orbitControls;
let mesh;
let started = false;
let showMesh = true;
let cameraLocked = false;
let brush = { size: 0.2, strength: 0.05 };
let brushMode = 'drag';
let mirror = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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
    // --- Scene ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x555555);

    // --- Camera ---
    camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(5,5,5);

    // --- Renderer ---
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // --- Orbit Controls ---
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;
    orbitControls.target.set(0,0.5,0);

    // --- Lights ---
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5,10,7);
    scene.add(dir);

    // --- Grid ---
    scene.add(new THREE.GridHelper(20,20));

    // --- Initial Mesh ---
    addMesh('cube');

    // --- UI Hooks ---
    bindButton('newCube', ()=>addMesh('cube'));
    bindButton('newSphere', ()=>addMesh('sphere'));
    bindButton('toggleMeshView', toggleMeshView);
    bindButton('lockCamera', toggleCameraLock);
    bindButton('exportGLTF', exportScene);

    document.getElementById('brushSize').addEventListener('input', e => brush.size=parseFloat(e.target.value));
    document.getElementById('brushStrength').addEventListener('input', e => brush.strength=parseFloat(e.target.value));
    document.getElementById('brushMode').addEventListener('change', e => brushMode=e.target.value);
    document.getElementById('mirror').addEventListener('change', e => mirror=e.target.checked);

    // --- Events ---
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
}

function bindButton(id, handler) {
    const el = document.getElementById(id);
    if(el) el.addEventListener('click', handler);
}

function addMesh(type){
    if(mesh) scene.remove(mesh);

    let geom;
    if(type==='cube') geom = new THREE.BoxGeometry(1,1,1,20,20,20);
    else geom = new THREE.SphereGeometry(0.5,32,32);

    mesh = new THREE.Mesh(
        geom,
        new THREE.MeshStandardMaterial({
            color: 0x44aa88,
            wireframe: !showMesh,
            flatShading:false
        })
    );
    mesh.position.y = 0.5;
    scene.add(mesh);
}

function toggleMeshView(){
    showMesh = !showMesh;
    if(mesh) mesh.material.wireframe = !showMesh;
}

function toggleCameraLock(){
    cameraLocked = !cameraLocked;
    orbitControls.enabled = !cameraLocked;
}

function exportScene(){
    const exporter = new GLTFExporter();
    exporter.parse(scene, gltf=>{
        const blob = new Blob([JSON.stringify(gltf,null,2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.gltf';
        a.click();
        URL.revokeObjectURL(url);
    });
}

function onWindowResize(){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let isPointerDown = false;
function onPointerDown(e){ isPointerDown=true; sculptMesh(e); }
function onPointerMove(e){ if(isPointerDown) sculptMesh(e); }
document.addEventListener('pointerup',()=>isPointerDown=false);

function sculptMesh(e){
    if(!mesh) return;
    mouse.x = (e.clientX / window.innerWidth)*2-1;
    mouse.y = -(e.clientY / window.innerHeight)*2+1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(mesh);
    if(intersects.length===0) return;
    const posAttr = mesh.geometry.attributes.position;
    const normAttr = mesh.geometry.attributes.normal;
    for(let i=0;i<posAttr.count;i++){
        const vertex = new THREE.Vector3().fromBufferAttribute(posAttr,i);
        const dist = vertex.distanceTo(intersects[0].point);
        if(dist<brush.size){
            const influence = 1 - dist/brush.size;
            const normal = new THREE.Vector3().fromBufferAttribute(normAttr,i);
            if(brushMode==='inflate') vertex.addScaledVector(normal, brush.strength*influence);
            else if(brushMode==='deflate') vertex.addScaledVector(normal, -brush.strength*influence);
            else if(brushMode==='smooth'){
                const avg = new THREE.Vector3();
                for(let j=0;j<posAttr.count;j++){
                    const v2 = new THREE.Vector3().fromBufferAttribute(posAttr,j);
                    if(vertex.distanceTo(v2)<brush.size*0.5) avg.add(v2);
                }
                avg.divideScalar(posAttr.count);
                vertex.lerp(avg, brush.strength*influence);
            }
            posAttr.setXYZ(i,vertex.x,vertex.y,vertex.z);
            if(mirror){
                posAttr.setXYZ(i, -vertex.x, vertex.y, vertex.z);
            }
        }
    }
    posAttr.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
}

function animate(){
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene,camera);
}