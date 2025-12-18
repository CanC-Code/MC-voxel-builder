import * as THREE from '../three/three.module.js';

export class SculptBrush {
  constructor({ scene, camera, canvas, getMesh, onStart, onEnd }) {
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;
    this.getMesh = getMesh;
    this.onStart = onStart;
    this.onEnd = onEnd;

    this.radius = 0.5;
    this.strength = 0.15;
    this.active = false;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this._bind();
  }

  _bind() {
    this.canvas.addEventListener('pointerdown', e => this._start(e));
    window.addEventListener('pointerup', () => this._end());
    window.addEventListener('pointercancel', () => this._end());
    window.addEventListener('blur', () => this._end());
    this.canvas.addEventListener('pointermove', e => this._move(e));
  }

  _start(e) {
    if (!this.getMesh()) return;
    this.active = true;
    this.onStart?.();
    this._updateMouse(e);
    this._sculpt();
  }

  _end() {
    if (!this.active) return;
    this.active = false;
    this.onEnd?.();
  }

  _move(e) {
    if (!this.active) return;
    this._updateMouse(e);
    this._sculpt();
  }

  _updateMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _sculpt() {
    const mesh = this.getMesh();
    if (!mesh) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hit = this.raycaster.intersectObject(mesh);
    if (!hit.length) return;

    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const normal = hit[0].face.normal.clone().transformDirection(mesh.matrixWorld);
    const center = hit[0].point;

    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      mesh.localToWorld(v);

      const d = v.distanceTo(center);
      if (d > this.radius) continue;

      const falloff = 1 - d / this.radius;
      v.addScaledVector(normal, this.strength * falloff);

      mesh.worldToLocal(v);
      pos.setXYZ(i, v.x, v.y, v.z);
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
}