/* ============================================================
   ui.js — Harvest Moon interface layer:
   dialogue box with typewriter text, HUD, hotbar, modals.
   ============================================================ */

import { COUPLE, VENUE, STORY, GALLERY, WISHES_SEED, SPOTS, RSVP_ENDPOINT } from "./data.js";
import { sfxPop, sfxTook, sfxPing, sfxDing, sfxTypeBlip } from "./audio.js";

const $ = (sel) => document.querySelector(sel);

/* each speaker "speaks" the typewriter at their own pitch */
const VOICES = { nana: 980, raka: 660, sign: 830, chapel: 760, mailbox: 860, gallery: 800, wish: 900, clock: 720 };

/* ============================================================
   ICONS — chunky stroke SVGs, one per spot
   ============================================================ */
const S = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
export const ICONS = {
  sign: `<svg viewBox="0 0 24 24" ${S}><path d="M12 21V9"/><path d="M6 9h12l-1.5-4h-9z" fill="currentColor" opacity=".25"/><path d="M6 9h12l-1.5-4h-9z"/><path d="M8 17c1.5-1 3-1 4 0 1-1 2.5-1 4 0" opacity=".6"/></svg>`,
  chapel: `<svg viewBox="0 0 24 24" ${S}><path d="M12 2v4M10 4h4"/><path d="M12 6 6 11v9h12v-9z"/><path d="M10 20v-4a2 2 0 0 1 4 0v4"/></svg>`,
  house: `<svg viewBox="0 0 24 24" ${S}><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>`,
  mailbox: `<svg viewBox="0 0 24 24" ${S}><path d="M6 11V9a4 4 0 0 1 8 0v2z" fill="currentColor" opacity=".2"/><rect x="3" y="7" width="14" height="8" rx="4"/><path d="M11 7a4 4 0 0 1 4 4v4"/><path d="M17 11v10"/><path d="M17 7h4v3h-4" fill="currentColor" opacity=".6"/></svg>`,
  gallery: `<svg viewBox="0 0 24 24" ${S}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m3 17 5-4 4 3 4-4 5 5"/></svg>`,
  wish: `<svg viewBox="0 0 24 24" ${S}><circle cx="12" cy="9" r="6" fill="currentColor" opacity=".2"/><circle cx="12" cy="9" r="6"/><path d="M12 15v7"/><path d="M12 19c-1.5 0-3-.8-3.6-2M12 17.5c1.4 0 2.7-.7 3.3-1.8"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" ${S}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" ${S}><path d="M12 20.5C7 16.5 3.5 13.5 3.5 9.7 3.5 7 5.6 5 8.2 5c1.6 0 3 .8 3.8 2 .8-1.2 2.2-2 3.8-2 2.6 0 4.7 2 4.7 4.7 0 3.8-3.5 6.8-8.5 10.8z"/></svg>`,
};

/* ============================================================
   PORTRAITS — little faces for the dialogue box
   ============================================================ */
function faceSVG(bg, inner) {
  return `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><circle cx="48" cy="48" r="48" fill="${bg}"/>${inner}</svg>`;
}
const PORTRAITS = {
  nana: faceSVG("#f9d9e2", `
    <circle cx="48" cy="52" r="24" fill="#f2c9a0"/>
    <path d="M26 50c0-16 10-26 22-26s22 10 22 26c-4-8-10-12-22-12s-18 4-22 12z" fill="#5b3a1f"/>
    <circle cx="48" cy="24" r="8" fill="#5b3a1f"/>
    <circle cx="54" cy="20" r="6" fill="#e97fa2"/>
    <circle cx="54" cy="20" r="2.4" fill="#fff0a8"/>
    <circle cx="40" cy="52" r="2.8" fill="#3a2a1c"/>
    <circle cx="56" cy="52" r="2.8" fill="#3a2a1c"/>
    <ellipse cx="34" cy="59" rx="4" ry="2.6" fill="#f0a8b8"/>
    <ellipse cx="62" cy="59" rx="4" ry="2.6" fill="#f0a8b8"/>
    <path d="M43 62q5 4 10 0" stroke="#3a2a1c" stroke-width="2" fill="none" stroke-linecap="round"/>`),
  raka: faceSVG("#d7e8f7", `
    <circle cx="48" cy="52" r="24" fill="#e8b88a"/>
    <ellipse cx="48" cy="38" rx="34" ry="9" fill="#e6c975"/>
    <path d="M20 38a28 14 0 0 1 56 0z" fill="#e6c975"/>
    <path d="M30 30a24 12 0 0 1 36 0z" fill="#d9a75a"/>
    <circle cx="40" cy="52" r="2.8" fill="#3a2a1c"/>
    <circle cx="56" cy="52" r="2.8" fill="#3a2a1c"/>
    <ellipse cx="34" cy="59" rx="4" ry="2.6" fill="#e8a184"/>
    <ellipse cx="62" cy="59" rx="4" ry="2.6" fill="#e8a184"/>
    <path d="M42 62q6 5 12 0" stroke="#3a2a1c" stroke-width="2" fill="none" stroke-linecap="round"/>`),
};
const SPEAKER_STYLE = {
  sign: ["#efe6c8", ICONS.sign],
  chapel: ["#fbe3ea", ICONS.chapel],
  mailbox: ["#fbe3ea", ICONS.mailbox],
  gallery: ["#efe6c8", ICONS.gallery],
  wish: ["#e2f2d8", ICONS.wish],
  clock: ["#efe6c8", ICONS.clock],
};
export const SPEAKER_NAMES = {
  nana: COUPLE.bride,
  raka: COUPLE.groom,
  sign: "Welcome Sign",
  chapel: "The Chapel",
  mailbox: "The Mailbox",
  gallery: "Photo Bench",
  wish: "Wishing Tree",
  clock: "Clock Tower",
};

function setPortrait(who) {
  const el = $("#dlg-portrait");
  if (PORTRAITS[who]) {
    el.innerHTML = PORTRAITS[who];
  } else {
    const [bg, icon] = SPEAKER_STYLE[who] || ["#efe6c8", ICONS.heart];
    el.innerHTML = faceSVG(bg, `<g x="24" y="24" width="48" height="48" transform="translate(24 24) scale(2)" color="#5b3a1f">${icon.replace(/<svg[^>]*>|<\/svg>/g, "")}</g>`);
  }
  $("#dlg-name").textContent = SPEAKER_NAMES[who] || "Petalbrook";
}

/* ============================================================
   DIALOGUE ENGINE — typewriter text, advance, choice buttons
   ============================================================ */
const dlg = {
  el: null, textEl: null, nextEl: null, choicesEl: null,
  pages: [], page: -1, action: null, onDone: null,
  typing: false, typeTimer: null, voice: 820, charTick: 0,
};

function initDialogue() {
  dlg.el = $("#dialogue");
  dlg.textEl = $("#dlg-text");
  dlg.nextEl = $("#dlg-next");
  dlg.choicesEl = $("#dlg-choices");

  dlg.el.addEventListener("click", () => advance());
  dlg.nextEl.style.display = "none";
}

export function dialogueActive() {
  return !dlg.el.classList.contains("hidden");
}

export function showDialog(pages, action = null, onDone = null) {
  dlg.pages = pages;
  dlg.page = -1;
  dlg.action = action;
  dlg.onDone = onDone;
  dlg.el.classList.remove("hidden");
  advance();
}

function nextPage() {
  dlg.page++;
  dlg.choicesEl.innerHTML = "";
  dlg.nextEl.style.display = "none";
  if (dlg.page >= dlg.pages.length) {
    if (dlg.action) {
      showChoices();
    } else {
      closeDialog();
    }
    return;
  }
  const page = dlg.pages[dlg.page];
  setPortrait(page.who);
  dlg.voice = VOICES[page.who] || 820;
  typeText(page.text);
}

function typeText(text) {
  dlg.typing = true;
  dlg.charTick = 0;
  clearInterval(dlg.typeTimer);
  const caret = '<span class="caret">▌</span>';
  let i = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  dlg.typeTimer = setInterval(() => {
    i += reduced ? text.length : 1;
    // one soft blip per couple of letters, skipping spaces — the villager voice
    if (!reduced) {
      const ch = text[i - 1];
      if (i % 2 === 0 && ch && ch !== " ") {
        dlg.charTick++;
        if (dlg.charTick % 24 !== 0) sfxTypeBlip(dlg.voice); // tiny breath every ~24 letters
      }
    }
    dlg.textEl.innerHTML = text.slice(0, i) + caret;
    if (i >= text.length) finishTyping(text);
  }, 22);
  dlg.textEl.innerHTML = caret;
}

function finishTyping(text) {
  clearInterval(dlg.typeTimer);
  dlg.typing = false;
  dlg.textEl.textContent = text;
  const last = dlg.page >= dlg.pages.length - 1 && !dlg.action;
  dlg.nextEl.style.display = "flex";
  if (last) dlg.nextEl.textContent = "✔";
}

export function advance() {
  if (dlg.el.classList.contains("hidden")) return false;
  if (dlg.typing) {
    clearInterval(dlg.typeTimer);
    const text = dlg.pages[dlg.page].text;
    dlg.typing = false;
    dlg.textEl.textContent = text;
    const last = dlg.page >= dlg.pages.length - 1 && !dlg.action;
    dlg.nextEl.style.display = "flex";
    if (last) dlg.nextEl.textContent = "✔";
    return true;
  }
  const onLast = dlg.page >= dlg.pages.length - 1;
  if (onLast && dlg.action) {
    if (dlg.choicesEl.childElementCount) closeDialog();
    else showChoices();
    return true;
  }
  nextPage();
  return true;
}

function showChoices() {
  const c = dlg.choicesEl;
  c.innerHTML = "";
  dlg.nextEl.style.display = "none";
  const go = document.createElement("button");
  go.type = "button";
  go.className = "btn btn-rose";
  go.textContent = dlg.action.label;
  go.addEventListener("click", (e) => {
    e.stopPropagation();
    sfxDing();
    const a = dlg.action;
    closeDialog();
    openModal(a.modal);
  });
  const no = document.createElement("button");
  no.type = "button";
  no.className = "btn btn-plain";
  no.textContent = "Maybe later";
  no.addEventListener("click", (e) => {
    e.stopPropagation();
    sfxTook();
    closeDialog();
  });
  c.append(go, no);
  go.focus();
}

function closeDialog() {
  clearInterval(dlg.typeTimer);
  dlg.el.classList.add("hidden");
  dlg.typing = false;
  if (dlg.onDone) {
    const cb = dlg.onDone;
    dlg.onDone = null;
    cb();
  }
}

/* ============================================================
   STORAGE helpers
   ============================================================ */
function loadLS(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function saveLS(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch { /* private mode etc. */ }
}
export const seenSpots = new Set(loadLS("pb_seen", []));
export function markSeen(id) {
  if (!seenSpots.has(id)) {
    seenSpots.add(id);
    saveLS("pb_seen", [...seenSpots]);
    return true;
  }
  return false;
}

/* ============================================================
   HOTBAR
   ============================================================ */
export function buildHotbar(onTravel) {
  const bar = $("#hotbar");
  bar.innerHTML = "";
  for (const spot of SPOTS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "hot-slot";
    b.dataset.id = spot.id;
    b.setAttribute("aria-label", `${spot.menu} — ${spot.label}`);
    b.innerHTML = ICONS[spot.id] + `<span class="slot-name">${spot.menu}</span>`;
    if (seenSpots.has(spot.id)) b.classList.add("seen");
    b.addEventListener("click", () => onTravel(spot));
    bar.appendChild(b);
  }
}
export function lightUpSlot(id) {
  const slot = $(`#hotbar .hot-slot[data-id="${id}"]`);
  if (slot && !slot.classList.contains("seen")) {
    slot.classList.add("seen", "is-new");
    setTimeout(() => slot.classList.remove("is-new"), 3500);
  }
}

/* ============================================================
   HUD / TOAST / HINT
   ============================================================ */
export function updateHUD() {
  const now = new Date();
  const seasons = { winter: [11, 0, 1], spring: [2, 3, 4], summer: [5, 6, 7], autumn: [8, 9, 10] };
  const seasonName = Object.keys(seasons).find((s) => seasons[s].includes(now.getMonth())) || "autumn";
  const seasonCap = seasonName[0].toUpperCase() + seasonName.slice(1);
  const hours = now.getHours();
  const h12 = ((hours + 11) % 12) + 1;
  const ampm = hours >= 12 ? "PM" : "AM";
  const mins = String(now.getMinutes()).padStart(2, "0");

  $(".chip-season").textContent = seasonCap;
  $(".chip-day").textContent = `Day ${now.getDate()}`;
  $(".chip-clock").textContent = `${h12}:${mins} ${ampm}`;

  const wed = new Date(COUPLE.weddingDate);
  const days = Math.ceil((wed - now) / 86400000);
  let count = $(".chip-count");
  if (!count) {
    count = document.createElement("span");
    count.className = "chip-count";
    $("#hud-date").appendChild(count);
  }
  count.textContent =
    days > 1 ? `${days} days to go!`
    : days === 1 ? "Tomorrow — eee!"
    : days === 0 ? "TODAY is the day!"
    : "Just married!";
}

let toastTimer = null;
export function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  sfxPing();
  clearTimeout(toastTimer);
  // restart the CSS animation
  t.style.animation = "none";
  void t.offsetWidth;
  t.style.animation = "";
  toastTimer = setTimeout(() => t.classList.add("hidden"), 2900);
}

/* legacy center-screen hint pill — element removed; kept as a no-op for old callers */
export function setHint() {}

/* mobile action button: idle icon → "Read" pill near a landmark → "Next" in dialog */
let lastActKey = "";
export function updateActionButton(mode) {
  const key = `${mode}:${dialogueActive()}`;
  if (key === lastActKey) return;
  lastActKey = key;
  const btn = $("#btn-act");
  btn.classList.toggle("near", mode !== "idle");
  btn.classList.toggle("pulse", mode === "read");
  $("#act-label").textContent = mode === "next" ? "Next" : "Read";
}

export function isTouch() {
  const forced = new URLSearchParams(location.search).get("touch");
  if (forced !== null) return forced !== "0";
  return matchMedia("(pointer: coarse)").matches;
}

export function showHUD(show) {
  $("#hud").classList.toggle("hidden", !show);
  $("#hud").setAttribute("aria-hidden", String(!show));
  if (show) $("#touch-ui").classList.toggle("hidden", !isTouch());
  else $("#touch-ui").classList.add("hidden");
}

/* ============================================================
   POLAROID painter for the gallery modal
   ============================================================ */
function drawPolaroid(cv, photo) {
  const g = cv.getContext("2d");
  cv.width = 256; cv.height = 256;
  g.fillStyle = photo.tint;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(255,255,255,0.8)";
  g.beginPath(); g.arc(200, 52, 26, 0, 7); g.fill();
  g.fillStyle = "rgba(111,174,89,0.85)";
  g.beginPath(); g.ellipse(70, 226, 100, 52, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(206, 234, 90, 44, 0, 0, 7); g.fill();
  g.strokeStyle = "#4a3222";
  g.fillStyle = "#4a3222";
  const M = photo.motif;
  if (M === "mtn") {
    g.fillStyle = "#8a6a4a";
    g.beginPath(); g.moveTo(50, 190); g.lineTo(120, 90); g.lineTo(190, 190); g.fill();
    g.fillStyle = "#fffaf0";
    g.beginPath(); g.moveTo(103, 114); g.lineTo(120, 90); g.lineTo(137, 114); g.fill();
  } else if (M === "cup") {
    g.fillStyle = "#fffaf0";
    g.fillRect(92, 110, 72, 60);
    g.beginPath(); g.arc(164, 140, 16, -1.4, 1.4); g.stroke();
    g.lineWidth = 5;
    g.beginPath(); g.arc(164, 140, 16, -1.2, 1.2); g.stroke();
    g.fillStyle = "#8a5a34";
    g.beginPath(); g.ellipse(128, 114, 30, 7, 0, 0, 7); g.fill();
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(110, 95); g.quadraticCurveTo(118, 84, 110, 72); g.stroke();
    g.beginPath(); g.moveTo(134, 95); g.quadraticCurveTo(142, 84, 134, 72); g.stroke();
  } else if (M === "rain") {
    g.fillStyle = "#fffaf0";
    g.beginPath(); g.ellipse(128, 90, 44, 24, 0, 0, 7); g.fill();
    g.lineWidth = 5; g.lineCap = "round";
    for (const [x, y] of [[96, 130], [128, 145], [160, 130], [112, 165], [144, 170]]) {
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 18); g.stroke();
    }
  } else if (M === "berry") {
    g.fillStyle = "#d15e84";
    g.beginPath(); g.arc(108, 150, 22, 0, 7); g.fill();
    g.beginPath(); g.arc(148, 150, 22, 0, 7); g.fill();
    g.beginPath(); g.arc(128, 118, 22, 0, 7); g.fill();
    g.fillStyle = "#5c9a4a";
    g.beginPath(); g.ellipse(128, 100, 16, 7, -0.5, 0, 7); g.fill();
    g.fillStyle = "#ffe08a";
    for (const [x, y] of [[118, 145], [138, 145], [128, 130]]) {
      g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill();
    }
  } else if (M === "ring") {
    g.lineWidth = 9;
    g.strokeStyle = "#d9a322";
    g.beginPath(); g.arc(108, 140, 26, 0, 7); g.stroke();
    g.strokeStyle = "#e97fa2";
    g.beginPath(); g.arc(148, 140, 26, 0, 7); g.stroke();
    g.fillStyle = "#fff0a8";
    g.beginPath(); g.moveTo(148, 106); g.lineTo(156, 92); g.lineTo(164, 106); g.fill();
  } else if (M === "heart") {
    g.fillStyle = "#e97fa2";
    g.beginPath();
    g.moveTo(128, 180);
    g.bezierCurveTo(70, 140, 80, 90, 128, 118);
    g.bezierCurveTo(176, 90, 186, 140, 128, 180);
    g.fill();
  }
  g.fillStyle = "#4a3222";
  g.font = "italic 15px Georgia, serif";
  g.textAlign = "center";
  g.fillText(photo.caption, 128, 232);
}

/* ============================================================
   MODALS
   ============================================================ */
const modal = { panel: null, body: null, open: false, lastFocus: null };

function initModal() {
  modal.panel = $("#modal-panel");
  modal.panel.innerHTML = `
    <div class="modal-paper">
      <div class="modal-head">
        <span class="modal-title" id="modal-title"></span>
        <button type="button" class="modal-close" id="modal-close" aria-label="Close">✕</button>
      </div>
      <div class="modal-body" id="modal-body"></div>
    </div>`;
  modal.body = $("#modal-body");
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal-backdrop").addEventListener("click", closeModal);
}

export function isModalOpen() {
  return modal.open;
}

export function openModal(kind, onClose = null) {
  modal.lastFocus = document.activeElement;
  sfxPop();
  const builders = { info: buildInfo, story: buildStory, rsvp: buildRsvp, gallery: buildGallery, wish: buildWish, count: buildCount, help: buildHelp, onboard: buildOnboard };
  const build = builders[kind];
  if (!build) return;
  const { title, icon, html, mount } = build();
  $("#modal-title").innerHTML = `${ICONS[icon] || ""}<span>${title}</span>`;
  modal.body.innerHTML = html;
  modal.panel.classList.remove("hidden");
  $("#modal-root").classList.remove("hidden");
  modal.open = true;
  modal.onCloseCb = onClose;
  if (mount) mount();
  $("#modal-close").focus();
}

export function closeModal() {
  if (!modal.open) return;
  modal.open = false;
  sfxTook();
  $("#modal-root").classList.add("hidden");
  if (modal.onCloseCb) {
    const cb = modal.onCloseCb;
    modal.onCloseCb = null;
    cb();
  }
  if (modal.lastFocus?.focus) modal.lastFocus.focus();
}

/* ---------- modal: ceremony details ---------- */
function buildInfo() {
  const wed = new Date(COUPLE.weddingDate);
  const dateStr = wed.toLocaleDateString("en-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const html = `
    <p class="lead">Everything you need for the big day.</p>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">When</span>
        <span class="info-value">${dateStr}<span class="info-sub">${VENUE.time}</span></span></div>
      <div class="info-row"><span class="info-label">Where</span>
        <span class="info-value">${VENUE.name}<span class="info-sub">${VENUE.address}</span></span></div>
      <div class="info-row"><span class="info-label">Dress</span>
        <span class="info-value">${VENUE.dressCode}</span></div>
      <div class="info-row"><span class="info-label">Order</span>
        <span class="info-value">9:00 Holy matrimony<span class="info-sub">10:30 garden lunch · 13:00 send-off with petals</span></span></div>
    </div>
    <div class="form-actions">
      <a class="btn btn-gold" href="${VENUE.mapsUrl}" target="_blank" rel="noopener">Open in Maps</a>
      <a class="btn btn-plain" id="ics-link" download="nana-raka-wedding.ics" href="#">Save the date (.ics)</a>
    </div>`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//petalbrook//wedding//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@petalbrook`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    "DTSTART:20261121T090000",
    "DTEND:20261121T130000",
    `SUMMARY:Wedding of ${COUPLE.bride} & ${COUPLE.groom}`,
    `LOCATION:${VENUE.name}, ${VENUE.address}`,
    "DESCRIPTION:Garden wedding — pastel dress code. See you there!",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return {
    title: "Ceremony Details", icon: "chapel", html,
    mount() {
      $("#ics-link").href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
    },
  };
}

/* ---------- modal: our story ---------- */
function buildStory() {
  const html = `
    <p class="lead">${STORY.lead}</p>
    <ul class="timeline">
      ${STORY.items.map((it) => `
        <li>
          <span class="tl-dot"></span>
          <div class="tl-when">${it.when}</div>
          <div class="tl-what">${it.what}</div>
          <div class="tl-note">${it.note}</div>
        </li>`).join("")}
    </ul>`;
  return { title: "Our Story", icon: "house", html };
}

/* ---------- modal: RSVP ---------- */
function buildRsvp() {
  const html = `
    <p class="lead">The postmouse delivers by morning. Leave your reply!</p>
    <form id="rsvp-form" novalidate>
      <div class="form-field">
        <label for="rsvp-name">Your name</label>
        <input type="text" id="rsvp-name" name="name" required maxlength="60" autocomplete="name" placeholder="e.g. Sinta & family" />
      </div>
      <div class="form-field">
        <label id="attend-label">Can you make it?</label>
        <div class="choice-row" role="group" aria-labelledby="attend-label">
          <button type="button" class="choice-pill" data-attend="yes" aria-pressed="true">Joyfully accept</button>
          <button type="button" class="choice-pill" data-attend="no" aria-pressed="false">Regretfully decline</button>
        </div>
      </div>
      <div class="form-field" id="guest-field">
        <label id="guest-label">How many of you?</label>
        <div class="stepper" role="group" aria-labelledby="guest-label">
          <button type="button" id="guest-minus" aria-label="Fewer guests">−</button>
          <output id="guest-count" aria-live="polite">2</output>
          <button type="button" id="guest-plus" aria-label="More guests">+</button>
        </div>
      </div>
      <div class="form-field">
        <label for="rsvp-note">A note for the couple (optional)</label>
        <textarea id="rsvp-note" maxlength="300" placeholder="Allergies, song requests, or just hello…"></textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-gold">Send the letter</button>
        <span class="form-note">Saved right here in your browser${RSVP_ENDPOINT ? " and sent to the couple" : ""}.</span>
      </div>
    </form>`;

  let attending = "yes";
  let guests = 2;
  return {
    title: "RSVP Letter", icon: "mailbox", html,
    mount() {
      const form = $("#rsvp-form");
      form.querySelectorAll(".choice-pill").forEach((pill) => {
        pill.addEventListener("click", () => {
          attending = pill.dataset.attend;
          form.querySelectorAll(".choice-pill").forEach((p) =>
            p.setAttribute("aria-pressed", String(p === pill))
          );
          $("#guest-field").style.display = attending === "yes" ? "" : "none";
        });
      });
      $("#guest-minus").addEventListener("click", () => {
        guests = Math.max(1, guests - 1);
        $("#guest-count").textContent = guests;
      });
      $("#guest-plus").addEventListener("click", () => {
        guests = Math.min(10, guests + 1);
        $("#guest-count").textContent = guests;
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = $("#rsvp-name").value.trim();
        if (!name) {
          $("#rsvp-name").focus();
          $("#rsvp-name").style.borderColor = "var(--rose-deep)";
          return;
        }
        const entry = {
          name,
          attending,
          guests: attending === "yes" ? guests : 0,
          note: $("#rsvp-note").value.trim(),
          at: new Date().toISOString(),
        };
        const all = loadLS("pb_rsvps", []);
        all.push(entry);
        saveLS("pb_rsvps", all);
        if (RSVP_ENDPOINT) {
          fetch(RSVP_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry),
          }).catch(() => { /* offline — the local copy still holds */ });
        }
        modal.body.innerHTML = `
          <div style="text-align:center; padding:1.4rem 0.4rem;">
            <div style="font-size:2.6rem;">💌</div>
            <p class="lead" style="margin-top:0.6rem;">Your letter is in the box!</p>
            <p>${attending === "yes"
              ? `Can't wait to see you${guests > 1 ? ` — all ${guests} of you` : ""}, ${name}.`
              : `We'll miss you, ${name} — thank you for letting us know.`}</p>
            <button type="button" class="btn btn-gold" id="rsvp-done">Back to the village</button>
          </div>`;
        $("#rsvp-done").addEventListener("click", closeModal);
        toast("RSVP delivered ✿");
      });
    },
  };
}

/* ---------- modal: gallery ---------- */
function buildGallery() {
  const html = `
    <p class="lead">${GALLERY.lead}</p>
    <div class="polaroid-grid">
      ${GALLERY.photos.map((p, i) => `
        <figure class="polaroid">
          ${p.src
            ? `<img src="${p.src}" alt="Keepsake photo: ${p.caption}" loading="lazy" />`
            : `<canvas data-photo="${i}" aria-label="Keepsake photo: ${p.caption}" role="img"></canvas>`}
          <figcaption>${p.caption}</figcaption>
        </figure>`).join("")}
    </div>`;
  return {
    title: "Our Album", icon: "gallery", html,
    mount() {
      modal.body.querySelectorAll("canvas[data-photo]").forEach((cv) => {
        drawPolaroid(cv, GALLERY.photos[Number(cv.dataset.photo)]);
      });
    },
  };
}

/* ---------- modal: wishing tree ---------- */
function buildWish() {
  const html = `
    <p class="lead">Hang a note on the tree for ${COUPLE.bride} & ${COUPLE.groom}.</p>
    <form id="wish-form" novalidate>
      <div class="form-field">
        <label for="wish-who">From</label>
        <input type="text" id="wish-who" maxlength="40" placeholder="your name" required />
      </div>
      <div class="form-field">
        <label for="wish-text">Your wish</label>
        <textarea id="wish-text" maxlength="160" placeholder="blessing, song request, farming tip…" required></textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-rose">Hang it on the tree</button>
      </div>
    </form>
    <ul class="wish-list" id="wish-list"></ul>`;
  return {
    title: "Wishing Tree", icon: "wish", html,
    mount() {
      const list = $("#wish-list");
      const render = () => {
        const wishes = [...loadLS("pb_wishes", []), ...WISHES_SEED];
        list.innerHTML = wishes.length
          ? wishes.map((w) => `<li><span>${escapeHTML(w.text)}</span><span class="wish-who">— ${escapeHTML(w.who)}</span></li>`).join("")
          : `<li class="wish-empty">No wishes yet — be the first to hang one.</li>`;
      };
      render();
      $("#wish-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const who = $("#wish-who").value.trim();
        const text = $("#wish-text").value.trim();
        if (!who || !text) return;
        const mine = loadLS("pb_wishes", []);
        mine.unshift({ who, text, at: new Date().toISOString() });
        saveLS("pb_wishes", mine);
        render();
        $("#wish-text").value = "";
        toast("Your wish flutters on the tree ✿");
      });
    },
  };
}

/* ---------- modal: countdown ---------- */
function buildCount() {
  const wed = new Date(COUPLE.weddingDate);
  const days = Math.max(0, Math.ceil((wed - Date.now()) / 86400000));
  const dateStr = wed.toLocaleDateString("en-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const html = `
    <div class="count-banner">
      <div class="count-big">${days} days</div>
      <div class="count-sub">until the bells ring</div>
    </div>
    <p>${dateStr} · ${VENUE.name}. The tower has been winding down since spring — see you when it reaches zero!</p>
    <div class="form-actions">
      <a class="btn btn-gold" href="${VENUE.mapsUrl}" target="_blank" rel="noopener">Open in Maps</a>
    </div>`;
  return { title: "Countdown", icon: "clock", html };
}

/* ---------- modal: help ---------- */
function buildHelp() {
  const html = `
    <p class="lead">How to wander the village.</p>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">${isTouch() ? "Touch" : "Move"}</span>
        <span class="info-value">${isTouch()
          ? "Drag the round joystick, or tap the ground to walk there."
          : "WASD or arrow keys — or click the ground to walk there."}</span></div>
      <div class="info-row"><span class="info-label">${isTouch() ? "Read" : "Interact"}</span>
        <span class="info-value">${isTouch()
          ? "Tap the round A button when something glows."
          : "Space, E, or Enter when you see the speech bubble."}</span></div>
      <div class="info-row"><span class="info-label">Pack</span>
        <span class="info-value">Every place is pinned to the hotbar — click one and the couple strolls there. A ✓ means you've already read it.</span></div>
      <div class="info-row"><span class="info-label">Music</span>
        <span class="info-value">A waltz starts softly when you open the gate — the note button (top right) mutes it, and it remembers your choice. The letter-beeps and clicks stay on; they're part of the charm.</span></div>
    </div>`;
  return { title: "How to Play", icon: "heart", html };
}

/* ---------- modal: first-time onboarding ---------- */
const WALK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h9M13 5l-3-2M13 5l-3 2"/><path d="M4 12h9M13 12l-3-2M13 12l-3 2"/><path d="M4 19h9M13 19l-3-2M13 19l-3 2"/><circle cx="19" cy="12" r="2.6" fill="currentColor" stroke="none"/></svg>`;
const SPEECH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4c-4.4 0-8 3.1-8 7 0 2.2 1.1 4.1 2.9 5.4L6 20l3.7-1.5c.7.2 1.5.3 2.3.3 4.4 0 8-3.1 8-7s-3.6-7.8-8-7.8z"/><path d="M9 10.2h6M9 13h3.6"/></svg>`;
const PIN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-5.5-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.5 12 21 12 21z"/><circle cx="12" cy="10.2" r="2.4"/></svg>`;

function buildOnboard() {
  const touch = isTouch();
  const rows = touch
    ? [
        { icon: WALK_ICON, text: "<b>Walk:</b> drag the round joystick — or just tap the ground where you want to go." },
        { icon: SPEECH_ICON, text: "<b>Read:</b> stand near a landmark and tap the gold <b>Read</b> button. Its story types itself out." },
        { icon: PIN_ICON, text: "<b>Travel:</b> tap any place in the bar below and the couple strolls over. A ✓ means you've read it." },
      ]
    : [
        { icon: WALK_ICON, text: "<b>Walk:</b> WASD or arrow keys — or simply click the ground where you want to go." },
        { icon: SPEECH_ICON, text: "<b>Read:</b> stand near a landmark and press <b>Space</b>. Its story types itself out." },
        { icon: PIN_ICON, text: "<b>Travel:</b> click any place in the bar below and the couple strolls over. A ✓ means you've read it." },
      ];
  const html = `
    <p class="lead">Three things and you're a villager.</p>
    <div class="how-list">
      ${rows.map((r) => `<div class="how-row"><span class="how-ico">${r.icon}</span><p>${r.text}</p></div>`).join("")}
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-gold" id="onboard-go">Let's go!</button>
      <span class="form-note">You can reopen this anytime from the ? button.</span>
    </div>`;
  return {
    title: "How to Play", icon: "sign", html,
    mount() {
      $("#onboard-go").addEventListener("click", () => closeModal());
    },
  };
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ============================================================
   BOOT
   ============================================================ */
export function initUI() {
  initDialogue();
  initModal();
  updateHUD();
  setInterval(updateHUD, 15000);
}

export function setMusicButton(on) {
  $("#btn-music").setAttribute("aria-pressed", String(on));
}
