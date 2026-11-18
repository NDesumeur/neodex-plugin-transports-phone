// Transports : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoDex sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoDex.
// Elle tourne dans le bac à sable de NeoDex, avec ses outils d'interface (ctx.host) et seulement les autorisations de son plugin.json.
const HTML = "<div class=\"appWrap wide\">\n      <div class=\"agHead\"><span class=\"label\">Transports · Tadao</span></div>\n      <div id=\"tpFavs\" class=\"setBg\"></div>\n      <div class=\"sysCard px\"><input class=\"f\" id=\"tpSearch\" placeholder=\"Chercher un arrêt (ex : Gare de Lens, Bollaert…)\" spellcheck=\"false\"><div id=\"tpResults\"></div></div>\n      <div class=\"sysCard px tpTrip\"><span class=\"label\">Itinéraire · quel bus prendre</span><div class=\"tpIt\"><div class=\"tpPick\"><input class=\"f\" id=\"tpFrom\" placeholder=\"De… (l’arrêt affiché si vide)\" spellcheck=\"false\"><div class=\"tpRes\"></div></div><div class=\"tpPick\"><input class=\"f\" id=\"tpTo\" placeholder=\"À… (ex : Gare de Lens)\" spellcheck=\"false\"><div class=\"tpRes\"></div></div><button class=\"btn px\" id=\"tpGo\">QUEL BUS ?</button></div><div id=\"tpRoute\"></div></div>\n      <div class=\"sysCard px\" id=\"tpBoard\"><div class=\"hint\">Choisis un arrêt pour voir les prochains passages.</div></div>\n    </div>";
/*CSS-MOVED*/ const CSS = `#tpSearch{font-size:clamp(17px,1.15vw,20px)}
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
.tpRow{cursor:var(--cp,pointer)}
.tpStops:not(:empty){display:flex;flex-direction:column;margin:0 0 8px 20px;padding-left:12px;box-shadow:inset 3px 0 0 var(--line2)}
.tpStop{display:flex;justify-content:space-between;gap:12px;padding:3px 8px;font-size:clamp(14px,1vw,17px);color:var(--lilac)}
.tpStop.past{color:var(--muted);opacity:.6}
.tpStop.here{color:#fff;background:rgba(var(--mgr),.2)}
.tpResult{all:unset;cursor:var(--cp,pointer);display:flex;justify-content:space-between;gap:12px;padding:8px 10px;font-size:clamp(15px,1.05vw,18px)}
.tpResult:hover{background:rgba(var(--mgr),.14)}
.tpResult b{color:#fff;font-weight:600}
.tpResult span{color:var(--muted)}
.tpHead{display:flex;align-items:center;gap:14px}
.tpName{font:600 clamp(22px,1.7vw,30px) var(--text);color:#fff}
.tpRow{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.tpLine{min-width:64px;text-align:center;padding:6px 8px;font:clamp(11px,.8vw,14px) var(--title);letter-spacing:.5px}
.tpRow .tn{color:#fff;font-size:clamp(16px,1.15vw,20px);min-width:0}
.tpRow small{display:block;font-size:clamp(13px,.9vw,15px);color:var(--muted)}
.tpRow.live small{color:#8ee8a0}
.tpWhen{font:clamp(15px,1.15vw,21px) var(--title);color:#fff;white-space:nowrap}
.tpWhen.now{color:var(--pink)}
.nbaStar{all:unset;cursor:var(--cp,pointer);color:var(--muted);font-size:16px;padding:0 4px}
.nbaStar:hover,.nbaStar.on{color:#ffd07a}
`;  // le style de ce plugin (il utilise les variables du thème de NeoDex)
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const { el, toast, sfx, ask, newTab, pixIcon, PIX, WX } = ctx.host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => id === "busApp" ? view : view.querySelector('#' + id);  // les identifiants de ta vue, sans toucher à ceux du reste de NeoDex
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  let prefs = await doc('prefs');
  if (prefs == null) {  // première ouverture : tu retrouves tes réglages d'avant
    prefs = {}; const old = legacy.settings ? await legacy.settings().catch(() => ({})) : {};
    for (const k of ["tadaoStops"]) if (old[k] !== undefined && old[k] !== '' && !(Array.isArray(old[k]) && !old[k].length)) prefs[k] = old[k];
    if (Object.keys(prefs).length) await folder.write('prefs', prefs);
  }
  // ---- les horaires, calculés ici : sur téléphone un plugin n'a pas de main.js. Même code que main.js et gtfs-rt.js du plugin PC ----
  const tp = (() => {
    const TADAO_GTFS = 'https://www.data.gouv.fr/api/1/datasets/r/47a5e290-7883-4a40-bdcf-b693f64087b0', TADAO_RT = 'https://www.data.gouv.fr/api/1/datasets/r/c4563dcc-f547-489a-b63a-efb4dbb37262';
    const GTFS_FILES = ['stops.txt', 'routes.txt', 'trips.txt', 'stop_times.txt', 'calendar.txt', 'calendar_dates.txt'];
    let gtfs = null, gtfsLoading = null, rt = { at: 0, data: null };
    const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    const toB64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
    function csv(text, onRow) {  // header line + rows, quotes handled
      const lines = text.replace(/^﻿/, '').split(/\r?\n/), head = lines[0].split(',');
      const cell = l => { if (!l.includes('"')) return l.split(','); const o = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (c === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (c === ',' && !q) { o.push(cur); cur = ''; } else cur += c; } o.push(cur); return o; };
      for (let i = 1; i < lines.length; i++) if (lines[i]) { const v = cell(lines[i]), r = {}; head.forEach((h, k) => r[h] = v[k]); onRow(r); }
    }
    // les fichiers voulus d'une archive .zip (rangés tels quels ou compressés « deflate »)
    async function unzipText(u8, names) {
      const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), out = {};
      let e = u8.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
      if (e < 0) throw new Error('archive Tadao illisible');
      let p = dv.getUint32(e + 16, true);
      for (let n = dv.getUint16(e + 10, true); n > 0; n--) {
        const method = dv.getUint16(p + 10, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), F = 0xFFFFFFFF;
        let usize = dv.getUint32(p + 24, true), size = dv.getUint32(p + 20, true), off = dv.getUint32(p + 42, true);
        // ZIP64 (l'archive Tadao) : les tailles et la position marquées 0xFFFFFFFF sont dans le champ extra 0x0001, dans cet ordre
        for (let x = p + 46 + nl; x + 4 <= p + 46 + nl + xl; x += 4 + dv.getUint16(x + 2, true)) if (dv.getUint16(x, true) === 1) {
          let q = x + 4; const big = () => { const v = Number(dv.getBigUint64(q, true)); q += 8; return v; };
          if (usize === F) usize = big(); if (size === F) size = big(); if (off === F) off = big();
        }
        const base = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl)).split('/').pop();
        p += 46 + nl + xl + dv.getUint16(p + 32, true);
        if (!names.includes(base)) continue;
        const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), raw = u8.subarray(start, start + size);
        if (method !== 0 && method !== 8) throw new Error('archive Tadao illisible (compression inconnue)');
        out[base] = new TextDecoder().decode(method === 0 ? raw : await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      }
      return out;
    }
    // les horaires sont gardés dans les fichiers du plugin sur ce téléphone (pas synchronisés) et retéléchargés chaque semaine, comme sur PC
    const readTxt = async n => { try { const b = await folder.readFile(n); return b == null ? null : new TextDecoder().decode(unb64(b)); } catch { return null; } };
    async function gtfsTexts() {
      const at = +(await readTxt('gtfs-at')) || 0, kept = {};
      for (const f of GTFS_FILES) kept[f] = await readTxt(f);
      const have = GTFS_FILES.every(f => kept[f] != null);
      if (have && Date.now() - at < 7 * 864e5) return kept;
      try {
        toast('Téléchargement des horaires Tadao (environ 20 Mo, une fois par semaine)…');
        const r = await ctx.net(TADAO_GTFS, { binary: true });
        if (r && r.ok && !r.b64) throw new Error('mets NeoDex à jour (3.2.6 ou plus) pour télécharger les horaires');  // un NeoDex d'avant ne sait pas rendre un fichier
        if (!r || !r.ok || !r.b64) throw new Error('horaires Tadao indisponibles (' + (r && r.status) + ')');
        const t = await unzipText(unb64(r.b64), GTFS_FILES);
        if (GTFS_FILES.some(f => t[f] == null)) throw new Error('archive Tadao incomplète');
        try { const enc = new TextEncoder(); for (const f of GTFS_FILES) await folder.writeFile(f, toB64(enc.encode(t[f]))); await folder.writeFile('gtfs-at', toB64(enc.encode(String(Date.now())))); } catch {}  // trop gros pour les fichiers du plugin : gardés en mémoire jusqu'à la fermeture
        return t;
      } catch (e) { if (have) return kept; throw e; }  // pas de réseau : les horaires de la semaine dernière
    }
    const getGtfs = () => gtfs ? Promise.resolve(gtfs) : (gtfsLoading ??= gtfsTexts().then(t => (gtfs = parseGtfs(t)), e => { gtfsLoading = null; throw e; }));

    const secs = t => { const [h, m, s] = t.split(':').map(Number); return h * 3600 + m * 60 + (s || 0); };
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

    function parseGtfs(t) {
      const g = { stops: new Map(), groups: new Map(), routes: new Map(), trips: new Map(), byStop: new Map(), byTrip: new Map(), cal: new Map(), dates: new Map() };
      csv(t['stops.txt'], r => {
        if (r.location_type === '1') return;
        // the quays of a hub ("Béhal-Jean Zay - Quai 4") are one stop for the traveller
        const name = r.stop_name.replace(/\s*-\s*Quai\s*\d+\s*$/i, ''), town = (/\d{5}\s+(.+)$/.exec(r.stop_desc || '') || [])[1] || '', key = norm(name) + '|' + norm(town);
        g.stops.set(r.stop_id, { name, quay: r.stop_name, town, key, lat: +r.stop_lat, lon: +r.stop_lon });
        if (!g.groups.has(key)) g.groups.set(key, { key, name, town, ids: [], lat: +r.stop_lat, lon: +r.stop_lon });
        g.groups.get(key).ids.push(r.stop_id);
      });
      csv(t['routes.txt'], r => g.routes.set(r.route_id, { name: r.route_short_name || r.route_long_name, long: r.route_long_name, color: '#' + (r.route_color || '8a5cf0'), text: '#' + (r.route_text_color || 'ffffff') }));
      csv(t['trips.txt'], r => g.trips.set(r.trip_id, { route: r.route_id, service: r.service_id, headsign: r.trip_headsign }));
      csv(t['stop_times.txt'], r => {
        const t = secs(r.departure_time || r.arrival_time), seq = +r.stop_sequence;
        if (!g.byStop.has(r.stop_id)) g.byStop.set(r.stop_id, []); g.byStop.get(r.stop_id).push([r.trip_id, t, seq]);
        if (!g.byTrip.has(r.trip_id)) g.byTrip.set(r.trip_id, []); g.byTrip.get(r.trip_id).push([seq, r.stop_id, t]);
      });
      for (const l of g.byTrip.values()) l.sort((a, b) => a[0] - b[0]);
      csv(t['calendar.txt'], r => g.cal.set(r.service_id, r));
      csv(t['calendar_dates.txt'], r => { if (!g.dates.has(r.date)) g.dates.set(r.date, new Map()); g.dates.get(r.date).set(r.service_id, r.exception_type); });
      return g;
    }
    const ymdC = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    function running(g, service, day) {  // calendar + exceptions (1 = added, 2 = removed that day)
      const ex = g.dates.get(ymdC(day))?.get(service);
      if (ex === '1') return true; if (ex === '2') return false;
      const c = g.cal.get(service); if (!c) return false;
      const d = ymdC(day), wd = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day.getDay()];
      return c[wd] === '1' && d >= c.start_date && d <= c.end_date;
    }

    async function realtime() {
      if (Date.now() - rt.at < 20000) return rt.data;
      try { const r = await ctx.net(TADAO_RT, { binary: true }); rt = { at: Date.now(), data: r && r.ok && r.b64 ? decode(unb64(r.b64)) : null }; } catch { rt = { at: Date.now(), data: null }; }
      return rt.data;
    }
    function fields(buf, start = 0, end = buf.length) {  // -> [[fieldNumber, wireType, value]]
      const out = [];
      let i = start;
      const varint = () => { let v = 0, m = 1, b; do { b = buf[i++]; v += (b & 0x7f) * m; m *= 128; } while (b & 0x80); return v; };
      while (i < end) {
        const key = varint(), f = Math.floor(key / 8), w = key & 7;
        if (w === 0) out.push([f, 0, varint()]);
        else if (w === 1) { out.push([f, 1, new DataView(buf.buffer, buf.byteOffset).getFloat64(i, true)]); i += 8; }
        else if (w === 2) { const n = varint(); out.push([f, 2, [i, i + n]]); i += n; }
        else if (w === 5) { out.push([f, 5, new DataView(buf.buffer, buf.byteOffset).getFloat32(i, true)]); i += 4; }
        else throw new Error('protobuf: wire type ' + w);
      }
      return out;
    }
    const msg = (buf, [a, b]) => fields(buf, a, b);
    const str = (buf, [a, b]) => new TextDecoder().decode(buf.subarray(a, b));
    const get = (fs, n) => fs.find(x => x[0] === n)?.[2];
    const signed = v => v > 0x7fffffff ? v - 0x100000000 : v;  // int32 delays are sent as two's complement varints

    function trip(buf, r) { const t = msg(buf, r); return { tripId: get(t, 1) && str(buf, get(t, 1)), routeId: get(t, 5) && str(buf, get(t, 5)) }; }
    function decode(buf) {
      const vehicles = [], updates = [];
      let timestamp = 0;
      for (const [f, , v] of fields(buf)) {
        if (f === 1) timestamp = get(msg(buf, v), 3) || 0;
        if (f !== 2) continue;
        const e = msg(buf, v);
        const vp = get(e, 4), tu = get(e, 3);
        if (vp) {
          const p = msg(buf, vp), pos = get(p, 2) && msg(buf, get(p, 2)), veh = get(p, 8) && msg(buf, get(p, 8));
          vehicles.push({ ...(get(p, 1) ? trip(buf, get(p, 1)) : {}), lat: pos && get(pos, 1), lon: pos && get(pos, 2), stopId: get(p, 7) && str(buf, get(p, 7)),
            status: get(p, 4) ?? 2, timestamp: get(p, 5) || 0, label: veh && (get(veh, 2) ? str(buf, get(veh, 2)) : get(veh, 1) && str(buf, get(veh, 1))) });
        }
        if (tu) {
          const u = msg(buf, tu), stops = u.filter(x => x[0] === 2).map(x => {
            const s = msg(buf, x[2]), ev = n => { const r = get(s, n); if (!r) return null; const m = msg(buf, r); return { delay: get(m, 1) != null ? signed(get(m, 1)) : null, time: get(m, 2) || null }; };
            return { seq: get(s, 1), stopId: get(s, 4) && str(buf, get(s, 4)), arrival: ev(2), departure: ev(3) };
          });
          updates.push({ ...(get(u, 1) ? trip(buf, get(u, 1)) : {}), delay: get(u, 5) != null ? signed(get(u, 5)) : null, stops });
        }
      }
      return { timestamp, vehicles, updates };
    }

    async function departures(key, max = 30, at = Date.now()) {  // at: another moment (the self-test checks a Monday morning)
      const g = await getGtfs(), grp = g.groups.get(key); if (!grp) throw new Error('arrêt inconnu');
      const now = new Date(at), nowS = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(), out = [];
      const live = await realtime(), fresh = new Map((live?.vehicles || []).filter(v => v.tripId && live.timestamp - v.timestamp < 600).map(v => [v.tripId, v]));
      const today = new Date(now), yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
      for (const id of grp.ids) for (const [tripId, t, seq] of g.byStop.get(id) || []) {
        const trip = g.trips.get(tripId); if (!trip) continue;
        // a time after 24:00 belongs to the previous day's service
        for (const [day, shift] of [[today, 0], [yesterday, 86400]]) {
          const at = t - shift; if (at < nowS - 60 || at > nowS + 3 * 3600 || !running(g, trip.service, day)) continue;
          const stops = g.byTrip.get(tripId), last = stops[stops.length - 1];
          if (last[0] === seq || g.stops.get(last[1])?.key === key) continue;  // ends here (maybe at another quay of this hub): nobody boards it
          const v = fresh.get(tripId); let delay = null, away = null, where = '';
          if (v) {  // estimated delay: where the bus is now compared with its timetable there
            const cur = stops.find(s => s[1] === v.stopId);
            if (cur) { delay = Math.round(Math.max(-120, nowS - (cur[2] - shift)) / 60); away = stops.filter(s => s[0] > cur[0] && s[0] <= seq).length; where = g.stops.get(v.stopId)?.name || ''; if (cur[0] > seq) continue; }  // already gone past
          }
          out.push({ trip: tripId, shift, route: g.routes.get(trip.route), headsign: trip.headsign, time: at, delay, away, where, live: !!v, quay: id });
        }
      }
      out.sort((a, b) => (a.time + (a.delay || 0) * 60) - (b.time + (b.delay || 0) * 60));
      return { stop: { name: grp.name, town: grp.town }, now: nowS, departures: out.slice(0, max), liveAt: live?.timestamp || 0, buses: fresh.size };
    }

    // le classement des arrêts pour une saisie : score bas = meilleur résultat, null = ne correspond pas
    const T_STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'a', 'au', 'aux', 'et', 'arret', 'station']), T_ALIAS = { st: 'saint', ste: 'sainte' };
    const tWords = s => norm(s).split(' ').filter(Boolean).map(w => T_ALIAS[w] || w);
    function lev1(a, b) {  // vrai si a et b diffèrent d'une seule lettre (ajoutée, retirée, changée ou deux lettres échangées)
      if (a === b) return true; if (Math.abs(a.length - b.length) > 1) return false;
      let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
      if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
      return a.length > b.length ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
    }
    function tadaoRank(stops, q) {
      const n = norm(q || ''); if (!n) return [];
      const scored = [];
      let re = null; if (/[.*+?^$|\[\](){}]/.test(q || '')) { try { re = new RegExp(String(q).normalize('NFD').replace(/[\u0300-\u036f]/g, ''), 'i'); } catch {} }
      const qw = tWords(q).filter(w => !T_STOP.has(w)); const tokens = qw.length ? qw : tWords(q);
      for (const s of stops) {
        const name = norm(s.name), nameW = tWords(s.name), townW = tWords(s.town), all = nameW.concat(townW);
        let score = null;
        if (re && re.test(norm(s.name + ' ' + s.town) + ' ' + s.name.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) score = 0.5;
        else if (name === n) score = 0; else if (name.startsWith(n)) score = 1;
        else {
          let total = 0;
          for (const t of tokens) {
            let best = Infinity;
            all.forEach((w, i) => { const pen = i < nameW.length ? 0 : .5;  /* un mot qui n'est que dans la ville compte un peu moins */ let c = Infinity; if (w === t) c = 0; else if (w.startsWith(t)) c = 1; else if (w.includes(t)) c = 2; else if (t.length >= 4 && (lev1(w.slice(0, t.length + 1), t) || lev1(w, t))) c = 3; best = Math.min(best, c + pen); });
            if (best === Infinity) { total = null; break; } total += best;
          }
          if (total !== null) score = 2 + total / tokens.length + nameW.length * .01;  // à égalité, le nom le plus court
        }
        if (score !== null) scored.push([score, s]);
      }
      return scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name, 'fr')).map(x => x[1]);
    }

    // itinéraire d'un arrêt à un autre, d'après les horaires : les bus directs, et des trajets avec une correspondance (2 min au moins pour changer de bus)
    function routeSearch(g, fromKey, toKey, at = Date.now(), max = 6) {
      const A = g.groups.get(fromKey), B = g.groups.get(toKey); if (!A || !B) throw new Error('arrêt inconnu');
      const now = new Date(at), nowS = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(), yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
      const boards = (ids, after, until) => {  // les bus qui partent de ces quais entre deux moments (en secondes depuis minuit)
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
      for (const b of dep.slice(0, 25)) {  // avec une correspondance : on descend à un arrêt de la ligne, on reprend un autre bus dans l'heure
        for (const s of g.byTrip.get(b.tripId) || []) {
          if (s[0] <= b.seq) continue; const grp = g.groups.get(g.stops.get(s[1])?.key); if (!grp || grp === A || grp === B) continue;
          const arr = s[2] - b.shift;
          for (const b2 of boards(grp.ids, arr + 120, arr + 3600)) { if (b2.tripId === b.tripId) continue; const off = offAt(b2, inB); if (off) { res.push([leg(b, s), leg(b2, off)]); break; } }
        }
      }
      // on garde les meilleurs : par heure d'arrivée, et pas un trajet qui part plus tôt pour arriver plus tard qu'un autre
      const opts = res.map(legs => ({ legs, dep: legs[0].dep, arr: legs.at(-1).arr })).sort((a, b) => a.arr - b.arr || b.dep - a.dep || a.legs.length - b.legs.length), kept = [];
      for (const o of opts) if (!kept.some(k => k.dep >= o.dep)) kept.push(o);
      return { from: { name: A.name, town: A.town }, to: { name: B.name, town: B.town }, now: nowS, options: kept.slice(0, max) };
    }


    return async (name, ...a) => {
      const g = await getGtfs(), at = typeof a[a.length - 1] === 'number' ? a[a.length - 1] : Date.now();
      if (name === 'tadao:search') return tadaoRank([...g.groups.values()], a[0]).slice(0, 20).map(s => ({ key: s.key, name: s.name, town: s.town, quays: s.ids.length }));
      if (name === 'tadao:next') return departures(a[0], 30, at);
      if (name === 'tadao:trip') return (g.byTrip.get(a[0]) || []).map(([, stop, time]) => ({ name: g.stops.get(stop)?.name || '', time }));
      if (name === 'tadao:route') return routeSearch(g, a[0], a[1], at);
      throw new Error('inconnu : ' + name);
    };
      })();
  const neo = Object.assign({}, ctx.neo || {}, { tadaoSearch: q => tp('tadao:search', q), tadaoNext: (k, at) => tp('tadao:next', k, at), tadaoTrip: id => tp('tadao:trip', id), win: a => ctx.host.win?.(a), getSettings: async () => prefs, setSettings: async s => { Object.assign(prefs, s); await folder.write('prefs', prefs); return prefs; } });
  // ---- ton code d'origine ----
  /* ---------- Transports app: Tadao (Lens-Liévin-Hénin-Carvin), next departures from the timetables + where the buses are now ---------- */
  let tpStop = null, tpTimer = null, tpTrip = null;
  const tpFavs = () => prefs.tadaoStops || [];
  function tpChips() {
    $('tpFavs').replaceChildren(...(tpFavs().length ? tpFavs().map(s => { const b = el('button', 'tab px' + (tpStop?.key === s.key ? ' on' : ''), s.name); b.title = s.town; b.onclick = () => tpShow(s); return b; }) : [el('span', 'hint', 'Cherche un arrêt puis clique sur ☆ pour le garder ici.')]));
  }
  async function tpOpen() { tpChips(); if (!tpStop && tpFavs()[0]) tpShow(tpFavs()[0]); else if (tpStop) tpShow(tpStop); }
  $('tpSearch').oninput = async e => {
    const q = e.target.value.trim(); if (q.length < 2) return $('tpResults').replaceChildren();
    $('tpResults').replaceChildren(el('div', 'hint', 'Recherche… (la première fois, NeoDex télécharge les horaires Tadao, environ 20 Mo)'));
    try {
      const r = await neo.tadaoSearch(q);
      if (e.target.value.trim() !== q) return;
      $('tpResults').replaceChildren(...(r.length ? r.map(s => { const b = el('button', 'tpResult'); b.append(el('b', '', s.name), el('span', '', s.town + (s.quays > 1 ? ' · ' + s.quays + ' quais' : ''))); b.onclick = () => { $('tpSearch').value = ''; $('tpResults').replaceChildren(); tpShow(s); }; return b; }) : [el('div', 'hint', 'Aucun arrêt trouvé.')]));
    } catch (err) { $('tpResults').replaceChildren(el('div', 'hint', 'Horaires indisponibles : ' + err.message.replace(/^.*Error: /, ''))); }
  };
  const hhmm = t => String(Math.floor(t / 3600) % 24).padStart(2, '0') + ':' + String(Math.floor(t % 3600 / 60)).padStart(2, '0');
  // où est le bus entre deux arrêts, d'après l'heure : l'indice de l'arrêt passé et la part du chemin vers le suivant (null : pas encore parti ou arrivé)
  const busAt = (times, now) => { if (!times.length || now < times[0] || now >= times.at(-1)) return null; let i = 0; while (times[i + 1] <= now) i++; return [i, times[i + 1] > times[i] ? (now - times[i]) / (times[i + 1] - times[i]) : 0]; };
  console.assert(JSON.stringify(busAt([100, 200, 400], 300)) === '[1,0.5]' && busAt([100, 200], 50) === null && busAt([100, 200], 200) === null, 'busAt');
  function busIcon(c) {  // un petit bus en pixels, aux couleurs de la ligne
    const cv = document.createElement('canvas'); cv.width = 11; cv.height = 7; cv.className = 'tpBus'; const g = cv.getContext('2d');
    g.fillStyle = c || '#8a5cf0'; g.fillRect(0, 0, 11, 5); g.fillStyle = '#d8f0ff'; for (const x of [1, 4, 7]) g.fillRect(x, 1, 2, 2); g.fillRect(9, 1, 1, 3); g.fillStyle = '#05010b'; g.fillRect(2, 5, 2, 2); g.fillRect(7, 5, 2, 2);
    return cv;
  }
  function tpPlan(box, list, d, now, here) {  // le plan de la ligne : chaque arrêt sur un trait à la couleur de la ligne, le bus avance entre deux arrêts
    const times = list.map(p => p.time - (d.shift || 0) + (d.delay || 0) * 60);
    box.className = 'tpStops tpPlan'; box.style.setProperty('--lc', d.route?.color || '#8a5cf0');
    const rows = list.map((p, i) => { const e = el('div', 'tpStop' + (times[i] <= now ? ' past' : p.name === here ? ' here' : '')); e.append(el('span', '', p.name), el('b', '', hhmm(times[i]))); return e; });
    box.replaceChildren(...rows);
    const at = busAt(times, now); if (!at) return;
    const bus = busIcon(d.route?.color), a = rows[at[0]], b = rows[at[0] + 1]; bus.title = d.live ? 'Le bus (position estimée d’après le direct)' : 'Le bus (position estimée d’après l’horaire)';
    bus.style.top = (a.offsetTop + a.offsetHeight / 2 + (b.offsetTop - a.offsetTop) * at[1]) + 'px'; box.append(bus);
  }
  // l'itinéraire : deux arrêts choisis dans une liste qui s'ouvre sous la saisie
  const tpEnds = {from: null, to: null};
  function tpPicker(inp, k) {
    const res = inp.nextElementSibling; let n = 0;
    inp.oninput = async () => { tpEnds[k] = null; const q = inp.value.trim(), me = ++n; if (q.length < 2) return res.replaceChildren();
      try { const r = await neo.tadaoSearch(q); if (me !== n) return; res.replaceChildren(...r.slice(0, 8).map(s => { const b = el('button', 'tpResult'); b.append(el('b', '', s.name), el('span', '', s.town)); b.onclick = () => { tpEnds[k] = s; inp.value = s.name; res.replaceChildren(); }; return b; })); }
      catch (err) { res.replaceChildren(el('div', 'hint', err.message.replace(/^.*Error: /, ''))); } };
    inp.onblur = () => setTimeout(() => res.replaceChildren(), 200);
  }
  tpPicker($('tpFrom'), 'from'); tpPicker($('tpTo'), 'to');
  function tpRouteShow(r) {
    const box = $('tpRoute');
    if (!r.options.length) return box.replaceChildren(el('div', 'hint', 'Aucun bus de ' + r.from.name + ' à ' + r.to.name + ' dans les 3 prochaines heures (même avec une correspondance).'));
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
    $('tpRoute').replaceChildren(el('div', 'hint', 'Recherche des bus…'));
    try { tpRouteShow(await tp('tadao:route', a.key, b.key)); } catch (err) { $('tpRoute').replaceChildren(el('div', 'hint', 'Itinéraire indisponible : ' + err.message.replace(/^.*Error: /, ''))); }
  };
  async function tpShow(s) {
    clearTimeout(tpTimer); tpStop = s; tpChips();
    if (!view.classList.contains('on')) return;
    tpTimer = setTimeout(() => tpShow(s), 30000);
    const fav = tpFavs().some(f => f.key === s.key), star = el('button', 'nbaStar' + (fav ? ' on' : ''), fav ? '★' : '☆');
    star.title = fav ? 'Retirer de mes arrêts' : 'Garder cet arrêt'; star.onclick = async () => { prefs = await neo.setSettings({tadaoStops: fav ? tpFavs().filter(f => f.key !== s.key) : [...tpFavs(), {key: s.key, name: s.name, town: s.town}]}); tpShow(s); };
    const head = el('div', 'tpHead'); head.append(el('span', 'tpName', s.name), el('span', 'hint', s.town), star);
    $('tpBoard').replaceChildren(head, el('div', 'hint', 'Chargement…'));
    try {
      const r = await neo.tadaoNext(s.key);
      const rows = r.departures.map(d => {
        const row = el('div', 'tpRow'), line = el('span', 'tpLine', d.route?.name || '?'), mins = Math.round((d.time + (d.delay || 0) * 60 - r.now) / 60);
        line.style.background = d.route?.color; line.style.color = d.route?.text;
        const when = el('span', 'tpWhen' + (mins <= 1 ? ' now' : ''), mins <= 0 ? 'à quai' : mins < 60 ? mins + ' min' : String(Math.floor(d.time / 3600) % 24).padStart(2, '0') + ':' + String(Math.floor(d.time % 3600 / 60)).padStart(2, '0'));
        const info = el('div', 'tn'); info.append(d.headsign, el('small', '', (d.live ? '● en circulation' + (d.away != null ? ' · à ' + d.away + ' arrêt' + (d.away > 1 ? 's' : '') + (d.where ? ' (' + d.where + ')' : '') : '') + (d.delay > 1 ? ' · retard estimé ' + d.delay + ' min' : d.delay != null && d.delay < -1 ? ' · en avance' : '') : 'horaire prévu ' + String(Math.floor(d.time / 3600) % 24).padStart(2, '0') + ':' + String(Math.floor(d.time % 3600 / 60)).padStart(2, '0'))));
        if (d.live) row.classList.add('live');
        row.append(line, info, when);
        const stops = el('div', 'tpStops');  // a click on a bus: all its stops, with their times
        const fill = async () => tpPlan(stops, await neo.tadaoTrip(d.trip), d, r.now, s.name);
        row.onclick = () => { const on = tpTrip === d.trip; tpTrip = on ? null : d.trip; view.querySelectorAll('.tpStops').forEach(x => x.replaceChildren()); if (!on) fill().catch(e => toast(e.message, true)); };
        if (tpTrip === d.trip) fill().catch(() => {});
        return [row, stops];
      }).flat();
      $('tpBoard').replaceChildren(head, ...(rows.length ? rows : [el('div', 'hint', 'Plus de passage dans les 3 prochaines heures.')]),
        el('div', 'hint', 'Horaires Tadao (transport.data.gouv.fr) · ' + r.buses + ' bus suivis en direct' + (r.liveAt ? ', position du ' + new Date(r.liveAt * 1000).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) : '') + ' · le retard est estimé d\'après la position du bus.'));
    } catch (err) { $('tpBoard').replaceChildren(head, el('div', 'hint', 'Horaires indisponibles : ' + err.message.replace(/^.*Error: /, ''))); }
  }
  // ---- fin ----
  view.__tp = {route: tpRouteShow, plan: tpPlan, busAt};  // pour l'auto-test
  ctx.onOpen(() => { tpOpen(); });
  ctx.onClose(() => { clearTimeout(tpTimer); });
}
