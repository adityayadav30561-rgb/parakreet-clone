# Implementation Roadmap — Realtime Interview Assistant

This roadmap orders the 22 phases (0–21) from the project brief into **7 stages**.
Each stage ends with a **gate**: a short list of things that must actually be shown to
work before the next stage starts. The original phase numbers are kept so the brief
and this plan can be cross-referenced.

## Changes from the brief's ordering

The brief's phases are kept, but five things move earlier. If they stay at the end,
the work done before them has to be redone.

| Change | Why |
|---|---|
| **Security (19)** and the **error surface (18)** start in Stage 0 as baseline rules | Context isolation, typed IPC, keeping secrets out of the renderer, and visible errors are much cheaper to build in from the start than to add later. Stage 6 is then an audit, not a rewrite. |
| **Telemetry/SQLite skeleton (12, 16)** moves into Stage 2 | "Measure first" only works if timestamps exist from the first audio frame. Adding latency probes after the pipeline is built means touching every module again. |
| **Audio fixtures from the Test Meeting Simulator (15)** move into Stage 2 | Loopback capture, VAD and transcription each need repeatable, known audio to test against. The full simulator UI still comes in Stage 5. |
| **Microphone and loopback both use native WASAPI** (not `getUserMedia` for the mic) | Both streams then share one clock (`QueryPerformanceCounter`). That is needed for correct cross-stream latency numbers and turn ordering in Phase 8. |
| **Capture exclusion (3) starts with Electron's `setContentProtection`** before writing a native addon | On Windows 10 2004+ Electron already calls `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)`. The native addon is then only needed for what Electron does not expose: reading back the current affinity with `GetWindowDisplayAffinity`, `GetLastError`, and the OS build number. |

## Native architecture decision

| Component | Form | Reason |
|---|---|---|
| Display affinity (Phase 3) | Small N-API addon (`node-addon-api` + `cmake-js`), called from Electron **main** | Synchronous calls on an HWND that main already owns. |
| Audio capture (Phases 4–5) | Separate C++ helper process (`native/windows-audio` → `audio-helper.exe`) streaming framed PCM to main over a named pipe or stdout | A crash on an audio thread cannot take down Electron. There is no Electron ABI rebuild for the audio code. It can be tested on its own with a CLI that writes WAV files. |

Wire format between the helper and main: `[header: streamId u8 | sampleRate u32 | channels u8 | qpcTimestamp u64 | frameCount u32][PCM payload]`, versioned from day one.

## Development and testing workflow

All development happens in Claude Code on the web (a Linux cloud container). Nothing is
built on the Windows PC; it is only used to **run** builds and report results.

```mermaid
flowchart LR
  A[Claude Code web<br/>write code + Linux tests] -->|git push| B[GitHub Actions<br/>windows-latest]
  B -->|compile native + package .exe| C[Actions artifact<br/>portable .exe zip]
  C -->|download| D[Your Windows PC<br/>run stage checklist]
  D -->|diagnostics JSON + screenshots<br/>pasted into chat| A
```

| Verified in the cloud (Linux) | Verified by GitHub Actions (Windows runner) | Needs your Windows PC |
|---|---|---|
| Monorepo, TypeScript, lint, unit tests | Native C++ compiles, native unit tests | Overlay behavior (always-on-top, shortcuts, drag) |
| Electron shell launch under `xvfb` (smoke test) | Packaged `.exe` builds and starts | `SetWindowDisplayAffinity` results and capture tests |
| All pure-TS packages (resampler, VAD, router, question detector, conversation manager, answer engine with mocked AI) | | WASAPI mic and loopback against real devices |
| | | Real end-to-end latency, CPU and RAM numbers |

Supporting pieces, all built in Stage 0:

- **Windows build workflow:** every push builds a portable `.exe` with `electron-builder` and uploads it as an Actions artifact.
- **Test checklists:** `docs/testing/stage-N.md` lists exactly what to click and what to look for at each gate.
- **Export Diagnostics:** a menu item that saves a JSON file with OS build, app version, device list, API results, errors and latency. API keys are never included. You paste it into chat.
- **API keys in the packaged app:** a `.env` file is not shipped. Keys are entered on a Settings screen and stored encrypted by Electron main (`safeStorage`, which uses Windows DPAPI). The renderer never sees them.

CI runners have no audio devices, so device tests are manual and their results are recorded in `research/results/`.

## AI providers (free-first, swappable)

Transcription and answer generation go through provider interfaces
(`TranscriptionProvider`, `LlmProvider`), so the vendor is a setting, not a rewrite.

| Role | Default (free tier) | Alternatives |
|---|---|---|
| Speech-to-text | Groq `whisper-large-v3-turbo`, sent one VAD speech segment at a time | Local `whisper.cpp` (offline); OpenAI realtime transcription or Gemini Live (true streaming deltas) |
| Answer LLM | Google Gemini Flash, streaming | Groq-hosted open models; local Ollama; OpenAI |

Trade-off: Whisper on Groq is not a streaming API. You get one final transcript per
speech segment instead of word-by-word deltas. Because the pipeline already cuts audio
into segments with VAD (Phase 6), this costs roughly the time of one HTTP round trip per
segment. Phase 7's streaming-delta path is kept for providers that support it.

Free-tier quotas and terms change. Check each provider's console when the key is created.
Free tiers may use prompts to improve the provider's models, so test with simulator data,
not real personal information.

---

## Stage 0 — Foundation & desktop shell
**Phases: 0, 1 (+ baselines of 18, 19)**

- npm workspaces monorepo: `apps/desktop/{electron,preload,renderer}`, `apps/server`, `packages/{shared,audio,realtime,conversation,ui}`, `native/windows-audio`, `tests`, `research`, `docs`, `scripts`
- Electron + Vite + React + TypeScript (strict) + Tailwind; ESLint, Prettier, Vitest
- Secure baseline: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, a strict CSP, and a typed IPC contract in `packages/shared` with runtime validation (zod) on every channel
- Structured logger with secret redaction; an `AppError` type shown in the UI
- `.env.example`, `.gitignore` (including `.env`), `README.md`, `CLAUDE.md`
- Scripts: `dev`, `build`, `test`, `lint`, `typecheck`, `package`
- Status UI showing mic, system audio and AI as "not connected", plus placeholder transcript, question, answer and latency panels
- CI workflow (Linux + Windows) and the Windows portable-`.exe` artifact build
- Export Diagnostics menu item; `docs/testing/stage-0.md` checklist; Settings screen with encrypted API-key storage

**Gate:** the downloaded `.exe` starts on your PC and its diagnostics export is pasted back; the app launches; a test proves `window.require`/`process` are undefined in the renderer; an IPC round-trip test passes; typecheck, lint, test and build are all green in CI.

## Stage 1 — Windows window surface
**Phases: 2, 3**

- `AssistantWindowManager`: frameless, transparent-capable, always-on-top, draggable, resizable, opacity, compact mode, global show/hide shortcut, position persisted per display. Fed by fake data only.
- Capture affinity: `setContentProtection` first, then the N-API addon `setDisplayAffinity(hwnd, NONE | EXCLUDEFROMCAPTURE)` plus readback.
- Diagnostic panel: OS build, API result, `GetLastError`, current affinity.
- `docs/windows-capture.md`, including the limitation: Windows does not guarantee exclusion from every capture method.

**Gate (Windows):** the overlay behaves as specified with fake data; the affinity goes NONE → EXCLUDE → NONE and the readback confirms each step; manual Snipping Tool test results are recorded.

## Stage 2 — Audio engine
**Phases: 4, 5, 6 (+ telemetry skeleton from 12/16, + audio fixtures from 15)**

1. **Telemetry first:** `packages/shared` defines `TelemetryEvent`; SQLite (`better-sqlite3`, in main) has `sessions`, `audio_events`, `latency_events` and `errors` tables plus a migration runner.
2. **Fixtures:** a set of WAV files (the four sample interviewer questions, silence, noise, overlapping speech) with ground-truth transcripts and timestamps in `research/datasets/`.
3. **Phase 4 – mic:** WASAPI capture in `audio-helper.exe`; an `AudioSource` interface in TS (`start/stop/pause/resume/getDevices/setDevice/onAudioFrame`); a diagnostics screen showing sample rate, channels, frame size, RMS, peak, dropped frames and buffer latency.
4. **Phase 5 – loopback:** process loopback through `ActivateAudioInterfaceAsync` (process plus child processes), falling back to system loopback; streams tagged `MICROPHONE_AUDIO`, `SYSTEM_AUDIO` or `APPLICATION_AUDIO`; two-channel A/B meters; `docs/audio-pipeline.md` covering the full chain from the Windows Audio Engine through IAudioClient to the OpenAI WebSocket.
5. **Phase 6 – processing (pure TS, fully unit-tested):** resample, downmix, PCM16, normalize, energy VAD with configurable thresholds, and segmenting into `AudioFrame`, `SpeechSegment`, `AudioStream` and `Turn`. Raw and processed audio stay separately accessible.

**Gate:** VAD and segmentation unit tests pass against the fixtures (Linux). On Windows: a fixture played through speakers appears on channel B only; speech into the mic appears on channel A only; dropped frames are about 0 over 10 minutes.

## Stage 3 — Speech pipeline
**Phases: 7, 8**

- At the start of this stage, check the current docs for the chosen provider (model IDs, event names, quotas) rather than trusting older notes.
- `TranscriptionProvider` interface with a segment-based Groq Whisper implementation first (free); a streaming implementation (OpenAI realtime or Gemini Live) behind the same interface.
- `RealtimeTranscriptionClient` (streaming providers) runs in main/server only (`connect`, `disconnect`, `sendAudio`, `commitTurn`, `onTranscriptDelta`, `onTranscriptFinal`, `onError`) over WebSocket, with reconnect and backoff.
- Two independent sessions: USER (mic) and INTERVIEWER (loopback). Partial and final transcripts with timestamps, source and latency go into SQLite.
- `ConversationRouter`: source channel → USER, INTERVIEWER or UNKNOWN, ordered by QPC timestamp; UNKNOWN when confidence is low (for example, both channels speaking at once).

**Gate:** the client passes tests against a recorded or mock WebSocket server (Linux). The fixture word error rate is measured and recorded, not just eyeballed. On Windows: both transcripts stream live and the routing is correct.

## Stage 4 — Intelligence
**Phases: 9, 10, 11**

- `QuestionDetector`: punctuation, interrogative and imperative patterns, pause length after the utterance, and conversation state; an optional LLM classifier only for ambiguous cases. Emits a `QuestionEvent` (`id`, `text`, `startTime`, `endTime`, `confidence`). It does not fire on fragments.
- `ConversationManager`: turns, questions and answers; recent and session context; a `CandidateProfile` that the user enters explicitly. Nothing is inferred or invented.
- `AnswerEngine` over an `LlmProvider` interface (Gemini Flash by default): streaming, first person, 60–100 words by default, configurable length, tone and detail; the prompt is grounded only in the profile and the transcript.

**Gate:** the question detector's precision and recall are measured on a labeled transcript set; answer-engine tests with a mocked model check streaming, cancellation and the word limit; a mock-backed integration test runs fixture audio → answer.

## Stage 5 — Measurement & research tooling
**Phases: 12, 13, 15, 14, 16, 17**

- **12:** a latency probe at every stage, a `TOTAL LATENCY` readout, a per-stage breakdown; optimize only where the data shows the time goes.
- **13:** final overlay (question, streaming answer, key points, status, latency) with a Normal/Research mode toggle.
- **15:** full test-meeting simulator: a fake meeting UI, scripted question playback, and repeatable runs keyed by `experiment_id`.
- **14:** Capture Laboratory tests screenshot, window capture, display capture, Windows Graphics Capture, application capture, and the simulator. Each result is VISIBLE, EXCLUDED or UNKNOWN, with method, OS build, application, affinity mode and timestamp. UNKNOWN is never counted as EXCLUDED.
- **16:** remaining tables (`transcripts`, `questions`, `answers`, `capture_tests`); CSV and JSON export.
- **17:** evaluation scripts for latency, WER, question detection, answer relevance, hallucination rate, CPU/RAM, dropped frames, and capture behavior.

**Gate:** one command runs a simulator session and produces a metrics export; the evaluation scripts run on it; results are recorded as measured, including bad numbers.

## Stage 6 — Hardening & publication
**Phases: 18, 19, 20, 21**

- **18:** a fault-injection test for every failure listed in the brief (no mic, permission denied, no loopback, API down, network drop, WebSocket drop, malformed audio, timeouts, native helper crash, unsupported Windows build). Each one shows a clear UI error.
- **19:** security audit against the Stage 0 baseline (IPC surface, CSP, secret handling, logs, dependency audit).
- **20:** `docs/` set with Mermaid diagrams.
- **21:** `research/` methodology: prompting variants A/B/C; raw vs processed audio; VAD threshold and buffering sweeps.

**Gate:** all fault-injection tests pass; there are no secrets in logs or the renderer bundle; the docs and research templates are complete.

---

## Working rules per phase

1. Inspect the repo, then state a short plan.
2. Build the smallest complete increment.
3. Run typecheck, lint, unit tests and build. Fix failures; never report "should work".
4. State exactly what could not be tested here (usually Windows/device-specific items) and what to verify manually.
5. Update the docs, commit, push, and stop at the gate.

## Next step

**Stage 0** (Phases 0 + 1). Stop after the Electron shell launches and the gate checks pass.
