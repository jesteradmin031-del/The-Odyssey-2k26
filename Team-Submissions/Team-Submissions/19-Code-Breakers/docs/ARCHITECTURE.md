# How LocalRoute fits together

```text
Browser (React + Leaflet)
  ├── Three.js landing city + animated signup/login
  ├── bundled illustration, curated data, localStorage saved places
  ├── browser microphone / speech synthesis
  ├── Tesseract worker → OCR text (image stays in browser)
  └── /api (same origin; Vite proxies in development)
        └── Express
              ├── validates input / origin / request size / request rate
              ├── SQLite accounts + hashed session tokens in HTTP-only cookies
              ├── demo functions when no key is set
              ├── ORS geocoding and directions → normalized map data
              └── OpenAI Responses API → helper or translation text
```

## API contract

Account endpoints: `POST /api/auth/register` accepts `{name,email,password}`; `POST /api/auth/login` accepts `{email,password}`. Both return only a public `{user:{id,name,email}}` and set a session cookie. `GET /api/auth/me` returns the authenticated user or `null`. `POST /api/auth/logout` deletes the current session and clears its cookie. Invalid credentials and duplicate registration return clear 4xx errors. Accounts are persisted in SQLite; passwords and session tokens are never stored as plaintext.

| Method / path         | Input                         | Response                                       |
| --------------------- | ----------------------------- | ---------------------------------------------- |
| GET `/api/health`     | none                          | Provider capability names; never keys          |
| GET `/api/places?q=`  | 1–120 characters              | `{places, source, notice?}`                    |
| POST `/api/routes`    | `{origin, destination, mode}` | `{routes, source, notice?}`                    |
| POST `/api/assistant` | `{message, context}`          | `{text, source, notice?}`                      |
| POST `/api/translate` | `{text, from, to}`            | `{text, source, notice?}` or an explicit error |
| GET `/api/transport`  | none                          | `{available:false, providers:[], message}`     |

Places have a display name and `[lng,lat]` coordinates. Modes are `walking`, `cycling`, `driving`. Language codes are in `shared/data.js`. A route contains coordinates, metres, seconds, instructions, and a source label. Live and demo objects have the same shape, so the UI does not need a separate screen for each.

## Useful things to learn

1. **State:** App owns the selected places and mode; the map and planner derive their displays from those values.
2. **Effects:** Leaflet is created once, updated when props change, and destroyed on unmount. ResizeObserver keeps it aligned with its container.
3. **Race conditions:** changing a query cancels its previous request. Translator request IDs discard outdated responses after edits or language swaps.
4. **Separation:** pure demo functions are shared by browser and server; provider adapters are server-only.
5. **Error handling:** unsupported inputs fail clearly; provider failures can return labelled demo results. We never silently present a simulated route as live.
6. **Privacy:** SQLite stores account names, emails and password hashes locally. Session token hashes are stored with an expiry. Saved map places use localStorage and are not tied to the account yet. Speech may use the browser vendor. OCR images remain local. Translation sends only reviewed text when the user clicks Translate. The guide sends the message, destination name and mode, not microphone audio or an exact GPS coordinate.
7. **3D lifecycle:** CityScene builds meshes in a Three.js group, renders through requestAnimationFrame, responds to resize, and disposes its geometry/materials/renderer on unmount. Reduced-motion and pause controls freeze the scene's motion. No external 3D model files are needed.
8. **Password and session flow:** registration generates a random salt, derives a scrypt hash, inserts a parameterized SQLite record, then creates a random session. Login compares derived hashes using timingSafeEqual. The cookie carries the token; the database holds only its SHA-256 hash and expiry.

## TODO extensions

The journey redesign adds `shared/journey.js` (conservative notice cues, stop-aware demo routes, curated stop ranking and escaped standalone HTML export), `NoticeCheck.jsx`, `TripKit.jsx`, and `journey.css`. Routing accepts one optional validated `stop`; the ORS adapter forwards three coordinates and retains each instruction's geometry position when supplied. Live preview markers use those positions rather than guessing from instruction index. Notice and trip-card panels stay mounted across tab changes. Saved-place keys are scoped to the signed-in user ID or the existing guest key.

In the wider Explore map, Notice check remains a local text aid with explicit destination confirmation. The new Route lab is a separate local graph workspace: `shared/local-network.js` provides fictional sample data, `shared/local-routing.js` implements validation, closure expiry and weighted Dijkstra search, and `LocalRoutingLab.jsx` handles graph editing/import, notices, persistence and reporting. Confirmed closures remove graph edges before searching. The dataset can be replaced through JSON import. Neither workspace has verified entrance datasets, automatic official closure interpretation or an authoritative incident feed.

- Add real GPS tracking, route snapping and rerouting as a separate navigation feature.
- Replace illustrative support points with a verified dataset; never derive danger claims from proximity alone.
- Synchronize saved places to the existing accounts if desired.
- Add email verification, password recovery, MFA and account deletion before public account hosting.
- Add conversation memory to the AI helper deliberately, with a visible clear-history control.
- Self-host OCR worker and language assets for fully offline scanning.
- Add an approved transport partner through `server/transport-adapter.js`; the placeholder credentials are not wired to any service.
- Add public-deployment authentication, quotas and audited provider configuration before hosting paid endpoints.
