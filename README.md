# 🌸 Petalbrook — a walkable Harvest Moon–style wedding invitation

Your wedding invitation is a tiny 3D village. Guests walk a straw-hat groom
(his bride follows his footsteps) around Petalbrook, chat with the chapel,
mailbox, wishing tree and more — every place holds one piece of the invitation.

Built with plain **Three.js** — no build step, no assets to download
(everything is procedural), works on desktop and phones.

## Run it

Any static file server works, because ES modules need `http://`:

```bash
cd 3d
npx serve .          # or: python -m http.server 8000
```

Then open the printed URL (e.g. `http://localhost:8000`).

## Controls

| Action | Desktop | Phone |
| --- | --- | --- |
| Walk | WASD / arrows, or click the ground | left joystick, or tap the ground |
| Read / interact | Space, E, or Enter (also the on-screen hint) | round **A** button |
| Visit any place | click its slot in the hotbar — the couple strolls there and opens it (✓ = already read) | same |
| Music | note button, top right — the waltz plays softly from the gate; the button mutes it (choice is remembered) | same |
| Help | **?** button, top right | same |

Places you've visited are pinned to the hotbar. RSVPs, wishes and visited
places persist in the guest's browser (`localStorage`).

## Make it yours — edit `js/data.js` only

| What | Where |
| --- | --- |
| Names | `COUPLE.bride` / `COUPLE.groom` |
| Wedding date (drives the countdown) | `COUPLE.weddingDate` |
| Venue, time, dress code, Maps link | `VENUE` |
| Every dialogue line | `SPOTS[].dialog` |
| Our-story timeline | `STORY` |
| Gallery captions (procedural polaroids) | `GALLERY` |
| Starter wishes on the tree | `WISHES_SEED` |
| Where RSVPs are sent | `RSVP_ENDPOINT` (empty = local only; set a URL that accepts JSON POST, e.g. Google Apps Script / Formspree) |

Real photos in the gallery (optional): drop files in `3d/img/` and give each
`GALLERY.photos[i]` a `src: "img/yourphoto.jpg"` — the modal prefers `src`
over the drawn keepsake.

## Files

```
3d/
├── index.html      page shell, importmap (Three.js from CDN)
├── css/style.css   all Harvest Moon UI (wooden frames, dialogue, HUD)
└── js/
    ├── data.js     ✏️ the file you edit
    ├── main.js     boot, input, game loop
    ├── world.js    procedural village (ground, buildings, petals…)
    ├── player.js   the couple + follow camera
    ├── ui.js       dialogue typewriter, HUD, hotbar, modals
    └── audio.js    synthesized music-box tune + SFX
```

## Notes

- BGM is `audio/bgm.mp3` ("Waltz of the Morning Harvest"). To use your own
  track, replace that file keeping the same name — if it's missing, the game
  falls back to a tiny procedural music-box tune.
- First visit opens a short "How to Play" card; guests can reopen it anytime
  from the ? button.
- `?touch=1` forces the mobile controls (handy for previewing on desktop).
- Reduced-motion preference is respected: petals calm down and camera sway stops.
- The Three.js module loads from jsDelivr, so guests need internet the first
  visit; after that the browser cache usually covers it.
