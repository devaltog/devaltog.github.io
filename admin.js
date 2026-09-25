const app=document.getElementById("app"),who=document.getElementById("who");
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const v=id=>(document.getElementById(id)||{value:""}).value.trim();
const cb=id=>!!(document.getElementById(id)||{}).checked;
let COURSES=[],LESSONS=[],QUESTIONS=[],BOOKS=[],SITES=[],CATS=[],TILES=[],SET={};
let EDIT={course:null,lesson:null,question:null,book:null,site:null};
let mopts=[["",""],["",""],["",""]]; // matching rows while building a question
auth.onAuthStateChanged(u=>{if(u){who.textContent=u.email;loadAll()}else{who.textContent="";renderLogin()}});
function renderLogin(){app.innerHTML=`<div class="card narrow"><h2>Trainer login</h2><p class="muted">Sign in with the account created in Firebase (see setup guide).</p>
<div class="list"><input id="em" placeholder="Email"><input id="pw" type="password" placeholder="Password"><button class="btn" onclick="doLogin()">Log in</button><p id="err" style="color:#ff9a9a"></p></div></div>`}
function doLogin(){auth.signInWithEmailAndPassword(v("em"),v("pw")).catch(e=>document.getElementById("err").textContent=e.message)}
function logout(){auth.signOut()}
async function loadAll(){
 const grab=async n=>{const q=await db.collection(n).get();return q.docs.map(d=>({id:d.id,...d.data()}))};
 [COURSES,LESSONS,QUESTIONS,BOOKS,SITES,CATS,TILES]=await Promise.all(["courses","lessons","questions","books","sites","categories","tiles"].map(grab));
 const s=await db.collection("config").doc("main").get();SET=s.exists?s.data():{heroTitle:"Development Allies BD",heroText:"",showBooks:true,showSites:true};
 renderShell(window.__sec||"settings")}
const NAV=[["settings","Site Settings"],["courses","Courses"],["lessons","Lessons"],["questions","Questions"],["categories","Book Categories"],["books","Books"],["sites","Useful Websites"],["tiles","Homepage Tiles"]];
function renderShell(sec){window.__sec=sec;app.innerHTML=`<div class="dash"><aside class="card">${NAV.map(x=>`<a href="javascript:renderShell('${x[0]}')" class="${x[0]==sec?"on":""}">${x[1]}</a>`).join("")}<a href="javascript:logout()" style="color:#ff9a9a">Log out</a></aside><div id="panel"></div></div>`;
 document.getElementById("panel").innerHTML=PANEL[sec]()}
const panel=(t,form,list)=>`<h2>${esc(t)}</h2><div class="card">${form}</div><div class="list">${list||"<p class=muted>Nothing yet.</p>"}</div>`;
const del=(col,id)=>`<button class="btn sm ghost" onclick="rm('${col}','${id}')">Delete</button>`;
const editBtn=(kind,id)=>`<button class="btn sm ghost" onclick="startEdit('${kind}','${id}')">Edit</button>`;
async function rm(col,id){if(!confirm("Delete this?"))return;await db.collection(col).doc(id).delete();await loadAll()}
function cancelEdit(kind){EDIT[kind]=null;renderShell(window.__sec)}
const PANEL={};

/* ---------- SETTINGS ---------- */
PANEL.settings=()=>`<h2>Site Settings</h2><div class="card list">
<label>Site / brand name<br><input id="s1" value="${esc(SET.heroTitle||"")}" style="width:100%"></label>
<label>Homepage welcome text (short, under the title)<br><textarea id="s2" rows="2" style="width:100%">${esc(SET.heroText||"")}</textarea></label>
<label>About / narrative heading<br><input id="s5" value="${esc(SET.aboutTitle||"")}" style="width:100%"></label>
<label>About / narrative text (longer story about your training, shown on Home)<br><textarea id="s6" rows="5" style="width:100%">${esc(SET.aboutText||"")}</textarea></label>
<label><input type="checkbox" id="s3" ${SET.showBooks!==false?"checked":""}> Show Books section</label>
<label><input type="checkbox" id="s4" ${SET.showSites!==false?"checked":""}> Show Useful Websites section</label>
<button class="btn" onclick="saveSettings()">Save</button></div>`;
async function saveSettings(){await db.collection("config").doc("main").set({heroTitle:v("s1"),heroText:v("s2"),aboutTitle:v("s5"),aboutText:v("s6"),showBooks:cb("s3"),showSites:cb("s4")});alert("Saved. Refresh the public site to see changes.");loadAll()}

/* ---------- COURSES (with edit) ---------- */
PANEL.courses=()=>{const e=COURSES.find(c=>c.id==EDIT.course);
return panel("Courses",`<div class="list">
<input id="c1" placeholder="Course name" value="${esc(e?e.name:"")}">
<input id="c2" placeholder="Short description" value="${esc(e?e.desc||"":"")}">
<button class="btn" onclick="saveCourse()">${e?"Update course":"Add course"}</button>
${e?`<button class="btn sm ghost" onclick="cancelEdit('course')">Cancel edit</button>`:""}
</div>`,
COURSES.map(c=>`<div class="item"><span>${esc(c.name)} <small>${esc(c.desc||"")}</small></span><span>${editBtn("course",c.id)} ${del("courses",c.id)}</span></div>`).join(""))}
function startEdit(kind,id){EDIT[kind]=id;renderShell(window.__sec)}
async function saveCourse(){if(!v("c1"))return alert("Enter a course name");const data={name:v("c1"),desc:v("c2")};
if(EDIT.course){await db.collection("courses").doc(EDIT.course).update(data);EDIT.course=null}else{await db.collection("courses").add(Object.assign({hidden:false},data))}
await loadAll()}

/* ---------- LESSONS (with edit) ---------- */
PANEL.lessons=()=>{const e=LESSONS.find(l=>l.id==EDIT.lesson);
return panel("Lessons",`<div class="list">
<select id="l1">${COURSES.map(c=>`<option value="${c.id}" ${e&&e.courseId==c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select>
<input id="l2" placeholder="Lesson title" value="${esc(e?e.title:"")}">
<input id="l3" placeholder="Video link (YouTube, optional)" value="${esc(e?e.videoUrl||"":"")}">
<input id="l4" placeholder="PDF / Google Drive link (optional)" value="${esc(e?e.pdfUrl||"":"")}">
<button class="btn" onclick="saveLesson()">${e?"Update lesson":"Add lesson"}</button>
${e?`<button class="btn sm ghost" onclick="cancelEdit('lesson')">Cancel edit</button>`:""}
</div>`,
LESSONS.map(l=>`<div class="item"><span>${esc(l.title)} <small>${esc((COURSES.find(c=>c.id==l.courseId)||{}).name||"")}</small></span><span>${editBtn("lesson",l.id)} ${del("lessons",l.id)}</span></div>`).join(""))}
async function saveLesson(){if(!COURSES.length)return alert("Add a course first");if(!v("l2"))return alert("Enter a lesson title");
const data={courseId:v("l1"),title:v("l2"),videoUrl:v("l3"),pdfUrl:v("l4")};
if(EDIT.lesson){await db.collection("lessons").doc(EDIT.lesson).update(data);EDIT.lesson=null}else{await db.collection("lessons").add(data)}
await loadAll()}

/* ---------- QUESTIONS (structured MCQ/Matching, with edit) ---------- */
PANEL.questions=()=>{const e=QUESTIONS.find(q=>q.id==EDIT.question);const type=e?e.type:(window.__qtype||"MCQ");
if(e)mopts=e.type=="Matching"?(e.opts.length?e.opts.map(p=>p.split("|")):[["",""]]):mopts;
return panel("Questions",`<div class="list">
<select id="q1" onchange="window.__qtype=this.value;renderShell('questions')">${["MCQ","Written","Matching"].map(t=>`<option ${t==type?"selected":""}>${t}</option>`).join("")}</select>
<select id="q2">${COURSES.map(c=>`<option value="${c.id}" ${e&&e.courseId==c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select>
<input id="q3" placeholder="Question text" value="${esc(e?e.q:"")}">
${qform(type,e)}
<button class="btn" onclick="saveQuestion('${type}')">${e?"Update question":"Add question"}</button>
${e?`<button class="btn sm ghost" onclick="mopts=[['','']];EDIT.question=null;renderShell('questions')">Cancel edit</button>`:""}
</div>`,
QUESTIONS.map(q=>`<div class="item"><span>${q.type}: ${esc(q.q)} <small>${esc((COURSES.find(c=>c.id==q.courseId)||{}).name||"")}</small></span><span>${editBtn("question",q.id)} ${del("questions",q.id)}</span></div>`).join(""))}
function qform(type,e){
 if(type=="Written")return `<textarea id="qw_ans" rows="2" placeholder="Key words for the correct answer, comma separated">${esc(e?e.ans||"":"")}</textarea>`;
 if(type=="MCQ"){const opts=e?e.opts:["","","",""];while(opts.length<4)opts.push("");
  return `<div class="list">${opts.map((o,i)=>`<div style="display:flex;gap:8px;align-items:center"><input type="radio" name="qm_correct" value="${i}" ${e&&e.ans==o&&o?"checked":(i==0&&!e?"checked":"")}><input id="qm_o${i}" placeholder="Option ${i+1}${i>1?' (optional)':''}" value="${esc(o)}" style="flex:1"></div>`).join("")}</div>`}
 // Matching
 return `<div id="mrows">${mopts.map((p,i)=>`<div style="display:flex;gap:8px;margin:4px 0"><input placeholder="Left item" value="${esc(p[0])}" onchange="mopts[${i}][0]=this.value"><input placeholder="Matches with" value="${esc(p[1])}" onchange="mopts[${i}][1]=this.value"></div>`).join("")}</div><button type="button" class="btn sm ghost" onclick="mopts.push(['','']);renderShell('questions')">+ Add row</button>`}
async function saveQuestion(type){if(!COURSES.length)return alert("Add a course first");if(!v("q3"))return alert("Enter the question");
let opts=[],ans="";
if(type=="MCQ"){opts=[0,1,2,3].map(i=>v("qm_o"+i)).filter(Boolean);const r=document.querySelector('[name=qm_correct]:checked');ans=r?v("qm_o"+r.value):"";if(!ans)return alert("Mark which option is correct")}
else if(type=="Written"){ans=v("qw_ans")}
else{opts=mopts.filter(p=>p[0]&&p[1]).map(p=>p[0]+"|"+p[1]);if(!opts.length)return alert("Add at least one matching row")}
const data={type,courseId:v("q2"),q:v("q3"),opts,ans};
if(EDIT.question){await db.collection("questions").doc(EDIT.question).update(data);EDIT.question=null}else{await db.collection("questions").add(data)}
mopts=[["",""]];await loadAll()}

/* ---------- CATEGORIES ---------- */
PANEL.categories=()=>panel("Book Categories",`<div class="list"><input id="cat1" placeholder="Category name (e.g. Fiction, CBTA Manuals)"><button class="btn" onclick="addCat()">Add category</button></div>`,
CATS.map(c=>`<div class="item"><span>${esc(c.name)}</span>${del("categories",c.id)}</div>`).join(""))
async function addCat(){if(!v("cat1"))return alert("Enter a category name");await db.collection("categories").add({name:v("cat1")});await loadAll()}

/* ---------- BOOKS (category dropdown + edit) ---------- */
PANEL.books=()=>{const e=BOOKS.find(b=>b.id==EDIT.book);
if(!CATS.length)return panel("Books",`<p>Add at least one <b>Book Category</b> first (left menu), then come back here.</p>`,"");
return panel("Books",`<div class="list">
<select id="b1">${CATS.map(c=>`<option value="${esc(c.name)}" ${e&&e.cat==c.name?"selected":""}>${esc(c.name)}</option>`).join("")}</select>
<input id="b2" placeholder="Book title" value="${esc(e?e.title:"")}">
<input id="b3" placeholder="Google Drive link" value="${esc(e?e.link||"":"")}">
<button class="btn" onclick="saveBook()">${e?"Update book":"Add book"}</button>
${e?`<button class="btn sm ghost" onclick="cancelEdit('book')">Cancel edit</button>`:""}
</div>`,
BOOKS.map(b=>`<div class="item"><span>${esc(b.title)} <small>${esc(b.cat)}</small></span><span>${editBtn("book",b.id)} ${del("books",b.id)}</span></div>`).join(""))}
async function saveBook(){if(!v("b2"))return alert("Enter a title");const data={cat:v("b1"),title:v("b2"),link:v("b3")};
if(EDIT.book){await db.collection("books").doc(EDIT.book).update(data);EDIT.book=null}else{await db.collection("books").add(data)}
await loadAll()}

/* ---------- SITES (with edit) ---------- */
PANEL.sites=()=>{const e=SITES.find(s=>s.id==EDIT.site);
return panel("Useful Websites",`<div class="list">
<input id="w1" placeholder="Title" value="${esc(e?e.title:"")}">
<input id="w2" placeholder="Short description" value="${esc(e?e.desc||"":"")}">
<input id="w3" placeholder="Link" value="${esc(e?e.link||"":"")}">
<button class="btn" onclick="saveSite()">${e?"Update link":"Add link"}</button>
${e?`<button class="btn sm ghost" onclick="cancelEdit('site')">Cancel edit</button>`:""}
</div>`,
SITES.map(s=>`<div class="item"><span>${esc(s.title)}</span><span>${editBtn("site",s.id)} ${del("sites",s.id)}</span></div>`).join(""))}
async function saveSite(){if(!v("w1"))return alert("Enter a title");const data={title:v("w1"),desc:v("w2"),link:v("w3")};
if(EDIT.site){await db.collection("sites").doc(EDIT.site).update(data);EDIT.site=null}else{await db.collection("sites").add(data)}
await loadAll()}

/* ---------- HOMEPAGE TILES ---------- */
PANEL.tiles=()=>panel("Homepage Tiles","Extra cards on your homepage, linking anywhere you like — another page on your site, or an outside link.",
`<div class="card list">
<input id="t1" placeholder="Tile title (e.g. Certificates)">
<input id="t2" placeholder="Short description">
<input id="t3" placeholder="Link (e.g. #/books or https://drive.google.com/...)">
<button class="btn" onclick="addTile()">Add tile</button>
</div>`+TILES.map(t=>`<div class="item"><span>${esc(t.title)} <small>${esc(t.link)}</small></span>${del("tiles",t.id)}</div>`).join(""))
async function addTile(){if(!v("t1"))return alert("Enter a title");await db.collection("tiles").add({title:v("t1"),desc:v("t2"),link:v("t3")});await loadAll()}
