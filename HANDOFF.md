# HANDOFF

## Faz durumu
- FAZ 1 - tamamlandı
- FAZ 2 - sürüyor (2.1–2.3 tamam; 2.4 kısmi, iki deneme sınırında durduruldu)
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
- FAZ 2.4 kısmi: breakable prop, bullet hit, barrel blast, crate health pickup ve animasyon kodu eklendi; crate'in üç mermiyle kırılması 2 Playwright denemesinde doğrulanamadı. Bu yüzden 2.4 bitmiş sayılmıyor.

## Sıradaki adım
- Devralma adımı: FAZ 2.4'te atış testini deterministik hale getirip crate'e üç mermi ulaştığını ve kırılma/pickup çıktısını doğrula; ardından barrel 2 vuruş/patlama/oyuncu+düşman hasarı/yanık izini ve rock/tree mermi geçişini doğrula. Bu çalıştırmada iki denemeden sonra duruldu.

## Bilinen sorunlar
- FAZ 2.4 crate'in üç vuruş sonrası kırılması ve pickup akışı doğrulanmadı; son ölçümde crate 1 HP ile aktif kaldı.
- FAZ 2.4 barrel hasarı/pickup, patlama animasyonu/yanık izi ve kaya/ağaç mermi geçişi UNVERIFIED.
- Fiziksel iPhone 11 Safari doğrulaması raporlarda UNVERIFIED.
- Playwright/Chromium test bağımlılığı bu ortamda `/tmp/fivemore-pw` ve kullanıcı cache'ine kuruldu; repoya bağımlılık eklenmedi.

## Son test çıktısı
Son standart doğrulama `node reports/playwright-gameplay.cjs phase2-4-after` çıkış kodu 0:

```text
{"viewport":[390,844],"scale":0.7,"movement":{"start":682.21,"after1_5s":612.7,"decreased":true},"contact":{"before":100000,"enemy":[0,0],"after":"99988 HP","hpAfter":99988,"dropped":true},"bullet":{"draws":20,"screenPositionPx":[195,388],"firstOffsetPx":[0,-34],"muzzleOffsetPx":[0,-28],"muzzleDifferencePx":6},"gem":{"before":0,"after":0,"collected":false,"drawnAtPx":[235.5,421.5],"expectedAtPx":[233.5,422],"differencePx":2.06},"enemies30s":{"first":5,"last":7,"minimum":5,"maximum":7,"largestDrop":0},"canvas":{"rect":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"backing":[390,844],"smoothing":false},"audioAfterTap":"running · gain 0.70","consoleErrors":[]}
```

Failed targeted shot test: first crate test exited 1 with `Error: crate was not destroyed`.
Second targeted diagnostic output:

```text
{"viewport":[390,844],"start":{"obj":{"x":96,"y":96,"health":3},"enemyIndex":0,"enemy":{"x":236,"y":96,"active":true},"player":{"x":36,"y":96,"angle":0}},"state":{"crate":{"health":1,"active":true,"destroyed":false},"enemy":{"hp":10000,"active":true},"bullets":0,"hp":"52 HP"}}
```

Screenshots: `reports/screenshots/phase2-4-after.png`, `reports/screenshots/phase2-4-crate-diagnostic.png`.
