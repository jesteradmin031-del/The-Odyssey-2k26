# LocalRoute: what our team can demonstrate

## The implemented contribution

Route lab contains a local walking-route engine, an editable path dataset, a notice-to-path confirmation workflow, closure expiry, preference scoring, and a report explaining the resulting route. These run in the browser without a routing or AI service. The wider Explore map still uses its existing ORS integration or explicitly labelled route simulations.

Dijkstra's algorithm is established computer science. We implemented it here; we did not invent the algorithm. The project-specific work is connecting the network, closure lifecycle, conservative handling of unknown attributes, explainable scoring, data editing, import validation, and evidence interface. AI coding assistance was used during development.

## A reproducible judge demonstration

1. Open **Route lab**. Use the supplied fictional campus: West gate → Library entrance, Shortest distance.
2. Show the **390 m** route, including **Library steps**. Its records contain two stair flights and one crossing.
3. Select **Fewer stairs**: the result is **570 m**, with zero recorded stair flights. Select **Fewer crossings**: the result is **580 m**, with zero recorded crossings. Explain the scoring rules shown below the network.
4. Return to Shortest distance. Select Library steps, use the sample notice, and confirm that it applies to that path now. Press **Close path and reroute**.
5. Show the red closed path, the changed green route, and **+180 m**. The destination stays the Library entrance. This is graph recomputation, not a destination substitution or an illustrative polyline.
6. Download **Export evidence report**. It records the selected endpoints, preference weights, closure evidence, before/after routes, route totals and search counters.
7. Reopen the path. The route returns to 390 m.
8. Optionally start in Translator, review scanned or typed notice text, and choose **Send notice to Route lab**. The user must still match the affected path and confirm timing; OCR does not establish a real closure automatically.

All figures above come from the fictional sample. They are algorithm demonstrations, not measurements of a real campus.

## Route decision rules

Each path has positive distance, recorded stair-flight and crossing counts (or `null` for unknown), and a human-readable evidence note. Paths are bidirectional. The current engine supports walking only.

- Shortest distance: cost = recorded metres.
- Fewer stairs: cost = metres + 200 × recorded stair flights + 200 when the path's stair count is unknown.
- Fewer crossings: cost = metres + 250 × recorded crossings + 250 when the path's crossing count is unknown.
- The strict zero-stair option excludes paths with positive or unknown stair counts before searching. It does not assess slope, width, surface, ramps or other accessibility requirements.
- Active closures remove their paths from the search entirely. An expiry is entered explicitly in device-local time. When it passes, the path becomes eligible again. A closure without an expiry lasts until manually reopened.
- If the destination is disconnected, the engine returns no route. It does not invent a fallback path.

Costs are preference units, not travel-time predictions or safety scores. Preferences trade distance against attributes; they do not promise the absolute minimum count of stairs/crossings regardless of distance.

The implementation is Dijkstra with a linear selection of the next lowest-cost node, suitable for the bounded local dataset. Network imports allow at most 200 nodes and 500 paths. Nonnegative costs make the shortest-cost computation valid. All imported graph fields are validated and normalized.

## What your team still needs to collect

The current network is deliberately fictional. Your genuine field contribution should be a small campus/neighbourhood survey:

1. Choose a bounded area and identify entrances, junctions and destinations.
2. Record connected walking paths, measured distances, stair flights and crossings.
3. Leave unknown attributes as `null`; never substitute zero for missing data.
4. Add dated observation notes and record who collected each observation in the evidence text. Follow local access rules while collecting data.
5. Record the network's provenance honestly. The application does not independently certify uploaded observations.
6. Use **Export network** as the schema template, edit the JSON, and import it. A copy is also supplied at `public/sample-network.json`.
7. Compare several computed routes with your measured paths and document mismatches and limitations.

Node `x`/`y` values are schematic drawing coordinates, not latitude/longitude. Edge `metres` is independent measured distance. Changing the schematic does not silently change distances. Imports replace the current network and clear its closures, while rejected imports preserve the previous data. Export before replacing data you want to retain.

## Dependencies and honest claims

- Original project implementation: local graph search, closure rules, preference cost model, data workflow and UI, reporting and tests.
- Established algorithm: Dijkstra, implemented in our code.
- Libraries: React and Lucide for this workspace; Leaflet/OSM and Three.js elsewhere; Tesseract for OCR.
- Optional provider assistance: OpenAI for translation/assistant text and ORS for wider-area routing/search. Mappls is a proposed alternative, not currently integrated. Cloudflare deployment has not been configured.
- Not claimed: invention of shortest-path algorithms, a world-first feature, surveyed sample data, guaranteed safe/accessibility routes, live GPS guidance or automatic official closure verification.

The engine tests include an independent exhaustive path oracle, closure and preference cases, expiry boundaries, unknown attributes, malformed network rejection and disconnected destinations. Browser tests exercise confirmation, persistent closures, reopening, notice handoff, path editing, report download and mobile layout.
