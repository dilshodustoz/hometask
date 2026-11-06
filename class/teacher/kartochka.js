// Qizil kartochkalar (O'quvchilar bo'limi): LC Panel kk_get / kk_run / kk_set
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const T = () => window.CLS_TP;
  let data = null, busy = false, open = {};
  const LV = { ok: ["b-ok", "joyida"], warn: ["b-warn", "ogohlantirish"], final: ["b-bad", "oxirgi ogohlantirish"], out: ["b-bad", "chegaraga yetdi"] };
  function call(b) {
    if (busy) return; busy = true; $("kkBox").classList.add("muted");
    return T().api(b).then(r => { busy = false; if (!r.ok) throw new Error(r.error); data = r; draw(); })
      .catch(e => { busy = false; $("kkBox").textContent = "⚠️ " + e.message; });
  }
  function draw() {
    if (!data) return;
    const g = T().group(), chat = String(((T().groups || {})[g] || {}).chat || "");
    $("kkAt").textContent = data.at ? "· hisoblandi " + new Date(data.at).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "· hali hisoblanmagan";
    const list = data.list.filter(x => !chat || x.chat === chat).sort((a, b) => b.red - a.red || b.yel - a.yel || (a.name < b.name ? -1 : 1));
    const slots = x => Array.from({ length: data.limit }, (_, i) => `<span style="display:inline-block;width:12px;height:17px;border-radius:3px;margin-right:3px;${i < x.red ? "background:#d23a3f" : i === x.red && x.yel ? "background:#eab308" : "border:1.5px dashed #ccc"}"></span>`).join("");
    $("kkBox").classList.remove("muted");
    $("kkBox").innerHTML = (data.errs && data.errs.length ? `<div class="muted">⚠️ ${esc(data.errs.join("; "))}</div>` : "") +
      `<div class="tbl-wrap"><table><thead><tr><th>O'quvchi</th><th>Kartochkalar</th><th>Holat</th><th></th></tr></thead><tbody>` +
      list.map(x => {
        const [bc, bl] = LV[x.level] || LV.ok, n = x.items.length + (x.off || []).length;
        const det = open[x.k] ? `<tr><td colspan="4" style="background:var(--soft,#f6f6f4)">` +
          x.items.map(it => `<div style="display:flex;gap:8px;align-items:center;padding:3px 0"><span class="muted" style="min-width:42px">${esc(it.d)}</span>${it.c === "r" ? "🟥" : "🟨"} <span style="flex:1">${esc(it.why)}${it.hand ? " <i class='muted'>(qo'lda)</i>" : ""}</span>${it.hand ? `<button class="btn btn-secondary btn-sm" data-del="${esc(it.id)}">O'chirish</button>` : `<button class="btn btn-secondary btn-sm" data-off="${esc(it.id)}">✕ Bekor qilish</button>`}</div>`).join("") +
          (x.off || []).map(it => `<div style="display:flex;gap:8px;align-items:center;padding:3px 0;opacity:.6"><span class="muted" style="min-width:42px">${esc(it.d)}</span>${it.c === "r" ? "🟥" : "🟨"} <s style="flex:1">${esc(it.why)}</s><button class="btn btn-secondary btn-sm" data-on="${esc(it.id)}">↺ Qaytarish</button></div>`).join("") +
          `<div class="row" style="margin-top:6px;gap:6px"><select class="field" data-c="${x.k}" style="width:auto"><option value="r">🟥 Qizil</option><option value="y">🟨 Sariq</option></select><input class="field" data-why="${x.k}" placeholder="Sabab" style="flex:1;min-width:140px"><button class="btn btn-sm" data-add="${x.k}">+ Qo'shish</button></div></td></tr>` : "";
        return `<tr data-k="${x.k}" style="cursor:pointer"><td>${esc(x.name)}</td><td>${slots(x)} <b>${x.red} / ${data.limit}</b>${x.yel ? " <span class='muted'>+🟨" + x.yel + "</span>" : ""}${x.removed ? " <span class='muted'>(" + x.removed + " o'chgan)</span>" : ""}</td><td><span class="badge ${bc}">${bl}</span></td><td class="muted">${n ? (open[x.k] ? "▲" : "▼ " + n) : "▼"}</td></tr>` + det;
      }).join("") + `</tbody></table></div>`;
    $("kkBox").querySelectorAll("tr[data-k]").forEach(tr => tr.onclick = () => { open[tr.dataset.k] = !open[tr.dataset.k]; draw(); });
    $("kkBox").querySelectorAll("[data-off]").forEach(b => b.onclick = e => { e.stopPropagation(); call({ admin: "kk_set", id: b.dataset.off, off: true }); });
    $("kkBox").querySelectorAll("[data-on]").forEach(b => b.onclick = e => { e.stopPropagation(); call({ admin: "kk_set", id: b.dataset.on, off: false }); });
    $("kkBox").querySelectorAll("[data-del]").forEach(b => b.onclick = e => { e.stopPropagation(); call({ admin: "kk_set", del: b.dataset.del }); });
    $("kkBox").querySelectorAll("[data-add]").forEach(b => b.onclick = e => {
      e.stopPropagation(); const k = b.dataset.add, why = $("kkBox").querySelector(`[data-why="${k}"]`).value.trim();
      if (!why) { $("kkBox").querySelector(`[data-why="${k}"]`).focus(); return; }
      if (!confirm("O'quvchiga kartochka qo'shilsinmi? Unga kabinetda xabar boradi.")) return;
      call({ admin: "kk_set", k: k, c: $("kkBox").querySelector(`[data-c="${k}"]`).value, why: why });
    });
  }
  window.addEventListener("cls-tab", e => { if (e.detail === "students" && T() && T().verified() && !data) call({ admin: "kk_get" }); });
  window.addEventListener("cls-group", draw);
  document.addEventListener("click", e => { if (e.target && e.target.id === "kkRun") call({ admin: "kk_run" }); });
})();
