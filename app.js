const app = document.getElementById("app"),
      esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let SET = { heroTitle: "Development Allies BD", heroText: "Courses, practice and resources for trainees.", showBooks: true, showSites: true };
let COURSES = [], LESSONS = [], QUESTIONS = [], BOOKS = [], SITES = [], TILES = [];

// Correct shuffle function
const shuffle = a => a.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);

async function loadAll() {
  try {
    const s = await db.collection("config").doc("main").get();
    if (s.exists) SET = Object.assign(SET, s.data());
  } catch (e) {}

  // Alphanumeric sorting rule: 0-9 first (numerical), then A-Z
  const ord = a => a.sort((x, y) => {
    const nameX = (x.name || x.title || "").toString();
    const nameY = (y.name || y.title || "").toString();
    return nameX.localeCompare(nameY, undefined, { numeric: true, sensitivity: 'base' });
  });

  const grab = async (name) => {
    try {
      const q = await db.collection(name).get();
      return q.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      return [];
    }
  };

  COURSES = ord((await grab("courses")).filter(c => !c.hidden));
  LESSONS = ord(await grab("lessons"));
  QUESTIONS = await grab("questions");
  BOOKS = ord(await grab("books"));
  SITES = ord(await grab("sites"));
  TILES = ord(await grab("tiles"));

  document.getElementById("brandLink").innerHTML = (SET.logoUrl ? `<img src="${esc(SET.logoUrl)}" alt="logo" style="height:30px;vertical-align:middle;margin-right:8px;border-radius:6px">` : "") + esc(SET.heroTitle || "Development Allies BD");
  document.title = SET.heroTitle || "Development Allies BD";
  
  route();
}

function cname(id) { const c = COURSES.find(x => x.id == id); return c ? c.name : id; }
function lname(id) { const l = LESSONS.find(x => x.id == id); return l ? l.title : id; }

function embed(u) {
  if (!u) return "";
  if (u.includes("youtu")) {
    const id = (u.match(/(?:v=|youtu.be\/|embed\/)([\w-]{6,})/) || [])[1];
    if (id) return `<div style="aspect-ratio:16/9"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe></div>`;
  }
  return `<a class="btn sm" href="${esc(u)}" target="_blank" rel="noopener">Watch video</a>`;
}

const H = (t, s) => `<div><h2>${esc(t)}</h2><p class="muted">${esc(s)}</p></div>`;
const V = {};

V.home = () => `<section class="hero"><h1>${esc(SET.heroTitle)}</h1><p class="lead">${esc(SET.heroText)}</p><div style="display:flex;gap:10px;flex-wrap:wrap">${SET.heroImageUrl ? `<div style="width:100%;margin:16px 0"><img src="${esc(SET.heroImageUrl)}" style="max-width:100%;border-radius:16px;display:block"></div>` : ""}<a class="btn" href="#/courses">Explore courses</a><a class="btn ghost" href="#/practice">Start practice</a></div></section>${SET.aboutText ? `<div class="card" style="margin:20px 0"><h2>${esc(SET.aboutTitle || "About")}</h2><p style="white-space:pre-wrap;color:var(--mut)">${esc(SET.aboutText)}</p></div>` : ""}`;

/* ---------------- PRACTICE: course -> lesson -> type -> set -> quiz ---------------- */
const TY = { MCQ: "Choose the correct answer.", Written: "Type a short answer.", Matching: "Match each item." };

V.practice = parts => {
  parts = parts || [];
  if (!parts.length) return H("Practice", "Pick a course to begin.") + `<div class="grid">${COURSES.map(c => `<a class="card tile" href="#/practice/course/${c.id}"><h3>${esc(c.name)}</h3><p>${LESSONS.filter(l => l.courseId == c.id).length} lessons</p></a>`).join("") || "<p class=muted>No courses yet.</p>"}</div>`;
  
  if (parts[0] == "course") {
    const cid = parts[1], ls = LESSONS.filter(l => l.courseId == cid);
    return H(cname(cid), "Pick a lesson.") + `<div class="grid">${ls.map(l => `<a class="card tile" href="#/practice/lesson/${l.id}"><h3>${esc(l.title)}</h3><p>${QUESTIONS.filter(q => q.lessonId == l.id).length} questions</p></a>`).join("") || "<p class=muted>No lessons in this course yet.</p>"}</div>`;
  }
  
  if (parts[0] == "lesson" && !parts[2]) {
    const lid = parts[1];
    return H(lname(lid), "Choose a question type.") + `<div class="grid">${Object.keys(TY).map(t => { const n = QUESTIONS.filter(q => q.lessonId == lid && q.type == t).length; return `<a class="card tile" href="#/practice/lesson/${lid}/${t}"><h3>${t}</h3><p>${TY[t]}</p><small>${n} questions</small></a>`; }).join("")}</div>`;
  }

  if (parts[0] == "lesson" && parts[2]) {
    const lid = parts[1], t = parts[2], qs = QUESTIONS.filter(q => q.lessonId == lid && q.type == t);
    const sets = [...new Set(qs.map(q => q.setNo || 1))].sort((a, b) => a - b);
    return H(t + " — " + lname(lid), "Choose a set to begin. Questions are shuffled each time.") + `<div class="grid">${sets.map(s => `<a class="card tile" href="javascript:startSet('${lid}','${t}',${s})"><h3>Set ${s}</h3><p>${qs.filter(q => (q.setNo || 1) == s).length} questions</p></a>`).join("") || "<p class=muted>No questions in this lesson/type yet.</p>"}</div>`;
  }
  return V.practice([]);
};

/* ------------- Quiz runner ------------- */
let QUIZ = null;

function startSet(lid, type, setNo) {
  const qs = shuffle(QUESTIONS.filter(q => q.lessonId == lid && q.type == type && (q.setNo || 1) == setNo));
  QUIZ = { lid, type, setNo, qs, idx: 0, results: new Array(qs.length).fill(null) };
  renderQuiz();
}

function qInput(q) {
  if (q.type == "MCQ") return (q.opts || []).map((o, j) => `<label class="opt"><input type="radio" name="qa" value="${esc(o)}"> ${esc(o)}</label>`).join("");
  if (q.type == "Written") return `<textarea id="qaw" rows="3" placeholder="Type your answer"></textarea>`;
  const R = shuffle((q.opts || []).map(p => p.split("|")[1]));
  return (q.opts || []).map((p, j) => `<div style="display:flex;justify-content:space-between;gap:10px;margin:6px 0"><span>${esc(p.split("|")[0])}</span><select id="qam_${j}"><option value="">Choose</option>${R.map(r => `<option>${esc(r)}</option>`).join("")}</select></div>`).join("");
}

function gradeCurrent(q) {
  if (q.type == "MCQ") {
    const c = document.querySelector('[name=qa]:checked');
    const ok = c && c.value == q.ans ? 1 : 0;
    return { ok, n: 1, line: "Correct answer: " + q.ans, your: c ? c.value : "(no answer)" };
  }
  if (q.type == "Written") {
    const a = (document.getElementById("qaw").value || "").toLowerCase(), k = (q.ans || "").toLowerCase().split(",").map(x => x.trim()).filter(Boolean);
    const ok = k.length && k.filter(x => a.includes(x)).length >= Math.ceil(k.length / 2) ? 1 : 0;
    return { ok, n: 1, line: "Key points: " + q.ans, your: document.getElementById("qaw").value || "(no answer)" };
  }
  let ok = 0;
  const n = (q.opts || []).length;
  const your = [];
  (q.opts || []).forEach((p, j) => {
    const sel = (document.getElementById("qam_" + j) || {}).value || "";
    your.push(p.split("|")[0] + " → " + (sel || "—"));
    if (sel == p.split("|")[1]) ok++;
  });
  return { ok, n, line: q.opts.map(p => p.replace("|", " = ")).join(", "), your: your.join(", ") };
}

function quizNext() {
  const q = QUIZ.qs[QUIZ.idx];
  QUIZ.results[QUIZ.idx] = gradeCurrent(q);
  QUIZ.idx++;
  renderQuiz();
}

function renderQuiz() {
  if (!QUIZ) return;
  if (QUIZ.idx >= QUIZ.qs.length) {
    let sc = 0, tot = 0, fb = "";
    QUIZ.results.forEach((r, i) => {
      sc += r.ok;
      tot += r.n;
      fb += `<div class="item ${r.ok == r.n ? "good" : "bad"}"><span>Q${i + 1}: ${r.ok}/${r.n} — <small>Your answer: ${esc(r.your)}</small></span><small>${esc(r.line)}</small></div>`;
    });
    const p = Math.round(sc / tot * 100), g = p >= 70;
    app.innerHTML = H("Set complete", "Here's how you did — right answers are shown below.") + `<div class="card" style="text-align:center"><h2>${sc}/${tot} (${p}%)</h2><span class="badge ${g ? "good" : "bad"}">${g ? "Competent" : "Not Yet Competent"}</span></div><div class="list">${fb}</div><p><a class="btn ghost" href="#/practice/lesson/${QUIZ.lid}/${QUIZ.type}">Back to sets</a> <a class="btn" href="javascript:startSet('${QUIZ.lid}','${QUIZ.type}',${QUIZ.setNo})">Try this set again</a></p>`;
    QUIZ = null;
    return;
  }
  const q = QUIZ.qs[QUIZ.idx];
  app.innerHTML = `<p class="muted">Question ${QUIZ.idx + 1} of ${QUIZ.qs.length}</p><div class="card"><h3>${esc(q.q)}</h3>${qInput(q)}</div><button class="btn" onclick="quizNext()">${QUIZ.idx + 1 == QUIZ.qs.length ? "Finish set" : "Next question"}</button>`;
}

V.courses = () => H("Courses", "Explore available courses.") + `<div class="grid">${COURSES.map(c => `<div class="card"><h3>${esc(c.name)}</h3><p>${esc(c.desc || "")}</p></div>`).join("") || "<p class=muted>No courses available.</p>"}</div>`;

V.books = () => {
  const cats = [...new Set(BOOKS.map(b => b.cat))];
  return H("Books", "Browse by category.") + (cats.map(c => `<h3 class="grp">${esc(c)}</h3><div class="grid">${BOOKS.filter(b => b.cat == c).map(b => `<div class="card"><h3>${esc(b.title)}</h3><a class="btn sm" href="${esc(b.link)}" target="_blank" rel="noopener">Open</a></div>`).join("")}</div>`).join("") || "<p class=muted>No books yet.</p>");
};

V.sites = () => {
  const cats = [...new Set(SITES.map(s => s.cat || "General"))];
  return H("Links", "Helpful links, by category.") + (cats.map(c => `<h3 class="grp">${esc(c)}</h3><div class="grid">${SITES.filter(s => (s.cat || "General") == c).map(s => `<div class="card"><h3>${esc(s.title)}</h3><p>${esc(s.desc || "")}</p><a class="btn sm" href="${esc(s.link)}" target="_blank" rel="noopener">Visit</a></div>`).join("")}</div>`).join("") || "<p class=muted>No links yet.</p>");
};

function go(h) { location.hash = h; }

function route() {
  const parts = location.hash.slice(2).split("/").map(decodeURIComponent), p = parts[0] || "home";
  QUIZ = null;
  app.innerHTML = p == "practice" ? V.practice(parts.slice(1)) : (V[p] || V.home)(parts[1], parts[2]);
  document.querySelectorAll("nav a").forEach(a => a.classList.toggle("on", a.getAttribute("href") == "#/" + (p == "course" ? "courses" : p)));
}

addEventListener("hashchange", () => { route(); scrollTo(0, 0); });
loadAll();
