/**
 * Generate simple UV texture map for voxel colors
 * Returns {canvas, ctx}
 */
export function generateTextureAtlas(voxels){
    const size = 16; // 16x16 per voxel color (simplified)
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");

    // Fill with first voxel color if any
    if(voxels.length){
        ctx.fillStyle = voxels[0].color;
        ctx.fillRect(0,0,16,16);
    } else {
        ctx.fillStyle="#ffffff";
        ctx.fillRect(0,0,16,16);
    }

    return {canvas, ctx};
}

export function downloadTexture(canvas, filename="texture.png"){
    canvas.toBlob(blob=>{
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");
        a.href=url;
        a.download=filename;
        a.click();
    });
}