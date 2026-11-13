# FIVEMORE gameplay changes report — 2026-11-13

Start time: 2026-11-13 20:18:43 UTC
End time: 2026-11-13 20:26:18 UTC
Total duration: 7 minutes 35 seconds (local time: UTC)

## Changed files

- `src/config.js` — aim assist cone 6° → 15°; configured crate, barrel, rock, tree and player collision radii; survivor draw size 64 → 76.
- `src/scene.js` — removed the white inner muzzle flash; directional amber muzzle flare remains.
- `src/obstacles.js` — derives static obstacle circles from the existing deterministic prop cells and applies axis sliding.
- `src/player.js` — moves the survivor with its fixed 14-unit collision radius.
- `src/enemies.js` — moves zombies with their existing body radii against the same obstacle circles.
- `CHANGELOG.md` — timestamped entries for each of the four requested changes.
- `reports/screenshots/baseline.png`, `reports/screenshots/after-repeat.png`, `reports/screenshots/2026-11-13-final-gameplay.png` — Playwright captures at 390×844.
- This report.

Four task commits:

- `3a71858` — Widen aim assist cone to 15 degrees.
- `8c6b980` — Remove white muzzle flash core.
- `9203a2d` — Add static obstacle collision and sliding.
- `3efe4f9` — Increase survivor draw size only.

## Önce/Sonra sayıları (verbatim)

Before, `node reports/playwright-gameplay.cjs baseline`:

```text
{"viewport":[390,844],"scale":0.7,"movement":{"start":682.21,"after1_5s":614.13,"decreased":true},"contact":{"before":100000,"enemy":[0,0],"after":"99988 HP","hpAfter":99988,"dropped":true},"bullet":{"draws":20,"screenPositionPx":[195,352],"firstOffsetPx":[0,-70],"muzzleOffsetPx":[0,-28],"muzzleDifferencePx":42},"gem":{"before":0,"after":2,"collected":true,"drawnAtPx":[236.5,419.5],"expectedAtPx":[233.5,422],"differencePx":3.91},"enemies30s":{"first":5,"last":27,"minimum":5,"maximum":27,"largestDrop":0},"canvas":{"rect":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"backing":[390,844],"smoothing":false},"audioAfterTap":"running · gain 0.70","consoleErrors":[]}
```

After, `node reports/playwright-gameplay.cjs after-repeat`:

```text
{"viewport":[390,844],"scale":0.7,"movement":{"start":687.95,"after1_5s":619.15,"decreased":true},"contact":{"before":100000,"enemy":[0,0],"after":"99988 HP","hpAfter":99988,"dropped":true},"bullet":{"draws":20,"screenPositionPx":[195,370],"firstOffsetPx":[0,-52],"muzzleOffsetPx":[0,-28],"muzzleDifferencePx":24},"gem":{"before":0,"after":1,"collected":true,"drawnAtPx":[236.5,426.5],"expectedAtPx":[233.5,422],"differencePx":5.41},"enemies30s":{"first":5,"last":29,"minimum":5,"maximum":29,"largestDrop":0},"canvas":{"rect":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"backing":[390,844],"smoothing":false},"audioAfterTap":"running · gain 0.70","consoleErrors":[]}
```

Custom aim and obstacle scenario (Playwright 390×844):

```text
{"setup":{"obstacle":{"type":"tree","startX":-408,"endX":-318,"centerX":-288,"clearance":30,"required":28,"crossed":false},"enemyBlock":{"x":-318.41666666667,"centerX":-288,"clearance":30.416666666669983,"required":30,"crossed":false},"AIM_ASSIST_DEG":15,"viewport":[390,844],"marker":466.09999999962747},"bullet":{"samples":23,"best":{"dx":123.99999216624678,"dy":30.999998709133706,"count":21,"angleDeg":14.036243758241934}},"state":{"canvas":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"audio":"running · gain 0.77","smoothing":false},"consoleErrors":[]}
```

The player stopped 30 world units from the tree center where the combined radii require 28; the zombie stopped 30.4167 from the center with required clearance 30. Neither crossed the trunk circle. The target was placed at 14° from the facing direction, inside the 15° cone; the sampled projectile trajectory was 14.0362°.

The baseline muzzle-to-bullet difference improved from 42 px to 24 px. The movement distance decreased by 68.08 before and 68.80 after over 1.5 seconds; contact damage remained 12 HP; the gem was collected; and the largest enemy-count drop in the repeated 30-second run remained 0. An earlier post-change repeat returned `largestDrop:1`, so one transient count drop was observed across randomized runs.

## Verified

- Headless Playwright at 390×844; screenshot: [gameplay and aim/obstacle capture](screenshots/2026-11-13-final-gameplay.png), plus [before](screenshots/baseline.png) and [30-second after](screenshots/after-repeat.png).
- Canvas covers `[0,0,390,844]`; smoothing is false; no application console errors.
- Audio state is `running` after the first game tap.
- The survivor and zombie each stop at the configured circular tree-body boundary. Player movement uses axis-separated resolution so the other axis can continue sliding.
- Muzzle flash white core removed; amber directional light retained. Survivor size is configuration-only; its collider radius remains 14.
- `node --check` passed for `src/obstacles.js`, `src/player.js`, and `src/enemies.js`; `git diff --check` passed.

## UNVERIFIED

- Physical iPhone 11 Safari appearance and touch feel.
- A live projectile passing through an obstacle was not separately instrumented; projectile updates contain no obstacle collision check, so props do not stop bullets.
- White-flash removal was checked in code and the browser capture, not with a pixel-level comparison over every firing animation frame.

## Problems

- Randomized 30-second gameplay once reported `largestDrop:1`; the repeat reported `largestDrop:0`, matching the earlier gameplay report. No persistent mass despawn was observed.

## Phone test

1. On an iPhone, steer into a tree trunk and a rock/barrel/crate; verify the survivor stops at the base and can slide along it.
2. Let a zombie approach a prop and verify it routes around the body; fire through a prop and confirm bullets continue.
3. Observe repeated shots for the directional amber muzzle light and confirm the survivor looks larger without changing contact distance.
