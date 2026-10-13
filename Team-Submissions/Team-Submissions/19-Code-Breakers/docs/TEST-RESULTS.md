# Delivery verification

## Local routing engine — 13 October 2026

- Production build passed with the existing non-fatal Three.js size advisory.
- Logic/API suite: **22 passed**, including seven local-engine tests. The Dijkstra results match an independent exhaustive simple-path oracle over 36 preference/destination/closure combinations on the sample network.
- Browser suite: **20 passed, 1 skipped**. New flows cover confirmed path closure, the 390 m → 570 m detour, persistence, reopening, preferences, exported report contents, no route-API requests during local calculations, notice handoff, invalid expiry, mobile layout, rejected imports and path edits.
- Final targeted routing-lab run: **5 passed**, including an additional clock-controlled test proving automatic expiry restores the original route. There are 21 distinct passing browser scenarios across these runs; the optional OCR test remains skipped.
- Desktop and mobile local-routing screenshots reviewed. The optional OCR integration remains skipped; paid providers were not called.
- Sample network is fictional and has not been surveyed. No field accuracy, live navigation or accessibility certification is claimed.

## Journey redesign — 13 October 2026

- Production build passed. The existing Three.js bundle-size advisory remains non-fatal.
- Node logic/API suite: **15 passed**. Includes stop validation, all three route locations, provider waypoint mapping, expired notices and escaped offline HTML export.
- Browser suite: **16 passed, 1 skipped**. Covers existing authentication/translation/route behavior plus adding/removing a stop, Translator → Notice check handoff, explicit confirmation before destination changes, expired notices, trip-card contents, notes retained across tabs, guest/account save separation and mobile width/navigation.
- The optional real OCR integration test was skipped in this redesign run. The earlier delivery OCR result below is historical, not a new run.
- Desktop map, notice, trip-card and mobile screenshots reviewed. New previews: `notice-preview.png`, `trip-card-preview.png`, `redesign-mobile.png`.
- Live paid providers were not called. ORS stop requests and instruction coordinates were checked with fixtures. No verified entrance dataset, live traffic, road-closure exclusion or transport booking was added.
- The browser suite uses an in-memory account database and a larger request limit only under `NODE_ENV=test`; normal app traffic retains the 60-request/minute limit.

## Earlier delivery record

Tested locally on Windows with Node 25.7.0.

- Production build: passed with Vite 7.3.7. The dynamically loaded Three.js chunk produces a non-fatal bundle-size advisory.
- Node API and behavior tests: **9 passed**.
- Desktop/mobile browser tests including account lifecycle and real OCR: **8 passed** with Playwright Chromium.
- Real OCR: recognized a generated English sign containing “Where is the metro station?” and translated the result using the Kannada offline phrasebook.
- Account persistence: verified that an account and its session remain valid after closing and reopening the SQLite-backed server.
- Visual review: desktop map, mobile layout, 3D landing, sign-up form and translator screenshots reviewed.

No paid provider credentials were supplied. OpenAI and ORS adapters were tested with representative response fixtures and failure scenarios, not live billed requests. Physical microphone input, camera permissions and installed system voices require a manual check on the user's browser.

The sample OCR image is `tests/fixtures/metro-sign.png`. Screenshots in this folder show the completed interface. API tests use temporary or in-memory databases; no test account database is delivered.
