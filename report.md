# Combat core report — 2026-11-13

## Summary

Part A reworks the procedural soundtrack to a 104 BPM, 28-bar (about 64.6 s) synthwave loop in A minor, with Am–F–C–G bass, kick/snare/hat rhythm, a bar 9 motif, and bar 17 pad. The existing start/stop, volume, gesture gate, fade, and mute wiring remain in place.

Part B adds up to 150 pooled Walker and Runner enemies, wave-scaled spawning, player contact damage and brief invulnerability, nearest-target pistol fire, pooled bullets and XP gems, XP leveling, HUD, run timer, death/retry/menu screen, five-minute survival placeholder, and `?debug=1` enemy/bullet counts. The existing menu content and navigation remain in place.

The extra Runner tint is derived from the Kenney zombie sprite. No audio files, frameworks, or external art were added. Gem art uses the explicitly permitted tiny code-drawn fallback; bullet art is a 2 × 6 px tracer.

## Skills used

- **game-engine:** Kept the existing `requestAnimationFrame` loop and fixed 1/60 s simulation step with capped elapsed time; used fixed-capacity enemy, bullet, and gem pools; capped active enemies at 150; rebuilt a fixed-size spatial hash for contact and projectile broad-phase checks; retained pointer-based touch input and user-gesture audio startup; kept update and draw work bounded by pool capacities.
- **frontend-design:** Kept HUD labels short and task-focused; used high-contrast meter fills and restrained colors drawn from the existing game palette; placed controls against iPhone safe-area insets; made game-end actions explicit and touch-sized; limited the new overlay and toast to actionable state changes.

## Changed files

- `src/music.js` — procedural rhythm, bass, lead, pad, and compressor arrangement.
- `src/enemies.js` — Walker/Runner stats, pool, ring spawning, hash grid, and sprite rendering.
- `src/weapons.js` — nearest-target pistol, pooled bullets, collision and tracer rendering.
- `src/xp.js` — pooled drops, magnet pickup, leveling, toast timing, and gem rendering.
- `src/player.js` — player HP and invulnerability state.
- `src/hud.js` — run HUD and end-screen updates.
- `src/scene.js` — game loop integration, damage, run timing, rendering, and debug counts.
- `src/main.js` — reusable support heart on both the menu and run-end screen.
- `index.html` — game HUD, toast, and run-end controls.
- `styles.css` — phone-safe HUD and run-end presentation.
- `CHANGELOG.md` — Part A and Part B entries.
- `report.md` — copy of this report.

## Commands run

- Read `AGENTS.md`, `docs/GAME_DESIGN.md`, `assets/SPRITES.md`, `.agents/skills/game-engine/SKILL.md`, and `.agents/skills/frontend-design/SKILL.md`.
- Inspected existing source, menu, styles, and Kenney sprite inventory.
- `node --check` on `src/music.js`, `src/scene.js`, `src/enemies.js`, `src/weapons.js`, `src/xp.js`, `src/hud.js`, and `src/main.js` — succeeded.
- `git diff --check` — succeeded.
- `file` on Kenney tile images — succeeded.
- Attempted a Python/Pillow image check — failed; see exact error below.
- Part A commit: `ab8a323` (`Rework procedural synthwave music`).

## Problems and errors (exact text)

The optional Python image-inspection command failed because Pillow is not installed:

```text
ModuleNotFoundError: No module named 'PIL'
```

The selected tile was not suitable as an XP gem, so the implementation uses the request's tiny code-drawn gem fallback. No other command errors occurred. Browser and physical iPhone playtesting have not been run.

## How to test on iPhone

1. Open the static game in Safari and tap Play. Drag in the lower half of the screen and confirm movement while the survivor remains centered.
2. Wait for enemies to enter from beyond the screen edges. Confirm Walkers approach, the smaller tinted Runners begin appearing after 1:00, and the pistol fires automatically toward the nearest visible target.
3. Let an enemy touch the player. Confirm the HP bar decreases and the player flashes during the short invulnerability window.
4. Move near a dropped gem. Confirm it is pulled toward the player, collected, and advances the XP meter; collect enough to see the level-up toast.
5. Confirm the HUD remains inside the top safe area, the pause button remains reachable, and the joystick responds without scrolling the page.
6. For a quick end-screen check, allow HP to reach zero; verify time and kills, Try again, Menu, and the support heart. A full run should show “You survived” at 5:00.
7. Open with `?debug=1` and verify FPS plus active enemy and bullet counts; without it, the counter should be hidden.
8. On the menu, start audio with a tap; listen for the beat and layered entrances, then check volume and mute in Settings.

## Suggested next step

Playtest enemy pacing, damage, and pickup feel on iPhone Safari, then tune those values before adding cards and the 5:00 boss encounter.
