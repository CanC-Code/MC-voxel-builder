import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { FBXExporter } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/exporters/FBXExporter.js';

/**
 * Convert voxel grid to FBX mesh
 */
export function exportVoxelsToFBX(voxels){
    const group = new THREE.Group();
    const voxelSize = 1;

    voxels.forEach(v=>{
        const geo = new THREE.BoxGeometry(voxelSize,voxelSize,voxelSize);
        const mat = new THREE.MeshStandardMaterial({color:v.color});
        const mesh = new THREE.Mesh(geo,mat);
        mesh.position.set(v.x+voxelSize/2, v.y+voxelSize/2, v.z+voxelSize/2);
        group.add(mesh);
    });

    const exporter = new FBXExporter();
    const fbxData = exporter.parse(group);
    return fbxData;
}

export function downloadFBX(arrayBuffer, filename="model.fbx"){
    const blob = new Blob([arrayBuffer], {type:"application/octet-stream"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
}