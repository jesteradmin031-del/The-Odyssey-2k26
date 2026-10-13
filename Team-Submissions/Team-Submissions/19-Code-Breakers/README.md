# LocalRoute — find your way, your way

A locally runnable React + Vite hackathon project: a custom animated 3D landing page, real account registration/login, map and place search, route previews, an AI travel assistant, safety tools, saved places, and a voice + scan-to-text translator. Built with understandable components, plain JavaScript, Three.js, and a small Express API.

## Run it

Requires **Node.js 22.13+** (Node 24 LTS is recommended) and npm. The backend uses built-in `node:sqlite`; older Node versions will not work. No domain or production server is needed.

```powershell
cd 'E:\LocalRoute final'
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. This one command starts Vite on 5173 and the API on 3001. Stop both with Ctrl+C. On Windows, you can also double-click **Start-LocalRoute.cmd**. If dependencies are already included in your delivered folder, `npm install` is optional; use `npm ci` when reproducing the exact lockfile on another machine.

**Without credentials:** the default Bengaluru illustration, curated places, route simulations, saved places, offline travel helper, and phrasebook work. A network is required to install packages. Once installed, the core demo works without internet. Fonts fall back to system fonts offline. Scanning downloads OCR language files on first use; browser speech and online map tiles may also need internet.

To run the built version:

```powershell
npm run build
npm start
```

Open **http://127.0.0.1:3001**. Express serves both `dist/` and `/api`. Do not open `index.html` directly as a file. `npm run dev` is the easiest way to learn and edit.

## Add your own keys privately

```powershell
Copy-Item .env.example .env
```

Open `.env` in your editor. Fill only the services you want, then restart `npm run dev`. Do not paste keys into chat, source files or screenshots. `.env` is ignored by Git. `.env.example` contains no secrets. Never prefix a secret with `VITE_`: Vite exposes those values in the browser bundle.

If a blank `.env` has already been prepared in your delivered E: folder, edit that file directly instead of copying over it.

| Variable                                                               | Provider / exact purpose                                                                                                                                           | Where to get it                                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `OPENAI_API_KEY`                                                       | OpenAI project API key. Enables the travel assistant and arbitrary-text translations. Server only.                                                                 | [OpenAI API keys](https://platform.openai.com/api-keys)                        |
| `OPENAI_MODEL`                                                         | A Responses API text model available to your OpenAI project. Default is `gpt-4.1-mini`; change if needed. Not a secret.                                            | Your OpenAI project/model access                                               |
| `ORS_API_KEY`                                                          | openrouteservice key. Enables geocoding search and walking/cycling/driving directions. Server only.                                                                | [openrouteservice developer signup](https://openrouteservice.org/dev/#/signup) |
| `HOST`, `PORT`                                                         | Local API host/port, defaults `127.0.0.1:3001`.                                                                                                                    | No account required                                                            |
| `ALLOWED_ORIGINS`                                                      | Comma-separated browser origins permitted to use the API. Defaults cover the local demo.                                                                           | Set to your own origin for a later deployment                                  |
| `TRANSPORT_PROVIDER`, `TRANSPORT_CLIENT_ID`, `TRANSPORT_CLIENT_SECRET` | Reserved, **unused** placeholders for a future approved transport partner. Fill the name and that partner's issued credentials only when implementing its adapter. | Your chosen partner's approved developer program                               |

Leaflet and the bundled illustration need no key. The optional standard OpenStreetMap tile layer needs internet but no key. Browser speech and Tesseract OCR need no API key. **No credentials are required for the hackathon demo.** A ChatGPT subscription and OpenAI API billing are separate; verify access in your API project.

## What works

### Redesigned journey workspace

- **Route lab (local engine):** a working Dijkstra implementation on an editable, explicitly fictional campus graph. Choose distance/stair/crossing preferences, match a reviewed notice to a path, confirm its closure, and see real graph rerouting without changing the destination. Closures expire or can be reopened. The diagram, costs, unknown attributes and before/after distances explain the decision. Import/export your own network JSON and download an evidence report. This workspace is walking-only and independent of the broader Explore map. Read `docs/TEAM-CONTRIBUTION.md` for the judge demonstration, scoring rules and survey instructions.

- **Notice check:** scan with Translator and send the reviewed text to Notice check, or paste a notice directly. A local keyword check highlights possible closures/diversions in English and selected Indian scripts. It is not semantic verification. Enter any expiry yourself, select an alternative destination, and confirm the location/timing before updating your trip. Expired notices cannot be applied. The app does not identify verified station entrances or exclude closed road segments.
- **A stop along the way:** add one intermediate place through search or curated café/park suggestions. Both ORS requests and labelled demo routes include the stop. Suggestions are ranked by added straight-line distance, not real road detour distance. Remove the stop to restore a direct trip.
- **Offline trip card:** download a standalone HTML file containing the current directions preview, coordinates, four phrases in your chosen language, notes and any attached notice. Read or print it without internet. This is a static document, not a downloaded map or live navigation. Notes/checklists remain available while switching tabs in the current app session; download to retain them.
- **Actionable discovery:** the assistant panel includes selectable curated destinations.
- **Account separation:** signed-in users have separate saved-place storage keys in this browser; guest saves retain their existing key. This is browser storage, not server synchronization or a security boundary against someone with access to this browser.
- **Responsive redesign:** forest navigation, warm paper panels, route cards, a clearer stop planner, and scrollable mobile navigation. Existing accounts, translator/OCR, assistant, safety and transport status remain available.

These workflows are differentiators for this prototype, not claims of worldwide novelty. Real routing and arbitrary translation still require the configured providers described below.

- **3D landing page:** an original Three.js miniature city, a moving route marker, floating location pins, subtle pointer motion and animated sign-in/sign-up transitions. Includes a pause control, reduced-motion support and a visual fallback when WebGL is unavailable. No Spline account or hosted 3D asset is needed.
- **Accounts:** real registration, login, logout and seven-day sessions. SQLite persists users across restarts. Passwords use salted scrypt hashes; session tokens are random, hashed in the database and delivered in HTTP-only SameSite cookies. Auth attempts are rate limited. Explore demo is available without an account.
- **Map:** pan, zoom, recenter, click place labels, filter curated POIs, switch from the offline illustration to OpenStreetMap tiles with attribution.
- **Search:** origin/destination search with debounce, keyboard selection, voice input, and optional device location. Demo search covers the included Bengaluru places; ORS enables global search.
- **Routes:** walking, cycling and driving. Route cards, distance and time, swapping endpoints, saved destinations and step-by-step previews. Live routing uses ORS. Provider errors visibly fall back to simulations.
- **AI guide:** context-aware travel questions through the server. Without a key, a clearly labelled rule-based helper covers coffee, safety and translation. Each question receives current trip context; chat history is visual only and is not sent as conversation memory.
- **Translator:** seven languages (English, Hindi, Kannada, Tamil, Telugu, Spanish, French). Typed text, source-language voice input, language swap, copy and text-to-speech. Live arbitrary translation uses OpenAI. Without it, four phrasebook examples translate in all seven languages; unsupported text gives a useful error instead of a fabricated translation.
- **Scan to text:** upload/take a PNG, JPEG or WebP photo (8 MB limit), choose its language, watch progress, review extracted text and translate. Real Tesseract OCR runs in the browser. Images are not sent to the app server or AI provider. Text is sent to OpenAI only when you press Translate with the live AI service configured. First-time language downloads require internet. Recognition quality depends on image clarity and script; results are editable.
- **Safety tools:** illustrative support-point overlay and copyable trip details. Nothing is sent automatically. No live danger scores, safe-zone claims, incident feeds or emergency monitoring.
- **Saved places:** stored in this browser's local storage; guest and signed-in account lists are separated. No cross-device synchronization.
- **Transport:** an honest future integration panel and `server/transport-adapter.js` interface. No real quotes, booking or payment is performed.

## Local user registration

From the landing page choose **Get started**, enter your name, email and a password of at least 10 characters, then confirm it. Registration signs you in immediately. **Sign out** invalidates that browser session. You can sign in again after restarting the app.

The database is automatically created at `data/localroute.sqlite`. It contains private account data and is excluded from Git. `AUTH_DB_PATH` can change its location; no external database credentials are needed. Back up this file privately with the app stopped if you want to keep local accounts. The delivered project starts with a fresh database, not the test accounts. Saved map places remain browser-local, with separate keys for each account and guests; they are not synchronized to the server or other devices.

`SESSION_COOKIE_SECURE=false` is correct for local HTTP. Set it to `true` for HTTPS hosting; `NODE_ENV=production` also forces secure cookies. There is no shared session secret to configure because sessions use random tokens stored as hashes in SQLite. Email verification, password recovery, multi-factor authentication and account deletion are future extensions; this version is intended for the local hackathon. Do not use an important real-world password in a demo.

## Demo versus live behavior

| Feature     | No keys / service unavailable                         | With configured provider                                          |
| ----------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| Map         | Bundled offline SVG illustration of central Bengaluru | User can switch to OSM street tiles; independent of keys          |
| Search      | Ten curated places                                    | ORS geocoding, falling back to curated matches on service failure |
| Routing     | Two illustrative paths; distance-based time estimates | ORS route geometry and instructions; no live traffic              |
| AI guide    | Small local rule-based travel helper                  | OpenAI response, labelled in chat                                 |
| Translation | Four phrases × seven languages                        | OpenAI translation for up to 3,000 characters                     |
| OCR         | Real browser OCR, with first-use network downloads    | Same; does not require a paid API                                 |
| Voice       | Browser capability and permissions determine support  | Same; no server audio processing                                  |

**Demo routes and the offline map are not surveyed road data or real navigation.** The app previews instructions; it does not continuously track GPS, reroute, detect hazards, or provide reliable real-time turn guidance. The safety layer is sample POI data and cannot assess whether an area is safe. AI suggestions, translations, OCR and provider routes can be wrong; review them and follow actual signs and conditions.

## Project structure and learning guide

```text
src/
  Root.jsx                    Session check and landing/map navigation
  App.jsx                     UI state, route requests, navigation tabs, saved places
  styles.css                  Responsive layout and visual styles
  landing.css                 Landing page and animated authentication layouts
  components/
    Landing.jsx               Welcome screen and functional login/register forms
    CityScene.jsx             Custom Three.js city, animation, cleanup and fallback
    MapView.jsx               Leaflet map lifecycle and layers
    PlaceSearch.jsx           Debounced search, keyboard controls and voice search
    Translator.jsx            Translation, browser OCR, speech and phrasebook UI
    Assistant.jsx             Travel chat UI
    Safety.jsx                Support layer + copyable trip summary
    Transport.jsx             Future integration screen
  hooks/useVoice.js            Browser speech input/output with errors and cleanup
  services/api.js              API calls, timeouts, offline fallbacks
  services/auth.js             Account requests; session cookie stays HTTP-only
shared/
  data.js                     Curated places, travel modes, languages, phrasebook
  demo.js                     Pure offline search/routing/translation helpers
server/
  index.js                    Loads .env and starts Express
  app.js                      Validated endpoints, origin checks and rate limiting
  auth.js                     SQLite accounts, password hashing and cookie sessions
  providers.js                ORS and OpenAI HTTP adapters (keys stay here)
  transport-adapter.js         TODO interface for an approved partner
public/demo-map.svg            Bundled illustrative map
scripts/generate-map.mjs       Rebuilds the illustration
tests/                        Node API/behavior tests and Playwright UI tests
docs/                         Architecture and a short hackathon demo script
.env.example                  Annotated credential placeholders
```

Start by reading `shared/data.js`, then `shared/demo.js`, `src/App.jsx`, and `server/app.js`. All geographic coordinates use **[longitude, latitude]**; Leaflet converts them to **[latitude, longitude]** in one helper. React holds the UI state; components receive props and callback functions. AbortController prevents an older route/search request overwriting a newer one. The API normalizes external provider responses into the same shape as demo data.

## Tests

```powershell
npm test
npm run build
# One-time browser install (internet required):
npx playwright install chromium
npm run test:ui
# Optional integration test: actually scan the included/generated image:
$env:TEST_OCR='1'
npm run test:ui -- tests/ocr.spec.js
# Reformat the source when learning/editing:
npm run format
```

Node tests cover account lifecycle, session persistence after restart, cookie flags, input validation, route modes, fallback labeling, translations, provider response mapping and secret boundaries. Playwright starts the built app on a test port using an in-memory account database and exercises the 3D landing, signup/login/logout, routing, saved places, assistant, translation, error handling and mobile layouts. Provider tests use fixtures; actual paid calls require your credentials and are not included in the offline tests. The optional OCR integration test performs real browser OCR. Microphone, OS speech voices and physical camera permissions must be tried manually in your browser. See `docs/TEST-RESULTS.md` for the delivery check record.

## Troubleshooting

- **Port in use:** stop the other process or change Vite's port and `ALLOWED_ORIGINS`. If changing API `PORT`, also update the Vite proxy in `vite.config.js`.
- **Live features still show demo:** restart after changing `.env`, check the provider account/quota/model, and read the visible fallback notice. Keys are never printed to the console.
- **No matching place:** demo search is intentionally limited. Try `Cubbon`, `MG Road`, `Coffee`, or configure ORS.
- **No voice input:** use current Chrome/Edge, allow the microphone and use localhost or HTTPS. Some browsers do not implement SpeechRecognition. A browser vendor may process speech online.
- **No spoken translation:** install a system voice for the target language. The app reports when the browser's voice list lacks a match.
- **OCR fails to load:** allow internet access for Tesseract's worker/WASM/language downloads; try a sharp image and the correct scan language. For a fully offline OCR deployment, self-host traineddata and worker assets and pass local paths to `createWorker`.
- **Outside Bengaluru:** use the street layer; the bundled illustration only covers the demo neighborhood. Demo routes anywhere are still illustrative.
- **Registration unavailable:** start both servers with `npm run dev`. Account operations require the local API and do not simulate success. If sign-in does not persist on HTTP, check that `SESSION_COOKIE_SECURE` is false and `NODE_ENV` is not production.
- **3D canvas unavailable:** WebGL may be disabled by the browser/GPU. The landing page falls back gracefully and the rest of the app still works. Three.js is loaded as a separate on-demand chunk; its build size warning does not prevent a successful build.

## Later deployment (optional)

Build the frontend and run Express behind HTTPS on a Node-capable host. Configure server environment variables and the exact allowed origin; keep secrets out of the client and Git. The included origin checks and per-IP rate limits are appropriate local-demo safeguards. Before public use, add authentication and per-user quotas to paid endpoints, deployment-specific proxy/rate-limit configuration, abuse controls and stronger operational monitoring. Do not expose an unrestricted paid proxy. Add partner auth, validated quotes, explicit booking confirmation and cancellation before enabling transport transactions. Domain/DNS setup is intentionally left for later.

## References

- [OpenAI text generation / Responses API](https://developers.openai.com/api/docs/guides/text)
- [openrouteservice API](https://api.openrouteservice.org/) and [directions](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/)
- [Leaflet](https://leafletjs.com/) and [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
- [Tesseract.js](https://github.com/naptha/tesseract.js) and [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Three.js](https://threejs.org/docs/) and [Node SQLite](https://nodejs.org/api/sqlite.html)

The bundled illustration is original generated SVG. OpenStreetMap attribution remains visible when its layer is used. Do not bulk-download OSM standard tiles or use them as a production service without reviewing their usage policy.
