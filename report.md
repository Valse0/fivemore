# Support menu report

## Summary

Added a corner heart button to the main menu that opens a Support screen. The screen includes the requested friendly message, Ko-fi and feedback links opened in a new tab with safe rel attributes, and a Back button. Link URLs are centralized in `src/links.js`; the SVG heart button is created by a reusable helper in `src/support.js`.

## Changed files

- `index.html` — added the Support screen and main-menu heart mount point.
- `styles.css` — styled the 52px heart control and responsive support layout in the existing menu palette.
- `src/main.js` — wires the reusable button, support navigation, and configured links.
- `src/links.js` — stores both external URLs.
- `src/support.js` — exports the reusable accessible heart button factory.
- `CHANGELOG.md` — recorded the support menu change.

## Commands run

- `cat AGENTS.md`, `cat docs/GAME_DESIGN.md`, and `cat .agents/skills/frontend-design/SKILL.md` — succeeded; read project rules, design decisions, and required design guidance.
- `sed` and `cat` on `index.html`, `styles.css`, `src/main.js`, `src/audio.js`, `CHANGELOG.md`, and `report.md` — succeeded; inspected the existing menu and audio settings.
- `mkdir -p src reports` — succeeded.

## Problems and errors (exact text)

None.

## How to test on iPhone

At 390 × 844 in Safari, tap the corner heart and confirm the Support screen opens. Check that both external buttons are at least 48px tall and open the configured Ko-fi and Tally pages in separate tabs. Tap Back and confirm the main menu returns. Confirm the heart remains inset within the safe area.

## Suggested next step

Add the requested quiet procedural menu loop, keeping it behind the existing tap gate and music settings.
