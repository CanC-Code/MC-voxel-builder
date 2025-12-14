/*
  Converts a voxel grid into Minecraft Bedrock geometry JSON.

  Input format:
    voxels: Array of { x, y, z }

  Output:
    geometry JSON object ready to be written to file
*/

export function buildBedrockGeometry(voxels, options = {}) {
    const name = options.name || "geometry.voxel_model";
    const textureWidth = options.textureWidth || 16;
    const textureHeight = options.textureHeight || 16;

    // Convert voxel list into a fast lookup set
    const set = new Set(voxels.map(v => `${v.x},${v.y},${v.z}`));

    const visited = new Set();
    const cubes = [];

    function has(x, y, z) {
        return set.has(`${x},${y},${z}`);
    }

    // Greedy merge along X, Y, Z
    for (const v of voxels) {
        const key = `${v.x},${v.y},${v.z}`;
        if (visited.has(key)) continue;

        let maxX = v.x;
        let maxY = v.y;
        let maxZ = v.z;

        // Extend X
        while (has(maxX + 1, v.y, v.z)) maxX++;

        // Extend Y
        outerY:
        while (true) {
            for (let x = v.x; x <= maxX; x++) {
                if (!has(x, maxY + 1, v.z)) break outerY;
            }
            maxY++;
        }

        // Extend Z
        outerZ:
        while (true) {
            for (let x = v.x; x <= maxX; x++) {
                for (let y = v.y; y <= maxY; y++) {
                    if (!has(x, y, maxZ + 1)) break outerZ;
                }
            }
            maxZ++;
        }

        // Mark visited
        for (let x = v.x; x <= maxX; x++) {
            for (let y = v.y; y <= maxY; y++) {
                for (let z = v.z; z <= maxZ; z++) {
                    visited.add(`${x},${y},${z}`);
                }
            }
        }

        cubes.push({
            from: [v.x, v.y, v.z],
            to: [maxX + 1, maxY + 1, maxZ + 1]
        });
    }

    // Normalize into Bedrock space (16x16x16)
    const geometryCubes = cubes.map(c => {
        const size = [
            c.to[0] - c.from[0],
            c.to[1] - c.from[1],
            c.to[2] - c.from[2]
        ];

        return {
            origin: [
                c.from[0],
                c.from[1],
                c.from[2]
            ],
            size: size,
            uv: [0, 0]
        };
    });

    return {
        format_version: "1.12.0",
        "minecraft:geometry": [
            {
                description: {
                    identifier: name,
                    texture_width: textureWidth,
                    texture_height: textureHeight,
                    visible_bounds_width: 2,
                    visible_bounds_height: 2,
                    visible_bounds_offset: [0, 0.5, 0]
                },
                bones: [
                    {
                        name: "root",
                        pivot: [0, 0, 0],
                        cubes: geometryCubes
                    }
                ]
            }
        ]
    };
}