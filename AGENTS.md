# AGENTS.md — FIVEMORE

Read this file fully before changing anything. Follow it strictly.

## Project
FIVEMORE is a vertical (portrait) survivors-like zombie game for the web (itch.io), later possibly wrapped as an APK.
- Player moves with one finger (touch drag / virtual joystick). Attacks are automatic.
- Kill zombies -> they drop XP gems -> collect gems -> level up -> pick 1 of 3 upgrade cards.
- One run lasts 5 minutes. A boss appears at the end. Dying or winning gives gold for permanent upgrades.
- Hook (draft, may change): cards transform the player's single main weapon instead of adding many weapons.

Game decisions are tracked in [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md). Read it before changing game rules.

## Skills
- `skills/frontend-design/SKILL.md` guides distinctive UI design and responsive design critique.
- `skills/game-engine/SKILL.md` and its references guide browser game APIs, touch input, rendering, audio, and publishing.
- `.agents/skills/` provides aliases to these same skill folders for Codex skill discovery.

## Tech rules
- Plain HTML + CSS + JavaScript (ES modules). No build step, no frameworks, no external libraries unless the owner asks.
- Rendering: Canvas 2D. Portrait layout, scale to fit phone screens (target iPhone 11 Safari).
- Must run by opening index.html on a static host (itch.io HTML5 zip).
- Performance: max ~150-200 active enemies, use object pooling, no per-frame allocations in hot loops.
- Touch first. Desktop keyboard (WASD) is optional and secondary.

## Art rules (important)
- Use ONLY sprites from assets/graphs/ (Kenney Top-down Shooter, CC0). Keep license file.
- Do NOT draw, generate, or invent new art. Do NOT use random emoji or geometric placeholders as final art.
- Use only the zombie/survivor/tile sprites that exist. If a needed sprite is missing, ask the owner.

## Enemies (first draft)
- Walker: medium HP, medium speed.
- Runner: low HP, very fast, comes in groups.
- Tank: very high HP, slow.
- Spitter: low HP, slow, keeps distance and shoots.
- Boss: huge HP, slow, appears at minute 5.

## Code structure
src/
  main.js        game loop, setup
  input.js       touch/joystick
  player.js
  enemies.js     types + spawning
  weapons.js
  xp.js          gems + level up
  cards.js       upgrade cards
  ui.js          HUD, menus
  meta.js        gold + permanent upgrades (localStorage)

## Working rules
- Do ONE task per request. Do not rewrite files that are not part of the task.
- Never change working code "to improve it" unless asked.
- After each task: list changed files and what to test on a phone.
- Keep a short changelog in CHANGELOG.md (date + one line).
- If a request is unclear, ask one short question before coding.
- Missing variants: derive from existing sprites via tint/scale/flip. Never draw new art.
