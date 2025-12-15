let scene, camera, renderer, controls;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let voxelSize = 1;
let voxelGrid = new Map();
let currentColor = "#55ff55";

const canvas = document.getElementById("canvas");
const newSphereBtn = document.getElementById("newSphereBtn");
const modelInput = document.getElementById("modelInput");
const voxelSizeInput = document.getElementById("voxelSizeInput");
const colorPicker = document.getElementById("colorPicker");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");
const statusEl = document.getElementById("status");

function setStatus(msg){ statusEl.textContent = msg; }

init();
animate();

function init(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(12,12,12);
    camera.lookAt(0,0,0);

    renderer = new THREE.WebGLRenderer({canvas, antialias:true});
    renderer.setSize(window.innerWidth*0.9, window.innerHeight*0.6);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0,0,0);
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff,0.6));
    const light = new THREE.DirectionalLight(0xffffff,0.8);
    light.position.set(20,40,20);
    scene.add(light);

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);

    voxelSizeInput.addEventListener("change",()=>{ voxelSize=parseFloat(voxelSizeInput.value); });
    colorPicker.addEventListener("change",()=>{ currentColor=colorPicker.value; });
    clearBtn.addEventListener("click",clearVoxels);
    newSphereBtn.addEventListener("click",createVoxelSphere);
    modelInput.addEventListener("change",loadModel);
    exportBtn.addEventListener("click",exportVoxelData);

    addVoxel(0,0,0,currentColor);
}

function animate(){
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene,camera);
}

function onResize(){
    camera.aspect=canvas.clientWidth/canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);
}

function key(x,y,z){ return `${x},${y},${z}`; }

function addVoxel(x,y,z,color=currentColor){
    const k=key(x,y,z);
    if(voxelGrid.has(k)) return;
    const geo=new THREE.BoxGeometry(voxelSize,voxelSize,voxelSize);
    const mat=new THREE.MeshStandardMaterial({color});
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(
        x*voxelSize+voxelSize/2,
        y*voxelSize+voxelSize/2,
        z*voxelSize+voxelSize/2
    );
    mesh.userData={x,y,z,color};
    voxelGrid.set(k,mesh);
    scene.add(mesh);
}

function removeVoxel(x,y,z){
    const k=key(x,y,z);
    const mesh=voxelGrid.get(k);
    if(!mesh) return;
    scene.remove(mesh);
    voxelGrid.delete(k);
}

function clearVoxels(){
    voxelGrid.forEach(v=>scene.remove(v));
    voxelGrid.clear();
    setStatus("Cleared all voxels.");
}

function onPointerDown(event){
    const rect=canvas.getBoundingClientRect();
    mouse.x=((event.clientX-rect.left)/rect.width)*2-1;
    mouse.y=-((event.clientY-rect.top)/rect.height)*2+1;

    raycaster.setFromCamera(mouse,camera);
    const hits=raycaster.intersectObjects([...voxelGrid.values()]);
    if(!hits.length) return;

    const hit=hits[0];
    const v=hit.object.userData;
    const n=hit.face.normal;

    if(event.shiftKey){
        removeVoxel(v.x,v.y,v.z);
    } else {
        addVoxel(
            v.x+Math.round(n.x),
            v.y+Math.round(n.y),
            v.z+Math.round(n.z),
            v.color
        );
    }
}

function createVoxelSphere(){
    clearVoxels();
    const radius = 4;
    setStatus("Creating voxel sphere...");
    for(let x=-radius;x<=radius;x++){
        for(let y=-radius;y<=radius;y++){
            for(let z=-radius;z<=radius;z++){
                if(x*x + y*y + z*z <= radius*radius){
                    addVoxel(x,y,z,currentColor);
                }
            }
        }
    }
    setStatus("Voxel sphere created.");
}

function loadModel(event){
    const file = event.target.files[0];
    if(!file) return;
    setStatus("Loading model...");
    const reader = new FileReader();
    reader.onload = e=>{
        const content = e.target.result;
        try{
            let object;
            if(file.name.endsWith(".obj")){
                const loader = new THREE.OBJLoader();
                object = loader.parse(content);
            } else if(file.name.endsWith(".fbx")){
                const loader = new THREE.FBXLoader();
                object = loader.parse(content);
            } else {
                setStatus("Unsupported file type.");
                return;
            }
            scene.add(object);
            setStatus("Model loaded. Voxelizing...");
            voxelizeMesh(object);
        } catch(err){
            console.error(err);
            setStatus("Model parsing failed. Check console.");
        }
    };
    if(file.name.endsWith(".fbx")) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
}

function voxelizeMesh(object){
    clearVoxels();
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const min = box.min, max = box.max;
    const inv = new THREE.Matrix4().copy(object.matrixWorld).invert();
    const ray = new THREE.Raycaster();
    let total = Math.ceil((max.x-min.x+1)/voxelSize) *
                Math.ceil((max.y-min.y+1)/voxelSize) *
                Math.ceil((max.z-min.z+1)/voxelSize);
    let count=0;
    for(let x=min.x;x<=max.x;x+=voxelSize){
        for(let y=min.y;y<=max.y;y+=voxelSize){
            for(let z=min.z;z<=max.z;z+=voxelSize){
                const p=new THREE.Vector3(x+voxelSize/2,y+voxelSize/2,z+voxelSize/2).applyMatrix4(inv);
                ray.set(p,new THREE.Vector3(1,0,0));
                const hits = ray.intersectObject(object,true);
                if(hits.length%2===1){
                    addVoxel(Math.floor(x/voxelSize),Math.floor(y/voxelSize),Math.floor(z/voxelSize),currentColor);
                }
                count++;
                if(count%50===0){
                    let pct=Math.floor((count/total)*100);
                    setStatus(`Voxelizing... ${pct}%`);
                }
            }
        }
    }
    setStatus("Voxelization complete.");
}

function exportVoxelData(){
    const voxels=[...voxelGrid.values()].map(v=>v.userData);

    // JSON
    const blob = new Blob([JSON.stringify(voxels,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download="voxels.json";
    a.click();

    // OBJ
    const objText = exportVoxelsToOBJ(voxels);
    downloadOBJ(objText);

    // FBX
    const fbxArrayBuffer = exportVoxelsToFBX(voxels);
    downloadFBX(fbxArrayBuffer);

    // Texture
    const atlas = generateTextureAtlas(voxels);
    downloadTexture(atlas.canvas);

    setStatus("Voxel data, OBJ, FBX, and texture exported.");
}