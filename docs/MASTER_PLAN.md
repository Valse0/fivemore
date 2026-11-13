# FIVEMORE Master Plan

## KURALLAR (tüm fazlar)
- Bir çalıştırmada TEK faz. Faz bitince dur.
- Kotanı göremezsin: her ADIMDAN sonra commit at ve HANDOFF.md'yi güncelle
  (yapılanlar, sıradaki adım, bilinen sorunlar, son test çıktısı). Yarıda
  kesilirsen sonraki ajan oradan devam eder.
- Bir adım iki denemede çözülmezse dur, nedenini HANDOFF.md'ye yaz.
- Her adım: Playwright 390x844 doğrulaması. reports/playwright-gameplay.cjs
  sayıları bozulmasın. Doğrulanamayan her şey UNVERIFIED.
- Saatler Peru saati (UTC-5). Rapor başında başlangıç/bitiş/süre.
- Küçük commit'ler; ilgisiz dosya yeniden yazma; sayısal değerler config'de.
- Yeni sanat çizme; sadece assets/v2 kullan. Eksik asset varsa o öğeyi
  atla ve HANDOFF.md'ye yaz.

## FAZLAR

FAZ 1 - Düzeltmeler
1.1 Karakter oynanışta yalnızca yürüme animasyonu: duruyorsa yürüme 1. kare
    sabit, hareketteyse yürüme döngüsü. Ölüm karesi sadece ölünce. Hasar:
    poz değil; 0.15 sn kırmızı tint + küçük geri tepme (config).
1.2 Görünür ekranda düşman yokken ateş etme. Ateşte hâlâ beyaz flash varsa
    kaynağını bul (muzzle/hit/tint) ve kaldır.
1.3 Alan sınırı: config'de ARENA_W/ARENA_H (başlangıç 1600x2000 dünya birimi).
    Oyuncu ve düşmanlar çıkamaz; kenarda belirgin görsel sınır; spawn halkası
    alan içine kıstırılır; props alan içinde.
1.4 Mermi namlu hizası: ilk mermi konumu namluya en fazla 10 px.

FAZ 2 - Yeni assetler
2.1 https://github.com/Valse0/Assets-for-my-game-.git (sahibime ait) projeden
    ayrı klasöre klonla. assets/v2/ASSETS_INDEX.md ile farkı çıkar; yeni
    dosyaları assets/v2'ye kopyala (eskileri silme), indeksi güncelle,
    animasyon aralıklarını manifest'ten oku (tahmin yok). unsorted/ ve
    api anahtarı dosyalarına dokunma.
2.2 Zombi saldırı animasyonu: oyuncuya temas edip hasar verirken attack
    kareleri (dosya yoksa yürüme).
2.3 Spitter oyuncudan mesafe korur, tükürük atar, çarpınca splat (yoksa ekle).
2.4 Kutu/varil: mermi bunlara çarpar. Kutu 3 vuruşta kırılır (kırılma
    animasyonu + can pickup, miktar config). Varil 2 vuruşta patlar
    (animasyon + alan hasarı: zombiye ve oyuncuya, yarıçap/hasar config +
    yanık iz). Kaya/ağaç mermiyi etkilemez (mevcut).

FAZ 3 - HUD ve ana menü
3.1 HP, XP/seviye barı ve süre: piksel stili (kalın koyu kontur, sprite
    paleti), okunaklı; yerleşim ve duraklat tuşu korunur. Kodla çiz.
3.2 Ana menü (Play/Settings): piksel stil başlık, arkada v2 zemin ve
    survivor/zombi, büyük dokunma dostu butonlar (en az 48 px). Ses/ayar
    mantığı değişmez.

FAZ 4 - Kart sistemi (ilk sürüm)
4.1 Seviye atlayınca oyun durur, 3 piksel stil kart sunulur. Başlangıçta
    yalnızca stat kartları (5-6 tane: hasar, atış hızı, hareket hızı,
    max HP, XP toplama yarıçapı, mermi sayısı). cards.js ve config'de;
    kart başına max seviye; aynı kart arka arkaya gelmesin; çoklu seviye
    atlama kuyruğa alınsın.
4.2 Kart yapısı ileride silah kartı eklenebilir olsun (uzantı noktası).
    Silah kartı ŞİMDİ yok.

BACKLOG (UYGULAMA): docs/GAME_DESIGN.md'ye "Backlog" olarak ekle:
bomba, molotof (yanma alanı, ağacı yakar), alev silahı, makinalı,
yakın dövüş sopası, ek pickup türleri.
