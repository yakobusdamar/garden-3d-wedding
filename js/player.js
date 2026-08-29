/* ============================================================
   player.js — the couple you walk around Petalbrook with.
   The groom is controllable; the bride follows his exact
   footsteps (breadcrumb trail), and hearts float when the
   two of you stop to breathe. Also: the follow camera.
   ============================================================ */

import * as THREE from "three";

const SPEED = 4.4;
const PLAYER_R = 0.45;
const BOUND = 26;
const FOLLOW_DIST = 1.5; // bride walks this far behind along the trail

const skinMat = new THREE.MeshLambertMaterial({ color: 0xf2c9a0 });
const denimMat = new THREE.MeshLambertMaterial({ color: 0x5b7fae });
const shirtMat = new THREE.MeshLambertMaterial({ color: 0xf6e6c8 });
const strawMat = new THREE.MeshLambertMaterial({ color: 0xe6c975 });
const bootMat = new THREE.MeshLambertMaterial({ color: 0x7c4f2a });
const dressMat = new THREE.MeshLambertMaterial({ color: 0xfffaf0 });
const hairMat = new THREE.MeshLambertMaterial({ color: 0x4a3222 });
const roseMat = new THREE.MeshLambertMaterial({ color: 0xe97fa2, flatShading: true });

function part(geo, mat, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

/* pivot-at-top limb so rotation swings it like a pendulum */
function limb(parent, mat, radius, length, x, y) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, 0);
  const geo = new THREE.CapsuleGeometry(radius, length, 3, 6);
  geo.translate(0, -(length / 2 + radius) + 0.05, 0);
  part(geo, mat, pivot);
  parent.add(pivot);
  return pivot;
}

function addFace(head, blushColor = 0xf0a8b8) {
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x3a2a1c });
  for (const ex of [-0.11, 0.11]) {
    part(new THREE.SphereGeometry(0.032, 6, 6), eyeMat, head, ex, 0.02, 0.28);
  }
  const blushMat = new THREE.MeshBasicMaterial({ color: blushColor });
  for (const bx of [-0.17, 0.17]) {
    const b = part(new THREE.SphereGeometry(0.045, 6, 6), blushMat, head, bx, -0.08, 0.24);
    b.scale.set(1, 0.6, 0.4);
  }
}

function buildGroom() {
  const g = new THREE.Group();

  // legs
  const legL = limb(g, denimMat, 0.09, 0.22, -0.12, 0.46);
  const legR = limb(g, denimMat, 0.09, 0.22, 0.12, 0.46);
  part(new THREE.BoxGeometry(0.16, 0.1, 0.24), bootMat, legL, 0, -0.32, 0.04);
  part(new THREE.BoxGeometry(0.16, 0.1, 0.24), bootMat, legR, 0, -0.32, 0.04);

  // body (denim overalls over cream shirt)
  part(new THREE.CapsuleGeometry(0.26, 0.3, 4, 8), shirtMat, g, 0, 0.86, 0);
  const bib = part(new THREE.BoxGeometry(0.3, 0.26, 0.05), denimMat, g, 0, 0.98, 0.24);
  bib.rotation.x = -0.08;
  for (const sx of [-0.13, 0.13]) {
    const strap = part(new THREE.BoxGeometry(0.07, 0.3, 0.04), denimMat, g, sx, 1.16, 0.21);
    strap.rotation.x = -0.25;
  }
  part(new THREE.IcosahedronGeometry(0.05, 0), roseMat, g, 0, 0.95, 0.28);

  // arms
  const armL = limb(g, shirtMat, 0.075, 0.24, -0.33, 1.06);
  const armR = limb(g, shirtMat, 0.075, 0.24, 0.33, 1.06);
  armL.rotation.z = 0.22;
  armR.rotation.z = -0.22;

  // head + straw hat
  const head = part(new THREE.SphereGeometry(0.31, 14, 12), skinMat, g, 0, 1.5, 0);
  addFace(head, 0xe8a184);
  const brim = part(new THREE.CylinderGeometry(0.5, 0.55, 0.06, 12), strawMat, head, 0, 0.22, 0);
  part(new THREE.ConeGeometry(0.34, 0.26, 12), strawMat, head, 0, 0.37, 0);
  part(new THREE.CylinderGeometry(0.35, 0.36, 0.07, 12), new THREE.MeshLambertMaterial({ color: 0xd15e84 }), head, 0, 0.26, 0);

  // little backpack
  part(new THREE.BoxGeometry(0.34, 0.4, 0.18), strawMat, g, 0, 0.92, -0.32);

  return { group: g, legL, legR, armL, armR, head };
}

function buildBride() {
  const g = new THREE.Group();

  // skirt (no legs — feet peek shyly under the hem)
  const skirt = part(new THREE.ConeGeometry(0.44, 0.62, 10), dressMat, g, 0, 0.36, 0);
  part(new THREE.SphereGeometry(0.07, 6, 6), bootMat, g, -0.1, 0.06, 0.12);
  part(new THREE.SphereGeometry(0.07, 6, 6), bootMat, g, 0.1, 0.06, 0.12);

  // body
  part(new THREE.CapsuleGeometry(0.22, 0.24, 4, 8), dressMat, g, 0, 0.92, 0);
  const sash = part(new THREE.CylinderGeometry(0.235, 0.235, 0.07, 10), roseMat, g, 0, 0.98, 0);

  // arms
  const armL = limb(g, skinMat, 0.065, 0.22, -0.28, 1.06);
  const armR = limb(g, skinMat, 0.065, 0.22, 0.28, 1.06);
  armL.rotation.z = 0.26;
  armR.rotation.z = -0.26;

  // tiny bouquet held in front
  part(new THREE.IcosahedronGeometry(0.09, 0), roseMat, g, 0, 0.92, 0.34);
  part(new THREE.IcosahedronGeometry(0.07, 0), new THREE.MeshLambertMaterial({ color: 0xfffaf0, flatShading: true }), g, 0.1, 0.99, 0.32);
  part(new THREE.IcosahedronGeometry(0.06, 0), new THREE.MeshLambertMaterial({ color: 0xf5c84c, flatShading: true }), g, -0.09, 1.0, 0.32);

  // head, hair bun, flower, veil
  const head = part(new THREE.SphereGeometry(0.3, 14, 12), skinMat, g, 0, 1.48, 0);
  addFace(head, 0xf0a8b8);
  const hairCap = part(new THREE.SphereGeometry(0.315, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat, head, 0, 0.03, -0.02);
  part(new THREE.SphereGeometry(0.12, 8, 8), hairMat, head, 0, 0.26, -0.22); // bun
  part(new THREE.IcosahedronGeometry(0.07, 0), roseMat, head, 0.1, 0.3, -0.16); // flower on bun
  const veil = part(new THREE.PlaneGeometry(0.5, 0.62), new THREE.MeshLambertMaterial({ color: 0xfffaf0, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }), head, 0, -0.05, -0.3);
  veil.rotation.x = 0.28;

  return { group: g, armL, armR, skirt, head, veil };
}

function heartTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const g = cv.getContext("2d");
  g.fillStyle = "#e97fa2";
  g.beginPath();
  g.moveTo(32, 54);
  g.bezierCurveTo(6, 36, 8, 14, 32, 22);
  g.bezierCurveTo(56, 14, 58, 36, 32, 54);
  g.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ============================================================
   The controllable groom + follow camera
   ============================================================ */
export class Player {
  constructor(scene, colliders) {
    this.colliders = colliders;
    const built = buildGroom();
    this.group = built.group;
    this.legL = built.legL;
    this.legR = built.legR;
    this.armL = built.armL;
    this.armR = built.armR;
    this.group.position.set(0, 0, 22.5);
    this.heading = Math.PI; // face north, toward the village
    this.walkCycle = 0;
    this.moving = false;
    this.target = null; // walk-to target {x, z}
    this.follower = null; // the bride, attached by main.js
    this.lastMoveEnd = performance.now();
    scene.add(this.group);

    // camera rig
    this.camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 160);
    this.camPos = new THREE.Vector3(0, 8, 32);
    this.camLook = new THREE.Vector3(0, 1.4, 22.5);
    this.camera.position.copy(this.camPos);
  }

  get position() {
    return this.group.position;
  }

  setTarget(x, z) {
    this.target = { x, z };
  }

  update(dt, input, reducedMotion) {
    const pos = this.group.position;

    // --- decide desired direction ---
    let dx = input.x;
    let dz = input.z;
    if (dx !== 0 || dz !== 0) {
      this.target = null; // manual input cancels walk-to
    } else if (this.target) {
      dx = this.target.x - pos.x;
      dz = this.target.z - pos.z;
      if (Math.hypot(dx, dz) < 0.18) {
        this.target = null;
        dx = dz = 0;
      }
    }

    const len = Math.hypot(dx, dz);
    const wasMoving = this.moving;
    this.moving = len > 0.01;
    if (this.moving) {
      dx /= len;
      dz /= len;
      pos.x += dx * SPEED * dt;
      pos.z += dz * SPEED * dt;

      const targetHeading = Math.atan2(dx, dz);
      let diff = targetHeading - this.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.heading += diff * Math.min(1, dt * 12);
    }
    if (wasMoving && !this.moving) {
      this.lastMoveEnd = performance.now();
    }

    // --- collisions: push out of circles, clamp to world ---
    for (const c of this.colliders) {
      const ox = pos.x - c.x;
      const oz = pos.z - c.z;
      const min = c.r + PLAYER_R;
      const d = Math.hypot(ox, oz);
      if (d < min && d > 0.0001) {
        pos.x = c.x + (ox / d) * min;
        pos.z = c.z + (oz / d) * min;
      }
    }
    pos.x = THREE.MathUtils.clamp(pos.x, -BOUND, BOUND);
    pos.z = THREE.MathUtils.clamp(pos.z, -BOUND, BOUND);

    // --- walk animation ---
    if (this.moving && !reducedMotion) {
      this.walkCycle += dt * 10.5;
      const swing = Math.sin(this.walkCycle) * 0.55;
      this.legL.rotation.x = swing;
      this.legR.rotation.x = -swing;
      this.armL.rotation.x = -swing * 0.7;
      this.armR.rotation.x = swing * 0.7;
      this.group.position.y = Math.abs(Math.sin(this.walkCycle)) * 0.06;
    } else {
      for (const l of [this.legL, this.legR, this.armL, this.armR]) {
        l.rotation.x *= 1 - Math.min(1, dt * 10);
      }
      this.group.position.y = reducedMotion ? 0 : Math.sin(performance.now() * 0.002) * 0.015;
    }
    this.group.rotation.y = this.heading;

    // --- follow camera (behind & above, gently lagging) ---
    const desired = new THREE.Vector3(pos.x, pos.y + 7.6, pos.z + 10.2);
    const k = 1 - Math.exp(-4.2 * dt);
    this.camPos.lerp(desired, k);
    this.camLook.lerp(new THREE.Vector3(pos.x, pos.y + 1.5, pos.z - 0.5), k);
    if (!reducedMotion) {
      this.camPos.y += Math.sin(performance.now() * 0.0011) * 0.05;
    }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  /* stroll to a spot (hotbar); the camera just follows the walk */
  strollTo(x, z) {
    this.setTarget(x, z);
  }

  /* teleport near a spot (used by tests); keeps the bride in step */
  warpTo(x, z) {
    this.group.position.set(x, 0, z);
    this.target = null;
    this.camPos.set(x, 7.6, z + 10.2);
    this.camLook.set(x, 1.5, z - 0.5);
    if (this.follower) this.follower.reset(x, z);
  }
}

/* ============================================================
   The bride — follows the groom's breadcrumb trail
   ============================================================ */
export class Bride {
  constructor(scene, groom) {
    this.groom = groom;
    groom.follower = this;
    const built = buildBride();
    this.group = built.group;
    this.armL = built.armL;
    this.armR = built.armR;
    this.skirt = built.skirt;
    this.veil = built.veil;
    this.heading = Math.PI;
    this.walkCycle = 0;
    this.trail = []; // recent groom positions, newest first
    this.trailLen = 0;
    this.hearts = null;
    this.idleSince = performance.now();
    this.lastHeart = 0;
    this.reset(groom.position.x, groom.position.z);
    scene.add(this.group);
    this.heartTex = heartTexture();
  }

  reset(x, z) {
    this.group.position.set(x, 0, z + FOLLOW_DIST);
    this.trail = [];
    this.trailLen = 0;
    this.heading = Math.PI;
  }

  update(dt, reducedMotion) {
    const gp = this.groom.position;
    const pos = this.group.position;

    // breadcrumb: record groom's path
    if (this.trail.length === 0 || Math.hypot(gp.x - this.trail[0].x, gp.z - this.trail[0].z) > 0.12) {
      this.trail.unshift({ x: gp.x, z: gp.z });
    }
    // compute the point FOLLOW_DIST behind along the trail
    let target = {
      x: gp.x - Math.sin(this.groom.heading) * FOLLOW_DIST,
      z: gp.z - Math.cos(this.groom.heading) * FOLLOW_DIST,
    };
    let acc = 0;
    for (let i = 0; i < this.trail.length - 1; i++) {
      const a = this.trail[i];
      const b = this.trail[i + 1];
      const seg = Math.hypot(a.x - b.x, a.z - b.z);
      if (acc + seg >= FOLLOW_DIST) {
        const t = (FOLLOW_DIST - acc) / seg;
        target = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
        break;
      }
      acc += seg;
    }
    if (this.trail.length > 400) this.trail.length = 400;

    // stroll toward the trailing point
    let dx = target.x - pos.x;
    let dz = target.z - pos.z;
    const dist = Math.hypot(dx, dz);
    const catchUp = dist > 3.2 ? 1.35 : 1; // hurry if she falls behind
    let speed = 0;
    if (dist > 0.12) {
      speed = Math.min(SPEED * catchUp, dist * 3.2);
      dx /= dist;
      dz /= dist;
      pos.x += dx * speed * dt;
      pos.z += dz * speed * dt;

      const targetHeading = Math.atan2(dx, dz);
      let diff = targetHeading - this.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.heading += diff * Math.min(1, dt * 10);
    } else if (!this.groom.moving) {
      // idle together: face the same way as the groom
      let diff = this.groom.heading - this.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.heading += diff * Math.min(1, dt * 4);
    }

    // animation
    const moving = speed > 0.15;
    if (moving && !reducedMotion) {
      this.walkCycle += dt * 10.5;
      const swing = Math.sin(this.walkCycle) * 0.5;
      this.armL.rotation.x = -swing * 0.6;
      this.armR.rotation.x = swing * 0.6;
      this.skirt.rotation.z = Math.sin(this.walkCycle) * 0.06;
      this.skirt.scale.y = 1 + Math.abs(Math.sin(this.walkCycle)) * 0.04;
      this.group.position.y = Math.abs(Math.sin(this.walkCycle)) * 0.05;
      this.idleSince = performance.now();
    } else {
      for (const l of [this.armL, this.armR]) {
        l.rotation.x *= 1 - Math.min(1, dt * 10);
      }
      this.skirt.rotation.z *= 1 - Math.min(1, dt * 6);
      this.skirt.scale.y = 1;
      this.group.position.y = reducedMotion ? 0 : Math.sin(performance.now() * 0.0021 + 1.7) * 0.014;
    }
    this.group.rotation.y = this.heading;
    this.veil.rotation.x = 0.28 + (moving ? Math.sin(this.walkCycle * 2) * 0.05 : Math.sin(performance.now() * 0.0015) * 0.03);

    // hearts when the couple stands still together
    const idleFor = performance.now() - Math.max(this.idleSince, this.groom.lastMoveEnd || 0);
    if (!reducedMotion && idleFor > 2200 && performance.now() - this.lastHeart > 2600) {
      this.lastHeart = performance.now();
      this.spawnHeart();
    }
    this.updateHearts(dt);
  }

  spawnHeart() {
    if (!this.hearts) {
      this.hearts = [];
    }
    if (this.hearts.length > 4) return;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.heartTex, transparent: true, depthWrite: false })
    );
    const mid = this.groom.position.clone().lerp(this.group.position, 0.5);
    sprite.position.set(mid.x + (Math.random() - 0.5) * 0.6, 1.7, mid.z + (Math.random() - 0.5) * 0.6);
    sprite.scale.setScalar(0.34);
    sprite.userData.age = 0;
    this.hearts.push(sprite);
    this.group.parent.add(sprite);
  }

  updateHearts(dt) {
    if (!this.hearts) return;
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      h.userData.age += dt;
      const t = h.userData.age;
      h.position.y += dt * 0.55;
      h.material.opacity = Math.max(0, 1 - t / 1.4);
      if (t > 1.4) {
        h.parent.remove(h);
        h.material.dispose();
        this.hearts.splice(i, 1);
      }
    }
  }
}
