import * as THREE from "../three/three.module.js";
import { mergeVertices } from "../three/BufferGeometryUtils.js";
import { getNeighbors, updateNormals } from "./topology.js";

export class SculptBrush {
  constructor(mesh) {
    this.mesh = mesh;

    // Ensure indexed geometry for proper neighbor calculations
    if (!mesh.geometry.index) {
      this.geometry = mergeVertices(mesh.geometry);
      mesh.geometry.dispose();
      mesh.geometry = this.geometry;
    } else {
      this.geometry = mesh.geometry;
    }

    this.position = this.geometry.attributes.position;
    this.normal = this.geometry.attributes.normal;

    this.radius = 1;
    this.strength = 0.3;
    this.tool = "inflate";
    this.symmetry = null; // 'x', 'y', 'z' or null

    // Build neighbor map
    this.neighbors = getNeighbors(this.geometry);
  }

  setTool(tool) {
    this.tool = tool;
  }

  setRadius(r) {
    this.radius = r;
  }

  setStrength(s) {
    this.strength = s;
  }

  setSymmetry(axis) {
    // Accept 'x', 'y', 'z', or null
    this.symmetry = axis;
  }

  apply(point, viewDir = null) {
    const pos = this.position;
    const norm = this.normal;

    const affectedVertices = [];

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      const dx = vx - point.x;
      const dy = vy - point.y;
      const dz = vz - point.z;

      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > this.radius) continue;

      const falloff = Math.pow(1 - dist / this.radius, 2);
      const influence = falloff * this.strength;

      const nx = norm.getX(i);
      const ny = norm.getY(i);
      const nz = norm.getZ(i);

      let ox = 0, oy = 0, oz = 0;

      switch (this.tool) {
        case "inflate":
          ox = nx * influence;
          oy = ny * influence;
          oz = nz * influence;
          break;

        case "deflate":
          ox = -nx * influence;
          oy = -ny * influence;
          oz = -nz * influence;
          break;

        case "smooth":
          // Average neighbors displacement
          let avg = new THREE.Vector3();
          const neigh = this.neighbors[i];
          if (neigh && neigh.size > 0) {
            neigh.forEach(n => {
              avg.add(new THREE.Vector3(
                pos.getX(n),
                pos.getY(n),
                pos.getZ(n)
              ));
            });
            avg.multiplyScalar(1 / neigh.size);
            ox = (avg.x - vx) * influence;
            oy = (avg.y - vy) * influence;
            oz = (avg.z - vz) * influence;
          }
          break;

        case "grab":
          if (!viewDir) break;
          ox = viewDir.x * influence;
          oy = viewDir.y * influence;
          oz = viewDir.z * influence;
          break;

        case "flatten":
          ox = -nx * dist * influence;
          oy = -ny * dist * influence;
          oz = -nz * dist * influence;
          break;

        case "pinch":
          ox = -dx * influence;
          oy = -dy * influence;
          oz = -dz * influence;
          break;

        case "clay":
          ox = nx * influence * 0.6;
          oy = ny * influence * 0.6;
          oz = nz * influence * 0.6;
          break;

        case "scrape":
          ox = -nx * influence * 0.8;
          oy = -ny * influence * 0.8;
          oz = -nz * influence * 0.8;
          break;
      }

      pos.setXYZ(i, vx + ox, vy + oy, vz + oz);
      affectedVertices.push(i);

      // Apply symmetry if set
      if (this.symmetry) {
        let sx = vx, sy = vy, sz = vz;
        if (this.symmetry === "x") sx = -vx;
        if (this.symmetry === "y") sy = -vy;
        if (this.symmetry === "z") sz = -vz;

        pos.setXYZ(i, sx + ox, sy + oy, sz + oz);
      }
    }

    pos.needsUpdate = true;
    updateNormals(this.geometry, affectedVertices);
  }
}