// Sinfdagi Speaking aylanma mashqi (24.11): o'quvchi, ekran va ustoz sahifalari uchun umumiy mantiq.
// Sessiya: sessions/<sid> = { skill:"speaking", test:"l09", group, state, plan:[qadam], cur:{i,at,pz}, ppl:{pid:{n,dev}}, rounds:{ri:{g:[[pid..]], q:{gi:{0:[qid],1:[qid]}}, card:{pid:id}}}, gone:{pid:1}, tr:{pid:{i:1..3}} }
// pid = sha256(kalit|sid) boshidan 12 belgi: o'quvchilar kalitlari umumiy sessiyada ko'rinmaydi.
// Baholar: live/<sid>/<kalit>/sp/<qadam> = { c: nomzod pid, by: baholovchi pid, a:{qid:0|1}, u:{chip:1}, pz, uz, t, cv:{bullet:1} }
window.SP = (function () {
  const base = (document.currentScript && document.currentScript.src || location.href).replace(/[^/]*$/, "");
  const cache = {};
  function lesson(id) {
    if (!cache[id]) cache[id] = fetch(base + "lessons/" + id + ".json?v=2").then(r => { if (!r.ok) throw new Error("Dars fayli topilmadi: " + id); return r.json(); });
    return cache[id];
  }
  function lessons() { return fetch(base + "lessons/index.json?v=2").then(r => r.json()); }
  async function pid(k, sid) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(k + "|" + sid));
    return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, "0")).join("").slice(0, 12);
  }

  const DEF = { p1: { r: 6, s: 120 }, p2: { cards: 2, prep: 60, talk: 120, fu: 30 }, p3: { r: 5, s: 150 } };
  const ATT = { 1: "1-urinish: eslatma bilan", 2: "2-urinish: eslatmasiz", 3: "3-urinish: imtihon sharoitida" };
  // reja: har qadam = bitta yarim raund (h=0: 1-kishi javob beradi, h=1: rollar almashadi)
  function plan(c) {
    c = c || DEF;
    const st = []; let ri = 0;
    for (let r = 1; r <= c.p1.r; r++) { ri++; for (let h = 0; h < 2; h++) st.push({ b: "p1", r: ri, br: r, h: h, dur: c.p1.s }); }
    for (let cd = 1; cd <= c.p2.cards; cd++) for (let a = 1; a <= 3; a++) {
      ri++;
      const prep = a === 2 ? 0 : c.p2.prep;
      for (let h = 0; h < 2; h++) st.push({ b: "p2", r: ri, br: (cd - 1) * 3 + a, cd: cd, att: a, h: h, prep: prep, talk: c.p2.talk, fu: c.p2.fu, dur: prep + c.p2.talk + c.p2.fu });
    }
    for (let r = 1; r <= c.p3.r; r++) { ri++; for (let h = 0; h < 2; h++) st.push({ b: "p3", r: ri, br: r, h: h, dur: c.p3.s }); }
    return st;
  }
  const BN = { p1: "Part 1", p2: "Part 2", p3: "Part 3" };
  function minutes(st) { return Math.round(st.reduce((a, s) => a + s.dur, 0) / 60); }

  // vaqt: qolgan soniya (pauza hisobga olinadi). Boshlanishdan oldin manfiy "kutish" ham qaytadi.
  function clock(cur, step, now) {
    if (!cur || !step) return null;
    const t = (cur.pz || now) - cur.at;   // o'tgan ms
    const el = t / 1000;
    return { el: el, left: step.dur - el, wait: el < 0 ? -el : 0, over: el >= step.dur, paused: !!cur.pz };
  }
  // Part 2 ichki bosqichi
  function p2phase(step, el) {
    if (el < step.prep) return { k: "prep", n: "Tayyorlanish", left: step.prep - el };
    if (el < step.prep + step.talk) return { k: "talk", n: "Gapirish", left: step.prep + step.talk - el };
    return { k: "fu", n: "Qo'shimcha savol", left: Math.max(0, step.dur - el) };
  }
  // guruh ichidagi rollar: h-yarimda nomzod = g[h % n], examiner = g[(h+1) % n], qolganlar kuzatuvchi
  function roles(g, h) {
    const n = g.length, c = g[h % n], e = g[(h + 1) % n];
    return { c: c, e: e, o: g.filter(x => x !== c && x !== e) };
  }
  function findGroup(round, p) {
    if (!round || !round.g) return -1;
    for (let i = 0; i < round.g.length; i++) if (round.g[i] && round.g[i].indexOf(p) >= 0) return i;
    return -1;
  }
  function fmt(sec) { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function stepLabel(step) {
    if (!step) return "";
    if (step.b === "p2") return `Part 2 · ${step.cd}-karta · ${ATT[step.att]}`;
    return `${BN[step.b]} · ${step.br}-raund`;
  }
  // ism qisqartmasi (ekranda joy tejash)
  function short(n) { const p = String(n || "").trim().split(/\s+/); return p.length > 1 ? p[0] + " " + p[1][0] + "." : p[0] || "?"; }
  return { lesson, lessons, pid, plan, DEF, ATT, BN, minutes, clock, p2phase, roles, findGroup, fmt, esc, stepLabel, short };
})();
