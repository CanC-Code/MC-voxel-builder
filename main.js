import * as THREE from 'three';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;

function init() {
  const canvas = document.getElementById('canvas');

  if (!canvas) {
    throw new Error('Canvas not found in DOM');
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 5);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  controls = new OrbitControls(camera, renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );
  scene.add(cube);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  animate();
});