import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OBJExporter } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/exporters/OBJExporter.js';

/**
 * Convert voxel grid to OBJ mesh
 * voxels: array of {x,y,z,color}
 */
export function exportVoxelsToOBJ(voxels){
    const group = new THREE.Group();
    const voxelSize = 1;

    voxels.forEach(v=>{
        const geo = new THREE.BoxGeometry(voxelSize,voxelSize,voxelSize);
        const mat = new THREE.MeshStandardMaterial({color:v.color});
        const mesh = new THREE.Mesh(geo,mat);
        mesh.position.set(v.x+voxelSize/2, v.y+voxelSize/2, v.z+voxelSize/2);
        group.add(mesh);
    });

    const exporter = new OBJExporter();
    const objData = exporter.parse(group);
    return objData;
}

/** Utility to download OBJ */
export function downloadOBJ(objText, filename="model.obj"){
    const blob = new Blob([objText],{type:"text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
}