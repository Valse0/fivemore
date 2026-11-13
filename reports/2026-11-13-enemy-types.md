# Enemy types and Spitter report

**Başlangıç:** 2026-11-13 17:02 Peru
**Bitiş:** 2026-11-13 17:18 Peru
**Toplam:** 16 dakika (Peru)

## Changed files

- `src/config.js`: Walker, Runner, Tank, Spitter, Boss HP/hız/hasar/spawn ağırlığı ve animasyon adı config’e taşındı. Tank 120. saniyede, Runner ve Spitter 60. saniyede spawn havuzuna giriyor. Tank 260 HP ve 22 hız; Boss 2400 HP ve 20 hız. Spitter mesafesi 220, atış menzili 270, aralık 1.6 sn, mermi hasarı 8. Tükürük engelleri geçmez (`spitPassesObstacles: false`). Her tür için sonraki animasyon bağlantısına `attackAnimation: "attack"` alanı var; mevcut çizim yürüme karelerini kullanıyor.
- `src/enemies.js`: Beş tür için ortak pooled spawn/ölüm/draw akışı, Spitter mesafe AI’sı, pooled asit tükürüğü ve 300. saniyede bir defalık Boss spawn’ı eklendi. 150 düşman sınırı korundu. Boss spawn olunca beşinci dakikada run bitmiyor; run Boss yenilince tamamlanıyor.
- `src/obstacles.js`: Tükürük mermilerinin engel içinden geçmesini kontrol eden çizgi-segment testi eklendi.
- `src/scene.js`: Tükürük hasarı oyuncu HP/invulnerability akışına bağlandı; tükürük çizimi ve `?debug=1` ile spawn/zaman debug API’si eklendi.
- `CHANGELOG.md`: Peru saatiyle kayıt eklendi.
- `reports/screenshots/enemy-walker.png`, `enemy-runner.png`, `enemy-tank.png`, `enemy-spitter.png`, `enemy-boss.png`: Her tür için debug spawn görüntüsü.
- `reports/screenshots/enemy-spitter-projectile.png`: Spitter’ın atış yaptığı görüntü.
- `reports/screenshots/enemy-boss-5min.png`: 5:00 zamanında doğan Boss görüntüsü.
- `reports/screenshots/task2-gameplay-after.png`: Eski gameplay betiğinin regresyon ekran görüntüsü.

## Verified

- Playwright Chromium, 390×844; beş tür debug spawn edildi ve her birinin aktif slotu doğrulandı.
- Spitter yaklaşma/koruma: **280 → 263.6 → 246 → 237.5**, sonra yaklaşık **237.5–237.8** aralığında kaldı (hedef 220, durma toleransı 18).
- Spitter geri çekilme: **120 → 137 → 154 → 171.6 → 188.6 → 202.2**; hedef aralığa ulaşınca durdu.
- Spitter mermi attı (aynı anda gözlenen tepe: **1** pooled mermi). HP **100 → 84** düştü; iki tükürük isabeti, config hasarı 8.
- Boss sayısı: **60. saniyede 0**, **300. saniyede 1**, sonraki 400 ms’de **1**; canlı kaldı.
- Havuz sınırı: **150/151** spawn isteği kabul edildi; toplam aktif düşman **150**.
- FPS / yoğunluk ölçümü: **62 FPS · 150 enemies · 1 bullets**. Canvas 390×844, audio `running · gain 0.70`, console errors `[]`.
- Engel kontrolü: `spitPassesObstacles=false`; sabit engel haritasında engeli kesen bir segment tespit edildi ve engel testi `true` döndürdü.
- Önceki Playwright betiği değiştirilmeden çalıştırıldı; HP düşüşü, gem toplama, mermi çizimi, canvas, audio ve konsol kontrolleri geçti.

## Önce/Sonra sayıları verbatim

**Önce** — görev 1’den hemen önceki `after-hurt-fix` Playwright sonucu:

```json
{"viewport":[390,844],"scale":0.7,"movement":{"start":686.51,"after1_5s":617,"decreased":true},"contact":{"before":100000,"enemy":[0,0],"after":"99988 HP","hpAfter":99988,"dropped":true},"bullet":{"draws":20,"screenPositionPx":[195,370],"firstOffsetPx":[0,-52],"muzzleOffsetPx":[0,-28],"muzzleDifferencePx":24},"gem":{"before":0,"after":2,"collected":true,"drawnAtPx":[234.5,415.5],"expectedAtPx":[233.5,422],"differencePx":6.58},"enemies30s":{"first":5,"last":29,"minimum":5,"maximum":29,"largestDrop":0},"canvas":{"rect":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"backing":[390,844],"smoothing":false},"audioAfterTap":"running · gain 0.70","consoleErrors":[]}
```

**Sonra** — `node reports/playwright-gameplay.cjs task2-gameplay-after`:

```json
{"viewport":[390,844],"scale":0.7,"movement":{"start":687.23,"after1_5s":618.43,"decreased":true},"contact":{"before":100000,"enemy":[0,0],"after":"99988 HP","hpAfter":99988,"dropped":true},"bullet":{"draws":20,"screenPositionPx":[195,376],"firstOffsetPx":[0,-46],"muzzleOffsetPx":[0,-28],"muzzleDifferencePx":18},"gem":{"before":0,"after":2,"collected":true,"drawnAtPx":[235.5,419.5],"expectedAtPx":[233.5,422],"differencePx":3.2},"enemies30s":{"first":4,"last":27,"minimum":4,"maximum":27,"largestDrop":0},"canvas":{"rect":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"backing":[390,844],"smoothing":false},"audioAfterTap":"running · gain 0.70","consoleErrors":[]}
```

**Tür/Boss/Spitter debug ölçümlerinin gerçek komut çıktısı:**

```json
{"types":{"walker":{"spawned":true,"type":0,"hp":36,"speed":43,"damage":12,"counts":{"walker":1,"runner":0,"tank":0,"spitter":0,"boss":0}},"runner":{"spawned":true,"type":1,"hp":19,"speed":79,"damage":8,"counts":{"walker":0,"runner":1,"tank":0,"spitter":0,"boss":0}},"tank":{"spawned":true,"type":2,"hp":260,"speed":22,"damage":22,"counts":{"walker":0,"runner":0,"tank":1,"spitter":0,"boss":0}},"spitter":{"spawned":true,"type":3,"hp":30,"speed":34,"damage":8,"counts":{"walker":0,"runner":0,"tank":0,"spitter":1,"boss":0}},"boss":{"spawned":true,"type":4,"hp":2400,"speed":20,"damage":28,"counts":{"walker":0,"runner":0,"tank":0,"spitter":0,"boss":1}}},"spitter":{"angle":0,"startDistance":280,"beforeHP":100,"spitterIndex":0,"hpAfter":84,"distances":[263.6,246,237.5,237.5,237.5,237.8,237.8,237.8,237.6],"maxActiveSpit":1,"hpDrop":16,"retreat":{"start":120,"distances":[137,154,171.6,188.6,202.2,202.2],"retreated":true}},"bossTiming":{"bossAt60":0,"bossAt300":1,"bossAfter400ms":1,"alive":true,"runTime":300.55},"cap":{"accepted":150,"counts":{"walker":150,"runner":0,"tank":0,"spitter":0,"boss":0},"total":150},"perf":{"fps":"62 FPS · 150 enemies · 1 bullets","canvas":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"audio":"Audio: running · gain 0.70"},"errors":[]}
```

## Unverified

- Gerçek iPhone 11 Safari üzerinde fiziksel dokunma kontrolü yapılmadı; doğrulama headless Chromium ile sınırlı.

## Problems

- Önce/sonra eski gameplay betiği rastgele konum/spawn kullandığı için düşman sayısı 5→29’dan 4→27’ye ve koordinat ölçümleri değişti. Kontrollerin hiçbiri başarısız olmadı; testte beklenen artış ve 0 largest drop korundu.
