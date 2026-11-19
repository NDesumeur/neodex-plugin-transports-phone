// Transports : les prochains passages de tous les réseaux de France (catalogue transport.data.gouv.fr), plusieurs réseaux à la fois.
// Les horaires et le temps réel sont calculés par engine.js : sur PC dans main.js du plugin, sur téléphone dans cette page (version -phone).
// Les arrêts favoris peuvent prévenir d'une perturbation (trajet supprimé, gros retard, alerte du réseau), même onglet fermé.
const HTML = "<div class=\"appWrap wide\">\n      <div class=\"agHead\"><span class=\"label\">Transports</span><span class=\"hint\" id=\"tpNetHint\"></span></div>\n      <div class=\"sysCard px\" id=\"tpNetCard\"><div class=\"tpNets\" id=\"tpNets\"></div><div id=\"tpNetPick\"></div></div>\n      <div id=\"tpFavs\" class=\"setBg\"></div>\n      <div class=\"sysCard px\"><input class=\"f\" id=\"tpSearch\" placeholder=\"Chercher un arrêt ou une gare (ex : Gare de Lens, Lille Flandres…)\" spellcheck=\"false\"><div id=\"tpResults\"></div></div>\n      <div class=\"sysCard px tpTrip\"><span class=\"label\">Itinéraire · quel bus ou quel train prendre</span><div class=\"tpIt\"><div class=\"tpPick\"><input class=\"f\" id=\"tpFrom\" placeholder=\"De… (l’arrêt affiché si vide)\" spellcheck=\"false\"><div class=\"tpRes\"></div></div><div class=\"tpPick\"><input class=\"f\" id=\"tpTo\" placeholder=\"À… (même réseau)\" spellcheck=\"false\"><div class=\"tpRes\"></div></div><button class=\"btn px\" id=\"tpGo\">QUEL TRAJET ?</button></div><div id=\"tpRoute\"></div></div>\n      <div class=\"sysCard px\" id=\"tpBoard\"><div class=\"hint\">Choisis un arrêt pour voir les prochains passages.</div></div>\n    </div>";
const CSS = `#tpSearch{font-size:clamp(17px,1.15vw,20px)}
.tpNets{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.tpNet{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(var(--mgr),.12);box-shadow:inset 0 0 0 2px var(--line2);font-size:14px;color:#fff;max-width:100%}
.tpNet span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tpNet i{font-style:normal;cursor:var(--cp,pointer);color:var(--muted)} .tpNet i:hover{color:#ff4f6d}
.tpNetRes{display:flex;flex-direction:column;gap:2px;max-height:340px;overflow:auto;margin-top:8px}
.tpNetRes .tpResult small{display:block;color:var(--muted);font-size:13px}
.tpTag{font:8px var(--title);padding:3px 5px 2px;margin-left:6px;background:#1e7a43;color:#fff;vertical-align:middle}.tpTag.no{background:#6a2a3a}
.tpIt{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:start}.tpPick{position:relative;min-width:0}.tpPick .f{width:100%;font-size:16px}
.tpRes:not(:empty){position:absolute;z-index:5;left:0;right:0;top:100%;display:flex;flex-direction:column;background:var(--win);box-shadow:0 0 0 2px var(--line2);max-height:260px;overflow:auto}
@media (max-width:760px){.tpIt{grid-template-columns:1fr}}
.tpOpt{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:clamp(15px,1vw,18px);color:var(--lilac)}
.tpOpt b{color:#fff;font:clamp(14px,1.05vw,19px) var(--title)}.tpOpt .dur{margin-left:auto;color:var(--muted)}
.tpStops.tpPlan:not(:empty){position:relative;margin:4px 0 10px 26px;padding-left:22px;box-shadow:none}
.tpPlan::before{content:"";position:absolute;left:5px;top:12px;bottom:12px;width:4px;background:var(--lc,#8a5cf0)}
.tpPlan .tpStop{position:relative;padding:4px 8px}.tpPlan .tpStop::before{content:"";position:absolute;left:-20px;top:50%;width:10px;height:10px;margin-top:-5px;background:var(--win);box-shadow:0 0 0 2px var(--lc,#8a5cf0)}
.tpPlan .tpStop.past::before{background:var(--lc,#8a5cf0)}
.tpBus{position:absolute;left:-4px;width:22px;height:14px;margin-top:-7px;image-rendering:pixelated;z-index:2;transition:top 1s steps(4)}
#tpResults{display:flex;flex-direction:column;gap:2px}
.tpStops:not(:empty){display:flex;flex-direction:column;margin:0 0 8px 20px;padding-left:12px;box-shadow:inset 3px 0 0 var(--line2)}
.tpStop{display:flex;justify-content:space-between;gap:12px;padding:3px 8px;font-size:clamp(14px,1vw,17px);color:var(--lilac)}
.tpStop.past{color:var(--muted);opacity:.6}
.tpStop.here{color:#fff;background:rgba(var(--mgr),.2)}
.tpResult{all:unset;cursor:var(--cp,pointer);display:flex;justify-content:space-between;gap:12px;padding:8px 10px;font-size:clamp(15px,1.05vw,18px)}
.tpResult:hover{background:rgba(var(--mgr),.14)}
.tpResult b{color:#fff;font-weight:600}
.tpResult span{color:var(--muted);text-align:right}
.tpHead{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.tpName{font:600 clamp(22px,1.7vw,30px) var(--text);color:#fff}
.tpRow{cursor:var(--cp,pointer);display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.tpLine{min-width:64px;text-align:center;padding:6px 8px;font:clamp(11px,.8vw,14px) var(--title);letter-spacing:.5px}
.tpRow .tn{color:#fff;font-size:clamp(16px,1.15vw,20px);min-width:0}
.tpRow small{display:block;font-size:clamp(13px,.9vw,15px);color:var(--muted)}
.tpRow.live small{color:#8ee8a0}
.tpRow.late small{color:#ffc061}
.tpRow.gone .tn,.tpRow.gone .tpWhen{text-decoration:line-through;opacity:.6}.tpRow.gone small{color:#ff6b81;text-decoration:none}
.tpWhen{font:clamp(15px,1.15vw,21px) var(--title);color:#fff;white-space:nowrap}
.tpWhen.now{color:var(--pink)}
.tpAlert{margin:8px 0;padding:10px 12px;background:rgba(255,160,40,.12);box-shadow:inset 3px 0 0 #ffa028;font-size:14px;color:var(--lilac);line-height:1.45}
.tpAlert b{color:#ffc061;display:block;margin-bottom:2px}
.nbaStar{all:unset;cursor:var(--cp,pointer);color:var(--muted);font-size:16px;padding:0 4px}
.nbaStar:hover,.nbaStar.on{color:#ffd07a}
`;
// le réseau d'origine du plugin (Lens-Liévin) : repris tel quel pour ceux qui avaient déjà des arrêts favoris
const TADAO = { id: '600ee0e9d319b4c4b84bd748', title: 'Réseau urbain TADAO', gtfs: 'https://www.data.gouv.fr/api/1/datasets/r/47a5e290-7883-4a40-bdcf-b693f64087b0', rt: [{ url: 'https://www.data.gouv.fr/api/1/datasets/r/c4563dcc-f547-489a-b63a-efb4dbb37262', f: 'trip_updates,vehicle_positions' }], trips: 7363 };
const MAX_TRIPS = 60000;
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const { el, toast } = ctx.host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => view.querySelector('#' + id);
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  let prefs = await doc('prefs');
  if (prefs == null) {  // première ouverture : tu retrouves tes réglages d'avant
    prefs = {}; const old = legacy.settings ? await legacy.settings().catch(() => ({})) : {};
    if (Array.isArray(old.tadaoStops) && old.tadaoStops.length) prefs.tadaoStops = old.tadaoStops;
  }
  if (!Array.isArray(prefs.nets)) {  // avant la version 2 : un seul réseau, Tadao ; ses arrêts favoris prennent le préfixe du réseau
    prefs.nets = prefs.tadaoStops?.length ? [TADAO] : [];
    prefs.tadaoStops = (prefs.tadaoStops || []).map(s => s.key.includes('~') ? s : { ...s, key: TADAO.id + '~' + s.key });
  }
  const save = () => folder.write('prefs', prefs);
  await save();
  // ---- les horaires, calculés ici : sur téléphone un plugin n'a pas de main.js. Même moteur que le plugin PC (engine.js) ----
  const tp = (() => {
    // Transports : le moteur des horaires, le même sur PC (chargé par main.js) et sur téléphone (recopié dans index.js de la version -phone).
    // N'importe quel réseau du catalogue national transport.data.gouv.fr : horaires GTFS (retéléchargés chaque semaine) et temps réel GTFS-RT
    // (retards, trajets supprimés, arrêts non desservis, positions des véhicules, alertes du réseau). Rien ici ne dépend de Node ni du navigateur :
    // le téléchargement, la décompression et le cache passent par « io », donné par main.js (PC) ou par le plugin (téléphone).
    // io = { fetchBin(url) -> Uint8Array, fetchText(url) -> texte, inflate(Uint8Array) -> Uint8Array, cacheGet(nom) -> texte|null,
    //        cacheSet(nom, texte), cacheAge(nom) -> ms, toast(texte), maxTrips, phone } ; chaque fonction peut rendre une promesse
    function tpEngine(io) {
      const CATALOG = 'https://transport.data.gouv.fr/api/datasets', WEEK = 7 * 864e5;
      const GTFS_FILES = ['stops.txt', 'routes.txt', 'trips.txt', 'stop_times.txt', 'calendar.txt', 'calendar_dates.txt'];
      const csv = (text, onRow) => {  // ligne d'en-tête puis les lignes, guillemets compris
        const lines = (text || '').replace(/^﻿/, '').split(/\r?\n/), head = lines[0].split(',').map(h => h.trim());
        const cell = l => { if (!l.includes('"')) return l.split(','); const o = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (c === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (c === ',' && !q) { o.push(cur); cur = ''; } else cur += c; } o.push(cur); return o; };
        for (let i = 1; i < lines.length; i++) if (lines[i]) { const v = cell(lines[i]), r = {}; head.forEach((h, k) => r[h] = v[k]); onRow(r); }
      };
      const secs = t => { const [h, m, s] = (t || '').trim().split(':').map(Number); return h * 3600 + m * 60 + (s || 0); };
      const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

      // ---------- l'archive .zip des horaires (rangée telle quelle ou compressée « deflate », ZIP64 compris) ----------
      async function unzipText(u8, names) {
        const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), out = {};
        let e = u8.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
        if (e < 0) throw new Error('ce réseau ne donne pas ses horaires en fichier GTFS lisible');
        let p = dv.getUint32(e + 16, true), n = dv.getUint16(e + 10, true);
        if (p === 0xFFFFFFFF || n === 0xFFFF) {  // ZIP64 : la fin du répertoire est dans un second enregistrement
          const loc = e - 20; if (loc >= 0 && dv.getUint32(loc, true) === 0x07064b50) { const z = Number(dv.getBigUint64(loc + 8, true)); n = Number(dv.getBigUint64(z + 32, true)); p = Number(dv.getBigUint64(z + 48, true)); }
        }
        for (; n > 0; n--) {
          const method = dv.getUint16(p + 10, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), F = 0xFFFFFFFF;
          let usize = dv.getUint32(p + 24, true), size = dv.getUint32(p + 20, true), off = dv.getUint32(p + 42, true);
          for (let x = p + 46 + nl; x + 4 <= p + 46 + nl + xl; x += 4 + dv.getUint16(x + 2, true)) if (dv.getUint16(x, true) === 1) {
            let q = x + 4; const big = () => { const v = Number(dv.getBigUint64(q, true)); q += 8; return v; };
            if (usize === F) usize = big(); if (size === F) size = big(); if (off === F) off = big();
          }
          const base = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl)).split('/').pop();
          p += 46 + nl + xl + dv.getUint16(p + 32, true);
          if (!names.includes(base)) continue;
          const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), raw = u8.subarray(start, start + size);
          if (method !== 0 && method !== 8) throw new Error('archive des horaires illisible (compression inconnue)');
          out[base] = new TextDecoder().decode(method === 0 ? raw : await io.inflate(raw));
        }
        return out;
      }

      // ---------- les horaires d'un réseau ----------
      function parseGtfs(t) {
        const g = { stops: new Map(), groups: new Map(), routes: new Map(), trips: new Map(), cal: new Map(), dates: new Map() };
        // la ville : après le code postal de la description (« 220 Avenue Pablo Neruda 62138 Auchy-les-Mines », « 59000 LILLE - AU DROIT DU N° 37 »)
        const townOf = d => { const m = /\b\d{5}\s+([^,\-–]+(?:-[^\s,\-–]+)*)/.exec(d || ''); if (!m) return ''; const s = m[1].trim(); return s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s-])\p{L}/gu, c => c.toUpperCase()) : s; };
        const parents = new Map(); csv(t['stops.txt'], r => { if (r.location_type === '1') parents.set(r.stop_id, r); });
        csv(t['stops.txt'], r => {
          if (r.location_type && r.location_type !== '0') return;
          // les quais d'un pôle (« Béhal-Jean Zay - Quai 4 », ou les points d'arrêt d'une même gare) sont un seul arrêt pour le voyageur
          const par = parents.get(r.parent_station), name = (par?.stop_name || r.stop_name || '').replace(/\s*-\s*Quai\s*\w+\s*$/i, '').trim();
          const town = townOf(par?.stop_desc) || townOf(r.stop_desc), key = norm(name) + '|' + norm(town);
          g.stops.set(r.stop_id, { name, quay: r.stop_name, town, key, lat: +r.stop_lat, lon: +r.stop_lon });
          if (!g.groups.has(key)) g.groups.set(key, { key, name, town, ids: [], lat: +r.stop_lat, lon: +r.stop_lon });
          g.groups.get(key).ids.push(r.stop_id);
        });
        csv(t['routes.txt'], r => g.routes.set(r.route_id, { id: r.route_id, name: r.route_short_name || r.route_long_name, long: r.route_long_name, color: '#' + (r.route_color || '8a5cf0'), text: '#' + (r.route_text_color || 'ffffff'), type: +r.route_type }));
        csv(t['trips.txt'], r => g.trips.set(r.trip_id, { route: r.route_id, service: r.service_id, headsign: r.trip_headsign || '' }));
        // les passages (plus d'un million de lignes à Lille) en tableaux de nombres : trajets et arrêts numérotés, trois nombres par passage.
        // byStop.get(arrêt) -> [[trajet, heure, rang]] et byTrip.get(trajet) -> [[rang, arrêt, heure]] les redonnent à la demande
        const tripIds = [...g.trips.keys()], tripIx = new Map(tripIds.map((id, i) => [id, i])), stopIds = [...g.stops.keys()], stopIx = new Map(stopIds.map((id, i) => [id, i]));
        const bs = new Array(stopIds.length), bt = new Array(tripIds.length);
        csv(t['stop_times.txt'], r => {
          const t = secs(r.departure_time || r.arrival_time), seq = +r.stop_sequence, ti = tripIx.get(r.trip_id), si = stopIx.get(r.stop_id);
          if (isNaN(t) || ti === undefined || si === undefined) return;
          (bs[si] ||= []).push(ti, t, seq); (bt[ti] ||= []).push(seq, si, t);
        });
        for (let i = 0; i < bt.length; i++) { const a = bt[i]; if (!a) continue; const l = []; for (let k = 0; k < a.length; k += 3) l.push([a[k], a[k + 1], a[k + 2]]); l.sort((x, y) => x[0] - y[0]); bt[i] = l.flat(); }
        g.byStop = { get: id => { const a = bs[stopIx.get(id)]; if (!a) return undefined; const o = []; for (let k = 0; k < a.length; k += 3) o.push([tripIds[a[k]], a[k + 1], a[k + 2]]); return o; } };
        g.byTrip = { get: id => { const a = bt[tripIx.get(id)]; if (!a) return undefined; const o = []; for (let k = 0; k < a.length; k += 3) o.push([a[k], stopIds[a[k + 1]], a[k + 2]]); return o; } };
        tripIds.forEach((id, i) => { const tr = g.trips.get(id), a = bt[i]; if (!tr.headsign && a) tr.headsign = g.stops.get(stopIds[a[a.length - 2]])?.name || ''; });  // pas de direction : le terminus
        csv(t['calendar.txt'], r => g.cal.set(r.service_id, r));
        csv(t['calendar_dates.txt'], r => { if (!g.dates.has(r.date)) g.dates.set(r.date, new Map()); g.dates.get(r.date).set(r.service_id, r.exception_type); });
        for (const grp of g.groups.values()) { grp.routes = new Set(); for (const id of grp.ids) { const a = bs[stopIx.get(id)] || []; for (let k = 0; k < a.length; k += 3) grp.routes.add(g.trips.get(tripIds[a[k]]).route); } }
        return g;
      }
      const ymdC = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
      function running(g, service, day) {  // calendrier + exceptions (1 = ajouté, 2 = retiré ce jour-là)
        const ex = g.dates.get(ymdC(day))?.get(service);
        if (ex === '1') return true; if (ex === '2') return false;
        const c = g.cal.get(service); if (!c) return false;
        const d = ymdC(day), wd = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day.getDay()];
        return c[wd] === '1' && d >= c.start_date && d <= c.end_date;
      }

      // ---------- le temps réel GTFS-RT (protobuf) : positions, retards, suppressions, alertes ----------
      function fields(buf, start = 0, end = buf.length) {  // -> [[numéro, type, valeur]]
        const out = [], dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength); let i = start;
        const varint = () => { let v = 0, m = 1, b; do { b = buf[i++]; v += (b & 0x7f) * m; m *= 128; } while (b & 0x80); return v; };
        while (i < end) {
          const key = varint(), f = Math.floor(key / 8), w = key & 7;
          if (w === 0) out.push([f, 0, varint()]);
          else if (w === 1) { out.push([f, 1, dv.getFloat64(i, true)]); i += 8; }
          else if (w === 2) { const n = varint(); out.push([f, 2, [i, i + n]]); i += n; }
          else if (w === 5) { out.push([f, 5, dv.getFloat32(i, true)]); i += 4; }
          else throw new Error('protobuf : type ' + w);
        }
        return out;
      }
      const msg = (buf, [a, b]) => fields(buf, a, b), str = (buf, [a, b]) => new TextDecoder().decode(buf.subarray(a, b));
      const get = (fs, n) => fs.find(x => x[0] === n)?.[2], all = (fs, n) => fs.filter(x => x[0] === n).map(x => x[2]);
      const signed = v => v > 0x7fffffff ? v - 0x100000000 : v;
      const tripOf = (buf, r) => { const t = msg(buf, r); return { tripId: get(t, 1) && str(buf, get(t, 1)), routeId: get(t, 5) && str(buf, get(t, 5)), rel: get(t, 4) || 0 }; };
      const text = (buf, r) => { if (!r) return ''; const tr = all(msg(buf, r), 1).map(x => { const m = msg(buf, x); return { t: get(m, 1) ? str(buf, get(m, 1)) : '', l: get(m, 2) ? str(buf, get(m, 2)) : '' }; }); return (tr.find(x => /^fr/i.test(x.l)) || tr.find(x => !x.l) || tr[0] || {}).t || ''; };
      function decode(buf) {
        const vehicles = [], updates = [], alerts = []; let timestamp = 0;
        for (const [f, , v] of fields(buf)) {
          if (f === 1) timestamp = get(msg(buf, v), 3) || 0;
          if (f !== 2) continue;
          const e = msg(buf, v), id = get(e, 1) ? str(buf, get(e, 1)) : '', vp = get(e, 4), tu = get(e, 3), al = get(e, 5);
          if (vp) {
            const p = msg(buf, vp), pos = get(p, 2) && msg(buf, get(p, 2));
            vehicles.push({ ...(get(p, 1) ? tripOf(buf, get(p, 1)) : {}), lat: pos && get(pos, 1), lon: pos && get(pos, 2), stopId: get(p, 7) && str(buf, get(p, 7)), timestamp: get(p, 5) || 0 });
          }
          if (tu) {
            const u = msg(buf, tu), stops = all(u, 2).map(x => {
              const s = msg(buf, x), ev = n => { const r = get(s, n); if (!r) return null; const m = msg(buf, r); return { delay: get(m, 1) != null ? signed(get(m, 1)) : null, time: get(m, 2) || null }; };
              return { seq: get(s, 1), stopId: get(s, 4) && str(buf, get(s, 4)), arrival: ev(2), departure: ev(3), rel: get(s, 5) || 0 };
            });
            updates.push({ ...(get(u, 1) ? tripOf(buf, get(u, 1)) : {}), delay: get(u, 5) != null ? signed(get(u, 5)) : null, stops });
          }
          if (al) {
            const a = msg(buf, al), ents = all(a, 5).map(x => { const s = msg(buf, x); return { route: get(s, 2) && str(buf, get(s, 2)), stop: get(s, 5) && str(buf, get(s, 5)), trip: get(s, 4) && tripOf(buf, get(s, 4)).tripId }; });
            const per = all(a, 1).map(x => { const m = msg(buf, x); return [get(m, 1) || 0, get(m, 2) || 0]; });
            alerts.push({ id, header: text(buf, get(a, 10)), desc: text(buf, get(a, 11)), effect: get(a, 7) || 0, ents, per });
          }
        }
        return { timestamp, vehicles, updates, alerts };
      }

      // ---------- le catalogue national des réseaux ----------
      let catalog = null;
      async function networks(force) {
        if (catalog && !force) return catalog;
        let txt = await io.cacheGet('catalog.json'); const old = (await io.cacheAge('catalog.json')) > WEEK;
        if (!txt || old || force) {
          try {
            const j = JSON.parse(await io.fetchText(CATALOG));
            const list = j.filter(d => d.type === 'public-transit').map(d => {
              const gt = d.resources.filter(r => r.format === 'GTFS' && r.is_available !== false).sort((a, b) => (a.type === 'main' ? 0 : 1) - (b.type === 'main' ? 0 : 1))[0];
              if (!gt) return null;
              const rt = d.resources.filter(r => r.format === 'gtfs-rt' && r.is_available !== false).map(r => ({ url: r.url, f: (r.features || []).join(',') }));
              const area = (d.covered_area || []).map(a => a.nom).filter(Boolean).slice(0, 4).join(', ');
              return { id: d.id, title: d.title, area, by: d.publisher?.name || '', gtfs: gt.url, rt, trips: gt.metadata?.stats?.trips_count || 0, modes: (gt.modes || gt.metadata?.modes || []).join(','), kind: (d.sub_types || []).join(',') };
            }).filter(Boolean).sort((a, b) => a.title.localeCompare(b.title, 'fr'));
            txt = JSON.stringify(list); await io.cacheSet('catalog.json', txt);
          } catch (e) { if (!txt) throw new Error('catalogue des réseaux indisponible (' + e.message + ')'); }
        }
        return (catalog = JSON.parse(txt));
      }
      // un réseau cherché par son nom, sa ville, sa région ou son exploitant
      function findNetworks(list, q) {
        const w = norm(q).split(' ').filter(Boolean); if (!w.length) return list;
        return list.map(n => { const h = norm(n.title + ' ' + n.area + ' ' + n.by), t = norm(n.title); if (!w.every(x => h.includes(x))) return null; return [w.every(x => t.includes(x)) ? 0 : 1, n]; })
          .filter(Boolean).sort((a, b) => a[0] - b[0] || (b[1].rt.length ? 1 : 0) - (a[1].rt.length ? 1 : 0)).map(x => x[1]);
      }

      // ---------- chaque réseau choisi : ses horaires (chargés à la première question) et son temps réel ----------
      const nets = new Map();  // id -> { def, g, loading, rt: { at, data } }
      const safe = id => String(id).replace(/[^\w-]/g, '');
      async function gtfsTexts(def) {
        const dir = safe(def.id) + '/', at = +((await io.cacheGet(dir + 'gtfs-at')) || 0), kept = {};
        for (const f of GTFS_FILES) kept[f] = await io.cacheGet(dir + f);
        const have = ['stops.txt', 'routes.txt', 'trips.txt', 'stop_times.txt'].every(f => kept[f] != null);
        if (have && Date.now() - at < WEEK) return kept;
        try {
          if (def.trips > io.maxTrips) throw new Error('réseau trop grand pour ' + (io.phone ? 'le téléphone' : 'NeoDex') + ' (' + def.trips + ' trajets)');
          io.toast?.('Téléchargement des horaires de « ' + def.title + ' » (une fois par semaine)…');
          const t = await unzipText(await io.fetchBin(def.gtfs), GTFS_FILES);
          if (['stops.txt', 'routes.txt', 'trips.txt', 'stop_times.txt'].some(f => t[f] == null)) throw new Error('fichier des horaires incomplet');
          for (const f of GTFS_FILES) await io.cacheSet(dir + f, t[f] || '');
          await io.cacheSet(dir + 'gtfs-at', String(Date.now()));
          return t;
        } catch (e) { if (have) return kept; throw e; }  // pas de réseau : les horaires de la semaine dernière
      }
      function net(def) {
        if (!def || !def.id || !def.gtfs) throw new Error('réseau inconnu');
        let n = nets.get(def.id); if (!n) nets.set(def.id, n = { def, g: null, loading: null, rt: { at: 0, data: null } });
        n.def = def; return n;
      }
      const load = n => n.g ? Promise.resolve(n.g) : (n.loading ??= gtfsTexts(n.def).then(t => {
        const g = parseGtfs(t); if (g.trips.size > io.maxTrips * 1.5) throw new Error('réseau trop grand (' + g.trips.size + ' trajets)'); return (n.g = g);
      }).catch(e => { n.loading = null; throw e; }));
      async function realtime(n) {
        if (!n.def.rt?.length) return null;
        if (Date.now() - n.rt.at < 20000) return n.rt.data;
        const parts = await Promise.all(n.def.rt.slice(0, 4).map(r => io.fetchBin(r.url).then(decode, () => null)));
        const ok = parts.filter(Boolean), data = ok.length ? { timestamp: Math.max(...ok.map(p => p.timestamp)), vehicles: ok.flatMap(p => p.vehicles), updates: ok.flatMap(p => p.updates), alerts: ok.flatMap(p => p.alerts) } : null;
        n.rt = { at: Date.now(), data }; return data;
      }
      // une clé d'arrêt donnée à la page : « réseau~arrêt »
      const split = key => { const i = String(key).indexOf('~'); return i < 0 ? [null, key] : [key.slice(0, i), key.slice(i + 1)]; };
      const defOf = (list, id) => { const d = (list || []).find(n => n.id === id); if (!d) throw new Error('réseau retiré ou inconnu'); return d; };

      // le classement des arrêts pour une saisie : score bas = meilleur résultat, null = ne correspond pas
      const T_STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'a', 'au', 'aux', 'et', 'arret', 'station']), T_ALIAS = { st: 'saint', ste: 'sainte' };
      const tWords = s => norm(s).split(' ').filter(Boolean).map(w => T_ALIAS[w] || w);
      function lev1(a, b) {  // vrai si a et b diffèrent d'une seule lettre (ajoutée, retirée, changée ou deux lettres échangées)
        if (a === b) return true; if (Math.abs(a.length - b.length) > 1) return false;
        let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
        if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
        return a.length > b.length ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
      }
      function rank(stops, q) {
        const n = norm(q || ''); if (!n) return [];
        const scored = [];
        let re = null; if (/[.*+?^$|\[\](){}]/.test(q || '')) { try { re = new RegExp(String(q).normalize('NFD').replace(/[̀-ͯ]/g, ''), 'i'); } catch {} }
        const qw = tWords(q).filter(w => !T_STOP.has(w)); const tokens = qw.length ? qw : tWords(q);
        for (const s of stops) {
          const name = norm(s.name), nameW = tWords(s.name), townW = tWords(s.town), words = nameW.concat(townW);
          let score = null;
          if (re && re.test(norm(s.name + ' ' + s.town) + ' ' + s.name.normalize('NFD').replace(/[̀-ͯ]/g, ''))) score = 0.5;
          else if (name === n) score = 0; else if (name.startsWith(n)) score = 1;
          else {
            let total = 0;
            for (const t of tokens) {
              let best = Infinity;
              words.forEach((w, i) => { const pen = i < nameW.length ? 0 : .5; let c = Infinity; if (w === t) c = 0; else if (w.startsWith(t)) c = 1; else if (w.includes(t)) c = 2; else if (t.length >= 4 && (lev1(w.slice(0, t.length + 1), t) || lev1(w, t))) c = 3; best = Math.min(best, c + pen); });
              if (best === Infinity) { total = null; break; } total += best;
            }
            if (total !== null) score = 2 + total / tokens.length + nameW.length * .01;
          }
          if (score !== null) scored.push([score, s]);
        }
        return scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name, 'fr')).map(x => x[1]);
      }

      // les alertes du réseau en cours qui touchent ces lignes ou ces arrêts (une alerte sans cible touche tout le réseau)
      function alertsFor(data, routes, stopIds, nowS) {
        if (!data?.alerts?.length) return [];
        const t = nowS ?? Date.now() / 1000;
        return data.alerts.filter(a => (!a.per.length || a.per.some(([s, e]) => (!s || s <= t) && (!e || e >= t))) && (a.header || a.desc)
          && (!a.ents.length || a.ents.some(e => (e.route && routes.has(e.route)) || (e.stop && stopIds.has(e.stop)) || (!e.route && !e.stop && !e.trip))))
          .map(a => ({ id: a.id, header: a.header, desc: a.desc.slice(0, 600), effect: a.effect })).slice(0, 8);
      }
      // le retard du temps réel pour un trajet à un arrêt : celui du dernier arrêt annoncé avant le nôtre (il se reporte sur la suite)
      function rtDelay(u, stops, seq, dayStart) {
        if (!u) return null;
        let best = null;
        for (const s of u.stops) {
          const sq = s.seq ?? stops.find(x => x[1] === s.stopId)?.[0]; if (sq == null || sq > seq) continue;
          const ev = s.departure || s.arrival; if (!ev) continue;
          let d = ev.delay; if (d == null && ev.time) { const sch = stops.find(x => x[0] === sq); if (sch) d = ev.time - (dayStart + sch[2]); }
          if (d != null && (!best || sq >= best[0])) best = [sq, d, s.rel];
        }
        return best ? best[1] : u.delay;
      }
      async function departures(def, key, max = 30, at = Date.now()) {  // at : un autre moment (l'auto-test vérifie un lundi matin)
        const n = net(def), g = await load(n), grp = g.groups.get(key); if (!grp) throw new Error('arrêt inconnu');
        const now = new Date(at), nowS = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(), out = [];
        const live = await realtime(n), fresh = new Map((live?.vehicles || []).filter(v => v.tripId && (!live.timestamp || live.timestamp - v.timestamp < 600)).map(v => [v.tripId, v]));
        const upd = new Map((live?.updates || []).filter(u => u.tripId).map(u => [u.tripId, u]));
        const today = new Date(now), yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
        const midnight = d => { const m = new Date(d); m.setHours(0, 0, 0, 0); return m.getTime() / 1000; };
        const ids = new Set(grp.ids);
        for (const id of grp.ids) for (const [tripId, t, seq] of g.byStop.get(id) || []) {
          const trip = g.trips.get(tripId); if (!trip) continue;
          // une heure après 24:00 appartient au service de la veille
          for (const [day, shift] of [[today, 0], [yesterday, 86400]]) {
            const at = t - shift; if (at < nowS - 60 || at > nowS + 3 * 3600 || !running(g, trip.service, day)) continue;
            const stops = g.byTrip.get(tripId), last = stops[stops.length - 1];
            if (last[0] === seq || g.stops.get(last[1])?.key === key) continue;  // finit ici (peut-être à un autre quai du pôle) : personne n'y monte
            const v = fresh.get(tripId), u = upd.get(tripId); let delay = null, away = null, where = '', exact = false;
            const canceled = u?.rel === 3 || u?.rel === 7, skipped = !!u?.stops.some(s => (s.seq === seq || ids.has(s.stopId)) && s.rel === 1);
            const d = rtDelay(u, stops, seq, midnight(day));
            if (d != null) { delay = Math.round(d / 60); exact = true; }
            if (v) {  // où est le véhicule maintenant, et le retard estimé d'après sa position si le réseau ne le donne pas
              const cur = stops.find(s => s[1] === v.stopId);
              if (cur) { away = stops.filter(s => s[0] > cur[0] && s[0] <= seq).length; where = g.stops.get(v.stopId)?.name || ''; if (cur[0] > seq) continue; if (!exact) delay = Math.round(Math.max(-120, nowS - (cur[2] - shift)) / 60); }  // déjà passé
            }
            if (!canceled && at + (delay || 0) * 60 < nowS - 60) continue;
            out.push({ trip: tripId, shift, route: g.routes.get(trip.route), headsign: trip.headsign, time: at, delay, exact, away, where, live: !!v || exact, canceled, skipped, quay: id });
          }
        }
        out.sort((a, b) => (a.time + (a.delay || 0) * 60) - (b.time + (b.delay || 0) * 60));
        const alerts = alertsFor(live, grp.routes, ids);
        return { stop: { name: grp.name, town: grp.town }, now: nowS, departures: out.slice(0, max), liveAt: live?.timestamp || 0, buses: fresh.size, rt: !!def.rt?.length, alerts };
      }

      // itinéraire d'un arrêt à un autre du même réseau, d'après les horaires : les directs, et avec une correspondance (2 min au moins pour changer)
      function routeSearch(g, fromKey, toKey, at = Date.now(), max = 6) {
        const A = g.groups.get(fromKey), B = g.groups.get(toKey); if (!A || !B) throw new Error('arrêt inconnu');
        const now = new Date(at), nowS = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(), yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
        const boards = (ids, after, until) => {
          const out = [];
          for (const id of ids) for (const [tripId, t, seq] of g.byStop.get(id) || []) {
            const trip = g.trips.get(tripId); if (!trip) continue;
            for (const [day, shift] of [[now, 0], [yesterday, 86400]]) { const s = t - shift; if (s >= after && s <= until && running(g, trip.service, day)) out.push({ tripId, shift, seq, t: s, id }); }
          }
          return out.sort((a, b) => a.t - b.t);
        };
        const leg = (b, off) => { const trip = g.trips.get(b.tripId); return { route: g.routes.get(trip.route), headsign: trip.headsign, trip: b.tripId, shift: b.shift, from: g.stops.get(b.id)?.name || '', dep: b.t, to: g.stops.get(off[1])?.name || '', arr: off[2] - b.shift }; };
        const inB = new Set(B.ids), res = [], dep = boards(A.ids, nowS - 60, nowS + 3 * 3600), offAt = (b, set) => g.byTrip.get(b.tripId)?.find(s => s[0] > b.seq && set.has(s[1]));
        for (const b of dep) { const off = offAt(b, inB); if (off) res.push([leg(b, off)]); }
        for (const b of dep.slice(0, 25)) {
          for (const s of g.byTrip.get(b.tripId) || []) {
            if (s[0] <= b.seq) continue; const grp = g.groups.get(g.stops.get(s[1])?.key); if (!grp || grp === A || grp === B) continue;
            const arr = s[2] - b.shift;
            for (const b2 of boards(grp.ids, arr + 120, arr + 3600)) { if (b2.tripId === b.tripId) continue; const off = offAt(b2, inB); if (off) { res.push([leg(b, s), leg(b2, off)]); break; } }
          }
        }
        const opts = res.map(legs => ({ legs, dep: legs[0].dep, arr: legs.at(-1).arr })).sort((a, b) => a.arr - b.arr || b.dep - a.dep || a.legs.length - b.legs.length), kept = [];
        for (const o of opts) if (!kept.some(k => k.dep >= o.dep)) kept.push(o);
        return { from: { name: A.name, town: A.town }, to: { name: B.name, town: B.town }, now: nowS, options: kept.slice(0, max) };
      }

      // ---------- ce que la page demande ; « list » : les réseaux choisis ({ id, title, gtfs, rt, trips }) ----------
      async function call(name, ...a) {
        if (name === 'tp:networks') return findNetworks(await networks(a[1]), a[0] || '').slice(0, 60);
        if (name === 'tp:search') {  // dans tous les réseaux choisis ; un réseau qui ne se charge pas est signalé sans gêner les autres
          const [q, list] = a, out = [], errs = [];
          await Promise.all((list || []).map(async def => { try { const g = await load(net(def)); for (const s of rank([...g.groups.values()], q).slice(0, 20)) out.push({ key: def.id + '~' + s.key, name: s.name, town: s.town, quays: s.ids.length, net: def.id, netTitle: def.title, _r: out.length }); } catch (e) { errs.push(def.title + ' : ' + e.message); } }));
          if (!out.length && errs.length) throw new Error(errs.join(' · '));
          const n = norm(q); return out.sort((x, y) => (norm(x.name) === n ? 0 : 1) - (norm(y.name) === n ? 0 : 1)).slice(0, 30).map(({ _r, ...s }) => s);
        }
        if (name === 'tp:next') { const [key, list, at] = a, [id, k] = split(key); return departures(defOf(list, id), k, 30, typeof at === 'number' ? at : Date.now()); }
        if (name === 'tp:trip') { const [id, tripId, list] = a, g = await load(net(defOf(list, id))); return (g.byTrip.get(tripId) || []).map(([, stop, time]) => ({ name: g.stops.get(stop)?.name || '', time })); }
        if (name === 'tp:route') {
          const [ka, kb, list, at] = a, [ia, sa] = split(ka), [ib, sb] = split(kb);
          if (ia !== ib) throw new Error('les deux arrêts doivent être sur le même réseau');
          return routeSearch(await load(net(defOf(list, ia))), sa, sb, typeof at === 'number' ? at : Date.now());
        }
        throw new Error('inconnu : ' + name);
      }
      return { call, parseGtfs, decode, unzipText, rank, routeSearch, departures, findNetworks, alertsFor, rtDelay, csv };
    }

    const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    const toB64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
    const pipe = async (u8, t) => new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(t)).arrayBuffer());
    const fname = n => 'tp-' + n.replace(/[^\w.-]/g, '_');
    const mem = new Map();  // ce que les fichiers du plugin refusent (trop gros même compressé) reste en mémoire jusqu'à la fermeture
    const io = {
      phone: true, maxTrips: 60000,
      fetchBin: async url => {
        const r = await ctx.net(url, { binary: true });
        if (r && r.ok && !r.b64) throw new Error('mets NeoDex à jour (3.2.6 ou plus) pour télécharger les horaires');  // un NeoDex d'avant ne sait pas rendre un fichier
        if (!r || !r.ok || !r.b64) throw new Error('erreur ' + (r && r.status));
        return unb64(r.b64);
      },
      fetchText: async url => { const r = await ctx.net(url); if (!r || !r.ok) throw new Error('erreur ' + (r && r.status)); return r.body; },
      inflate: raw => pipe(raw, new DecompressionStream('deflate-raw')),
      cacheGet: async n => { if (mem.has(n)) return mem.get(n); try { const b = await folder.readFile(fname(n)); return b == null ? null : new TextDecoder().decode(await pipe(unb64(b), new DecompressionStream('gzip'))); } catch { return null; } },
      cacheSet: async (n, t) => { try { await folder.writeFile(fname(n), toB64(await pipe(new TextEncoder().encode(t), new CompressionStream('gzip')))); await folder.writeFile(fname(n + '.at'), btoa(String(Date.now()))); mem.delete(n); } catch { mem.set(n, t); } },
      cacheAge: async n => { try { const b = await folder.readFile(fname(n + '.at')); return b == null ? Infinity : Date.now() - +atob(b); } catch { return Infinity; } },
      toast: m => toast(m),
    };
    const E = tpEngine(io);
    return E.call;
  })();
  const nets = () => prefs.nets, netOf = key => prefs.nets.find(n => n.id === String(key).split('~')[0]);
  const errText = e => String(e?.message || e).replace(/^.*Error: /, '');
  let tpStop = null, tpTimer = null, tpTrip = null;
  const tpFavs = () => prefs.tadaoStops || [];

  // ---- les réseaux choisis, et l'ajout d'un réseau depuis le catalogue national ----
  function netChips() {
    const add = el('button', 'btn px' + (nets().length ? '' : ' main'), nets().length ? '+ RÉSEAU' : '+ CHOISIR MON RÉSEAU');
    add.onclick = () => netPicker(!$('tpNetPick').childElementCount);
    $('tpNets').replaceChildren(...nets().map(n => {
      const c = el('span', 'tpNet'), x = el('i', '', '✕'); c.append(el('span', '', n.title), x); c.title = n.rt?.length ? 'Horaires et temps réel' : 'Horaires seulement (ce réseau ne donne pas de temps réel)';
      x.onclick = async () => { if (!await ctx.host.confirm('Retirer « ' + n.title + ' » ? Ses arrêts favoris partent aussi.', { ok: 'Retirer', danger: true })) return;
        prefs.nets = nets().filter(y => y !== n); prefs.tadaoStops = tpFavs().filter(s => !s.key.startsWith(n.id + '~')); if (tpStop && netOf(tpStop.key) == null) tpStop = null; await save(); refreshAll(); };
      return c;
    }), add);
    $('tpNetHint').textContent = nets().length ? nets().length + ' réseau' + (nets().length > 1 ? 'x' : '') + ' · données transport.data.gouv.fr' : '';
  }
  function netPicker(open) {
    const box = $('tpNetPick'); if (!open) return box.replaceChildren();
    const inp = el('input', 'f'), res = el('div', 'tpNetRes'); inp.placeholder = 'Ville, région, réseau ou exploitant (ex : Lille, Hauts-de-France, TER, Tadao…)'; inp.spellcheck = false;
    let n = 0;
    const show = async () => {
      const me = ++n; res.replaceChildren(el('div', 'hint', 'Recherche dans le catalogue national…'));
      try {
        const list = await tp('tp:networks', inp.value.trim()); if (me !== n) return;
        res.replaceChildren(...(list.length ? list.slice(0, 40).map(d => {
          const b = el('button', 'tpResult'), l = el('div'), big = d.trips > MAX_TRIPS, have = nets().some(x => x.id === d.id);
          const name = el('b', '', d.title); if (d.rt.length) name.append(el('span', 'tpTag', 'TEMPS RÉEL')); if (big) name.append(el('span', 'tpTag no', 'TROP GRAND'));
          l.append(name, el('small', '', [d.area, d.by].filter(Boolean).join(' · ')));
          b.append(l, el('span', '', have ? '✓ choisi' : d.trips ? d.trips.toLocaleString('fr-FR') + ' trajets' : ''));
          b.onclick = async () => {
            if (have) return; if (big) return toast('Ce réseau est trop grand pour NeoDex (' + d.trips.toLocaleString('fr-FR') + ' trajets).', true);
            prefs.nets.push({ id: d.id, title: d.title, gtfs: d.gtfs, rt: d.rt, trips: d.trips }); await save(); netPicker(false); refreshAll(); toast('Ajouté : ' + d.title + '. Cherche un arrêt pour commencer.');
          };
          return b;
        }) : [el('div', 'hint', 'Aucun réseau trouvé.')]));
      } catch (e) { if (me === n) res.replaceChildren(el('div', 'hint', errText(e))); }
    };
    let t = 0; inp.oninput = () => { clearTimeout(t); t = setTimeout(show, 250); };
    box.replaceChildren(inp, res); inp.focus(); show();
  }
  function refreshAll() { netChips(); tpChips(); if (tpStop) tpShow(tpStop); else $('tpBoard').replaceChildren(el('div', 'hint', nets().length ? 'Choisis un arrêt pour voir les prochains passages.' : 'Choisis d\'abord ton réseau (bus, tram, métro, car ou train) : tous ceux de France sont dans la liste.')); }

  function tpChips() {
    $('tpFavs').replaceChildren(...(tpFavs().length ? tpFavs().map(s => { const b = el('button', 'tab px' + (tpStop?.key === s.key ? ' on' : ''), (s.alert ? '🔔 ' : '') + s.name); b.title = [s.town, netOf(s.key)?.title].filter(Boolean).join(' · '); b.onclick = () => tpShow(s); return b; }) : [el('span', 'hint', nets().length ? 'Cherche un arrêt puis clique sur ☆ pour le garder ici.' : '')]));
  }
  async function tpOpen() { netChips(); tpChips(); if (!nets().length) { refreshAll(); netPicker(true); } else if (!tpStop && tpFavs()[0]) tpShow(tpFavs()[0]); else if (tpStop) tpShow(tpStop); }
  const resultBtn = (s, onclick) => { const b = el('button', 'tpResult'); b.append(el('b', '', s.name), el('span', '', [s.town, nets().length > 1 ? s.netTitle : ''].filter(Boolean).join(' · ') + (s.quays > 1 ? ' · ' + s.quays + ' quais' : ''))); b.onclick = onclick; return b; };
  $('tpSearch').oninput = async e => {
    const q = e.target.value.trim(); if (q.length < 2) return $('tpResults').replaceChildren();
    if (!nets().length) return $('tpResults').replaceChildren(el('div', 'hint', 'Choisis d\'abord un réseau (bouton + CHOISIR MON RÉSEAU).'));
    $('tpResults').replaceChildren(el('div', 'hint', 'Recherche… (la première fois, NeoDex télécharge les horaires du réseau)'));
    try {
      const r = await tp('tp:search', q, nets());
      if (e.target.value.trim() !== q) return;
      $('tpResults').replaceChildren(...(r.length ? r.map(s => resultBtn(s, () => { $('tpSearch').value = ''; $('tpResults').replaceChildren(); tpShow(s); })) : [el('div', 'hint', 'Aucun arrêt trouvé.')]));
    } catch (err) { $('tpResults').replaceChildren(el('div', 'hint', 'Horaires indisponibles : ' + errText(err))); }
  };
  const hhmm = t => String(Math.floor(t / 3600) % 24).padStart(2, '0') + ':' + String(Math.floor(t % 3600 / 60)).padStart(2, '0');
  // où est le véhicule entre deux arrêts, d'après l'heure : l'indice de l'arrêt passé et la part du chemin vers le suivant (null : pas encore parti ou arrivé)
  const busAt = (times, now) => { if (!times.length || now < times[0] || now >= times.at(-1)) return null; let i = 0; while (times[i + 1] <= now) i++; return [i, times[i + 1] > times[i] ? (now - times[i]) / (times[i + 1] - times[i]) : 0]; };
  console.assert(JSON.stringify(busAt([100, 200, 400], 300)) === '[1,0.5]' && busAt([100, 200], 50) === null && busAt([100, 200], 200) === null, 'busAt');
  function busIcon(c) {  // un petit bus en pixels, aux couleurs de la ligne
    const cv = document.createElement('canvas'); cv.width = 11; cv.height = 7; cv.className = 'tpBus'; const g = cv.getContext('2d');
    g.fillStyle = c || '#8a5cf0'; g.fillRect(0, 0, 11, 5); g.fillStyle = '#d8f0ff'; for (const x of [1, 4, 7]) g.fillRect(x, 1, 2, 2); g.fillRect(9, 1, 1, 3); g.fillStyle = '#05010b'; g.fillRect(2, 5, 2, 2); g.fillRect(7, 5, 2, 2);
    return cv;
  }
  function tpPlan(box, list, d, now, here) {  // le plan de la ligne : chaque arrêt sur un trait à la couleur de la ligne, le véhicule avance entre deux arrêts
    const times = list.map(p => p.time - (d.shift || 0) + (d.delay || 0) * 60);
    box.className = 'tpStops tpPlan'; box.style.setProperty('--lc', d.route?.color || '#8a5cf0');
    const rows = list.map((p, i) => { const e = el('div', 'tpStop' + (times[i] <= now ? ' past' : p.name === here ? ' here' : '')); e.append(el('span', '', p.name), el('b', '', hhmm(times[i]))); return e; });
    box.replaceChildren(...rows);
    const at = busAt(times, now); if (!at || d.canceled) return;
    const bus = busIcon(d.route?.color), a = rows[at[0]], b = rows[at[0] + 1]; bus.title = d.live ? 'Position estimée d’après le temps réel' : 'Position estimée d’après l’horaire';
    bus.style.top = (a.offsetTop + a.offsetHeight / 2 + (b.offsetTop - a.offsetTop) * at[1]) + 'px'; box.append(bus);
  }
  // l'itinéraire : deux arrêts choisis dans une liste qui s'ouvre sous la saisie
  const tpEnds = { from: null, to: null };
  function tpPicker(inp, k) {
    const res = inp.nextElementSibling; let n = 0;
    inp.oninput = async () => { tpEnds[k] = null; const q = inp.value.trim(), me = ++n; if (q.length < 2) return res.replaceChildren();
      try { const r = await tp('tp:search', q, nets()); if (me !== n) return; res.replaceChildren(...r.slice(0, 8).map(s => resultBtn(s, () => { tpEnds[k] = s; inp.value = s.name; res.replaceChildren(); }))); }
      catch (err) { res.replaceChildren(el('div', 'hint', errText(err))); } };
    inp.onblur = () => setTimeout(() => res.replaceChildren(), 200);
  }
  tpPicker($('tpFrom'), 'from'); tpPicker($('tpTo'), 'to');
  function tpRouteShow(r) {
    const box = $('tpRoute');
    if (!r.options.length) return box.replaceChildren(el('div', 'hint', 'Aucun trajet de ' + r.from.name + ' à ' + r.to.name + ' dans les 3 prochaines heures (même avec une correspondance).'));
    box.replaceChildren(...r.options.map(o => {
      const row = el('div', 'tpOpt'), badge = l => { const x = el('span', 'tpLine', l.route?.name || '?'); x.style.background = l.route?.color; x.style.color = l.route?.text; return x; };
      row.append(el('b', '', hhmm(o.dep) + ' → ' + hhmm(o.arr)));
      o.legs.forEach((l, i) => row.append(...(i ? [el('span', '', 'puis, à ' + l.from + ' (' + hhmm(l.dep) + ')')] : []), badge(l), el('span', '', 'direction ' + l.headsign)));
      row.append(el('span', 'dur', Math.round((o.arr - o.dep) / 60) + ' min' + (o.legs.length > 1 ? ' · 1 correspondance' : ' · direct') + (o.dep - r.now > 60 ? ' · dans ' + Math.round((o.dep - r.now) / 60) + ' min' : '')));
      return row;
    }));
  }
  $('tpGo').onclick = async () => {
    const a = tpEnds.from || (!$('tpFrom').value.trim() && tpStop), b = tpEnds.to;
    if (!a || !b) return toast(!b ? 'Choisis l’arrêt d’arrivée dans la liste' : 'Choisis l’arrêt de départ dans la liste', true);
    $('tpRoute').replaceChildren(el('div', 'hint', 'Recherche des trajets…'));
    try { tpRouteShow(await tp('tp:route', a.key, b.key, nets())); } catch (err) { $('tpRoute').replaceChildren(el('div', 'hint', 'Itinéraire indisponible : ' + errText(err))); }
  };
  // ce que dit une ligne de passage : supprimé, ne s'arrête pas, en circulation, retard (exact ou estimé)
  function rowInfo(d) {
    if (d.canceled) return 'supprimé';
    if (d.skipped) return 'ne s\'arrête pas à cet arrêt';
    const late = d.delay > 1 ? (d.exact ? ' · retard ' : ' · retard estimé ') + d.delay + ' min' : d.delay != null && d.delay < -1 ? ' · en avance' : d.exact ? ' · à l\'heure' : '';
    if (d.live) return '● en circulation' + (d.away != null ? ' · à ' + d.away + ' arrêt' + (d.away > 1 ? 's' : '') + (d.where ? ' (' + d.where + ')' : '') : '') + late;
    return 'horaire prévu ' + hhmm(d.time) + late;
  }
  async function tpShow(s) {
    clearTimeout(tpTimer); tpStop = s; tpChips();
    if (!view.classList.contains('on')) return;
    tpTimer = setTimeout(() => tpShow(s), 30000);
    const fav = tpFavs().find(f => f.key === s.key), star = el('button', 'nbaStar' + (fav ? ' on' : ''), fav ? '★' : '☆');
    star.title = fav ? 'Retirer de mes arrêts' : 'Garder cet arrêt';
    star.onclick = async () => { prefs.tadaoStops = fav ? tpFavs().filter(f => f.key !== s.key) : [...tpFavs(), { key: s.key, name: s.name, town: s.town }]; await save(); tpShow(s); };
    const head = el('div', 'tpHead'); head.append(el('span', 'tpName', s.name), el('span', 'hint', [s.town, netOf(s.key)?.title].filter(Boolean).join(' · ')), star);
    if (fav) {  // la cloche : prévenir d'une perturbation à cet arrêt
      const bell = el('button', 'btn px', fav.alert ? '🔔 PERTURBATIONS : OUI' : '🔕 PERTURBATIONS : NON');
      bell.title = 'Une notification quand un passage de la prochaine heure est supprimé, a 10 min de retard ou plus, ou qu\'une alerte du réseau touche cet arrêt (vérifié toutes les 5 min, même onglet fermé)';
      bell.onclick = async () => { fav.alert = !fav.alert; await save(); tpShow(s); toast(fav.alert ? 'Tu seras prévenu des perturbations à ' + s.name : 'Plus de notification pour ' + s.name); };
      head.append(bell);
    }
    if ($('tpBoard').dataset.key !== s.key) { $('tpBoard').dataset.key = s.key; $('tpBoard').replaceChildren(head, el('div', 'hint', 'Chargement…')); }  // le même arrêt toutes les 30 s : l'ancien tableau reste jusqu'au nouveau
    try {
      const r = await tp('tp:next', s.key, nets()), net = netOf(s.key);
      const alerts = (r.alerts || []).map(a => { const x = el('div', 'tpAlert'); x.append(el('b', '', '⚠ ' + (a.header || 'Info réseau')), a.desc ? el('div', '', a.desc) : ''); return x; });
      const rows = r.departures.map(d => {
        const row = el('div', 'tpRow' + (d.canceled || d.skipped ? ' gone' : d.delay >= 5 ? ' late' : d.live ? ' live' : '')), line = el('span', 'tpLine', d.route?.name || '?'), mins = Math.round((d.time + (d.delay || 0) * 60 - r.now) / 60);
        line.style.background = d.route?.color; line.style.color = d.route?.text;
        const when = el('span', 'tpWhen' + (mins <= 1 && !d.canceled ? ' now' : ''), mins <= 0 ? 'à quai' : mins < 60 ? mins + ' min' : hhmm(d.time + (d.delay || 0) * 60));
        const info = el('div', 'tn'); info.append(d.headsign, el('small', '', rowInfo(d)));
        row.append(line, info, when);
        const stops = el('div', 'tpStops');  // un clic sur un passage : tous ses arrêts, avec leurs heures
        const fill = async () => tpPlan(stops, await tp('tp:trip', net.id, d.trip, nets()), d, r.now, s.name);
        row.onclick = () => { const on = tpTrip === d.trip; tpTrip = on ? null : d.trip; view.querySelectorAll('.tpStops').forEach(x => x.replaceChildren()); if (!on) fill().catch(e => toast(errText(e), true)); };
        if (tpTrip === d.trip) fill().catch(() => {});
        return [row, stops];
      }).flat();
      const foot = 'Horaires ' + (net?.title || '') + ' (transport.data.gouv.fr)' + (!r.rt ? ' · pas de temps réel sur ce réseau' : ' · temps réel' + (r.buses ? ', ' + r.buses + ' véhicules suivis' : '') + (r.liveAt ? ' (' + new Date(r.liveAt * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ')' : ''));
      $('tpBoard').replaceChildren(head, ...alerts, ...(rows.length ? rows : [el('div', 'hint', 'Plus de passage dans les 3 prochaines heures.')]), el('div', 'hint', foot));
    } catch (err) { $('tpBoard').replaceChildren(head, el('div', 'hint', 'Horaires indisponibles : ' + errText(err))); }
  }

  // ---- perturbations des arrêts à cloche : toutes les 5 min, même onglet fermé ; une seule notification par passage ou par alerte ----
  async function watch() {
    const favs = tpFavs().filter(f => f.alert && netOf(f.key)); if (!favs.length) return;
    const sent = new Set(prefs.sent || []), today = new Date().toDateString(), out = [];
    for (const f of favs) {
      let r; try { r = await tp('tp:next', f.key, nets()); } catch { continue; }
      for (const d of r.departures) {
        const mins = (d.time - r.now) / 60; if (mins > 60) continue;
        const why = d.canceled ? 'supprimé' : d.skipped ? 'ne s\'arrête pas' : d.delay >= 10 ? d.delay + ' min de retard' : '';
        const id = today + '|' + d.trip + '|' + why; if (!why || sent.has(id)) continue;
        sent.add(id); out.push({ title: (d.route?.name || '') + ' ' + hhmm(d.time) + ' → ' + d.headsign + ' : ' + why, body: f.name });
      }
      for (const a of r.alerts || []) { const id = 'a|' + a.id + '|' + a.header; if (sent.has(id)) continue; sent.add(id); out.push({ title: '⚠ ' + (a.header || 'Info réseau'), body: f.name + (a.desc ? ' · ' + a.desc.slice(0, 200) : '') }); }
    }
    prefs.sent = [...sent].slice(-300); await save();
    for (const n of out.slice(0, 4)) ctx.notifications?.send({ type: 'perturbation', title: n.title, body: n.body, open: 'plugin:neodex.transports' }).catch(() => {});
  }
  ctx.background?.every?.(5, () => watch().catch(() => {}));

  view.__tp = { route: tpRouteShow, plan: tpPlan, busAt, rowInfo };  // pour l'auto-test
  ctx.onOpen(() => { tpOpen(); });
  ctx.onClose(() => { clearTimeout(tpTimer); });
  refreshAll();
}
