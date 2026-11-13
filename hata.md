# hata.md - FIVEMORE bilinen hatalar (2026-11-13, iPhone testi)

Kural: Bu dosyadaki her madde duzeltilmeden yeni ozellik eklenmez.
Her madde icin: duzeltme + ekran goruntusu/olcum kaniti + CHANGELOG satiri.

## Muhtemel kok neden (DOGRULANMADI)
WORLD_SCALE 0.7 sonrasi dunya/ekran koordinat donusumu tutarsiz olabilir.
Oyuncu, dusman, mermi, gem ve cizim farkli koordinat uzaylarini kullaniyor olabilir.
Asagidaki 1-5. maddeler muhtemelen ayni kokten geliyor. Once bunu bul.

## Hatalar
1. Zombiler oyuncudan UZAKLASIYOR (yaklasmasi gerekir).
2. Zombinin ustunden gecince hasar alinmiyor (temas hasari calismiyor).
3. Mermi silahtan cikmiyor. Sag alt koseden yukari dogru, yan/capraz kayiyor.
   Sadece namlu efekti dogru yerde. Mermi cizim konumu ile mantik konumu uyusmuyor.
4. Zombi oldugunda dusen bazi XP gem'leri toplanamiyor (cizim konumu != toplama konumu).
5. Zombiler bazen aniden yok oluyor (culling/despawn mesafesi yeni scale ile uyumsuz olabilir).
6. Hareket ederken zemin dalgalaniyor/titriyor (kamera float konumu ile
   tile cizimi tam sayiya yuvarlanma uyumsuzlugu; tile'lar kamera konumundan
   tutarli hesaplanmali).
7. Zemin tamamen rastgele gorunuyor (grass/dirt karisik gurultu). Tutarli
   desen gerekir (ornegin cogunlukla cim, ara sira toprak yama).
8. Karakter/dusmanlar hala bulanik gorunuyor (smoothing/olcekleme tam kapanmamis olabilir).
9. Arka plan muzigi kalitesiz (muzik degisimi ayri asset isi, bkz. asset plani).

## Dogrulama kurali (bu tur icin)
Onceki rapor sadece STATIK ekran goruntusu aldi, oynanisi test etmedi.
Bu sefer Playwright ile otomatik oynanis testi zorunlu:
- Oyuncu sabit dururken dusmanin mesafesi zamanla AZALIYOR mu (log olarak yaz).
- Dusman oyuncuya degince HP dusuyor mu.
- Atis sonrasi mermi konumu: ilk karede oyuncu namlusuna yakin mi (sayi yaz).
- Gem'e yurununce XP artiyor mu.
- 30 sn boyunca dusman sayisi ani dusus yasiyor mu.
Hepsi sayisal cikti olarak raporda olmali. Yapilamayan = UNVERIFIED.
