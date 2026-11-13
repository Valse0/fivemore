# Support menu report

## Summary

Added a corner heart button to the main menu that opens a Support screen with the requested message, Ko-fi and feedback links, and a Back button. External links open in new tabs with `noopener noreferrer`. The URLs live together in `src/links.js`, and `src/support.js` exports a reusable SVG heart button factory.

Added a quiet procedural menu loop using Web Audio oscillators in `src/music.js`. It starts through the existing first pointer gesture and passes through the persisted music volume and mute controls.

The work was committed in two parts: `ff7d303` (`feat: add support menu screen`) and a separate music commit.

## Changed files

- `index.html` — Support screen and main-menu heart mount point.
- `styles.css` — heart control and support screen styles, matching the existing menu palette and respecting the page safe-area padding.
- `src/main.js` — wires support navigation, the reusable heart button, and configured URLs.
- `src/links.js` — stores both external URLs.
- `src/support.js` — reusable, accessible SVG heart button factory.
- `src/audio.js` — starts menu music after the existing gesture gate.
- `src/music.js` — quiet 30-second procedural loop.
- `CHANGELOG.md` — one entry for each part.
- `reports/2026-11-13-support-menu.md` and `report.md` — this report and its root copy.

## Commands run

- `cat AGENTS.md`, `cat docs/GAME_DESIGN.md`, and `cat .agents/skills/frontend-design/SKILL.md` — succeeded; read project rules, design decisions, and required design guidance.
- `sed` and `cat` on `index.html`, `styles.css`, `src/main.js`, `src/audio.js`, `CHANGELOG.md`, and `report.md` — succeeded; inspected the existing menu and audio settings.
- `mkdir -p src reports` — succeeded.
- `git diff --check` — succeeded with no whitespace errors.
- `git add ... && git commit -m "feat: add support menu screen"` — succeeded; created commit `ff7d303`.
- `cat > src/music.js`, `apply_patch` on `src/audio.js`, and `cat >> CHANGELOG.md` — succeeded; added the second part.
- `git diff --check` — succeeded after both parts were in place.
- `git add ... && git commit -m "feat: add procedural menu music"` — succeeded; committed the second part separately.
- `cmp report.md reports/2026-11-13-support-menu.md` — succeeded; both report copies match.
- `git log -2 --oneline` and `git status --short --branch` — succeeded; confirmed both commits and a clean worktree.
- `git diff HEAD^ --check` — succeeded with no whitespace errors in the second commit.

## Problems and errors (exact text)

None.

## How to test on iPhone

At 390 × 844 in Safari, tap the corner heart and check that Support opens with the friendly line, two large buttons, and Back. Confirm Ko-fi and Tally open in separate tabs. Then return home and make the first tap: confirm quiet music begins. Open Settings, lower Music to 0 and confirm it becomes silent; raise it again, enable Mute audio and confirm the loop is silent. Reload and verify stored settings still control playback. Check the layout stays within the safe-area insets.

No physical iPhone test was run.

## Suggested next step

Replace the procedural placeholder with a locally hosted CC0 menu track when one is selected.
