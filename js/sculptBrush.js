import * as THREE from "../three/three.module.js";

export class SculptBrush {
  constructor(mesh) {
    this.mesh = mesh;
    this.geometry = mesh.geometry;
    this.position = this.geometry.attributes.position;
    this.normal = this.geometry.attributes.normal;

    this.radius = 1;
    this.strength = 0.3;
    this.tool = "inflate";
    this.symmetry = { x: false, y: false, z: false };
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

  setSymmetry(axis, enabled) {
    if (["x","y","z"].includes(axis)) this.symmetry[axis] = enabled;
  }

  apply(point) {
    const pos = this.position;
    const norm = this.normal;
    const center = point.clone();

    const region = [];
    const avgNormal = new THREE.Vector3();
    const v = new THREE.Vector3();
    const n = new THREE.Vector3();

    // Collect region of influence
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i));

      const inRegion = this._checkSymmetry(v, center);
      const dist = v.distanceTo(center);
      if (dist > this.radius && !inRegion) continue;

      region.push(i);
      n.set(norm.getX(i), norm.getY(i), norm.getZ(i));
      avgNormal.add(n);
    }

    if (region.length === 0) return;
    avgNormal.normalize();

    // Apply tool effect
    for (const i of region) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      const dist = v.distanceTo(center);
      const falloff = Math.pow(1 - dist / this.radius, 2);
      const influence = falloff * this.strength;

      let ox = 0, oy = 0, oz = 0;

      switch (this.tool) {
        case "inflate":
          ox = norm.getX(i) * influence;
          oy = norm.getY(i) * influence;
          oz = norm.getZ(i) * influence;
          break;
        case "deflate":
          ox = -norm.getX(i) * influence;
          oy = -norm.getY(i) * influence;
          oz = -norm.getZ(i) * influence;
          break;
        case "smooth":
          ox = -v.x * influence * 0.2;
          oy = -v.y * influence * 0.2;
          oz = -v.z * influence * 0.2;
          break;
        case "flatten":
          ox = -norm.getX(i) * dist * influence;
          oy = -norm.getY(i) * dist * influence;
          oz = -norm.getZ(i) * dist * influence;
          break;
        case "pinch":
          ox = -v.x * influence;
          oy = -v.y * influence;
          oz = -v.z * influence;
          break;
        case "clay":
          ox = norm.getX(i) * influence * 0.6;
          oy = norm.getY(i) * influence * 0.6;
          oz = norm.getZ(i) * influence * 0.6;
          break;
        case "scrape":
          ox = -norm.getX(i) * influence * 0.8;
          oy = -norm.getY(i) * influence * 0.8;
          oz = -norm.getZ(i) * influence * 0.8;
          break;
      }

      pos.setXYZ(i, v.x + ox, v.y + oy, v.z + oz);
    }

    // Laplacian smoothing for coherent surface
    this._laplacianSmooth(region, 0.45);

    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  _checkSymmetry(v, center) {
    let mirrored = false;
    if (this.symmetry.x && Math.abs(v.x + center.x) < this.radius) mirrored = true;
    if (this.symmetry.y && Math.abs(v.y + center.y) < this.radius) mirrored = true;
    if (this.symmetry.z && Math.abs(v.z + center.z) < this.radius) mirrored = true;
    return mirrored;
  }

  _laplacianSmooth(region, factor) {
    const geo = this.geometry;
    if (!geo.index) return;

    const pos = geo.attributes.position;
    const index = geo.index.array;
    const neighbors = {};
    for (const i of region) neighbors[i] = new Set();

    for (let i = 0; i < index.length; i += 3) {
      const a = index[i], b = index[i + 1], c = index[i + 2];
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
      neigh.forEach(n =>
        avg.add(new THREE.Vector3(pos.getX(n), pos.getY(n), pos.getZ(n)))
      );
      avg.multiplyScalar(1 / neigh.size);
      v.copy(original[i]).lerp(avg, factor);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
  }
}