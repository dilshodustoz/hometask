// Ustoz sahifasi: 🗣️ Speaking bo'limi (24.11) — sinfda juftlikda Part 1/2/3 aylanma mashqi.
// Ustoz sahifasi "miya": juftlaydi, savollar tartibini va kartalarni tanlaydi, raundlarni almashtiradi, natijani hisoblaydi.
// Faqat Firebase (sessions/<sid>, live/<sid>); LC Panel'ga so'rov yo'q.
(function () {
  const $ = id => document.getElementById(id), esc = SP.esc, db = CLS.db;
  const TP = () => window.CLS_TP || {};
  let group = null, sid = null, sess = null, live = {}, les = null, roster = null, offS = null, offL = null;
  let k2p = {}, p2k = {}, tickT = null, lastDraw = "", busy = false, auto = true, autoR = false, hs = null, view = null;
  const cfgLS = "cls_sp_cfg";

  // ---------- yordamchilar ----------
  const nm = p => sess && sess.ppl && sess.ppl[p] ? sess.ppl[p].n : "?";
  const devOf = p => sess && sess.ppl && sess.ppl[p] ? sess.ppl[p].dev : "phone";
  const icon = p => ({ pc: "💻", phone: "📱", none: "🙋" })[devOf(p)] || "📱";
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const randKey = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => "abcdefghijkmnopqrstuvwxyz23456789"[b % 33]).join("");
  function cfgGet() { try { return Object.assign({}, SP.DEF, JSON.parse(localStorage.getItem(cfgLS) || "{}")); } catch (e) { return SP.DEF; } }

  // ---------- sahifa skeleti ----------
  function shell() {
    const box = $("spBox"); if (!box || box.dataset.ok) return; box.dataset.ok = 1;
    const c = cfgGet();
    box.innerHTML = `
    <div class="card" id="spOpen">
      <div class="card-header"><h3 class="card-title">Speaking darsini ochish</h3><span class="badge b-mut">Juftlikda aylanma mashq</span></div>
      <div class="row">
        <label><span class="field-label">Dars (prep materiali)</span><select class="field" id="spLes"></select></label>
        <button class="btn btn-primary" id="spOpenBtn" style="min-height:38px">Darsni ochish</button>
      </div>
      <div class="row" style="margin-top:12px">
        <label><span class="field-label">Part 1 raundlar</span><input class="field" id="spP1r" type="number" min="0" max="12" value="${c.p1.r}" style="width:90px"></label>
        <label><span class="field-label">Part 1 soniya (har kishiga)</span><input class="field" id="spP1s" type="number" min="30" max="300" step="10" value="${c.p1.s}" style="width:110px"></label>
        <label><span class="field-label">Part 2 raundlar</span><input class="field" id="spP2c" type="number" min="0" max="8" value="${c.p2.r != null ? c.p2.r : 3}" style="width:90px"></label>
        <label><span class="field-label">Part 3 raundlar</span><input class="field" id="spP3r" type="number" min="0" max="12" value="${c.p3.r}" style="width:90px"></label>
        <label><span class="field-label">Part 3 soniya (har kishiga)</span><input class="field" id="spP3s" type="number" min="30" max="300" step="10" value="${c.p3.s}" style="width:110px"></label>
      </div>
      <div class="muted" id="spPlanHint" style="margin-top:8px"></div>
      <div class="msg" id="spMsg"></div>
      <hr class="divider"><div id="spPast"></div>
    </div>
    <div id="spLive" class="hide"></div>
    <div id="spView" class="hide"></div>`;
    SP.lessons().then(L => { $("spLes").innerHTML = L.map(x => `<option value="${x.id}">${esc(x.title)}</option>`).join(""); try { const v = localStorage.getItem("cls_sp_les"); if (v) $("spLes").value = v; } catch (e) {} }).catch(() => { $("spMsg").textContent = "⚠️ Darslar ro'yxati yuklanmadi."; });
    ["spP1r", "spP1s", "spP2c", "spP3r", "spP3s"].forEach(id => $(id).oninput = planHint);
    planHint();
    $("spOpenBtn").onclick = openLesson;
  }
  function readCfg() {
    const n = (id, a, b, d) => { const v = parseInt($(id).value, 10); return Math.max(a, Math.min(b, isNaN(v) ? d : v)); };
    const c = { p1: { r: n("spP1r", 0, 12, 6), s: n("spP1s", 30, 300, 120) }, p2: Object.assign({}, SP.DEF.p2, { r: n("spP2c", 0, 8, 3) }), p3: { r: n("spP3r", 0, 12, 5), s: n("spP3s", 30, 300, 150) } };
    if (!$("spP1r").value) c.p1.r = 0; if (!$("spP2c").value) c.p2.r = 0; if (!$("spP3r").value) c.p3.r = 0;
    return c;
  }
  function planHint() {
    const c = readCfg(), p = SP.plan(c), rounds = new Set(p.map(s => s.r)).size;
    $("spPlanHint").textContent = `Reja: Part 1 — ${c.p1.r} raund, Part 2 — ${c.p2.r} raund (1 daqiqa tayyorlanish + 2 daqiqa gapirish, har raundda yangi karta), Part 3 — ${c.p3.r} raund. Jami ${rounds} raund, gapirish vaqti ≈ ${SP.minutes(p) + Math.round(rounds * 20 / 60)} daqiqa (+ tanaffus va hot seat).`;
  }

  // ---------- dars ochish ----------
  function openLesson() {
    const busyOther = TP().busy && TP().busy();
    if (busyOther) { $("spMsg").textContent = "⚠️ Bu guruhda boshqa dars ochiq: " + busyOther + ". Avval uni yoping."; return; }
    const c = readCfg(), plan = SP.plan(c), lid = $("spLes").value;
    if (!plan.length) { $("spMsg").textContent = "⚠️ Kamida bitta raund kerak."; return; }
    try { localStorage.setItem(cfgLS, JSON.stringify(c)); localStorage.setItem("cls_sp_les", lid); } catch (e) {}
    $("spMsg").textContent = "Ochilmoqda…";
    SP.lesson(lid).then(L => db.ref("current/" + group).get().then(cs => {
      if (cs.val() && cs.val().sid) throw new Error("Bu guruhda boshqa dars ochiq. Sahifani yangilang.");
      const d = new Date(CLS.now()), id = `s_${lid}_${group}_${d.toISOString().slice(0, 10).replace(/-/g, "")}_${randKey(5)}`;
      const s = { skill: "speaking", test: lid, title: L.title, group: group, chat: CLS.GROUPS[group].chat, state: "run", created: CLS.TS, cfg: c, plan: plan, cur: { i: -1 } };
      return db.ref("sessions/" + id).set(s).then(() => db.ref("current/" + group).set({ sid: id, skill: "speaking", test: lid })).then(() => id);
    })).then(id => { $("spMsg").textContent = ""; attach(id); if (TP().rewatch) TP().rewatch(); })
      .catch(e => { $("spMsg").textContent = "⚠️ " + e.message; });
  }

  // ---------- kuzatish ----------
  function detach() {
    if (offS) offS(); if (offL) offL(); offS = offL = null;
    sid = null; sess = null; live = {}; k2p = {}; p2k = {}; hs = null;
    if ($("spLive")) { $("spLive").classList.add("hide"); $("spOpen").classList.remove("hide"); }
    loadPast();
  }
  function watch() {
    if (!group) return;
    db.ref("current/" + group).get().then(c => {
      const cur = c.val();
      if (cur && cur.sid && cur.skill === "speaking") { if (cur.sid !== sid) attach(cur.sid); }
      else if (sid) detach(); else loadPast();
    }).catch(() => {});
  }
  function attach(id) {
    if (offS) offS(); if (offL) offL();
    sid = id; view = null; lastDraw = "";
    const sr = db.ref("sessions/" + id), lr = db.ref("live/" + id);
    const f1 = sr.on("value", async s => {
      sess = s.val();
      if (!sess || sess.state === "closed") { detach(); return; }
      if (!les || les.id !== sess.test) les = await SP.lesson(sess.test);
      if (!roster) { roster = (await db.ref("roster").get()).val() || {}; syncPeople(); }
      $("spOpen").classList.add("hide"); $("spView").classList.add("hide"); $("spLive").classList.remove("hide");
      lastDraw = ""; draw();
    });
    const f2 = lr.on("value", s => { live = s.val() || {}; syncPeople(); lastDraw = ""; draw(); });
    offS = () => sr.off("value", f1); offL = () => lr.off("value", f2);
  }

  // kirgan o'quvchilarni sessiyaga (pid bilan) qo'shish, qurilma turi, "sherigim ketdi" xabarlari
  let syncing = false;
  async function syncPeople() {
    if (!sess || !roster || syncing) return; syncing = true;
    try {
      const up = {};
      for (const k in live) {
        const v = live[k] || {};
        if (!k2p[k]) { k2p[k] = await SP.pid(k, sid); p2k[k2p[k]] = k; }
        const p = k2p[k], cur = (sess.ppl || {})[p];
        if (v.online && (!cur || (v.dev && cur.dev !== v.dev && cur.dev !== "none")))
          up["ppl/" + p] = { n: (roster[k] || {}).name || v.name || "?", dev: v.dev || "phone" };
        if (v.online && cur && cur.dev === "none" && v.dev) up["ppl/" + p + "/dev"] = v.dev;   // qurilmasiz deb belgilangan, keyin kirdi
        if (v.flag && v.flag.at && !((sess.flagDone || {})[k] >= v.flag.at)) { up["flagDone/" + k] = v.flag.at; goneLater.push(v.flag.p); }
      }
      if (Object.keys(up).length) await db.ref("sessions/" + sid).update(up);
      while (goneLater.length) await markGone(goneLater.shift(), true);
    } catch (e) { console.warn(e); } finally { syncing = false; }
  }
  const goneLater = [];

  // ---------- juftlash ----------
  function present() {
    const ppl = sess.ppl || {}, gone = sess.gone || {};
    return Object.keys(ppl).filter(p => !gone[p] && (ppl[p].dev === "none" || (live[p2k[p]] || {}).online));
  }
  function pairUp(people) {
    const met = sess.met || {}, trio = sess.trio || {};
    const ord = x => ({ none: 0, pc: 1, phone: 2 })[devOf(x)] ?? 2;
    let rest = shuffle(people).sort((a, b) => ord(a) - ord(b));
    const cost = (a, b) => ((met[a] || {})[b] || 0) * 10 + (devOf(a) === "pc" && devOf(b) === "pc" ? 30 : 0) + (devOf(a) === "none" && devOf(b) === "none" ? 1000 : 0) + Math.random();
    const g = [];
    while (rest.length > 1) {
      const a = rest.shift(); let bi = 0, bc = 1e9;
      rest.forEach((b, i) => { const c = cost(a, b); if (c < bc) { bc = c; bi = i; } });
      g.push([a, rest.splice(bi, 1)[0]]);
    }
    if (rest.length) {
      const x = rest[0];
      if (!g.length) g.push([x]);
      else { let bi = 0, bc = 1e9; g.forEach((gr, i) => { const c = gr.reduce((s, m) => s + cost(x, m), 0) + (trio[x] || 0) * 8 + Math.random(); if (c < bc) { bc = c; bi = i; } }); g[bi].push(x); }
    }
    return g;
  }
  // nomzodga hali berilmagan savollar oldinda (har juftlikda tartib boshqacha)
  function askedBy(p) {
    const s = new Set();
    for (const k in live) for (const i in (live[k].sp || {})) { const r = live[k].sp[i]; if (r && r.c === p) Object.keys(r.a || {}).forEach(q => s.add(q)); }
    return s;
  }
  function qList(b, cand) {
    const all = les[b].map(x => x.id), asked = askedBy(cand);
    return shuffle(all.filter(q => !asked.has(q))).concat(shuffle(all.filter(q => asked.has(q)))).slice(0, 16);
  }
  function fillRound(step, round, prev) {
    round.q = {}; round.card = round.card || {};
    round.g.forEach((g, gi) => {
      if (step.b !== "p2") round.q[gi] = { 0: qList(step.b, SP.roles(g, 0).c), 1: g.length > 1 ? qList(step.b, SP.roles(g, 1).c) : [] };
      else g.forEach(p => { if (!round.card[p]) round.card[p] = pickCard(p, step, prev); });
    });
    return round;
  }
  function pickCard(p, step, prev) {
    if (step.att > 1 && prev && prev.card && prev.card[p]) return prev.card[p];
    const had = new Set(Object.values(sess.rounds || {}).filter(Boolean).map(r => (r.card || {})[p]).filter(Boolean));
    const free = les.p2.map(c => c.id).filter(id => !had.has(id));
    return shuffle(free.length ? free : les.p2.map(c => c.id))[0];
  }
  function metUpd(g, up) {
    g.forEach(gr => {
      gr.forEach(a => gr.forEach(b => { if (a !== b) up[`met/${a}/${b}`] = (((sess.met || {})[a] || {})[b] || 0) + 1; }));
      if (gr.length > 2) gr.forEach(a => { up["trio/" + a] = ((sess.trio || {})[a] || 0) + 1; });
    });
  }

  // ---------- qadamlar ----------
  async function go(ni, opt) {
    if (busy || !sess) return; busy = true;
    try {
      const plan = sess.plan, cur = sess.cur || { i: -1 }, step = plan[ni];
      if (!step) return;
      const lock = await db.ref(`sessions/${sid}/adv`).transaction(v => (v == null || v < ni || (opt && opt.force)) ? ni : undefined);
      if (!lock.committed) return;
      const up = {}, prevStep = plan[cur.i], now = CLS.now();
      if (!prevStep || prevStep.r !== step.r || !(sess.rounds || {})[step.r] || (opt && opt.repair)) {
        const ppl = present();
        if (ppl.length < 2) { alert("Juftlash uchun kamida 2 ta o'quvchi kerak (kirganlar yoki 🙋 qurilmasiz deb belgilanganlar)."); await db.ref(`sessions/${sid}/adv`).set(cur.i); return; }
        const g = pairUp(ppl);
        const prev = prevStep && prevStep.b === "p2" ? (sess.rounds || {})[prevStep.r] : null;
        up["rounds/" + step.r] = fillRound(step, { g: g, at: now }, prev);
        metUpd(g, up);
        up.cur = { i: ni, at: now + 20000 };
      } else up.cur = { i: ni, at: now + (step.h !== prevStep.h ? 5000 : 3000) };
      await db.ref("sessions/" + sid).update(up);
    } catch (e) { alert("Xato: " + e.message); } finally { busy = false; }
  }
  function pause() {
    const c = sess.cur; if (!c || c.i < 0) return;
    const now = CLS.now();
    db.ref(`sessions/${sid}/cur`).set(c.pz ? { i: c.i, at: c.at + (now - c.pz) } : { i: c.i, at: c.at, pz: now });
  }
  function restartStep() { const c = sess.cur; if (!c || c.i < 0) return; db.ref(`sessions/${sid}/cur`).set({ i: c.i, at: CLS.now() + 3000 }); }
  function repair() {
    const c = sess.cur; if (!c || c.i < 0) return;
    if (!confirm("Shu raund juftliklarini qaytadan tuzaymi? (Kirganlarning hammasi yangi juftlikka bo'linadi.)")) return;
    const st = sess.plan[c.i]; let first = c.i; while (first > 0 && sess.plan[first - 1].r === st.r) first--;
    go(first, { force: true, repair: true });
  }
  function closeLesson() {
    if (!confirm("Speaking darsini yopaymi? O'quvchilar ekranida \"Dars yakunlandi\" chiqadi. Natijalar shu bo'limda (Oldingi darslar) saqlanib qoladi.")) return;
    const id = sid;
    db.ref("sessions/" + id).update({ state: "closed", closedAt: CLS.TS }).then(() => db.ref("current/" + group).remove()).then(() => { if (sid) detach(); if (TP().rewatch) TP().rewatch(); openView(id); });
  }

  // kech kelgan / qurilmasiz / chiqib ketgan
  async function addNow(p) {
    const c = sess.cur, st = c && sess.plan[c.i]; if (!st) return;
    const round = JSON.parse(JSON.stringify(sess.rounds[st.r])), up = {};
    if ((sess.gone || {})[p]) up["gone/" + p] = null;
    let gi = round.g.findIndex(g => g && g.length === 1);
    if (gi < 0) { let bc = 1e9; round.g.forEach((g, i) => { if (!g) return; const c2 = g.length * 100 + g.reduce((s, m) => s + (((sess.met || {})[p] || {})[m] || 0) * 10 + (devOf(m) === "none" && devOf(p) === "none" ? 1000 : 0), 0); if (c2 < bc) { bc = c2; gi = i; } }); }
    if (gi < 0) return;
    const was = round.g[gi].length;
    round.g[gi].push(p);
    if (st.b === "p2") round.card = Object.assign(round.card || {}, { [p]: pickCard(p, st, null) });
    else if (was === 1) round.q[gi] = { 0: qList(st.b, SP.roles(round.g[gi], 0).c), 1: qList(st.b, SP.roles(round.g[gi], 1).c) };
    up["rounds/" + st.r] = round; metUpd([round.g[gi]], up);
    await db.ref("sessions/" + sid).update(up);
  }
  async function markGone(p, fromFlag) {
    if (!p || !sess || (sess.gone || {})[p]) return;
    const up = { ["gone/" + p]: 1 }, c = sess.cur, st = c && sess.plan[c.i];
    if (st && sess.rounds && sess.rounds[st.r]) {
      const round = JSON.parse(JSON.stringify(sess.rounds[st.r])), gi = SP.findGroup(round, p);
      if (gi >= 0) {
        round.g[gi] = round.g[gi].filter(x => x !== p);
        const left = round.g[gi];
        if (left.length === 1) {   // yolg'iz qoldi: boshqa juftlikka uchinchi bo'lib qo'shiladi
          const x = left[0]; let bi = -1, bc = 1e9;
          round.g.forEach((g, i) => { if (i === gi || !g || g.length !== 2) return; const cc = g.reduce((s, m) => s + (devOf(m) === "none" && devOf(x) === "none" ? 1000 : 0) + (((sess.met || {})[x] || {})[m] || 0) * 10, 0) + Math.random(); if (cc < bc) { bc = cc; bi = i; } });
          if (bi >= 0) { round.g[bi].push(x); round.g.splice(gi, 1); if (st.b === "p2") round.card[x] = round.card[x] || pickCard(x, st, null); }
        }
        if (st.b !== "p2") { round.q = {}; round.g.forEach((g, i) => { round.q[i] = { 0: qList(st.b, SP.roles(g, 0).c), 1: g.length > 1 ? qList(st.b, SP.roles(g, 1).c) : [] }; }); }
        up["rounds/" + st.r] = round;
      }
    }
    await db.ref("sessions/" + sid).update(up);
    if (fromFlag) toast(`🚪 ${nm(p)} chiqib ketgan deb belgilandi (sherigi xabar berdi). Qaytsa, "Qo'shish" ni bosing.`);
  }
  function toggleNone(k) {
    const p = k2p[k], cur = p && (sess.ppl || {})[p];
    if (cur && cur.dev !== "none") return;
    const set = () => db.ref(`sessions/${sid}/ppl/${k2p[k]}`).set(cur ? null : { n: roster[k].name, dev: "none" });
    if (p) set(); else SP.pid(k, sid).then(x => { k2p[k] = x; p2k[x] = k; set(); });
  }
  function toast(t) { const el = $("tpToast"); if (!el) return; el.textContent = t; el.classList.add("on"); setTimeout(() => { el.classList.remove("on"); el.textContent = "✓ Bajarildi"; }, 4000); }

  // ---------- natijalar ----------
  function stats(S, LV, L) {
    const plan = S.plan || [], tgt = {}, R = {}, P = {};
    ["p1", "p3"].forEach(b => L[b].forEach(x => x.ch.forEach((c, j) => { if (c.t) tgt[x.id + ":" + j] = c.e; })));
    L.p2.forEach(x => x.ch.forEach((c, j) => { if (c.t) tgt[x.id + ":" + j] = c.e; }));
    const recs = [];
    for (const k in LV) for (const i in (LV[k].sp || {})) { const r = LV[k].sp[i]; if (r && r.c && plan[i]) recs.push({ i: +i, r: r, st: plan[i] }); }
    // baholovchi xolisligi: hammaga doim "kengaytirdi" (yoki doim "qisqa") bosgan bo'lsa, vazni yarim
    recs.forEach(({ r }) => { const by = r.by || "?"; const a = Object.values(r.a || {}); R[by] = R[by] || { n: 0, y: 0 }; R[by].n += a.length; R[by].y += a.filter(x => x).length; });
    const w = by => { const x = R[by]; return x && x.n >= 8 && (x.y / x.n >= .95 || x.y / x.n <= .05) ? .5 : 1; };
    const used = new Set();
    recs.forEach(({ r, st }) => {
      const p = P[r.c] = P[r.c] || { ans: 0, ext: 0, wsum: 0, turns: {}, t: [], cov: [], u: new Set(), tu: new Set(), pz: 0, uz: 0 };
      const wt = w(r.by), a = Object.values(r.a || {});
      p.ans += a.length * wt; p.ext += a.filter(x => x).length * wt;
      p.turns[r.i] = Math.max(p.turns[r.i] || 0, a.length);
      if (st.b === "p2") { if (r.t != null) p.t.push({ att: st.att, t: r.t }); const card = L.p2.find(c => c.id === ((S.rounds || {})[st.r] || {}).card?.[r.c]); if (card) p.cov.push(Object.keys(r.cv || {}).length / card.cue.length); }
      Object.keys(r.u || {}).forEach(id => { p.u.add(id); if (tgt[id]) { p.tu.add(tgt[id]); used.add(tgt[id]); } });
      p.pz += r.pz || 0; p.uz += r.uz || 0;
    });
    const tr = S.tr || {}, nT = new Set(Object.values(tgt)).size;
    const rows = Object.keys(S.ppl || {}).map(pid => {
      const p = P[pid] || { ans: 0, ext: 0, turns: {}, t: [], cov: [], u: new Set(), tu: new Set(), pz: 0, uz: 0 };
      const er = p.ans ? p.ext / p.ans : null, nt = Object.keys(p.turns).length, t = p.t.length ? p.t.reduce((s, x) => s + x.t, 0) / p.t.length : null;
      const tv = Object.values(tr[pid] || {}), tavg = tv.length ? tv.reduce((s, x) => s + x, 0) / tv.length : null;
      let score = null;
      if (p.ans || p.t.length) score = (er == null ? 20 : (1 - er) * 40) + (t == null ? 15 : Math.max(0, 110 - t) / 110 * 30) + (1 - Math.min(1, p.tu.size / Math.max(3, nT / 3))) * 20 + Math.min(10, (p.pz + p.uz) / Math.max(1, nt) * 5) + (tavg == null ? 0 : (2 - tavg) * 15);
      return { pid, n: S.ppl[pid].n, dev: S.ppl[pid].dev, gone: !!(S.gone || {})[pid], er, ans: Math.round(p.ans), turns: nt, t, tl: p.t, cov: p.cov.length ? p.cov.reduce((s, x) => s + x, 0) / p.cov.length : null, tu: p.tu.size, nT, pz: p.pz, uz: p.uz, tavg, score };
    }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    const unused = [...new Set(Object.values(tgt))].filter(e => !used.has(e));
    return { rows, unused, nT, biased: Object.keys(R).filter(by => w(by) < 1).map(by => (S.ppl || {})[by] ? S.ppl[by].n : "?") };
  }
  function statsHtml(st, live) {
    const pct = v => v == null ? "—" : Math.round(v * 100) + "%";
    const weak = st.rows.filter(r => r.score != null).slice(0, 5);
    let h = `<div class="card"><div class="card-header"><h3 class="card-title">📊 Natijalar</h3><span class="muted" style="font-size:.8rem">O'quvchilar band qo'ymaydi: faqat "kengaytirdi / qisqa", ishlatilgan iboralar, Part 2 vaqti. ASSESSMENT'ga yozilmaydi.</span></div>`;
    if (weak.length) h += `<div class="notice" style="margin-bottom:12px"><span>🎯 <b>Tinglash kerak (hot seat):</b> ${weak.map(r => esc(r.n)).join(", ")}</span></div>`;
    h += `<div class="tbl-wrap"><table><thead><tr><th>O'quvchi</th><th title="Part 1 va Part 3 javoblari">Javoblar</th><th title="Kengaytirilgan javoblar ulushi">Kengaytirdi</th><th>Part 2 vaqti</th><th title="Kartadagi bandlar qamrovi">Bandlar</th><th>Target iboralar</th><th title="Uzoq jim qoldi / o'zbekcha so'z">⏸ / 🇺🇿</th><th>Ustoz</th></tr></thead><tbody>`;
    st.rows.forEach(r => {
      const on = live ? (r.dev === "none" || (live[p2k[r.pid]] || {}).online) : true;
      h += `<tr${r.gone ? ' style="opacity:.5"' : ""}><td>${weak.includes(r) ? "🎯 " : ""}${esc(r.n)} <span class="muted">${({ pc: "💻", phone: "📱", none: "🙋" })[r.dev] || ""}${on ? "" : " · chiqqan"}</span></td><td>${r.ans}</td><td>${pct(r.er)}</td>
        <td>${r.tl.length ? r.tl.map(x => `<span class="badge ${x.t < 90 ? "b-bad" : x.t < 110 ? "b-warn" : "b-ok"}" title="${x.att ? SP.ATT[x.att] : "Part 2"}">${SP.fmt(x.t)}</span>`).join(" ") : "—"}</td><td>${pct(r.cov)}</td><td>${r.tu} / ${r.nT}</td><td>${r.pz} / ${r.uz}</td><td>${r.tavg == null ? "—" : ["", "Zaif", "O'rta", "Yaxshi"][Math.round(r.tavg)]}</td></tr>`;
    });
    h += `</tbody></table></div>`;
    if (st.unused.length) h += `<div style="margin-top:12px"><b>Hech kim ishlatmagan target iboralar (${st.unused.length}):</b> <span class="muted">${st.unused.map(esc).join(" · ")}</span></div>`;
    if (st.biased.length) h += `<div class="muted" style="margin-top:6px;font-size:.8rem">Vazni kamaytirilgan baholovchilar (hammaga bir xil bosgan): ${st.biased.map(esc).join(", ")}</div>`;
    return h + `</div>`;
  }

  // ---------- jonli panel ----------
  function draw() {
    if (!sess || !les || !$("spLive")) return;
    const cur = sess.cur || { i: -1 }, plan = sess.plan, step = plan[cur.i], now = CLS.now(), ck = SP.clock(cur, step, now);
    // avtomatik: rollar almashinuvi (va xohlasa yangi raund)
    if (step && ck.over && !cur.pz && ck.el > step.dur + 2) { const nx = plan[cur.i + 1]; if (nx && ((nx.r === step.r && auto) || (nx.r !== step.r && autoR))) go(cur.i + 1); }
    const key = JSON.stringify([sess.cur, sess.rounds && step && sess.rounds[step.r], sess.ppl, sess.gone, sess.tr, Object.keys(live).map(k => [k, live[k].online, live[k].sp && Object.keys(live[k].sp).length, JSON.stringify(live[k].sp || {}).length]), hs, auto, autoR, ck && ck.over, ck && ck.wait > 0]);
    if (key === lastDraw) { tickTimer(step, ck); return; }
    lastDraw = key;
    const round = step && (sess.rounds || {})[step.r], ppl = sess.ppl || {}, gone = sess.gone || {};
    const inG = new Set(round ? [].concat(...round.g.filter(Boolean)) : []);
    const nx = plan[cur.i + 1], newRound = !step || !nx || nx.r !== step.r;
    let h = `<div class="card"><div class="card-header"><div><h3 class="card-title">🗣️ ${esc(sess.title)} · ${esc(CLS.GROUPS[sess.group].name)}</h3><div class="muted" style="font-size:.85rem">${step ? `${cur.i + 1}/${plan.length}-qadam · ${SP.stepLabel(step)} · ${step.h ? "2-yarim (rollar almashdi)" : "1-yarim"}` : "Hali boshlanmadi"}</div></div>
      <div style="display:flex;align-items:center;gap:12px"><span id="spPh" class="muted"></span><b id="spTm" style="font:700 2rem 'JetBrains Mono',monospace">—</b></div></div>
      <div class="row" style="align-items:center">
        <button class="btn btn-primary" id="spNext">${!step ? "▶ Boshlash (juftlash)" : !nx ? "✓ Oxirgi qadam" : newRound ? "⏭ Keyingi raund (yangi juftlik)" : "🔄 Rollarni almashtirish"}</button>
        ${step ? `<button class="btn btn-secondary" id="spPause">${cur.pz ? "▶ Davom" : "⏸ Pauza"}</button><button class="btn btn-secondary" id="spRe">↺ Qadamni qayta</button><button class="btn btn-secondary" id="spRep">🔀 Qayta juftlash</button>` : ""}
        <button class="btn btn-secondary" id="spScr">🖥 Ekranni ochish</button>
        <label class="muted" style="font-size:.82rem;display:flex;gap:6px;align-items:center"><input type="checkbox" id="spAuto"${auto ? " checked" : ""}> Rollar avtomatik almashsin</label>
        <label class="muted" style="font-size:.82rem;display:flex;gap:6px;align-items:center"><input type="checkbox" id="spAutoR"${autoR ? " checked" : ""}> Raundlar ham avtomatik</label>
        <span style="flex:1"></span><button class="btn btn-secondary btn-sm" id="spClose">Darsni yopish</button>
      </div>
      <div class="muted" style="margin-top:8px;font-size:.82rem">O'quvchilar kabinetdagi doimiy sinf havolasi orqali kiradi. Ekran havolasini proyektorda oching.</div></div>`;
    // juftliklar
    if (round) {
      h += `<div class="card"><div class="card-header"><h3 class="card-title">👥 Juftliklar (${round.g.filter(Boolean).length})</h3><span class="muted" style="font-size:.8rem">Ustoz bahosi: aylanib yurib eshitganingizda javob berayotgan o'quvchiga bosing.</span></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">`;
      round.g.forEach((g, gi) => {
        if (!g) return;
        const R = SP.roles(g, step.h), r = recFor(cur.i, R.c), q = r && step.b !== "p2" ? (((round.q || {})[gi] || {})[step.h] || [])[r.pos || 0] : null, qq = q ? (les[step.b].find(x => x.id === q) || {}).q : "";
        const card = step.b === "p2" ? les.p2.find(c => c.id === (round.card || {})[R.c]) : null;
        h += `<div style="border:1px solid var(--border);border-radius:12px;padding:10px 12px"><div class="muted" style="font-size:.75rem;font-weight:700">${gi + 1}-juftlik</div>
          ${g.map(p => `<div style="display:flex;gap:6px;align-items:center;padding:2px 0"><b>${esc(nm(p))}</b> ${icon(p)}<span class="badge ${p === R.c ? "b-warn" : p === R.e ? "b-blue" : "b-mut"}" style="margin-left:auto">${p === R.c ? "🎤 javob" : p === R.e ? "so'raydi" : "kuzatadi"}</span></div>`).join("")}
          <div class="muted" style="font-size:.78rem;margin-top:4px">${card ? "Karta: " + esc(card.short) : qq ? "Hozir: " + esc(qq) : ""}${r ? ` · ${Object.keys(r.a || {}).length} javob, ${Object.keys(r.u || {}).length} ibora${r.t != null ? ", " + SP.fmt(r.t) : ""}` : ""}</div>
          <div class="row" style="margin-top:6px;gap:6px">${[1, 2, 3].map(v => `<button class="btn btn-secondary btn-sm" data-tr="${R.c}" data-v="${v}" style="${((sess.tr || {})[R.c] || {})["s" + cur.i] === v ? "background:var(--ink);color:#fff" : ""}">${["", "Zaif", "O'rta", "Yaxshi"][v]}</button>`).join("")}</div></div>`;
      });
      h += `</div></div>`;
    }
    // ishtirokchilar
    const gk = Object.keys(roster || {}).filter(k => roster[k].group === sess.group).sort((a, b) => String(roster[a].name).localeCompare(roster[b].name));
    h += `<div class="card"><div class="card-header"><h3 class="card-title">🙋 Ishtirokchilar</h3><span class="muted" style="font-size:.8rem">Kulrang = kirmagan. Qurilmasi yo'q o'quvchini "🙋 Qurilmasiz" qiling: u doim qurilmasi bor o'quvchi bilan juftlanadi.</span></div><div style="display:flex;flex-wrap:wrap;gap:8px">`;
    gk.forEach(k => {
      const p = k2p[k], pp = p && ppl[p], on = pp && (pp.dev === "none" || (live[k] || {}).online), g = p && gone[p], wait = on && !g && step && !inG.has(p);
      h += `<div style="border:1px solid var(--border);border-radius:10px;padding:6px 10px;display:flex;gap:6px;align-items:center;${on && !g ? "" : "opacity:.55"}"><span>${esc(roster[k].name)}</span>${pp ? `<span>${icon(p)}</span>` : ""}
        ${g ? `<span class="badge b-mut">chiqib ketgan</span><button class="btn btn-secondary btn-sm" data-add="${p}">Qaytarish</button>` : ""}
        ${wait ? `<span class="badge b-warn">kutmoqda</span><button class="btn btn-secondary btn-sm" data-add="${p}">Hozir qo'shish</button>` : ""}
        ${!on && !g ? `<button class="btn btn-secondary btn-sm" data-none="${k}">🙋 Qurilmasiz</button>` : ""}
        ${pp && pp.dev === "none" && !g ? `<button class="btn btn-secondary btn-sm" data-none="${k}" title="Qurilmasiz belgisini olib tashlash">✕</button>` : ""}
        ${on && !g && step && inG.has(p) ? `<button class="btn btn-secondary btn-sm" data-gone="${p}" title="Darsdan chiqib ketdi">🚪</button>` : ""}</div>`;
    });
    h += `</div></div>`;
    h += hotSeat();
    const st = stats(sess, live, les);
    h += statsHtml(st, live);
    $("spLive").innerHTML = h;
    bindLive();
    tickTimer(step, ck);
  }
  function recFor(i, c) { for (const k in live) { const r = (live[k].sp || {})[i]; if (r && r.c === c) return r; } return null; }
  function tickTimer(step, ck) {
    const tm = $("spTm"), ph = $("spPh"); if (!tm) return;
    if (!step) { tm.textContent = "—"; ph.textContent = ""; return; }
    if (ck.wait > 0) { tm.textContent = SP.fmt(ck.wait); ph.textContent = "joyga o'tish"; return; }
    if (ck.over) { tm.textContent = "0:00"; ph.textContent = "⏱ vaqt tugadi"; return; }
    if (step.b === "p2") { const p = SP.p2phase(step, ck.el); tm.textContent = SP.fmt(p.left); ph.textContent = (sess.cur.pz ? "⏸ " : "") + p.n; }
    else { tm.textContent = SP.fmt(ck.left); ph.textContent = sess.cur.pz ? "⏸ pauza" : "gapirish"; }
  }
  function bindLive() {
    const cur = sess.cur || { i: -1 };
    $("spNext").onclick = () => { if (sess.plan[cur.i + 1]) go(cur.i + 1); };
    if ($("spPause")) { $("spPause").onclick = pause; $("spRe").onclick = restartStep; $("spRep").onclick = repair; }
    $("spScr").onclick = () => window.open("../speaking/screen.html?s=" + encodeURIComponent(sid) + CLS.emu, "_blank");
    $("spAuto").onchange = e => { auto = e.target.checked; lastDraw = ""; };
    $("spAutoR").onchange = e => { autoR = e.target.checked; lastDraw = ""; };
    $("spClose").onclick = closeLesson;
    document.querySelectorAll("#spLive [data-tr]").forEach(b => b.onclick = () => { const p = b.dataset.tr, v = +b.dataset.v, ref = db.ref(`sessions/${sid}/tr/${p}/s${cur.i}`); ref.set(((sess.tr || {})[p] || {})["s" + cur.i] === v ? null : v); });
    document.querySelectorAll("#spLive [data-add]").forEach(b => b.onclick = () => addNow(b.dataset.add));
    document.querySelectorAll("#spLive [data-gone]").forEach(b => b.onclick = () => { if (confirm(nm(b.dataset.gone) + " darsdan chiqib ketdimi?")) markGone(b.dataset.gone); });
    document.querySelectorAll("#spLive [data-none]").forEach(b => b.onclick = () => toggleNone(b.dataset.none));
    bindHot();
  }

  // ---------- hot seat ----------
  function hotSeat() {
    const opts = Object.keys(sess.ppl || {}).filter(p => !(sess.gone || {})[p]).sort((a, b) => nm(a).localeCompare(nm(b)));
    let h = `<div class="card"><div class="card-header"><h3 class="card-title">🔥 Hot seat</h3><span class="muted" style="font-size:.8rem">Sinf oldida o'zingiz so'raysiz: o'quvchiga hali berilmagan savol chiqadi.</span></div>
      <div class="row"><label><span class="field-label">O'quvchi</span><select class="field" id="spHsP">${opts.map(p => `<option value="${p}"${hs && hs.p === p ? " selected" : ""}>${esc(nm(p))}</option>`).join("")}</select></label>
      <button class="btn btn-secondary" data-hs="p1">Part 1 savol</button><button class="btn btn-secondary" data-hs="p2">Part 2 karta</button><button class="btn btn-secondary" data-hs="p3">Part 3 savol</button></div>`;
    if (hs) {
      const x = les[hs.b].find(q => q.id === hs.id);
      if (x) {
        h += `<div style="margin-top:14px;border:1px solid var(--border);border-radius:12px;padding:14px"><div class="muted" style="font-size:.78rem;font-weight:700">${esc(nm(hs.p))} · ${SP.BN[hs.b]}${x.topic ? " · " + esc(x.topic) : ""}</div><div style="font-size:1.2rem;font-weight:700;margin:4px 0">${esc(x.q)}</div>`;
        if (x.cue) h += `<ul style="margin:4px 0 0 18px">${x.cue.map(c => `<li>${esc(c)}</li>`).join("")}</ul>`;
        if (x.v && x.v.length) h += `<div class="muted" style="font-size:.85rem">yoki: ${x.v.map(esc).join(" / ")}</div>`;
        h += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${x.ch.map(c => `<span class="badge ${c.t ? "b-warn" : "b-mut"}" title="${esc(c.u || "")}">${esc(c.e)}${c.u ? " — " + esc(c.u) : ""}</span>`).join("")}</div>`;
        h += `<div class="row" style="margin-top:10px;gap:6px"><span class="muted" style="font-size:.85rem">Bahongiz:</span>${[1, 2, 3].map(v => `<button class="btn btn-secondary btn-sm" data-hsv="${v}">${["", "Zaif", "O'rta", "Yaxshi"][v]}</button>`).join("")}<button class="btn btn-secondary btn-sm" data-hs="${hs.b}">Boshqa savol →</button></div></div>`;
      }
    }
    return h + `</div>`;
  }
  function bindHot() {
    document.querySelectorAll("#spLive [data-hs]").forEach(b => b.onclick = () => {
      const p = $("spHsP").value, bk = b.dataset.hs; if (!p) return;
      let id;
      if (bk === "p2") { const had = new Set(Object.values(sess.rounds || {}).filter(Boolean).map(r => (r.card || {})[p])); const f = les.p2.filter(c => !had.has(c.id)); id = shuffle(f.length ? f : les.p2)[0].id; }
      else { const asked = askedBy(p); const all = les[bk].filter(q => !asked.has(q.id) && !(hs && hs.id === q.id)); id = shuffle(all.length ? all : les[bk])[0].id; }
      hs = { p: p, b: bk, id: id }; lastDraw = ""; draw();
    });
    document.querySelectorAll("#spLive [data-hsv]").forEach(b => b.onclick = () => { if (!hs) return; db.ref(`sessions/${sid}/tr/${hs.p}/hs_${hs.id}`).set(+b.dataset.hsv); toast("✓ Baho saqlandi: " + nm(hs.p)); });
  }

  // ---------- oldingi darslar (natijalarni qayta ko'rish) ----------
  function loadPast() {
    const el = $("spPast"); if (!el || !group) return;
    db.ref("sessions").orderByChild("group").equalTo(group).limitToLast(40).once("value").then(s => {
      const all = s.val() || {}, ids = Object.keys(all).filter(id => all[id] && all[id].skill === "speaking").sort((a, b) => (all[b].created || 0) - (all[a].created || 0)).slice(0, 8);
      el.innerHTML = ids.length ? `<b style="font-size:.88rem">Oldingi Speaking darslari:</b> ` + ids.map(id => { const d = new Date(all[id].created || 0); return `<button class="btn btn-secondary btn-sm" data-past="${id}" style="margin:3px">${esc(all[id].title.split(":")[0])} · ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}</button>`; }).join("") : "";
      el.querySelectorAll("[data-past]").forEach(b => b.onclick = () => openView(b.dataset.past));
    }).catch(() => {});
  }
  async function openView(id) {
    const [s, l] = await Promise.all([db.ref("sessions/" + id).get(), db.ref("live/" + id).get()]);
    const S = s.val(), LV = l.val() || {}; if (!S) return;
    const L = await SP.lesson(S.test);
    view = id;
    $("spView").innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">${esc(S.title)} · ${new Date(S.created).toLocaleDateString("uz")}</h3><button class="btn btn-secondary btn-sm" id="spViewX">Yopish</button></div><div class="muted">Qatnashganlar: ${Object.keys(S.ppl || {}).length} · Raundlar: ${Object.keys(S.rounds || {}).length}</div></div>` + statsHtml(stats(S, LV, L), null);
    $("spView").classList.remove("hide");
    $("spViewX").onclick = () => { view = null; $("spView").classList.add("hide"); };
    $("spView").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- ulanish ----------
  function init() {
    if (!$("spBox") || !(TP().verified && TP().verified())) return;
    shell();
    const g = TP().group && TP().group();
    if (g && g !== group) { group = g; if (sid) detach(); watch(); }
    if (!tickT) tickT = setInterval(() => { if (sid && sess) draw(); }, 500);
  }
  // sahifa ochilganda Speaking bo'limi tanlangan bo'lsa (kirish tasdiqlangach) o'zi ishga tushadi
  const boot = setInterval(() => { const pane = document.querySelector('[data-pane="speaking"]'); if (pane && !pane.classList.contains("hide") && TP().verified && TP().verified()) { init(); if (group) { clearInterval(boot); } } }, 1000);
  window.addEventListener("cls-tab", e => { if (e.detail === "speaking") { init(); watch(); } });
  window.addEventListener("cls-group", () => { group = null; init(); });
  window.CLS_SP = { rewatch: () => { if (group) watch(); }, open: () => !!sid };
})();
