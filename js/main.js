/* ============================================================
   main.js — boots the village, routes input, runs the loop.
   ============================================================ */

import * as THREE from "three";
import { COUPLE, SPOTS } from "./data.js";
import { createWorld } from "./world.js";
import { Player, Bride } from "./player.js";
import {
  initUI, showDialog, dialogueActive, advance, isModalOpen, closeModal,
  buildHotbar, lightUpSlot, markSeen, updateHUD, toast,
  isTouch, updateActionButton, showHUD, openModal, setMusicButton,
} from "./ui.js";
import { initAudio, setMusic, musicEnabled, bgmState, sfxPop, sfxDing, sfxTook, sfxWarp } from "./audio.js";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- renderer / scene ---------- */
const canvas = document.getElementById("world");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const world = createWorld(scene);
const player = new Player(scene, world.colliders);
const bride = new Bride(scene, player);
player.camera.aspect = innerWidth / innerHeight;
player.camera.updateProjectionMatrix();

/* ---------- personalise the shell ---------- */
document.title = `Petalbrook — ${COUPLE.bride} & ${COUPLE.groom}'s Wedding`;
document.querySelector(".title-names").innerHTML =
  `<span class="title-name">${COUPLE.bride}</span><span class="title-amp">&amp;</span><span class="title-name">${COUPLE.groom}</span>`;
const HEART_SVG = '<svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21C6.5 16.8 3 13.6 3 9.9 3 7.2 5.1 5 7.8 5c1.7 0 3.2.9 4.2 2.2C13 5.9 14.5 5 16.2 5 18.9 5 21 7.2 21 9.9c0 3.7-3.5 6.9-9 11.1z"/></svg>';
document.querySelector("#hud-title .hud-couple").innerHTML =
  `${COUPLE.bride} ${HEART_SVG} ${COUPLE.groom}`;
const wed = new Date(COUPLE.weddingDate);
document.querySelector(".title-date").textContent =
  wed.toLocaleDateString("en-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

/* ---------- input state ---------- */
const keys = {};
const joy = { x: 0, z: 0 };
let started = false;

addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === "escape" && isModalOpen()) {
    closeModal();
    return;
  }
  if (k === " " || k === "enter" || k === "e") {
    if (dialogueActive()) {
      e.preventDefault();
      advance();
      return;
    }
    if (!isModalOpen() && started) {
      e.preventDefault();
      tryInteract();
    }
  }
  keys[k] = true;
});
addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function inputVector() {
  let x = 0;
  let z = 0;
  if (keys["w"] || keys["arrowup"]) z -= 1;
  if (keys["s"] || keys["arrowdown"]) z += 1;
  if (keys["a"] || keys["arrowleft"]) x -= 1;
  if (keys["d"] || keys["arrowright"]) x += 1;
  x += joy.x;
  z += joy.z;
  const len = Math.hypot(x, z);
  if (len > 1) {
    x /= len;
    z /= len;
  }
  return { x, z };
}

/* click / tap to move */
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const ndc = new THREE.Vector2();
const hitPoint = new THREE.Vector3();

canvas.addEventListener("pointerdown", (e) => {
  if (!started) return;
  if (dialogueActive()) {
    advance();
    return;
  }
  if (isModalOpen()) return;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, player.camera);
  if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
    const spot = nearestSpot();
    if (spot && Math.hypot(hitPoint.x - spot.pos[0], hitPoint.z - spot.pos[1]) < spot.r * 0.8) {
      tryInteract();
    } else {
      player.setTarget(hitPoint.x, hitPoint.z);
    }
  }
});

/* ---------- joystick ---------- */
const joyEl = document.getElementById("joystick");
const knob = document.getElementById("joy-knob");
let joyPointer = null;

joyEl.addEventListener("pointerdown", (e) => {
  joyPointer = e.pointerId;
  joyEl.setPointerCapture(joyPointer);
  moveJoy(e);
});
joyEl.addEventListener("pointermove", (e) => {
  if (e.pointerId === joyPointer) moveJoy(e);
});
const endJoy = (e) => {
  if (e.pointerId !== joyPointer) return;
  joyPointer = null;
  joy.x = joy.z = 0;
  knob.style.transform = "translate(0, 0)";
};
joyEl.addEventListener("pointerup", endJoy);
joyEl.addEventListener("pointercancel", endJoy);

function moveJoy(e) {
  const rect = joyEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = e.clientX - cx;
  let dy = e.clientY - cy;
  const max = rect.width / 2 - 14;
  const len = Math.hypot(dx, dy);
  if (len > max) {
    dx = (dx / len) * max;
    dy = (dy / len) * max;
  }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  joy.x = dx / max;
  joy.z = dy / max;
}

/* ---------- interaction ---------- */
function nearestSpot() {
  let best = null;
  let bestD = Infinity;
  for (const spot of SPOTS) {
    const d = Math.hypot(player.position.x - spot.pos[0], player.position.z - spot.pos[1]);
    if (d < spot.r && d < bestD) {
      best = spot;
      bestD = d;
    }
  }
  return best;
}

let currentSpot = null;

function tryInteract() {
  const spot = nearestSpot();
  if (!spot || dialogueActive() || isModalOpen()) return;
  if (markSeen(spot.id)) lightUpSlot(spot.id);
  sfxPop();
  showDialog(spot.dialog, spot.action || null);
}

document.getElementById("btn-act").addEventListener("click", () => {
  if (dialogueActive()) advance();
  else tryInteract();
});

/* ---------- HUD buttons ---------- */
document.getElementById("btn-music").addEventListener("click", () => {
  initAudio();
  setMusic(!musicEnabled());
  setMusicButton(musicEnabled());
  try {
    localStorage.setItem("pb_music", musicEnabled() ? "1" : "0");
  } catch { /* private mode */ }
  if (musicEnabled()) sfxDing();
  else sfxTook();
});
document.getElementById("btn-help").addEventListener("click", () => {
  openModal("help");
});

/* ---------- hotbar: stroll to the place (no teleporting) ---------- */
let strollSpot = null;
buildHotbar((spot) => {
  const [sx, sz] = spot.pos;
  // halt just outside the building, approaching from where the couple stands
  const dx = player.position.x - sx;
  const dz = player.position.z - sz;
  const d = Math.hypot(dx, dz) || 1;
  const stop = spot.stop ?? spot.r * 0.8;
  player.strollTo(sx + (dx / d) * stop, sz + (dz / d) * stop);
  strollSpot = spot;
  sfxWarp();
  toast(`Strolling to ${spot.menu}…`);
});

/* ---------- title screen ---------- */
document.getElementById("btn-start").addEventListener("click", () => {
  started = true;
  document.getElementById("title-screen").classList.add("hidden");
  showHUD(true);
  initAudio();
  updateHUD();
  sfxDing();
  // BGM: the waltz starts softly from the gate, unless the guest muted it before
  let wantMusic = true;
  try {
    wantMusic = localStorage.getItem("pb_music") !== "0";
  } catch {
    wantMusic = true;
  }
  setMusic(wantMusic);
  setMusicButton(musicEnabled());
  if (!wantMusic) toast("Music is muted — tap ♪ (top right) for the waltz");
  setTimeout(() => {
    const intro = () => showDialog(
      [
        { who: "nana", text: `Welcome to Petalbrook! You found our little village — this whole place is your invitation.` },
        { who: "raka", text: isTouch()
          ? "Drag the joystick or tap the ground to walk. When a spot bubbles up, tap Read to open it!"
          : "Walk with WASD or the arrow keys — or just click the ground. When a spot bubbles up, press Space to read it!" },
        { who: "nana", text: `And yes, I go where he goes. Pick a place from the pack below and we'll stroll there together — or just wander. I'll keep up.` },
      ],
      null,
      () => toast("Visit the mailbox first — it wants your RSVP ✿")
    );
    let firstVisit = false;
    try {
      firstVisit = !localStorage.getItem("pb_onboarded");
      localStorage.setItem("pb_onboarded", "1");
    } catch {
      firstVisit = false;
    }
    if (firstVisit) openModal("onboard", intro);
    else intro();
  }, 450);
});

/* ---------- resize ---------- */
addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  player.camera.aspect = innerWidth / innerHeight;
  player.camera.updateProjectionMatrix();
});

/* ---------- main loop ---------- */
initUI();
const clock = new THREE.Clock();

function step() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const input = inputVector();
  if (input.x !== 0 || input.z !== 0) strollSpot = null; // manual walking cancels the stroll

  if (started && !isModalOpen()) {
    player.update(dt, input, reducedMotion);
  } else if (!started) {
    // slow beauty pan on the title screen
    const a = t * 0.06;
    player.camera.position.set(Math.sin(a) * 24, 12, Math.cos(a) * 24 + 2);
    player.camera.lookAt(0, 2, 2);
  } else {
    player.update(0.0001, { x: 0, z: 0 }, reducedMotion);
  }

  // arrived from a hotbar stroll → open the spot automatically
  if (strollSpot && !player.target && !dialogueActive() && !isModalOpen()) {
    if (nearestSpot() === strollSpot) tryInteract();
    strollSpot = null;
  }

  world.update(dt, t, player.position, player.camera);
  bride.update(dt, reducedMotion);

    // proximity: button pulse (the act button is the one prompt — no bubbles, no hint pill)
    if (started) {
      currentSpot = nearestSpot();
      if (dialogueActive()) {
        updateActionButton("next");
      } else if (currentSpot) {
        updateActionButton("read");
      } else {
        updateActionButton("idle");
      }
    }

  renderer.render(scene, player.camera);
}

/* rAF drives the loop; if the tab is occluded/throttled and rAF stalls,
   a timer keeps the world alive so guests never return to a frozen frame. */
let lastRaf = performance.now();
(function rafLoop() {
  lastRaf = performance.now();
  step();
  requestAnimationFrame(rafLoop);
})();
setInterval(() => {
  if (performance.now() - lastRaf > 220) {
    lastRaf = performance.now();
    step();
  }
}, 50);

/* debug handle (used by tests; harmless in production) */
window.__pb = {
  get keys() { return keys; },
  get player() { return player; },
  get started() { return started; },
  world,
  scene,
  interact: tryInteract,
  bgm: bgmState,
};
