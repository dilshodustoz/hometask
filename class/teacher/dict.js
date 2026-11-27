// 🎧 Auto Dictation (27.11): Bosh sahifadagi karta — kim ixtiyoriy dictation mashqini qilgani (LC Panel dict_get, faqat o'qish).
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const T = () => window.CLS_TP;
  let data = null, busy = false, err = "", open = {};
  const PART = id => { const m = /^ms(\d+)_(\d)$/.exec(id || ""); return m ? "Mock " + m[1] + " P" + m[2] : id; };
  const dt = s => new Date(s).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  function draw() {
    const box = $("dcBox"); if (!box) return;
    if (busy && !data) { box.innerHTML = `<div class="card hm-card"><div class="hm-ch"><b>🎧 Auto Dictation</b><span class="hm-sub">o'qilmoqda…</span></div></div>`; return; }
    if (err && !data) { box.innerHTML = `<div class="card hm-card"><div class="hm-ch"><b>🎧 Auto Dictation</b></div><div class="msg">⚠️ ${esc(err)}</div></div>`; return; }
    if (!data) { box.innerHTML = ""; return; }
    const g = T().group(), gname = (T().groups[g] || {}).name || "";
    const rows = data.rows.filter(r => data.groups[r.k] === g), wk = Date.now() - 7 * 86400000;
    const by = {};
    rows.forEach(r => {
      const o = by[r.k] || (by[r.k] = { k: r.k, name: r.name, n: 0, w: 0, last: "", sumP: 0, min: 0, words: {}, list: [] });
      o.n++; if (new Date(r.at).getTime() >= wk) o.w++;
      if (!o.last || r.at > o.last) o.last = r.at;
      o.sumP += r.pct; o.min += r.min; o.list.push(r);
      String(r.wrong || "").split("; ").forEach(x => { const w = x.split("=")[0].trim(); if (w) o.words[w] = (o.words[w] || 0) + 1; });
    });
    const st = Object.values(by).sort((a, b) => b.w - a.w || b.n - a.n);
    const wkN = rows.filter(r => new Date(r.at).getTime() >= wk).length;
    box.innerHTML = `<div class="card hm-card"><div class="hm-ch"><b>🎧 Auto Dictation · ixtiyoriy</b><span class="hm-sub">${esc(gname)} · oxirgi 7 kun: ${st.filter(o => o.w).length} o'quvchi, ${wkN} mashq</span></div>
      ${st.length ? `<div class="tbl-wrap"><table class="hm-tbl"><thead><tr><th>O'quvchi</th><th>7 kun</th><th>Jami</th><th>Oxirgi</th><th>1-urinishda</th><th>Daqiqa</th><th>Ko'p xato so'zlar</th></tr></thead><tbody>
      ${st.map(o => {
        const top = Object.entries(o.words).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => esc(x[0]) + (x[1] > 1 ? " ×" + x[1] : "")).join(", ");
        const avg = Math.round(o.sumP / o.n);
        let h = `<tr><td><a class="hm-nm" data-dck="${esc(o.k)}">${esc(o.name)}</a></td><td class="hm-c"><b>${o.w}</b></td><td class="hm-c">${o.n}</td><td class="hm-c">${dt(o.last)}</td>
          <td class="hm-c"><span class="hm-pc ${avg < 60 ? "lo" : avg < 80 ? "mid" : "hi"}">${avg}%</span></td><td class="hm-c">${Math.round(o.min)}</td><td>${top || '<span class="muted">—</span>'}</td></tr>`;
        if (open[o.k]) h += o.list.slice().sort((a, b) => a.at < b.at ? 1 : -1).slice(0, 12).map(r => `<tr class="dc-sub"><td colspan="7"><span class="muted">${dt(r.at)}</span> · <b>${esc(r.v)}</b> · ${esc(PART(r.part))}${r.rg ? " · " + esc(r.rg) + "-gaplar" : ""} · ${r.first}/${r.n} (${r.pct}%) · qayta eshitish ${r.rep} · ${r.min} daq${r.extra ? " · " + esc(r.extra) : ""}${r.wrong ? `<br><span class="muted">${esc(r.wrong)}</span>` : ""}</td></tr>`).join("");
        return h; }).join("")}</tbody></table></div>
      <div class="hm-note">Ism ustiga bosing — mashqlar tafsiloti. Xatolar: to'g'ri so'z = o'quvchi yozgani. Bu mashq ixtiyoriy, ball va kartochka yo'q.</div>`
      : `<div class="hm-empty">Bu guruhda hali hech kim dictation qilmagan. O'quvchilar uni kabinet → 📚 Materiallar → 🎧 Auto Dictation orqali ochadi.</div>`}</div>`;
    box.querySelectorAll("[data-dck]").forEach(a => a.onclick = () => { const k = a.dataset.dck; open[k] = !open[k]; draw(); });
  }
  function load() {
    if (busy || !T() || !T().verified()) return;
    busy = true; err = ""; draw();
    T().api({ admin: "dict_get", days: 60 }).then(r => { busy = false; if (r && r.ok) data = r; else err = (r && r.error) || "o'qilmadi"; draw(); })
      .catch(e => { busy = false; err = e.message || String(e); draw(); });
  }
  window.addEventListener("cls-tab", e => { if (e.detail === "home") { if (!data) load(); else draw(); } });
  window.addEventListener("cls-group", () => { if (!data) load(); else draw(); });
  document.addEventListener("click", e => { if (e.target && e.target.closest && e.target.closest("#hmReload")) { data = null; load(); } });
})();
