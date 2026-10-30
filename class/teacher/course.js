// Kurs bo'limlari: Yo'qlama (davomat + hisob-kitob) va Baholar (ASSESSMENT).
// Manba: Google Sheet "Course" (Mac'dagi Course.xlsx bilan sinxron). Sahifa faqat o'qiydi, jadval o'zgarmaydi.
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const OY = { january: "Yanvar", february: "Fevral", march: "Mart", april: "Aprel", may: "May", june: "Iyun", july: "Iyul", august: "Avgust",
    september: "Sentabr", october: "Oktabr", november: "Noyabr", december: "Dekabr" };
  const OYQ = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
  const SK = { listening: "🎧", reading: "📖", writing: "✍️", speaking: "🎙" };
  let data = null, loading = null, month = null, skill = "all", summer = false, pick = null;
  try { month = localStorage.getItem("cls_c_month"); skill = localStorage.getItem("cls_c_skill") || "all"; } catch (e) {}

  const T = () => window.CLS_TP;   // asosiy skript beradi: api, group(), groups
  const norm = s => String(s || "").toLowerCase().replace(/[‘’ʻʼ`']/g, "'").replace(/\s+/g, " ").trim();
  const dOf = s => { const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(s).trim()); return m ? new Date(+m[3], m[2] - 1, +m[1]) : null; };
  const num = v => { const s = String(v == null ? "" : v).trim().replace(",", "."); return s === "" || isNaN(+s) ? null : +s; };
  const money = s => +(String(s || "").replace(/[^\d]/g, "")) || 0;
  const fmtMoney = n => n.toLocaleString("en-US") + " so'm";

  // ---------- yuklash ----------
  function load(force) {
    if (data && !force) return Promise.resolve(data);
    if (loading) return loading;
    ["atMsg", "bhMsg"].forEach(i => $(i).textContent = "Course jadvalidan o'qilmoqda…");
    loading = T().api({ admin: "course_get" }).then(r => {
      loading = null;
      if (!r.ok) throw new Error(r.error);
      data = r; ["atMsg", "bhMsg"].forEach(i => $(i).textContent = ""); return r;
    }).catch(e => { loading = null; ["atMsg", "bhMsg"].forEach(i => $(i).textContent = "⚠️ " + e.message); throw e; });
    return loading;
  }
  function label() {
    const g = T().group(), gs = (data && data.groups) || {};
    return (gs[g] || {}).course || null;
  }
  // bitta guruh bloki: sarlavha qatorida "(MORNING GROUP)" bor; keyin ustunlar, "Kunlar:"/"Topshiriqlar:" va o'quvchilar
  function block(vals, lbl) {
    const L = norm(lbl);
    const t = vals.findIndex(r => r && norm(r[0]).includes(L));
    if (t < 0) return null;
    let h = t + 1; while (h < vals.length && !/ism/i.test((vals[h] || [])[1] || "")) h++;
    if (h >= vals.length) return null;
    const head = vals[h], sub = vals[h + 1] || [], rows = []; let tot = null;
    for (let i = h + 2; i < vals.length; i++) {
      const r = vals[i] || [];
      if (/JAMI/i.test(r[0] || "")) { tot = r; break; }
      if (!/^\d+$/.test(String(r[0] || "").trim()) || !String(r[1] || "").trim()) break;
      rows.push(r);
    }
    return { head, sub, rows, tot };
  }
  const months = () => (data.order || Object.keys(data.sheets)).filter(n => n !== "ASSESSMENT" && OY[norm(n)]);

  // ---------- YO'QLAMA ----------
  function drawAt() {
    const g = T().group(), gname = T().groups[g].name;
    $("atGroup").textContent = "· " + gname;
    if (!data) return;
    const ms = months();
    if (!ms.includes(month)) month = ms.find(n => norm(n) === Object.keys(OY)[new Date().getMonth()]) || ms[ms.length - 1];
    $("atMonths").innerHTML = ms.map(n => `<button data-m="${esc(n)}" class="${n === month ? "active" : ""}">${OY[norm(n)]}</button>`).join("");
    $("atMonths").querySelectorAll("button").forEach(b => b.onclick = () => { month = b.dataset.m; try { localStorage.setItem("cls_c_month", month); } catch (e) {} drawAt(); });
    $("atAt").textContent = "Course · " + new Date(data.at).toTimeString().slice(0, 5);
    const lbl = label(), B = lbl && block(data.sheets[month] || [], lbl);
    $("atBody").classList.toggle("hide", !B); $("atMoneyCard").classList.toggle("hide", !B);
    if (!B) { $("atMsg").textContent = lbl ? `${OY[norm(month)]} varag'ida "${lbl}" bloki topilmadi.` : `${gname} guruhining Course jadvalida bloki yo'q.`; return; }
    $("atMsg").textContent = "";
    const H = B.head, ci = re => H.findIndex(x => re.test(x || ""));
    const dc = H.map((x, i) => dOf(x) ? i : -1).filter(i => i >= 0);
    const cK = ci(/Keldi/i), cM = ci(/Kelmadi/i), cP = ci(/Davomat/i), cD = ci(/To.lov kun/i), cS = ci(/O.quvchi to.lov/i), cT = ci(/O.qituvchi/i);
    // o'tilgan darslar: kamida bitta belgi qo'yilgan sana
    const held = dc.filter(i => B.rows.some(r => /^[+-]$/.test(String(r[i] || "").trim())));
    const last = held[held.length - 1];
    const pct = r => { const k = +r[cK] || 0, m = +r[cM] || 0; return k + m ? Math.round(100 * k / (k + m)) : null; };
    const low = B.rows.filter(r => { const p = pct(r); return p != null && p < 70; });
    const lastIn = last != null ? B.rows.filter(r => String(r[last]).trim() === "+").length : 0, lastAll = last != null ? B.rows.filter(r => /^[+-]$/.test(String(r[last]).trim())).length : 0;
    $("atStats").innerHTML = [
      ["O'rtacha davomat", B.tot && B.tot[cP] || "—", "c-big"],
      ["O'tilgan darslar", held.length + " / " + dc.length, ""],
      ["Oxirgi dars" + (last != null ? " · " + H[last].slice(0, 5) : ""), last != null ? `${lastIn} / ${lastAll}` : "—", ""],
      ["Davomati 70% dan past", low.length, low.length ? "c-bad" : ""]].map(s => `<div class="stat ${s[2]}"><b>${esc(s[1])}</b>${esc(s[0])}</div>`).join("");
    const wd = i => { const d = dOf(H[i]); return `<th class="c-d${i === last ? " c-last" : ""}"><b>${d.getDate()}</b><span>${esc(String(B.sub[i] || "").slice(0, 4))}</span></th>`; };
    $("atHead").innerHTML = `<tr><th class="c-n">#</th><th class="c-nm">O'quvchi</th>${dc.map(wd).join("")}<th class="c-r">Keldi</th><th class="c-r">Kelmadi</th><th class="c-pc">Davomat</th></tr>`;
    const mark = v => { v = String(v || "").trim(); return v === "+" ? '<i class="m-y">✓</i>' : v === "-" ? '<i class="m-n">✕</i>' : '<i class="m-0"></i>'; };
    const bar = p => p == null ? '<span class="muted">—</span>' : `<div class="c-bar ${p < 70 ? "lo" : p < 85 ? "mid" : "hi"}"><span style="width:${p}%"></span></div><b>${p}%</b>`;
    $("atTbody").innerHTML = B.rows.map(r => `<tr><td class="c-n">${esc(r[0])}</td><td class="c-nm">${esc(r[1])}</td>${dc.map(i => `<td class="c-d${i === last ? " c-last" : ""}">${mark(r[i])}</td>`).join("")}
      <td class="c-r">${esc(r[cK])}</td><td class="c-r">${esc(r[cM])}</td><td class="c-pc">${bar(pct(r))}</td></tr>`).join("");
    const perDay = i => { const n = B.rows.filter(r => String(r[i]).trim() === "+").length, a = B.rows.filter(r => /^[+-]$/.test(String(r[i]).trim())).length; return a ? `${n}<span>/${a}</span>` : ""; };
    $("atFoot").innerHTML = `<tr><td class="c-n"></td><td class="c-nm">Guruh bo'yicha jami</td>${dc.map(i => `<td class="c-d c-day${i === last ? " c-last" : ""}">${perDay(i)}</td>`).join("")}
      <td class="c-r">${esc(B.tot ? B.tot[cK] : "")}</td><td class="c-r">${esc(B.tot ? B.tot[cM] : "")}</td><td class="c-pc"><b>${esc(B.tot ? B.tot[cP] : "")}</b></td></tr>`;
    const w = $("atTbody").closest(".c-wrap"); requestAnimationFrame(() => { const c = w.querySelector("th.c-last"); if (c) w.scrollLeft = Math.max(0, c.offsetLeft + c.offsetWidth - w.clientWidth + 4); });   // oxirgi darslar ko'rinib tursin
    // hisob-kitob
    const vals = data.sheets[month], grand = vals.find(r => r && /UMUMIY JAMI/i.test(r[0] || ""));
    const sumS = B.tot ? money(B.tot[cS]) : B.rows.reduce((a, r) => a + money(r[cS]), 0), sumT = B.tot ? money(B.tot[cT]) : B.rows.reduce((a, r) => a + money(r[cT]), 0);
    $("mnStats").innerHTML = [
      ["O'quvchilar to'lovi · " + gname, fmtMoney(sumS)],
      ["O'qituvchi ulushi · 60%", fmtMoney(sumT)],
      ["To'lov kunlari", B.tot ? B.tot[cD] : ""],
      grand ? ["Ikkala guruh · o'qituvchiga", grand[cT] || ""] : null].filter(Boolean).map(s => `<div class="stat"><b>${esc(s[1])}</b>${esc(s[0])}</div>`).join("");
    $("mnHead").innerHTML = `<tr><th class="c-n">#</th><th class="c-nm">O'quvchi</th><th class="c-r">Kelgan</th><th class="c-r">To'lov kunlari</th><th class="c-r">O'quvchi to'lovi</th><th class="c-r">O'qituvchiga 60%</th></tr>
      <tr class="c-subh"><th></th><th></th><th></th><th class="c-r">${esc(B.sub[cD] || "")}</th><th class="c-r">${esc(B.sub[cS] || "")}</th><th class="c-r">${esc(B.sub[cT] || "")}</th></tr>`;
    $("mnBody").innerHTML = B.rows.map(r => `<tr><td class="c-n">${esc(r[0])}</td><td class="c-nm">${esc(r[1])}</td><td class="c-r">${esc(r[cK])}</td><td class="c-r">${esc(r[cD])}</td><td class="c-r c-m">${esc(r[cS])}</td><td class="c-r c-m">${esc(r[cT])}</td></tr>`).join("");
    $("mnFoot").innerHTML = (B.tot ? `<tr><td></td><td class="c-nm">Guruh bo'yicha jami</td><td class="c-r">${esc(B.tot[cK])}</td><td class="c-r">${esc(B.tot[cD])}</td><td class="c-r c-m">${esc(B.tot[cS])}</td><td class="c-r c-m">${esc(B.tot[cT])}</td></tr>` : "") +
      (grand ? `<tr class="c-grand"><td></td><td class="c-nm">🏆 Umumiy jami (ikkala guruh)</td><td></td><td class="c-r">${esc(grand[cD])}</td><td class="c-r c-m">${esc(grand[cS])}</td><td class="c-r c-m">${esc(grand[cT])}</td></tr>` : "");
  }
  function moneyShow(on) {
    $("atMoneyCard").classList.toggle("c-hidden", !on);
    $("mnEye").textContent = on ? "🙈 Yashirish" : "👁 Ko'rsatish";
    try { localStorage.setItem("cls_c_money", on ? "1" : ""); } catch (e) {}
  }

  // ---------- BAHOLAR ----------
  const skillOf = n => { const m = /^\s*(listening|reading|writing|speaking)/i.exec(n || ""); return m ? m[1].toLowerCase() : null; };
  const scaleOf = n => /out of 40|\/\s*40|cd mock|in-class/i.test(n) && !/error log/i.test(n) ? 40 : /^\s*writing/i.test(n) ? 9 : 100;
  const lvl = (v, s) => { const r = s === 40 ? v / 40 * 100 : s === 9 ? (v >= 7 ? 90 : v >= 6 ? 65 : 30) : v; return r >= 75 ? "hi" : r >= 50 ? "mid" : "lo"; };
  const short = n => String(n).replace(/\n/g, " + ").replace(/^Writing Task 2:?\s*/i, "W · ").replace(/^Listening\s*/i, "").replace(/^Reading\s*/i, "").replace(/^Speaking\s*/i, "")
    .replace(/ out of (40|100)/i, " /$1").replace(/error log/i, "error log").replace(/ Essay$/i, "").replace(/CD mock/i, "mock");
  // o'quvchi kursga qachon kelgan: oylik varaqlardagi birinchi belgi
  function starts(lbl) {
    const st = {};
    months().forEach(m => {
      const B = block(data.sheets[m] || [], lbl); if (!B) return;
      const dc = B.head.map((x, i) => dOf(x) ? i : -1).filter(i => i >= 0);
      B.rows.forEach(r => { const i = dc.find(i => /^[+-]$/.test(String(r[i] || "").trim())); if (i == null) return;
        const k = norm(r[1]), d = dOf(B.head[i]); if (!st[k] || d < st[k]) st[k] = d; });
    });
    return st;
  }
  function model() {
    const lbl = label(); if (!lbl) return null;
    const B = block(data.sheets.ASSESSMENT || [], lbl); if (!B) return null;
    const st = starts(lbl);
    let lastD = null; const cols = [];
    B.head.forEach((h, i) => { if (i < 2) return; const d = dOf(h); if (d) lastD = d; const name = String(B.sub[i] || "").trim(); if (!name) return;
      const sk = skillOf(name); cols.push({ i, name, d: d || lastD, sk, scale: scaleOf(name), summer: !sk || /daily total/i.test(name) }); });
    cols.forEach(c => { c.n = B.rows.filter(r => String(r[c.i] || "").trim() !== "").length; c.counts = c.n >= 3 && !c.summer; });
    const studs = B.rows.map(r => {
      const s = st[norm(r[1])] || (() => { const c = cols.find(c => !c.summer && String(r[c.i] || "").trim() !== ""); return c ? c.d : null; })();
      const due = cols.filter(c => c.counts && (!s || !c.d || c.d >= s)), done = due.filter(c => (num(r[c.i]) || 0) > 0);
      const w = cols.filter(c => c.sk === "writing" && !c.summer && (num(r[c.i]) || 0) > 0).map(c => num(r[c.i]));
      return { r, name: r[1], start: s, due, done, pct: due.length ? Math.round(100 * done.length / due.length) : null,
        wAvg: w.length ? Math.round(w.reduce((a, b) => a + b, 0) / w.length * 2) / 2 : null, wLast: w.length ? w[w.length - 1] : null };
    });
    return { B, cols, studs };
  }
  function drawBh() {
    const g = T().group(), gname = T().groups[g].name;
    $("bhGroup").textContent = "· " + gname;
    document.querySelectorAll("#bhSkills button").forEach(b => b.classList.toggle("active", b.dataset.s === skill));
    $("bhSummer").checked = summer;
    if (!data) return;
    $("bhAt").textContent = "Course · ASSESSMENT · " + new Date(data.at).toTimeString().slice(0, 5);
    const M = model();
    ["bhBody", "bhAttn"].forEach(i => $(i).classList.toggle("hide", !M));
    if (!M) { $("bhMsg").textContent = label() ? `ASSESSMENT varag'ida "${label()}" bloki topilmadi.` : `${gname} guruhining Course jadvalida bloki yo'q.`; $("bhDet").classList.add("hide"); return; }
    $("bhMsg").textContent = "";
    const { cols, studs } = M;
    const shown = cols.filter(c => (summer ? c.summer : !c.summer) && (skill === "all" || c.sk === skill || (skill === "reading" && /reading/i.test(c.name)))).reverse();   // yangisi chapda
    const ps = studs.filter(s => s.pct != null), avg = ps.length ? Math.round(ps.reduce((a, s) => a + s.pct, 0) / ps.length) : null;
    const lastOf = re => cols.filter(c => c.counts && re.test(c.name)).pop();
    const colAvg = c => { const v = studs.map(s => num(s.r[c.i])).filter(v => v != null && v > 0); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : null; };
    const lw = lastOf(/^\s*writing/i), ll = lastOf(/^\s*listening.*(out of 40|mock)/i), lr = lastOf(/^\s*reading.*out of 40/i);
    const attn = studs.filter(s => s.pct != null && s.pct < 70).sort((a, b) => a.pct - b.pct);
    $("bhStats").innerHTML = [
      ["Topshiriqlar bajarilishi", avg != null ? avg + "%" : "—", "c-big"],
      [lw ? "Oxirgi essay · o'rtacha band" : "Writing", lw ? colAvg(lw) : "—", ""],
      [ll ? "Oxirgi Listening · /40" : "Listening", ll ? colAvg(ll) : "—", ""],
      [lr ? "Oxirgi Reading · /40" : "Reading", lr ? colAvg(lr) : "—", ""],
      ["E'tibor kerak (<70%)", attn.length, attn.length ? "c-bad" : ""]].map(s => `<div class="stat ${s[2]}"><b>${esc(s[1])}</b>${esc(s[0])}</div>`).join("");
    const th = c => `<th class="c-t" title="${esc(c.name)}"><span class="c-sk">${SK[c.sk] || "☀️"}</span><b>${esc(short(c.name))}</b><span class="c-dt">${c.d ? c.d.getDate() + "-" + OYQ[c.d.getMonth()] : ""}</span></th>`;
    $("bhHead").innerHTML = `<tr><th class="c-n">#</th><th class="c-nm">O'quvchi</th><th class="c-pc">Bajarildi</th><th class="c-r">Writing<br><span class="c-dt">o'rtacha</span></th>${shown.map(th).join("")}</tr>`;
    const cell = (s, c) => {
      const raw = String(s.r[c.i] || "").trim(), v = num(raw);
      if (raw === "") return `<td class="c-v">${!s.start || !c.d || c.d >= s.start ? (c.counts ? '<i class="v-miss">—</i>' : "") : '<i class="v-na">·</i>'}</td>`;
      if (v == null) return `<td class="c-v"><i class="v-txt">${esc(raw)}</i></td>`;
      if (v === 0) return `<td class="c-v"><i class="v-p v-0">0</i></td>`;
      return `<td class="c-v"><i class="v-p v-${lvl(v, c.scale)}">${esc(raw)}</i></td>`;
    };
    const bar = p => p == null ? '<span class="muted">—</span>' : `<div class="c-bar ${p < 70 ? "lo" : p < 85 ? "mid" : "hi"}"><span style="width:${p}%"></span></div><b>${p}%</b>`;
    $("bhTbody").innerHTML = studs.map((s, k) => `<tr data-k="${k}" class="${pick === norm(s.name) ? "c-pick" : ""}"><td class="c-n">${esc(s.r[0])}</td><td class="c-nm"><a>${esc(s.name)}</a></td><td class="c-pc">${bar(s.pct)}</td>
      <td class="c-r">${s.wAvg != null ? `<i class="v-p v-${lvl(s.wAvg, 9)}">${s.wAvg}</i>` : '<span class="muted">—</span>'}</td>${shown.map(c => cell(s, c)).join("")}</tr>`).join("");
    $("bhFoot").innerHTML = `<tr><td></td><td class="c-nm">Guruh o'rtachasi</td><td class="c-pc"><b>${avg != null ? avg + "%" : ""}</b></td><td></td>${shown.map(c => { const a = colAvg(c);
      return `<td class="c-v c-day">${a != null ? a : ""}<span>${c.n}/${studs.length}</span></td>`; }).join("")}</tr>`;
    $("bhTbody").querySelectorAll("tr").forEach(tr => tr.onclick = () => { const s = studs[+tr.dataset.k]; pick = pick === norm(s.name) ? null : norm(s.name); drawBh(); });
    // e'tibor kerak
    $("bhAttnList").innerHTML = attn.length ? attn.map(s => { const miss = s.due.filter(c => !((num(s.r[c.i]) || 0) > 0)).slice(-3).reverse();
      return `<div class="c-att"><div><b>${esc(s.name)}</b><span class="muted">${s.done.length} / ${s.due.length} topshiriq</span></div><div class="c-bar lo"><span style="width:${s.pct}%"></span></div><b class="c-attp">${s.pct}%</b>
        <div class="c-miss">${miss.map(c => `<span>${SK[c.sk] || ""} ${esc(short(c.name))}</span>`).join("")}</div></div>`; }).join("")
      : '<div class="muted">Hamma o\'quvchi topshiriqlarning 70% dan ko\'pini bajargan. 👏</div>';
    // tanlangan o'quvchi
    const sel = studs.find(s => norm(s.name) === pick);
    $("bhDet").classList.toggle("hide", !sel);
    if (sel) {
      const groups = ["listening", "reading", "writing", "speaking"].map(k => {
        const cs = cols.filter(c => !c.summer && c.sk === k); if (!cs.length) return "";
        const vs = cs.map(c => ({ c, v: num(sel.r[c.i]), raw: String(sel.r[c.i] || "").trim() }));
        const pts = vs.filter(x => x.v != null && x.v > 0), sc = cs[cs.length - 1].scale;
        const spark = pts.length > 1 ? (() => { const W = 160, Hh = 36, mx = k === "writing" ? 9 : 100, mn = k === "writing" ? 4 : 0;
          const y = x => { const p = x.c.scale === 40 ? x.v / 40 * 100 : x.v; return Hh - 3 - (Math.max(mn, Math.min(mx, p)) - mn) / (mx - mn) * (Hh - 6); };
          const P = pts.map((x, i) => `${(3 + i * (W - 6) / (pts.length - 1)).toFixed(1)},${y(x).toFixed(1)}`);
          return `<svg class="c-spark" viewBox="0 0 ${W} ${Hh}"><polyline points="${P.join(" ")}"/>${P.map(p => `<circle cx="${p.split(",")[0]}" cy="${p.split(",")[1]}" r="2.6"/>`).join("")}</svg>`; })() : "";
        return `<div class="c-sk-row"><div class="c-sk-h">${SK[k]} <b>${k[0].toUpperCase() + k.slice(1)}</b>${spark}</div><div class="c-chips">${vs.map(x =>
          `<span class="c-chip" title="${esc(x.c.name)}"><em>${esc(short(x.c.name))}</em>${x.raw === "" ? '<i class="v-miss">—</i>' : x.v === 0 ? '<i class="v-p v-0">0</i>' : x.v == null ? esc(x.raw) : `<i class="v-p v-${lvl(x.v, x.c.scale)}">${esc(x.raw)}</i>`}</span>`).join("")}</div></div>`;
      }).join("");
      $("bhDet").innerHTML = `<div class="card-header"><h3 class="card-title">${esc(sel.name)} <small>${sel.start ? "kursda " + [sel.start.getDate(), sel.start.getMonth() + 1].map(x => String(x).padStart(2, "0")).join(".") + "." + sel.start.getFullYear() + " dan" : ""}</small></h3>
        <div class="stats" style="margin:0"><div class="stat"><b>${sel.pct != null ? sel.pct + "%" : "—"}</b>bajarildi</div><div class="stat"><b>${sel.wLast != null ? sel.wLast : "—"}</b>oxirgi essay</div></div>
        <button class="btn btn-secondary btn-sm" id="bhDetX">✕ Yopish</button></div>${groups}`;
      $("bhDetX").onclick = () => { pick = null; drawBh(); };
    }
  }

  // ---------- ulash ----------
  function show(t) {
    if (t !== "attend" && t !== "grades") return;
    if (!T().verified()) return;
    load(false).then(() => t === "attend" ? drawAt() : drawBh()).catch(() => {});
  }
  window.addEventListener("cls-tab", e => show(e.detail));
  window.addEventListener("cls-group", () => { pick = null; if (data) { drawAt(); drawBh(); } else { drawAt(); drawBh(); } });
  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") init();
  let inited = false;
  function init() {
    if (inited || !$("atReload")) return; inited = true;
    $("atReload").onclick = () => load(true).then(drawAt).catch(() => {});
    $("bhReload").onclick = () => load(true).then(drawBh).catch(() => {});
    $("mnEye").onclick = () => moneyShow($("atMoneyCard").classList.contains("c-hidden"));
    let mon = false; try { mon = localStorage.getItem("cls_c_money") === "1"; } catch (e) {}
    moneyShow(mon);
    document.querySelectorAll("#bhSkills button").forEach(b => b.onclick = () => { skill = b.dataset.s; try { localStorage.setItem("cls_c_skill", skill); } catch (e) {} drawBh(); });
    $("bhSummer").onchange = () => { summer = $("bhSummer").checked; drawBh(); };
  }
})();
