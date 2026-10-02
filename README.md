# Realtime Interview Assistant — Detection Study

A research project on **how real-time "interview assistant" tools work and how to detect
them**. It builds, in one controlled test environment on the researcher's own machines:

- a **visible** real-time assistant (mic + application-audio capture, transcription, question detection, streamed answers, latency measurement);
- a **research marker window** that can request Windows' documented capture-exclusion API, used only as a detection target;
- a **detector** (separate process) that identifies a running assistant from legitimate local signals;
- a **test bench** (meeting simulator) and an **experiment record** so results are reproducible and measured.

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full plan, the scope boundary, and the
research questions.

## Scope boundary

This is a defensive / detection study. The live-answer overlay is **always visible to
screen capture**; capture exclusion is applied only to a content-free marker window. The
project contains **no evasion or anti-detection techniques** of any kind. See the roadmap
for details.

## Requirements

- Node.js 22.6+
- Windows 11 for the native audio, capture and detector features (the TypeScript packages and the Electron shell also run on Linux/macOS for development).

## Getting started

```bash
npm ci
npm run dev        # run the assistant in development
```

### Quality gates

```bash
npm run typecheck
npm run lint
npm test           # unit tests (Vitest)
npm run build      # electron-vite production build
npm run test:e2e   # Playwright Electron smoke test (use xvfb-run on Linux)
npm run package:win  # portable Windows .exe (built in CI on windows-latest)
```

## How testing works

Development happens in the cloud; the Windows PC only runs CI-produced builds. Each push
builds a portable `.exe` as a GitHub Actions artifact. Download it, run the matching
`docs/testing/stage-N.md` checklist, and use **Export Diagnostics** to produce a JSON
report (which never contains API keys) to share.

## API keys

Keys are entered in the app's Settings screen and stored encrypted at rest via Electron
`safeStorage` (Windows DPAPI). They never reach the renderer and are never logged. The
packaged app does **not** read a `.env` file; `.env.example` documents the providers only.

## Layout

```
apps/        assistant (Electron), and later detector, simulator
packages/    shared (IPC contract, errors, redaction), and later audio, transcription, ...
native/      Windows C++ (audio helper, affinity addon) — added in later stages
docs/        roadmap, architecture, testing checklists
```
