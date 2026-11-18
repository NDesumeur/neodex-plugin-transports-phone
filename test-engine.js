// test du moteur des horaires de la version téléphone, hors téléphone : node test-engine.js <dossier des horaires Tadao> <archive gtfs.zip de ces horaires>
// (le dossier : celui du plugin PC, %APPDATA%\NeoDex\tadao ; l'archive : tar -a -c -f gtfs.zip *.txt dedans). Compare avec main.js du plugin PC.
const fs = require('fs'), path = require('path'), Module = require('module');
const [dir, zip] = process.argv.slice(2);
const src = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8'), a = src.indexOf('  const tp = (() => {'), b = src.indexOf('  })();\n', a) + 8;
const files = {}, b64 = u8 => Buffer.from(u8).toString('base64');
const folder = { readFile: async n => files[n] ?? null, writeFile: async (n, v) => { files[n] = v; } };
let downloads = 0;
const ctx = { net: async (url, o) => { if (!o?.binary) throw new Error('binary attendu'); if (/47a5e290/.test(url)) { downloads++; return { ok: true, status: 200, b64: b64(fs.readFileSync(zip)) }; } return { ok: false, status: 503 }; } };
const tp = new Function('ctx', 'folder', 'toast', src.slice(a, b) + '; return tp;')(ctx, folder, () => {});
// le plugin PC, sans Electron
const load = Module._load; Module._load = (r, ...x) => r === 'electron' ? { app: { getPath: () => path.dirname(dir) } } : load(r, ...x);
const pc = require(path.join(__dirname, '..', 'neodex-plugin-transports', 'main.js')); Module._load = load;
const ok = (name, cond, more = '') => { console.log((cond ? 'ok ' : '[ECHEC] ') + name + (more ? ' : ' + more : '')); if (!cond) process.exitCode = 1; };
(async () => {
  const s = await tp('tadao:search', 'gare de lens');
  ok('recherche « gare de lens »', s.length > 0 && /gare/i.test(s[0].name), s.slice(0, 2).map(x => x.name + ' (' + x.town + ')').join(', '));
  ok('horaires téléchargés une fois et gardés', downloads === 1 && !!files['stop_times.txt'] && !!files['gtfs-at']);
  const lundi = new Date(); lundi.setDate(lundi.getDate() + ((8 - lundi.getDay()) % 7 || 7)); lundi.setHours(8, 0, 0, 0);
  const next = await tp('tadao:next', s[0].key, +lundi);
  ok('prochains passages lundi 8 h', next.departures.length > 0, next.departures.length + ' bus, premier ' + next.departures[0]?.route?.name + ' vers ' + next.departures[0]?.headsign);
  const trip = await tp('tadao:trip', next.departures[0].trip);
  ok('arrêts du trajet', trip.length > 1, trip.length + ' arrêts');
  let to, r;  // un arrêt de ce trajet (plusieurs villes ont un arrêt de ce nom : celui qui est sur la ligne)
  for (const c of (await tp('tadao:search', trip[trip.length - 2].name)).slice(0, 8)) { to = c; r = await tp('tadao:route', s[0].key, c.key, +lundi); if (r.options.length) break; }
  // le même calcul par main.js du plugin PC, sur les mêmes fichiers
  const g = await new Promise((res, rej) => { const h = {}; pc({ ipcMain: { handle: (n, f) => h[n] = f } }); h['tadao:route'](null, s[0].key, to.key, +lundi).then(res, rej); });
  ok('itinéraire identique au PC', r.options.length > 0 && JSON.stringify(r) === JSON.stringify(g), r.options.length + ' trajets vers ' + to.name);
  const again = await new Function('ctx', 'folder', 'toast', src.slice(a, b) + '; return tp;')(ctx, folder, () => {})('tadao:search', 'liévin');
  ok('relancé : horaires repris sans retélécharger', downloads === 1 && again.length > 0);
})().catch(e => { console.log('[ECHEC] ' + e.stack); process.exitCode = 1; });
