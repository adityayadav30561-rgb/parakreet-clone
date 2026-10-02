# Project instructions for Claude

This is a **defensive security / detection** research project. Read `docs/ROADMAP.md`
before making changes; it defines the stages, gates, and the scope boundary.

## Fixed scope rules (do not cross)

1. The **live-answer assistant overlay is never capture-excluded.** Capture exclusion
   (`SetWindowDisplayAffinity` / `WDA_EXCLUDEFROMCAPTURE`) is applied only to the
   content-free **research marker window**.
2. **No evasion or anti-detection work, in any phase:** no process-name spoofing, no
   process / Task Manager hiding, no injection into meeting apps, no bypassing security,
   anti-cheat or proctoring software, no undocumented or kernel techniques, and nothing
   built specifically to defeat the detector. The detector is meant to succeed.

## Working rules

- Develop on the branch named in the task. Commit and push when a gate is reached.
- Keep secrets out of the renderer and out of logs; every IPC channel is zod-validated in
  main and checked for a trusted sender.
- After meaningful changes run, in order: `npm run typecheck`, `npm run lint`,
  `npm test`, `npm run build`. Fix failures; never report "should work" untested.
- State clearly what could not be tested in the cloud (Windows/native/device items) and
  what must be verified manually on the Windows PC.
- Prefer small modules and strict TypeScript. No business logic in React components. No
  magic constants. Typed IPC only.

## Architecture quick reference

- `packages/shared` — the single source of truth for the IPC contract, error type,
  provider list, and secret redaction.
- `apps/desktop` — Electron app. `electron/main` (trusted), `preload` (bridge only),
  `renderer` (React, no Node access).
- Native Windows code lands under `native/` in later stages as a separate audio helper
  process and an N-API affinity addon.
