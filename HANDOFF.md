# HANDOFF

## Faz durumu
- FAZ 1 - tamamlandı
- FAZ 2 - tamamlandı
- FAZ 3 - bekliyor
- FAZ 4 - bekliyor

## Yapılanlar
- Plan/Gemini yönergesi/backlog oluşturuldu (commit `d54fb48`).
- FAZ 1.1: oyuncu dururken yürüme animasyonu 1. karede sabit; hareket ederken döngü, ölümde son kare. Hasar tint/geri tepme ayarları zaten config'de mevcuttu.
- FAZ 1.2: ateş etme görünür dünya alanında en az bir aktif düşman olduğunda tetikleniyor; hedef adayı da ekranda olan düşmanlarla sınırlı.
- FAZ 1.3: 1600×2000 dünya alanı; player/enemy movement ve spawns sınır içinde; objeler kenardan içeride; görünür arena çerçevesi.
- FAZ 1.4: mermi ve muzzle aynı `WEAPON_MUZZLE_OFFSET` config değerini kullanıyor; ölçülen konum farkı 6 px.
- FAZ 2.1: owner asset deposu `/tmp/fivemore-owner-assets` içine ayrı klonlandı; mevcut index ile karşılaştırılıp 14 yeni sprite + 5 manifest eklendi, index manifest değerleriyle güncellendi. `unsorted/` ve API anahtarı dosyalarına dokunulmadı.
- FAZ 2.2: Walker/Runner/Tank/Spitter/Boss temas hasarı verdiğinde manifest'te tanımlı attack sprite kareleri ve FPS kullanılıyor; temas veya hasar yokken yürüme animasyonu sürüyor.
- FAZ 2.3: tükürük oyuncuya veya engellere çarptığında mermi siliniyor ve manifest'teki acid-splat 0–3 / 10 FPS animasyonu 0.4 sn gösteriliyor.
- FAZ 2.4: crate 3 vuruşta kırılır ve 25 HP pickup verir; barrel 2 vuruşta patlar, 120 birim içinde 45 hasar verir, patlama sprite'ı ve kalıcı yanık izi gösterir. Kaya/ağaç mermiyi engellemez.

## Sıradaki adım
- Sıradaki çalıştırma: FAZ 3.1 (HP, XP/seviye çubuğu ve süreyi mevcut yerleşim/duraklatma kontrolünü koruyarak piksel stili çiz).

## Bilinen sorunlar
- Fiziksel iPhone 11 Safari doğrulaması raporlarda UNVERIFIED.
- Playwright/Chromium test bağımlılığı bu ortamda `/tmp/fivemore-pw` ve kullanıcı cache'ine kuruldu; repoya bağımlılık eklenmedi.

## Son test çıktısı
Son standart doğrulama `node reports/playwright-gameplay.cjs phase2-4-final` çıkış kodu 0:

```text
{"viewport":[390,844],"scale":0.7,"movement":{"start":686.51,"after1_5s":617.71,"decreased":true},"contact":{"before":100000,"enemy":[0,0],"after":"99988 HP","hpAfter":99988,"dropped":true},"bullet":{"draws":20,"screenPositionPx":[195,388],"firstOffsetPx":[0,-34],"muzzleOffsetPx":[0,-28],"muzzleDifferencePx":6},"gem":{"before":0,"after":0,"collected":false,"drawnAtPx":[233.5,415.5],"expectedAtPx":[233.5,422],"differencePx":6.5},"enemies30s":{"first":5,"last":7,"minimum":5,"maximum":7,"largestDrop":0},"canvas":{"rect":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"backing":[390,844],"smoothing":false},"audioAfterTap":"running · gain 0.70","consoleErrors":[]}
```

Targeted proof and final screenshots: `reports/2026-11-13-phase2-4-resumed.md` and `reports/screenshots/phase2-4-crate-verified.png`, `reports/screenshots/phase2-4-barrel-verified.png`, `reports/screenshots/phase2-4-pass-through.png`.
