# WildMinute 🌿

**A tiny outdoor mission. A screen that knows when to get out of the way.**

WildMinute helps turn “I should go outside” into a small, doable adventure. Choose the time you have, your mood, activity, setting, optional area, company, and practical/accessibility notes. It creates a micro-adventure, a flexible route outline, and a nature-spotting list. Afterward, save field observations, notes and photos, then turn them into a small Adventure Journal.

Its AI path uses an open-weight model through Ollama running locally. There is no account or GPS permission. Preferences, checklists, notes, journals, and photos are stored in the browser on the current device. There is no analytics or hosted inference service in this project.

## Why it fits “Touch Grass”

WildMinute makes the phone useful for planning, then encourages you to put it away. Its offline checklist, local fieldbook, and template-based journal still work when the model or network is unavailable. The AI-generated route is deliberately a *flexible route outline*, not turn-by-turn navigation or a verified trail recommendation. It never claims to have checked live maps, weather, trail access, or conditions.

## Open AI is a core dependency

- **Model:** Gemma 3 1B via Ollama by default (`gemma3:1b`). You can swap it for another Ollama-supported model with `OLLAMA_MODEL`.
- **Local inference:** the prompt is sent to `127.0.0.1` from the local Node server. The preferences and prompt are not sent to a WildMinute-hosted service because no such service exists.
- **Model choice and behavior:** the prompt is visible in `lib/mission.js`; developers can edit safety rules, style, and output shape or change models without rewriting the app.
- **Honest fallback:** if Ollama is not running, the UI uses a clearly labelled built-in mission library and can still create a journal from the saved walk record. Fallback content is not presented as AI-generated.
- **Local journal generation:** after a walk, the app can ask the same local model to write a short journal based on the user's recorded observations and checklist. Photos are stored locally and are not sent to the model.

Open-weight models are not automatically equivalent to OSI-approved open-source software. This project uses the model's open weights and local runtime as enabled by their respective licenses. Review model/runtime terms before redistributing model files.

## Run it locally

Requirements: Node.js 18.18+ and [Ollama](https://ollama.com/download) for AI-generated missions.

```bash
# 1. Download the model once (skip if you want fallback mode only)
ollama pull gemma3:1b

# 2. Start WildMinute (no npm packages to install)
npm start

# 3. Open the local app
# http://127.0.0.1:4173
```

To change the model or port, set the environment variables in your shell (this dependency-free project does not load `.env` automatically), or use your preferred environment loader:

```bash
OLLAMA_MODEL=gemma3:1b PORT=4173 npm start
```

The app keeps working with built-in missions if you start the server without Ollama, so you can explore the interface before downloading model weights. The checklist, observations, image attachments, and journal archive are stored in IndexedDB on the device and are available offline after the app shell has been cached. To verify actual AI mode, make sure the status badge says **Local AI ready**, generate a mission, and confirm the result badge says **LOCAL AI**. The Adventure Journal is similarly marked **LOCAL AI** when it comes from Ollama, or **ON-DEVICE TEMPLATE** when generated offline.

## Test

```bash
npm test
```

The automated tests cover input validation, prompt construction, and model response normalization. They do not replace a real end-to-end test with Ollama or a field test outside.

## Privacy and safety

- No GPS permission or automatic location lookup. The area field is optional and typed in by the user.
- No analytics, account, or hosted AI endpoint. When this project is run locally, preference and journal text is sent only to the local Ollama service for generation.
- Photos are kept in browser IndexedDB and are not sent to the model. Journal text exports do not embed photo files.
- The optional Google Maps search opens an external site and includes the manually entered area in the search query; only use it if you are comfortable sharing that query with Google.
- The generated output is a suggestion, not live information about weather, trail conditions, accessibility, plants, or wildlife. Verify any real trail and route independently, stay in familiar public areas, and follow local guidance.
- The service worker caches the app shell. Actual AI inference still needs the local Ollama service and downloaded model. In a browser, offline local storage generally requires a secure context such as `localhost` or HTTPS.

## Stack

Node.js built-in HTTP · Vanilla JavaScript · CSS · IndexedDB · Ollama · Gemma 3 1B

## Project structure

```text
public/       Responsive UI, PWA shell, offline checklist, photos/notes and journals
lib/mission.js Input validation, mission/journal prompts and response parsing
server.js     Dependency-free local HTTP API and Ollama bridge
test/         Native Node.js tests
```

## Before sharing a demo

1. Run `npm test`.
2. Start Ollama and confirm the status badge says **Local AI ready**.
3. Generate missions with different activity and accessibility preferences; inspect the route honesty note and spotting list.
4. Tick the offline checklist, add a note/photo, finish an adventure and generate a journal. Reload the page to verify local persistence.
5. Test offline after the app shell has been cached, and test a phone-sized viewport.
6. Verify route suggestions against a trusted map before using them in real life. Ideally try one mission outdoors. In a public write-up, describe only what actually happened and include genuine screenshots or a short demo recording.

## License

MIT. See `LICENSE`.
