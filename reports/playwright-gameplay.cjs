const { chromium } = require('/tmp/fivemore-pw/node_modules/playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  page.on('pageerror', error => consoleErrors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('favicon.ico')) consoleErrors.push(msg.text()); });
  await page.addInitScript(() => {
    window.__bulletDraws = [];
    const original = CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.fillRect = function(...args) {
      if (this.canvas?.id === 'game-canvas' && this.fillStyle === '#f6ce67' && window.__bulletDraws.length < 20) {
        const t = this.getTransform(); window.__bulletDraws.push({ x: t.e, y: t.f, angle: Math.atan2(t.b, t.a) });
      }
      return original.apply(this, args);
    };
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?scale=0.7&debug=1`);
  await page.locator('#home [data-screen="game"]').click();
  await page.evaluate(async () => { (await import('/src/player.js')).player.hp = 100000; });
  await page.waitForTimeout(1800);
  const state = await page.evaluate(async () => {
    const { player } = await import('/src/player.js');
    const { getEnemies, getEnemyCount } = await import('/src/enemies.js');
    const { progression, dropGem } = await import('/src/xp.js');
    const { getAudioDebugStatus } = await import('/src/audio.js');
    const canvas = document.querySelector('#game-canvas');
    const ctx = canvas.getContext('2d');
    const enemies = getEnemies();
    const live = () => enemies.filter(e => e.active);
    const initial = live().sort((a, b) => Math.hypot(a.x-player.x,a.y-player.y) - Math.hypot(b.x-player.x,b.y-player.y))[0];
    initial.hp = 1000000000;
    const distance0 = Math.hypot(initial.x-player.x, initial.y-player.y);
    return { player, enemies, liveCount: getEnemyCount(), enemyIndex: enemies.indexOf(initial), distance0,
      canvas: { rect: canvas.getBoundingClientRect().toJSON(), backing: [canvas.width, canvas.height], smoothing: ctx.imageSmoothingEnabled },
      audio: getAudioDebugStatus() };
  });
  await page.waitForTimeout(1500);
  const distance1 = await page.evaluate(async (enemyIndex) => {
    const { player } = await import('/src/player.js'); const { getEnemies } = await import('/src/enemies.js');
    const e = getEnemies()[enemyIndex];
    return Math.hypot(e.x-player.x,e.y-player.y);
  }, state.enemyIndex);
  const movement = { start: Number(state.distance0.toFixed(2)), after1_5s: Number(distance1.toFixed(2)), decreased: distance1 < state.distance0 };
  const contact = await page.evaluate(async () => {
    const { player } = await import('/src/player.js'); const { getEnemies } = await import('/src/enemies.js');
    const e = getEnemies().find(e => e.active); e.hp = 100000; e.x = player.x; e.y = player.y;
    return { before: Number(document.querySelector('#hp-label').textContent.match(/\d+/)[0]), enemy: [e.x,e.y] };
  });
  await page.waitForTimeout(120);
  contact.after = await page.locator('#hp-label').textContent();
  contact.hpAfter = Number(contact.after.match(/\d+/)[0]);
  contact.dropped = contact.hpAfter < contact.before;
  const gem = await page.evaluate(async () => {
    const { player } = await import('/src/player.js'); const { progression, dropGem } = await import('/src/xp.js');
    const before = progression.xp; dropGem(player.x, player.y); return { before };
  });
  await page.waitForTimeout(1100);
  gem.after = await page.evaluate(async () => (await import('/src/xp.js')).progression.xp);
  gem.collected = gem.after > gem.before;
  const bullet = await page.evaluate(async () => {
    const { player } = await import('/src/player.js');
    const draws = window.__bulletDraws; const first = draws[0]; const r = document.querySelector('#game-canvas').getBoundingClientRect();
    if (!first) return { draws: 0 };
    const muzzleX = Math.cos(player.shotAngle) * 40 * 0.7; const muzzleY = Math.sin(player.shotAngle) * 40 * 0.7;
    const centerX = r.width/2, centerY = r.height/2;
    const offsetX = first.x - centerX, offsetY = first.y - centerY;
    const expectedX = Math.cos(first.angle) * 40 * 0.7, expectedY = Math.sin(first.angle) * 40 * 0.7;
    return { draws: draws.length, screenPositionPx: [Number(first.x.toFixed(2)),Number(first.y.toFixed(2))], firstOffsetPx: [Number(offsetX.toFixed(2)),Number(offsetY.toFixed(2))], muzzleOffsetPx: [Number(expectedX.toFixed(2)),Number(expectedY.toFixed(2))], muzzleDifferencePx: Number(Math.hypot(offsetX-expectedX, offsetY-expectedY).toFixed(2)) };
  });
  const counts = [];
  for (let i=0; i<30; i++) {
    counts.push(await page.evaluate(async () => (await import('/src/enemies.js')).getEnemyCount()));
    await page.waitForTimeout(1000);
  }
  const largestDrop = Math.max(0, ...counts.slice(1).map((n,i)=>counts[i]-n));
  await page.screenshot({ path: path.join(root, `reports/screenshots/${process.argv[2] || 'gameplay'}.png`) });
  const out = { viewport: [390,844], scale: 0.7, movement, contact, bullet, gem,
    enemies30s: { first: counts[0], last: counts.at(-1), minimum: Math.min(...counts), maximum: Math.max(...counts), largestDrop },
    canvas: state.canvas, audioAfterTap: state.audio, consoleErrors };
  console.log(JSON.stringify(out));
  await browser.close(); server.close();
})().catch(error => { console.error(error.stack || error); server.close(); process.exitCode = 1; });
