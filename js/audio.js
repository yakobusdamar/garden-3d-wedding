/* ============================================================
   audio.js — procedural music-box tune + tiny SFX.
   No audio files: everything is synthesized with WebAudio.
   Music is off until the guest turns it on.
   ============================================================ */

let ctx = null;
let masterGain = null;
let musicGain = null;
let musicOn = false;
let schedulerId = null;
let nextNoteTime = 0;
let step = 0;

const TEMPO = 84; // gentle stroll
const STEP_LEN = 60 / TEMPO / 2; // eighth notes

/* F major pentatonic-ish lullaby, two bars, music-box register */
const MELODY = [
  77, 0, 81, 0, 84, 0, 81, 0,  77, 0, 72, 0, 74, 0, 0, 0,
  77, 0, 81, 0, 84, 0, 86, 0,  84, 0, 81, 0, 77, 0, 0, 0,
  74, 0, 77, 0, 81, 0, 84, 0,  81, 0, 77, 0, 74, 0, 0, 0,
  72, 0, 74, 0, 77, 0, 81, 0,  77, 0, 74, 0, 72, 0, 0, 0,
];
const BASS = [41, 0, 0, 0, 48, 0, 0, 0, 43, 0, 0, 0, 50, 0, 0, 0];

const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function initAudio() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.9;
  masterGain.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(masterGain);
}

function tone(freq, time, dur, type, peak, dest) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(peak, time + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(env).connect(dest);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function scheduleStep(stepIndex, when) {
  const m = MELODY[stepIndex % MELODY.length];
  if (m) {
    // music-box voice: sine + a soft octave sparkle
    tone(midiHz(m), when, 1.1, "sine", 0.16, musicGain);
    tone(midiHz(m + 12), when, 0.5, "triangle", 0.05, musicGain);
  }
  const b = BASS[stepIndex % BASS.length];
  if (b && stepIndex % 2 === 0) {
    tone(midiHz(b), when, 1.6, "triangle", 0.09, musicGain);
  }
}

function scheduler() {
  while (nextNoteTime < ctx.currentTime + 0.25) {
    scheduleStep(step, nextNoteTime);
    step = (step + 1) % MELODY.length;
    nextNoteTime += STEP_LEN;
  }
}

export function setMusic(on) {
  musicOn = on;
  if (!ctx) return;
  if (on) {
    if (ctx.state === "suspended") ctx.resume();
    nextNoteTime = ctx.currentTime + 0.1;
    if (!schedulerId) schedulerId = setInterval(scheduler, 90);
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 1.2);
  } else {
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    setTimeout(() => {
      if (!musicOn && schedulerId) {
        clearInterval(schedulerId);
        schedulerId = null;
      }
    }, 700);
  }
}

export function musicEnabled() {
  return musicOn;
}

/* ---------- SFX ---------- */
function sfxContext() {
  if (!ctx || ctx.state === "suspended") return false;
  return true;
}

export function sfxPop() {
  if (!sfxContext()) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(340, t);
  osc.frequency.exponentialRampToValueAtTime(160, t + 0.12);
  env.gain.setValueAtTime(0.16, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  osc.connect(env).connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.16);
}

export function sfxBlip() {
  if (!sfxContext()) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 820 + Math.random() * 140;
  env.gain.setValueAtTime(0.018, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  osc.connect(env).connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.06);
}

/* one letter of typewriter speech — pitch follows the speaker's "voice" */
export function sfxTypeBlip(baseFreq) {
  if (!sfxContext()) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = baseFreq * (0.93 + Math.random() * 0.14);
  env.gain.setValueAtTime(0.02, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.042);
  osc.connect(env).connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.05);
}

/* popup closes — small downward pop */
export function sfxTook() {
  if (!sfxContext()) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(330, t);
  osc.frequency.exponentialRampToValueAtTime(190, t + 0.1);
  env.gain.setValueAtTime(0.08, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.connect(env).connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.14);
}

/* gentle two-note ping for toasts */
export function sfxPing() {
  if (!sfxContext()) return;
  const t = ctx.currentTime;
  tone(987.8, t, 0.22, "sine", 0.06, masterGain);
  tone(1318.5, t + 0.09, 0.3, "sine", 0.05, masterGain);
}

export function sfxDing() {
  if (!sfxContext()) return;
  const t = ctx.currentTime;
  tone(1174.7, t, 0.5, "sine", 0.12, masterGain);
  tone(1568, t + 0.07, 0.6, "sine", 0.09, masterGain);
}

export function sfxWarp() {
  if (!sfxContext()) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(260, t);
  osc.frequency.exponentialRampToValueAtTime(1040, t + 0.28);
  env.gain.setValueAtTime(0.1, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
  osc.connect(env).connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.4);
}
