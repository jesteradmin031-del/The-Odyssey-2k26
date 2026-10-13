# A three-minute demo

1. **Open LocalRoute.** Show the animated 3D city. “Our idea is a travel companion that brings routes, local help and language tools into one map.” Demonstrate signup with a throwaway demo account, or click Explore demo. Explain the offline playground label.
2. **Compare routes.** Start at MG Road Metro, choose Cubbon Park. Compare Walk, Cycle and Drive. Click a route and preview the simulated instructions. State that demo paths are illustrative.
3. **Discover a stop.** Choose Indian Coffee House from the curated stop suggestions. Show that the optional stop appears and both simulated route options pass through it. Remove the stop to restore the direct trip. Explain that live ORS requests also include the intermediate place, while suggestions use straight-line distance estimates.
4. **Ask the guide.** “Find a coffee stop.” Explain the offline helper and optional server-side OpenAI connection.
5. **Cross a language barrier.** Open Translator. Translate “Where is the metro station?” from English to Kannada or Hindi. Listen if a matching system voice is installed. Swap languages or try a phrasebook example.
6. **Scan a sign.** Choose the sign's language, upload a clear photo, watch real OCR progress and edit the extracted text. Press Translate. Arbitrary translation requires the OpenAI key; the bundled phrasebook works without it.
7. **Adapt to a notice.** Enter an illustrative closure in Translator and select “Check this as a travel notice.” Check the text, enter expiry if stated, choose a different mapped destination and explicitly confirm the details. Show the updated destination in Explore. Explain that the local cue checker does not verify entrances or block roads.
8. **Take your trip with you.** Open Trip card, select Kannada, add a meeting note and download the HTML card. Open it without internet and show directions, coordinates, phrases and the note. Explain that the card is static and contains no offline map tiles.
9. **Safety and the next mile.** Show sample support points and copy trip details. Explain that transport booking is a future partner integration and no ride is requested.
10. **Explain the architecture.** React in the browser, a small Express backend protecting keys, provider adapters with demo fallbacks, and OCR processing on the device.

Before the presentation: run the app, test microphone permission and system voices, perform one OCR scan to download the selected language, and rehearse the offline flow in case venue internet is unreliable.
