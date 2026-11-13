# HANDOFF

## Faz durumu
- FAZ 1 - sürüyor (1.1, 1.2 tamam; 1.3 sıradaki)
- FAZ 2 - bekliyor
- FAZ 3 - bekliyor
- FAZ 4 - bekliyor

## Yapılanlar
- Plan/Gemini yönergesi/backlog oluşturuldu (commit `d54fb48`).
- FAZ 1.1: oyuncu dururken yürüme animasyonu 1. karede sabit; hareket ederken döngü, ölümde son kare. Hasar tint/geri tepme ayarları zaten config'de mevcuttu.
- FAZ 1.2: ateş etme görünür dünya alanında en az bir aktif düşman olduğunda tetikleniyor; hedef adayı da ekranda olan düşmanlarla sınırlı.

## Sıradaki adım
- FAZ 1.3: config tabanlı arena sınırları, kenar görünümü, spawn sıkıştırma ve props.

## Bilinen sorunlar
- Başlangıç Playwright denemesinde modül eksikti; Playwright/Chromium `/tmp/fivemore-pw` ve kullanıcı cache'ine kuruldu (repoya bağımlılık eklenmedi).
- Mermi/namlu farkı son standart ölçümde 6 px; FAZ 1.4'te tekrarlanabilir başlangıç konumu uygulanacak.
- Fiziksel iPhone 11 Safari doğrulaması raporlarda UNVERIFIED.

## Son test çıktısı
FAZ 1.2 özel boş ekran Playwright çıkış kodu 0:

```text
{"viewport":[390,844],"noVisibleEnemies":true,"bulletsAfter2_3s":0,"hp":"76 HP","consoleErrors":[]}
```

Standart oyun ölçümü `node reports/playwright-gameplay.cjs phase1-2-after` çıkış kodu 0:

```text
{"viewport":[390,844],"scale":0.7,"movement":{"start":685.08,"after1_5s":612.7,"decreased":true},"contact":{"before":100000,"enemy":[0,0],"after":"99988 HP","hpAfter":99988,"dropped":true},"bullet":{"draws":20,"screenPositionPx":[195,388],"firstOffsetPx":[0,-34],"muzzleOffsetPx":[0,-28],"muzzleDifferencePx":6},"gem":{"before":0,"after":1,"collected":true,"drawnAtPx":[235.5,419.5],"expectedAtPx":[233.5,422],"differencePx":3.2},"enemies30s":{"first":5,"last":29,"minimum":5,"maximum":29,"largestDrop":0},"canvas":{"rect":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"backing":[390,844],"smoothing":false},"audioAfterTap":"running · gain 0.70","consoleErrors":[]}
```

Screenshot: `reports/screenshots/phase1-2-after.png`; boş ekran: `reports/screenshots/phase1-2-no-enemies.png`.
