

import * as THREE from 'https://unpkg.com/three@0.146.0/build/three.module.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(200 / 200);
document.body.appendChild(renderer.domElement);
const boxGeometry = new THREE.BoxGeometry(1,1,1);
const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
const mesh = new THREE.Mesh(boxGeometry,material);
scene.add(mesh);
camera.position.z = 5;
renderer.render(scene, camera);