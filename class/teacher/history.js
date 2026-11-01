// Darsda o'tilgan testlar: qaysi guruhda qaysi Reading/Listening testi qachon o'tilgani.
// Manba: Firebase sessions/* (har bir ochilgan dars o'zi yoziladi) + admin/classHist (qo'lda qo'shilgan / yashirilgan).
// Test tanlash ro'yxatida o'tilganlar "✓ sana" bilan belgilanadi.
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const OY = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];
  const HAF = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
  const SK = { reading: { sel: "rdTest", card: "rdOpen", p: "rd" }, listening: { sel: "lsTest", card: "lsOpen", p: "ls" } };
  // Firebase'dan oldingi (Mac panel / qog'oz) darslar: Course ASSESSMENT ustunlaridan, ikkala guruh uchun.
  // Sanasi jadvaldagi ustun sanasi (taxminiy bo'lishi mumkin). Noto'g'risini ✕ bilan yashirish mumkin.
  const SEED = [
    ["reading", "c12t5", "2026-08-28"], ["reading", "c12t6", "2026-09-09"], ["reading", "c12t7", "2026-09-18"],
    ["reading", "c12t8", "2026-09-28"], ["reading", "c13t2", "2026-10-14"], ["reading", "c13t3", "2026-10-23"],
    ["listening", "c12t6", "2026-08-26"], ["listening", "c12t8", "2026-09-16"], ["listening", "c13t1", "2026-09-23"],
    ["listening", "c13t2", "2026-09-23"], ["listening", "c13t4", "2026-10-02"], ["listening", "c14t1", "2026-10-12"],
    ["listening", "c14t2", "2026-10-13"], ["listening", "c14t3", "2026-10-20", "uy vazifasi"], ["listening", "c14t4", "2026-10-21"],
    ["listening", "c15t1", "2026-10-29", "uy vazifasi"], ["listening", "c15t2", "2026-10-30"]
  ];
  let db = null, sessions = {}, hist = {}, hw = null, hwBusy = false, ready = 0, showAll = { reading: false, listening: false }, openChips = {}, chDate = {};

  const css = `
  .ch-card .ch-next{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--green-bg,#ECFDF3);border-radius:10px;padding:9px 12px;margin-bottom:12px;font-size:.9rem;color:var(--ink)}
  .ch-row{display:flex;align-items:center;gap:10px;padding:9px 2px;border-top:1px solid var(--border);font-size:.9rem;color:var(--ink)}
  .ch-row:first-of-type{border-top:0}
  .ch-d{min-width:92px;color:var(--muted);font-size:.82rem;white-space:nowrap}
  .ch-t{flex:1;min-width:0}
  .ch-t small{display:block;color:var(--muted);font-size:.76rem}
  .ch-row.dim{opacity:.55}
  .ch-x{border:0;background:transparent;color:var(--muted);cursor:pointer;font-size:1rem;padding:2px 6px}
  .ch-x:hover{color:var(--red)}
  .ch-warn{margin-top:8px;font-size:.85rem;color:var(--amber)}
  .ch-add{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;margin-top:12px}
  .ch-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:.85rem}
  .ch-tools .ch-w{color:var(--amber)}
  .ch-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
  .ch-chip{border:1px solid var(--border);background:var(--card);color:var(--ink);border-radius:999px;padding:6px 11px;font-size:.82rem;cursor:pointer}
  .ch-chip.on{background:var(--green-bg,#ECFDF3);border-color:var(--green,#15803D);color:var(--green,#15803D);font-weight:600}
  .ch-more{border:0;background:transparent;color:var(--blue);cursor:pointer;font-weight:600;padding:8px 0 0}
  @media(max-width:560px){.ch-row{display:grid;grid-template-columns:62px 1fr auto;gap:2px 8px;align-items:center}.ch-d{min-width:0;grid-row:1/3;font-size:.76rem;white-space:normal}.ch-t{grid-column:2}.ch-b{grid-column:2;grid-row:2}.ch-x{grid-column:3;grid-row:1/3}}`;

  const gName = g => (window.CLS && CLS.GROUPS[g] ? CLS.GROUPS[g].name : g);
  const curGroup = () => (window.CLS_TP ? CLS_TP.group() : "test");
  const dayKey = t => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const fromKey = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d, 12).getTime(); };
  const fmtD = t => { const d = new Date(t); return d.getDate() + "-" + OY[d.getMonth()]; };
  const fmtDW = t => fmtD(t) + ", " + HAF[new Date(t).getDay()];
  const titleOf = (sk, key) => {
    const t = (window.CLASS_TESTS || []).find(x => x.skill === sk && x.key === key);
    if (t) return t.title.replace(/ · (Reading|Listening)$/, "");
    const m = /^c(\d+)t(\d+)$/.exec(key); return m ? `Cambridge ${m[1]} Test ${m[2]}` : key;
  };

  // hamma yozuvlar: {id, skill, test, group, at, state, graded, auto, note}
  function entries() {
    const out = [];
    Object.entries(sessions).forEach(([id, s]) => {
      if (!s || !SK[s.skill] || !s.group || (hist[id] && hist[id].hide)) return;
      const at = s.start || (typeof s.created === "number" ? s.created : 0) || 0;
      if (!at) return;
      out.push({ id, skill: s.skill, test: s.test, group: s.group, at, started: !!s.start, state: s.state, graded: !!s.graded, auto: true });
    });
    const real = new Set(out.filter(e => e.started).map(e => e.skill + "/" + e.test + "/" + e.group));
    SEED.forEach(([sk, t, d, note]) => ["morning", "afternoon"].forEach(g => {
      const id = "seed_" + sk + "_" + t + "_" + g;
      if ((hist[id] && hist[id].hide) || real.has(sk + "/" + t + "/" + g)) return;
      out.push({ id, skill: sk, test: t, group: g, at: fromKey(d), started: true, seed: true, note: note || "Course jadvalidan" });
    }));
    Object.entries(hw || {}).forEach(([lid, h]) => {   // Home task'da berilganlar (Drive hw_log.json)
      const sk = h && (h.skill || "reading");
      if (!SK[sk] || !h.chats) return;
      Object.entries(h.chats).forEach(([chat, c]) => {
        const g = CLS.groupOfChat(chat), at = c && c.at ? Date.parse(c.at) : 0, id = "hw_" + lid + "_" + g;
        if (!g || !at || (hist[id] && hist[id].hide)) return;
        out.push({ id, skill: sk, test: h.t, group: g, at, started: true, hw: true, note: "Home task'da berilgan" });
      });
    });
    Object.entries(hist).forEach(([id, h]) => {
      if (!h || h.hide || !h.manual || !SK[h.skill]) return;
      out.push({ id, skill: h.skill, test: h.test, group: h.group, at: fromKey(h.date), started: true, manual: true, note: h.note || "qo'lda qo'shilgan" });
    });
    return out.sort((a, b) => b.at - a.at);
  }
  // o'tilgan (boshlangan) darslar: test -> eng oxirgi sana, guruh bo'yicha
  function doneMap(all, sk, g) {
    const m = {};
    all.forEach(e => { if (e.skill === sk && e.group === g && e.started && !(m[e.test] > e.at)) m[e.test] = e.at; });
    return m;
  }

  function mountCards() {
    if (!$("chCss")) { const st = document.createElement("style"); st.id = "chCss"; st.textContent = css; document.head.appendChild(st); }
    Object.entries(SK).forEach(([sk, c]) => {
      if ($(c.p + "Hist")) return;
      const box = document.createElement("div");
      box.className = "card ch-card"; box.id = c.p + "Hist";
      $(c.card).after(box);
      const w = document.createElement("div"); w.className = "ch-tools"; w.id = c.p + "HistWarn";
      $(c.p + "Msg").before(w);
      $(c.sel).addEventListener("change", () => warn(sk));
    });
  }

  function labelSelect(sk, all) {
    const g = curGroup(), mine = doneMap(all, sk, g);
    const others = ["morning", "afternoon"].filter(x => x !== g).map(x => [x, doneMap(all, sk, x)]);
    const sel = $(SK[sk].sel);
    Array.from(sel.options).forEach(o => {
      const base = titleOf(sk, o.value);
      let suf = "";
      if (mine[o.value]) suf = "  ✓ " + fmtD(mine[o.value]);
      else { const o2 = others.find(([, m]) => m[o.value]); if (o2) suf = "  · " + gName(o2[0]) + " " + fmtD(o2[1][o.value]); }
      o.textContent = base + suf;
    });
  }
  function warn(sk) {
    const all = entries(), g = curGroup(), t = $(SK[sk].sel).value, w = $(SK[sk].p + "HistWarn");
    if (!w) return;
    const mine = doneMap(all, sk, g)[t];
    w.innerHTML = mine ? `<span class="ch-w">⚠️ Bu test ${esc(gName(g))} guruhida ${fmtDW(mine)} kuni o'tilgan.</span><button class="btn btn-secondary btn-sm" data-chun="1">✕ O'tilmagan deb belgilash</button>`
      : `<button class="btn btn-secondary btn-sm" data-chmk="1">✓ O'tilgan deb belgilash</button>`;
    const b = w.querySelector("button");
    b.onclick = () => (mine ? unmark : mark)(sk, t, all);
  }
  // belgilash: bugungi sana bilan qo'lda yozuv; olib tashlash: shu test+guruhning hamma yozuvlari yashiriladi
  function mark(sk, t, all, d) {
    const id = "m_" + Date.now().toString(36);
    return db.ref("admin/classHist/" + id).set({ manual: true, skill: sk, test: t, group: curGroup(), date: d || dayKey(Date.now()) }).catch(er => alert(er.message));
  }
  function unmark(sk, t, all) {
    const up = {}, g = curGroup();
    (all || entries()).filter(e => e.skill === sk && e.test === t && e.group === g).forEach(e => { up[e.id] = e.manual ? null : { hide: true }; });
    if (Object.keys(up).length) return db.ref("admin/classHist").update(up).catch(er => alert(er.message));
  }
  function nextUndone(sk, all) {
    const g = curGroup(), mine = doneMap(all, sk, g);
    const list = (window.CLASS_TESTS || []).filter(t => t.skill === sk);
    let last = -1;   // eng oxirgi o'tilgan testdan keyingi birinchi o'tilmagan
    let lastAt = 0;
    list.forEach((t, i) => { if (mine[t.key] && mine[t.key] >= lastAt) { lastAt = mine[t.key]; last = i; } });
    for (let i = 1; i <= list.length; i++) { const t = list[(last + i) % list.length]; if (!mine[t.key]) return t; }
    return null;
  }

  function stateBadge(e) {
    if (e.hw) return `<span class="badge b-blue">${esc(e.note)}</span>`;
    if (e.seed) return `<span class="badge b-mut">${esc(e.note)}</span>`;
    if (e.manual) return `<span class="badge b-mut">${esc(e.note)}</span>`;
    if (!e.started) return `<span class="badge b-mut">ochildi, boshlanmadi</span>`;
    if (e.state === "run" || e.state === "paused" || e.state === "wait") return `<span class="badge b-blue">hozir ochiq</span>`;
    return e.graded ? `<span class="badge b-ok">natija yuborildi</span>` : `<span class="badge b-warn">natija yuborilmagan</span>`;
  }

  function draw() {
    if (!db || ready !== 3) return;
    mountCards();
    const all = entries(), g = curGroup();
    Object.entries(SK).forEach(([sk, c]) => {
      labelSelect(sk, all); warn(sk);
      const mine = all.filter(e => e.skill === sk && e.group === g);
      const done = new Set(mine.filter(e => e.started).map(e => e.test));
      const total = (window.CLASS_TESTS || []).filter(t => t.skill === sk);
      const left = total.filter(t => !done.has(t.key)).length;
      const nx = nextUndone(sk, all);
      const otherAt = (e) => {   // boshqa guruhda ham o'tilganmi
        const o = ["morning", "afternoon"].find(x => x !== e.group && doneMap(all, sk, x)[e.test]);
        return o ? `${gName(o)}: ${fmtD(doneMap(all, sk, o)[e.test])}` : (e.group !== "test" && g !== "test" ? `${gName(["morning", "afternoon"].find(x => x !== e.group))} guruhida hali o'tilmagan` : "");
      };
      const lim = showAll[sk] ? mine.length : 8;
      const rows = mine.slice(0, lim).map(e => `<div class="ch-row${e.started ? "" : " dim"}">
          <div class="ch-d">${fmtDW(e.at)}</div>
          <div class="ch-t"><b>${esc(titleOf(sk, e.test))}</b><small>${esc(otherAt(e))}</small></div>
          <span class="ch-b">${stateBadge(e)}</span>
          <button class="ch-x" data-chx="${esc(e.id)}" title="Ro'yxatdan olib tashlash">✕</button></div>`).join("");
      const dm = doneMap(all, sk, g);
      const chips = total.map(t => `<button class="ch-chip${dm[t.key] ? " on" : ""}" data-chip="${t.key}" title="${dm[t.key] ? "O'tilgan: " + fmtD(dm[t.key]) + ". Bosilsa o'tilmagan bo'ladi" : "Bosilsa o'tilgan deb belgilanadi"}">${dm[t.key] ? "✓ " : ""}${esc(titleOf(sk, t.key).replace("Cambridge ", "C").replace(" Test ", " T"))}</button>`).join("");
      $(c.p + "Hist").innerHTML = `
        <div class="card-header"><h3 class="card-title">📚 Darsda o'tilganlar · ${esc(gName(g))}</h3><span class="badge b-mut">${done.size} ta o'tilgan · ${left} ta qoldi</span></div>
        ${nx ? `<div class="ch-next">Keyingi o'tilmagan: <b>${esc(titleOf(sk, nx.key))}</b><button class="btn btn-secondary btn-sm" data-chpick="${nx.key}">Tanlash</button><button class="btn btn-secondary btn-sm" data-chskip="${nx.key}" title="Bu test aslida o'tilgan bo'lsa">✓ Bu o'tilgan</button></div>` : `<div class="ch-next">Ro'yxatdagi hamma testlar o'tilgan.</div>`}
        ${rows || `<div class="muted">Bu guruhda hali ${sk === "reading" ? "Reading" : "Listening"} darsi o'tilmagan.</div>`}
        ${mine.length > 8 ? `<button class="ch-more" data-chmore="1">${showAll[sk] ? "Kamroq ko'rsatish" : `Hammasini ko'rsatish (${mine.length})`}</button>` : ""}
        <details style="margin-top:10px"${openChips[sk] ? " open" : ""} data-chdet="1"><summary class="muted" style="cursor:pointer">☑ Hamma testlar: bosib o'tilgan / o'tilmagan deb belgilash</summary>
          <div class="ch-add"><label><span class="field-label">Belgilanadigan sana</span><input class="field" type="date" data-chd value="${chDate[sk] || dayKey(Date.now())}"></label></div>
          <div class="ch-chips">${chips}</div></details>`;
      const box = $(c.p + "Hist");
      box.querySelectorAll("[data-chx]").forEach(b => b.onclick = () => {
        const id = b.dataset.chx, e = mine.find(x => x.id === id);
        if (!confirm(`${titleOf(sk, e.test)} (${fmtD(e.at)}) ro'yxatdan olib tashlansinmi? (Natijalar o'chmaydi, faqat bu ro'yxatdan.)`)) return;
        db.ref("admin/classHist/" + id).set(e.manual ? null : { hide: true }).catch(er => alert(er.message));
      });
      const pk = box.querySelector("[data-chpick]");
      if (pk) pk.onclick = () => { const s = $(c.sel); s.value = pk.dataset.chpick; s.dispatchEvent(new Event("change")); s.focus(); };
      const mr = box.querySelector("[data-chmore]");
      if (mr) mr.onclick = () => { showAll[sk] = !showAll[sk]; draw(); };
      const sk2 = box.querySelector("[data-chskip]");
      if (sk2) sk2.onclick = () => mark(sk, sk2.dataset.chskip, all);
      const det = box.querySelector("[data-chdet]"), dIn = box.querySelector("[data-chd]");
      det.ontoggle = () => { openChips[sk] = det.open; };
      dIn.onchange = () => { chDate[sk] = dIn.value; };
      box.querySelectorAll("[data-chip]").forEach(b => b.onclick = () => {
        const t = b.dataset.chip;
        if (dm[t]) unmark(sk, t, all); else mark(sk, t, all, /^\d{4}-\d\d-\d\d$/.test(dIn.value) ? dIn.value : null);
      });
    });
  }

  function loadHw() {   // Home task ro'yxati: LC Panel hw_list (ulanish tasdiqlangach bir marta, keyin 10 daqiqada)
    if (hwBusy || !window.CLS_TP || !CLS_TP.verified()) return;
    hwBusy = true;
    CLS_TP.api({ admin: "hw_list" }).then(r => { if (r && r.ok) { hw = r.log || {}; draw(); } }).catch(() => {}).finally(() => { hwBusy = false; });
  }

  window.CH = {
    init(db0) {
      if (db) return;
      db = db0;
      db.ref("sessions").on("value", s => { sessions = s.val() || {}; ready |= 1; draw(); });
      db.ref("admin/classHist").on("value", s => { hist = s.val() || {}; ready |= 2; draw(); });
      window.addEventListener("cls-group", () => setTimeout(draw, 0));
      let n0 = 0; const t0 = setInterval(() => { if (hw || ++n0 > 20) return clearInterval(t0); loadHw(); }, 3000);
      setInterval(loadHw, 600000);
    },
    draw
  };
})();
