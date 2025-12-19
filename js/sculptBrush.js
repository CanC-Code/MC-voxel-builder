import * as THREE from "../three/three.module.js";
import { mergeVertices } from "../three/BufferGeometryUtils.js";

export class SculptBrush {
  constructor(mesh) {
    this.mesh = mesh;
    this.geometry = mesh.geometry;

    // Ensure unique vertices to avoid cracking
    mergeVertices(this.geometry);

    this.position = this.geometry.attributes.position;
    this.normal = this.geometry.attributes.normal;

    this.radius = 1;
    this.strength = 0.3;
    this.tool = "inflate";

    // Symmetry axes
    this.symmetry = { x: false, y: false, z: false };

    // Falloff type: 'linear', 'smooth', 'sphere'
    this.falloffType = "smooth";
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

  setSymmetry(sym) {
    this.symmetry = sym;
  }

  setFalloff(type) {
    this.falloffType = type;
  }

  apply(point, viewDir = null) {
    const pos = this.position;
    const norm = this.normal;
    const center = point;

    const affected = [];

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      let dx = vx - center.x;
      let dy = vy - center.y;
      let dz = vz - center.z;
      let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > this.radius) continue;

      // Compute falloff
      let falloff = 1 - dist / this.radius;
      switch (this.falloffType) {
        case "linear":
          break; // already linear
        case "smooth":
          falloff = 3 * falloff * falloff - 2 * falloff * falloff * falloff;
          break;
        case "sphere":
          falloff = Math.sqrt(1 - (dist / this.radius) ** 2);
          break;
      }

      const influence = falloff * this.strength;

      affected.push({ i, dx, dy, dz, falloff, influence });
    }

    const applyDisplacement = (vx, vy, vz, nx, ny, nz, influence) => {
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
          ox = -vx * influence * 0.2;
          oy = -vy * influence * 0.2;
          oz = -vz * influence * 0.2;
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
          ox = -vx * influence;
          oy = -vy * influence;
          oz = -vz * influence;
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
      return new THREE.Vector3(ox, oy, oz);
    };

    // Apply displacements
    for (const a of affected) {
      const nx = norm.getX(a.i);
      const ny = norm.getY(a.i);
      const nz = norm.getZ(a.i);

      let displacement = applyDisplacement(
        pos.getX(a.i),
        pos.getY(a.i),
        pos.getZ(a.i),
        nx,
        ny,
        nz,
        a.influence
      );

      // Original vertex
      pos.setXYZ(
        a.i,
        pos.getX(a.i) + displacement.x,
        pos.getY(a.i) + displacement.y,
        pos.getZ(a.i) + displacement.z
      );

      // Symmetry
      for (const axis of ["x", "y", "z"]) {
        if (this.symmetry[axis]) {
          const mirrored = new THREE.Vector3(
            axis === "x" ? -displacement.x : displacement.x,
            axis === "y" ? -displacement.y : displacement.y,
            axis === "z" ? -displacement.z : displacement.z
          );
          const mirroredIndex = this.findMirroredVertex(a.i, axis);
          if (mirroredIndex !== null) {
            pos.setXYZ(
              mirroredIndex,
              pos.getX(mirroredIndex) + mirrored.x,
              pos.getY(mirroredIndex) + mirrored.y,
              pos.getZ(mirroredIndex) + mirrored.z
            );
          }
        }
      }
    }

    this.laplacianSmooth(affected.map(a => a.i), 0.45);

    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  laplacianSmooth(region, factor) {
    const geo = this.geometry;
    if (!geo.index) return;

    const pos = geo.attributes.position;
    const index = geo.index.array;

    const neighbors = {};
    for (const i of region) neighbors[i] = new Set();

    for (let i = 0; i < index.length; i += 3) {
      const [a, b, c] = [index[i], index[i + 1], index[i + 2]];
      if (neighbors[a]) neighbors[a].add(b).add(c);
      if (neighbors[b]) neighbors[b].add(a).add(c);
      if (neighbors[c]) neighbors[c].add(a).add(b);
    }

    const original = {};
    const v = new THREE.Vector3();
    const avg = new THREE.Vector3();

    for (const i of region) {
      original[i] = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    }

    for (const i of region) {
      const neigh = neighbors[i];
      if (!neigh || neigh.size === 0) continue;

      avg.set(0, 0, 0);
      neigh.forEach(n => avg.add(new THREE.Vector3(pos.getX(n), pos.getY(n), pos.getZ(n))));
      avg.multiplyScalar(1 / neigh.size);

      v.copy(original[i]).lerp(avg, factor);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
  }

  // Find mirrored vertex along axis (approximate by position)
  findMirroredVertex(index, axis) {
    const pos = this.position;
    const target = new THREE.Vector3(pos.getX(index), pos.getY(index), pos.getZ(index));
    target[axis] *= -1;

    for (let i = 0; i < pos.count; i++) {
      if (i === index) continue;
      const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      if (v.distanceTo(target) < 1e-4) return i;
    }
    return null;
  }
}