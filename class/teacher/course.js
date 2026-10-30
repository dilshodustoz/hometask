// Kurs bo'limlari: Yo'qlama (davomat + hisob-kitob) va Baholar (ASSESSMENT).
// Manba: Google Sheet "Course" (yagona manba; har kuni Drive "Hometask/Course zaxira" ga .xlsx nusxa olinadi).
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const OY = { january: "Yanvar", february: "Fevral", march: "Mart", april: "Aprel", may: "May", june: "Iyun", july: "Iyul", august: "Avgust",
    september: "Sentabr", october: "Oktabr", november: "Noyabr", december: "Dekabr" };
  const OYQ = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
  const SK = { listening: "🎧", reading: "📖", writing: "✍️", speaking: "🎙" };
  let data = null, loading = null, month = null, skill = "all", summer = false, pick = null, edAt = false, edBh = false, curAt = null, curBh = null;
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
    curAt = { sheet: month, B };
    $("atBody").classList.toggle("c-editing", edAt);
    $("atHead").innerHTML = `<tr><th class="c-n">#</th><th class="c-nm">O'quvchi</th>${dc.map(wd).join("")}<th class="c-r">Keldi</th><th class="c-r">Kelmadi</th><th class="c-pc">Davomat</th></tr>`;
    const mark = v => { v = String(v || "").trim(); return v === "+" ? '<i class="m-y">✓</i>' : v === "-" ? '<i class="m-n">✕</i>' : '<i class="m-0"></i>'; };
    const bar = p => p == null ? '<span class="muted">—</span>' : `<div class="c-bar ${p < 70 ? "lo" : p < 85 ? "mid" : "hi"}"><span style="width:${p}%"></span></div><b>${p}%</b>`;
    $("atTbody").innerHTML = B.rows.map(r => `<tr><td class="c-n">${esc(r[0])}</td><td class="c-nm">${esc(r[1])}</td>${dc.map(i => `<td class="c-d${i === last ? " c-last" : ""}${edAt ? " c-ed" : ""}" data-r="${esc(r[1])}" data-c="${i}">${mark(r[i])}</td>`).join("")}
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
  const scaleOf = n => /out of 40|\/\s*40|cd mock|in-class/i.test(n) && !/error log/i.test(n) ? 40 : /^\s*(writing|speaking)/i.test(n) && !/out of 100/i.test(n) ? 9 : 100;
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
    const cell = (s, c) => edBh ? cellE(s, c).replace("<td class=\"c-v\">", `<td class="c-v c-ed" data-r="${esc(s.name)}" data-c="${c.i}">`) : cellE(s, c);
    const cellE = (s, c) => {
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
    curBh = { sheet: "ASSESSMENT", B: M.B };
    $("bhBody").classList.toggle("c-editing", edBh);
    $("bhTbody").querySelectorAll("tr").forEach(tr => tr.onclick = e => { if (e.target.closest(".c-ed")) return; const s = studs[+tr.dataset.k]; pick = pick === norm(s.name) ? null : norm(s.name); drawBh(); });
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

  // ---------- saytdan kiritish: katak → Course (Google Sheet) ----------
  let popAt = 0;
  function popClose() { $("cPop").classList.add("hide"); }
  function popOpen(td, html) {
    const P = $("cPop"); P.innerHTML = html; P.classList.remove("hide"); popAt = Date.now();
    const r = td.getBoundingClientRect(), w = P.offsetWidth, h = P.offsetHeight;
    let x = r.left + r.width / 2 - w / 2, y = r.bottom + 6;
    if (y + h > innerHeight - 8) y = r.top - h - 6;
    P.style.left = Math.max(8, Math.min(innerWidth - w - 8, x)) + "px"; P.style.top = Math.max(8, y) + "px";
  }
  function save(cur, td, value, redraw) {
    const col = +td.dataset.c, name = td.dataset.r;
    popClose(); td.classList.add("c-wait");
    T().api({ admin: "course_set", sheet: cur.sheet, label: label(), name: name, col: col, head: cur.B.head[col], sub: cur.B.sub[col], value: value }).then(r => {
      if (!r.ok) throw new Error(r.error);
      data.sheets[r.sheet] = r.values; data.at = r.at; redraw();
    }).catch(e => { td.classList.remove("c-wait"); alert("Jadvalga yozilmadi: " + e.message); });
  }
  function onAt(e) {
    const td = e.target.closest("td.c-ed"); if (!td || !edAt) return;
    const d = curAt.B.head[+td.dataset.c];
    popOpen(td, `<div class="c-pop-h">${esc(td.dataset.r)} · ${esc(d.slice(0, 5))}</div><div class="c-pop-b">
      <button class="btn btn-sm c-py" data-v="+">✓ Keldi</button><button class="btn btn-sm c-pn" data-v="-">✕ Kelmadi</button><button class="btn btn-secondary btn-sm" data-v="">Bo'sh</button></div>`);
    $("cPop").querySelectorAll("button").forEach(b => b.onclick = () => save(curAt, td, b.dataset.v, drawAt));
  }
  function onBh(e) {
    const td = e.target.closest("td.c-ed"); if (!td || !edBh) return;
    e.stopPropagation();
    const c = +td.dataset.c, row = curBh.B.rows.find(r => r[1] === td.dataset.r), name = String(curBh.B.sub[c] || "");
    popOpen(td, `<div class="c-pop-h">${esc(td.dataset.r)}</div><div class="c-pop-s">${esc(name)}</div><div class="c-pop-b">
      <input class="field" id="cPopIn" inputmode="decimal" value="${esc(row ? row[c] : "")}" placeholder="${scaleOf(name) === 40 ? "0–40" : scaleOf(name) === 9 ? "band 0–9" : "0–100"}">
      <button class="btn btn-primary btn-sm" id="cPopOk">Saqlash</button></div>`);
    const go = () => { const v = $("cPopIn").value.trim().replace(",", ".");
      if (v !== "" && (isNaN(+v) || +v < 0 || +v > scaleOf(name))) { $("cPopIn").classList.add("c-bad-in"); return; }
      save(curBh, td, v, drawBh); };
    $("cPopOk").onclick = go; $("cPopIn").onkeydown = k => { if (k.key === "Enter") go(); if (k.key === "Escape") popClose(); };
    setTimeout(() => $("cPopIn").focus({ preventScroll: true }), 30);
  }
  function edBtn(id, on) { $(id).textContent = on ? "✓ Tayyor" : "✎ Kiritish"; $(id).classList.toggle("btn-orange", on); $(id).classList.toggle("btn-secondary", !on); }

  // ---------- yangi oy varag'i (Yo'qlama) ----------
  const EN = Object.keys(OY);   // january … december
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const dd = d => [d.getDate(), d.getMonth() + 1].map(x => String(x).padStart(2, "0")).join(".") + "." + d.getFullYear();
  function monthPlan() {   // oxirgi oy varag'idan: keyingi oy va o'sha hafta kunlaridagi sanalar
    const ms = months(), last = ms[ms.length - 1], lbl = label();
    const B = last && (block(data.sheets[last] || [], lbl || "") || (() => { const v = data.sheets[last] || []; const h = v.findIndex(r => r && /ism/i.test(r[1] || "")); return h >= 0 ? { head: v[h] } : null; })());
    const ds = B ? B.head.map(dOf).filter(Boolean) : [];
    const wd = new Set(ds.map(d => d.getDay()));
    let mi = (EN.indexOf(norm(last)) + 1) % 12, y = ds.length ? ds[0].getFullYear() + (mi === 0 ? 1 : 0) : new Date().getFullYear();
    const out = [];
    for (let d = new Date(y, mi, 1); d.getMonth() === mi; d.setDate(d.getDate() + 1)) if (!wd.size || wd.has(d.getDay())) out.push(dd(d));
    return { last, mi, y, dates: out };
  }
  function monthOpen() {
    const box = $("atTool");
    if (!box.classList.contains("hide") && box.dataset.k === "m") { box.classList.add("hide"); return; }
    load(false).then(() => {
      const P = monthPlan();
      box.dataset.k = "m"; box.classList.remove("hide");
      box.innerHTML = `<div class="card-header"><h3 class="card-title">Yangi oy varag'i <small>${esc(OY[norm(P.last)] || "")} varag'idan nusxa: o'quvchilar, formulalar, to'lov</small></h3><button class="btn btn-secondary btn-sm" id="mnX">✕</button></div>
        <div class="row" style="align-items:flex-end;gap:10px;flex-wrap:wrap">
          <label><span class="field-label">Oy</span><select class="field" id="mnM">${EN.map((m, i) => `<option value="${i}" ${i === P.mi ? "selected" : ""}>${OY[m]}</option>`).join("")}</select></label>
          <label><span class="field-label">Yil</span><input class="field" id="mnY" value="${P.y}" style="width:90px" inputmode="numeric"></label>
          <button class="btn btn-secondary" id="mnRe">Sanalarni qayta hisoblash</button></div>
        <label style="display:block;margin-top:10px"><span class="field-label">Dars kunlari (vergul bilan; bayram yoki qo'shimcha darsni shu yerda o'zgartiring)</span>
          <textarea class="field" id="mnD" rows="3" style="width:100%">${P.dates.join(", ")}</textarea></label>
        <div class="muted" id="mnInfo" style="margin:6px 0 10px"></div>
        <button class="btn btn-orange" id="mnGo">Varaqni yaratish</button>
        <div class="msg" id="mnMsg"></div>`;
      const wdOf = () => { const s = new Set(); P.dates.forEach(x => s.add(dOf(x).getDay())); return s; };
      const days = wdOf();
      const info = () => { const n = $("mnD").value.split(/[,\s]+/).filter(Boolean).length; $("mnInfo").textContent = `${n} ta dars. To'lov formulasi "oylik / ${n}" bo'lib yangilanadi, yo'qlama bo'sh bo'ladi.`; };
      $("mnRe").onclick = () => { const mi = +$("mnM").value, y = +$("mnY").value || new Date().getFullYear(), out = [];
        for (let d = new Date(y, mi, 1); d.getMonth() === mi; d.setDate(d.getDate() + 1)) if (!days.size || days.has(d.getDay())) out.push(dd(d));
        $("mnD").value = out.join(", "); info(); };
      $("mnM").onchange = $("mnRe").onclick; $("mnY").onchange = $("mnRe").onclick; $("mnD").oninput = info; info();
      $("mnX").onclick = () => box.classList.add("hide");
      $("mnGo").onclick = () => {
        const mi = +$("mnM").value, dates = $("mnD").value.split(/[,\s]+/).filter(Boolean);
        if (!confirm(`${OY[EN[mi]]} varag'i yaratilsinmi? (${dates.length} ta dars)`)) return;
        $("mnGo").disabled = true; $("mnMsg").textContent = "Yaratilmoqda… (10-20 soniya)";
        T().api({ admin: "course_month", month: cap(EN[mi]), dates }).then(r => {
          $("mnGo").disabled = false;
          if (!r.ok) { $("mnMsg").textContent = "⚠️ " + r.error; return; }
          box.classList.add("hide");
          return load(true).then(() => { month = r.sheet; drawAt(); $("atMsg").textContent = `✅ ${OY[norm(r.sheet)]} varag'i yaratildi: ${r.n} ta dars, ${r.students} ta o'quvchi (${OY[norm(r.from)]} dan).`; });
        }).catch(e => { $("mnGo").disabled = false; $("mnMsg").textContent = "⚠️ " + e.message; });
      };
    }).catch(() => {});
  }

  // ---------- Baholar: yangi ustun va natijalarni Course'ga yozish ----------
  const KIND = { hw: "uy vazifasi", cls: "sinf darsi", log: "error log (to'liqlik %)", sp: "Speaking bahosi" };
  const todayDD = () => dd(new Date());
  function bhTool(k, html) {
    const box = $("bhTool");
    if (!box.classList.contains("hide") && box.dataset.k === k && !html) { box.classList.add("hide"); return null; }
    box.dataset.k = k; box.classList.remove("hide"); box.innerHTML = html || `<span class="muted">Yuklanmoqda…</span>`;
    return box;
  }
  function colOpen() {
    const box = bhTool("c"); if (!box) return;
    bhTool("c", `<div class="card-header"><h3 class="card-title">Yangi ustun <small>ASSESSMENT · har bir guruh blokiga</small></h3><button class="btn btn-secondary btn-sm" id="ncX">✕</button></div>
      <div class="row" style="align-items:flex-end;gap:10px;flex-wrap:wrap">
        <label style="flex:1;min-width:240px"><span class="field-label">Topshiriq nomi</span><input class="field" id="ncT" placeholder="Reading C16 T1 in-class out of 40" style="width:100%"></label>
        <label><span class="field-label">Sana</span><input class="field" id="ncD" value="${todayDD()}" style="width:130px"></label>
        <button class="btn btn-orange" id="ncGo">Qo'shish</button></div>
      <div class="muted" style="margin-top:8px">Nom ko'nikmadan boshlansin (Listening / Reading / Writing / Speaking). "out of 40" yozilsa 40 ballik, Writing va Speaking band (0-9), qolgani 100 ballik deb ko'rsatiladi.</div>
      <div class="msg" id="ncMsg"></div>`);
    $("ncX").onclick = () => $("bhTool").classList.add("hide");
    $("ncGo").onclick = () => {
      const title = $("ncT").value.trim(), date = $("ncD").value.trim();
      if (!title) { $("ncMsg").textContent = "⚠️ Nomini yozing"; return; }
      $("ncGo").disabled = true; $("ncMsg").textContent = "Qo'shilmoqda…";
      T().api({ admin: "course_col", title, date }).then(r => {
        $("ncGo").disabled = false;
        if (!r.ok) { $("ncMsg").textContent = "⚠️ " + r.error; return; }
        data.sheets.ASSESSMENT = r.values; data.at = r.at; $("bhTool").classList.add("hide"); drawBh();
        $("bhMsg").textContent = `✅ ${r.col} ustuni qo'shildi: ${title}. "✎ Kiritish" bilan ball qo'yasiz.`;
      }).catch(e => { $("ncGo").disabled = false; $("ncMsg").textContent = "⚠️ " + e.message; });
    };
  }
  function impOpen() {
    const box = bhTool("i"); if (!box) return;
    T().api({ admin: "course_sources" }).then(r => {
      if (!r.ok) { box.innerHTML = "⚠️ " + esc(r.error); return; }
      const S = r.sources;
      const lab = x => `${SK[(/^(listening|reading|speaking)/.exec(x.title.toLowerCase()) || [])[1]] || "📄"} ${x.title.replace(/ out of (40|100)$/, "").replace(/ homework band$/, "")} · ${KIND[x.kind]}${x.date ? " · " + x.date : ""} · ${x.n} ta`;
      bhTool("i", `<div class="card-header"><h3 class="card-title">Natijalarni Course'ga yozish <small>Home task va sinf testlari → ASSESSMENT</small></h3><button class="btn btn-secondary btn-sm" id="imX">✕</button></div>
        ${S.length ? `<label style="display:block"><span class="field-label">Manba</span><select class="field" id="imS" style="width:100%">${S.map((x, i) => `<option value="${i}">${esc(lab(x))}</option>`).join("")}</select></label>
        <div class="row" style="align-items:flex-end;gap:10px;flex-wrap:wrap;margin-top:10px">
          <label style="flex:1;min-width:240px"><span class="field-label">Ustun nomi (shu nomli ustun bo'lsa, o'shanga yoziladi)</span><input class="field" id="imT" style="width:100%"></label>
          <label><span class="field-label">Sana</span><input class="field" id="imD" style="width:130px"></label></div>
        <label class="muted" style="display:block;margin:8px 0"><input type="checkbox" id="imZ"> Topshirmaganlarga 0 yozilsin (bo'sh qolsa ham "bajarilmagan" hisoblanadi)</label>
        <button class="btn btn-secondary" id="imPrev">Ko'rish</button>
        <div id="imOut" style="margin-top:12px"></div>` : `<div class="muted">Hali natija yo'q.</div>`}
        <div class="msg" id="imMsg"></div>`);
      $("imX").onclick = () => $("bhTool").classList.add("hide");
      if (!S.length) return;
      const fill = () => { const x = S[+$("imS").value]; $("imT").value = x.title; $("imD").value = x.date || todayDD(); $("imOut").innerHTML = ""; };
      $("imS").onchange = fill; fill();
      const body = () => ({ src: S[+$("imS").value].src, title: $("imT").value.trim(), date: $("imD").value.trim(), zero: $("imZ").checked });
      $("imPrev").onclick = () => {
        $("imMsg").textContent = "Tekshirilmoqda…"; $("imOut").innerHTML = "";
        T().api(Object.assign({ admin: "course_scores", dry: true }, body())).then(p => {
          if (!p.ok) { $("imMsg").textContent = "⚠️ " + p.error; return; }
          $("imMsg").textContent = "";
          $("imOut").innerHTML = `<div style="margin-bottom:8px">${p.col ? `Mavjud <b>${esc(p.col)}</b> ustuniga yoziladi.` : "<b>Yangi ustun</b> ochiladi."} O'zgaradi: <b>${p.changes}</b> ta katak.</div>
            ${p.miss.length ? `<div class="msg" style="margin:0 0 8px">⚠️ Course'da topilmadi (ismni tekshiring): ${p.miss.map(esc).join(", ")}</div>` : ""}
            <div class="tbl-wrap"><table><thead><tr><th>Guruh</th><th>O'quvchi</th><th>Hozir</th><th>Yangi</th></tr></thead><tbody>
            ${p.rows.map(x => `<tr><td>${esc(x.group)}</td><td>${esc(x.name)}</td><td>${esc(x.old) || "—"}</td><td><b>${esc(x.value)}</b>${x.zero ? ' <span class="muted">(topshirmagan)</span>' : ""}</td></tr>`).join("")}</tbody></table></div>
            <button class="btn btn-orange" id="imGo" style="margin-top:10px" ${p.changes ? "" : "disabled"}>Course'ga yozish (${p.changes})</button>`;
          const go = $("imGo"); if (!go) return;
          go.onclick = () => {
            go.disabled = true; $("imMsg").textContent = "Yozilmoqda…";
            T().api(Object.assign({ admin: "course_scores" }, body())).then(w => {
              if (!w.ok) { go.disabled = false; $("imMsg").textContent = "⚠️ " + w.error; return; }
              data.sheets.ASSESSMENT = w.values; data.at = w.at; $("bhTool").classList.add("hide"); drawBh();
              $("bhMsg").textContent = `✅ ${w.written} ta ball ${w.col} ustuniga yozildi.` + (w.miss.length ? " Topilmadi: " + w.miss.join(", ") : "");
            }).catch(e => { go.disabled = false; $("imMsg").textContent = "⚠️ " + e.message; });
          };
        }).catch(e => { $("imMsg").textContent = "⚠️ " + e.message; });
      };
    }).catch(e => { box.innerHTML = "⚠️ " + esc(e.message); });
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
    $("atEdit").onclick = () => { edAt = !edAt; edBtn("atEdit", edAt); popClose(); drawAt(); };
    $("bhEdit").onclick = () => { edBh = !edBh; edBtn("bhEdit", edBh); popClose(); drawBh(); };
    $("atTbody").addEventListener("click", onAt);
    $("atNewM").onclick = monthOpen;
    $("bhCol").onclick = colOpen;
    $("bhImp").onclick = impOpen;
    $("bhTbody").addEventListener("click", onBh, true);
    document.addEventListener("click", e => { if (!e.target.closest("#cPop") && !e.target.closest("td.c-ed")) popClose(); });
    window.addEventListener("scroll", () => { if (Date.now() - popAt > 600) popClose(); }, true);
  }
})();
