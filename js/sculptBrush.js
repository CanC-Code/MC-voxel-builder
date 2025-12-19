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

  apply(point, viewDir = null) {
    const pos = this.position;
    const norm = this.normal;
    const center = point;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      const dx = vx - center.x;
      const dy = vy - center.y;
      const dz = vz - center.z;

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
          ox = -dx * influence * 0.2;
          oy = -dy * influence * 0.2;
          oz = -dz * influence * 0.2;
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
    }

    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}