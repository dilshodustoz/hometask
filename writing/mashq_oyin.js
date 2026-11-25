// 🎮 Mening mashqim: o'yin ko'rinishi (So'zlar uslubida, bitta-bitta karta). 2026-11-25
// mashq.html chaqiradi: window.MQ_OYIN(ctx). Serverga ketadigan javob o'zgarmaydi (A, B, C, D massivlari).
// B/C/D: element.h bo'lsa (LC Panel shifrlangan kalit) javob darhol tekshiriladi, bo'lmasa oxirida.
// A: xato so'zni topish -> o'sha joyda to'g'rilash (yoki butun gapni yozish). A'ni ustoz (kechki tekshiruv) baholaydi.
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // LC Panel mqH_ bilan bir xil: FNV-1a, 36-lik, oxirgi 5 belgi
  function H(seed) { let h = 2166136261; for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36).slice(-5); }
  const FXP = "../kabinet/soz/fx/";
  let FX = null;
  function fx(n) {
    if (!FX) FX = { ok: new Audio((window.MQ_FX || {}).ok || FXP + "ok.mp3"), bad: new Audio((window.MQ_FX || {}).bad || FXP + "bad.mp3"), end: new Audio((window.MQ_FX || {}).end || FXP + "end.mp3"), tap: new Audio((window.MQ_FX || {}).tap || FXP + "tap.mp3") };
    const a = FX[n]; if (!a) return;
    try { a.currentTime = 0; const p = a.play(); if (p) p.catch(() => {}); } catch (e) {}
    if (n === "bad") try { navigator.vibrate && navigator.vibrate(60); } catch (e) {}
  }
  const CSS = `
  #og{--bg:#F6F6F4;--card:#FFF;--ink:#16181D;--muted:#6B6F76;--line:#E4E4E0;--soft:#F1F1EE;--primary:#E8590C;--ok:#15803D;--okbg:#ECFDF3;--bad:#DC2626;--badbg:#FEF2F2;--blue:#1CB0F6;--bluebg:rgba(28,176,246,.1);--vio:#7C3AED;--viobg:rgba(139,92,246,.13)}
  html[data-theme="dark"] #og{--bg:#13161B;--card:#1C2027;--ink:#ECEDEF;--muted:#9AA0A8;--line:#2E333C;--soft:#242931;--primary:#F2782F;--ok:#3DD47A;--okbg:#10291B;--bad:#F2645A;--badbg:#2E1513;--viobg:rgba(139,92,246,.22);--vio:#C4B5FD}
  html.og-lock,html.og-lock body{overflow:hidden}
  #og{position:fixed;inset:0;z-index:60;background:var(--bg);color:var(--ink);display:flex;flex-direction:column;font:16px/1.5 'Plus Jakarta Sans',system-ui,-apple-system,sans-serif}
  #og.hide{display:none}
  #og button{font-family:inherit}
  .og-hd{display:flex;align-items:center;gap:12px;padding:calc(10px + env(safe-area-inset-top)) 16px 10px;max-width:640px;width:100%;margin:0 auto;box-sizing:border-box}
  .og-x{border:0;background:none;font-size:1.35rem;color:var(--muted);cursor:pointer;padding:4px 6px}
  .og-pb{flex:1;height:14px;border-radius:9px;background:var(--line);overflow:hidden}
  .og-pb i{display:block;height:100%;width:0;background:var(--ok);border-radius:9px;transition:width .35s}
  .og-cb{min-width:44px;font-weight:800;color:var(--primary);text-align:right;white-space:nowrap}
  .og-body{flex:1;overflow:auto;padding:8px 16px 18px;max-width:640px;width:100%;margin:0 auto;box-sizing:border-box}
  .og-card{animation:ogIn .25s ease}
  @keyframes ogIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
  .og-tag{display:inline-block;background:var(--viobg);color:var(--vio);font-weight:800;font-size:.75rem;border-radius:8px;padding:3px 9px;margin:0 6px 10px 0}
  .og-tag.or{background:rgba(232,89,12,.12);color:var(--primary)}
  .og-q{font-size:1.22rem;font-weight:800;margin:4px 0 14px;line-height:1.35}
  .og-sub{color:var(--muted);font-size:.9rem;margin:-6px 0 14px}
  .og-ex{background:var(--card);border:2px solid var(--line);border-radius:16px;padding:14px 16px;font-size:1.1rem;line-height:1.6;margin-bottom:14px}
  .og-gap{display:inline-block;min-width:64px;border-bottom:3px solid var(--primary);line-height:1.1;color:var(--primary);font-weight:800;text-align:center}
  .og-opts{display:flex;flex-direction:column;gap:10px}
  .og-o{display:flex;align-items:center;gap:12px;text-align:left;border:2px solid var(--line);border-bottom-width:4px;background:var(--card);color:var(--ink);border-radius:14px;padding:13px 14px;font-size:1.02rem;font-weight:600;cursor:pointer}
  .og-o kbd{flex:none;width:24px;height:24px;border:2px solid var(--line);border-radius:7px;font:700 .75rem system-ui;color:var(--muted);display:flex;align-items:center;justify-content:center}
  .og-o.sel{border-color:var(--blue);background:var(--bluebg)}
  .og-o.ok{border-color:var(--ok);background:var(--okbg)}.og-o.bad{border-color:var(--bad);background:var(--badbg);animation:ogSh .3s}
  .og-o:disabled{cursor:default}
  @keyframes ogSh{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
  .og-ft{padding:14px 16px calc(14px + env(safe-area-inset-bottom));border-top:2px solid var(--line);background:var(--bg)}
  .og-ft>*{max-width:608px;margin-left:auto;margin-right:auto}
  .og-ft.ok{background:var(--okbg);border-color:transparent}.og-ft.bad{background:var(--badbg);border-color:transparent}.og-ft.inf{background:var(--bluebg);border-color:transparent}
  .og-btn{display:flex;width:100%;justify-content:center;border:0;padding:15px;font-size:1.04rem;font-weight:800;border-radius:14px;background:var(--ok);color:#fff;box-shadow:0 4px 0 #0F6B32;text-transform:uppercase;letter-spacing:.03em;cursor:pointer}
  .og-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #0F6B32}
  .og-btn:disabled{background:var(--line);color:var(--muted);box-shadow:none;cursor:default;transform:none}
  .og-btn.or{background:var(--primary);box-shadow:0 4px 0 #B8460A}
  .og-btn.alt{background:var(--card);color:var(--ink);box-shadow:0 4px 0 var(--line);border:2px solid var(--line)}
  .og-ft.bad .og-btn{background:var(--bad);box-shadow:0 4px 0 #A51C1C}
  .og-ft.inf .og-btn{background:var(--blue);box-shadow:0 4px 0 #1592CC}
  html[data-theme="dark"] #og .og-btn:not(:disabled):not(.alt){color:#0B1410}
  .og-two{display:flex;gap:10px}.og-two .og-btn{flex:1}
  .og-fb{margin-bottom:12px}
  .og-fh{font-size:1.2rem;font-weight:800;color:var(--ok)}.og-ft.bad .og-fh{color:var(--bad)}.og-ft.inf .og-fh{color:var(--blue)}
  .og-fa{font-weight:700;margin-top:6px;color:var(--ink)}
  .og-fn{font-size:.88rem;color:var(--muted);margin-top:4px}
  .og-rule{background:var(--card);border:2px solid var(--line);border-left:6px solid var(--vio);border-radius:14px;padding:12px 14px;margin-bottom:12px;font-size:.98rem}
  .og-rule b{color:var(--vio)}
  .og-chips{display:flex;flex-wrap:wrap;gap:8px 6px;background:var(--card);border:2px solid var(--line);border-radius:16px;padding:14px;margin-bottom:12px}
  .og-ch{border:2px solid var(--line);border-bottom-width:4px;background:var(--card);color:var(--ink);border-radius:12px;padding:7px 11px;font-size:1.02rem;font-weight:600;cursor:pointer}
  .og-ch.hit{border-color:var(--primary);background:rgba(232,89,12,.13);color:var(--primary)}
  .og-ch.miss{border-color:var(--bad);background:var(--badbg);animation:ogSh .3s}
  .og-ch.show{text-decoration:underline wavy var(--bad) 2px;text-underline-offset:5px}
  .og-ch:disabled{cursor:default}
  .og-ed{background:var(--card);border:2px solid var(--line);border-radius:16px;padding:14px 16px;font-size:1.1rem;line-height:2.2;margin-bottom:12px}
  .og-ed input{font:inherit;font-weight:700;line-height:1.3;color:var(--primary);background:rgba(232,89,12,.08);border:0;border-bottom:3px solid var(--primary);border-radius:6px 6px 0 0;padding:2px 6px;outline:none;min-width:3ch;max-width:100%;box-sizing:content-box}
  .og-ed input:focus{background:rgba(232,89,12,.16)}
  .og-ed input.ins{border-bottom-style:dashed}
  .og-orig{font-size:.92rem;color:var(--muted);margin:-4px 0 12px}
  .og-orig s{color:var(--bad);text-decoration-thickness:2px}
  .og-ta{width:100%;box-sizing:border-box;font:inherit;font-size:1.05rem;padding:12px 14px;border:2px solid var(--line);border-radius:14px;background:var(--card);color:var(--ink);outline:none;resize:vertical;min-height:96px}
  .og-ta:focus{border-color:var(--blue)}
  .og-link{border:0;background:none;color:var(--blue);font-weight:700;cursor:pointer;padding:6px 0;font-size:.92rem}
  .og-link.mu{color:var(--muted)}
  .og-hero{text-align:center;padding-top:18px}
  .og-big{font-size:4.2rem;animation:ogPop .5s ease;line-height:1.1}
  @keyframes ogPop{0%{transform:scale(.3)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
  .og-hero h2{margin:8px 0 6px;font-size:1.35rem}
  .og-hero p{color:var(--muted);margin:0 0 16px}
  .og-secs{display:flex;flex-direction:column;gap:8px;text-align:left;margin:0 0 14px}
  .og-sec{display:flex;align-items:center;gap:12px;background:var(--card);border:2px solid var(--line);border-radius:14px;padding:11px 14px}
  .og-sec i{font-style:normal;font-size:1.3rem}.og-sec div{flex:1}.og-sec b{display:block}.og-sec span{font-size:.8rem;color:var(--muted)}
  .og-sec em{font-style:normal;font-weight:800;color:var(--muted);font-size:.85rem}.og-sec em.ok{color:var(--ok)}
  .og-res{display:flex;gap:10px;margin:0 0 16px}.og-res div{flex:1;border:2px solid var(--line);border-radius:14px;padding:12px 4px;background:var(--card)}
  .og-res b{display:block;font-size:1.15rem}.og-res span{font-size:.75rem;color:var(--muted)}
  .og-stk{background:linear-gradient(135deg,#FFEDD5,#FED7AA);color:#9A3412;border-radius:14px;padding:10px 12px;font-weight:800;margin:0 0 12px;text-align:center}
  html[data-theme="dark"] .og-stk{background:linear-gradient(135deg,#4A2A12,#5C3210);color:#FED7AA}
  .og-iz{background:var(--badbg);border-radius:12px;padding:10px 12px;margin:0 0 12px;font-size:.95rem}
  .og-toast{position:fixed;left:50%;top:70px;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:8px 14px;border-radius:10px;font-weight:700;font-size:.9rem;z-index:61;animation:ogIn .2s}
  @media (prefers-reduced-motion: reduce){.og-card,.og-big,.og-o.bad,.og-ch.miss{animation:none}}
  `;

  window.MQ_OYIN = function (ctx) {
    // ctx: {R, ans, KEY, TID, save(), send(ph, onOk, onErr), exit(), order(n, seed)}
    const R = ctx.R, M = R.me, ans = ctx.ans, ph = R.phase;
    if (!document.getElementById("ogCss")) { const st = document.createElement("style"); st.id = "ogCss"; st.textContent = CSS; document.head.appendChild(st); }
    try { const t = localStorage.getItem("kab_theme"); if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t); else if (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.setAttribute("data-theme", "dark"); } catch (e) {}
    let root = document.getElementById("og");
    if (!root) { root = document.createElement("div"); root.id = "og"; document.body.appendChild(root); }
    root.className = ""; document.documentElement.classList.add("og-lock");
    root.innerHTML = `<div class="og-hd"><button class="og-x" id="ogX" title="Ro'yxat ko'rinishi">✕</button><div class="og-pb"><i id="ogPb"></i></div><div class="og-cb" id="ogCb"></div></div><div class="og-body" id="ogB"></div><div class="og-ft" id="ogF"></div>`;
    const $ = id => document.getElementById(id), B = $("ogB"), F = $("ogF");
    $("ogX").onclick = close;
    function close() { root.className = "hide"; root.innerHTML = ""; document.documentElement.classList.remove("og-lock"); ctx.exit(); }

    ans.og = ans.og || {};                 // o'yin holati: xp, A tahrirlar, mashq natijalari
    const G = ans.og; G.xp = G.xp || 0; G.ae = G.ae || {}; G.full = G.full || {}; G.combo = G.combo || 0; G.best = G.best || 0; G.find = G.find || {};
    const instant = ["B", "C", "D"].every(k => (M[k] || []).every(x => x.h));
    const keyOf = (k, i) => { const x = M[k][i]; if (!x.h) return null; for (let j = 0; j < x.o.length; j++) if (H(ctx.TID + "|" + ctx.KEY + "|" + k + i + "|" + j) === x.h) return j; return null; };
    const has = (k, i) => ans[k][i] !== "" && ans[k][i] != null;
    const aDone = i => { const v = (ans.A[i] || "").trim(); return !!v && v !== M.A[i].s; };
    const wrongA = () => (R.f1 || []).map((x, i) => x && !x.ok ? i : -1).filter(i => i >= 0);
    const ruleOf = t => (M.rules || []).filter(r => r.type === t)[0];

    // ---------- qadamlar ----------
    let Q = [];
    if (ph === "retry") wrongA().forEach(i => Q.push({ t: "R", i }));
    else {
      (M.B || []).forEach((_, i) => Q.push({ t: "B", i }));
      (M.A || []).forEach((_, i) => Q.push({ t: "A", i }));
      (M.C || []).forEach((_, i) => Q.push({ t: "C", i }));
      (M.D || []).forEach((_, i) => Q.push({ t: "D", i }));
    }
    const TOT = Q.length;
    const doneStep = s => s.t === "A" ? aDone(s.i) : s.t === "R" ? isRetryDone(s.i) : has(s.t, s.i);
    function isRetryDone(i) { const v = (ans.A[i] || "").trim(); return !!v && v !== ((R.a1.A || [])[i] || "").trim(); }
    const doneN = () => Q.filter(doneStep).length;
    let review = [], inReview = false, shownTip = {}, cur = null;
    function prog() {
      $("ogPb").style.width = Math.round(100 * doneN() / Math.max(1, TOT)) + "%";
      $("ogCb").textContent = (G.combo >= 2 ? "🔥" + G.combo + " " : "") + "⭐" + G.xp;
    }
    function foot(html) { F.className = "og-ft"; F.innerHTML = html; }
    function toast(t) { const d = document.createElement("div"); d.className = "og-toast"; d.textContent = t; root.appendChild(d); setTimeout(() => d.remove(), 1600); }

    // ---------- boshlash ekrani ----------
    function hero() {
      const secs = ph === "retry"
        ? [["🔁", "2-urinish", wrongA().length + " ta gapni izohga qarab qayta to'g'rilaysiz", wrongA().filter(isRetryDone).length, wrongA().length]]
        : [["🧠", "Qoida bo'yicha", "Avval qoida, keyin variant tanlaysiz", (M.B || []).filter((_, i) => has("B", i)).length, (M.B || []).length],
           ["✍️", "Xatoni toping va to'g'rilang", "O'z essaylaringizdagi xatolar", (M.A || []).filter((_, i) => aDone(i)).length, (M.A || []).length],
           ["🔤", "O'zingiz adashgan so'zlar", "To'g'ri yozilishini tanlang", (M.C || []).filter((_, i) => has("C", i)).length, (M.C || []).length],
           ["📖", "Reading: sinonim", "Matndagi ma'nodoshini toping", (M.D || []).filter((_, i) => has("D", i)).length, (M.D || []).length]].filter(s => s[4]);
      const started = doneN() > 0;
      B.innerHTML = `<div class="og-card og-hero"><div class="og-big">${ph === "retry" ? "🔁" : "🎯"}</div><h2>${esc(R.name)}</h2>
        <p>${ph === "retry" ? "A bo'lim tekshirildi. ❌ belgili gaplarni yana bir bor to'g'rilang." : "Bu mashq sizning o'z xatolaringizdan tuzilgan. Fokus: <b>" + esc((M.focus || []).join(", ") || "grammatika") + "</b>"}</p>
        <div class="og-secs">${secs.map(s => `<div class="og-sec"><i>${s[0]}</i><div><b>${s[1]}</b><span>${s[2]}</span></div><em class="${s[3] === s[4] ? "ok" : ""}">${s[3]}/${s[4]}</em></div>`).join("")}</div>
        ${R.deadline ? `<p style="font-size:.85rem">⏰ Muddat: <b>${esc(R.deadline)}</b>${R.closed ? " · <span style='color:var(--bad)'>o'tib ketgan</span>" : ""}</p>` : ""}
        <button class="og-link mu" id="ogList">📋 Oddiy ro'yxat ko'rinishida ochish</button></div>`;
      foot(`<button class="og-btn or" id="ogGo"${R.closed && ph !== "retry" ? " disabled" : ""}>${started ? "Davom ettirish" : "Boshlash"}</button>`);
      $("ogList").onclick = close;
      $("ogGo").onclick = () => { fx("tap"); next(); };
      prog();
    }

    // ---------- navbat ----------
    function next() {
      if (!inReview) {
        const s = Q.find(x => !doneStep(x));
        if (s) return show(s);
        if (instant && review.length) { inReview = true; toast("🔁 Xatolarni yana bir bor ko'ramiz"); }
      }
      if (inReview && review.length) return show(review.shift(), true);
      finish();
    }
    function show(s, rev) {
      cur = s; prog(); B.scrollTop = 0;
      if (s.t === "B" && !rev && !shownTip[M.B[s.i].type] && ruleOf(M.B[s.i].type)) { shownTip[M.B[s.i].type] = 1; return tip(s); }
      if (s.t === "A" && s.i === 0 && !G.aIntro) return aIntro(s);
      if (s.t === "A") return cardA(s.i);
      if (s.t === "R") return cardR(s.i);
      return cardMC(s.t, s.i, rev);
    }
    function tip(s) {
      const r = ruleOf(M.B[s.i].type);
      B.innerHTML = `<div class="og-card"><span class="og-tag">💡 Maslahat</span><div class="og-q">${esc(r.type)}</div><div class="og-rule">${esc(r.rule)}</div><p class="og-sub" style="margin-top:4px">Qoidani o'qib chiqing, keyingi savollar shu haqida.</p></div>`;
      foot(`<button class="og-btn" id="ogN">Tushundim</button>`);
      $("ogN").onclick = () => { fx("tap"); cardMC("B", s.i); };
    }
    function aIntro(s) {
      B.innerHTML = `<div class="og-card og-hero"><div class="og-big">🕵️</div><h2>Xatoni toping!</h2><p>Endi sizning essaylaringizdagi xatolarga o'xshash gaplar.<br><b>1.</b> Xato so'zni bosing. <b>2.</b> O'sha joyda to'g'risini yozing.<br>Bu qismni ustoz tekshiradi.</p></div>`;
      foot(`<button class="og-btn or" id="ogN">Boshladik</button>`);
      $("ogN").onclick = () => { G.aIntro = 1; ctx.save(); fx("tap"); cardA(s.i); };
    }

    // ---------- B / C / D: variant tanlash ----------
    function cardMC(k, i, rev) {
      const x = M[k][i], ord = ctx.order(x.o.length, ctx.KEY + k + i);
      const lab = { B: ["🧠 Qoida", "To'g'ri variantni tanlang"], C: ["🔤 O'z so'zingiz", "Qaysi biri to'g'ri yozilgan?"], D: ["📖 Reading sinonim", "Matnda shu ma'no boshqa so'z bilan berilgan. Qaysi biri?"] }[k];
      const q = k === "D" ? `<div class="og-q" style="font-size:1.5rem;text-align:center;margin:10px 0 18px">${esc(x.q)} = ?</div>` : `<div class="og-ex">${esc(x.q).replace(/_{2,}/, '<span class="og-gap">?</span>')}</div>`;
      B.innerHTML = `<div class="og-card"><span class="og-tag">${lab[0]}</span>${x.type && k === "B" ? `<span class="og-tag or">${esc(x.type)}</span>` : ""}${rev ? `<span class="og-tag or">🔁 Takror</span>` : ""}
        <div class="og-sub" style="margin:0 0 10px">${lab[1]}</div>${q}
        <div class="og-opts">${ord.map((j, n) => `<button class="og-o" data-j="${j}"><kbd>${n + 1}</kbd><span>${esc(x.o[j])}</span></button>`).join("")}</div></div>`;
      let val = null;
      foot(`<button class="og-btn" id="ogK" disabled>Tekshirish</button>`);
      B.querySelectorAll(".og-o").forEach(b => b.onclick = () => { B.querySelectorAll(".og-o").forEach(o => o.classList.remove("sel")); b.classList.add("sel"); val = +b.dataset.j; $("ogK").disabled = false; fx("tap"); });
      $("ogK").onclick = () => {
        if (val == null) return;
        B.querySelectorAll(".og-o").forEach(o => o.disabled = true);
        if (!rev) { ans[k][i] = val; }
        const key = keyOf(k, i);
        if (key == null) {   // kalit yo'q: javob saqlanadi, natija oxirida
          G.xp += 5; ctx.save(); prog(); fx("tap");
          return goNext();
        }
        const ok = val === key, kb = B.querySelector(`.og-o[data-j="${key}"]`), vb = B.querySelector(`.og-o[data-j="${val}"]`);
        kb && kb.classList.add("ok"); if (!ok && vb) { vb.classList.remove("sel"); vb.classList.add("bad"); }
        if (!rev) {
          if (ok) { G.combo++; G.best = Math.max(G.best, G.combo); G.xp += 10 + (G.combo >= 5 ? 5 : 0); }
          else { G.combo = 0; review.push({ t: k, i }); }
        } else if (!ok) review.push({ t: k, i });
        ctx.save(); prog(); fx(ok ? "ok" : "bad");
        const r = k === "B" ? ruleOf(x.type) : null;
        const praise = ["Barakalla!", "Zo'r!", "To'g'ri!", "Ajoyib!", "Mana bu boshqa gap!"][Math.floor(Math.random() * 5)];
        F.className = "og-ft " + (ok ? "ok" : "bad");
        F.innerHTML = `<div class="og-fb"><div class="og-fh">${ok ? "✅ " + praise + (G.combo >= 3 && !rev ? " 🔥" + G.combo : "") : "❌ Xato"}</div>
          ${ok ? "" : `<div class="og-fa">To'g'ri javob: ${esc(x.o[key])}</div>`}
          ${!ok && r ? `<div class="og-fn">💡 ${esc(r.rule)}</div>` : ""}${!ok && !rev ? `<div class="og-fn">Bu savol oxirida yana bir marta chiqadi (ballga ta'sir qilmaydi).</div>` : ""}</div>
          <button class="og-btn" id="ogN">Davom etish</button>`;
        $("ogN").onclick = goNext;
      };
    }
    function goNext() { fx("tap"); next(); }

    // ---------- A: xatoni topish va to'g'rilash ----------
    function spans(x) {
      let pos = 0; const out = [];
      (x.hl || []).slice().sort((p, q) => p[0] - q[0]).forEach(([st, ln, t]) => { if (st < pos) return; out.push({ st, ln, t }); pos = st + ln; });
      return out;
    }
    function cardA(i) {
      const x = M.A[i], sp = spans(x), xs = sp.filter(s => s.t !== "ins");
      if (G.full[i] || !sp.length) return editA(i, true);
      const F_ = G.find[i] || (G.find[i] = { hit: [], miss: 0 });
      if (!xs.length || F_.hit.length >= xs.length || F_.miss >= 2) return editA(i);
      const toks = []; x.s.replace(/\S+/g, (w, at) => { toks.push({ w, at, e: at + w.length }); return w; });
      const spanOf = tk => xs.findIndex(s => tk.at < s.st + Math.max(1, s.ln) && tk.e > s.st);
      B.innerHTML = `<div class="og-card"><span class="og-tag">✍️ A${i + 1} · Xatoni toping</span><span class="og-tag or">${esc(x.type)}</span>
        <div class="og-q">Xato so'zni bosing${xs.length > 1 ? ` <span style="color:var(--muted);font-size:.95rem">(${xs.length} ta joy)</span>` : ""}</div>
        <div class="og-chips">${toks.map((t, n) => `<button class="og-ch${F_.hit.indexOf(spanOf(t)) >= 0 && spanOf(t) >= 0 ? " hit" : ""}" data-n="${n}">${esc(t.w)}</button>`).join("")}</div>
        <p class="og-sub" id="ogHint" style="margin-top:2px">${F_.miss ? "Yana bir urinib ko'ring." : ""}</p></div>`;
      foot(`<button class="og-btn alt" id="ogShow">🙈 Ko'rsatib qo'ying</button>`);
      $("ogShow").onclick = () => { F_.miss = 2; ctx.save(); editA(i); };
      B.querySelectorAll(".og-ch").forEach(b => b.onclick = () => {
        const si = spanOf(toks[+b.dataset.n]);
        if (si >= 0) {
          if (F_.hit.indexOf(si) < 0) F_.hit.push(si);
          B.querySelectorAll(".og-ch").forEach(c => { if (spanOf(toks[+c.dataset.n]) === si) c.classList.add("hit"); });
          fx("ok"); ctx.save();
          if (F_.hit.length >= xs.length) { if (!F_.miss) G.xp += 5; ctx.save(); prog(); setTimeout(() => editA(i), 450); }
        } else {
          F_.miss++; b.classList.remove("miss"); void b.offsetWidth; b.classList.add("miss"); fx("bad"); ctx.save();
          if (F_.miss >= 2) {
            B.querySelectorAll(".og-ch").forEach(c => { c.disabled = true; if (spanOf(toks[+c.dataset.n]) >= 0) c.classList.add("show"); });
            $("ogHint").textContent = "Xato joy qizil chiziq bilan ko'rsatildi.";
            setTimeout(() => editA(i), 1100);
          } else $("ogHint").textContent = "Bu so'z to'g'ri. Yana bir urinib ko'ring.";
        }
      });
    }
    function compose(x, sp, vals) {
      let out = "", pos = 0;
      sp.forEach((s, n) => {
        out += x.s.slice(pos, s.st);
        const v = (vals[n] == null ? (s.t === "ins" ? "" : x.s.substr(s.st, s.ln)) : vals[n]).trim();
        out += s.t === "ins" ? (v ? v + " " : "") : v;
        pos = s.st + s.ln;
      });
      out += x.s.slice(pos);
      return out.replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
    }
    function editA(i, full) {
      const x = M.A[i], sp = spans(x);
      const vals = G.ae[i] || (G.ae[i] = sp.map(s => s.t === "ins" ? "" : x.s.substr(s.st, s.ln)));
      let body;
      if (full) {
        body = `<div class="og-orig">Asl gap: ${hlOrig(x, sp)}</div><textarea class="og-ta" id="ogTa" placeholder="To'g'ri gapni to'liq yozing…">${esc(ans.A[i] && G.full[i] ? ans.A[i] : compose(x, sp, vals))}</textarea>`;
      } else {
        let h = "", pos = 0;
        sp.forEach((s, n) => {
          h += esc(x.s.slice(pos, s.st));
          const v = vals[n] || "", w = Math.max(3, (v || "").length + 1);
          h += `<input data-n="${n}" class="${s.t === "ins" ? "ins" : ""}" value="${esc(v)}" placeholder="${s.t === "ins" ? "‸" : ""}" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:${w}ch">` + (s.t === "ins" ? " " : "");
          pos = s.st + s.ln;
        });
        h += esc(x.s.slice(pos));
        body = `<div class="og-ed">${h}</div><div class="og-orig">Asl gap: ${hlOrig(x, sp)}</div>
          <button class="og-link" id="ogFull">✏️ Gapni boshqacha tuzmoqchiman (butun gapni yozish)</button>`;
      }
      B.innerHTML = `<div class="og-card"><span class="og-tag">✍️ A${i + 1} · To'g'rilang</span><span class="og-tag or">${esc(x.type)}</span>
        <div class="og-q">${full ? "Gapni to'g'ri holda yozing" : "Belgilangan joyda to'g'risini yozing"}</div>${sp.some(s => s.t === "ins") && !full ? `<p class="og-sub">Punktir katak = bu yerda so'z tushib qolgan.</p>` : ""}${body}</div>`;
      foot(`<div class="og-two"><button class="og-btn alt" id="ogL">Keyinroq</button><button class="og-btn" id="ogK">Saqlash</button></div>`);
      const inputs = B.querySelectorAll(".og-ed input");
      inputs.forEach(inp => inp.oninput = () => { vals[+inp.dataset.n] = inp.value; inp.style.width = Math.max(3, inp.value.length + 1) + "ch"; ctx.save(); });
      if (inputs[0]) setTimeout(() => { try { inputs[0].focus(); inputs[0].setSelectionRange(0, inputs[0].value.length); } catch (e) {} }, 60);
      if ($("ogTa")) { const ta = $("ogTa"); ta.oninput = () => ctx.save(); setTimeout(() => ta.focus(), 60); }
      if ($("ogFull")) $("ogFull").onclick = () => { G.full[i] = 1; ans.A[i] = compose(x, sp, vals); ctx.save(); editA(i, true); };
      $("ogL").onclick = () => { fx("tap"); const s = Q.splice(Q.findIndex(q => q.t === "A" && q.i === i), 1)[0]; Q.push(s); next(); };
      $("ogK").onclick = () => {
        const v = full ? $("ogTa").value.replace(/\s+/g, " ").trim() : compose(x, sp, vals);
        if (!v || v === x.s) { fx("bad"); toast("Gap o'zgarmadi. Xato joyni to'g'rilang."); return; }
        ans.A[i] = v; G.xp += 5; ctx.save(); prog(); fx("ok");
        F.className = "og-ft inf";
        F.innerHTML = `<div class="og-fb"><div class="og-fh">✍️ Saqlandi</div><div class="og-fa">${esc(v)}</div><div class="og-fn">Bu gapni ustoz tekshiradi. Natija kabinetga keladi.</div></div><button class="og-btn" id="ogN">Davom etish</button>`;
        $("ogN").onclick = goNext;
      };
    }
    function hlOrig(x, sp) {
      let h = "", pos = 0;
      sp.forEach(s => { h += esc(x.s.slice(pos, s.st)); h += s.t === "ins" ? '<b style="color:var(--bad)">‸</b>' : "<s>" + esc(x.s.substr(s.st, s.ln)) + "</s>"; pos = s.st + s.ln; });
      return h + esc(x.s.slice(pos));
    }

    // ---------- 2-urinish ----------
    function cardR(i) {
      const x = M.A[i], sp = spans(x), v1 = (R.a1.A || [])[i] || "", f = (R.f1 || [])[i] || {};
      B.innerHTML = `<div class="og-card"><span class="og-tag">🔁 A${i + 1} · 2-urinish</span><span class="og-tag or">${esc(x.type)}</span>
        <div class="og-orig">Asl gap: ${hlOrig(x, sp)}</div>
        <div class="og-q" style="font-size:1rem">Siz yozgansiz:</div><div class="og-ex" style="font-size:1rem">${esc(v1)}</div>
        ${f.iz ? `<div class="og-iz">💬 <b>Ustoz izohi:</b> ${esc(f.iz)}</div>` : ""}
        <textarea class="og-ta" id="ogTa" placeholder="Izohga qarab qayta yozing…">${esc(ans.A[i] != null ? ans.A[i] : v1)}</textarea></div>`;
      foot(`<button class="og-btn" id="ogK">Saqlash</button>`);
      const ta = $("ogTa"); ta.oninput = () => { ans.A[i] = ta.value; ctx.save(); };
      $("ogK").onclick = () => {
        const v = ta.value.replace(/\s+/g, " ").trim();
        if (!v || v === v1.trim()) { fx("bad"); toast("Gap o'zgarmadi. Izohga qarab to'g'rilang."); return; }
        ans.A[i] = v; G.xp += 5; ctx.save(); prog(); fx("ok"); next();
      };
    }

    // ---------- yakun va topshirish ----------
    function finish() {
      prog(); $("ogPb").style.width = "100%"; fx("end");
      let okN = 0, n = 0;
      if (instant && ph !== "retry") ["B", "C", "D"].forEach(k => (M[k] || []).forEach((_, i) => { n++; if (ans[k][i] === keyOf(k, i)) okN++; }));
      const nA = ph === "retry" ? wrongA().length : (M.A || []).length;
      B.innerHTML = `<div class="og-card og-hero"><div class="og-big">🏆</div><h2>${ph === "retry" ? "2-urinish tayyor!" : "Mashq tugadi!"}</h2><p>Endi topshiring, shunda natija ustozga boradi.</p>
        ${G.best >= 5 ? `<div class="og-stk">🔥 Eng uzun seriya: ${G.best} ta ketma-ket to'g'ri</div>` : ""}
        <div class="og-res">${n ? `<div><b>${okN}/${n}</b><span>B·C·D to'g'ri</span></div>` : ""}<div><b>${nA}</b><span>gap ustozga</span></div><div><b>⭐${G.xp}</b><span>ball</span></div></div>
        <button class="og-link mu" id="ogList">📋 Javoblarni ro'yxatda ko'rib chiqish</button></div>`;
      foot(`<button class="og-btn or" id="ogS">📤 ${ph === "retry" ? "2-urinishni yuborish" : "Topshirish"}</button>`);
      $("ogList").onclick = close;
      $("ogS").onclick = () => {
        const b = $("ogS"); b.disabled = true; b.textContent = "Yuborilmoqda…";
        ctx.send(ph, () => { root.className = "hide"; root.innerHTML = ""; document.documentElement.classList.remove("og-lock"); },
          err => { b.disabled = false; b.textContent = "📤 Qayta urinish"; toast(err || "Internet xatosi. Javoblar saqlangan."); });
      };
    }

    hero();
  };
})();
