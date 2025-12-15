import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from './three/examples/jsm/loaders/OBJLoader.js';

let scene, camera, renderer, controls;
let currentModel = null;
let voxelGrid = {};
let voxelSize = 0.05; // adjustable
let skeleton = {};

function init() {
    const canvas = document.getElementById('canvas');
    const status = document.getElementById('status');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(3,3,3);

    renderer = new THREE.WebGLRenderer({canvas, antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    controls = new OrbitControls(camera, renderer.domElement);

    scene.add(new THREE.DirectionalLight(0xffffff, 1));
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // OBJ Input
    const objInput = document.getElementById('objInput');
    objInput.addEventListener('change', (e)=>{
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(ev){
            status.innerText = 'Loading OBJ...';
            const contents = ev.target.result;
            const loader = new OBJLoader();
            const object = loader.parse(contents);

            if(currentModel) scene.remove(currentModel);

            // Scale and center
            const box = new THREE.Box3().setFromObject(object);
            const size = box.getSize(new THREE.Vector3()).length();
            const scale = 2 / size;
            object.scale.set(scale, scale, scale);
            const center = box.getCenter(new THREE.Vector3());
            object.position.sub(center.multiplyScalar(scale));

            scene.add(object);
            currentModel = object;
            status.innerText = 'OBJ loaded!';
        };
        reader.readAsText(file);
    });

    // Voxel Size Input
    const voxelLabel = document.createElement('label');
    voxelLabel.innerText = 'Voxel Size: ';
    const voxelInput = document.createElement('input');
    voxelInput.type='number';
    voxelInput.min='0.01';
    voxelInput.max='0.2';
    voxelInput.step='0.01';
    voxelInput.value = voxelSize;
    voxelLabel.appendChild(voxelInput);
    document.getElementById('toolbar').appendChild(voxelLabel);
    voxelInput.addEventListener('change', ()=> voxelSize=parseFloat(voxelInput.value));

    // Convert to voxels button
    const convertBtn = document.createElement('button');
    convertBtn.innerText='Convert to Voxels';
    document.getElementById('toolbar').appendChild(convertBtn);
    convertBtn.addEventListener('click', async ()=>{
        if(!currentModel){ status.innerText='No model loaded!'; return; }
        status.innerText='Voxelizing...';
        voxelGrid={};
        skeleton={};
        await voxelizeModel(currentModel, voxelSize, status);
        assignSkeleton();
        status.innerText=`Voxelization complete. Voxels: ${Object.keys(voxelGrid).length}`;
    });

    // Export JSON
    document.getElementById('exportBtn').addEventListener('click', ()=>{
        const voxelsData = Object.keys(voxelGrid).map(k=>{
            const v = voxelGrid[k].position;
            const mat = voxelGrid[k].material;
            const color = mat.color? mat.color.getHex():0x00ff00;
            const bone = voxelGrid[k].bone || 'none';
            return {x:parseFloat(v.x.toFixed(3)), y:parseFloat(v.y.toFixed(3)), z:parseFloat(v.z.toFixed(3)), color, bone};
        });
        const blob = new Blob([JSON.stringify({voxels: voxelsData, skeleton}, null, 2)], {type:"application/json"});
        const url = URL.createObjectURL(blob);
        const a=document.createElement('a');
        a.href=url;
        a.download='voxels_skeleton.json';
        a.click();
    });

    window.addEventListener('resize', ()=>{
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Simple voxelization using bounding box + point-inside-raycasting (SDF placeholder)
async function voxelizeModel(mesh, size, status){
    const bbox = new THREE.Box3().setFromObject(mesh);
    const min = bbox.min.clone();
    const max = bbox.max.clone();
    const step = size;

    const total = Math.ceil((max.x-min.x)/step)*Math.ceil((max.y-min.y)/step)*Math.ceil((max.z-min.z)/step);
    let processed = 0;

    for(let x=min.x;x<=max.x;x+=step){
        for(let y=min.y;y<=max.y;y+=step){
            for(let z=min.z;z<=max.z;z+=step){
                const point = new THREE.Vector3(x+step/2, y+step/2, z+step/2);
                if(pointInsideMesh(point, mesh)){
                    const key=`${x.toFixed(3)}_${y.toFixed(3)}_${z.toFixed(3)}`;
                    const voxel=new THREE.Mesh(
                        new THREE.BoxGeometry(step, step, step),
                        new THREE.MeshStandardMaterial({color:sampleColor(point, mesh)})
                    );
                    voxel.position.copy(point);
                    scene.add(voxel);
                    voxelGrid[key]=voxel;
                }
                processed++;
                if(processed%500===0){
                    status.innerText=`Voxelizing... ${Math.floor(processed/total*100)}%`;
                    await new Promise(r=>setTimeout(r,0));
                }
            }
        }
    }
}

// Very simple point-in-mesh check via raycasting (placeholder for SDF)
function pointInsideMesh(point, mesh){
    const raycaster = new THREE.Raycaster();
    raycaster.set(point,new THREE.Vector3(1,0,0));
    const intersects=raycaster.intersectObject(mesh,true);
    return intersects.length%2===1;
}

// Placeholder color sampling (can later read UV/vertex colors)
function sampleColor(point, mesh){ return 0x00ff00; }

// Synthetic skeleton assignment
function assignSkeleton(){
    if(Object.keys(voxelGrid).length===0) return;
    // Compute bounding box
    const bbox = new THREE.Box3();
    for(const key in voxelGrid) bbox.expandByPoint(voxelGrid[key].position);

    const min=bbox.min, max=bbox.max;
    const yHeight=max.y-min.y;
    // simple humanoid bones
    skeleton={
        head:{position:[0, max.y-0.15*yHeight,0], children:['torso']},
        torso:{position:[0, min.y+0.5*yHeight,0], children:['left_arm','right_arm','left_leg','right_leg']},
        left_arm:{position:[min.x+0.1*(max.x-min.x), min.y+0.65*yHeight,0], children:[]},
        right_arm:{position:[max.x-0.1*(max.x-min.x), min.y+0.65*yHeight,0], children:[]},
        left_leg:{position:[min.x+0.15*(max.x-min.x), min.y+0.25*yHeight,0], children:[]},
        right_leg:{position:[max.x-0.15*(max.x-min.x), min.y+0.25*yHeight,0], children:[]}
    };

    // assign bone IDs
    for(const key in voxelGrid){
        const voxel=voxelGrid[key];
        const y=voxel.position.y;
        if(y>min.y+0.85*yHeight) voxel.bone='head';
        else if(y>min.y+0.65*yHeight) voxel.bone='torso';
        else voxel.bone='legs';
    }
}

function animate(){ requestAnimationFrame(animate); renderer.render(scene,camera); }

document.addEventListener('DOMContentLoaded',()=>{ init(); animate(); });