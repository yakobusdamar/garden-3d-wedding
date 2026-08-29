# Petalbrook — Roadmap / Backlog

Product direction: turn the single invitation into a **multi-client template**.
One engine, many weddings. Each item below is a "layer" that clients can vary
without touching the engine.

## 1. Character look system (`js/skins.js`) — planned

One parametric `buildCharacter(look)` replaces the current hardcoded
`buildGroom()` / `buildBride()` in `js/player.js`. Client config = one line in
`js/data.js`:

```js
look: { groom: "tuxedo", bride: "hijab" }
```

- `outfit`: `"overalls"` | `"tuxedo"` | `"dress"` | `"gamis"` | `"suit"`
- `headwear`: `"straw-hat"` | `"hijab"` | `"bun-flower"` | `"peci"` | `"topi"` | `"none"`
- palette (skin tone, fabric colors) + accessory toggles (bouquet, veil, backpack, glasses)
- Anatomy is shared (head / body / arms / skirt-or-legs); looks only change the
  outer layers, so new looks are data entries, not new models.
- First two example looks to prove the system: **hijab + gamis** (bride) and
  **tuxedo** (groom).

## 2. Venue / building system — planned

The chapel is currently one hardcoded building in `js/world.js`. Generalize to
venue packs; `data.js` picks one:

| venue | building idea | notes |
| --- | --- | --- |
| `church` | current chapel (steeple, arch) | protestant/catholic copy variants |
| `mosque` | dome + minaret + crescent, courtyard | palette shifts green/gold; hijab default look |
| `home` | farmhouse becomes the venue (ngunduh mantu style) | intimate copy, yard reception |
| `hall` | general party pavilion / garden tent | religion-neutral default |

Each venue swaps: the main building mesh, its collider + interaction spot,
marker position, and possibly ground-texture accents.

## 3. Religious & cultural copy layer — planned

Dialogue, schedule, and greetings must match the couple's tradition. Couple the
copy with the venue pack (venue + tone travel together):

- `christian`: "Holy matrimony", church schedule, blessing phrasing
- `catholic`: "Matrimonium"/misa, different order of events
- `islam`: "Akad nikah" + "Resepsi", salam greeting, mahar/kado notes,
  hijab-friendly dress code (e.g. mosque venue)
- `secular`: neutral "Ceremony & party" wording

Rules of thumb: greetings and blessings live in `data.js` next to the schedule;
never mix traditions in one pack; dress-code copy should always mention what is
respectful for the venue (e.g. headscarf available/required at a mosque).

## 4. Near-term UX fixes / quick wins — noted 2026-08-29

- [ ] **Prevent double-tap zoom on touch devices.** With the viewport meta alone
  iOS can still zoom the page UI on double-tap. Add `touch-action: manipulation`
  to `body`, `.btn`, `.hot-slot`, `#dialogue`, and modal elements (canvas already
  has `touch-action: none`). Optionally `preventDefault` on `gesturestart` for iOS.
- [ ] **Slightly bigger farmhouse hitbox.** Collider is `r: 3.2` in `world.js`
  (`addCollider(12, -8, 3.2)`); bump to ~3.5. Constraint to keep: each spot's
  `stop` (halt distance) must stay between `collider.r + 0.45` and `spot.r`,
  so bump farmhouse `stop` to ~4.0 and `r` to ~4.1 in `data.js`.
- [ ] **Auto-open dialogue on touching a landmark.** When the couple enters a
  spot's radius, open its dialog automatically (no key press). Edge cases:
  don't re-trigger right after "Maybe later" — only re-arm after the player
  exits the radius again; never open while a modal/other dialog is active.
- [ ] **Permanent floating landmark labels.** Every landmark gets a small
  floating name sign (canvas-texture sprite or projected HTML label) visible
  from afar, fading by distance; the "!" bubble stays as the interaction cue.

## 5. Smaller portfolio/polish items — optional

- README banner/GIF of gameplay
- "Made with Three.js" credit in the help modal
- Demo reset button (clears guest's local RSVP/wishes)
- Music variants per pack (music-box organ vs gamelan-ish vs neutral)
