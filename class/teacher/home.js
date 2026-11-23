// Bosh sahifa (23.11): o'quvchilarning o'zlashtirishi bir qarashda — davomat, vazifalar, skill o'rtachalari, error log, kartochkalar.
// Manba: Course (LC Panel course_get — Yo'qlama/Baholar bilan bir xil, course.js keshi) + kartochkalar (kk_get). Yangi server so'rovi yo'q.
// Taxminiy band faqat ustoz uchun (kabinetda ko'rsatilmaydi).
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const T = () => window.CLS_TP, C = () => window.CLS_COURSE;
  const OYN = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
  const OYQ = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
  const SKL = [
    { k: "listening", n: "Listening", ic: "🎧", col: "#2a78d6", sc: 40 },
    { k: "reading", n: "Reading", ic: "📖", col: "#1baf7a", sc: 40 },
    { k: "writing", n: "Writing", ic: "✍️", col: "#6250d6", sc: 9 },
    { k: "speaking", n: "Speaking", ic: "🎙", col: "#d55181", sc: 9 }];
  const ACC = "#E8590C";
  let kk = null, busy = false, err = "", sortK = "band", sortD = -1;

  // IELTS 40 savol -> band (Listening; Reading — Academic)
  const LB = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 2]];
  const RB = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 2]];
  const band40 = (v, k) => { if (v == null) return null; const t = k === "reading" ? RB : LB, r = Math.round(v); for (const [m, b] of t) if (r >= m) return b; return null; };
  const half = v => Math.round(v * 2 + 1e-9) / 2;   // IELTS yaxlitlash: .25 -> .5, .75 -> keyingi butun
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const r1 = v => v == null ? null : Math.round(v * 10) / 10;
  const ddm = d => d.getDate() + "-" + OYQ[d.getMonth()];
  const monday = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; };

  // ---------- hisob ----------
  function compute() {
    const CC = C(), M = CC.model();
    if (!M) return null;
    const { cols, studs } = M, lbl = CC.label(), num = CC.num, norm = CC.norm;
    const names = new Set(studs.map(s => norm(s.name)));
    const val = (s, c) => { const v = num(s.r[c.i]); return v != null && v > 0 && v <= c.scale ? v : null; };
    const due = (s, c) => c.counts && (!s.start || !c.d || c.d >= s.start);

    // davomat: + va k = keldi, - = kelmadi, s = sababli (hisobga kirmaydi)
    const att = {}, days = [], monthPct = [];
    CC.months().forEach(m => {
      const B = CC.block((CC_data().sheets || {})[m] || [], lbl); if (!B) return;
      const dc = B.head.map((x, i) => CC.dOf(x) ? i : -1).filter(i => i >= 0);
      let mp = 0, ma = 0;
      dc.forEach(i => {
        const d = CC.dOf(B.head[i]); let p = 0, a = 0, s = 0, k = 0;
        B.rows.forEach(r => {
          const n = norm(r[1]); if (!names.has(n)) return;
          const v = String(r[i] || "").trim().toLowerCase(); if (!CC.isMark(v)) return;
          const A = att[n] = att[n] || { p: 0, a: 0, k: 0, mp: {}, ma: {} };
          if (v === "+" || v === "k") { p++; A.p++; A.mp[m] = (A.mp[m] || 0) + 1; if (v === "k") { k++; A.k++; } }
          else if (v === "-") { a++; A.a++; A.ma[m] = (A.ma[m] || 0) + 1; } else s++;
        });
        if (p + a) { days.push({ d, p, a, s, k, pct: Math.round(100 * p / (p + a)) }); mp += p; ma += a; }
      });
      if (mp + ma) monthPct.push({ m, pct: Math.round(100 * mp / (mp + ma)) });
    });
    const curM = monthPct.length ? monthPct[monthPct.length - 1] : null, prevM = monthPct.length > 1 ? monthPct[monthPct.length - 2] : null;

    // vazifalar: haftalik bajarilish (Baholar bilan bir xil qoida: >=3 o'quvchida natija bor ustun; bo'sh yoki 0 = bajarilmagan)
    const wk = {};
    cols.filter(c => c.counts && c.d).forEach(c => {
      const w = monday(c.d).getTime(), W = wk[w] = wk[w] || { d: new Date(w), due: 0, done: 0, n: 0 };
      W.n++; studs.forEach(s => { if (!due(s, c)) return; W.due++; if ((num(s.r[c.i]) || 0) > 0) W.done++; });
    });
    const weeks = Object.values(wk).filter(w => w.due).sort((a, b) => a.d - b.d).slice(-8).map(w => Object.assign(w, { pct: Math.round(100 * w.done / w.due) }));
    const now = new Date(), m0 = new Date(now.getFullYear(), now.getMonth(), 1);
    let md = 0, mdn = 0; cols.filter(c => c.counts && c.d && c.d >= m0).forEach(c => studs.forEach(s => { if (!due(s, c)) return; md++; if ((num(s.r[c.i]) || 0) > 0) mdn++; }));
    const hwMonth = md ? Math.round(100 * mdn / md) : null;
    const ps = studs.filter(s => s.pct != null), hwAll = ps.length ? Math.round(avg(ps.map(s => s.pct))) : null;

    // error log sifati (/100): shu oy topshirilganlari
    const logC = cols.filter(c => c.counts && c.scale === 100 && /error log/i.test(c.name));
    const logM = []; logC.filter(c => c.d && c.d >= m0).forEach(c => studs.forEach(s => { const v = val(s, c); if (v != null) logM.push(v); }));
    const logAvg = logM.length ? Math.round(avg(logM)) : null;
    const logPts = logC.slice(-10).map(c => { const v = studs.map(s => val(s, c)).filter(v => v != null); return { c, v: v.length ? Math.round(avg(v)) : null, n: v.length }; }).filter(p => p.v != null);

    // skill bo'yicha guruh o'rtachasi (har bir topshiriq)
    const sk = SKL.map(S => {
      const cs = cols.filter(c => c.sk === S.k && !c.summer && c.counts && c.scale === S.sc);
      const pts = cs.map(c => { const v = studs.map(s => val(s, c)).filter(v => v != null); return { c, v: v.length ? (S.sc === 9 ? Math.round(avg(v) * 100) / 100 : r1(avg(v))) : null, n: v.length }; }).filter(p => p.v != null).slice(-10);
      const last3 = avg(pts.slice(-3).map(p => p.v)), prev3 = pts.length >= 6 ? avg(pts.slice(-6, -3).map(p => p.v)) : null;
      return Object.assign({}, S, { pts, last3, delta: last3 != null && prev3 != null ? last3 - prev3 : null });
    });

    // kartochkalar (shu guruh)
    const chat = String(((T().groups || {})[T().group()] || {}).chat || "");
    const kl = kk ? kk.list.filter(x => !chat || x.chat === chat) : [];
    const kOf = {}; kl.forEach(x => kOf[norm(x.name)] = x);
    const why = {};
    kl.forEach(x => (x.items || []).forEach(it => {
      const w = it.why || "", t = /darsga kelmadi/i.test(w) ? "Darsga kelmadi" : /error log/i.test(w) ? "Error log yozilmadi / chala" : /kechik/i.test(w) ? "Vazifa kechikdi" :
        /bir qismi|paketi/i.test(w) ? "Vazifaning bir qismi yo'q" : /topshirilmadi/i.test(w) ? "Vazifa topshirilmadi" : it.hand ? "Ustoz qo'ygan" : "Boshqa";
      const w0 = why[t] = why[t] || { r: 0, y: 0 }; w0[it.c === "r" ? "r" : "y"]++;
    }));

    // har bir o'quvchi
    const rows = studs.map(s => {
      const n = norm(s.name), A = att[n], ka = kOf[n] || null;
      const per = {};
      SKL.forEach(S => {
        const v = cols.filter(c => c.sk === S.k && !c.summer && c.scale === S.sc).map(c => val(s, c)).filter(v => v != null);
        const l3 = avg(v.slice(-3)), p3 = v.length >= 6 ? avg(v.slice(-6, -3)) : null;
        per[S.k] = { raw: l3 != null ? (S.sc === 9 ? half(l3) : r1(l3)) : null, band: l3 == null ? null : S.sc === 40 ? band40(l3, S.k) : half(l3), d: l3 != null && p3 != null ? l3 - p3 : null };
      });
      const bs = SKL.map(S => per[S.k].band).filter(v => v != null);
      const band = bs.length >= 3 ? half(avg(bs)) : null;
      const lg = logC.map(c => val(s, c)).filter(v => v != null).slice(-3);
      const mAtt = A && curM ? ((A.mp[curM.m] || 0) + (A.ma[curM.m] || 0) ? Math.round(100 * (A.mp[curM.m] || 0) / ((A.mp[curM.m] || 0) + (A.ma[curM.m] || 0))) : null) : null;
      const allAtt = A && A.p + A.a ? Math.round(100 * A.p / (A.p + A.a)) : null;
      const o = { name: s.name, pct: s.pct, att: mAtt != null ? mAtt : allAtt, per, band, log: lg.length ? Math.round(avg(lg)) : null, red: ka ? ka.red : 0, yel: ka ? ka.yel : 0, level: ka ? ka.level : "ok" };
      const why = [];
      if (o.pct != null && o.pct < 70) why.push(["Vazifa " + o.pct + "%", 3]);
      if (o.att != null && o.att < 75) why.push(["Davomat " + o.att + "%", 2]);
      if (o.red >= 2) why.push(["🟥 " + o.red + " / " + (kk ? kk.limit : 4), o.red >= 3 ? 3 : 2]);
      if (o.log != null && o.log < 60) why.push(["Error log " + o.log, 1]);
      ["listening", "reading"].forEach(k => { const d = per[k].d; if (d != null && d <= -4) why.push([(k === "listening" ? "Listening" : "Reading") + " ↓" + Math.round(-d), 1]); });
      o.why = why; o.risk = why.reduce((a, w) => a + w[1], 0);
      return o;
    });
    const bandDist = {}; rows.forEach(o => { if (o.band == null) return; const b = o.band <= 4.5 ? "≤4.5" : o.band >= 7 ? "7+" : String(o.band.toFixed(1)); bandDist[b] = (bandDist[b] || 0) + 1; });

    return { rows, days: days.slice(-13), monthPct, curM, prevM, weeks, hwMonth, hwAll, logAvg, logPts, sk, kl, why, bandDist,
      red: kl.reduce((a, x) => a + x.red, 0), yel: kl.reduce((a, x) => a + x.yel, 0), warnN: kl.filter(x => x.level !== "ok").length };
  }
  let _data = null; const CC_data = () => _data;

  // ---------- grafiklar (SVG, kutubxonasiz) ----------
  function line(pts, o) {   // pts: [{v, tip, lab}] ; o: {min, max, col, fmt, H}
    const W = o.W || 320, H = o.H || 120, pl = 30, pr = 10, pt = 12, pb = 22, n = pts.length;
    if (!n) return `<div class="hm-empty">Hali natija yo'q</div>`;
    const x = i => n === 1 ? (pl + W - pr) / 2 : pl + i * (W - pl - pr) / (n - 1), y = v => pt + (1 - (Math.max(o.min, Math.min(o.max, v)) - o.min) / (o.max - o.min)) * (H - pt - pb);
    const grid = o.ticks.map(t => `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}" class="hm-grid"/><text x="${pl - 6}" y="${y(t) + 3.5}" class="hm-ax" text-anchor="end">${t}</text>`).join("");
    const P = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const lab = pts.map((p, i) => (i === 0 || i === n - 1 || n <= 5) && p.lab ? `<text x="${x(i)}" y="${H - 6}" class="hm-ax" text-anchor="${i === 0 && n > 1 ? "start" : i === n - 1 && n > 1 ? "end" : "middle"}">${esc(p.lab)}</text>` : "").join("");
    const last = pts[n - 1];
    return `<svg class="hm-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${grid}
      <polyline points="${P}" fill="none" stroke="${o.col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="${i === n - 1 ? 4.5 : 3}" fill="${i === n - 1 ? o.col : "var(--hm-card)"}" stroke="${o.col}" stroke-width="2"/>`).join("")}
      <text x="${Math.min(x(n - 1), W - pr)}" y="${y(last.v) - 9}" class="hm-dl" text-anchor="end">${esc(o.fmt(last.v))}</text>
      ${pts.map((p, i) => `<rect x="${x(i) - (W - pl - pr) / Math.max(1, n - 1) / 2}" y="0" width="${(W - pl - pr) / Math.max(1, n - 1)}" height="${H}" fill="transparent" data-tip="${esc(p.tip)}"/>`).join("")}${lab}</svg>`;
  }
  function bars(items, o) {   // items: [{v, lab, tip}] ; o: {max, col, ref, fmt, H}
    const W = o.W || 320, H = o.H || 140, pl = 30, pr = 6, pt = 14, pb = 22, n = items.length;
    if (!n) return `<div class="hm-empty">Hali ma'lumot yo'q</div>`;
    const bw = (W - pl - pr) / n, gap = Math.min(8, bw * .3), y = v => pt + (1 - v / o.max) * (H - pt - pb), base = y(0);
    const grid = o.ticks.map(t => `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}" class="hm-grid"/><text x="${pl - 6}" y="${y(t) + 3.5}" class="hm-ax" text-anchor="end">${t}${o.unit || ""}</text>`).join("");
    const refL = o.ref != null ? `<line x1="${pl}" x2="${W - pr}" y1="${y(o.ref)}" y2="${y(o.ref)}" class="hm-ref"/>` : "";
    const B = items.map((it, i) => {
      const x0 = pl + i * bw + gap / 2, w = bw - gap, yy = y(Math.max(0, it.v)), r = Math.min(4, w / 2, base - yy);
      const d = `M${x0},${base}V${yy + r}Q${x0},${yy} ${x0 + r},${yy}H${x0 + w - r}Q${x0 + w},${yy} ${x0 + w},${yy + r}V${base}Z`;
      const step = Math.ceil(46 / bw), lab = ((n - 1 - i) % step === 0) ? `<text x="${x0 + w / 2}" y="${H - 6}" class="hm-ax" text-anchor="middle">${esc(it.lab)}</text>` : "";
      const dl = (o.allDl ? it.v > 0 : i === n - 1 || it.low) ? `<text x="${x0 + w / 2}" y="${yy - 4}" class="hm-dl" text-anchor="middle">${esc(o.fmt(it.v))}</text>` : "";
      return `<path d="${d}" fill="${it.low && o.lowCol ? o.lowCol : o.col}"/>${dl}${lab}<rect x="${pl + i * bw}" y="0" width="${bw}" height="${H}" fill="transparent" data-tip="${esc(it.tip)}"/>`;
    }).join("");
    return `<svg class="hm-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${grid}${refL}${B}<line x1="${pl}" x2="${W - pr}" y1="${base}" y2="${base}" class="hm-base"/></svg>`;
  }
  const hbar = (items, max, col) => items.length ? items.map(it => `<div class="hm-hb" data-tip="${esc(it.tip || "")}"><span class="hm-hb-l">${esc(it.lab)}</span><span class="hm-hb-t"><i style="width:${Math.max(2, 100 * it.v / max)}%;background:${col}"></i></span><b>${esc(it.txt != null ? it.txt : it.v)}</b></div>`).join("") : `<div class="hm-empty">Hali ma'lumot yo'q</div>`;

  // ---------- chizish ----------
  let charts = [];
  const ph = f => { charts.push(f); return `<div class="hm-chart" data-ci="${charts.length - 1}"></div>`; };
  function fill() { document.querySelectorAll("#hmBox .hm-chart").forEach(el => { const f = charts[+el.dataset.ci]; if (f) el.innerHTML = f(Math.max(200, Math.floor(el.clientWidth))); }); }
  let rzT = null; window.addEventListener("resize", () => { clearTimeout(rzT); rzT = setTimeout(() => { if ($("hmBox") && $("hmBox").offsetParent) fill(); }, 150); });
  function draw() {
    charts = [];
    const box = $("hmBox"); if (!box) return;
    const g = T().group(), gname = (T().groups[g] || {}).name || "";
    $("hmGroup").textContent = "· " + gname;
    if (busy && !_data) { box.innerHTML = `<div class="hm-load"><i class="at-sp"></i>Course va kartochkalar o'qilmoqda…</div>`; return; }
    if (err && !_data) { box.innerHTML = `<div class="msg">⚠️ ${esc(err)}</div>`; return; }
    if (!_data) { box.innerHTML = ""; return; }
    const D = compute();
    if (!D) {
      box.innerHTML = `<div class="hm-none"><b>${esc(gname)}</b> guruhining Course jadvalida bloki yo'q — bosh sahifa asosiy guruhlar uchun.<div class="row" style="gap:8px;margin-top:12px">${Object.keys(T().groups).filter(k => ((_data.groups || {})[k] || {}).course).map(k => `<button class="btn btn-secondary btn-sm" data-hmg="${esc(k)}">${esc(T().groups[k].name)}</button>`).join("")}</div></div>`;
      box.querySelectorAll("[data-hmg]").forEach(b => b.onclick = () => { const s = document.querySelector(`#grpSeg button[data-g="${b.dataset.hmg}"]`); if (s) s.click(); });
      return;
    }
    $("hmAt").textContent = "Course · " + new Date(_data.at).toLocaleTimeString("uz-UZ", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit" });
    const R = D.rows, nM = D.curM ? OYN[MI(D.curM.m)] : "";
    const dl = (v, u, inv) => v == null || Math.abs(v) < .05 ? "" : `<span class="hm-d ${v > 0 ? "up" : "dn"}">${v > 0 ? "▲" : "▼"} ${Math.abs(Math.round(v * 10) / 10)}${u || ""}</span>`;

    const kpi = [
      ["O'quvchilar", R.length, "faol, guruhda", ""],
      ["Davomat · " + nM, D.curM ? D.curM.pct + "%" : "—", D.prevM ? dl(D.curM.pct - D.prevM.pct, "%") + ` <span>${OYN[MI(D.prevM.m)]}: ${D.prevM.pct}%</span>` : "", D.curM && D.curM.pct < 80 ? "bad" : ""],
      ["Vazifa bajarilishi · " + nM, D.hwMonth != null ? D.hwMonth + "%" : "—", D.hwAll != null ? `<span>kurs boshidan: ${D.hwAll}%</span>` : "", D.hwMonth != null && D.hwMonth < 75 ? "bad" : ""],
      ["Error log sifati · " + nM, D.logAvg != null ? D.logAvg + "<small>/100</small>" : "—", `<span>topshirilgan loglar o'rtachasi</span>`, ""],
      ["Kartochkalar", kk ? `🟥 ${D.red}<small> · 🟨 ${D.yel}</small>` : "—", kk ? `<span>${D.warnN} o'quvchi ogohlantirishda</span>` : "", D.warnN ? "bad" : ""]];

    const skCards = D.sk.map(S => {
      const big = S.last3 == null ? "—" : S.sc === 40 ? r1(S.last3) + "<small>/40</small>" : (Math.round(S.last3 * 10) / 10) + "<small> band</small>";
      const sub = S.last3 == null ? "" : S.sc === 40 ? `≈ band ${band40(S.last3, S.k)}` : "";
      return `<div class="card hm-card hm-sk"><div class="hm-sk-h"><span class="hm-dot" style="background:${S.col}"></span><b>${S.ic} ${S.n}</b></div>
        <div class="hm-big">${big} ${dl(S.delta, "")}</div><div class="hm-sub">oxirgi 3 topshiriq o'rtachasi${sub ? " · " + sub : ""}</div>
        ${ph(W => line(S.pts.map(p => ({ v: p.v, lab: p.c.d ? ddm(p.c.d) : "", tip: `${p.c.name}${p.c.d ? " · " + ddm(p.c.d) : ""}\nGuruh o'rtachasi: ${S.sc === 9 ? Math.round(p.v * 10) / 10 : p.v}${S.sc === 40 ? "/40 (≈ " + band40(p.v, S.k) + ")" : ""} · ${p.n} o'quvchi` })),
          S.sc === 40 ? Object.assign({ min: 0, max: 40, ticks: [0, 20, 40], col: S.col, fmt: v => r1(v) }, { W }) : Object.assign({ min: 3, max: 8, ticks: [4, 6, 8], col: S.col, fmt: v => Math.round(v * 10) / 10 }, { W })))}</div>`;
    }).join("");

    const attC = ph(W => bars(D.days.map(d => ({ v: d.pct, low: d.pct < 75, lab: ddm(d.d), tip: `${ddm(d.d)} · ${d.pct}%\nKeldi ${d.p}${d.k ? " (kechikdi " + d.k + ")" : ""} · Kelmadi ${d.a}${d.s ? " · Sababli " + d.s : ""}` })),
      { W, max: 100, ticks: [0, 50, 100], unit: "%", col: ACC, lowCol: "#F2A27A", ref: 80, fmt: v => v + "%" }));
    const hwC = ph(W => bars(D.weeks.map(w => ({ v: w.pct, low: w.pct < 75, lab: ddm(w.d), tip: `${ddm(w.d)} haftasi · ${w.pct}%\n${w.done} / ${w.due} bajarildi · ${w.n} ta topshiriq` })),
      { W, max: 100, ticks: [0, 50, 100], unit: "%", col: ACC, lowCol: "#F2A27A", ref: 80, fmt: v => v + "%" }));
    const logC = ph(W => line(D.logPts.map(p => ({ v: p.v, lab: p.c.d ? ddm(p.c.d) : "", tip: `${p.c.name}${p.c.d ? " · " + ddm(p.c.d) : ""}\nO'rtacha ${p.v}/100 · ${p.n} o'quvchi` })), { W, min: 0, max: 100, ticks: [0, 50, 100], col: ACC, fmt: v => v }));

    const BO = ["≤4.5", "5.0", "5.5", "6.0", "6.5", "7+"], bMax = Math.max(1, ...BO.map(b => D.bandDist[b] || 0));
    const bandC = ph(W => bars(BO.map(b => ({ v: D.bandDist[b] || 0, lab: b, tip: `Taxminiy ${b}: ${D.bandDist[b] || 0} o'quvchi\n${R.filter(o => o.band != null && (b === "≤4.5" ? o.band <= 4.5 : b === "7+" ? o.band >= 7 : o.band.toFixed(1) === b)).map(o => o.name).join(", ")}` })),
      { W, max: bMax, ticks: [0, bMax], col: "#6250d6", fmt: v => v, H: 150, allDl: true }));
    const whyL = Object.entries(D.why).map(([k, v]) => ({ lab: k, v: v.r + v.y, txt: v.r + v.y, tip: `${k}: ${v.r + v.y} ta kartochka\n🟥 qizil ${v.r} · 🟨 sariq ${v.y}` })).sort((a, b) => b.v - a.v);

    const top = R.filter(o => o.band != null).sort((a, b) => b.band - a.band || (b.pct || 0) - (a.pct || 0)).slice(0, 5);
    const risk = R.filter(o => o.risk >= 2).sort((a, b) => b.risk - a.risk || (a.pct || 0) - (b.pct || 0)).slice(0, 8);
    const who = (o, right) => `<div class="hm-p" data-nm="${esc(o.name)}"><span class="hm-av">${esc(o.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2))}</span><span class="hm-pn"><b>${esc(o.name)}</b>${right}</span></div>`;

    const SC = { name: o => o.name, att: o => o.att, pct: o => o.pct, listening: o => o.per.listening.raw, reading: o => o.per.reading.raw, writing: o => o.per.writing.raw, speaking: o => o.per.speaking.raw, log: o => o.log, band: o => o.band, red: o => o.red + o.yel / 10 };
    const srt = R.slice().sort((a, b) => { const x = SC[sortK](a), y = SC[sortK](b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (x < y ? -1 : x > y ? 1 : 0) * sortD; });
    const lv = (v, sc) => v == null ? "" : (sc === 40 ? v / 40 * 100 : sc === 9 ? (v >= 6.5 ? 80 : v >= 5.5 ? 60 : 30) : v) >= 75 ? "hi" : (sc === 40 ? v / 40 * 100 : sc === 9 ? (v >= 6.5 ? 80 : v >= 5.5 ? 60 : 30) : v) >= 50 ? "mid" : "lo";
    const cell = (v, sc, d) => v == null ? '<td class="hm-c"><span class="muted">—</span></td>' : `<td class="hm-c"><i class="v-p v-${lv(v, sc)}">${v}</i>${d != null && Math.abs(d) >= (sc === 40 ? 3 : .5) ? `<span class="hm-ar ${d > 0 ? "up" : "dn"}">${d > 0 ? "▲" : "▼"}</span>` : ""}</td>`;
    const th = (k, t) => `<th data-sk="${k}" class="${sortK === k ? "on" : ""}">${t}${sortK === k ? (sortD > 0 ? " ▲" : " ▼") : ""}</th>`;

    box.innerHTML = `
      <div class="hm-kpis">${kpi.map(k => `<div class="hm-kpi ${k[3]}"><span class="hm-kl">${esc(k[0])}</span><b>${k[1]}</b><span class="hm-ks">${k[2]}</span></div>`).join("")}</div>
      <div class="hm-grid4">${skCards}</div>
      <div class="hm-grid3">
        <div class="card hm-card"><div class="hm-ch"><b>📅 Davomat — har dars</b><span class="hm-sub">oxirgi ${D.days.length} dars · och rang = 75% dan past</span></div>${attC}</div>
        <div class="card hm-card"><div class="hm-ch"><b>🏠 Vazifalar — haftalik bajarilish</b><span class="hm-sub">och rang = 75% dan past</span></div>${hwC}</div>
        <div class="card hm-card"><div class="hm-ch"><b>📝 Error log sifati</b><span class="hm-sub">har bir log, guruh o'rtachasi /100</span></div>${logC}</div>
      </div>
      <div class="hm-grid2">
        <div class="card hm-card"><div class="hm-ch"><b>🎯 Taxminiy band taqsimoti</b><span class="hm-sub">faqat ustoz uchun · L/R/W/S oxirgi 3 natija</span></div>${bandC}</div>
        <div class="card hm-card"><div class="hm-ch"><b>🟥 Kartochka sabablari</b><span class="hm-sub">soni</span><span class="hm-sub">${kk && kk.at ? "hisoblandi " + new Date(kk.at).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : ""}</span></div>${hbar(whyL, Math.max(1, ...whyL.map(x => x.v)), "#d23a3f")}</div>
      </div>
      <div class="hm-grid2">
        <div class="card hm-card"><div class="hm-ch"><b>🏆 Eng yaxshi natijalar</b><span class="hm-sub">taxminiy band bo'yicha</span></div>
          ${top.length ? top.map((o, i) => who(o, `<span class="hm-mini">${["🥇", "🥈", "🥉", "4.", "5."][i]} vazifa ${o.pct != null ? o.pct + "%" : "—"} · davomat ${o.att != null ? o.att + "%" : "—"}</span><b class="hm-bd">${o.band.toFixed(1)}</b>`)).join("") : '<div class="hm-empty">Hali yetarli natija yo\'q</div>'}</div>
        <div class="card hm-card"><div class="hm-ch"><b>⚠️ E'tibor kerak</b><span class="hm-sub">vazifa &lt;70%, davomat &lt;75%, 🟥 2+, pasayish</span></div>
          ${risk.length ? risk.map(o => who(o, `<span class="hm-tags">${o.why.map(w => `<span class="hm-tag bad">${esc(w[0])}</span>`).join("")}</span>`)).join("") : '<div class="hm-empty">Hamma yaxshi ketyapti 👏</div>'}</div>
      </div>
      <div class="card hm-card"><div class="hm-ch"><b>👥 Barcha o'quvchilar</b><span class="hm-sub">ustun nomini bosing — saralash; ism — Baholardagi tarixi</span></div>
        <div class="tbl-wrap"><table class="hm-tbl"><thead><tr>${th("name", "O'quvchi")}${th("att", "Davomat")}${th("pct", "Vazifa")}${th("listening", "🎧 L /40")}${th("reading", "📖 R /40")}${th("writing", "✍️ W")}${th("speaking", "🎙 S")}${th("log", "Log")}${th("band", "Taxminiy")}${th("red", "Kartochka")}</tr></thead>
        <tbody>${srt.map(o => `<tr><td><a class="hm-nm" data-nm="${esc(o.name)}">${esc(o.name)}</a></td>
          <td class="hm-c">${o.att != null ? `<span class="hm-pc ${o.att < 75 ? "lo" : o.att < 85 ? "mid" : "hi"}">${o.att}%</span>` : '<span class="muted">—</span>'}</td>
          <td class="hm-c">${o.pct != null ? `<span class="hm-pc ${o.pct < 70 ? "lo" : o.pct < 85 ? "mid" : "hi"}">${o.pct}%</span>` : '<span class="muted">—</span>'}</td>
          ${cell(o.per.listening.raw, 40, o.per.listening.d)}${cell(o.per.reading.raw, 40, o.per.reading.d)}${cell(o.per.writing.raw, 9, o.per.writing.d)}${cell(o.per.speaking.raw, 9, o.per.speaking.d)}${cell(o.log, 100)}
          <td class="hm-c">${o.band != null ? `<b class="hm-bd sm">${o.band.toFixed(1)}</b>` : '<span class="muted">—</span>'}</td>
          <td class="hm-c">${o.red ? "🟥" + o.red : ""}${o.yel ? " 🟨" + o.yel : ""}${!o.red && !o.yel ? '<span class="muted">—</span>' : ""}</td></tr>`).join("")}</tbody></table></div>
        <div class="hm-note">L/R — oxirgi 3 natija o'rtachasi (/40), W/S — band; ▲▼ — oldingi 3 tasiga nisbatan. Taxminiy band = 4 skill bandlarining o'rtachasi (kamida 3 skill bo'lsa). Davomat — joriy oy (sababli hisobga kirmaydi).</div></div>`;
    fill();
    box.querySelectorAll("th[data-sk]").forEach(t => t.onclick = () => { const k = t.dataset.sk; if (sortK === k) sortD = -sortD; else { sortK = k; sortD = k === "name" ? 1 : -1; } draw(); });
    box.querySelectorAll("[data-nm]").forEach(a => a.onclick = () => C().open(a.dataset.nm));
  }
  const MI = m => ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].indexOf(String(m).toLowerCase().trim());

  // ---------- yuklash ----------
  function load(force) {
    if (busy || !T() || !T().verified() || !C()) return;
    busy = true; err = ""; draw();
    const kP = T().api({ admin: "kk_get" }).then(r => { if (r && r.ok) kk = r; }).catch(() => {});
    C().load(force).then(d => kP.then(() => { _data = d; busy = false; draw(); }))
      .catch(e => { busy = false; err = e.message || String(e); draw(); });
  }
  // tooltip
  let tip = null;
  function tipOn(e) {
    const t = e.target.closest && e.target.closest("#hmBox [data-tip]");
    if (!tip) { tip = document.createElement("div"); tip.className = "hm-tip"; document.body.appendChild(tip); }
    if (!t || !t.dataset.tip) { tip.style.display = "none"; return; }
    tip.innerHTML = esc(t.dataset.tip).replace(/\n/g, "<br>"); tip.style.display = "block";
    const x = Math.min(window.innerWidth - tip.offsetWidth - 8, e.clientX + 12), y = e.clientY - tip.offsetHeight - 12;
    tip.style.left = Math.max(8, x) + "px"; tip.style.top = (y < 8 ? e.clientY + 18 : y) + "px";
  }
  document.addEventListener("mousemove", tipOn);
  document.addEventListener("touchstart", e => tipOn(e.touches[0] ? Object.assign({}, { target: e.target, clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }) : e), { passive: true });

  window.addEventListener("cls-tab", e => { if (e.detail === "home") { if (!_data) load(false); else draw(); } });
  window.addEventListener("cls-group", () => { if (_data) draw(); else if ($("hmBox")) draw(); });
  document.addEventListener("click", e => { if (e.target && e.target.closest && e.target.closest("#hmReload")) load(true); });
})();
