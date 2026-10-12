---
title: "WildMinute: Open-Weight AI That Gets You Off the Screen"
published: false
tags: ai, opensource, pwa, productivity
---

# WildMinute: Open-Weight AI That Gets You Off the Screen 🌿

I built **WildMinute**, a local-first outdoor adventure planner inspired by a simple idea: technology should sometimes help us plan something meaningful, then get out of the way.

The app helps turn “I should go outside” into a manageable adventure. Choose the time you have, your mood, activity, setting, and optional area. WildMinute creates a small mission, a flexible route outline, and a list of details to look for outdoors. After the walk, you can record observations, notes, and photos, then turn the experience into an **Adventure Journal**.

**Repository:** https://github.com/yagnik-satani-otelier/WildMinuteAI

## Community feedback shaped the project

The feedback I received suggested taking the experience beyond activity recommendations:

- Ask users about their location area and preferences.
- Suggest outdoor activities.
- Generate a walking or hiking route outline.
- Suggest things to look for outside.
- Provide an offline adventure checklist.
- Let users record observations, photos, and notes.
- Generate a small journal after the walk.

Those suggestions helped define WildMinute's full loop: **plan → explore → record → remember**.

## Why local AI?

WildMinute uses **Gemma 3 1B through Ollama** for AI-generated missions and journal text. The Node.js server talks to a local Ollama instance; there is no WildMinute-hosted inference endpoint or API key.

The model prompt and response-parsing logic are part of the repository, so developers can inspect the constraints and adapt them. The app doesn't request GPS permission or require an account. Preferences and fieldbook data are stored in the browser on the current device, and photos are not sent to the model.

A local model is not the same thing as a blanket claim that every part of the project or its model is OSI-approved open-source software. Check the relevant model and runtime licenses before redistributing weights.

## What it does

- **Personalised micro-adventures:** choose a short duration, activity, mood, and optional area.
- **Route outline and spotting ideas:** get a flexible walk structure and prompts for what to notice.
- **Offline checklist:** keep track of what to bring, even without AI inference.
- **Fieldbook:** save observations, notes, and photos locally.
- **Adventure Journal:** turn the saved walk record into a short recap using local AI, or use a clearly labelled on-device template.
- **Privacy-oriented defaults:** no account, no GPS permission, no analytics, and no hosted inference service in this project.

## Safety and limitations

The route output is a **suggested route shape**, not turn-by-turn navigation or a verified trail recommendation. WildMinute does not claim to check live maps, weather, trail access, wildlife, or accessibility. An optional external Maps search can help the user find a real route, which should be independently verified before going out.

AI-generated advice can be wrong. Treat activity suggestions as inspiration, follow local guidance, and prioritise safety and accessibility.

## Built with

- Node.js built-in HTTP server
- Vanilla JavaScript and CSS
- IndexedDB for locally stored fieldbook content
- Ollama for local inference
- Gemma 3 1B by default
- Native Node.js test runner

## Run it locally

Requirements: Node.js 18.18+ and Ollama for the AI path.

```bash
ollama pull gemma3:1b
npm start
```

Open http://127.0.0.1:4173. To run the built-in fallback without Ollama, start the app and explore the interface; the AI-specific path requires Ollama and the model to be available.

Run the automated tests:

```bash
npm test
```

The current automated suite passes **5 tests** covering preference validation, prompt safety constraints, route and spotting response parsing, and journal prompt/output parsing. These tests don't replace end-to-end tests of actual model inference, offline behavior, photo persistence, or an outdoor field test.

## Demo

The project currently runs locally. I have not added a hosted demo URL because the AI path depends on a local Ollama installation. A short screen recording or genuine screenshots of the running app are the most honest demo until a hosted option is deliberately built and verified.

## What I learned

This project reminded me that adding AI isn't only about generating text. The surrounding experience matters just as much: make the offline behavior clear, distinguish suggestions from verified facts, preserve a person's notes locally, and build a reason to put the phone away again.

WildMinute is an experiment in making AI a quiet planning tool rather than the destination.

---

*This is a general project article draft, not a claim of acceptance into any particular DEV Challenge. Before using it as a challenge entry, confirm the challenge is still open and follow its current submission instructions.*
