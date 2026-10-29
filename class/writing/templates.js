// Sinfdagi Writing darslari uchun shablonlar (ustoz va o'quvchi sahifasi uchun bitta).
// Manba: Dilshod ustozning prezentatsiyalari, "IELTS Practice/writing/PPT/New Task 2/Ready" (Task 1: 5 dars, Task 2: 1-7 darslar).
// Har qadamda: formula (o'quvchiga ko'rinadi), c: sahifadagi tezkor belgilar (re topilsa ✓; no: true bo'lsa topilmasligi kerak),
// ai: AI tekshiruvchiga qo'shimcha talablar, w: tavsiya etilgan so'z soni.
window.WTPL = (function () {
  const C = {
    noBelow: { t: "\"below\" yo'q", re: "\\bbelow\\b", no: true },
    overall: { t: "\"Overall,\" bilan boshlangan", re: "^\\s*overall\\b" },
    noNum: { t: "Raqam yo'q", re: "\\d", no: true },
    noConcl: { t: "\"In conclusion\" yo'q (Task 1 da xulosa yo'q)", re: "in conclusion|to conclude|to sum up", no: true },
    noHook: { t: "\"Nowadays / In the modern world\" yo'q", re: "\\bnowadays\\b|modern (world|era)|dawn of time|throughout human history", no: true },
    noFirstly: { t: "\"Firstly, Secondly...\" yo'q", re: "\\bsecondly\\b|\\bthirdly\\b", no: true },
    example: { t: "Misol: For example / For instance", re: "for (example|instance)|such as" },
    concl: { t: "\"In conclusion,\" yoki \"To conclude,\"", re: "^\\s*(in conclusion|to conclude)\\b" },
    badConcl: { t: "\"All in all / To sum up / In a nutshell\" yo'q", re: "all in all|to sum up|in a nutshell|in sum\\b", no: true },
    compare: { t: "Taqqoslash (while / whereas / compared with / than)", re: "\\bwhile\\b|\\bwhereas\\b|compared (with|to)|\\bthan\\b|by contrast|in contrast" },
    trend: { t: "Trend fe'li (rose / fell / increased / declined ...)", re: "\\b(rose|risen|fell|fallen|increased|decreased|declined|dropped|grew|climbed|surged|soared|plummeted|levelled off|leveled off|peaked|fluctuated|remained|doubled|tripled)\\b" },
    figure: { t: "\"the figure for\" / \"that of\"", re: "the figure for|that of|those of|the corresponding figure" },
    share: { t: "Ulush fe'li (accounted for / made up / constituted)", re: "account(s|ed)? for|made up|make(s)? up|constitut|represent" },
    passive: { t: "Passiv (is/are/was + V3)", re: "\\b(is|are|was|were|been|be)\\s+(\\w+ly\\s+)?\\w+(ed|en|wn|lt|ught|ut|ilt)\\b" },
    sequence: { t: "Ketma-ketlik so'zlari (Next / Following this / Once ...)", re: "following this|\\bnext\\b|subsequently|\\bonce\\b|after (this|that|being)|\\bthen\\b|\\bfinally\\b|initially|at the first stage" },
    location: { t: "Joylashuv (in the north of / next to / opposite ...)", re: "(north|south|east|west|centre|center)|next to|adjacent to|opposite|along(side)?|to the (left|right)" }
  };
  // Task 2: Kirish, Body, Xulosa bo'yicha umumiy qoidalar (1-2 darslar)
  const T2 = {
    para: { id: "para", name: "Paraphrase (1-gap)", w: [15, 35],
      hint: "Savoldagi fikrni o'z so'zlaringiz bilan qayta yozing. Ma'no o'zgarmasin, fikr qo'shilmasin. Savoldan ketma-ket 3 so'zdan ortiq ko'chirmang.",
      formula: "[Savoldagi fikr: sinonim + so'z shakli + gap tuzilmasi o'zgargan, bitta gap]",
      c: [C.noHook],
      ai: "Faqat 1-gap (paraphrase) baholanadi: ma'no 100% saqlanganmi, savoldan ko'chirilgan iboralar, sinonimlar to'g'rimi. Pozitsiya bo'lmasligi normal. advice ga yana 1 ta Band 8 paraphrase yoz." },
    full: { id: "full", name: "To'liq insho", w: [250, 300],
      hint: "4 paragraf: Kirish (2 gap) → Body 1 → Body 2 → Xulosa. 260–290 so'z.",
      formula: "Introduction (2 gap, 40–60 so'z)\n\nBody 1: Topic sentence → Explanation → Example\n\nBody 2: Topic sentence → Explanation → Example\n\nConclusion: In conclusion, ... (1–2 gap, 30–45 so'z)",
      c: [C.noHook, C.example, C.concl, C.badConcl],
      ai: "To'liq insho: 4 mezon bo'yicha baholanadi. Pozitsiya kirishdan oxirigacha bir xil bo'lsin, xulosada yangi fikr bo'lmasin." }
  };
  const intro2 = { noHook: C.noHook };
  function t2(id, name, short, rule, steps) {
    return { id: id, task: 2, name: name, short: short, rule: rule,
      steps: [T2.para].concat(steps.map(s => Object.assign({ c: [] }, s)), [T2.full]) };
  }
  function introStep(formula, hint, extra) {
    return { id: "intro", name: "Introduction", w: [40, 60], formula: formula,
      hint: hint || "Aniq 2 gap: 1) savolni paraphrase qilish, 2) thesis: aniq javob + Body 1 va Body 2 mavzusi.",
      c: [intro2.noHook].concat(extra || []),
      ai: "Kirish aniq 2 gap bo'lishi kerak (40-60 so'z): 1-gap paraphrase (savoldan ko'chirmasdan), 2-gap thesis (savolga aniq javob va 2 asosiy sabab/fikr). Hook, 'This essay will discuss' kabi bo'sh shablon gaplar xato." };
  }
  function bodyStep(n, name, formula, hint, extra, ai) {
    return { id: "body" + n, name: name, w: [85, 115], formula: formula,
      hint: hint || "Topic sentence → Explanation (sabab-oqibat) → Example (real, hammaga tanish misol).",
      c: [C.noFirstly].concat(extra || [C.example]),
      ai: "Body paragraf: Topic sentence (qisqa, misolsiz) → Explanation (sabab-oqibat zanjiri) → Example (real, ishonarli; soxta statistika yoki 'Harvard proved' xato, 'I/my' shaxsiy hikoya xato). 90-110 so'z. " + (ai || "") };
  }
  function conclStep(formula, extra, ai) {
    return { id: "concl", name: "Conclusion", w: [30, 50], formula: formula,
      hint: "1–2 gap: asosiy fikrlarning qisqa xulosasi + pozitsiya. Yangi fikr qo'shilmaydi. Kirishdagi thesisni yangi sinonimlar bilan qayta yozing.",
      c: [C.concl, C.badConcl].concat(extra || []),
      ai: "Xulosa 1-2 gap (30-45 so'z): asosiy fikrlar + pozitsiya, yangi fikr yo'q, faqat 'In conclusion,' yoki 'To conclude,'. " + (ai || "") };
  }
  const BELIEVE = { t: "Pozitsiya: I believe / I firmly believe", re: "i (firmly |strongly |personally )?believe|i am convinced|in my (opinion|view)|this essay (completely )?(agrees|disagrees)" };

  const list = [
    // ---------------- Task 2 ----------------
    t2("t2_opinion", "Opinion essay (Agree / Disagree)", "Opinion",
      "Opinion: faqat BITTA tomon (to'liq rozi yoki to'liq qarshi), fikr kirishda aytiladi va oxirigacha o'zgarmaydi. Ikkala tomonni yozish yoki birovlarning fikrini muhokama qilish xato (position_ok=false).",
      [
        introStep("[Savolni paraphrase qilish]. This essay completely agrees / disagrees with this view because [1-sabab] and [2-sabab].", null,
          [{ t: "Aniq pozitsiya (agree / disagree / I believe)", re: "agree|disagree|i (firmly )?believe|in my opinion" }]),
        bodyStep(1, "Body 1 (1-sabab)", "[Topic sentence: 1-sabab]. [Explanation: nega va qanday? ... Consequently, ...]. For example, [real misol].", null, [C.example]),
        bodyStep(2, "Body 2 (2-sabab)", "Another compelling reason why [pozitsiya] is that [2-sabab]. [Explanation: ... As a result, ...]. For instance, [real misol].", null,
          [{ t: "\"Another (compelling) reason\"", re: "another (\\w+ )?reason" }, C.example]),
        conclStep("In conclusion, I firmly believe that [pozitsiya]. [1-sabab va 2-sabab qisqa xulosasi].", [BELIEVE])
      ]),
    t2("t2_discussion", "Discussion essay (Discuss both views + opinion)", "Discussion",
      "Discussion: ikkala tomon ham teng (har biri ~90-100 so'z) muhokama qilinadi va o'quvchi qaysi tomonni yoqlashini aniq aytadi. Body 1 = qo'shilmaydigan tomon + e'tiroz (However, I believe...), Body 2 = qo'llab-quvvatlaydigan tomon. Fikr yo'q yoki bir tomon yozilmagan bo'lsa position_ok=false.",
      [
        introStep("[Ikkala qarashni paraphrase qilish: Opinions are divided on whether A or B]. Although [A tomon ...], I firmly believe that [B tomon] is far more advantageous because [sabab].",
          "2 gap: 1) ikkala qarashni neytral paraphrase, 2) Although + A tomon, I firmly believe + B tomon + sabab.",
          [{ t: "Although / While it is true that", re: "although|while it is true|while some" }, BELIEVE]),
        bodyStep(1, "Body 1 (A tomon, siz qo'shilmaysiz)", "On the one hand, supporters of [A] argue that [A tomon fikri]. [Explanation: nega ular shunday o'ylaydi]. [Real misol]. However, I believe [nega bu tomon kuchsizroq].",
          "Topic sentence (A qarash) → Explanation → Example → However, I believe... (e'tirozingiz).",
          [{ t: "\"On the one hand\"", re: "on the one hand" }, { t: "\"However, I believe\"", re: "however,? i (firmly )?believe" }]),
        bodyStep(2, "Body 2 (B tomon, siz qo'shilasiz)", "On the other hand, it is widely recognised that [B tomon fikri]. [Explanation: nega bu tomon kuchliroq]. [Real misol]. I firmly support this perspective because [sabab].",
          "Topic sentence (B qarash) → Explanation → Example → I firmly support this perspective because...",
          [{ t: "\"On the other hand\"", re: "on the other hand" }, { t: "\"I firmly support / believe\"", re: "i (firmly )?(support|believe)" }]),
        conclStep("In conclusion, although [A tomon], I firmly believe that [B tomon], since [asosiy sabab].", [{ t: "Although + pozitsiya", re: "although" }])
      ]),
    t2("t2_problem", "Problem / Cause & Solution essay", "Problem-Solution",
      "Problem/Cause & Solution: Body 1 = sabab(lar) yoki muammo(lar), Body 2 = yechim(lar). Savolda birlik (cause) bo'lsa 1 ta, ko'plik (causes) bo'lsa 2 ta yoziladi. Yechim sababga to'g'ridan-to'g'ri mos kelishi shart. Bu tur fikr talab qilmaydi: position_ok faqat har ikki qismga javob berilganini bildiradi.",
      [
        introStep("[Savolni paraphrase qilish]. The main cause of this problem is [sabab], and the best solution is [yechim].",
          "2 gap: 1) paraphrase, 2) asosiy sabab (muammo) + eng yaxshi yechim. Ko'plik bo'lsa: 2 ta sabab + 2 ta yechim.",
          [{ t: "Sabab/muammo + yechim aytilgan", re: "(cause|reason|problem|issue).*(solution|solve|tackl|address)" }]),
        bodyStep(1, "Body 1 (sabab / muammo)", "The main reason for [muammo] is [sabab]. [Explanation: qanday qilib bu muammoga olib keladi]. For instance, [real misol, masalan Toshkent].\n(2 ta bo'lsa: ... Furthermore, [2-sabab] + izoh.)",
          "Sabab → tushuntirish/oqibat → misol. Ko'plik savolda 2 ta sabab (Furthermore / In addition).",
          [{ t: "\"The main reason / cause\"", re: "the (main|primary|major) (reason|cause)|one (major )?(cause|reason)|the first (problem|cause)" }, C.example]),
        bodyStep(2, "Body 2 (yechim)", "The most effective way to solve this problem is [yechim]. [How it works: qanday ishlaydi va nima o'zgaradi]. For example, [real misol].",
          "Yechim → qanday ishlaydi → misol. Yechim Body 1 dagi sababga mos bo'lsin.",
          [{ t: "\"The most effective way / solution\"", re: "most effective (way|solution)|the best solution|one (effective )?solution|to tackle|to solve" }, C.example],
          "Yechim Body 1 dagi sabab(lar)ga bevosita javob berishi kerak, aks holda formula_ok=false."),
        conclStep("In conclusion, [muammo] is mainly caused by [sabab]; however, this problem can be solved if [yechim].", [{ t: "Sabab + yechim", re: "caused by|because of|due to" }])
      ]),
    t2("t2_advdis", "Advantages & Disadvantages (Discuss)", "Adv & Disadv",
      "Advantages & Disadvantages (1-tur, fikr so'ralmagan): Body 1 = afzalliklar, Body 2 = kamchiliklar. Fikr bildirish shart emas; ikkala tomon ham yozilmagan bo'lsa position_ok=false.",
      [
        introStep("[Savolni paraphrase qilish]. The principal benefits of this development are [A1] and [A2]; however, the key drawbacks are [D1] and [D2].",
          "2 gap: 1) paraphrase, 2) 2 ta afzallik + 2 ta kamchilik (birlik/ko'plik savolga mos).",
          [{ t: "Benefits ... ; however, drawbacks", re: "(benefit|advantage).*(drawback|disadvantage)" }]),
        bodyStep(1, "Body 1 (afzalliklar)", "The foremost advantage of [mavzu] is that [A1]. [Explanation]. Furthermore, [A2]. [Explanation]. For example, [real misol].",
          "1-afzallik + izoh → Furthermore, 2-afzallik + izoh → misol.",
          [{ t: "\"The foremost / main advantage\"", re: "(foremost|main|primary|greatest|first) (advantage|benefit)" }, { t: "Furthermore / In addition", re: "furthermore|in addition|moreover" }, C.example]),
        bodyStep(2, "Body 2 (kamchiliklar)", "On the other hand, [D1]. [Explanation]. Another significant drawback is [D2]. [Explanation]. For instance, [real misol].",
          "On the other hand + 1-kamchilik + izoh → Another significant drawback is + 2-kamchilik → misol.",
          [{ t: "\"On the other hand\"", re: "on the other hand" }, { t: "\"Another (significant) drawback\"", re: "another (\\w+ )?(drawback|disadvantage)" }, C.example]),
        conclStep("In conclusion, [mavzu] [A1 va A2]; nevertheless, [D1 va D2].", [{ t: "nevertheless / however", re: "nevertheless|however" }])
      ]),
    t2("t2_outweigh", "Advantages outweigh Disadvantages (Opinion)", "Outweigh",
      "Outweigh (2-tur): o'quvchi qaysi tomon ustun ekanini aniq aytadi. Body 1 = kuchsiz tomon (Admittedly ... However, I believe ...), Body 2 = kuchli tomon (That is why I am convinced ...). Ikkala tomon ham, pozitsiya ham bo'lishi shart; 'there are both advantages and disadvantages' deb qoldirish position_ok=false.",
      [
        introStep("[Savolni paraphrase qilish]. Although [kuchsiz tomon], I believe the advantages clearly outweigh the disadvantages because [asosiy sabab].",
          "2 gap: 1) paraphrase, 2) Although + kuchsiz tomon, I believe + qaysi tomon ustun + asosiy sabab.",
          [{ t: "Although", re: "although" }, { t: "outweigh", re: "outweigh" }]),
        bodyStep(1, "Body 1 (kuchsiz tomon)", "Admittedly, [kuchsiz tomon]. [Explanation]. For example, [misol]. However, I believe [nega bu kamroq muhim / xavfni kamaytirish mumkin].",
          "Admittedly + kuchsiz tomon → izoh → For example → However, I believe...",
          [{ t: "\"Admittedly\"", re: "admittedly" }, C.example, { t: "\"However, I believe\"", re: "however,? i (firmly )?believe" }]),
        bodyStep(2, "Body 2 (kuchli tomon)", "The most significant benefit of [mavzu] is that [asosiy fikr]. [Explanation]. For instance, [real misol]. That is why I am convinced that [xulosa].",
          "The most significant benefit of ... is that → izoh → For instance → That is why I am convinced that...",
          [{ t: "\"The most significant benefit\"", re: "most significant (benefit|advantage)" }, C.example, { t: "\"That is why I am convinced\"", re: "that is why i am convinced|i am convinced" }]),
        conclStep("In conclusion, although [kuchsiz tomon], I firmly believe that [pozitsiya], since [asosiy sabab].", [{ t: "Although + I firmly believe", re: "although.*believe" }])
      ]),
    t2("t2_double", "Double question essay", "Double Q",
      "Double Question: IKKALA savolga ham javob berilishi shart. Body 1 = 1-savol (masalan, sabablar; bu yerda fikr yo'q), Body 2 = 2-savol (masalan, ijobiymi/salbiymi: aniq pozitsiya). Ikkinchi savolga javob yo'q yoki noaniq bo'lsa position_ok=false. Paragraflar taxminan teng bo'lsin.",
      [
        introStep("[Savolni paraphrase qilish]. This trend is mainly driven by [1-sabab] and [2-sabab], and I believe it is a largely [positive / negative] development because [asosiy sabab].",
          "2 gap: 1) paraphrase, 2) 1-savolga javob + 2-savolga javob (ikkalasi bitta gapda).",
          [{ t: "1-savol javobi (driven by / caused by / because)", re: "driven by|caused by|because|due to|result of" }, { t: "2-savol javobi (positive / negative)", re: "positive|negative|beneficial|harmful" }]),
        bodyStep(1, "Body 1 (1-savol)", "The main reason why [mavzu] is that [1-sabab]. [Explanation]. In addition, [2-sabab]. For example, [real misol].",
          "Faqat 1-savolga javob: 1-sabab + izoh → In addition, 2-sabab → misol. Fikr bildirmang.",
          [{ t: "\"The main reason why\"", re: "the (main|primary) reason why" }, { t: "\"In addition\"", re: "in addition|furthermore|moreover" }, C.example]),
        bodyStep(2, "Body 2 (2-savol)", "However, I believe this development is largely [positive / negative] because [sabab]. [Explanation]. For instance, [real misol]. That is why I am convinced that [xulosa].",
          "2-savolga to'g'ridan-to'g'ri javob: However, I believe ... → izoh → For instance → That is why I am convinced that...",
          [{ t: "\"However, I believe ... largely\"", re: "however,? i (firmly )?believe" }, C.example, { t: "\"That is why I am convinced\"", re: "i am convinced" }]),
        conclStep("In conclusion, [mavzu] because of [sabablar]; however, I firmly believe this is a [positive / negative] trend, as [asosiy sabab].", [{ t: "Ikkala javob", re: "however" }])
      ])
  ];

  // ---------------- Task 1 ----------------
  const T1 = {
    intro: { id: "intro", name: "Introduction", w: [20, 40],
      hint: "1 gap: savolni paraphrase qiling. Grafik turini aniq ayting (The line graph illustrates...), \"below\" ni olib tashlang, savoldan ketma-ket 3 so'zdan ortiq ko'chirmang.",
      formula: "The [grafik turi] illustrates / compares [nima: how many / the proportion of ...] in [qayerda] [over the period from X to Y].",
      c: [C.noBelow, { t: "Grafik turi aytilgan", re: "(line graph|bar chart|pie chart|table|diagram|map|chart|graph)s?\\b" }, { t: "illustrates / compares / shows", re: "illustrat|compar|show|depict|give(s)? information" }],
      ai: "Task 1 Introduction: aniq 1 gap, savol paraphrase qilingan (sinonim, so'z shakli, tuzilma), grafik turi aniq, 'below' yo'q, savoldan uzun ko'chirma yo'q. Xavfli sinonimlar (people → humans, percentage ↔ number) ma'noni buzsa xato." },
    full: { id: "full", name: "To'liq javob (20 daqiqa)", w: [150, 200],
      hint: "4 paragraf: Introduction (1 gap) → Overview (2 gap, raqamsiz) → Body 1 → Body 2. 170–190 so'z. Xulosa yozilmaydi.",
      formula: "Introduction (1 gap)\n\nOverall, ... (2 gap, raqamsiz, 2–3 asosiy xususiyat)\n\nBody 1: 1-guruh ma'lumot + raqamlar + taqqoslash\n\nBody 2: 2-guruh ma'lumot + raqamlar + taqqoslash",
      c: [C.noBelow, { t: "Overview \"Overall,\" bilan", re: "\\boverall\\b" }, C.noConcl],
      ai: "To'liq Task 1 javobi: alohida overview (Band 7 sharti), ma'lumot guruhlangan, asosiy raqamlar to'g'ri va taqqoslangan, har bir raqam sanab chiqilmagan (mexanik emas), sabab/fikr yo'q, xulosa yo'q, 150+ so'z." }
  };
  function ov(formula, hint, extra, ai) {
    return { id: "overview", name: "Overview", w: [25, 50], formula: formula,
      hint: hint || "2 gap, \"Overall,\" bilan, 2–3 asosiy xususiyat, aniq raqam va sana yo'q.",
      c: [C.overall, C.noNum].concat(extra || []),
      ai: "Overview: 'Overall,' bilan, 2 gap, 2-3 asosiy xususiyat (umumiy trend, eng katta/kichik, istisno), aniq raqam va sana YO'Q (raqam bo'lsa formula_ok=false), sabab yo'q. " + (ai || "") };
  }
  function b1(n, formula, hint, extra, ai) {
    return { id: "body" + n, name: "Body " + n, w: [55, 90], formula: formula, hint: hint, c: [C.noConcl].concat(extra || []),
      ai: "Task 1 body paragraf: faqat muhim nuqtalar va raqamlar, taqqoslash bilan; har bir yil/katakni sanab chiqish mexanik (xato); sabab yoki fikr qo'shilmaydi; zamon sanalarga mos; birlik to'g'ri; kamida 1 ta murakkab gap. " + (ai || "") };
  }
  function t1(id, name, short, rule, steps) {
    return { id: id, task: 1, name: name, short: short, rule: rule, steps: [T1.intro].concat(steps, [T1.full]) };
  }
  list.push(
    t1("t1_basics", "Task 1 asoslari: Introduction + Overview (har qanday grafik)", "Intro + Overview",
      "1-dars: faqat Introduction va Overview. Avval savol: grafikda vaqt bormi? Vaqt bor → trend tili, yo'q → taqqoslash tili.",
      [ov("Vaqt bor: Overall, [X] increased significantly over the period, while [Y] declined. It is also clear that [Z] remained the highest throughout.\nVaqt yo'q: Overall, [X] was by far the largest, whereas [Y] was the smallest. Another notable feature is that [...].")]),
    t1("t1_trend", "Line graph / vaqtli Bar chart (Change over time)", "Line / Bar (vaqt)",
      "Vaqtli grafik (line graph yoki bir necha yilli bar chart): trend tili, o'tgan yillar Past Simple, prognoz 'is expected / projected to'.",
      [
        ov("Overall, [X] increased significantly over the period, while [Y] declined. It is also clear that [Z] remained the highest throughout.", null, [C.trend]),
        b1(1, "[1-guruh: masalan o'sganlar yoki kesishgan chiziqlar]. In [yil], [X] stood at [raqam], while [Y] ... . Over the following [davr], [X] rose sharply to [raqam], overtaking [Y] ...",
          "Boshlang'ich nuqta → trend → oxirgi nuqta / kesishish. 5 tuzilma: X rose sharply to 40% · There was a sharp rise in X · X saw a sharp rise · The figure for X rose by 10% to 40% · X rose from 10% to 40%, before levelling off.",
          [C.trend, C.figure], "Trend fe'li + ravish (rose sharply), ot + sifat (a sharp rise); predloglar to/by/at/from...to to'g'ri ('increased with' xato); 'rised' xato; 'TV fell' emas, 'the figure for TV fell'."),
        b1(2, "[2-guruh: masalan kamayganlar yoki barqarorlar]. By contrast, [W] fell / plummeted from [raqam] to [raqam] ... . [V], meanwhile, remained relatively stable at around [raqam].",
          "Ikkinchi guruh: kamayganlar, barqarorlar yoki prognoz qismi (is projected to reach ...).", [C.trend, C.compare])
      ]),
    t1("t1_bar", "Bar chart (vaqtsiz, taqqoslash)", "Bar (vaqtsiz)",
      "Vaqtsiz bar chart: taqqoslash tili. Bitta o'tgan yil → Past Simple, yil yo'q → Present Simple. Body guruhlar bo'yicha (eng yuqori guruh / past guruh).",
      [
        ov("Overall, [X] was by far the highest, whereas [Y] was the lowest. Another notable feature is that [...].", null, [C.compare]),
        b1(1, "[Eng yuqori guruh]. [X] had the highest [proportion], at [raqam], followed by [Y] ([raqam]). The figures for [A] and [B] were [raqam] and [raqam] respectively.",
          "Reyting tartibida: the highest, followed by, respectively, slightly / considerably higher than.", [{ t: "the highest / the largest / followed by", re: "the (highest|largest|lowest|smallest)|followed by" }, C.figure],
          "'the highest than' xato (orttirma darajada than yo'q); 'two times more' o'rniga 'twice as ... as'."),
        b1(2, "[Past guruh]. By contrast, [C] and [D] recorded much lower figures, at about a quarter each, with [D]'s figure more than four times lower than that of [X].",
          "Ko'paytmalar: twice as high as, three times as many as; that of / that for.", [{ t: "Ko'paytma (twice / three times / half)", re: "twice|three times|four times|half as|times (as|higher|more)" }, C.compare])
      ]),
    t1("t1_pie", "Pie chart (ulush)", "Pie chart",
      "Pie chart: ulush tili (account for, make up, a quarter, just over half). Ikki pie ikki yil bilan bo'lsa vaqt bor: trend + ulush tili birga.",
      [
        ov("Overall, [X] accounted for the largest share, while [Y] made up only a small fraction. [Ikki pie bo'lsa: the most significant change was ...].", null, [C.share]),
        b1(1, "[Eng katta bo'laklar]. [X] accounted for just over half ([raqam]%) of [...], making it by far the most common [...]. [Ikki yil: By 2025, this figure had fallen dramatically to ...].",
          "Eng katta bo'lakdan boshlang. Foiz + so'z: just over half (52%), a quarter (25%), one in five (20%).", [C.share, { t: "Foiz so'z bilan (half / quarter / third / majority)", re: "half|quarter|third|majority|fraction|one in (five|ten)" }]),
        b1(2, "[Qolgan bo'laklar]. [Z] represented [raqam]%, while [A], [B] and [C] together accounted for less than 10%, at [raqam]%, [raqam]% and [raqam]% respectively.",
          "Kichik bo'laklarni birlashtiring: together accounted for ...; respectively.", [C.share, { t: "respectively / together", re: "respectively|together|combined" }],
          "'had 55% people' emas, 'accounted for 55%'; 'the percentage of 30%' ma'nosiz.")
      ]),
    t1("t1_table", "Table (jadval)", "Table",
      "Jadval: highlight usuli — har ustunda eng katta va eng kichikni belgilash, 6-8 muhim raqam tanlash, o'xshash qatorlarni guruhlash. Hamma katakni yozish = mexanik, Band 5.",
      [
        ov("Overall, [A] ranked first in almost every category, whereas [B] had the lowest figures throughout. The biggest difference was in [...].", null, [C.compare]),
        b1(1, "[1-ustun yoki 1-guruh]. [A] and [B] recorded the highest [...], at [raqam] and [raqam] respectively. By contrast, [C] was considerably lower, at [raqam], and [D] was even lower ...",
          "Har ustunda eng yuqori va eng past + guruhlar. 'in terms of' — jihatidan.", [C.compare, { t: "respectively / by contrast", re: "respectively|by contrast|in contrast" }]),
        b1(2, "[2-ustun yoki 2-guruh]. Similarly, [...]. Compared with [raqam] in [A], the figure for [D] was only [raqam], less than a twentieth of [...].",
          "Similarly, compared with, their [...] counterparts. O'rtadagi qatorlar faqat qiziq bo'lsa.", [C.figure, C.compare],
          "Jadvaldagi hamma raqam ketma-ket sanalsa formula_ok=false; 'South Korea is 97%' emas, 'the figure for South Korea was 97%'.")
      ]),
    t1("t1_mixed", "Mixed charts (ikki grafik birga)", "Mixed charts",
      "Ikki grafik: Introduction ikkalasini 'while' bilan bitta gapda; Overview har grafikdan 1-2 xususiyat (jami 4 tadan ko'p emas); Body 1 = 1-grafik, Body 2 = 2-grafik. Band 7.5: murakkab gap, otlashtirish (an eightfold increase), referencing (this figure, the latter).",
      [
        ov("Overall, [1-grafik: asosiy trend / xususiyat], with [...]. As for [2-grafik], [eng katta xususiyat].", "2 gap: 1-grafikdan 1–2 xususiyat, 2-grafikdan 1 xususiyat (jami 4 tadan ko'p emas). Raqamsiz."),
        b1(1, "[Faqat 1-grafik]. In [yil], [X] was four times as many as [Y]. However, the latter grew rapidly, overtaking [X] and reaching [raqam] by [yil], an eightfold increase.",
          "Faqat 1-grafik. Murakkab gap (with + ot + -ing, which), otlashtirish (a threefold rise), referencing (the former / the latter).",
          [{ t: "Referencing (the latter / this figure / these)", re: "the latter|the former|this figure|these|that of" }]),
        b1(2, "As for [2-grafik], [X] was the dominant [...], accounting for [raqam]%, followed by [...] and [...] at [raqam]% and [raqam]% respectively.",
          "Faqat 2-grafik. \"As for\" bilan o'ting.", [{ t: "\"As for\" / 2-grafikka o'tish", re: "as for|turning to|regarding|the (pie|bar|line|table)" }],
          "Body 1 va Body 2 da grafiklar aralashtirilmasin.")
      ]),
    t1("t1_map", "Maps (ikki xarita)", "Maps",
      "Xarita: o'tmish-o'tmish → Past Simple passive (was built); o'tmish-hozir → Present Perfect passive (has been built); hozir-reja → will be built. Har o'zgarishning joyi aytiladi. Overview: umumiy o'zgarish + nima o'zgarmagan.",
      [
        ov("Overall, [joy] became considerably more [developed / residential], with [...] making way for [...]. Despite these changes, [...] remained the same.",
          "2 gap: umumiy o'zgarish (more developed, more residential) + nima o'zgarmagan. Raqamsiz.",
          [{ t: "O'zgarmagan narsa (remained / unchanged)", re: "remain|unchanged|the same|retained" }]),
        b1(1, "[Xaritaning 1-qismi, masalan yo'lning g'arbi]. The most noticeable change was [...]. The [forest] in the north-west was partially cut down to make way for [...]. Further south, the [shop] was demolished and replaced by [...].",
          "Joylashuv + o'zgarish fe'li + passiv: was built / demolished / replaced by / converted into / extended / relocated; made way for (aktiv).",
          [C.location, C.passive, { t: "O'zgarish fe'li", re: "built|constructed|added|demolished|cut down|cleared|replaced|converted|extended|reduced|relocated|made way|make way|expanded" }],
          "Passiv kerak: 'The school built' emas, 'was built'; 'they demolished' xato. Joyi aytilmagan o'zgarish — kamchilik."),
        b1(2, "[Xaritaning 2-qismi]. On the east side of the road, [...] was converted into [...], with a car park built immediately to its south. [...] The school, however, remained unchanged.",
          "Ikkinchi qism + oxirida o'zgarmagan narsa.", [C.location, C.passive])
      ]),
    t1("t1_process", "Process diagram (jarayon / sikl)", "Process",
      "Process: sun'iy jarayon → passiv (are collected), tabiiy sikl → aktiv (eggs hatch), ikkalasida Present Simple. HAR bir bosqich yoziladi. Overview: bosqichlar soni, boshi va oxiri, tur (chiziqli / aylanma). 'Firstly... Eighthly' mexanik.",
      [
        ov("Overall, the process consists of [N] stages, beginning with [the collection of ...] and ending with [...]. It is a [man-made, linear] process that involves [...].",
          "Bosqichlar soni + beginning with ... ending with ... + tur. Raqamlar o'rniga so'z bilan (eight stages).",
          [{ t: "consists of / stages", re: "consists of|stages|steps" }, { t: "beginning with ... ending with", re: "beginning with|begins with|starting with|ending with|ends with" }],
          "Process overview: bosqichlar soni so'z bilan yozilsa raqam hisoblanmaydi."),
        b1(1, "[1-yarim bosqichlar]. At the first stage, [...] are collected and taken to [...], where they are [...]. Once this has been done, they are washed in order to remove [...].",
          "Passiv + ketma-ketlik: At the first stage, Once this has been done, after being ..., which are then ..., in order to, where.",
          [C.passive, C.sequence, C.noFirstly], "Sun'iy jarayonda passiv shart ('The bottles collect' xato); tabiiy siklda aktiv. Bosqich tashlab ketilmasin, diagrammada yo'q narsa qo'shilmasin."),
        b1(2, "[2-yarim bosqichlar]. Following this, [...], which are subsequently [...]. Finally, [...] are used to [...].",
          "Following this, subsequently, Finally. Oxirgi bosqich bilan yakunlang.", [C.passive, C.sequence, C.noFirstly])
      ])
  );
  return { list: list, byId: id => list.find(x => x.id === id), checks: C };
})();
