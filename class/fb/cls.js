// Sinf testlari uchun umumiy yordamchi: Firebase ulanishi, server vaqti, guruhlar.
window.CLS = (function () {
  firebase.initializeApp(window.FB_CONFIG);
  const db = firebase.database();
  const P = new URLSearchParams(location.search);
  if (P.get("emu")) {   // faqat sinov uchun (kompyuterdagi emulator)
    db.useEmulator("127.0.0.1", 9000);
    if (firebase.auth) firebase.auth().useEmulator("http://127.0.0.1:9099", { disableWarnings: true });
  }
  let off = 0;
  db.ref(".info/serverTimeOffset").on("value", s => { off = s.val() || 0; });
  const GROUPS = {
    test: { name: "Test guruhi", chat: -1003949015597 },
    morning: { name: "Morning", chat: -1004459501185 },
    afternoon: { name: "Afternoon", chat: -1004149018694 }
  };
  function groupOfChat(chat) {
    for (const g in GROUPS) if (GROUPS[g].chat === Number(chat)) return g;
    return null;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function mmss(sec) {
    sec = Math.max(0, Math.round(sec));
    return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
  }
  return {
    db: db, P: P, GROUPS: GROUPS, groupOfChat: groupOfChat, esc: esc, mmss: mmss,
    now: () => Date.now() + off,
    TS: firebase.database.ServerValue.TIMESTAMP,
    emu: P.get("emu") ? "&emu=1" : ""
  };
})();
