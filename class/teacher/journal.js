// Harakatlar jurnali: hozir davom etayotgan ishlar + yakunlangan amallar (Firebase admin/journal, Mac va iPhone'da bir xil)
(function () {
  const MAX = 300;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const now = () => (window.CLS && CLS.now ? CLS.now() : Date.now());
  const hms = t => new Date(t).toLocaleTimeString("en-GB");
  const hm = t => hms(t).slice(0, 5);
  let ref = null, list = [], busy = {}, seq = 0, live = null, open = false;

  const css = `
  .jr-btn{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;padding:9px 14px;border-radius:12px;border:1px solid var(--border);background:var(--card);color:var(--ink);font-weight:600;font-size:.92rem;cursor:pointer;white-space:nowrap}
  .jr-btn:hover{border-color:var(--border-strong)}
  .jr-btn .jr-n{min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--green);color:#fff;font-size:.72rem;display:inline-flex;align-items:center;justify-content:center}
  .jr-btn .jr-n.idle{background:#E4E4E7;color:var(--muted)}
  .jr-btn .jr-pulse{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 0 0 rgba(21,128,61,.5);animation:jrP 1.6s infinite}
  @keyframes jrP{70%{box-shadow:0 0 0 8px rgba(21,128,61,0)}100%{box-shadow:0 0 0 0 rgba(21,128,61,0)}}
  .jr-dim{position:fixed;inset:0;background:rgba(15,23,42,.25);z-index:190;opacity:0;pointer-events:none;transition:opacity .2s}
  .jr-dim.on{opacity:1;pointer-events:auto}
  .jr-panel{position:fixed;top:0;right:0;bottom:0;width:420px;max-width:100vw;background:#F4F5F7;z-index:200;display:flex;flex-direction:column;
    transform:translateX(100%);transition:transform .25s ease;box-shadow:-12px 0 40px rgba(15,23,42,.12)}
  .jr-panel.on{transform:none}
  .jr-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 12px}
  .jr-head h3{margin:0;font-size:1.05rem;color:var(--ink)}
  .jr-x{border:0;background:transparent;font-size:1.4rem;line-height:1;color:var(--muted);cursor:pointer;padding:4px 8px}
  .jr-body{overflow-y:auto;padding:0 16px 24px;flex:1}
  .jr-sec{font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 4px 8px}
  .jr-card{background:#111827;color:#E5E7EB;border-radius:16px;padding:14px 16px;margin-bottom:10px;font:13.5px/1.55 'JetBrains Mono',ui-monospace,Menlo,monospace}
  .jr-card .jr-a{color:#CBD5E1;display:flex;justify-content:space-between;gap:10px}
  .jr-card .jr-t{color:#64748B;font-size:.8rem;white-space:nowrap}
  .jr-card .jr-r{margin-top:8px;white-space:pre-wrap;word-break:break-word}
  .jr-card.bad .jr-r{color:#FCA5A5}
  .jr-now{background:#fff;border:1px solid var(--border);border-left:4px solid var(--green);border-radius:16px;padding:14px 16px;margin-bottom:10px}
  .jr-now.warn{border-left-color:#F59E0B}.jr-now.stop{border-left-color:var(--red)}
  .jr-now b{color:var(--ink)}
  .jr-now .jr-big{font:700 1.6rem/1.2 'JetBrains Mono',ui-monospace,monospace;color:var(--ink);margin:6px 0 2px}
  .jr-now .jr-big.red{color:var(--red)}
  .jr-now .jr-m{color:var(--muted);font-size:.85rem}
  .jr-now .jr-btns{display:flex;gap:8px;margin-top:10px}
  .jr-now .jr-btns button{flex:1;padding:9px;border-radius:10px;border:1px solid var(--border);background:#fff;font-weight:600;cursor:pointer}
  .jr-now .jr-btns .jr-stop{background:var(--red);border-color:var(--red);color:#fff}
  .jr-spin{display:inline-block;width:12px;height:12px;border:2px solid #CBD5E1;border-top-color:var(--green);border-radius:50%;animation:jrS .8s linear infinite;vertical-align:-1px;margin-right:6px}
  @keyframes jrS{to{transform:rotate(360deg)}}
  .jr-empty{color:var(--muted);font-size:.88rem;padding:8px 4px}
  .jr-toast{position:fixed;right:20px;bottom:20px;z-index:210;max-width:380px;background:#111827;color:#E5E7EB;border-radius:14px;padding:12px 16px;
    font:13px/1.5 'JetBrains Mono',ui-monospace,monospace;box-shadow:0 10px 30px rgba(0,0,0,.25);cursor:pointer;opacity:0;transform:translateY(10px);transition:all .25s}
  .jr-toast.on{opacity:1;transform:none}
  @media (max-width:760px){.jr-panel{width:100vw}.jr-toast{left:12px;right:12px;bottom:12px;max-width:none}}`;

  function mount() {
    if ($("jrBtn")) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const b = document.createElement("button");
    b.className = "jr-btn"; b.id = "jrBtn"; b.type = "button"; b.title = "Harakatlar jurnali";
    b.innerHTML = `🗒 Jurnal <span class="jr-n idle" id="jrN">0</span>`;
    const tb = $("tbRight"); tb.insertBefore(b, tb.firstChild);
    document.body.insertAdjacentHTML("beforeend", `
      <div class="jr-dim" id="jrDim"></div>
      <aside class="jr-panel" id="jrPanel" aria-label="Harakatlar jurnali">
        <div class="jr-head"><h3>🗒 Harakatlar jurnali</h3><button class="jr-x" id="jrX" aria-label="Yopish">×</button></div>
        <div class="jr-body" id="jrBody"></div>
      </aside>
      <div class="jr-toast" id="jrToast"></div>`);
    b.onclick = () => show(!open);
    $("jrX").onclick = $("jrDim").onclick = () => show(false);
    $("jrToast").onclick = () => { $("jrToast").classList.remove("on"); show(true); };
    document.addEventListener("keydown", e => { if (e.key === "Escape" && open) show(false); });
    watchMsgs();
    setInterval(() => { if (open && (live || Object.keys(busy).length)) drawNow(); badge(); }, 1000);
  }
  function show(v) { open = v; $("jrPanel").classList.toggle("on", v); $("jrDim").classList.toggle("on", v); if (v) draw(); }

  // ---------- ma'lumot ----------
  function attach(db) {
    ref = db.ref("admin/journal");
    ref.orderByChild("t").limitToLast(MAX).on("value", s => {
      const v = s.val() || {};
      list = Object.keys(v).map(k => Object.assign({ id: k }, v[k])).sort((a, b) => b.t - a.t);
      if (open) draw();
      if (list.length > MAX + 20) list.slice(MAX).forEach(x => ref.child(x.id).remove());
    });
  }
  function log(action, result, kind) {
    const e = { t: now(), a: String(action || "").slice(0, 300), r: String(result || "").slice(0, 1500), k: kind || "ok" };
    if (ref) ref.push(e).catch(() => {});
    else { list.unshift(e); if (open) draw(); }
    toast(e);
  }
  function start(label) { const id = "b" + (++seq); busy[id] = { a: label, t: now(), r: "" }; if (open) drawNow(); badge(); return id; }
  function step(id, text) { if (busy[id]) { busy[id].r = text; if (open) drawNow(); } }
  function end(id, result, kind) { const b = busy[id]; if (!b) return; delete busy[id]; log(b.a, result, kind); badge(); if (open) drawNow(); }
  function setLive(o) { live = o; badge(); if (open) drawNow(); }

  // ---------- ko'rinish ----------
  function badge() {
    const n = Object.keys(busy).length + (live ? 1 : 0), el = $("jrN"); if (!el) return;
    el.textContent = n; el.classList.toggle("idle", !n);
    const p = $("jrBtn").querySelector(".jr-pulse");
    if (n && !p) $("jrBtn").insertAdjacentHTML("afterbegin", '<span class="jr-pulse"></span>');
    if (!n && p) p.remove();
  }
  function toast(e) {
    const t = $("jrToast"); if (!t || open) return;
    t.innerHTML = `${e.k === "bad" ? "⚠️" : "✅"} ${esc(e.r.split("\n")[0].replace(/^(✅|⚠️)\s*/, ""))}`;
    t.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), 5000);
  }
  function draw() { $("jrBody").innerHTML = `<div id="jrNow"></div><div id="jrDone"></div>`; drawNow(); drawDone(); }
  function drawNow() {
    const box = $("jrNow"); if (!box) return;
    let h = "";
    if (live) {
      const L = live, t = L.state === "paused" ? L.pausedAt : now(), left = L.end ? Math.round((L.end - (L.grace || 0) - t) / 1000) : null;
      const cls = L.state === "paused" ? "warn" : L.state === "stopped" ? "stop" : "";
      const lab = { wait: "O'quvchilar kirmoqda", run: "Test ketmoqda", paused: "Pauza", stopped: "To'xtatildi: natijalarni yuboring" }[L.state] || L.state;
      h += `<div class="jr-now ${cls}"><b>▶ ${esc(L.group)}: ${esc(L.title)}</b><div class="jr-m">${esc(lab)}${L.joined != null ? ` · ${L.joined} kirdi, ${L.done || 0} topshirdi` : ""}</div>` +
        (L.state === "run" || L.state === "paused" ? `<div class="jr-big ${left < 0 ? "red" : ""}">${CLS.mmss(left)}</div><div class="jr-m">${hms(L.end - (L.grace || 0))} da tugaydi</div>` : "") +
        `<div class="jr-btns">${L.state === "wait" ? `<button data-jr="btnStart">Boshlash</button>` : ""}` +
        (L.state === "run" || L.state === "paused" ? `<button data-jr="btnPause">${L.state === "paused" ? "Davom ettirish" : "Pauza"}</button><button class="jr-stop" data-jr="btnStop">To'xtatish</button>` : "") +
        (L.state === "stopped" ? `<button data-jr="btnGrade">Natijalarni yuborish</button>` : "") + `</div></div>`;
    }
    Object.keys(busy).forEach(id => { const b = busy[id];
      h += `<div class="jr-now"><b><span class="jr-spin"></span>${esc(b.a)}</b><div class="jr-m">${esc(b.r || "Bajarilmoqda…")} · ${CLS.mmss((now() - b.t) / 1000)}</div></div>`; });
    box.innerHTML = `<div class="jr-sec">Hozir davom etmoqda</div>` + (h || `<div class="jr-empty">Hozir hech narsa bajarilmayapti.</div>`);
    box.querySelectorAll("[data-jr]").forEach(b => b.onclick = () => { const t = $(b.dataset.jr); if (t) t.click(); });
  }
  function drawDone() {
    const box = $("jrDone"); if (!box) return;
    const day = t => new Date(t).toDateString(), today = day(now()), yest = day(now() - 864e5);
    let h = "", last = "";
    list.slice(0, 150).forEach(e => {
      const d = day(e.t);
      if (d !== last) { last = d; h += `<div class="jr-sec">${d === today ? "Bugun" : d === yest ? "Kecha" : new Date(e.t).toLocaleDateString("en-GB")}</div>`; }
      h += `<div class="jr-card ${e.k === "bad" ? "bad" : ""}"><div class="jr-a"><span>▶ ${esc(e.a)}</span><span class="jr-t">${hm(e.t)}</span></div>` +
        (e.r ? `<div class="jr-r">${esc(e.r)}</div>` : "") + `</div>`;
    });
    box.innerHTML = h || `<div class="jr-sec">Yakunlangan</div><div class="jr-empty">Hali yozuv yo'q.</div>`;
  }

  // ---------- avtomatik: sahifadagi xabar qutilari (".msg") ----------
  // Tugma bosilgach xabar qutisida "…"/⏳ chiqsa: "Hozir"ga; keyin ✅/⚠️ chiqsa: jurnalga yoziladi.
  let lastBtn = null;
  document.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || b.closest(".jr-panel") || b.id === "jrBtn") return;
    lastBtn = { label: b.textContent.replace(/\s+/g, " ").trim(), t: Date.now() };
  }, true);
  function watchMsgs() {
    const seen = new WeakMap();
    const hook = el => {
      if (seen.has(el) || el.id === "loginMsg") return; seen.set(el, {});
      new MutationObserver(() => onMsg(el, seen.get(el))).observe(el, { childList: true, characterData: true, subtree: true });
    };
    document.querySelectorAll(".msg").forEach(hook);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.classList.contains("msg")) hook(n); n.querySelectorAll && n.querySelectorAll(".msg").forEach(hook); } })))
      .observe(document.body, { childList: true, subtree: true });
  }
  function grp() { const g = window.CLS_TP && CLS_TP.group(); return g && CLS.GROUPS[g] ? CLS.GROUPS[g].name : ""; }
  function onMsg(el, st) {
    const txt = el.textContent.trim();
    if (!txt) return;
    const pending = /…\s*(\(.*\))?$/.test(txt.split("\n")[0]) || /^⏳/.test(txt);
    const label = () => { const g = grp(), b = lastBtn && Date.now() - lastBtn.t < 120000 ? lastBtn.label : "Amal"; return (g ? g + ": " : "") + b; };
    if (pending) { if (st.id) step(st.id, txt); else { st.id = start(label()); st.t0 = Date.now(); step(st.id, txt); } return; }
    const bad = /^⚠️|bo'lmadi|ochilmadi|xato/i.test(txt);
    if (st.id) { end(st.id, txt, bad ? "bad" : "ok"); st.id = null; return; }
    // darhol chiqqan tekshiruv ogohlantirishlari ("Muddatni tanlang") jurnalga yozilmaydi
    if (bad) { if (!(lastBtn && Date.now() - lastBtn.t < 1500)) log(label(), txt, "bad"); return; }
    if (/^(✅|🗑)/.test(txt)) log(label(), txt, "ok");
  }

  window.JR = { mount: mount, attach: attach, log: log, start: start, step: step, end: end, setLive: setLive, hms: hms };
})();
