# Where Next? — Project Guidelines

These rules apply to every prompt in this project. If a prompt conflicts with them, the prompt wins for that change only.

---

## 1. Product

**Where Next?** is a desktop web experience that helps a person pick their next trip. They browse 16 cities as polaroid cards by moving a hand in front of the webcam, select the ones they like, then the picks face each other in pairs until one city is left. That city becomes a boarding pass.

- Metaphor: an airport. Terminal (start) → gallery → departures board → boarding duels → now boarding.
- Portfolio piece. No backend, no accounts, no real APIs, no AI APIs. All logic is deterministic.
- Gestures are the main input. Mouse and keyboard work everywhere as a fallback.

---

## 2. Source of truth

- The attached Figma frames define layout, typography, colors, spacing, copy and imagery. Match them exactly. Do not restyle or "improve" them.
- Screens (all 1440 × 900): `01 — Start / Terminal`, `02 — Gallery`, `02b — Gallery / Card flipped`, `03 — Departures board`, `04 — Duel`, `05 — Now boarding`.
- Components: `CityCard` (Side = Front / Back), `Heart` (State = Off / On), `Flap Tile` (text property `Char`), `Departures Board`, `Boarding Pass — Porto`.
- City content: frame `City Cards — 16`, one sub-frame per city with the front and back card. Extract it into **one data file** (`src/data/cities.ts`), never hard-code city content inside components.
- `02` and `02b` are two states of **one** Gallery screen, not two screens.
- Use the copy from the frames word for word. Add new copy only where these guidelines or a prompt say so.

---

## 3. Visual system

### Colors (no others)
| Token | Value | Use |
|---|---|---|
| `paper` | `#F6F2E9` | Card surface, light text on dark |
| `ink` | `#1B1A18` | Main text on paper, flap tiles |
| `ultramarine` | `#3D35F2` | Accent, active/recognised states, primary button, selected heart |
| `blush` | `#F4C2DE` | Small accents only, as in the frames |
| `glass` | `#121212` at 55% + `backdrop-filter: blur(24px)` | UI panels, chips, camera window |

### Fonts (Google Fonts)
- **Bebas Neue** — headings, city names
- **Inter** — interface text
- **Caveat** — handwritten notes on cards
- **JetBrains Mono** — departures board, flap tiles
- **Libre Barcode 128** — barcode on the boarding pass stub

### Layout
- Design canvas is 1440 × 900. The app renders directly in the viewport (100vw × 100vh). Never wrap it in a device mockup, browser chrome, outer frame or page margins.
- Scale proportionally for widths 1280–1920. Backgrounds always cover the full viewport.

---

## 4. Data

`City` fields (from `City Cards — 16`):
`id`, `index` (1–16, order of the frames: Porto, Barcelona, Buenos Aires, Kyoto, Marrakech, Reykjavík, Istanbul, Mexico City, Cape Town, Tbilisi, Hanoi, Copenhagen, Edinburgh, New York, Dubrovnik, Seoul), `name`, `country`, `seasons`, `budget` (e.g. "~€80/day"), `note` (Caveat line), `coords`, `language`, `currency`, `idealStay`, `bestSeason`, `temperature`, `tags` (4), `why`, `photo`.

Derived values:
- `gate` = `index` padded to 2 digits ("01"–"16").
- `seat` = `${index}A` ("1A" for Porto, "16A" for Seoul).
- Flap tile text = city name in uppercase. Map characters the flap set does not contain (e.g. `Í` → `I`).

---

## 5. Screen flow

Manage screens with **one state machine** (`start | gallery | departures | duel | boarding`). No page routes.

```
start ──(camera granted / "Use mouse")──► gallery ──(end slide + palm)──► departures
                                                                            │
          0 picks: "No flights selected" → back to gallery ◄────────────────┤
          1 pick:  ─────────────────────────────────────────────► boarding ◄┤
          2+ picks: ──► duel (rounds) ──(one city left)──────────► boarding
boarding ──("Start over")──► gallery, picks cleared
```

### 01 Start / Terminal
- "Allow camera" requests **video only**. While the browser prompt is open, the button shows a loading state.
- Denied or no camera: same layout, short explanation, and a button that continues in mouse mode.
- "No camera? Use mouse instead" → gallery in mouse mode.
- The first click on either action also unlocks audio (browser autoplay rules).

### 02 Gallery
- Carousel: centre card large; the two neighbours on each side smaller, rotated and dimmed, as in the frame. Neighbours wrap around (card 01 shows 16 and 15 on its left).
- Navigation order: 01 → … → 16 → **end slide** → 01. The end slide sits in the centre position and shows: "Ready? Hold palm to see your departures".
- Background = blurred photo of the centre city; crossfades (~400ms) when the centre changes.
- Top bar: logo, counter "01 / 16" (end slide: hide the counter or keep "16 / 16"), "♥ N selected", sound toggle.
- Heart: outline on the centre card only; filled on every selected card (centre or not).
- Bottom: 4 gesture hint chips. The recognised gesture's chip turns ultramarine. Hold gestures show a progress ring on their chip.
- Camera window (bottom right): live mirrored video with the MediaPipe hand skeleton, "LIVE" badge, status "Hand detected · [Gesture]" or "Show your hand".
- First visit: translucent layer "Raise your hand to start", dismissed when a hand is first detected (mouse mode: not shown).
- Flipped state (`02b`): centre card shows its back with a 3D flip (~500ms). The background stays the same city. Swiping away flips the card back first.

### 03 Departures board
- Rows = selected cities in gallery order, with GATE and status "SELECTED".
- On enter, tiles animate split-flap style: each tile cycles through random characters before landing, staggered left→right and row by row (~1.2s total).
- Up to 6 rows per page. With more picks, the board flips to the next page every 6s (same flap animation).
- Palm hold → duel. Fist hold or Esc → back to gallery.

### 04 Duel
- Single elimination. Pairs in gallery order: (1st, 2nd), (3rd, 4th)… Winners keep that order for the next round.
- Header "ROUND X · MATCH Y OF Z" where Z = matches in the current round.
- Odd count: the last city gets a bye. Show it alone in the centre for ~1.5s with the label "NO OPPONENT · MOVES ON", then continue.
- Choosing: palm held on the left or right half of the frame (mirrored, i.e. the side the user sees). That half highlights with an ultramarine glow, as in the frame, and fills a progress ring over 0.7s.
- After a choice: winner glows briefly; loser "flies away" (up and off-screen with slight rotation, ~600ms); next match slides in.

### 05 Now boarding
- Night background. Boarding pass: HERE → [CITY], GATE, SEAT, BOARDING NOW, DEPARTS WHEN YOU'RE READY, "Why:" from the card, stub with photo, name, gate/seat and barcode (barcode text = `WN${gate}${seat}`).
- Announcement chip shows the spoken line while it plays.
- "Start over" → gallery at card 01, picks cleared. "See all picks" → departures board (read-only) with the winner's status "BOARDING" and the others "DEPARTED"; Esc / fist / a back control returns to boarding.

---

## 6. Input model

All inputs go through **one gesture event bus**. Screens never read MediaPipe or the keyboard directly.

Events: `next`, `prev`, `select`, `palmHold { side: 'left' | 'right' }`, `fistHold`.

| Event | Gesture | Keyboard | Mouse |
|---|---|---|---|
| `next` / `prev` | Swipe left / right | → / ← | Click a side card |
| `select` | Pinch | Space | Click the heart |
| `palmHold` | Open palm held 0.7s | Enter (duel: ← / → choose) | Click centre card / duel card |
| `fistHold` | Fist held 0.5s | Esc | Click outside the card |

What each event does per screen:
- Gallery: `next/prev` browse · `select` toggles the heart of the centre city · `palmHold` flips the centre card (end slide: go to departures) · `fistHold` flips back.
- Departures: `palmHold` start duel · `fistHold` back to gallery.
- Duel: `palmHold{side}` picks that side. Other events do nothing.
- Boarding: buttons only (mouse/keyboard).

Keyboard shortcuts listen on `window` and match `KeyboardEvent.code` (so they work with any keyboard layout).

### Mouse mode
- Hide the camera window and the "Raise your hand" layer.
- Hint chips show the keyboard equivalents instead of gestures.

---

## 7. Hand tracking (implement only when a prompt asks)

- `@mediapipe/tasks-vision` **GestureRecognizer**, `runningMode: "VIDEO"`, `numHands: 1`, GPU delegate with CPU fallback. WASM from jsDelivr, same version as the package. Model: `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task`.
- Start loading only after camera access is granted. Never block the UI while it loads.
- Per-frame values live in refs. React state changes only when the recognised gesture or hand presence changes.
- Hand presence: `false` only after 500ms with no detection.
- Video is mirrored. All x-based logic uses mirrored coordinates (`x' = 1 − x`), so left/right match what the user sees.

### Detection rules (named constants in one file)
- **Pinch**: `dist(4, 8) / dist(0, 9) < PINCH_ON (0.25)` to start, `> PINCH_OFF (0.40)` to release. Not valid while the category is `Closed_Fist`. Fires once on start.
- **Swipe**: wrist (landmark 0) moves `> SWIPE_MIN_DIST (0.15)` of frame width within `SWIPE_WINDOW (250ms)`, at speed `> SWIPE_MIN_SPEED`. Hand moving to the user's left → `next`; to the right → `prev`.
- **Palm hold**: category `Open_Palm` (score ≥ 0.6) **and** wrist speed below `STILL_SPEED` for 700ms. Moving the hand cancels the hold.
- **Fist hold**: category `Closed_Fist` (score ≥ 0.6) for 500ms.
- A hold cancels if the gesture breaks for more than 150ms. The ring resets.
- After any fired event: global cooldown 600ms. A second pinch no earlier than 1000ms after the last.

---

## 8. Sound

- Pinch / select → polaroid click: `https://res.cloudinary.com/cxqpf75x/video/upload/v1791227701/345906__satanicupsman__polaroid-taking-picture.wav`
- Card flip → paper rustle: `https://res.cloudinary.com/cxqpf75x/video/upload/v1791227701/makigai_maimai-paper-245786.mp3`
- Departures board → short split-flap clicks synthesised with Web Audio (tiny filtered noise bursts per tile), no file.
- Final → airport bell: `https://res.cloudinary.com/cxqpf75x/video/upload/v1791227701/airport-bell.mp3`, then the voice line via `speechSynthesis` (English voice, rate ≈ 0.95): "Attention please. Passengers travelling to [City], your flight is now boarding. Have a wonderful trip."
- One audio module. Preload after the first user click. The sound toggle mutes everything, including speech (`speechSynthesis.cancel()`). Leaving the boarding screen cancels speech.

---

## 9. Privacy

- Camera video is shown only in the camera window. Nothing is recorded, saved or sent.
- Stop all camera tracks when the app unmounts. Pause recognition while the tab is hidden.

---

## 10. Motion & accessibility

- Motion is quick and tactile (paper, flaps, planes), never bouncy for its own sake. Screen changes crossfade 300–500ms.
- `prefers-reduced-motion`: shorten flips and flap animations, keep crossfades.
- All controls are keyboard-operable with a visible focus ring.
- Recognised gesture and screen changes are announced in an `aria-live="polite"` region.
- Text keeps sufficient contrast over photos (use the overlays from the frames).

---

## 11. How to work in this project

- **Build only what the current prompt asks for.** Stages: tracking test → UI and flow on keyboard/mouse → gestures → sound → polish and publish.
- **Iterations are deltas.** Preserve all existing layout, visuals, copy, behavior and component structure unless the prompt names them.
- Keep thresholds, timings and the city count as named constants in one place.

### Never
- Add UI that is not in the frames or these guidelines: navigation, help buttons, toasts, settings, prices, logins.
- Add decorative effects: extra gradients, blobs, particles, glows.
- Wrap the app in a device mockup.
- Use placeholder copy or invent city facts.
- Store or send camera frames.
