# Hurt animation and white flash report

**Başlangıç:** 2026-11-13 16:49 Peru
**Bitiş:** 2026-11-13 17:02 Peru
**Toplam:** 13 dakika (Peru)

## Changed files

- `src/config.js`: Hurt tint süresi `0.15` sn, tint alpha `0.45`, geri tepme `6` dünya birimi olarak ayarlandı.
- `src/player.js`: Hasar tepkisi eklendi; oyuncuyu engel çarpışmasını kullanan `moveCircle` ile geri iter.
- `src/scene.js`: Invulnerability artık yere yatık hurt karesini seçmiyor veya oyuncuyu yanıp söndürmüyor. Normal yürüme/idle karesi korunuyor; hasar boyunca kırmızı tint çiziliyor. Namlu efektinin mevcut yönlü amber davranışı değiştirilmedi.
- `CHANGELOG.md`: Peru saatiyle tek satır eklendi.
- `reports/screenshots/baseline-hurt-before.png`: Başlangıç Playwright ekran görüntüsü.
- `reports/screenshots/after-hurt-fix.png`: Hasar tint’i görünürken alınan 390×844 ekran görüntüsü.

## Flash kaynağının ayrıştırılması

- **Muzzle:** V2 çizim yolunda muzzle sprite’ı çizilmiyor; Playwright kaydında `muzzle` çizim sayısı `0`. Bu, görülen karakter flaşının kaynağı değil. Yönlü amber fallback korunuyor.
- **Hit spark:** Zorlanmış mermi isabetinde spark merkezleri oyuncu merkezinden yaklaşık 44–59 px uzakta çizildi; 76 dünya birimlik oyuncu sprite’ının ekrandaki yarı genişliği 26.6 px. Spark oyuncu sprite’ının üstüne gelmedi.
- **Hasar tepkisi:** Önceki renderer `invulnerable` durumunda `count - 2` hurt karesini seçip sprite alpha’sını yanıp söndürüyordu. Sabit/yere yakın pozun kaynağı bu dal. Bu dal kaldırıldı; hasar görüntüsü normal animasyon karesi ve kırmızı tint oldu.

## Verified

- Playwright Chromium, 390×844, `scale=0.7`.
- Hasar anında çizilen örnek kareler `0–5` arasından; ölçümde tint süresince kare `3` ve `4` kaydedildi. Bunlar normal animasyon aralığında; özel `count - 2` hurt karesi seçilmedi.
- Tint süresi config’de `0.15` sn; kare çizim kaydında görünür tint penceresi yaklaşık `0.15` sn.
- Hasar sırasında hareket sürdü: testte oyuncu `x=3` konumundan hasar sonrası `x=78` konumuna ilerledi; geri tepme `6` birim olarak uygulandı.
- Önceki gameplay Playwright betiği değişmeden önce ve sonra çalıştırıldı. Her ikisinde de HP düşüşü 12, düşman sayısı artışı sürüyor, canvas 390×844, smoothing kapalı, audio durumu running ve console error sayısı 0.
- Son screenshot: [after-hurt-fix.png](screenshots/after-hurt-fix.png)

## Önce/Sonra sayıları verbatim

**Önce** — `node reports/playwright-gameplay.cjs baseline-hurt-before`

```json
{"viewport":[390,844],"scale":0.7,"movement":{"start":678.63,"after1_5s":609.83,"decreased":true},"contact":{"before":100000,"enemy":[0,0],"after":"99988 HP","hpAfter":99988,"dropped":true},"bullet":{"draws":20,"screenPositionPx":[195,315],"firstOffsetPx":[0,-107],"muzzleOffsetPx":[0,-28],"muzzleDifferencePx":79},"gem":{"before":0,"after":1,"collected":true,"drawnAtPx":[236.5,426.5],"expectedAtPx":[233.5,422],"differencePx":5.41},"enemies30s":{"first":5,"last":29,"minimum":5,"maximum":29,"largestDrop":0},"canvas":{"rect":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"backing":[390,844],"smoothing":false},"audioAfterTap":"running · gain 0.70","consoleErrors":[]}
```

**Sonra** — `node reports/playwright-gameplay.cjs after-hurt-fix`

```json
{"viewport":[390,844],"scale":0.7,"movement":{"start":686.51,"after1_5s":617,"decreased":true},"contact":{"before":100000,"enemy":[0,0],"after":"99988 HP","hpAfter":99988,"dropped":true},"bullet":{"draws":20,"screenPositionPx":[195,370],"firstOffsetPx":[0,-52],"muzzleOffsetPx":[0,-28],"muzzleDifferencePx":24},"gem":{"before":0,"after":2,"collected":true,"drawnAtPx":[234.5,415.5],"expectedAtPx":[233.5,422],"differencePx":6.58},"enemies30s":{"first":5,"last":29,"minimum":5,"maximum":29,"largestDrop":0},"canvas":{"rect":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"backing":[390,844],"smoothing":false},"audioAfterTap":"running · gain 0.70","consoleErrors":[]}
```

## Unverified

- Gerçek iPhone 11 Safari üzerinde fiziksel dokunma ve görsel kontrol yapılmadı; doğrulama headless Chromium ile sınırlı.

## Problems

- Önce/sonra gameplay sayı betiği rastgele spawn ve konum kullandığından hareket, mermi, gem koordinatları farklı çıktı. HP düşüşü, düşman sayısı ve tarayıcı kontrolleri bozulmadı.
- `reports/playwright-gameplay.cjs` değiştirilmedi.
