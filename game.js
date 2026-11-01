import * as THREE from
"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// ======================================
// CRAZY FUNNY WORLD - MAIN GAME ENGINE
// ======================================

const game = document.getElementById("game");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 35, 120);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  300
);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

game.appendChild(renderer.domElement);

// ======================================
// LIGHTING
// ======================================

scene.add(new THREE.HemisphereLight(
  0xffffff,
  0x567344,
  2
));

const sunlight = new THREE.DirectionalLight(
  0xffffff,
  2
);

sunlight.position.set(-20, 35, 20);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);

scene.add(sunlight);

// ======================================
// MATERIALS
// ======================================

function material(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85
  });
}

const grass = material(0x59b84d);
const brown = material(0x80502e);
const green = material(0x259b50);
const blue = material(0x2879df);
const yellow = material(0xffdc40);
const skin = material(0xffbd8b);
const black = material(0x171323);
const white = material(0xffffff);

// ======================================
// GROUND
// ======================================

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(220, 220),
  grass
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;

scene.add(ground);

const grid = new THREE.GridHelper(
  220,
  55,
  0x398d48,
  0x398d48
);

grid.position.y = 0.02;
scene.add(grid);

// ======================================
// 3D OBJECT HELPERS
// ======================================

function createBox(parent, w, h, d, mat, x, y, z) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    mat
  );

  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;

  parent.add(object);

  return object;
}

function createSphere(parent, radius, mat, x, y, z) {
  const object = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 16),
    mat
  );

  object.position.set(x, y, z);
  object.castShadow = true;

  parent.add(object);

  return object;
}

// ======================================
// PLAYER CHARACTER
// ======================================

const player = new THREE.Group();

scene.add(player);

const body = createBox(
  player, 0.9, 1.15, 0.55,
  blue, 0, 1.15, 0
);

const head = createSphere(
  player, 0.52, skin, 0, 2.05, 0
);

// Eyes
createSphere(player, 0.09, white, -0.19, 2.12, 0.44);
createSphere(player, 0.09, white, 0.19, 2.12, 0.44);

createSphere(player, 0.045, black, -0.17, 2.12, 0.52);
createSphere(player, 0.045, black, 0.21, 2.12, 0.52);

// Funny mouth
const mouth = createBox(
  player, 0.27, 0.055, 0.04,
  black, 0, 1.87, 0.5
);

// Hat
const hat = new THREE.Mesh(
  new THREE.ConeGeometry(0.55, 0.55, 8),
  yellow
);

hat.position.y = 2.65;
hat.castShadow = true;

player.add(hat);

// Arms
const leftArm = createBox(
  player, 0.22, 0.8, 0.22,
  skin, -0.62, 1.25, 0
);

const rightArm = createBox(
  player, 0.22, 0.8, 0.22,
  skin, 0.62, 1.25, 0
);

// Legs
const leftLeg = createBox(
  player, 0.28, 0.7, 0.3,
  black, -0.25, 0.35, 0
);

const rightLeg = createBox(
  player, 0.28, 0.7, 0.3,
  black, 0.25, 0.35, 0
);

// ======================================
// TREES
// ======================================

function createTree(x, z) {

  const tree = new THREE.Group();

  tree.position.set(x, 0, z);

  createBox(
    tree, 0.5, 2, 0.5,
    brown, 0, 1, 0
  );

  createSphere(
    tree, 1.5, green,
    0, 2.8, 0
  );

  createSphere(
    tree, 1.05, material(0x39b95d),
    -0.8, 2.5, 0.2
  );

  scene.add(tree);
}

for (let i = 0; i < 80; i++) {

  const angle = Math.random() * Math.PI * 2;
  const radius = 15 + Math.random() * 80;

  createTree(
    Math.cos(angle) * radius,
    Math.sin(angle) * radius
  );
}

// ======================================
// COLORFUL HOUSES
// ======================================

const houseColors = [
  0xff8b5e,
  0x8b83ff,
  0xffd45e,
  0x65d8cb
];

for (let i = 0; i < 16; i++) {

  const x = (Math.random() - 0.5) * 100;
  const z = (Math.random() - 0.5) * 100;

  if (Math.hypot(x, z) < 18) continue;

  const house = new THREE.Group();

  house.position.set(x, 0, z);

  createBox(
    house,
    5, 3.5, 5,
    material(houseColors[i % 4]),
    0, 1.75, 0
  );

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(4.2, 2.5, 4),
    material(0xc94f56)
  );

  roof.position.y = 4.7;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;

  house.add(roof);

  scene.add(house);
}

// ======================================
// COLLECTIBLE STARS
// ======================================

const stars = [];

for (let i = 0; i < 30; i++) {

  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.65),
    yellow
  );

  star.position.set(
    (Math.random() - 0.5) * 85,
    0.9,
    (Math.random() - 0.5) * 85
  );

  star.castShadow = true;

  scene.add(star);

  stars.push(star);
}

// ======================================
// FUNNY SOUND SYSTEM
// ======================================

// All sounds are generated locally.
// No paid API or downloaded audio required.

let audioContext = null;

function getAudio() {

  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function tone(
  frequency,
  duration = 0.2,
  type = "sine",
  volume = 0.15,
  slide = 0
) {

  const ctx = getAudio();

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;

  oscillator.frequency.setValueAtTime(
    frequency,
    ctx.currentTime
  );

  if (slide !== 0) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(40, frequency + slide),
      ctx.currentTime + duration
    );
  }

  gain.gain.setValueAtTime(
    volume,
    ctx.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function noise(duration = 0.2, volume = 0.15) {

  const ctx = getAudio();

  const length = Math.floor(
    ctx.sampleRate * duration
  );

  const buffer = ctx.createBuffer(
    1,
    length,
    ctx.sampleRate
  );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();

  source.buffer = buffer;

  gain.gain.setValueAtTime(
    volume,
    ctx.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + duration
  );

  source.connect(gain);
  gain.connect(ctx.destination);

  source.start();
}

const soundEffects = {

  laugh() {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        tone(
          520 + Math.random() * 220,
          0.12,
          "square",
          0.09,
          -150
        );
      }, i * 130);
    }
  },

  boing() {
    tone(180, 0.42, "sine", 0.25, 700);
  },

  scream() {
    tone(850, 0.55, "sawtooth", 0.12, -700);

    setTimeout(() => {
      tone(420, 0.35, "sawtooth", 0.1, -300);
    }, 120);
  },

  bonk() {
    tone(130, 0.12, "triangle", 0.3, -70);
    noise(0.07, 0.08);
  },

  fart() {
    noise(0.38, 0.2);
    tone(95, 0.35, "sawtooth", 0.08, -40);
  },

  win() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => {
        tone(f, 0.2, "triangle", 0.14);
      }, i * 120);
    });
  }
};

window.playSound = function(name) {

  if (soundEffects[name]) {
    soundEffects[name]();
  }
};

// ======================================
// PLAYER MOVEMENT
// ======================================

let score = 0;
let velocityY = 0;
let jumping = false;
let dancing = false;
let danceTime = 0;

let movement = {
  x: 0,
  y: 0
};

const keys = {};

const scoreDisplay = document.getElementById("score");
const statusDisplay = document.getElementById("status");

function showMessage(message) {

  statusDisplay.textContent = message;

  clearTimeout(showMessage.timer);

  showMessage.timer = setTimeout(() => {
    statusDisplay.textContent =
      "Explore the funny world!";
  }, 2200);
}

// Keyboard controls
window.addEventListener("keydown", (event) => {

  keys[event.key.toLowerCase()] = true;

  if (
    event.code === "Space" &&
    player.position.y <= 0.01
  ) {
    jump();
  }

  if (event.key.toLowerCase() === "e") {
    playSound("fart");
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

// ======================================
// JUMP
// ======================================

function jump() {

  if (player.position.y <= 0.01) {

    velocityY = 8.5;
    jumping = true;

    playSound("boing");
  }
}

document.getElementById("jump").onclick = jump;

// ======================================
// DANCE
// ======================================

document.getElementById("dance").onclick = () => {

  dancing = !dancing;
  danceTime = 0;

  if (dancing) {
    playSound("laugh");
    showMessage("DANCE MODE ACTIVATED!");
  } else {
    showMessage("Dance stopped!");
  }
};

// ======================================
// RANDOM SOUND
// ======================================

document.getElementById("random").onclick = () => {

  const sounds = [
    "laugh",
    "boing",
    "scream",
    "bonk",
    "fart"
  ];

  const selected = sounds[
    Math.floor(Math.random() * sounds.length)
  ];

  playSound(selected);

  showMessage("RANDOM CHAOS!");
};

// ======================================
// TOUCH JOYSTICK
// ======================================

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

let activePointer = null;

joystick.addEventListener("pointerdown", (event) => {

  activePointer = event.pointerId;

  joystick.setPointerCapture(activePointer);

  updateJoystick(event);
});

joystick.addEventListener("pointermove", (event) => {

  if (event.pointerId === activePointer) {
    updateJoystick(event);
  }
});

function updateJoystick(event) {

  const rect = joystick.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let dx = event.clientX - centerX;
  let dy = event.clientY - centerY;

  const max = 38;
  const length = Math.hypot(dx, dy);

  if (length > max) {
    dx = dx / length * max;
    dy = dy / length * max;
  }

  movement.x = dx / max;
  movement.y = dy / max;

  stick.style.transform =
    `translate(${dx}px, ${dy}px)`;
}

function resetJoystick(event) {

  if (event.pointerId === activePointer) {

    activePointer = null;

    movement = {
      x: 0,
      y: 0
    };

    stick.style.transform =
      "translate(0, 0)";
  }
}

joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);

// ======================================
// START GAME
// ======================================

document.getElementById("start").onclick = () => {

  getAudio();

  document.getElementById("startScreen").style.display =
    "none";

  playSound("win");

  showMessage("WELCOME TO THE MADNESS!");
};

// ======================================
// GAME LOOP
// ======================================

const clock = new THREE.Clock();

function animate() {

  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);
  const time = clock.elapsedTime;

  // Movement direction
  let x =
    movement.x +
    (keys.d || keys.arrowright ? 1 : 0) -
    (keys.a || keys.arrowleft ? 1 : 0);

  let z =
    movement.y +
    (keys.s || keys.arrowdown ? 1 : 0) -
    (keys.w || keys.arrowup ? 1 : 0);

  const length = Math.hypot(x, z);

  if (length > 1) {
    x /= length;
    z /= length;
  }

  const speed = 9;

  player.position.x += x * speed * delta;
  player.position.z += z * speed * delta;

  // Character running animation
  if (Math.hypot(x, z) > 0.08 && !dancing) {

    const direction = Math.atan2(x, z);

    player.rotation.y = THREE.MathUtils.lerp(
      player.rotation.y,
      direction,
      0.18
    );

    leftArm.rotation.x = Math.sin(time * 13) * 0.7;
    rightArm.rotation.x = -Math.sin(time * 13) * 0.7;

    leftLeg.rotation.x = -Math.sin(time * 13) * 0.65;
    rightLeg.rotation.x = Math.sin(time * 13) * 0.65;
  }

  // Jump physics
  if (jumping || player.position.y > 0) {

    velocityY -= 20 * delta;

    player.position.y += velocityY * delta;

    if (player.position.y <= 0) {

      player.position.y = 0;

      velocityY = 0;
      jumping = false;
    }
  }

  // Dancing animation
  if (dancing) {

    danceTime += delta;

    body.rotation.z = Math.sin(time * 15) * 0.35;
    head.rotation.z = Math.sin(time * 15) * 0.25;

    leftArm.rotation.z = Math.sin(time * 15) * 1.1;
    rightArm.rotation.z = -Math.sin(time * 15) * 1.1;

    if (danceTime > 7) {

      dancing = false;

      body.rotation.z = 0;
      head.rotation.z = 0;

      leftArm.rotation.z = 0;
      rightArm.rotation.z = 0;
    }
  }

  // Collect stars
  stars.forEach((star) => {

    star.rotation.y += delta * 1.8;
    star.rotation.x += delta;

    star.position.y =
      0.9 + Math.sin(time * 3 + star.position.x) * 0.18;

    const distance = star.position.distanceTo(
      player.position.clone().add(
        new THREE.Vector3(0, 1, 0)
      )
    );

    if (star.visible && distance < 1.5) {

      star.visible = false;

      score++;

      scoreDisplay.textContent = "⭐ " + score;

      playSound("win");

      showMessage("STAR COLLECTED!");
    }
  });

  // Camera follows player
  const cameraTarget = new THREE.Vector3(
    player.position.x,
    player.position.y + 5.5,
    player.position.z + 9
  );

  camera.position.lerp(cameraTarget, 0.08);

  camera.lookAt(
    player.position.x,
    player.position.y + 1.2,
    player.position.z
  );

  renderer.render(scene, camera);
}

// ======================================
// RESPONSIVE SCREEN
// ======================================

window.addEventListener("resize", () => {

  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});

// ======================================
// START RENDERING
// ======================================

animate();

// ======================================
// PWA SERVICE WORKER
// ======================================

if ("serviceWorker" in navigator &&
    location.protocol.startsWith("http")) {

  navigator.serviceWorker.register("./sw.js")
    .catch(error => console.error(
      "Service worker error:", error
    ));
}
