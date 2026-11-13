Start time: 2026-11-13 17:07:52 UTC
End time: 2026-11-13 17:28:30 UTC
Total duration: 20 minutes 38 seconds (local time: UTC)

# FIVEMORE hata.md düzeltme raporu — 2026-11-13

## Kök neden

Oyuncu ve düşman mantığı aynı dünya koordinatlarında çalıştığı için otomatik ölçümde düşmanın yaklaşması ve temas hasarı zaten gerçekleşiyordu; 1 ve 2 numaralı maddeler mantık hatası olarak yeniden üretilemedi. Çizim tarafında kamera ekran merkezine taşınıp `WORLD_SCALE` uygulanırken düşman, mermi, gem ve parçacık koordinatları ayrıca oyuncuya göre kaydırılıp viewport'un yarısı ekleniyordu. Bu ikinci kaydırma nesneleri ekrandan uzaklaştırıyor; merminin namludan kopuk görünmesine, gem ile toplama yerinin farklı görünmesine ve culling'in düşmanları kaybediyormuş gibi göstermesine yol açıyordu. Kamera dönüşümü tek bir dünya transformunda birleştirildi; nesneler artık dünya koordinatlarında çiziliyor. Zemin titreşimi için aynı yuvarlanmış kamera tile hesabına da verildi.

Bulanıklığın kod kökü `devicePixelRatio` değerinin `Math.floor` ile kesilmesiydi: kesirli DPR'de düşük çözünürlüklü backing store CSS alanına büyütülüyordu. DPR'nin kesirli değeri korundu ve çizim koordinatları/ölçüleri fiziksel piksel oranına göre yuvarlanıyor.

## Changed files

- `src/config.js` — ortak dünya transformu ve DPR farkındalıklı piksel yuvarlama.
- `src/scene.js` — tek kamera konumu, stabil tile hesabı, çoğunlukla çim kullanan deterministik toprak yamaları, kesirli DPR backing store.
- `src/enemies.js`, `src/weapons.js`, `src/xp.js`, `src/particles.js` — dünya koordinatlarında çizim; mermi namlu başlangıcı.
- `reports/playwright-gameplay.cjs` — 390×844 otomatik oynanış ölçüm betiği.
- `reports/screenshots/before-final.png` — düzeltme öncesi oynanış görüntüsü.
- `reports/screenshots/after.png` — düzeltme sonrası oynanış görüntüsü.
- `reports/screenshots/scale-0.6-dpr-2.75.png` — ölçek ve kesirli DPR render görüntüsü.
- `CHANGELOG.md` — dört düzeltme commit'i için saatli kayıt.
- Bu rapor.

## Önce/Sonra test sayıları (verbatim)

Düzeltme öncesi, `node reports/playwright-gameplay.cjs before-final`:

```text
{"viewport":[390,844],"scale":0.7,"movement":{"start":688.66,"after1_5s":620.58,"decreased":true},"contact":{"before":100000,"enemy":[0,0],"after":"99988 HP","hpAfter":99988,"dropped":true},"bullet":{"draws":20,"screenPositionPx":[390,820],"firstOffsetPx":[195,398],"muzzleOffsetPx":[0,-28],"muzzleDifferencePx":468.51},"gem":{"before":0,"after":1,"collected":true},"enemies30s":{"first":5,"last":30,"minimum":5,"maximum":30,"largestDrop":0},"canvas":{"rect":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"backing":[390,844],"smoothing":false},"audioAfterTap":"running · gain 0.70","consoleErrors":[]}
```

Düzeltme sonrası, `node reports/playwright-gameplay.cjs after`:

```text
{"viewport":[390,844],"scale":0.7,"movement":{"start":688.66,"after1_5s":620.58,"decreased":true},"contact":{"before":100000,"enemy":[0,0],"after":"99988 HP","hpAfter":99988,"dropped":true},"bullet":{"draws":20,"screenPositionPx":[195,370],"firstOffsetPx":[0,-52],"muzzleOffsetPx":[0,-28],"muzzleDifferencePx":24},"gem":{"before":0,"after":1,"collected":true,"drawnAtPx":[231,416],"expectedAtPx":[233.5,422],"differencePx":6.5},"enemies30s":{"first":5,"last":29,"minimum":5,"maximum":29,"largestDrop":0},"canvas":{"rect":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"backing":[390,844],"smoothing":false},"audioAfterTap":"running · gain 0.70","consoleErrors":[]}
```

Çizim kontrolü, 390×844, `?scale=0.6`, DPR 2.75:

```text
{"scale":"0.6","viewport":[390,844],"canvas":{"rect":[390,844],"backing":[1073,2321],"devicePixelRatio":2.75,"smoothing":false},"audio":"running · gain 0.90","consoleErrors":[]}
```

Ön/son bullet ekran farkı 468.51 px'ten 24 px'e indi; gem çizimi beklenen noktanın 6.5 px yakınında ve XP 0'dan 1'e yükseldi. Düşman mesafesi 68.08 birim azaldı; temas 12 HP götürdü. 30 saniyede en büyük düşman sayısı düşüşü her iki koşuda da 0 oldu. Her test koşusunda oyuncu sabit tutularak run'un erken bitmesini önlemek için HP 100000 ayarlandı.

## Verified

- 390×844 canvas tam ekran alanını kapladı; uygulama konsol hatası yok.
- İlk kullanıcı dokunuşundan sonra AudioContext durumu `running`.
- WORLD_SCALE 0.7 oynanış ölçümleri ve ölçek 0.6 / DPR 2.75 render kontrolü tamamlandı.
- Görüntüler: [önce](screenshots/before-final.png), [sonra](screenshots/after.png), [0.6 ölçek / DPR 2.75](screenshots/scale-0.6-dpr-2.75.png).
- `node --check` değişen JavaScript modüllerinde ve Playwright betiğinde geçti; `git diff --check` geçti.
- Düzeltmeler ayrı commit'lerde: `82dd2e2`, `282fcdd`, `f5828e3`, `b7c6b53`.

## UNVERIFIED

- Fiziksel iPhone 11 Safari'de dokunmatik ve görsel kontrol yapılmadı.
- 24 px mermi/namlu farkı Playwright'ın ilk çizilen mermi örneğidir; gerçek cihazda görsel yakınlık ayrıca kontrol edilmeli.

## Problems

- hata.md madde 9 (müzik) bu görev kapsamı dışında bırakıldı.
- İlk 5 madde için mantık hatası (düşmanın uzaklaşması, temas hasarının işlememesi, XP'nin toplanmaması veya 30 saniyede düşman silinmesi) ölçümde görülmedi. Ortak çizim koordinatı kayması görsel semptomları oluşturuyordu.

## Telefonda test

1. iPhone Safari'de oyunu başlatıp düşmanların yaklaşmasını, temas hasarını ve otomatik mermi/gem hizasını kontrol et.
2. Hareket ederken tile titreşmesi, ara sıra toprak yamaları ve karakter netliğini gözle.
3. 0.6 ölçek bağlantısını ve varsayılan 0.7 ölçeği karşılaştır.
