import * as THREE from "../three/three.module.js";

export class ViewCube {
  constructor(camera, renderer) {
    this.camera = camera;

    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
    this.cam.position.set(2, 2, 2);
    this.cam.lookAt(0, 0, 0);

    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshNormalMaterial();
    this.cube = new THREE.Mesh(geo, mat);
    this.scene.add(this.cube);

    this.renderer = renderer;
  }

  render() {
    this.cube.quaternion.copy(this.camera.quaternion).invert();
    this.renderer.autoClear = false;
    this.renderer.clearDepth();
    this.renderer.setViewport(10, 10, 100, 100);
    this.renderer.render(this.scene, this.cam);
    this.renderer.autoClear = true;
  }
}