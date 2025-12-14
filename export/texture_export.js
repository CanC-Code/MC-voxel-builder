/*
  Texture atlas generator for Minecraft Bedrock.

  Each voxel color maps to a solid square in the atlas.
  Bedrock cubes can reference this atlas with simple UVs.
*/

export function generateTextureAtlas(voxels, options = {}) {
    const textureSize = options.textureSize || 16;
    const cellSize = options.cellSize || 4;

    // Default slime-green if no colors provided
    function voxelColor(v) {
        return v.color || "#55ff55";
    }

    // Build palette
    const palette = [];
    const paletteMap = new Map();

    voxels.forEach(v => {
        const c = voxelColor(v);
        if (!paletteMap.has(c)) {
            paletteMap.set(c, palette.length);
            palette.push(c);
        }
    });

    const cols = Math.ceil(Math.sqrt(palette.length));
    const rows = Math.ceil(palette.length / cols);

    const canvas = document.createElement("canvas");
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    const ctx = canvas.getContext("2d");

    // Draw palette
    palette.forEach((color, i) => {
        const x = (i % cols) * cellSize;
        const y = Math.floor(i / cols) * cellSize;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellSize, cellSize);
    });

    // Upscale to Minecraft texture resolution
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = textureSize;
    finalCanvas.height = textureSize;

    const fctx = finalCanvas.getContext("2d");
    fctx.imageSmoothingEnabled = false;
    fctx.drawImage(canvas, 0, 0, textureSize, textureSize);

    return {
        canvas: finalCanvas,
        palette,
        paletteMap,
        getUV(color) {
            const index = paletteMap.get(color);
            const u = (index % cols) * cellSize;
            const v = Math.floor(index / cols) * cellSize;
            return [u, v];
        }
    };
}

/*
  Utility to download the generated texture as PNG
*/
export function downloadTexture(canvas, filename = "texture.png") {
    canvas.toBlob(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
    });
}