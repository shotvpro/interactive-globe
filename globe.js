import * as THREE from 'https://cdn.skypack.dev/three';
import { OrbitControls } from 'https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 0, 3.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Earth
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('earth.jpg');
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshStandardMaterial({ map: earthTexture })
);
scene.add(earth);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 3, 5);
scene.add(light);

// Raycaster + mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const popup = document.getElementById('popup');

window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

function uvToLatLon(uv) {
  const lon = uv.x * 360 - 180;
  const lat = 90 - uv.y * 180;
  return { lat, lon };
}

function estimateTimezoneOffset(lon) {
  return Math.round(lon / 15);
}

function getLocalTime(offset) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const local = new Date(utc + offset * 3600000);
  return local.toLocaleTimeString();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(earth);

  if (intersects.length && intersects[0].uv) {
    const uv = intersects[0].uv;
    const { lat, lon } = uvToLatLon(uv);
    const offset = estimateTimezoneOffset(lon);
    const localTime = getLocalTime(offset);

    popup.style.left = `${event.clientX + 15}px`;
    popup.style.top = `${event.clientY + 15}px`;
    popup.innerHTML = `
      Lat: ${lat.toFixed(2)}°<br/>
      Lon: ${lon.toFixed(2)}°<br/>
      UTC ${offset >= 0 ? "+" : ""}${offset}<br/>
      Local Time: ${localTime}
    `;
    popup.style.display = 'block';
  } else {
    popup.style.display = 'none';
  }
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
