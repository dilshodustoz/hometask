// 🧠 So'zlar: kabinet ichidagi so'z yodlash o'yini (takrorlash tizimi + streak). 2026-11-25
// Ma'lumot: soz/decks.json (umumiy) + soz/my/<kalit>.json (o'quvchining o'z xatolari).
// Natija: qurilmada (localStorage) + Firebase vocab/<kalit> (qoida ustoz tomonidan qo'yilsa). AI ishlatilmaydi.
(function () {
  "use strict";
  const INT = [0, 1, 3, 7, 14, 30, 60];          // quti -> necha kundan keyin qaytadi
  const PER = 12, NEW_MAX = 5, GOAL = 1;          // bitta mashqda savollar soni, yangi so'zlar chegarasi, kunlik maqsad (mashq)
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a, n, not) => shuf(a.filter(x => not.indexOf(x) < 0)).slice(0, n);
  // Toshkent kuni (UTC+5) "2026-11-25"
  const dayOf = t => new Date((t || Date.now()) + 5 * 3600e3).toISOString().slice(0, 10);
  const addDay = (d, n) => new Date(Date.parse(d + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
  const norm = s => String(s || "").toLowerCase().replace(/[’‘`]/g, "'").replace(/[-‐–]/g, " ").replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ").trim();
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    let p = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) { const c = [i]; for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
    return p[b.length];
  }


  const CSS = `
  .sz-hero{padding:16px}
  .sz-top{display:flex;align-items:center;gap:12px}
  .sz-fire{width:54px;height:54px;border-radius:16px;background:var(--soft);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:1.35rem;line-height:1;filter:grayscale(1);opacity:.75}
  .sz-fire b{font-size:.95rem;margin-top:2px;color:var(--ink)}
  .sz-fire.on{filter:none;opacity:1;background:linear-gradient(160deg,#FFEDD5,#FED7AA)}
  html[data-theme="dark"] .sz-fire.on{background:linear-gradient(160deg,#4A2A12,#5C3210)}
  .sz-xp{text-align:center;font-weight:800;font-size:1.05rem;color:var(--warn)}.sz-xp span{display:block;font-size:.7rem;color:var(--muted);font-weight:600}
  .sz-wk{display:flex;gap:6px;margin:14px 0 12px}
  .sz-wk div{flex:1;text-align:center;background:var(--soft);border-radius:10px;padding:6px 0 4px}
  .sz-wk i{display:block;height:20px;font-style:normal;font-size:.95rem}
  .sz-wk span{font-size:.7rem;color:var(--muted);font-weight:700}
  .sz-wk .on{background:rgba(232,89,12,.14)}.sz-wk .t{outline:2px solid var(--primary);outline-offset:-2px}
  .sz-go{width:100%;justify-content:center;padding:14px;font-size:1.02rem;border-radius:14px;box-shadow:0 4px 0 #B8460A}
  .sz-go:active{transform:translateY(3px);box-shadow:0 1px 0 #B8460A}
  .sz-nums{display:flex;gap:8px;margin-top:12px}.sz-nums div{flex:1;text-align:center}
  .sz-nums b{display:block;font-size:1.15rem}.sz-nums span{font-size:.72rem;color:var(--muted)}
  .sz-dk{cursor:pointer}.sz-dk:active{transform:scale(.99)}
  .sz-ic{font-size:1.3rem}
  .sz-ar{font-size:1.6rem;color:var(--muted);padding-left:6px}
  .sz-bar{height:7px;border-radius:9px;background:var(--soft);margin-top:7px;overflow:hidden}.sz-bar i{display:block;height:100%;background:var(--ok);border-radius:9px}
  html.sz-lock,html.sz-lock body{overflow:hidden}
  #szG{position:fixed;inset:0;z-index:80;background:var(--bg);display:flex;flex-direction:column}
  #szG.hide{display:none}
  .sz-hd{display:flex;align-items:center;gap:12px;padding:calc(10px + env(safe-area-inset-top)) 16px 10px;max-width:640px;width:100%;margin:0 auto;box-sizing:border-box}
  .sz-x{border:0;background:none;font-size:1.35rem;color:var(--muted);cursor:pointer;padding:4px 6px}
  .sz-pb{flex:1;height:14px;border-radius:9px;background:var(--line);overflow:hidden}
  .sz-pb i{display:block;height:100%;width:0;background:var(--ok);border-radius:9px;transition:width .35s}
  .sz-cb{min-width:38px;font-weight:800;color:var(--primary);text-align:right}
  .sz-body{flex:1;overflow:auto;padding:8px 16px 16px;max-width:640px;width:100%;margin:0 auto;box-sizing:border-box}
  .sz-card{animation:szIn .25s ease}
  @keyframes szIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
  .sz-new{display:inline-block;background:rgba(139,92,246,.14);color:#7C3AED;font-weight:800;font-size:.75rem;border-radius:8px;padding:3px 9px;margin-bottom:10px}
  html[data-theme="dark"] .sz-new{color:#C4B5FD}
  .sz-q{font-size:1.25rem;font-weight:800;margin:6px 0 16px}
  .sz-w{display:flex;align-items:center;gap:12px;font-size:1.45rem;font-weight:800;margin:0 0 18px;flex-wrap:wrap}
  .sz-w.uz{font-weight:700;font-size:1.2rem;background:var(--card);border:2px solid var(--line);border-radius:16px;padding:14px 16px}
  .sz-w.bad{color:var(--bad)}.sz-w.ok{color:var(--ok)}
  .sz-w.big{justify-content:center;font-size:1.7rem;text-align:center;margin-bottom:10px}
  .sz-spk{border:0;background:#1CB0F6;color:#fff;width:48px;height:48px;border-radius:14px;font-size:1.3rem;cursor:pointer;box-shadow:0 4px 0 #1592CC;flex:none}
  .sz-spk:active{transform:translateY(3px);box-shadow:0 1px 0 #1592CC}
  .sz-spk.sm{width:34px;height:34px;font-size:.95rem;border-radius:10px;box-shadow:0 3px 0 #1592CC;vertical-align:middle}
  .sz-lis{display:flex;gap:14px;align-items:center;justify-content:center;margin:10px 0 22px}
  .sz-big{border:0;background:#1CB0F6;color:#fff;width:96px;height:96px;border-radius:24px;font-size:2.6rem;cursor:pointer;box-shadow:0 5px 0 #1592CC}
  .sz-big:active{transform:translateY(4px);box-shadow:0 1px 0 #1592CC}
  .sz-slow{border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:14px;padding:12px 14px;font-weight:700;cursor:pointer}
  .sz-uz{text-align:center;font-size:1.15rem;font-weight:700;margin:4px 0 16px;color:var(--ink)}.sz-uz.sm{font-size:.95rem;color:var(--muted);font-weight:600}
  .sz-ex{background:var(--card);border:2px solid var(--line);border-radius:16px;padding:14px 16px;font-size:1.08rem;line-height:1.55;margin-bottom:14px}
  .sz-ex.sm{font-size:.98rem}.sz-ex b{color:var(--primary)}
  .sz-gap{display:inline-block;min-width:70px;border-bottom:3px solid var(--primary);color:transparent;line-height:1.1}
  .sz-h{margin:-4px 0 12px}
  .sz-opts{display:flex;flex-direction:column;gap:10px}
  .sz-o{display:flex;align-items:center;gap:12px;text-align:left;border:2px solid var(--line);border-bottom-width:4px;background:var(--card);color:var(--ink);border-radius:14px;padding:13px 14px;font-size:1.02rem;font-weight:600;cursor:pointer}
  .sz-o kbd{flex:none;width:24px;height:24px;border:2px solid var(--line);border-radius:7px;font:700 .75rem system-ui;color:var(--muted);display:flex;align-items:center;justify-content:center}
  .sz-o.sel{border-color:#1CB0F6;background:rgba(28,176,246,.1)}
  .sz-o.ok{border-color:var(--ok);background:var(--okbg)}.sz-o.bad{border-color:var(--bad);background:var(--badbg)}
  .sz-in{width:100%;box-sizing:border-box;font-size:1.15rem;padding:14px 16px;border:2px solid var(--line);border-radius:14px;background:var(--card);color:var(--ink);outline:none}
  .sz-in:focus{border-color:#1CB0F6}
  .sz-ft{padding:14px 16px calc(14px + env(safe-area-inset-bottom));border-top:2px solid var(--line);background:var(--bg)}
  .sz-ft>*{max-width:608px;margin-left:auto;margin-right:auto}
  .sz-ft.ok{background:var(--okbg);border-color:transparent}.sz-ft.bad{background:var(--badbg);border-color:transparent}
  .sz-chk{display:flex;width:100%;justify-content:center;padding:15px;font-size:1.05rem;border-radius:14px;background:var(--ok);box-shadow:0 4px 0 #0F6B32;text-transform:uppercase;letter-spacing:.03em}
  .sz-chk:disabled{background:var(--line);color:var(--muted);box-shadow:none;cursor:default}
  .sz-ft.bad .sz-chk{background:var(--bad);box-shadow:0 4px 0 #A51C1C}
  html[data-theme="dark"] .sz-chk:not(:disabled){color:#06210F}html[data-theme="dark"] .sz-ft.bad .sz-chk{color:#2A0707}
  html[data-theme="dark"] .sz-go{box-shadow:0 4px 0 #9A3A08}
  .sz-fb{margin-bottom:12px}
  .sz-fh{font-size:1.2rem;font-weight:800;color:var(--ok)}.sz-ft.bad .sz-fh{color:var(--bad)}
  .sz-fa{font-weight:700;font-size:1.05rem;margin-top:6px;color:var(--ink)}
  .sz-fn{font-size:.85rem;color:var(--muted);margin-top:4px}
  .sz-end{text-align:center;padding-top:30px}
  .sz-trophy{font-size:4.5rem;animation:szPop .5s ease}
  @keyframes szPop{0%{transform:scale(.3)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
  .sz-end h2{margin:8px 0 18px}
  .sz-res{display:flex;gap:10px;margin-bottom:16px}.sz-res div{flex:1;border:2px solid var(--line);border-radius:14px;padding:12px 4px;background:var(--card)}
  .sz-res b{display:block;font-size:1.15rem}.sz-res span{font-size:.75rem;color:var(--muted)}
  .sz-stk{background:linear-gradient(135deg,#FFEDD5,#FED7AA);color:#9A3412;border-radius:14px;padding:12px;font-weight:800;margin-bottom:10px}
  html[data-theme="dark"] .sz-stk{background:linear-gradient(135deg,#4A2A12,#5C3210);color:#FED7AA}
  `;
  { const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); }
  let CTX = null, DECKS = [], ALL = {}, S = null, G = null, fbDb = null;
  const lsKey = () => "kab_soz_" + CTX.key;

  // ---------- holat (saqlash) ----------
  function blank() { return { v: 1, c: {}, xp: 0, days: {}, at: 0 }; }
  function loadLocal() { try { const s = JSON.parse(localStorage.getItem(lsKey()) || "null"); if (s && s.v === 1) return s; } catch (e) {} return blank(); }
  function merge(a, b) {   // ikki qurilma: har so'z uchun ko'proq ko'rilganini olamiz
    const r = blank();
    r.c = Object.assign({}, a.c);
    Object.keys(b.c || {}).forEach(id => { const x = r.c[id], y = b.c[id]; if (!x || (y[2] || 0) > (x[2] || 0)) r.c[id] = y; });
    r.days = Object.assign({}, a.days);
    Object.keys(b.days || {}).forEach(d => { r.days[d] = Math.max(r.days[d] || 0, b.days[d] || 0); });
    r.xp = Object.keys(r.days).reduce((s, d) => s + (r.days[d] || 0), 0);
    r.at = Math.max(a.at || 0, b.at || 0);
    return r;
  }
  function save() {
    S.at = Date.now();
    try { localStorage.setItem(lsKey(), JSON.stringify(S)); } catch (e) {}
    if (fbDb && !CTX.tv) fbDb.ref("vocab/" + CTX.key).set(S).catch(() => {});
  }
  function loadJs(src) { return new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => no(new Error(src)); document.head.appendChild(s); }); }
  function fbInit() {   // Firebase bo'lmasa ham o'yin ishlaydi (faqat qurilmada saqlanadi)
    const base = "../class/fb/";
    return (window.firebase ? Promise.resolve() : loadJs(base + "firebase-app-compat.js"))
      .then(() => window.FB_CONFIG ? null : loadJs(base + "config.js"))
      .then(() => firebase.database ? null : loadJs(base + "firebase-database-compat.js"))
      .then(() => {
        if (!firebase.apps.length) firebase.initializeApp(window.FB_CONFIG);
        const db = firebase.database();
        return db.ref("vocab/" + CTX.key).once("value").then(sn => {
          const v = sn.val(); fbDb = db;
          if (v && v.v === 1) { S = merge(S, v); try { localStorage.setItem(lsKey(), JSON.stringify(S)); } catch (e) {} }
          if (!CTX.tv) db.ref("vocab/" + CTX.key).set(S).catch(() => {});
          if (!G) home();
        });
      }).catch(() => {});
  }

  // ---------- statistika ----------
  function streak() {
    const t = dayOf(); let d = S.days[t] ? t : addDay(t, -1), n = 0;
    while (S.days[d]) { n++; d = addDay(d, -1); }
    return n;
  }
  function dueList() { const t = dayOf(); return Object.keys(S.c).filter(id => ALL[id] && S.c[id][1] <= t).sort((a, b) => S.c[a][1] < S.c[b][1] ? -1 : 1); }
  function deckStat(dk) { let l = 0, m = 0; dk.c.forEach(c => { const x = S.c[c.id]; if (x) { l++; if (x[0] >= 4) m++; } }); return { l, m, n: dk.c.length }; }

  // ---------- bosh ekran (tab) ----------
  function home() {
    const el = CTX.el; if (!el) return;
    const st = streak(), due = dueList().length, td = (S.days[dayOf()] || 0) > 0;
    const learned = Object.keys(S.c).filter(id => ALL[id]).length, strong = Object.keys(S.c).filter(id => ALL[id] && S.c[id][0] >= 4).length;
    const wk = []; for (let i = 6; i >= 0; i--) { const d = addDay(dayOf(), -i); wk.push({ d, on: !!S.days[d], t: i === 0 }); }
    const WD = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
    el.innerHTML = `
      <div class="sz-hero card">
        <div class="sz-top"><div class="sz-fire${td ? " on" : ""}">🔥<b>${st}</b></div>
          <div style="flex:1;min-width:0"><div class="tt">${st ? st + " kun ketma-ket" : "Bugun boshlang!"}</div>
          <div class="mt">${td ? "✅ Bugungi maqsad bajarildi. Yana mashq qilsangiz, ball qo'shiladi." : "Bugun bitta mashq qiling, olov o'chmasin."}</div></div>
          <div class="sz-xp">⭐ ${S.xp || 0}<span>ball</span></div></div>
        <div class="sz-wk">${wk.map(w => `<div class="${w.on ? "on" : ""}${w.t ? " t" : ""}"><i>${w.on ? "🔥" : ""}</i><span>${WD[new Date(w.d + "T00:00:00Z").getUTCDay()]}</span></div>`).join("")}</div>
        <button class="btn sz-go" id="szGo">▶ ${due ? "Takrorlash · " + Math.min(due, PER) + " ta so'z" : "Yangi so'zlarni o'rganish"}</button>
        <div class="sz-nums"><div><b>${due}</b><span>bugun takrorlash</span></div><div><b>${learned}</b><span>o'rganilgan</span></div><div><b>${strong}</b><span>mustahkam</span></div></div>
      </div>
      <h3>To'plamlar</h3>
      ${DECKS.map(dk => { const s = deckStat(dk), p = Math.round(100 * s.l / Math.max(1, s.n)); return `
        <div class="card sz-dk" data-dk="${esc(dk.id)}"><div class="row"><div class="ic sz-ic">${dk.ic}</div><div style="flex:1;min-width:0">
          <div class="tt">${esc(dk.t)}</div><div class="mt">${esc(dk.d)} · ${s.l}/${s.n} so'z${s.m ? " · 💪 " + s.m : ""}</div>
          <div class="sz-bar"><i style="width:${p}%"></i></div></div><div class="sz-ar">›</div></div></div>`; }).join("")}
      <div class="mt" style="text-align:center;margin:14px 0 4px">Qanday ishlaydi: xato topgan so'zingiz ertaga yana chiqadi, to'g'ri topganingiz 3, 7, 14, 30 kundan keyin qaytadi. Har kuni bitta mashq: 🔥 olov yonib turadi.</div>`;
    $("szGo").onclick = () => start(null);
    el.querySelectorAll(".sz-dk").forEach(c => c.onclick = () => start(c.dataset.dk));
  }

  // ---------- mashq tuzish ----------
  function kindOf(c) { return c.syn ? "rd" : c.bad ? (c.k === "sp" ? "ms" : "mv") : "sp"; }
  function build(dkId) {
    const t = dayOf(), due = dueList().filter(id => !dkId || ALL[id].dk === dkId);
    const q = due.slice(0, PER).map(id => ({ c: ALL[id], fresh: false }));
    const pool = dkId ? DECKS.filter(d => d.id === dkId) : DECKS;
    const nw = [];
    if (q.length < PER) {
      // umumiy mashqda: avval o'z xatolarim, keyin eng ko'p boshlangan to'plam
      // umumiy mashq: 2 ta o'z xatosidan, qolgani boshlangan (yoki birinchi tugallanmagan) to'plamdan
      const lim = Math.min(NEW_MAX, PER - q.length), fresh = dk => dk.c.filter(c => !S.c[c.id]);
      if (dkId) nw.push(...fresh(pool[0]).slice(0, lim));
      else {
        const my = pool.find(d => d.my); if (my) nw.push(...fresh(my).slice(0, 2));
        const rest = pool.filter(d => !d.my && fresh(d).length).sort((a, b) => (deckStat(b).l > 0) - (deckStat(a).l > 0));
        for (const dk of rest) { nw.push(...fresh(dk).slice(0, lim - nw.length)); if (nw.length >= lim) break; }
      }
    }
    // yangi so'z: avval tanishtirish, keyin 1 ta savol; takror so'zlar orasiga aralashtiriladi
    const items = [];
    nw.forEach(c => { items.push({ c, intro: true }); items.push({ c, fresh: true }); });
    const rev = shuf(q);
    const out = []; let i = 0;
    items.forEach((x, k) => { out.push(x); if (k % 2 === 1 && rev[i]) out.push(rev[i++]); });
    while (i < rev.length) out.push(rev[i++]);
    return out;
  }
  function exType(c, fresh) {
    const b = fresh ? 0 : (S.c[c.id] ? S.c[c.id][0] : 0), k = kindOf(c), tts = !!window.speechSynthesis;
    const r = a => a[Math.floor(Math.random() * a.length)];
    if (k === "sp") {
      if (b <= 1) return fresh ? "mcqUz" : r(["mcqUz", "mcqEn"]);
      if (b === 2) return c.ex ? r(["gapMcq", "mcqEn"]) : "mcqEn";
      return c.ex ? r(tts ? ["gapType", "gapType", "listen"] : ["gapType"]) : (tts ? r(["listen", "typeUz"]) : "typeUz");
    }
    if (k === "rd") { if (b <= 1) return "mcqSyn"; if (b === 2) return "mcqWord"; return tts ? r(["typeSyn", "listen"]) : "typeSyn"; }
    if (k === "ms") return b <= 1 ? "fixType" : (tts ? r(["listen", "fixType"]) : "fixType");
    return b <= 1 ? "choose2" : "fixType";
  }

  // ---------- ovoz ----------
  let VOICE = null;
  function voice() {
    if (VOICE || !window.speechSynthesis) return VOICE;
    const v = speechSynthesis.getVoices(); VOICE = v.find(x => /en-GB/i.test(x.lang) && /Daniel|Serena|Kate|Google UK/i.test(x.name)) || v.find(x => /en-GB/i.test(x.lang)) || v.find(x => /^en/i.test(x.lang)) || null;
    return VOICE;
  }
  if (window.speechSynthesis) try { speechSynthesis.onvoiceschanged = () => { VOICE = null; voice(); }; } catch (e) {}
  function say(t, slow) {
    if (!window.speechSynthesis) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); const v = voice(); if (v) u.voice = v; u.lang = v ? v.lang : "en-GB"; u.rate = slow ? .7 : .92; speechSynthesis.speak(u); } catch (e) {}
  }
  let AC = null;
  function beep(ok) {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const notes = ok ? [[660, 0], [880, .09]] : [[220, 0], [180, .12]];
      notes.forEach(([f, t]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = ok ? "sine" : "triangle"; o.frequency.value = f; o.connect(g); g.connect(AC.destination); const s = AC.currentTime + t; g.gain.setValueAtTime(.0001, s); g.gain.exponentialRampToValueAtTime(.18, s + .02); g.gain.exponentialRampToValueAtTime(.0001, s + .22); o.start(s); o.stop(s + .25); });
    } catch (e) {}
    try { if (!ok && navigator.vibrate) navigator.vibrate(60); } catch (e) {}
  }

  // ---------- o'yin oynasi ----------
  function start(dkId) {
    const q = build(dkId);
    if (!q.length) { CTX.toast("🎉 Bu to'plamdagi hamma so'z takrorlangan. Ertaga qayting!"); return; }
    G = { q, i: 0, ok: 0, bad: 0, xp: 0, combo: 0, best: 0, first: {}, total: q.filter(x => !x.intro).length, done: 0 };
    let ov = $("szG");
    if (!ov) { ov = document.createElement("div"); ov.id = "szG"; document.body.appendChild(ov); }
    ov.innerHTML = `<div class="sz-hd"><button class="sz-x" id="szX" aria-label="Yopish">✕</button><div class="sz-pb"><i id="szP"></i></div><div class="sz-cb" id="szC"></div></div>
      <div class="sz-body" id="szB"></div><div class="sz-ft" id="szF"></div>`;
    ov.classList.remove("hide"); document.documentElement.classList.add("sz-lock");
    $("szX").onclick = () => { if (G && G.done && !confirm("Mashqni to'xtatasizmi? Hozirgacha topganlaringiz saqlanadi.")) return; leave(); };
    try { history.pushState({ sz: 1 }, ""); } catch (e) {}
    step();
  }
  function leave() { if (history.state && history.state.sz) history.back(); else close(); }   // Orqaga tugmasi bilan bir xil
  function close() {
    const ov = $("szG"); if (ov) ov.classList.add("hide");
    document.documentElement.classList.remove("sz-lock");
    if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {}
    G = null; home();
  }
  window.addEventListener("popstate", () => { if (G) close(); });
  function prog() { $("szP").style.width = Math.round(100 * G.done / Math.max(1, G.total)) + "%"; $("szC").innerHTML = G.combo >= 3 ? `🔥 ${G.combo}` : ""; }
  const gap = ex => esc(ex).replace(/\*\*(.+?)\*\*/, '<span class="sz-gap">_____</span>');
  const bold = ex => esc(ex).replace(/\*\*(.+?)\*\*/, "<b>$1</b>");
  const formOf = c => (c.ex && (c.ex.match(/\*\*(.+?)\*\*/) || [])[1]) || c.w;
  // "Imlo: safety." kabi izoh javobni aytib qo'yadi: faqat haqiqiy tushuntirish bo'lsa ko'rsatamiz
  function noteOk(c) { const u = norm(c.uz).replace(/^imlo\s*/, ""); return !!c.uz && u !== norm(c.w) && u.replace(/ /g, "").length > norm(c.w).replace(/ /g, "").length + 4; }
  function sameKind(c) { return Object.values(ALL).filter(x => kindOf(x) === kindOf(c) && x.id !== c.id); }

  function step() {
    prog();
    if (G.i >= G.q.length) return finish();
    const it = G.q[G.i], c = it.c, B = $("szB"), F = $("szF");
    F.className = "sz-ft"; F.innerHTML = "";
    if (it.intro) return intro(c);
    const t = exType(c, it.fresh); it.t = t;
    const spk = `<button class="sz-spk" id="szS" title="Eshitish">🔊</button>`;
    let h = "", opts = null, ans = null, type = false, hint = "";
    if (t === "mcqUz") { h = `<div class="sz-q">Bu ibora nimani anglatadi?</div><div class="sz-w">${spk}<span>${esc(c.w)}</span></div>`; ans = c.uz; opts = shuf([c.uz].concat(pick(sameKind(c).map(x => x.uz), 3, [c.uz]))); }
    else if (t === "mcqEn") { h = `<div class="sz-q">Inglizchasini tanlang</div><div class="sz-w uz"><span>${esc(c.uz)}</span></div>`; ans = c.w; opts = shuf([c.w].concat(pick(sameKind(c).map(x => x.w), 3, [c.w]))); }
    else if (t === "gapMcq") { h = `<div class="sz-q">Bo'sh joyga mosini tanlang</div><div class="sz-ex">${gap(c.ex)}</div>`; ans = formOf(c); opts = shuf([ans].concat(pick(sameKind(c).map(formOf), 3, [ans]))); }
    else if (t === "gapType") { ans = formOf(c); h = `<div class="sz-q">Bo'sh joyni yozing</div><div class="sz-ex">${gap(c.ex)}</div><div class="mt sz-h">💡 ${esc(c.uz)} · <b>${esc(ans[0])}…</b> (${ans.split(" ").length} so'z)</div>`; type = true; }
    else if (t === "typeUz") { ans = c.w; h = `<div class="sz-q">Inglizcha yozing</div><div class="sz-w uz"><span>${esc(c.uz)}</span></div><div class="mt sz-h">💡 <b>${esc(ans[0])}…</b></div>`; type = true; }
    else if (t === "listen") { ans = c.w; h = `<div class="sz-q">Eshiting va yozing</div><div class="sz-lis"><button class="sz-big" id="szS">🔊</button><button class="sz-slow" id="szSl">🐢 sekin</button></div>`; type = true; }
    else if (t === "mcqSyn") { h = `<div class="sz-q">Sinonimini tanlang</div><div class="sz-w">${spk}<span>${esc(c.w)}</span></div>`; ans = c.syn; opts = shuf([c.syn].concat(c.dis.slice(0, 3))); }
    else if (t === "mcqWord") { h = `<div class="sz-q">Qaysi so'z shu ma'noda? (Reading paraphrase)</div><div class="sz-w uz"><span>≈ ${esc(c.syn)}</span></div>`; ans = c.w; opts = shuf([c.w].concat(pick(sameKind(c).filter(x => x.syn !== c.syn).map(x => x.w), 3, [c.w]))); }
    else if (t === "typeSyn") { ans = c.w; h = `<div class="sz-q">Shu ma'nodagi so'zni yozing</div><div class="sz-w uz"><span>≈ ${esc(c.syn)}</span></div><div class="mt sz-h">💡 <b>${esc(ans[0])}…</b> (${ans.length} harf)</div>`; type = true; }
    else if (t === "fixType") { ans = c.w; h = `<div class="sz-q">${c.k === "sp" ? "Imlo xatosi. To'g'ri yozing" : "Tabiiyroq variantni yozing"}</div><div class="sz-w bad"><s>${esc(c.bad)}</s></div><div class="mt sz-h">💡 <b>${esc(ans[0])}…</b> (${c.k === "sp" ? ans.length + " harf" : ans.split(" ").length + " so'z"})</div>`; type = true; }
    else if (t === "choose2") { h = `<div class="sz-q">Qaysi biri to'g'ri va tabiiy?</div>`; ans = c.w; opts = shuf([c.w, c.bad]); }
    B.innerHTML = `<div class="sz-card">${it.fresh ? '<div class="sz-new">✨ Yangi so\'z</div>' : ""}${h}
      ${opts ? `<div class="sz-opts">${opts.map((o, k) => `<button class="sz-o" data-v="${esc(o)}"><kbd>${k + 1}</kbd><span>${esc(o)}</span></button>`).join("")}</div>` : ""}
      ${type ? `<input class="sz-in" id="szI" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="Shu yerga yozing…">` : ""}</div>`;
    F.innerHTML = `<button class="btn sz-chk" id="szK" disabled>Tekshirish</button>`;
    const sp = $("szS"); if (sp) sp.onclick = () => say(c.w);
    if ($("szSl")) $("szSl").onclick = () => say(c.w, true);
    if (t === "listen" || t === "mcqUz" || t === "mcqSyn") setTimeout(() => say(c.w), 250);
    let val = null;
    if (opts) B.querySelectorAll(".sz-o").forEach(b => b.onclick = () => { B.querySelectorAll(".sz-o").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); val = b.dataset.v; $("szK").disabled = false; });
    if (type) { const I = $("szI"); I.oninput = () => { $("szK").disabled = !I.value.trim(); }; I.onkeydown = e => { if (e.key === "Enter" && I.value.trim()) { e.preventDefault(); $("szK").click(); } }; setTimeout(() => I.focus(), 60); }
    G.key = e => {
      if (opts && /^[1-4]$/.test(e.key) && !$("szK").dataset.done) { const b = B.querySelectorAll(".sz-o")[+e.key - 1]; if (b) b.click(); }
      else if (e.key === "Enter" && !type) { const k = $("szK"); if (k && !k.disabled) k.click(); }
    };
    $("szK").onclick = () => {
      let ok, near = false;
      if (type) {
        const v = norm($("szI").value), a = norm(ans);
        ok = v === a;
        if (!ok && t !== "fixType" && t !== "listen" && a.length >= 6 && lev(v, a) === 1) { ok = true; near = true; }
        if (!ok && t === "listen" && a.length >= 6 && lev(v, a) === 1) { ok = true; near = true; }
        $("szI").disabled = true;
      } else {
        ok = val === ans;
        B.querySelectorAll(".sz-o").forEach(b => { b.disabled = true; if (b.dataset.v === ans) b.classList.add("ok"); else if (b.classList.contains("sel")) b.classList.add("bad"); });
      }
      judge(it, ok, near, ans);
    };
  }
  function intro(c) {
    const B = $("szB"), F = $("szF"), k = kindOf(c);
    let h;
    if (k === "sp") h = `<div class="sz-w big"><button class="sz-spk" id="szS">🔊</button><span>${esc(c.w)}</span></div><div class="sz-uz">${esc(c.uz)}</div>${c.ex ? `<div class="sz-ex sm">${bold(c.ex)}</div>` : ""}`;
    else if (k === "rd") h = `<div class="sz-w big"><button class="sz-spk" id="szS">🔊</button><span>${esc(c.w)}</span></div><div class="sz-uz">≈ ${esc(c.syn)}</div><div class="mt" style="text-align:center">Reading'da matnda <b>${esc(c.syn)}</b> bo'lsa, savolda <b>${esc(c.w)}</b> bo'lib kelishi mumkin.</div>`;
    else h = `<div class="sz-q" style="text-align:center">Sizning xatoingiz</div><div class="sz-w bad big"><s>${esc(c.bad)}</s></div><div class="sz-w big ok"><button class="sz-spk" id="szS">🔊</button><span>${esc(c.w)}</span></div>${noteOk(c) ? `<div class="sz-uz sm">${esc(c.uz)}</div>` : ""}`;
    B.innerHTML = `<div class="sz-card sz-intro"><div class="sz-new">✨ Yangi so'z</div>${h}</div>`;
    F.innerHTML = `<button class="btn sz-chk" id="szK">Tushundim →</button>`;
    $("szS").onclick = () => say(c.w);
    setTimeout(() => say(c.w), 250);
    G.key = e => { if (e.key === "Enter") $("szK").click(); };
    $("szK").onclick = () => { G.i++; step(); };
  }
  function judge(it, ok, near, ans) {
    const c = it.c, F = $("szF"), t = dayOf();
    const first = !G.first[c.id]; G.first[c.id] = 1;
    if (first) {   // takrorlash tizimi: faqat birinchi urinish hisoblanadi
      const x = S.c[c.id] || [0, t, 0, 0];
      if (ok) { x[0] = Math.min(x[0] + 1, INT.length - 1); x[1] = addDay(t, INT[x[0]]); }
      else { x[0] = 1; x[1] = addDay(t, 1); x[3] = (x[3] || 0) + 1; }
      x[2] = (x[2] || 0) + 1; S.c[c.id] = x;
    }
    if (ok) { G.ok += first ? 1 : 0; G.combo++; G.best = Math.max(G.best, G.combo); const p = first ? 10 + (G.combo >= 5 ? 5 : 0) : 5; G.xp += p; }
    else { G.bad += first ? 1 : 0; G.combo = 0; if (!it.again) { G.q.push({ c, again: true }); G.total++; } }   // xato: shu mashq oxirida yana (bir marta)
    G.done++;
    save(); beep(ok); prog();
    const praise = ["Zo'r!", "Barakalla!", "To'g'ri!", "Ajoyib!", "Davom eting!"][Math.floor(Math.random() * 5)];
    F.className = "sz-ft " + (ok ? "ok" : "bad");
    F.innerHTML = `<div class="sz-fb"><div class="sz-fh">${ok ? (near ? "👍 Deyarli to'g'ri" : "✅ " + praise) : "❌ To'g'ri javob:"}</div>
      ${!ok || near ? `<div class="sz-fa"><button class="sz-spk sm" id="szS2">🔊</button> ${esc(ans)}</div>` : ""}
      ${!ok ? `<div class="sz-fn">${c.bad ? (noteOk(c) ? esc(c.uz) + " · " : "") : esc(c.uz && ans !== c.uz ? c.uz : c.syn ? "≈ " + c.syn : c.w) + " · "}${it.again ? "ertaga yana takrorlanadi" : "bu so'z mashq oxirida yana chiqadi"}</div>` : ""}</div>
      <button class="btn sz-chk" id="szN">Davom etish</button>`;
    if ($("szS2")) $("szS2").onclick = () => say(c.w);
    if (!ok || it.t === "gapMcq" || it.t === "gapType") setTimeout(() => say(c.w), 200);
    G.key = e => { if (e.key === "Enter") $("szN").click(); };
    $("szN").onclick = () => { G.i++; step(); };
    setTimeout(() => { const n = $("szN"); if (n) n.focus(); }, 50);
  }
  function finish() {
    const t = dayOf(), had = (S.days[t] || 0) > 0, xp = G.xp + 20;   // mashq tugatgani uchun +20
    S.days[t] = (S.days[t] || 0) + xp; S.xp = (S.xp || 0) + xp;
    save();
    const st = streak(), acc = Math.round(100 * G.ok / Math.max(1, G.ok + G.bad));
    $("szP").style.width = "100%"; $("szC").innerHTML = "";
    $("szB").innerHTML = `<div class="sz-card sz-end"><div class="sz-trophy">${acc >= 80 ? "🏆" : acc >= 50 ? "🎉" : "💪"}</div>
      <h2>${acc >= 80 ? "Ajoyib mashq!" : acc >= 50 ? "Yaxshi mashq!" : "Mashq tugadi!"}</h2>
      <div class="sz-res"><div><b>⭐ +${xp}</b><span>ball</span></div><div><b>🎯 ${acc}%</b><span>aniqlik</span></div><div><b>🔥 ${st}</b><span>kun ketma-ket</span></div></div>
      ${!had ? `<div class="sz-stk">🔥 ${st > 1 ? st + " kunlik seriya davom etmoqda!" : "Seriya boshlandi! Ertaga ham kiring."}</div>` : ""}
      ${G.best >= 5 ? `<div class="mt">Eng uzun to'g'ri javoblar qatori: ${G.best}</div>` : ""}</div>`;
    $("szF").className = "sz-ft";
    $("szF").innerHTML = `<button class="btn sz-chk" id="szE">Tugatish</button>`;
    G.key = e => { if (e.key === "Enter") $("szE").click(); };
    $("szE").onclick = leave;
    beep(true); setTimeout(() => beep(true), 200);
    G.done = 0;
  }
  document.addEventListener("keydown", e => { if (G && e.key === "Escape" && $("szX")) { $("szX").click(); return; } if (G && G.key && $("szG") && !$("szG").classList.contains("hide")) G.key(e); });

  // ---------- kirish nuqtasi ----------
  window.SOZ = {
    mount(ctx) {
      const first = !CTX || CTX.key !== ctx.key;
      CTX = ctx;
      if (first) {
        S = loadLocal();
        ctx.el.innerHTML = `<div class="empty">⏳ So'zlar yuklanmoqda…</div>`;
        const v = "?v=" + dayOf();
        return Promise.all([
          fetch("soz/decks.json" + v).then(r => r.json()),
          fetch("soz/my/" + encodeURIComponent(ctx.key) + ".json" + v).then(r => r.ok ? r.json() : null).catch(() => null)
        ]).then(([d, my]) => {
          DECKS = []; ALL = {};
          if (my && my.c && my.c.length) DECKS.push({ id: "my", t: "Mening xatolarim", d: "Writing'dagi o'z xatolaringiz", ic: "✍️", my: 1, c: my.c });
          DECKS = DECKS.concat(d.decks);
          DECKS.forEach(dk => dk.c.forEach(c => { c.dk = dk.id; ALL[c.id] = c; }));
          home(); fbInit();
        }).catch(() => { ctx.el.innerHTML = `<div class="empty">⚠️ So'zlar yuklanmadi. Internetni tekshirib, qayta oching.</div>`; });
      }
      home();
      return Promise.resolve();
    }
  };
})();
