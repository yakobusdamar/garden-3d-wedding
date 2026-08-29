/* ============================================================
   data.js — EDIT THIS FILE to make the invitation yours.
   Names, date, venue, every line of dialogue: all here.
   ============================================================ */

export const COUPLE = {
  bride: "Nana",
  groom: "Raka",
  hashtag: "#NanaRakaPetalbrook",
  // The real wedding date — drives the countdown everywhere.
  weddingDate: "2026-11-21T09:00:00+07:00",
};

export const VENUE = {
  name: "Sawargi Garden Hall",
  address: "Jl. Bunga Matahari No. 12, Dago, Bandung",
  time: "9:00 AM — 1:00 PM WIB",
  dressCode: "Pastel & garden casual — comfy shoes for the grass",
  mapsUrl: "https://maps.google.com/?q=Sawargi+Garden+Hall+Bandung",
};

/* The world: every spot is a place you can walk to.
   x / z are world coordinates, r is the interaction radius,
   stop is how close the couple halts (just outside the building),
   menu is the short function-first name shown on the hotbar and
   floating landmark labels. */
export const SPOTS = [
  {
    id: "sign",
    label: "Welcome Sign",
    menu: "Welcome",
    pos: [0, 17.5],
    r: 2.6,
    stop: 1.0,
    dialog: [
      {
        who: "sign",
        text: "Welcome to Petalbrook, dear guest! This whole village is your invitation — walk around and the places will tell you everything.",
      },
      {
        who: "sign",
        text: "The chapel holds the details, the memory garden holds our story, the mailbox wants your RSVP... and the wishing tree is all yours.",
      },
    ],
  },
  {
    id: "chapel",
    label: "The Chapel",
    menu: "The Day",
    pos: [-9, -7.5],
    r: 4.3,
    stop: 4.1,
    dialog: [
      {
        who: "chapel",
        text: "Here it is — where it all happens! The bells ring at 9 in the morning, Saturday, November 21st. Come early: the garden is prettiest before noon.",
      },
      {
        who: "chapel",
        text: "Wear something pastel and comfortable. The aisle is real grass, so heels might sink — straw hats encouraged.",
      },
    ],
    action: { label: "See full details", modal: "info" },
  },
  {
    id: "house",
    label: "Memory Garden",
    menu: "Our Story",
    pos: [9, -6],
    r: 3.8,
    stop: 3.7,
    dialog: [
      {
        who: "nana",
        text: "Welcome to our memory garden! Six years of story bloom in here — from a borrowed umbrella at campus, to this very day.",
      },
      {
        who: "raka",
        text: "Every photo on that tree is a day we kept. Walk the petals slowly — then open the timeline below.",
      },
    ],
    action: { label: "Read our story", modal: "story" },
  },
  {
    id: "mailbox",
    label: "Mailbox",
    menu: "RSVP",
    pos: [2.8, 14.5],
    r: 2.4,
    stop: 1.0,
    dialog: [
      {
        who: "mailbox",
        text: "A letter is waiting inside! Write your name and whether you can make it — the postmouse delivers by morning.",
      },
    ],
    action: { label: "Open RSVP letter", modal: "rsvp" },
  },
  {
    id: "gallery",
    label: "Photo Bench",
    menu: "Album",
    pos: [10.5, 8.5],
    r: 2.6,
    stop: 1.7,
    dialog: [
      {
        who: "gallery",
        text: "Our photo bench! We pinned our favorite frames here — the first trip, the bad haircuts, the one proper photo where we both look at the camera.",
      },
    ],
    action: { label: "Open the album", modal: "gallery" },
  },
  {
    id: "wish",
    label: "Wishing Tree",
    menu: "Wishes",
    pos: [-12, 7],
    r: 3.0,
    stop: 2.0,
    dialog: [
      {
        who: "wish",
        text: "The wishing tree! Hang a note for the newlyweds — blessings, song requests, or farming tips. They read every single one.",
      },
    ],
    action: { label: "Hang your wish", modal: "wish" },
  },
  {
    id: "clock",
    label: "Clock Tower",
    menu: "Countdown",
    pos: [0, -11.5],
    r: 3.2,
    stop: 2.7,
    dialog: [
      {
        who: "clock",
        text: "The old tower keeps count so you don't have to. It has been counting down to the big day since spring!",
      },
    ],
    action: { label: "See the countdown", modal: "count" },
  },
];

/* Our Story — shown at the memory garden. */
export const STORY = {
  lead: "Six years, one umbrella, and a garden.",
  items: [
    {
      when: "March 2019 · Campus",
      what: "A borrowed umbrella",
      note: "It rained. Nana had no umbrella. Raka had one and no courage. The umbrella did the talking.",
    },
    {
      when: "December 2021 · Bandung",
      what: "First farm together",
      note: "We picked strawberries terribly and laughed harder. Somewhere between the rows, it clicked.",
    },
    {
      when: "June 2024 · Puncak",
      what: "The question",
      note: "Raka hid the ring inside a lunchbox of nastar. Nana found the ring before the cookies. Correct priority.",
    },
    {
      when: "November 21, 2026 · Petalbrook",
      what: "The big day",
      note: "And now you're invited to the harvest of it all. Come celebrate with us under the open sky.",
    },
  ],
};

/* Gallery — captions for procedurally drawn polaroid keepsakes.
   To use real photos instead: put files in 3d/img/ and add
   src: "img/yourphoto.jpg" to any entry below. */
export const GALLERY = {
  lead: "A few frames from the years.",
  photos: [
    { caption: "spring, first trip", tint: "#ffd9a8", motif: "mtn" },
    { caption: "the good coffee", tint: "#c9e7c0", motif: "cup" },
    { caption: "rainy tuesdays", tint: "#bcd9f5", motif: "rain" },
    { caption: "strawberry war", tint: "#f9c6cf", motif: "berry" },
    { caption: "she said yes", tint: "#f5e3ae", motif: "ring" },
    { caption: "soon: our garden", tint: "#d8c9f0", motif: "heart" },
  ],
};

/* Seeds the wishing tree so it never looks empty. Guests' wishes
   are saved on top of these in the browser. */
export const WISHES_SEED = [
  { who: "Bu Ratna", text: "May your kitchen always smell like sambal and Sundays." },
  { who: "Dimas", text: "Request for the band: anything by Sheila On 7. Please." },
  { who: "The Cat", text: "Meow. (Feed me at the reception.)" },
];

/* RSVP is saved in the guest's browser (localStorage) and, if you
   set ENDPOINT, also POSTed as JSON to that URL (e.g. a Google
   Apps Script or Formspree endpoint). Empty string = local only. */
export const RSVP_ENDPOINT = "";
