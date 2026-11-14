# HANDOFF

## Faz durumu
- FAZ 1 - tamamlandı
- FAZ 2 - tamamlandı
- FAZ 3 - tamamlandı (FAZ 3.1 ve 3.2 uygulandı)
- FAZ 4 - bekliyor

## Yapılanlar
- Plan/Gemini yönergesi/backlog oluşturuldu (commit `d54fb48`).
- FAZ 1.1 - 1.4 tamamlandı.
- FAZ 2.1 - 2.4 tamamlandı.
- FAZ 3.1: HP bar, XP/seviye barı ve süre piksel stiline getirildi; survivor ve zombi animasyon kare aralıkları `config.js` içine taşındı; flaş kaldırıldı; arena yüksekliği 2800'e çıkarıldı.
- FAZ 3.2: Ana menü piksel stil başlık, arkada v2 zemin (`grass_tiles_spritesheet`) ve v2 survivor/zombi sprite'ları (`survivor_refined_spritesheet`, `walker_refined_spritesheet`), büyük dokunmatik butonlar (56px) ile yeniden tasarlandı.

## Sıradaki adım
- Sıradaki çalıştırma: FAZ 4.1 (Seviye atlayınca oyunun durması ve 3 piksel stil stat kartı sunulması).
- Başlamadan `AGENTS.md`, `docs/GAME_DESIGN.md`, `docs/MASTER_PLAN.md` ve bu dosyayı oku.

## Devralan ajan için başlangıç notu
- FAZ 2 tamamlandı; 2.4'ü yeniden yapma. Son kanıt: `reports/2026-11-13-phase2-4-resumed.md`.
- Bu çalıştırmada yalnızca FAZ 3.1'i yap ve tamamlayınca dur; 3.2 bir sonraki çalıştırma.
- Başlamadan `AGENTS.md`, `docs/GAME_DESIGN.md`, `docs/MASTER_PLAN.md` ve bu dosyayı oku. HUD işi için `.agents/skills/frontend-design/SKILL.md` ve `.agents/skills/game-engine/SKILL.md` dosyalarının mevcut olup olmadığını kontrol et; varsa yönergeleri uygula.
- Mevcut HUD: `index.html` içindeki `#game .game-hud` markup'ı; `src/hud.js` süre/HP/XP/seviye değerlerini DOM'a güncelliyor; `styles.css` mevcut yerleşim ve görünümü tanımlıyor. Stil şu anda monospace metin, kırmızı HP barı ve yeşil XP barı. `#pause-game` 48×48 px.
- 3.1'de HP, XP/seviye ve timer piksel stiline getirilecek; yerleşim ve pause kontrolü korunacak, yeni sanat çizilmeyecek. Başka fazlara veya ses ayarlarına dokunma.
- Her alt adım sonrası HANDOFF, Peru saatli rapor ve CHANGELOG güncelle; ayrı küçük commit. İki denemede doğrulanmazsa durumu ve gerçek çıktıyı burada yaz.
- Standart doğrulama: `node reports/playwright-gameplay.cjs phase3-1-after`; screenshot `reports/screenshots/phase3-1-after.png`. `reports/playwright-gameplay.cjs` içeriğini veya JSON alanlarını değiştirme.
- Playwright paketi `/tmp/fivemore-pw/node_modules` altında, Chromium kullanıcı cache'inde. Statik sunucu CSS dahil MIME türlerini doğru vermeli.
- Fiziksel iPhone Safari kontrolü henüz yapılmadı; telefon testi raporunda UNVERIFIED olarak kalmalı.
- Yerel `main` branch'te birikmiş commit'ler origin'de olmayabilir; başlamadan `git status --short --branch` ve `git log` kontrol et, otomatik reset/rebase yapma.

## Bilinen sorunlar
- Fiziksel iPhone 11 Safari doğrulaması raporlarda UNVERIFIED.
- Playwright/Chromium test bağımlılığı bu ortamda `/tmp/fivemore-pw` ve kullanıcı cache'ine kuruldu; repoya bağımlılık eklenmedi.

## Son test çıktısı
Son doğrulama `node reports/playwright-gameplay.cjs handoff-review` çıkış kodu 0:

```text
{"viewport":[390,844],"scale":0.7,"movement":{"start":687.23,"after1_5s":617.71,"decreased":true},"contact":{"before":100000,"enemy":[0,0],"after":"99988 HP","hpAfter":99988,"dropped":true},"bullet":{"draws":20,"screenPositionPx":[195,388],"firstOffsetPx":[0,-34],"muzzleOffsetPx":[0,-28],"muzzleDifferencePx":6},"gem":{"before":0,"after":1,"collected":true,"drawnAtPx":[239.5,421.5],"expectedAtPx":[233.5,422],"differencePx":6.02},"enemies30s":{"first":5,"last":26,"minimum":5,"maximum":26,"largestDrop":1},"canvas":{"rect":{"x":0,"y":0,"width":390,"height":844,"top":0,"right":390,"bottom":844,"left":0},"backing":[390,844],"smoothing":false},"audioAfterTap":"running · gain 0.70","consoleErrors":[]}
```

Targeted proof and final screenshots: `reports/2026-11-13-phase2-4-resumed.md` and `reports/screenshots/phase2-4-crate-verified.png`, `reports/screenshots/phase2-4-barrel-verified.png`, `reports/screenshots/phase2-4-pass-through.png`.
Handoff-review screenshot: `reports/screenshots/handoff-review.png`.
