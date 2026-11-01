
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

// CRAZY FUNNY WORLD - realistic character edition
const $ = (id) => document.getElementById(id);
const game = $("game");

if (!game) throw new Error("Game container not found.");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91c9ed);
scene.fog = new THREE.Fog(0x91c9ed, 65, 230);

const camera = new THREE.PerspectiveCamera(
  65, innerWidth / innerHeight, 0.1, 500
);
camera.position.set(0, 6, 10);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
game.appendChild(renderer.domElement);

// LIGHTING
scene.add(new THREE.HemisphereLight(0xddeeff, 0x566044, 2));

const sun = new THREE.DirectionalLight(0xfff1d5, 3);
sun.position.set(-35, 60, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
scene.add(sun);

// MATERIAL HELPERS
function mat(color, roughness = 0.9) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function box(parent, w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d), material
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// WORLD GROUND
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  mat(0x587d43)
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ROAD
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(15, 240),
  mat(0x33383c)
);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0.025, -45);
scene.add(road);

const roadLineMaterial = mat(0xf3d66b);
for (let z = -155; z < 75; z += 12) {
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 5),
    roadLineMaterial
  );
  line.rotation.x = -Math.PI / 2;
  line.position.set(0, 0.04, z);
  scene.add(line);
}

// BUILDINGS
const wallColors = [0xb9a18a, 0xd2b89b, 0x9eaaad, 0xc6c0a9];

function createHouse(x, z, colorIndex) {
  const house = new THREE.Group();
  house.position.set(x, 0, z);

  const wall = mat(wallColors[colorIndex % wallColors.length]);
  const roof = mat(0x55433a);
  const dark = mat(0x302b29);
  const glass = new THREE.MeshStandardMaterial({
    color: 0x8cc8dc, roughness: 0.25, metalness: 0.15
  });

  box(house, 9, 5, 8, wall, 0, 2.5, 0);
  box(house, 9.8, 0.35, 8.8, roof, 0, 5.15, 0);
  box(house, 1.5, 2.5, 0.15, dark, 0, 1.25, 4.08);

  box(house, 1.6, 1.2, 0.12, glass, -2.8, 3, 4.1);
  box(house, 1.6, 1.2, 0.12, glass, 2.8, 3, 4.1);

  scene.add(house);
}

for (let i = 0; i < 18; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  createHouse(
    side * (13 + Math.random() * 15),
    -110 + i * 12,
    i
  );
}

// TREES
function createTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.4, 3, 8),
    mat(0x65432c)
  );
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  tree.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(2.1, 12, 10),
    mat(0x285d31)
  );
  leaves.position.y = 4;
  leaves.castShadow = true;
  tree.add(leaves);

  scene.add(tree);
}

for (let i = 0; i < 100; i++) {
  const x = (Math.random() < 0.5 ? -1 : 1) *
    (12 + Math.random() * 100);
  const z = -160 + Math.random() * 260;
  createTree(x, z, 0.7 + Math.random() * 0.8);
}

// PLAYER ROOT
const player = new THREE.Group();
scene.add(player);

let character = null;
let mixer = null;
let activeAction = null;
let animationActions = {};
let characterReady = false;

const statusDisplay = $("status");
const scoreDisplay = $("score");

function message(text) {
  if (!statusDisplay) return;
  statusDisplay.textContent = text;
  clearTimeout(message.timer);
  message.timer = setTimeout(() => {
    statusDisplay.textContent = "Explore the funny world!";
  }, 2500);
}

// LOAD REAL HUMAN MODEL
// Upload your animated model to: assets/young_male.glb
const loader = new GLTFLoader();

message("Loading your realistic character...");

loader.load(
  "./assets/young_male.glb",
  (gltf) => {
    character = gltf.scene;

    character.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.material) {
          object.material.needsUpdate = true;
        }
      }
    });

    // Normalize model height to about 1.8 metres
    const initialBox = new THREE.Box3().setFromObject(character);
    const initialSize = initialBox.getSize(new THREE.Vector3());
    const height = initialSize.y || 1;
    character.scale.setScalar(1.8 / height);

    // Center the model at its feet
    const scaledBox = new THREE.Box3().setFromObject(character);
    character.position.y -= scaledBox.min.y;

    player.add(character);
    characterReady = true;

    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(character);

      const findClip = (names) => {
        const clip = gltf.animations.find((animation) =>
          names.some((name) =>
            animation.name.toLowerCase().includes(name)
          )
        );
        return clip || null;
      };

      const clips = {
        idle: findClip(["idle", "standing"]),
        walk: findClip(["walk"]),
        run: findClip(["run"]),
        jump: findClip(["jump"]),
        dance: findClip(["dance", "hip", "silly"])
      };

      for (const [name, clip] of Object.entries(clips)) {
        if (clip) {
          animationActions[name] = mixer.clipAction(clip);
        }
      }

      playAnimation("idle");
    }

    message("Character loaded! Welcome to Crazy Funny World.");
  },
  undefined,
  (error) => {
    console.error("Character model loading failed:", error);
    message("Character missing: upload assets/young_male.glb");
  }
);

function playAnimation(name) {
  if (!mixer || !animationActions[name]) return;

  const next = animationActions[name];
  if (activeAction === next) return;

  next.reset();
  next.fadeIn(0.2);
  if (activeAction) activeAction.fadeOut(0.2);
  next.play();
  activeAction = next;
}

// COLLECTIBLE STARS
const stars = [];
const starMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd52a,
  emissive: 0x9b6500,
  emissiveIntensity: 0.5,
  metalness: 0.3,
  roughness: 0.3
});

for (let i = 0; i < 35; i++) {
  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.65),
    starMaterial
  );
  star.position.set(
    (Math.random() - 0.5) * 75,
    1.3,
    -130 + Math.random() * 220
  );
  scene.add(star);
  stars.push(star);
}

// FUNNY SOUND EFFECTS
let audio = null;

function getAudio() {
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audio.state === "suspended") audio.resume();
  return audio;
}

function sound(frequency, duration, type = "sine", volume = 0.15, endFrequency = null) {
  const ctx = getAudio();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(30, endFrequency),
      ctx.currentTime + duration
    );
  }

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001, ctx.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function playSound(name) {
  if (name === "laugh") {
    [600, 760, 620, 800].forEach((f, i) =>
      setTimeout(() => sound(f, 0.13, "square", 0.08, f - 180), i * 130)
    );
  } else if (name === "boing") {
    sound(140, 0.5, "sine", 0.23, 850);
  } else if (name === "scream") {
    sound(900, 0.65, "sawtooth", 0.1, 180);
  } else if (name === "bonk") {
    sound(170, 0.15, "triangle", 0.25, 55);
  } else if (name === "fart") {
    sound(100, 0.42, "sawtooth", 0.12, 45);
  } else if (name === "win") {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => sound(f, 0.2, "triangle", 0.13), i * 120)
    );
  }
}

window.playSound = playSound;

// GAME STATE
let score = 0;
let velocityY = 0;
let isJumping = false;
let dancing = false;
let danceTimer = 0;
let moveX = 0;
let moveZ = 0;
const keys = {};

function jump() {
  if (!isJumping && player.position.y <= 0.02) {
    velocityY = 8;
    isJumping = true;
    playSound("boing");
    if (animationActions.jump) playAnimation("jump");
  }
}

$("jump")?.addEventListener("click", jump);

$("dance")?.addEventListener("click", () => {
  dancing = !dancing;
  danceTimer = 0;
  if (dancing) {
    playSound("laugh");
    playAnimation("dance");
    message("SILLY DANCE MODE!");
  } else {
    playAnimation("idle");
    message("Dance stopped!");
  }
});

$("random")?.addEventListener("click", () => {
  const sounds = ["laugh", "boing", "scream", "bonk", "fart"];
  playSound(sounds[Math.floor(Math.random() * sounds.length)]);
  message("RANDOM CHAOS!");
});

window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;
  if (event.code === "Space") jump();
  if (event.key.toLowerCase() === "e") playSound("fart");
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

// MOBILE JOYSTICK
const joystick = $("joystick");
const stick = $("stick");
let pointerId = null;

function updateJoystick(event) {
  const rect = joystick.getBoundingClientRect();
  let dx = event.clientX - (rect.left + rect.width / 2);
  let dy = event.clientY - (rect.top + rect.height / 2);

  const max = 38;
  const length = Math.hypot(dx, dy);
  if (length > max) {
    dx = dx / length * max;
    dy = dy / length * max;
  }

  moveX = dx / max;
  moveZ = dy / max;
  stick.style.transform = `translate(${dx}px, ${dy}px)`;
}

if (joystick && stick) {
  joystick.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    joystick.setPointerCapture(pointerId);
    updateJoystick(event);
  });

  joystick.addEventListener("pointermove", (event) => {
    if (event.pointerId === pointerId) updateJoystick(event);
  });

  function stopJoystick(event) {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    moveX = 0;
    moveZ = 0;
    stick.style.transform = "translate(0,0)";
  }

  joystick.addEventListener("pointerup", stopJoystick);
  joystick.addEventListener("pointercancel", stopJoystick);
}

// START SCREEN
$("start")?.addEventListener("click", () => {
  getAudio();
  $("startScreen").style.display = "none";
  playSound("win");
  message("WELCOME TO THE MADNESS!");
});

// GAME LOOP
const clock = new THREE.Clock();
const cameraOffset = new THREE.Vector3(0, 6, 10);
const cameraLook = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);
  const time = clock.elapsedTime;

  let x = moveX +
    (keys.d || keys.arrowright ? 1 : 0) -
    (keys.a || keys.arrowleft ? 1 : 0);

  let z = moveZ +
    (keys.s || keys.arrowdown ? 1 : 0) -
    (keys.w || keys.arrowup ? 1 : 0);

  const length = Math.hypot(x, z);
  if (length > 1) {
    x /= length;
    z /= length;
  }

  const moving = Math.hypot(x, z) > 0.08;

  if (characterReady && moving && !dancing) {
    const direction = Math.atan2(x, z);
    player.rotation.y = THREE.MathUtils.lerp(
      player.rotation.y, direction, 0.15
    );
    playAnimation("run");
  } else if (characterReady && !dancing && !isJumping) {
    playAnimation("idle");
  }

  const speed = 6.5;
  player.position.x += x * speed * delta;
  player.position.z += z * speed * delta;

  // Keep player inside the world
  player.position.x = THREE.MathUtils.clamp(player.position.x, -110, 110);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -175, 110);

  // Jump physics
  if (isJumping || player.position.y > 0) {
    velocityY -= 20 * delta;
    player.position.y += velocityY * delta;

    if (player.position.y <= 0) {
      player.position.y = 0;
      velocityY = 0;
      isJumping = false;
      if (moving) playAnimation("run");
      else playAnimation("idle");
    }
  }

  // End dance after a few seconds
  if (dancing) {
    danceTimer += delta;
    if (danceTimer > 8) {
      dancing = false;
      playAnimation(moving ? "run" : "idle");
    }
  }

  if (mixer) mixer.update(delta);

  // Floating stars and collection
  for (const star of stars) {
    if (!star.visible) continue;

    star.rotation.y += delta * 1.8;
    star.position.y = 1.3 + Math.sin(time * 2 + star.position.x) * 0.2;

    if (star.position.distanceTo(
      new THREE.Vector3(player.position.x, player.position.y + 1, player.position.z)
    ) < 1.8) {
      star.visible = false;
      score++;
      if (scoreDisplay) scoreDisplay.textContent = "⭐ " + score;
      playSound("win");
      message("STAR COLLECTED!");
    }
  }

  // Third-person camera
  const targetCamera = player.position.clone().add(cameraOffset);
  camera.position.lerp(targetCamera, 0.07);

  cameraLook.set(
    player.position.x,
    player.position.y + 1.4,
    player.position.z
  );
  camera.lookAt(cameraLook);

  renderer.render(scene, camera);
}

animate();

// RESIZE
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
});

// SERVICE WORKER
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(console.warn);
}
