import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080814);
scene.fog = new THREE.Fog(0x080814, 8, 45);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.body.addEventListener('click', () => controls.lock());

const statusText = document.getElementById('status');
const endingText = document.getElementById('endingText');

const keys = { forward: false, backward: false, left: false, right: false };
document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyW') keys.forward = true;
  if (e.code === 'KeyS') keys.backward = true;
  if (e.code === 'KeyA') keys.left = true;
  if (e.code === 'KeyD') keys.right = true;
  if (e.code === 'KeyE') interact();
  if (e.code === 'KeyG') surfelGroup.visible = !surfelGroup.visible;
  if (waitingMomAnswer && e.code === 'Digit1') {
  waitingMomAnswer = false;
  startChase();
}
if (waitingMomAnswer && e.code === 'Digit2') {
  waitingMomAnswer = false;
  statusText.textContent = '뭔가 이상하다. 다시 생각해봐.';
}
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'KeyW') keys.forward = false;
  if (e.code === 'KeyS') keys.backward = false;
  if (e.code === 'KeyA') keys.left = false;
  if (e.code === 'KeyD') keys.right = false;
});

// ===== 기본 조명 =====
const ambient = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambient);

const mainLight = new THREE.DirectionalLight(0xbfd7ff, 1.8);
mainLight.position.set(-5, 8, 6);
mainLight.castShadow = true;
scene.add(mainLight);

// ===== 그룹 =====
const startRoom = new THREE.Group();
const corridor = new THREE.Group();
const happyRoom = new THREE.Group();
const anxietyRoom = new THREE.Group();
const hopeRoom = new THREE.Group();
const surfelGroup = new THREE.Group();

scene.add(startRoom, corridor, happyRoom, anxietyRoom, hopeRoom, surfelGroup);
surfelGroup.visible = false;

let currentStage = 'start';
let fragments = 0;
let memories = 0;
const memoryFragments = [];
let chaseStarted = false;
let momNPC = null;
let waitingMomAnswer = false;
let wakeUpStarted = false;
let gameEnded = false;
let finalScareStarted = false;
let scareTimer = 0;
// ===== 재질 =====
function mat(color, roughness = 0.75, metalness = 0.05, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity
  });
}

function box(group, size, pos, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
  mesh.position.set(pos.x, pos.y, pos.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function makeCrystal(color) {
  const c = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 1),
    mat(color, 0.2, 0.4, color, 2.5)
  );
  c.scale.set(0.8, 1.5, 0.7);
  c.castShadow = true;
  return c;
}

function makePortal(group, z, color) {
  const portal = box(
    group,
    { x: 3, y: 4, z: 0.2 },
    { x: 0, y: 2, z },
    mat(color, 0.35, 0.1, color, 1.7)
  );
  const light = new THREE.PointLight(color, 7, 18);
  light.position.set(0, 2.5, z + 1);
  group.add(light);
  return portal;
}

// ===== 시작 침실 =====
box(startRoom, { x: 12, y: 0.2, z: 12 }, { x: 0, y: 0, z: 0 }, mat(0x1a1720, 0.6, 0.1));
box(startRoom, { x: 12, y: 5, z: 0.3 }, { x: 0, y: 2.5, z: -6 }, mat(0x12121c));
box(startRoom, { x: 12, y: 5, z: 0.3 }, { x: 0, y: 2.5, z: 6 }, mat(0x12121c));
box(startRoom, { x: 0.3, y: 5, z: 12 }, { x: -6, y: 2.5, z: 0 }, mat(0x12121c));
box(startRoom, { x: 0.3, y: 5, z: 12 }, { x: 6, y: 2.5, z: 0 }, mat(0x12121c));
box(startRoom, { x: 12, y: 0.3, z: 12 }, { x: 0, y: 5, z: 0 }, mat(0x080810));

const bedroomDoor = box(
  startRoom,
  {  x: 1.8, y: 2.8, z: 0.2  },
  { x: 0, y: 1.4, z: -5.85 },
  mat(0x2b3d66, 0.5, 0.1, 0x3355ff, 1.1)
);
const bedroomLight = new THREE.PointLight(0x6688ff, 4, 10);
bedroomLight.position.set(0, 2.5, -4.7);
startRoom.add(bedroomLight);
// ===== 시작방 기억 조각 =====
function createMemoryFragment(x, y, z, color) {
  const memory = makeCrystal(color);
  memory.scale.set(0.35, 0.7, 0.35);
  memory.position.set(x, y, z);
  memory.userData.collected = false;

  const light = new THREE.PointLight(color, 2.5, 5);
  light.position.copy(memory.position);

  startRoom.add(memory);
  startRoom.add(light);

  memoryFragments.push({ mesh: memory, light });
}

createMemoryFragment(-4, 1.2, 2, 0xffcc88);
createMemoryFragment(4, 1.2, 2, 0x88ccff);
createMemoryFragment(-4, 1.2, -3, 0xcc88ff);
createMemoryFragment(4, 1.2, -3, 0xffffff);
// ===== 꿈 복도 =====
box(corridor, { x: 12, y: 0.2, z: 70 }, { x: 0, y: 0, z: -20 }, mat(0x171729, 0.35, 0.18));
box(corridor, { x: 1, y: 5, z: 70 }, { x: -5.5, y: 2.5, z: -20 }, mat(0x11111d));
box(corridor, { x: 1, y: 5, z: 70 }, { x: 5.5, y: 2.5, z: -20 }, mat(0x11111d));
box(corridor, { x: 12, y: 1, z: 70 }, { x: 0, y: 5, z: -20 }, mat(0x090914));

for (let i = 0; i < 10; i++) {
  const z = 4 - i * 6;
  box(corridor, { x: 0.5, y: 3.2, z: 0.5 }, { x: -4.4, y: 1.6, z }, mat(0x252538));
  box(corridor, { x: 0.5, y: 3.2, z: 0.5 }, { x: 4.4, y: 1.6, z }, mat(0x252538));
  const l = new THREE.PointLight(0x6688ff, 1.1, 7);
  l.position.set(i % 2 === 0 ? -3.8 : 3.8, 3.2, z);
  corridor.add(l);
}

const corridorCrystal = makeCrystal(0x88ccff);
corridorCrystal.position.set(0, 1.7, -10);
corridor.add(corridorCrystal);

const corridorCrystalLight = new THREE.PointLight(0x66aaff, 4, 10);
corridor.add(corridorCrystalLight);

makePortal(corridor, -30, 0x5f66ff);

// ===== 행복 공간 =====
box(happyRoom, { x: 34, y: 0.2, z: 34 }, { x: 0, y: 0, z: 0 }, mat(0x6b5525, 0.65, 0.05));
box(happyRoom, { x: 34, y: 5, z: 0.3 }, { x: 0, y: 2.5, z: -17 }, mat(0x9a7b34, 0.75, 0.05, 0x443300, 0.2));
box(happyRoom, { x: 34, y: 5, z: 0.3 }, { x: 0, y: 2.5, z: 17 }, mat(0x9a7b34));
box(happyRoom, { x: 0.3, y: 5, z: 34 }, { x: -17, y: 2.5, z: 0 }, mat(0x9a7b34));
box(happyRoom, { x: 0.3, y: 5, z: 34 }, { x: 17, y: 2.5, z: 0 }, mat(0x9a7b34));

const happyLight = new THREE.PointLight(0xffcc66, 9, 30);
happyLight.position.set(0, 5, 0);
happyRoom.add(happyLight);

const happyCrystal = makeCrystal(0xffdd88);
happyCrystal.position.set(0, 1.7, -7);
happyRoom.add(happyCrystal);
makePortal(happyRoom, -14, 0xffaa33);

// ===== 불안 공간 =====
box(anxietyRoom, { x: 22, y: 0.2, z: 35 }, { x: 0, y: 0, z: 0 }, mat(0x191221, 0.7, 0.1));
box(anxietyRoom, { x: 1, y: 6, z: 35 }, { x: -4, y: 3, z: 0 }, mat(0x0d0d16));
box(anxietyRoom, { x: 1, y: 6, z: 35 }, { x: 4, y: 3, z: 0 }, mat(0x0d0d16));
box(anxietyRoom, { x: 10, y: 1, z: 35 }, { x: 0, y: 6, z: 0 }, mat(0x050508));

const redLight = new THREE.PointLight(0xff3333, 7, 18);
redLight.position.set(-2, 3, -5);
anxietyRoom.add(redLight);

const blueLight = new THREE.PointLight(0x3344ff, 4, 16);
blueLight.position.set(2, 3, 4);
anxietyRoom.add(blueLight);

const anxietyCrystal = makeCrystal(0xff5555);
anxietyCrystal.position.set(0, 1.7, -9);
anxietyRoom.add(anxietyCrystal);
makePortal(anxietyRoom, -15, 0xff3333);

// ===== 희망 공간 =====
box(hopeRoom, { x: 36, y: 0.2, z: 36 }, { x: 0, y: 0, z: 0 }, mat(0xe8e4d5, 0.28, 0.2));
const hopeLight = new THREE.DirectionalLight(0xffffff, 4);
hopeLight.position.set(0, 12, 8);
hopeLight.castShadow = true;
hopeRoom.add(hopeLight);

const pillarLight = new THREE.PointLight(0xffffff, 10, 35);
pillarLight.position.set(0, 5, -7);
hopeRoom.add(pillarLight);

const endingCrystal = makeCrystal(0xffffff);
endingCrystal.position.set(0, 1.8, -7);
hopeRoom.add(endingCrystal);

// ===== 파티클 =====
const particles = [];
for (let i = 0; i < 90; i++) {
  const p = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x99ccff })
  );
  p.position.set((Math.random() - 0.5) * 14, 0.5 + Math.random() * 4, 8 - Math.random() * 36);
  corridor.add(p);
  particles.push(p);
}

// ===== SurfelGI Debug =====
// 수업에서 배운 SurfelGI 개념을 참고해서,
// 표면 샘플 위치를 작은 점으로 보여주고,
// 각 샘플 위치에 약한 PointLight를 추가해 간접광처럼 보이게 했다.
for (let i = 0; i < 90; i++) {
  const color = i % 2 === 0 ? 0xffcc66 : 0x66aaff;

  const s = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 8, 8),
    new THREE.MeshBasicMaterial({ color })
  );

  s.position.set(
    (Math.random() - 0.5) * 10,
    0.15,
    (Math.random() - 0.5) * 10
  );

  const surfelLight = new THREE.PointLight(
    color,
    0.18,
    2.2
  );

  surfelLight.position.copy(s.position);

  surfelGroup.add(s);
  surfelGroup.add(surfelLight);
}

// ===== 모델 로드 =====
const loader = new GLTFLoader();

loader.load('./assets/models/bed.glb', (gltf) => {
  const bed = gltf.scene;
  bed.position.set(0, 0, 2);
  bed.scale.set(1.2, 1.2, 1.2);
  bed.rotation.y = Math.PI;
  startRoom.add(bed);
});

loader.load('./assets/models/tree.glb', (gltf) => {
  const tree1 = gltf.scene;
  tree1.position.set(-5, 0, -4);
  tree1.scale.set(3, 3, 3);
  happyRoom.add(tree1);

  const tree2 = tree1.clone();
  tree2.position.set(6, 0, 3);
  tree2.scale.set(2.5, 2.5, 2.5);
  happyRoom.add(tree2);
});
loader.load(
  './assets/models/mom.glb',
  (gltf) => {

    const mom = gltf.scene;

    mom.position.set(-3.5, 0, -1.5);
    mom.scale.set(0.45, 0.45, 0.45);
    mom.rotation.y = Math.PI / 2;

    scene.add(mom);

     momNPC = mom;
     momNPC.userData.baseY = 0;
     momNPC.userData.walkPhase = 0;
   console.log('MOM SUCCESS');

  }
);
// ===== 스테이지 전환 =====
function setStage(stage) {
  currentStage = stage;

  startRoom.visible = stage === 'start';
  corridor.visible = stage === 'corridor';
  happyRoom.visible = stage === 'happy';
  anxietyRoom.visible = stage === 'anxiety';
  hopeRoom.visible = stage === 'hope';

  if (stage === 'start') {
    restoreNormalRoom();

    scene.background.set(0x080814);
    ambient.color.set(0xffffff);
    ambient.intensity = 1.4;
    bedroomLight.color.set(0x6688ff);
    bedroomLight.intensity = 6;
    scene.fog.color.set(0x080814);
    scene.fog.near = 6;
    scene.fog.far = 28;
    camera.position.set(0, 1.6, 4);
    statusText.textContent = 'Memories: 0 / 4 · Press E near glowing fragments';  
  }

  if (stage === 'corridor') {
    scene.background.set(0x101025);
    scene.fog.color.set(0x101025);
    scene.fog.near = 8;
    scene.fog.far = 45;
    camera.position.set(0, 1.6, 7);
    statusText.textContent = `Fragments: ${fragments} / 4 · Collect the blue fragment`;
  }

  if (stage === 'happy') {
    scene.background.set(0xffd27a);
    scene.fog.color.set(0xffd27a);
    scene.fog.near = 12;
    scene.fog.far = 45;
    camera.position.set(0, 1.6, 8);
    statusText.textContent = `Fragments: ${fragments} / 4 · Warm indirect light room`;
  }

  if (stage === 'anxiety') {
    scene.background.set(0x120818);
    scene.fog.color.set(0x120818);
    scene.fog.near = 5;
    scene.fog.far = 24;
    camera.position.set(0, 1.6, 8);
    statusText.textContent = `Fragments: ${fragments} / 4 · Shadow and fog room`;
  }

  if (stage === 'hope') {
    scene.background.set(0xf3efe0);
    scene.fog.color.set(0xf3efe0);
    scene.fog.near = 15;
    scene.fog.far = 60;
    camera.position.set(0, 1.6, 8);
    statusText.textContent = `Fragments: ${fragments} / 4 · Final light`;
  }
}
function restoreNormalRoom() {
  scene.background.set(0x080814);
  scene.fog.color.set(0x080814);

  ambient.color.set(0xffffff);
  ambient.intensity = 1.4;

  bedroomLight.color.set(0x6688ff);
  bedroomLight.intensity = 6;

  bedroomDoor.material.color.set(0x2b3d66);
  bedroomDoor.material.emissive.set(0x3355ff);
  bedroomDoor.material.emissiveIntensity = 1.1;

  startRoom.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      obj.material.color.set(0x12121c);

      if (obj.material.emissive) {
        obj.material.emissive.set(0x000000);
        obj.material.emissiveIntensity = 0;
      }

      obj.material.needsUpdate = true;
    }
  });

  bedroomDoor.material.color.set(0x2b3d66);
  bedroomDoor.material.emissive.set(0x3355ff);
  bedroomDoor.material.emissiveIntensity = 1.1;
}
function startChase() {
  chaseStarted = true;
  wakeUpStarted = false;

  scene.background.set(0x180000);
  scene.fog.color.set(0x180000);

  ambient.color.set(0xff0000);
  ambient.intensity = 1.8;

  bedroomLight.color.set(0xff0000);
  bedroomLight.intensity = 8;

  bedroomDoor.material.color.set(0x330000);
  bedroomDoor.material.emissive.set(0xff0000);
  bedroomDoor.material.emissiveIntensity = 3;

 
  statusText.textContent = '엄마의 얼굴이 일그러진다. 도망쳐! 기억 조각 4개를 찾아라.';
}
  startRoom.traverse((obj) => {
  if (obj.isMesh && obj.material) {
    obj.material.color.set(0x660000);

    if (obj.material.emissive) {
      obj.material.emissive.set(0x330000);
      obj.material.emissiveIntensity = 1.5;
    }

    obj.material.needsUpdate = true;
  }
});
function triggerWakeUp() {
  wakeUpStarted = true;
  chaseStarted = false;

  scene.background.set(0xffffff);
  scene.fog.color.set(0xffffff);
  ambient.color.set(0xffffff);
  ambient.intensity = 4;

  bedroomLight.color.set(0xffffff);
  bedroomLight.intensity = 12;

  statusText.textContent = '눈앞이 하얗게 번진다...';
setTimeout(() => {

  restoreNormalRoom();

  camera.position.set(0, 1.6, 4);

  if (momNPC) {
    momNPC.position.set(-3.5, 0, -1.5);
    momNPC.rotation.y = Math.PI / 2;
  }

  statusText.textContent = '침대에서 깼다. 엄마에게 가보자.';

}, 3000);
}
function interact() {
  if (gameEnded) return;

  // 현실로 돌아온 뒤 엄마에게 말 걸면 점프스케어 엔딩
  if (wakeUpStarted && momNPC && camera.position.distanceTo(momNPC.position) < 2.5) {
    statusText.textContent = '엄마: 일어났니? 학교 가야지.';

    setTimeout(() => {
  // 엄마를 원래 방향으로 고정
  momNPC.position.set(-3.5, 0, -1.5);
  momNPC.rotation.set(0, Math.PI / 2, 0);

  // 카메라를 엄마 얼굴 앞쪽으로 이동
  camera.position.set(-2.75, 1.45, -1.5);
  camera.lookAt(-3.5, 1.45, -1.5);

  statusText.textContent = '엄마: 일어났니? 학교 가야지.';
  gameEnded = true;
  setTimeout(() => {
  endingText.classList.remove('hidden');
}, 900);
}, 500);

    return;
  }

  // 처음 엄마와 대화
  if (!chaseStarted && !wakeUpStarted && currentStage === 'start' && momNPC && camera.position.distanceTo(momNPC.position) < 2.5) {
    statusText.textContent = '엄마: 일어났니? 학교 가야지.  [1] 이건 꿈이다  [2] 현실이다';
    waitingMomAnswer = true;
    return;
  }

  // 추격 중 기억 조각 수집
  if (chaseStarted && !wakeUpStarted && currentStage === 'start') {
    for (const item of memoryFragments) {
      if (!item.mesh.userData.collected && camera.position.distanceTo(item.mesh.position) < 1.6) {
        item.mesh.userData.collected = true;
        item.mesh.visible = false;
        item.light.visible = false;

        memories++;
        statusText.textContent = `Memories: ${memories} / 4 · 꿈의 조각을 찾았다`;

        if (memories >= 4) {
          triggerWakeUp();
        }

        return;
      }
    }
  }
}

function clampPlayer() {
  camera.position.y = 1.6;

  if (currentStage === 'start') {
    camera.position.x = Math.max(-5.2, Math.min(5.2, camera.position.x));
    camera.position.z = Math.max(-5.2, Math.min(5.2, camera.position.z));
  } else if (currentStage === 'corridor') {
    camera.position.x = Math.max(-4.8, Math.min(4.8, camera.position.x));
    camera.position.z = Math.max(-31, Math.min(8, camera.position.z));
  } else {
    camera.position.x = Math.max(-15, Math.min(15, camera.position.x));
    camera.position.z = Math.max(-15, Math.min(15, camera.position.z));
  }
}

function checkProgress() {
  if (currentStage === 'corridor' && camera.position.distanceTo(corridorCrystal.position) < 1.5) {
    fragments = 1;
    corridorCrystal.visible = false;
    setStage('happy');
  }

  if (currentStage === 'happy' && camera.position.distanceTo(happyCrystal.position) < 1.7) {
    fragments = 2;
    happyCrystal.visible = false;
    setStage('anxiety');
  }

  if (currentStage === 'anxiety' && camera.position.distanceTo(anxietyCrystal.position) < 1.7) {
    fragments = 3;
    anxietyCrystal.visible = false;
    setStage('hope');
  }

  if (currentStage === 'hope' && camera.position.distanceTo(endingCrystal.position) < 1.7) {
    fragments = 4;
    endingCrystal.visible = false;
    statusText.textContent = 'Fragments: 4 / 4 · You woke up from the dream';
  }
}

// ===== 애니메이션 =====
function animate() {
  requestAnimationFrame(animate);

  const speed = 0.09;
  if (controls.isLocked) {
    if (keys.forward) controls.moveForward(speed);
    if (keys.backward) controls.moveForward(-speed);
    if (keys.left) controls.moveRight(-speed);
    if (keys.right) controls.moveRight(speed);
  }

  clampPlayer();
  checkProgress();

  const t = Date.now() * 0.001;

  corridorCrystal.rotation.x += 0.01;
  corridorCrystal.rotation.y += 0.018;
  corridorCrystal.position.y = 1.7 + Math.sin(t * 2) * 0.18;
  corridorCrystalLight.position.copy(corridorCrystal.position);

  happyCrystal.rotation.y += 0.015;
  anxietyCrystal.rotation.y += 0.02;
  endingCrystal.rotation.y += 0.02;

  particles.forEach((p, i) => {
    p.position.y += Math.sin(t + i) * 0.0015;
  });

  bedroomLight.intensity = 3.5 + Math.sin(t * 2) * 0.5;
  happyLight.intensity = 8 + Math.sin(t) * 1.2;
  redLight.intensity = 6 + Math.sin(t * 5) * 2;
  if (chaseStarted && momNPC && !wakeUpStarted && !gameEnded) {
  const dir = new THREE.Vector3();
  dir.subVectors(camera.position, momNPC.position);
  dir.y = 0;
  dir.normalize();

  
  momNPC.position.add(dir.multiplyScalar(0.018));

  

  momNPC.userData.walkPhase += 0.18;

momNPC.position.y = Math.abs(Math.sin(momNPC.userData.walkPhase)) * 0.04;

  momNPC.lookAt(camera.position);
  momNPC.rotation.x = 0;
  momNPC.rotation.z = Math.sin(momNPC.userData.walkPhase) * 0.025;

  scene.background.set(0x180000);
  scene.fog.color.set(0x180000);

  if (camera.position.distanceTo(momNPC.position) < 1.2) {
    statusText.textContent = '엄마에게 붙잡혔다... 다시 도망쳐!';
    camera.position.set(0, 1.6, 0);
    camera.lookAt(0, 1.6, -5);
    momNPC.position.set(-3.5, 0, -1.5);
  }
}
  
    renderer.render(scene, camera);
}

setStage('start');
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});