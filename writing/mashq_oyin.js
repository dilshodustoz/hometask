// 🎮 Mening mashqim v3: Duolingo uslubidagi o'yin (2026-11-26). Faqat me.v === 3 mashqlar uchun.
// To'g'ri javob bermaguncha keyingi kartaga o'tilmaydi; 3 xatoda yordam (hint); adashgan karta 4 kartadan keyin yana chiqadi.
// A: xato so'zni topish -> to'g'risini tanlash -> keyinroq o'zi yozish. Hammasi darhol, shifrlangan kalit (h, ah) bilan tekshiriladi: AI va 2-urinish yo'q.
// Natija: ans.st = {v:3, n, first, pct, miss} (ball = birinchi urinishda to'g'ri kartalar foizi).
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
  const CSS3 = `
  .og-o.no{border-color:var(--bad);background:var(--badbg);opacity:.55;text-decoration:line-through;animation:ogSh .3s}
  .og-ed .og-slot{display:inline-block;min-width:4ch;border-bottom:3px solid var(--primary);color:var(--primary);font-weight:800;text-align:center;line-height:1.3;padding:0 4px}
  .og-ed .og-slot.done{border-bottom-color:var(--ok);color:var(--ok)}
  .og-ed .og-slot.cur{background:rgba(232,89,12,.12);border-radius:6px 6px 0 0}
  .og-ed input.no{border-bottom-color:var(--bad);color:var(--bad);background:var(--badbg);animation:ogSh .3s}
  .og-ed input.ok{border-bottom-color:var(--ok);color:var(--ok);background:var(--okbg)}
  .og-hint{background:rgba(250,204,21,.16);border:2px dashed #EAB308;border-radius:14px;padding:10px 12px;margin:0 0 12px;font-size:.95rem}
  .og-hint b{color:#A16207}html[data-theme="dark"] .og-hint b{color:#FDE047}
  .og-miss{display:flex;gap:5px;justify-content:center;margin:2px 0 10px}.og-miss i{width:9px;height:9px;border-radius:50%;background:var(--line)}.og-miss i.on{background:var(--bad)}
  .og-tops{text-align:left;background:var(--card);border:2px solid var(--line);border-radius:14px;padding:10px 14px;margin:0 0 14px;font-size:.92rem}
  .og-tops div{display:flex;justify-content:space-between;gap:8px;padding:3px 0}.og-tops span{color:var(--muted)}
  `;

  window.MQ_OYIN = function (ctx) {
    // ctx: {R, ans, KEY, TID, save(), send(ph, onOk, onErr, extra), exit(), order(n, seed)}
    const R = ctx.R, M = R.me, ans = ctx.ans;
    for (const [id, css] of [["ogCss", CSS], ["ogCss3", CSS3]]) if (!document.getElementById(id)) { const st = document.createElement("style"); st.id = id; st.textContent = css; document.head.appendChild(st); }
    try { const t = localStorage.getItem("kab_theme"); if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t); else if (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.setAttribute("data-theme", "dark"); } catch (e) {}
    let root = document.getElementById("og");
    if (!root) { root = document.createElement("div"); root.id = "og"; document.body.appendChild(root); }
    root.className = ""; document.documentElement.classList.add("og-lock");
    root.innerHTML = `<div class="og-hd"><button class="og-x" id="ogX" title="Chiqish">✕</button><div class="og-pb"><i id="ogPb"></i></div><div class="og-cb" id="ogCb"></div></div><div class="og-body" id="ogB"></div><div class="og-ft" id="ogF"></div>`;
    const $ = id => document.getElementById(id), B = $("ogB"), F = $("ogF");
    $("ogX").onclick = close;
    function close() { root.className = "hide"; root.innerHTML = ""; document.documentElement.classList.remove("og-lock"); ctx.exit(); }

    // ---------- yordamchilar ----------
    const norm = (s, cs) => { s = String(s || "").replace(/[’‘`]/g, "'").replace(/\s+/g, " ").trim().replace(/[.!?]+$/, ""); return cs ? s : s.toLowerCase(); };
    const seed = tail => ctx.TID + "|" + ctx.KEY + "|" + tail;
    const okIdx = (k, i, j) => H(seed(k + i + "|" + j)) === M[k][i].h;
    const keyOf = (k, i) => { for (let j = 0; j < M[k][i].o.length; j++) if (okIdx(k, i, j)) return j; return -1; };
    const okText = (tag, txt, ah, cs) => ah.indexOf(H(seed(tag + "|" + norm(txt, cs)))) >= 0;
    const spOk = (i, n, txt) => { const s = M.A[i].sp[n]; return okText("A" + i + "." + n, txt, s.ah, s.cs); };
    const spAns = (i, n) => { const s = M.A[i].sp[n]; return s.o.find(o => spOk(i, n, o)) || ""; };
    const cWord = i => M.C[i].o[keyOf("C", i)] || "";
    const shuf = (a, sd) => ctx.order(a.length, sd).map(j => a[j]);
    const ruleOf = t => (M.rules || []).filter(r => r.type === t)[0];
    const praise = () => ["Barakalla!", "Zo'r!", "To'g'ri!", "Ajoyib!", "Mana bu boshqa gap!"][Math.floor(Math.random() * 5)];
    const dots = m => `<div class="og-miss">${[0, 1, 2].map(n => `<i class="${m > n ? "on" : ""}"></i>`).join("")}</div>`;
    function compose(i, vals) {
      const x = M.A[i]; let out = "", pos = 0;
      x.sp.forEach((s, n) => { out += x.s.slice(pos, s.st); const v = (vals[n] || "").trim(); out += s.t === "ins" ? (v ? v + " " : "") : v; pos = s.st + s.ln; });
      return (out + x.s.slice(pos)).replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
    }

    // ---------- holat ----------
    ans.og3 = ans.og3 || {};
    const G = ans.og3; G.xp = G.xp || 0; G.combo = G.combo || 0; G.best = G.best || 0; G.first = G.first || {}; G.miss = G.miss || {}; G.done = G.done || {}; G.extra = G.extra || [];
    // navbat: B (qoida kartasi bilan) -> A (topish+tanlash, 3 kartadan keyin yozish) -> C (tanlash, keyin yozish) -> D
    let Q = [];
    (M.B || []).forEach((_, i) => Q.push("B" + i));
    const nA = (M.A || []).length, lagA = [];
    for (let i = 0; i < nA; i++) { Q.push("Af" + i); lagA.push("At" + i); if (i >= 1) Q.push(lagA.shift()); }
    Q.push(...lagA);
    const nC = (M.C || []).length, lagC = [];
    for (let i = 0; i < nC; i++) { Q.push("Cm" + i); lagC.push("Ct" + i); if (i >= 1) Q.push(lagC.shift()); }
    Q.push(...lagC);
    (M.D || []).forEach((_, i) => Q.push("D" + i));
    const BASE = Q.length;
    Q.push(...G.extra);   // qayta chiqadigan kartalar (qayta yuklanganda ham)
    let pos = 0, shownTip = {};
    const doneN = () => Object.keys(G.done).length;
    function prog() {
      const tot = BASE + G.extra.length;
      $("ogPb").style.width = Math.round(100 * Math.min(1, doneN() / Math.max(1, tot))) + "%";
      $("ogCb").textContent = (G.combo >= 2 ? "🔥" + G.combo + " " : "") + "⭐" + G.xp;
    }
    function toast(t) { const d = document.createElement("div"); d.className = "og-toast"; d.textContent = t; root.appendChild(d); setTimeout(() => d.remove(), 1700); }
    // karta yakuni: birinchi urinishda to'g'ri bo'lmasa, 4 kartadan keyin yana chiqadi (to'g'ri yechilmaguncha, ko'pi bilan 3 marta)
    function resolve(id, miss) {
      const rep = id.indexOf("~") > 0, base = id.split("~")[0];
      if (!rep && !(base in G.first)) G.first[base] = !miss;
      G.miss[base] = (G.miss[base] || 0) + miss;
      if (miss) {
        G.combo = 0;
        const n = (id.split("~")[1] | 0) + 1;
        if (n <= 6) { const nid = base + "~" + n; G.extra.push(nid); Q.splice(Math.min(Q.length, pos + 4), 0, nid); }
      } else { G.combo++; G.best = Math.max(G.best, G.combo); G.xp += rep ? 5 : 10 + (G.combo >= 5 ? 5 : 0); }
      G.done[id] = 1; ctx.save(); prog();
    }
    function okFoot(id, miss, extraHtml) {
      fx(miss ? "tap" : "ok");
      F.className = "og-ft ok";
      F.innerHTML = `<div class="og-fb"><div class="og-fh">✅ ${miss ? "To'g'ri, endi o'tdingiz" : praise()}${!miss && G.combo >= 3 ? " 🔥" + G.combo : ""}</div>${extraHtml || ""}${miss ? `<div class="og-fn">Bu savol keyinroq yana chiqadi.</div>` : ""}</div><button class="og-btn" id="ogN">Davom etish</button>`;
      $("ogN").onclick = () => { fx("tap"); pos++; next(); };
    }
    function badFoot(msg) { fx("bad"); F.className = "og-ft bad"; F.innerHTML = `<div class="og-fb"><div class="og-fh">❌ ${msg || "Xato. Yana urinib ko'ring."}</div></div>`; }

    // ---------- boshlash ----------
    function hero() {
      const started = doneN() > 0, cnt = k => (M[k] || []).length;
      B.innerHTML = `<div class="og-card og-hero"><div class="og-big">🎯</div><h2>${esc(R.name)}</h2>
        <p>Bu mashq sizning o'z xatolaringizdan tuzilgan. Fokus: <b>${esc((M.focus || []).join(", ") || "grammatika")}</b></p>
        <div class="og-secs">
          ${cnt("B") ? `<div class="og-sec"><i>🧠</i><div><b>Qoida bo'yicha</b><span>Qoida, keyin variant</span></div><em>${cnt("B")}</em></div>` : ""}
          ${nA ? `<div class="og-sec"><i>✍️</i><div><b>Xatoni toping, tanlang, yozing</b><span>O'z essaylaringizdagi xatolar</span></div><em>${nA}</em></div>` : ""}
          ${nC ? `<div class="og-sec"><i>🔤</i><div><b>O'z so'zlaringiz</b><span>Tanlang, keyin o'zingiz yozing</span></div><em>${nC}</em></div>` : ""}
          ${cnt("D") ? `<div class="og-sec"><i>📖</i><div><b>Reading: sinonim</b><span>Ma'nodoshini toping</span></div><em>${cnt("D")}</em></div>` : ""}
        </div>
        <div class="og-hint" style="text-align:left">🕹 <b>Qoida:</b> xato javob bersangiz, savol bir necha kartadan keyin qaytadi va to'g'ri topmaguncha qaytaveradi. Yozish kartalarida to'g'ri yozmaguncha o'tolmaysiz, 3 xatodan keyin yordam chiqadi.</div>
        ${R.deadline ? `<p style="font-size:.85rem">⏰ Muddat: <b>${esc(R.deadline)}</b>${R.closed ? " · <span style='color:var(--bad)'>o'tib ketgan</span>" : ""}</p>` : ""}</div>`;
      F.className = "og-ft"; F.innerHTML = `<button class="og-btn or" id="ogGo"${R.closed ? " disabled" : ""}>${started ? "Davom ettirish" : "Boshlash"}</button>`;
      $("ogGo").onclick = () => { fx("tap"); next(); };
      prog();
    }
    function next() {
      while (pos < Q.length && G.done[Q[pos]]) pos++;
      if (pos >= Q.length) return finish();
      const id = Q[pos], base = id.split("~")[0], rep = id.indexOf("~") > 0;
      B.scrollTop = 0; prog();
      const m = base.match(/^(B|D|Af|At|Cm|Ct)(\d+)$/), k = m[1], i = +m[2];
      if (k === "B" && !rep && !shownTip[M.B[i].type] && ruleOf(M.B[i].type)) { shownTip[M.B[i].type] = 1; return tip(id, i); }
      if (k === "Af" && i === 0 && !G.aIntro) return aIntro(id);
      if (k === "B" || k === "D" || k === "Cm") return mc(id, k === "Cm" ? "C" : k, i, rep);
      if (k === "Af") return rep ? choose(id, i, rep) : find(id, i);
      if (k === "At") return typeA(id, i, rep);
      if (k === "Ct") return typeC(id, i, rep);
    }
    function tip(id, i) {
      const r = ruleOf(M.B[i].type);
      B.innerHTML = `<div class="og-card"><span class="og-tag">💡 Qoida</span><div class="og-q">${esc(r.type)}</div><div class="og-rule">${esc(r.rule)}</div><p class="og-sub" style="margin-top:4px">O'qib chiqing: keyingi savollar shu haqida.</p></div>`;
      F.className = "og-ft"; F.innerHTML = `<button class="og-btn" id="ogN">Tushundim</button>`;
      $("ogN").onclick = () => { fx("tap"); mc(id, "B", i, false); };
    }
    function aIntro(id) {
      B.innerHTML = `<div class="og-card og-hero"><div class="og-big">🕵️</div><h2>Endi o'z xatolaringiz</h2><p>Har bir gapda siz essaylaringizda qilgan xato bor.<br><b>1.</b> Xato so'zni toping. <b>2.</b> To'g'risini tanlang.<br><b>3.</b> Bir ozdan keyin o'sha gapni o'zingiz to'g'rilab yozasiz.</p></div>`;
      F.className = "og-ft"; F.innerHTML = `<button class="og-btn or" id="ogN">Boshladik</button>`;
      $("ogN").onclick = () => { G.aIntro = 1; ctx.save(); fx("tap"); next(); };
    }

    // ---------- B / C / D: variant tanlash (to'g'ri topmaguncha) ----------
    function mc(id, k, i, rep) {
      const x = M[k][i], ord = ctx.order(x.o.length, ctx.KEY + k + i + (rep ? id : ""));
      const lab = { B: ["🧠 Qoida", "To'g'ri variantni tanlang"], C: ["🔤 O'z so'zingiz", "Qaysi biri to'g'ri yozilgan?"], D: ["📖 Reading sinonim", "Matnda shu ma'no boshqa so'z bilan berilgan. Qaysi biri?"] }[k];
      const q = k === "D" ? `<div class="og-q" style="font-size:1.5rem;text-align:center;margin:10px 0 18px">${esc(x.q)} = ?</div>` : `<div class="og-ex">${esc(x.q).replace(/_{2,}/, '<span class="og-gap">?</span>')}</div>`;
      let miss = 0;
      const draw = () => {
        B.innerHTML = `<div class="og-card"><span class="og-tag">${lab[0]}</span>${x.type && k === "B" ? `<span class="og-tag or">${esc(x.type)}</span>` : ""}${rep ? `<span class="og-tag or">🔁 Takror</span>` : ""}
          <div class="og-sub" style="margin:0 0 10px">${lab[1]}</div>${q}<div id="ogH"></div>
          <div class="og-opts">${ord.map((j, n) => `<button class="og-o" data-j="${j}"><kbd>${n + 1}</kbd><span>${esc(x.o[j])}</span></button>`).join("")}</div></div>`;
        F.className = "og-ft"; F.innerHTML = `<div class="og-fn" style="text-align:center">Variantni bosing</div>`;
        B.querySelectorAll(".og-o").forEach(b => b.onclick = () => pick(b));
      };
      const pick = b => {
        const j = +b.dataset.j;
        if (okIdx(k, i, j)) {
          B.querySelectorAll(".og-o").forEach(o => o.disabled = true); b.classList.add("ok");
          if (!rep) ans[k][i] = j;
          resolve(id, miss);
          return okFoot(id, miss, miss && k === "B" && ruleOf(x.type) ? `<div class="og-fn">💡 ${esc(ruleOf(x.type).rule)}</div>` : "");
        }
        // xato: to'g'ri javob ko'rsatiladi, savol keyinroq aralashtirilgan variantlar bilan qaytadi (to'g'ri topmaguncha)
        miss++; b.classList.add("bad");
        B.querySelectorAll(".og-o").forEach(o => { o.disabled = true; if (okIdx(k, i, +o.dataset.j)) o.classList.add("ok"); });
        resolve(id, miss);
        const r = k === "B" ? ruleOf(x.type) : null;
        fx("bad"); F.className = "og-ft bad";
        F.innerHTML = `<div class="og-fb"><div class="og-fh">❌ Xato</div><div class="og-fa">To'g'ri javob: ${esc(x.o[keyOf(k, i)])}</div>${r ? `<div class="og-fn">💡 ${esc(r.rule)}</div>` : ""}<div class="og-fn">🔁 Bu savol bir necha kartadan keyin yana chiqadi: o'shanda to'g'ri topishingiz kerak.</div></div><button class="og-btn" id="ogN">Tushundim</button>`;
        $("ogN").onclick = () => { fx("tap"); pos++; next(); };
      };
      draw();
    }

    // ---------- A1: xatoni topish ----------
    function find(id, i) {
      const x = M.A[i], xs = x.sp.map((s, n) => ({ s, n })).filter(o => o.s.t !== "ins");
      if (!xs.length) return choose(id, i, false);
      const toks = []; x.s.replace(/\S+/g, (w, at) => { toks.push({ w, at, e: at + w.length }); return w; });
      const spanOf = tk => { const f = xs.find(o => tk.at < o.s.st + Math.max(1, o.s.ln) && tk.e > o.s.st); return f ? f.n : -1; };
      const hit = []; let miss = 0;
      B.innerHTML = `<div class="og-card"><span class="og-tag">✍️ ${i + 1}-gap · 1-qadam</span><span class="og-tag or">${esc(x.type)}</span>
        <div class="og-q">Xato so'zni bosing${xs.length > 1 ? ` <span style="color:var(--muted);font-size:.95rem">(${xs.length} ta joy)</span>` : ""}</div>
        <div class="og-chips">${toks.map((t, n) => `<button class="og-ch" data-n="${n}">${esc(t.w)}</button>`).join("")}</div><div id="ogH"></div></div>`;
      F.className = "og-ft"; F.innerHTML = `<div class="og-fn" style="text-align:center">Xato bor so'zni bosing</div>`;
      B.querySelectorAll(".og-ch").forEach(b => b.onclick = () => {
        const si = spanOf(toks[+b.dataset.n]);
        if (si >= 0) {
          if (hit.indexOf(si) < 0) hit.push(si);
          B.querySelectorAll(".og-ch").forEach(c => { if (spanOf(toks[+c.dataset.n]) === si) { c.classList.add("hit"); c.disabled = true; } });
          fx("ok");
          if (hit.length >= xs.length) { G.findMiss = G.findMiss || {}; G.findMiss[i] = miss; ctx.save(); setTimeout(() => choose(id, i, false, miss), 500); }
        } else {
          miss++; b.classList.remove("miss"); void b.offsetWidth; b.classList.add("miss"); badFoot("Bu so'z to'g'ri. Boshqasini toping.");
          if (miss >= 3) {
            B.querySelectorAll(".og-ch").forEach(c => { if (spanOf(toks[+c.dataset.n]) >= 0 && !c.disabled) c.classList.add("show"); });
            $("ogH").innerHTML = `<div class="og-hint">💡 <b>Yordam:</b> xato joy qizil to'lqin chiziq bilan belgilandi. Endi o'sha so'zni bosing.</div>`;
          }
        }
      });
    }
    // ---------- A2: to'g'risini tanlash (har bir joy uchun) ----------
    function choose(id, i, rep, missIn) {
      const x = M.A[i]; let n = 0, miss = missIn || 0, spMiss = 0; const vals = [];
      const draw = () => {
        let h = "", p = 0;
        x.sp.forEach((s, k) => {
          h += esc(x.s.slice(p, s.st));
          if (k < n) h += `<span class="og-slot done">${esc(vals[k])}</span>` + (s.t === "ins" ? " " : "");
          else if (k === n) h += `<span class="og-slot cur">${s.t === "ins" ? "‸ ?" : "?"}</span>` + (s.t === "ins" ? " " : "");
          else h += s.t === "ins" ? "" : `<s style="color:var(--bad)">${esc(x.s.substr(s.st, s.ln))}</s>`;
          p = s.st + s.ln;
        });
        h += esc(x.s.slice(p));
        const s = x.sp[n], orig = s.t === "ins" ? "bu yerda so'z tushib qolgan" : `"${x.s.substr(s.st, s.ln)}" o'rniga`;
        B.innerHTML = `<div class="og-card"><span class="og-tag">✍️ ${i + 1}-gap · ${rep ? "🔁 Takror" : "2-qadam"}</span><span class="og-tag or">${esc(x.type)}</span>
          <div class="og-q">To'g'risini tanlang <span style="color:var(--muted);font-size:.9rem;font-weight:600">(${esc(orig)})</span></div>
          <div class="og-ed">${h}</div><div id="ogH">${spMiss >= 2 && x.izoh ? `<div class="og-hint">💡 <b>Yordam:</b> ${esc(x.izoh)}</div>` : ""}</div>
          <div class="og-opts">${shuf(s.o, ctx.KEY + id + n).map((o, m) => `<button class="og-o" data-v="${esc(o)}"><kbd>${m + 1}</kbd><span>${esc(o)}</span></button>`).join("")}</div></div>`;
        F.className = "og-ft"; F.innerHTML = `<div class="og-fn" style="text-align:center">${x.sp.length > 1 ? `${n + 1}-joy (${x.sp.length} tadan)` : "Variantni bosing"}</div>`;
        B.querySelectorAll(".og-o").forEach(b => b.onclick = () => {
          const v = b.dataset.v;
          if (spOk(i, n, v)) { vals[n] = v; n++; spMiss = 0; fx("ok"); if (n >= x.sp.length) return done(); return setTimeout(draw, 350); }
          miss++; b.classList.add("bad");
          B.querySelectorAll(".og-o").forEach(o => { o.disabled = true; if (spOk(i, n, o.dataset.v)) o.classList.add("ok"); });
          resolve(id, miss);
          fx("bad"); F.className = "og-ft bad";
          F.innerHTML = `<div class="og-fb"><div class="og-fh">❌ Xato</div><div class="og-fa">To'g'ri: ${esc(spAns(i, n))}</div>${x.izoh ? `<div class="og-fn">💡 ${esc(x.izoh)}</div>` : ""}<div class="og-fn">🔁 Bu gap bir necha kartadan keyin yana chiqadi.</div></div><button class="og-btn" id="ogN">Tushundim</button>`;
          $("ogN").onclick = () => { fx("tap"); pos++; next(); };
        });
      };
      const done = () => {
        B.querySelectorAll(".og-o").forEach(o => o.disabled = true);
        const full = compose(i, vals);
        resolve(id, miss);
        okFoot(id, miss, `<div class="og-fa">${esc(full)}</div>${rep ? "" : `<div class="og-fn">✍️ Bir ozdan keyin bu gapni o'zingiz yozasiz.</div>`}`);
      };
      draw();
    }
    // ---------- A3: o'zi yozadi ----------
    function typeA(id, i, rep) {
      const x = M.A[i]; let miss = 0; const vals = x.sp.map(() => "");
      let h = "", p = 0;
      x.sp.forEach((s, n) => {
        h += esc(x.s.slice(p, s.st));
        h += `<input data-n="${n}" class="${s.t === "ins" ? "ins" : ""}" placeholder="${s.t === "ins" ? "‸" : "?"}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" style="width:5ch">` + (s.t === "ins" ? " " : "");
        p = s.st + s.ln;
      });
      h += esc(x.s.slice(p));
      const orig = x.sp.map(s => s.t === "ins" ? "‸" : x.s.substr(s.st, s.ln));
      B.innerHTML = `<div class="og-card"><span class="og-tag">✍️ ${i + 1}-gap · ${rep ? "🔁 Takror" : "3-qadam"}</span><span class="og-tag or">${esc(x.type)}</span>
        <div class="og-q">Endi o'zingiz yozing</div><p class="og-sub">Xato edi: ${orig.map(o => `<s style="color:var(--bad)">${esc(o)}</s>`).join(", ")}</p>
        <div class="og-ed">${h}</div><div id="ogH"></div></div>`;
      F.className = "og-ft"; F.innerHTML = `<button class="og-btn" id="ogK" disabled>Tekshirish</button>`;
      const inputs = [...B.querySelectorAll(".og-ed input")];
      inputs.forEach(inp => inp.oninput = () => { vals[+inp.dataset.n] = inp.value; inp.classList.remove("no"); inp.style.width = Math.max(5, inp.value.length + 1) + "ch"; $("ogK").disabled = vals.some((v, n) => !v.trim() && x.sp[n].t !== "ins"); });
      inputs.forEach(inp => inp.onkeydown = e => { if (e.key === "Enter" && !$("ogK").disabled) $("ogK").click(); });
      setTimeout(() => { try { inputs[0].focus(); } catch (e) {} }, 60);
      const check = () => {
        const bad = x.sp.map((_, n) => !spOk(i, n, vals[n]));
        if (!bad.some(Boolean)) {
          inputs.forEach(inp => { inp.classList.add("ok"); inp.readOnly = true; });
          if (!rep) ans.A[i] = compose(i, vals);
          resolve(id, miss);
          return okFoot(id, miss, `<div class="og-fa">${esc(compose(i, vals))}</div>`);
        }
        miss++;
        inputs.forEach((inp, n) => { inp.classList.toggle("no", bad[n]); inp.classList.toggle("ok", !bad[n]); });
        badFoot(miss >= 3 ? "Hali xato. Yordamga qarang." : "Qizil joy hali xato.");
        F.insertAdjacentHTML("beforeend", `<button class="og-btn" id="ogK">Tekshirish</button>`); $("ogK").onclick = check;
        if (miss >= 3) $("ogH").innerHTML = `<div class="og-hint">💡 <b>Yordam:</b> ${x.sp.map((s, n) => bad[n] ? (s.hint || "") : "").filter(Boolean).map(esc).join(" · ")}${miss >= 5 ? `<br>To'g'ri javob: <b>${x.sp.map((_, n) => esc(spAns(i, n))).join(" / ")}</b>. Uni yozing.` : ""}</div>`;
        else if (miss === 2 && x.izoh) $("ogH").innerHTML = `<div class="og-hint">💡 ${esc(x.izoh)}</div>`;
      };
      $("ogK").onclick = check;
    }
    // ---------- C2: so'zni o'zi yozadi ----------
    function typeC(id, i, rep) {
      const x = M.C[i], w = cWord(i); let miss = 0;
      B.innerHTML = `<div class="og-card"><span class="og-tag">🔤 O'z so'zingiz · yozing</span>${rep ? `<span class="og-tag or">🔁 Takror</span>` : ""}
        <div class="og-q">Bo'sh joyga so'zni to'g'ri yozing</div>
        <div class="og-ex">${esc(x.q).replace(/_{2,}/, '<span class="og-gap">?</span>')}</div>
        <input class="og-ta" id="ogIn" style="min-height:0" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="So'zni yozing…"><div id="ogH" style="margin-top:12px"></div></div>`;
      F.className = "og-ft"; F.innerHTML = `<button class="og-btn" id="ogK" disabled>Tekshirish</button>`;
      const inp = $("ogIn"); setTimeout(() => inp.focus(), 60);
      inp.oninput = () => { $("ogK").disabled = !inp.value.trim(); };
      inp.onkeydown = e => { if (e.key === "Enter" && inp.value.trim()) check(); };
      const check = () => {
        if (okText("C" + i, inp.value, x.ah || [], !!x.cs)) { inp.readOnly = true; resolve(id, miss); return okFoot(id, miss, `<div class="og-fa">${esc(w)}</div>`); }
        miss++; badFoot(miss >= 3 ? "Hali xato. Yordamga qarang." : "Harflarni tekshiring.");
        F.insertAdjacentHTML("beforeend", `<button class="og-btn" id="ogK">Tekshirish</button>`); $("ogK").onclick = check;
        if (miss >= 3) $("ogH").innerHTML = `<div class="og-hint">💡 <b>Yordam:</b> ${esc(w.slice(0, Math.ceil(w.length / 2)))}${"_".repeat(Math.floor(w.length / 2))} (${w.length} harf)${miss >= 5 ? `<br>To'g'ri yozilishi: <b>${esc(w)}</b>` : ""}</div>`;
      };
      $("ogK").onclick = check;
    }

    // ---------- yakun ----------
    function finish() {
      prog(); $("ogPb").style.width = "100%"; fx("end");
      const ids = Object.keys(G.first), ok = ids.filter(k => G.first[k]).length, pct = Math.round(100 * ok / Math.max(1, ids.length));
      const hard = Object.keys(G.miss).filter(k => G.miss[k] > 0).sort((a, b) => G.miss[b] - G.miss[a]).slice(0, 4);
      const nameOf = k => { const m = k.match(/^(B|D|Af|At|Cm|Ct)(\d+)$/); const i = +m[2]; return m[1] === "B" ? "Qoida: " + M.B[i].type : m[1][0] === "A" ? M.A[i].type + " (" + (i + 1) + "-gap)" : m[1][0] === "C" ? "So'z: " + cWord(i) : "Sinonim: " + M.D[i].q; };
      ans.st = { v: 3, n: ids.length, first: ok, pct: pct, miss: G.miss };
      ctx.save();
      B.innerHTML = `<div class="og-card og-hero"><div class="og-big">🏆</div><h2>Mashq tugadi!</h2><p>Hammasini to'g'ri qilib chiqdingiz. Endi topshiring.</p>
        ${G.best >= 5 ? `<div class="og-stk">🔥 Eng uzun seriya: ${G.best} ta ketma-ket to'g'ri</div>` : ""}
        <div class="og-res"><div><b>${pct}%</b><span>birinchi urinishda</span></div><div><b>${ok}/${ids.length}</b><span>darhol to'g'ri</span></div><div><b>⭐${G.xp}</b><span>ball</span></div></div>
        ${hard.length ? `<div class="og-tops"><b>Ko'proq ishlash kerak:</b>${hard.map(k => `<div>${esc(nameOf(k))}<span>${G.miss[k]} xato</span></div>`).join("")}</div>` : ""}</div>`;
      F.className = "og-ft"; F.innerHTML = `<button class="og-btn or" id="ogS">📤 Topshirish</button>`;
      $("ogS").onclick = () => {
        const b = $("ogS"); b.disabled = true; b.textContent = "Yuborilmoqda…";
        ctx.send("new", () => { root.className = "hide"; root.innerHTML = ""; document.documentElement.classList.remove("og-lock"); },
          err => { b.disabled = false; b.textContent = "📤 Qayta urinish"; toast(err || "Internet xatosi. Javoblar saqlangan."); });
      };
    }
    hero();
  };
})();
