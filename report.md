# Current report — 2026-11-13 20:18–20:26 UTC

The latest gameplay work is documented in [the detailed aim, obstacle and survivor-size report](reports/2026-11-13-aim-obstacles-visual-size.md). Four task commits widened aim assist to 15°, removed the white inner muzzle flash, added circular prop collision for players and zombies, and increased survivor draw size while keeping its collider fixed.

Playwright verification ran at 390×844. The player stopped 30 world units from the tested tree center (28 required), the zombie stopped 30.4167 units away (30 required), and the bullet trajectory toward a target at 14° measured 14.0362°. Canvas size, audio startup, enemy approach, contact damage, gem pickup, and the 30-second enemy-count check were also recorded with verbatim output in the detailed report. One randomized repeat showed a largest enemy-count drop of 1; the documented repeat showed 0.

Screenshots: [baseline](reports/screenshots/baseline.png), [gameplay with aim and obstacle scenario](reports/screenshots/2026-11-13-final-gameplay.png), and [30-second repeat](reports/screenshots/after-repeat.png).

**UNVERIFIED:** Physical iPhone 11 Safari behavior. Live projectile pass-through was not separately instrumented; projectile code has no obstacle collision check.

Earlier work: [coordinate bug-fix measurements](reports/2026-11-13-coordinate-bug-fixes.md), [v2 asset import report](reports/2026-11-13-v2-assets-import.md).
