import * as THREE from "../three/three.module.js";
import { getNeighbors, updateNormals } from "./topology.js";

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

    // Precompute neighbors for smoothing & local operations
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

  setSymmetry(sym) {
    this.symmetry = sym; // {x: true, y: false, z: false}
  }

  apply(point, viewDir = null) {
    const pos = this.position;
    const norm = this.normal;
    const center = point;

    const region = [];
    const avgNormal = new THREE.Vector3();
    const v = new THREE.Vector3();
    const n = new THREE.Vector3();

    // Collect affected vertices
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i));

      // Apply symmetry by mirroring the center
      const mirrored = [
        v.clone(),
        this.symmetry.x ? new THREE.Vector3(-v.x, v.y, v.z) : null,
        this.symmetry.y ? new THREE.Vector3(v.x, -v.y, v.z) : null,
        this.symmetry.z ? new THREE.Vector3(v.x, v.y, -v.z) : null,
      ].filter(Boolean);

      let include = false;
      for (const mv of mirrored) {
        if (mv.distanceTo(center) <= this.radius) include = true;
      }

      if (!include) continue;

      region.push(i);
      n.set(norm.getX(i), norm.getY(i), norm.getZ(i));
      avgNormal.add(n);
    }

    if (region.length === 0) return;
    avgNormal.normalize();

    // Apply tool effects
    for (const i of region) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      const dist = v.distanceTo(center);
      const falloff = Math.pow(1 - dist / this.radius, 2);
      const influence = falloff * this.strength;

      let ox = 0, oy = 0, oz = 0;

      switch (this.tool) {
        case "inflate":
          ox = avgNormal.x * influence;
          oy = avgNormal.y * influence;
          oz = avgNormal.z * influence;
          break;
        case "deflate":
          ox = -avgNormal.x * influence;
          oy = -avgNormal.y * influence;
          oz = -avgNormal.z * influence;
          break;
        case "smooth":
          // Laplacian-like smoothing
          const neigh = Array.from(this.neighbors[i] || []);
          if (neigh.length === 0) break;
          const avg = new THREE.Vector3();
          neigh.forEach(nIdx => {
            avg.x += pos.getX(nIdx);
            avg.y += pos.getY(nIdx);
            avg.z += pos.getZ(nIdx);
          });
          avg.multiplyScalar(1 / neigh.length);
          ox = (avg.x - v.x) * 0.5 * influence;
          oy = (avg.y - v.y) * 0.5 * influence;
          oz = (avg.z - v.z) * 0.5 * influence;
          break;
        case "flatten":
          ox = -avgNormal.x * dist * influence;
          oy = -avgNormal.y * dist * influence;
          oz = -avgNormal.z * dist * influence;
          break;
        case "grab":
          if (viewDir) {
            ox = viewDir.x * influence;
            oy = viewDir.y * influence;
            oz = viewDir.z * influence;
          }
          break;
        case "pinch":
          ox = -avgNormal.x * influence * 0.7;
          oy = -avgNormal.y * influence * 0.7;
          oz = -avgNormal.z * influence * 0.7;
          break;
        case "clay":
          ox = avgNormal.x * influence * 0.6;
          oy = avgNormal.y * influence * 0.6;
          oz = avgNormal.z * influence * 0.6;
          break;
        case "scrape":
          ox = -avgNormal.x * influence * 0.8;
          oy = -avgNormal.y * influence * 0.8;
          oz = -avgNormal.z * influence * 0.8;
          break;
      }

      pos.setXYZ(i, v.x + ox, v.y + oy, v.z + oz);
    }

    // Update normals using our topology helper
    updateNormals(this.geometry, region);
    pos.needsUpdate = true;
  }
}