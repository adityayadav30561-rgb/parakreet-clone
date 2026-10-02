# Stage 0 test checklist (Windows PC)

Goal: confirm the foundation and desktop shell work on real Windows before Stage 1.

## Get the build

1. On GitHub, open **Actions → the latest "CI" run for your branch**.
2. Open the **windows-build** job and download the **windows-portable** artifact.
3. Unzip it and run `RealtimeInterviewAssistant-*-portable.exe`.
   - SmartScreen may warn (the app is unsigned): **More info → Run anyway**.

## Checks

| #   | Action                                 | Expected                                                                                  |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | App launches                           | A window titled "Realtime Interview Assistant" appears.                                   |
| 2   | Status panel                           | Microphone, System audio, AI all show **Not connected** (grey).                           |
| 3   | Health panel → Renderer Node access    | Shows **blocked (good)** in green.                                                        |
| 4   | Health panel → IPC round-trip          | Shows a millisecond value; **Re-test IPC** updates it.                                    |
| 5   | Settings → enter a dummy API key, Save | Key shows as present; re-opening the app still shows it present.                          |
| 6   | Settings → clear the key               | Shows as not present.                                                                     |
| 7   | Export Diagnostics                     | Saves a JSON file. Open it: it lists OS build and versions, and contains **no API keys**. |

## Report back

Paste the exported diagnostics JSON here, plus a screenshot of the main window, and note
anything from the table above that did not match. Record results in
`docs/testing/results/` if you want them kept in the repo.
