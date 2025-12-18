import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { TransformControls } from './three/TransformControls.js';
import { GLTFExporter } from './three/GLTFExporter.js';

let scene,camera,renderer,controls,transform;
let mesh;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

let cameraLocked=false;
let sculpting=false;

const brush = {
  mode:'inflate',
  radius:0.4,
  strength:0.15
};

init();
animate();

function init(){
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x2b2b2b);

  camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.01,100);
  camera.position.set(2.5,2.2,2.5);

  renderer=new THREE.WebGLRenderer({canvas:viewport,antialias:true});
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(devicePixelRatio);

  controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;

  scene.add(new THREE.HemisphereLight(0xffffff,0x444444,1.2));
  const d=new THREE.DirectionalLight(0xffffff,0.8);
  d.position.set(5,10,5);
  scene.add(d);

  createCube();

  transform=new TransformControls(camera,renderer.domElement);
  transform.addEventListener('dragging-changed',e=>{
    controls.enabled=!e.value;
  });
  scene.add(transform);

  bindUI();
}

function createCube(){
  if(mesh) scene.remove(mesh);
  const g=new THREE.BoxGeometry(1,1,1,10,10,10);
  const m=new THREE.MeshStandardMaterial({color:0x8ac5ff});
  mesh=new THREE.Mesh(g,m);
  scene.add(mesh);
  transform.attach(mesh);
}

function sculpt(hit){
  const g=mesh.geometry;
  const p=g.attributes.position;
  const n=g.attributes.normal;

  for(let i=0;i<p.count;i++){
    const v=new THREE.Vector3().fromBufferAttribute(p,i);
    const d=v.distanceTo(hit.point);
    if(d>brush.radius) continue;

    const fall=1-d/brush.radius;
    const norm=new THREE.Vector3().fromBufferAttribute(n,i);

    if(brush.mode==='inflate')
      v.addScaledVector(norm,brush.strength*fall);
    if(brush.mode==='deflate')
      v.addScaledVector(norm,-brush.strength*fall);
    if(brush.mode==='smooth')
      v.lerp(hit.point,brush.strength*fall*0.1);

    p.setXYZ(i,v.x,v.y,v.z);
  }
  p.needsUpdate=true;
  g.computeVertexNormals();
}

renderer.domElement.addEventListener('pointerdown',e=>{
  if(!cameraLocked) return;
  sculpting=true;
});

renderer.domElement.addEventListener('pointermove',e=>{
  if(!sculpting) return;
  mouse.x=(e.clientX/innerWidth)*2-1;
  mouse.y=-(e.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(mouse,camera);
  const hit=raycaster.intersectObject(mesh)[0];
  if(hit) sculpt(hit);
});

window.addEventListener('pointerup',()=>sculpting=false);

function bindUI(){
  document.getElementById('cameraLock').onclick=()=>{
    cameraLocked=!cameraLocked;
    controls.enabled=!cameraLocked;
  };

  document.getElementById('gizmoToggle').onclick=()=>{
    transform.enabled=!transform.enabled;
  };

  document.querySelectorAll('[data-tab]').forEach(b=>{
    b.onclick=()=>{
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      document.getElementById(b.dataset.tab).classList.add('active');
    };
  });

  document.querySelectorAll('[data-brush]').forEach(b=>{
    b.onclick=()=>brush.mode=b.dataset.brush;
  });

  radius.oninput=e=>brush.radius=+e.target.value;
  strength.oninput=e=>brush.strength=+e.target.value;

  exportGLTF.onclick=()=>{
    const ex=new GLTFExporter();
    ex.parse(mesh,g=>{
      const blob=new Blob([JSON.stringify(g)],{type:'application/json'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download='model.gltf';
      a.click();
    });
  };
}

function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene,camera);
}

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});