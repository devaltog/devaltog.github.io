/* Trainer dashboard (admin.js) v7.2 (7.1 fixes + categories, subcategories, tags, ordering) */
const app=document.getElementById("app"),who=document.getElementById("who");
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const v=id=>(document.getElementById(id)||{value:""}).value.trim();
const cb=id=>!!(document.getElementById(id)||{}).checked;
let COURSES=[],LESSONS=[],QUESTIONS=[],BOOKS=[],SITES=[],CATS=[],LCATS=[],TILES=[],FLINKS=[],SET={};
const FTYPES=["Mobile","WhatsApp","Email","LinkedIn","Facebook","Website","Custom"];
const FICON={Mobile:"📞",WhatsApp:"💬",Email:"✉️",LinkedIn:"💼",Facebook:"📘",Website:"🌐",Custom:"🔗"};
let EDIT={course:null,lesson:null,question:null,book:null,site:null,tile:null,flink:null,catbook:null,catlink:null};
let mopts=[["",""],["",""],["",""]]; // matching rows while building a question
const orderKey=o=>(o&&String(o).trim())?String(o).trim():"\uFFFF";
const natSort=(a,b)=>orderKey(a).localeCompare(orderKey(b),undefined,{numeric:true,sensitivity:"base"});
auth.onAuthStateChanged(u=>{if(u){who.textContent=u.email;loadAll()}else{who.textContent="";renderLogin()}});
function renderLogin(){app.innerHTML=`<div class="card narrow"><h2>Trainer login</h2><p class="muted">Sign in with the account created in Firebase (see setup guide).</p>
<div class="list"><input id="em" placeholder="Email"><input id="pw" type="password" placeholder="Password"><button class="btn" onclick="doLogin()">Log in</button><p id="err" style="color:#ff9a9a"></p></div></div>`}
function doLogin(){auth.signInWithEmailAndPassword(v("em"),v("pw")).catch(e=>document.getElementById("err").textContent=e.message)}
function logout(){auth.signOut()}
async function loadAll(){
 const grab=async n=>{const q=await db.collection(n).get();return q.docs.map(d=>({id:d.id,...d.data()}))};
 [COURSES,LESSONS,QUESTIONS,BOOKS,SITES,CATS,LCATS,TILES,FLINKS]=await Promise.all(["courses","lessons","questions","books","sites","categories","linkcats","tiles","footerlinks"].map(grab));
 const s=await db.collection("config").doc("main").get();SET=s.exists?s.data():{heroTitle:"Development Allies BD",heroText:"",showBooks:true,showSites:true};
 renderShell(window.__sec||"settings")}
const NAV=[["settings","Site Settings"],["courses","Courses"],["lessons","Lessons"],["questions","Questions"],["categories","Book Categories"],["books","Books"],["linkcats","Link Categories"],["sites","Links"],["tiles","Homepage Tiles"],["flinks","Footer Buttons"]];
function renderShell(sec){window.__sec=sec;app.innerHTML=`<div class="dash"><aside class="card">${NAV.map(x=>`<a href="javascript:renderShell('${x[0]}')" class="${x[0]==sec?"on":""}">${x[1]}</a>`).join("")}<a href="javascript:logout()" style="color:#ff9a9a">Log out</a></aside><div id="panel"></div></div>`;
 document.getElementById("panel").innerHTML=PANEL[sec]()}
const panel=(t,form,list)=>`<h2>${esc(t)}</h2><div class="card">${form}</div><div class="list">${list||"<p class=muted>Nothing yet.</p>"}</div>`;
const del=(col,id)=>`<button class="btn sm ghost" onclick="rm('${col}','${id}')">Delete</button>`;
const editBtn=(kind,id)=>`<button class="btn sm ghost" onclick="startEdit('${kind}','${id}')">Edit</button>`;
async function rm(col,id){if(!confirm("Delete this?"))return;await db.collection(col).doc(id).delete();await loadAll()}
function cancelEdit(kind){EDIT[kind]=null;if(kind=="flink")window.__fForm=null;renderShell(window.__sec)}
const PANEL={};

/* ---------- SETTINGS ---------- */
PANEL.settings=()=>`<h2>Site Settings</h2><div class="card list">
<label>Site / brand name<br><input id="s1" value="${esc(SET.heroTitle||"")}" style="width:100%"></label>
<label>Homepage welcome text (short, under the title)<br><textarea id="s2" rows="2" style="width:100%">${esc(SET.heroText||"")}</textarea></label>
<label>About / narrative heading<br><input id="s5" value="${esc(SET.aboutTitle||"")}" style="width:100%"></label>
<label>About / narrative text (longer story about your training, shown on Home)<br><textarea id="s6" rows="5" style="width:100%">${esc(SET.aboutText||"")}</textarea></label>
<label>Small logo — paste an image link (top-left, next to your site name)<br><input id="s7" placeholder="https://... (image link)" value="${esc(SET.logoUrl||"")}" style="width:100%"></label>
<label>Homepage image — paste an image link (shown below the welcome text)<br><input id="s8" placeholder="https://... (image link)" value="${esc(SET.heroImageUrl||"")}" style="width:100%"></label>
<label><input type="checkbox" id="s3" ${SET.showBooks!==false?"checked":""}> Show Books section</label>
<label><input type="checkbox" id="s4" ${SET.showSites!==false?"checked":""}> Show Links section</label>
<button class="btn" onclick="saveSettings()">Save</button></div>
<div class="note" style="color:var(--mut);font-size:14px;margin-top:8px">Tip: upload an image to Google Drive, set it to "Anyone with the link," open it, then use a link like <code>https://drive.google.com/uc?export=view&id=FILE_ID</code> (replace FILE_ID with yours) so it displays as an image rather than opening a preview page.</div>`;
async function saveSettings(){await db.collection("config").doc("main").set({heroTitle:v("s1"),heroText:v("s2"),aboutTitle:v("s5"),aboutText:v("s6"),logoUrl:v("s7"),heroImageUrl:v("s8"),showBooks:cb("s3"),showSites:cb("s4")});alert("Saved. Refresh the public site to see changes.");loadAll()}

/* ---------- COURSES (with edit) ---------- */
PANEL.courses=()=>{const e=COURSES.find(c=>c.id==EDIT.course);
const sorted=COURSES.slice().sort((a,b)=>natSort(a.order,b.order));
return panel("Courses",`<div class="list">
<input id="c1" placeholder="Course name" value="${esc(e?e.name:"")}">
<input id="c2" placeholder="Short description" value="${esc(e?e.desc||"":"")}">
<input id="c3" placeholder="Order (e.g. 1, 2, A, B — controls the sequence shown)" value="${esc(e?e.order||"":"")}">
${colorPicker("c",e)}
<button class="btn" onclick="saveCourse()">${e?"Update course":"Add course"}</button>
${e?`<button class="btn sm ghost" onclick="cancelEdit('course')">Cancel edit</button>`:""}
</div>`,
sorted.map(c=>`<div class="item"><span>${esc(c.order?"["+c.order+"] ":"")}${esc(c.name)} <small>${esc(c.desc||"")}</small></span><span>${editBtn("course",c.id)} ${del("courses",c.id)}</span></div>`).join(""))}
function colorPicker(p,e){const has=!!(e&&e.color);return `<label><input type="checkbox" id="${p}4" ${has?"checked":""} onchange="document.getElementById('${p}5').disabled=!this.checked"> Use a custom card color (default: site theme)</label> <input type="color" id="${p}5" value="${e&&e.color?esc(e.color):"#2b6cb0"}" ${has?"":"disabled"}>`}
function startEdit(kind,id){EDIT[kind]=id;if(kind=="flink")window.__fForm=null;renderShell(window.__sec);window.scrollTo(0,0)}
async function saveCourse(){if(!v("c1"))return alert("Enter a course name");const data={name:v("c1"),desc:v("c2"),order:v("c3"),color:cb("c4")?v("c5"):""};
if(EDIT.course){await db.collection("courses").doc(EDIT.course).update(data);EDIT.course=null}else{await db.collection("courses").add(Object.assign({hidden:false},data))}
await loadAll()}

/* ---------- LESSONS (with edit, course filter + search) ---------- */
PANEL.lessons=()=>{const e=LESSONS.find(l=>l.id==EDIT.lesson);
const filt=window.__lFilter||"all",search=window.__lSearch||"";
return panel("Lessons",`<div class="list">
<select id="l1">${COURSES.map(c=>`<option value="${c.id}" ${e&&e.courseId==c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select>
<input id="l2" placeholder="Lesson title" value="${esc(e?e.title:"")}">
<input id="l3" placeholder="Video link (YouTube, optional)" value="${esc(e?e.videoUrl||"":"")}">
<input id="l4" placeholder="PDF / Google Drive link (optional)" value="${esc(e?e.pdfUrl||"":"")}">
<input id="l5" placeholder="Order (e.g. 1, 2, A, B — controls the sequence shown)" value="${esc(e?e.order||"":"")}">
<button class="btn" onclick="saveLesson()">${e?"Update lesson":"Add lesson"}</button>
${e?`<button class="btn sm ghost" onclick="cancelEdit('lesson')">Cancel edit</button>`:""}
</div>
<div class="list" style="margin-top:14px;border-top:1px solid var(--line);padding-top:10px">
<b>Browse lessons</b>
<select onchange="window.__lFilter=this.value;renderShell('lessons')"><option value="all" ${filt=="all"?"selected":""}>— All courses —</option>${COURSES.map(c=>`<option value="${c.id}" ${filt==c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select>
<input id="lsearch" placeholder="Search lessons (title, order, course)..." value="${esc(search)}" oninput="lSearchInput(this.value)">
</div>`,
`<div id="lresults">${lessonRows()}</div>`)+materialsPanel()}
/* v7.1: only the result list is redrawn while typing, so the search box keeps focus */
function lSearchInput(val){window.__lSearch=val;const el=document.getElementById("lresults");if(el)el.innerHTML=lessonRows()}
function lessonRows(){const filt=window.__lFilter||"all",toks=(window.__lSearch||"").trim().toLowerCase().split(/\s+/).filter(Boolean);
let shown=LESSONS.slice();
if(filt!=="all")shown=shown.filter(l=>l.courseId==filt);
if(toks.length)shown=shown.filter(l=>{const h=[l.title,l.order,(COURSES.find(c=>c.id==l.courseId)||{}).name].join(" ").toLowerCase();return toks.every(t=>h.includes(t))});
shown.sort((a,b)=>natSort(a.order,b.order));
return `<p class="muted" style="font-size:13px;margin:4px 0">Showing ${shown.length} of ${LESSONS.length} lessons</p>`+
(shown.map(l=>`<div class="item"><span>${esc(l.order?"["+l.order+"] ":"")}${esc(l.title)} <small>${esc((COURSES.find(c=>c.id==l.courseId)||{}).name||"")}</small></span><span>${editBtn("lesson",l.id)} ${del("lessons",l.id)}</span></div>`).join("")||"<p class=muted>No lessons match.</p>")}
function materialsPanel(){if(!LESSONS.length)return"";
const lid=LESSONS.find(l=>l.id==window.__matLesson)?window.__matLesson:LESSONS[0].id;
const lesson=LESSONS.find(l=>l.id==lid),mats=(lesson&&lesson.materials)||[];
return `<h3 class="grp">Extra materials for a lesson</h3><div class="card list">
<select onchange="window.__matLesson=this.value;renderShell('lessons')">${LESSONS.map(l=>`<option value="${l.id}" ${l.id==lid?"selected":""}>${esc(l.title)}</option>`).join("")}</select>
<div class="list">${mats.map((m,i)=>`<div class="item"><span>${esc(m.type)}: ${esc(m.title)}</span><span><a class="btn sm ghost" href="${esc(m.link)}" target="_blank" rel="noopener">Open</a> <button class="btn sm ghost" onclick="rmMaterial('${lid}',${i})">Delete</button></span></div>`).join("")||"<p class=muted>No extra materials yet.</p>"}</div>
<select id="mt1">${["PDF","Video","Slide","Worksheet","Link","Other"].map(t=>`<option>${t}</option>`).join("")}</select>
<input id="mt2" placeholder="Title (e.g. Practice worksheet)">
<input id="mt3" placeholder="Link (Google Drive, YouTube, etc.)">
<button class="btn" onclick="addMaterial('${lid}')">Add material</button>
</div>`}
async function addMaterial(lid){if(!v("mt2")||!v("mt3"))return alert("Enter a title and a link");
const lesson=LESSONS.find(l=>l.id==lid),mats=(lesson.materials||[]).concat([{type:v("mt1"),title:v("mt2"),link:v("mt3")}]);
await db.collection("lessons").doc(lid).update({materials:mats});await loadAll()}
async function rmMaterial(lid,i){const lesson=LESSONS.find(l=>l.id==lid),mats=(lesson.materials||[]).slice();mats.splice(i,1);
await db.collection("lessons").doc(lid).update({materials:mats});await loadAll()}
async function saveLesson(){if(!COURSES.length)return alert("Add a course first");if(!v("l2"))return alert("Enter a lesson title");
const data={courseId:v("l1"),title:v("l2"),videoUrl:v("l3"),pdfUrl:v("l4"),order:v("l5")};
if(EDIT.lesson){await db.collection("lessons").doc(EDIT.lesson).update(data);EDIT.lesson=null}else{await db.collection("lessons").add(data)}
await loadAll()}

/* ---------- QUESTIONS (persistent lesson, type-ordered, search, duplicate-set warning) ---------- */
const TYPE_ORDER={MCQ:0,Written:1,Matching:2};
PANEL.questions=()=>{if(!LESSONS.length)return panel("Questions","<p>Add at least one <b>Lesson</b> first (left menu), then come back here.</p>","");
const e=QUESTIONS.find(q=>q.id==EDIT.question);
const lsel=((window.__qLesson=="all")||LESSONS.find(l=>l.id==window.__qLesson))?window.__qLesson:LESSONS[0].id; // lesson used for filtering / adding
const sel=e?e.lessonId:lsel; // lesson the form works on
if(!e)window.__qLesson=sel;
window.__qSel=lsel;
const type=e?e.type:(window.__qtype||"MCQ");
if(e)mopts=e.type=="Matching"?(e.opts.length?e.opts.map(p=>p.split("|")):[["",""]]):mopts;
const setNo=e?(e.setNo||1):(window.__qSet||1);
const search=window.__qSearch||"",fc=window.__qCourse||"all",ft=window.__qTypeF||"all";
let fs=window.__qSetF||"all";
const qCourse=q=>q.courseId||(LESSONS.find(l=>l.id==q.lessonId)||{}).courseId;
const scope=QUESTIONS.filter(q=>(lsel=="all"||q.lessonId==lsel)&&(ft=="all"||q.type==ft)&&(fc=="all"||qCourse(q)==fc));
const sets=[...new Set(scope.map(q=>q.setNo||1))].sort((a,b)=>a-b);
if(fs!="all"&&!sets.includes(+fs)){fs="all";window.__qSetF="all"}
const addForm=sel=="all"?`<p class="muted">Choose a specific lesson above to add a new question to it.</p>`:`
<select id="q1" onchange="window.__qtype=this.value;renderShell('questions')">${["MCQ","Written","Matching"].map(t=>`<option ${t==type?"selected":""}>${t}</option>`).join("")}</select>
<label>Set number (groups questions — trainees pick a set to practise)<br><input id="q0" type="number" min="1" value="${setNo}" style="width:100px"></label>
<input id="q3" placeholder="Question text" value="${esc(e?e.q:"")}">
${qform(type,e)}
<button class="btn" onclick="saveQuestion('${type}')">${e?"Update question":"Add question"}</button>
${e?`<button class="btn sm ghost" onclick="mopts=[['','']];EDIT.question=null;renderShell('questions')">Cancel edit</button>`:""}`;
const opt=(val,label,cur)=>`<option value="${esc(val)}" ${String(cur)==String(val)?"selected":""}>${esc(label)}</option>`;
return `<h2>Questions</h2>
<div class="card list">
<b>Search &amp; filter questions</b>
<input id="qsearch" placeholder="Keyword search — question, answer, options, lesson, course (several words: all must match)" value="${esc(search)}" oninput="qSearchInput(this.value)">
<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
<select title="Course" onchange="qSetCourse(this.value)">${opt("all","— All courses —",fc)}${COURSES.map(c=>opt(c.id,c.name,fc)).join("")}</select>
<select title="Lesson" onchange="window.__qLesson=this.value;renderShell('questions')"><option value="all" ${lsel=="all"?"selected":""}>— All lessons —</option>${COURSES.filter(c=>fc=="all"||c.id==fc).map(c=>`<optgroup label="${esc(c.name)}">${LESSONS.filter(l=>l.courseId==c.id).map(l=>`<option value="${l.id}" ${lsel==l.id?"selected":""}>${esc(l.title)}</option>`).join("")}</optgroup>`).join("")}</select>
<select title="Type" onchange="window.__qTypeF=this.value;renderShell('questions')">${opt("all","— All types —",ft)}${["MCQ","Written","Matching"].map(t=>opt(t,t,ft)).join("")}</select>
<select title="Set" onchange="window.__qSetF=this.value;renderShell('questions')">${opt("all","— All sets —",fs)}${sets.map(n=>opt(n,"Set "+n,fs)).join("")}</select>
<button class="btn sm ghost" onclick="qClear()">Clear filters</button>
</div></div>
<div class="card list"><b>${e?"Edit question":"Add a question"}</b>${addForm}</div>
<div id="qresults" class="list">${qResults()}</div>`}
/* v7.1: keyword search redraws only the result list (keeps focus + the add/edit form untouched) */
function qSearchInput(val){window.__qSearch=val;const el=document.getElementById("qresults");if(el)el.innerHTML=qResults()}
function qSetCourse(c){window.__qCourse=c;if(c!=="all"){const l=LESSONS.find(x=>x.id==window.__qLesson);if(!l||l.courseId!=c)window.__qLesson="all"}renderShell("questions")}
function qClear(){window.__qSearch="";window.__qCourse="all";window.__qTypeF="all";window.__qSetF="all";window.__qLesson="all";renderShell("questions")}
function qHay(q){const l=LESSONS.find(x=>x.id==q.lessonId)||{},c=COURSES.find(x=>x.id==(q.courseId||l.courseId))||{};
 return [q.q,q.ans,(q.opts||[]).join(" "),q.type,"set "+(q.setNo||1),l.title,c.name].join(" ").toLowerCase()}
function qResults(){const sel=window.__qSel||"all",fc=window.__qCourse||"all",ft=window.__qTypeF||"all",fs=window.__qSetF||"all";
const toks=(window.__qSearch||"").trim().toLowerCase().split(/\s+/).filter(Boolean);
let qs=QUESTIONS.slice();
if(sel!=="all")qs=qs.filter(q=>q.lessonId==sel);
if(fc!=="all")qs=qs.filter(q=>(q.courseId||(LESSONS.find(l=>l.id==q.lessonId)||{}).courseId)==fc);
if(ft!=="all")qs=qs.filter(q=>q.type==ft);
if(fs!=="all")qs=qs.filter(q=>(q.setNo||1)==fs);
if(toks.length)qs=qs.filter(q=>{const h=qHay(q);return toks.every(t=>h.includes(t))});
qs.sort((a,b)=>{if(a.lessonId!==b.lessonId){const la=LESSONS.find(l=>l.id==a.lessonId)||{},lb=LESSONS.find(l=>l.id==b.lessonId)||{};const c=natSort(la.order,lb.order);if(c)return c;return(la.title||"").localeCompare(lb.title||"")}if(TYPE_ORDER[a.type]!=TYPE_ORDER[b.type])return TYPE_ORDER[a.type]-TYPE_ORDER[b.type];return(a.setNo||1)-(b.setNo||1)});
return `<p class="muted" style="font-size:13px;margin:4px 0">Showing ${qs.length} of ${QUESTIONS.length} questions</p>`+
(qs.map(q=>`<div class="item"><span>${q.type} · Set ${q.setNo||1}: ${esc(q.q)}${sel=="all"?` <small>${esc((LESSONS.find(l=>l.id==q.lessonId)||{}).title||"")}</small>`:""}</span><span>${editBtn("question",q.id)} ${del("questions",q.id)}</span></div>`).join("")||"<p class=muted>No questions match.</p>")}
function qform(type,e){
 if(type=="Written")return `<textarea id="qw_ans" rows="2" placeholder="Key words for the correct answer, comma separated">${esc(e?e.ans||"":"")}</textarea>`;
 if(type=="MCQ"){const opts=e?e.opts:["","","",""];while(opts.length<4)opts.push("");
  return `<div class="list">${opts.map((o,i)=>`<div style="display:flex;gap:8px;align-items:center"><input type="radio" name="qm_correct" value="${i}" ${e&&e.ans==o&&o?"checked":(i==0&&!e?"checked":"")}><input id="qm_o${i}" placeholder="Option ${i+1}${i>1?' (optional)':''}" value="${esc(o)}" style="flex:1"></div>`).join("")}</div>`}
 // Matching
 return `<div id="mrows">${mopts.map((p,i)=>`<div style="display:flex;gap:8px;margin:4px 0"><input placeholder="Left item" value="${esc(p[0])}" onchange="mopts[${i}][0]=this.value"><input placeholder="Matches with" value="${esc(p[1])}" onchange="mopts[${i}][1]=this.value"></div>`).join("")}</div><button type="button" class="btn sm ghost" onclick="mopts.push(['','']);renderShell('questions')">+ Add row</button>`}
async function saveQuestion(type){const eq=QUESTIONS.find(x=>x.id==EDIT.question);const lessonId=eq?eq.lessonId:window.__qLesson;
if(!lessonId||lessonId=="all")return alert("Choose a specific lesson first");
if(!v("q3"))return alert("Enter the question");
let opts=[],ans="";
if(type=="MCQ"){opts=[0,1,2,3].map(i=>v("qm_o"+i)).filter(Boolean);const r=document.querySelector('[name=qm_correct]:checked');ans=r?v("qm_o"+r.value):"";if(!ans)return alert("Mark which option is correct")}
else if(type=="Written"){ans=v("qw_ans")}
else{opts=mopts.filter(p=>p[0]&&p[1]).map(p=>p[0]+"|"+p[1]);if(!opts.length)return alert("Add at least one matching row")}
const setNo=parseInt(v("q0"))||1;
if(!EDIT.question){const existing=QUESTIONS.filter(q=>q.lessonId==lessonId&&q.type==type&&(q.setNo||1)==setNo);
 if(existing.length&&!confirm(`Set ${setNo} already has ${existing.length} ${type} question(s) for this lesson. Add another to it?`))return}
const lesson=LESSONS.find(l=>l.id==lessonId);
const data={type,lessonId,courseId:lesson?lesson.courseId:"",setNo,q:v("q3"),opts,ans};
if(EDIT.question){await db.collection("questions").doc(EDIT.question).update(data);EDIT.question=null}else{await db.collection("questions").add(data)}
window.__qSet=setNo;mopts=[["",""]];await loadAll()}

/* =====================================================================
   CATEGORIES / SUBCATEGORIES / TAGS / ORDERING  (Books + Links share the same code)
   Items point to their category by NAME (item.cat) and subcategory by name (item.sub).
   So renaming/deleting a category or subcategory also updates every item that uses it.
   ===================================================================== */
const CK={
 book:{col:"categories",icol:"books",title:"Book Categories",noun:"book",items:()=>BOOKS,cats:()=>CATS,editKey:"catbook",ph:"Category name (e.g. Fiction, CBTA Manuals)"},
 link:{col:"linkcats",icol:"sites",title:"Link Categories",noun:"link",items:()=>SITES,cats:()=>LCATS,editKey:"catlink",ph:"Category name (e.g. Government, Practice tools)"}};
const catSort=(a,b)=>{const f=x=>(x.order===undefined||x.order===null||x.order==="")?1e9:Number(x.order);return (f(a)-f(b))||String(a.name).localeCompare(String(b.name))};
const sortedCats=k=>CK[k].cats().slice().sort(catSort);
async function batchUpdate(col,pairs){for(let i=0;i<pairs.length;i+=400){const b=db.batch();pairs.slice(i,i+400).forEach(p=>b.update(db.collection(col).doc(p[0]),p[1]));await b.commit()}}
function parseTags(s){const out=[];String(s||"").split(/[,\s;]+/).forEach(t=>{t=t.replace(/^#+/,"").toLowerCase().replace(/[^\p{L}\p{N}_-]/gu,"");if(t&&!out.includes(t))out.push(t)});return out.slice(0,12)}
const tagsTxt=x=>(x&&Array.isArray(x.tags)?x.tags:[]).map(t=>"#"+t).join(", ");
function addTagTo(id,t){const el=document.getElementById(id);if(!el)return;const cur=parseTags(el.value);if(!cur.includes(t))cur.push(t);el.value=cur.map(x=>"#"+x).join(", ")}
function tagHints(k,inputId){const all={};CK[k].items().forEach(x=>(x.tags||[]).forEach(t=>all[t]=(all[t]||0)+1));
 const ks=Object.keys(all).sort((a,b)=>all[b]-all[a]||a.localeCompare(b)).slice(0,30);
 return ks.length?`<div class="muted" style="font-size:13px">Existing tags (click to add): ${ks.map(t=>`<a class="tagchip" href="javascript:addTagTo('${inputId}','${esc(t)}')">#${esc(t)}</a>`).join(" ")}</div>`:""}
function subOptions(k,catName,cur){const c=CK[k].cats().find(x=>x.name==catName),subs=(c&&c.subs)||[];
 return `<option value="">— No subcategory —</option>`+subs.map(x=>`<option value="${esc(x)}" ${x==cur?"selected":""}>${esc(x)}</option>`).join("")}
function adminItems(k){const cats=sortedCats(k);
 const ci=n=>{const i=cats.findIndex(c=>c.name==n);return i<0?999:i};
 const si=x=>{if(!x.sub)return -1;const c=cats.find(c=>c.name==x.cat),i=c?(c.subs||[]).indexOf(x.sub):-1;return i<0?998:i};
 return CK[k].items().slice().sort((a,b)=>ci(a.cat)-ci(b.cat)||si(a)-si(b)||natSort(a.order,b.order))}
const itemMeta=x=>`<small>${esc(x.cat||"General")}${x.sub?" › "+esc(x.sub):""}</small>${(x.tags&&x.tags.length)?` <small style="color:var(--brand)">${x.tags.map(t=>"#"+esc(t)).join(" ")}</small>`:""}`;

/* ----- category manager (add / edit / reorder / delete + subcategories) ----- */
function catPanel(k){const C=CK[k],e=C.cats().find(c=>c.id==EDIT[C.editKey]),cats=sortedCats(k),items=C.items();
 const form=`<div class="list">
<input id="cat_name" placeholder="${esc(C.ph)}" value="${esc(e?e.name:"")}">
<button class="btn" onclick="catSave('${k}')">${e?"Update category":"Add category"}</button>
${e?`<button class="btn sm ghost" onclick="cancelEdit('${C.editKey}')">Cancel edit</button><p class="muted" style="font-size:13px;margin:0">Renaming is safe: the ${items.filter(x=>x.cat==e.name).length} ${C.noun}(s) in this category are moved to the new name automatically.</p>`:`<p class="muted" style="font-size:13px;margin:0">Use ▲ ▼ to choose the order visitors see. Add subcategories under each category below.</p>`}
</div>`;
 const list=cats.map((c,i)=>{const subs=c.subs||[],inCat=items.filter(x=>x.cat==c.name);
  return `<div class="card list" style="padding:12px">
<div class="item"><span><b>${i+1}. ${esc(c.name)}</b> <small>${inCat.length} ${C.noun}(s)</small></span><span>
<button class="btn sm ghost" title="Move up" onclick="catMove('${k}','${c.id}',-1)" ${i==0?"disabled":""}>▲</button>
<button class="btn sm ghost" title="Move down" onclick="catMove('${k}','${c.id}',1)" ${i==cats.length-1?"disabled":""}>▼</button>
${editBtn(C.editKey,c.id)}
<button class="btn sm ghost" onclick="catDel('${k}','${c.id}')">Delete</button></span></div>
${subs.map((sn,j)=>`<div class="item" style="margin-left:22px"><span>↳ ${esc(sn)} <small>${inCat.filter(x=>x.sub==sn).length} ${C.noun}(s)</small></span><span>
<button class="btn sm ghost" onclick="subMove('${k}','${c.id}',${j},-1)" ${j==0?"disabled":""}>▲</button>
<button class="btn sm ghost" onclick="subMove('${k}','${c.id}',${j},1)" ${j==subs.length-1?"disabled":""}>▼</button>
<button class="btn sm ghost" onclick="subRename('${k}','${c.id}',${j})">Rename</button>
<button class="btn sm ghost" onclick="subDel('${k}','${c.id}',${j})">Delete</button></span></div>`).join("")}
<div style="margin-left:22px;display:flex;gap:8px;flex-wrap:wrap"><input id="sub_${c.id}" placeholder="New subcategory in ${esc(c.name)}"><button class="btn sm ghost" onclick="subAdd('${k}','${c.id}')">+ Add subcategory</button></div>
</div>`}).join("");
 return panel(C.title,form,list)}
async function catSave(k){const C=CK[k],name=v("cat_name");if(!name)return alert("Enter a category name");
 const e=C.cats().find(c=>c.id==EDIT[C.editKey]);
 if(C.cats().some(c=>(!e||c.id!=e.id)&&String(c.name).toLowerCase()==name.toLowerCase()))return alert("A category with this name already exists");
 if(e){if(e.name!=name){const aff=C.items().filter(x=>x.cat==e.name);
   if(!confirm(`Rename "${e.name}" to "${name}"?\n\n${aff.length} ${C.noun}(s) in this category will be moved to the new name automatically.`))return;
   await db.collection(C.col).doc(e.id).update({name});
   await batchUpdate(C.icol,aff.map(x=>[x.id,{cat:name}]))}
  EDIT[C.editKey]=null}
 else{const mx=Math.max(C.cats().length,...C.cats().map(c=>Number(c.order)||0));await db.collection(C.col).add({name,subs:[],order:mx+1})}
 await loadAll()}
async function catMove(k,id,dir){const cats=sortedCats(k),i=cats.findIndex(c=>c.id==id),j=i+dir;if(i<0||j<0||j>=cats.length)return;
 [cats[i],cats[j]]=[cats[j],cats[i]];
 await batchUpdate(CK[k].col,cats.map((c,n)=>[c.id,{order:n+1}]).filter((p,n)=>cats[n].order!=n+1));await loadAll()}
async function catDel(k,id){const C=CK[k],c=C.cats().find(x=>x.id==id);if(!c)return;const aff=C.items().filter(x=>x.cat==c.name);
 if(!confirm(aff.length?`Delete category "${c.name}"?\n\n${aff.length} ${C.noun}(s) in it will NOT be deleted. They will move to "General" (no category) until you give them a new category.`:`Delete category "${c.name}"?`))return;
 if(aff.length)await batchUpdate(C.icol,aff.map(x=>[x.id,{cat:"",sub:""}]));
 await db.collection(C.col).doc(id).delete();
 const rest=sortedCats(k).filter(x=>x.id!=id);await batchUpdate(C.col,rest.map((x,n)=>[x.id,{order:n+1}]).filter((p,n)=>rest[n].order!=n+1));
 await loadAll()}
const subsOf=(k,id)=>{const c=CK[k].cats().find(x=>x.id==id);return c?(c.subs||[]).slice():[]};
async function subAdd(k,id){const name=v("sub_"+id);if(!name)return alert("Enter a subcategory name");const subs=subsOf(k,id);
 if(subs.some(x=>x.toLowerCase()==name.toLowerCase()))return alert("That subcategory already exists in this category");
 subs.push(name);await db.collection(CK[k].col).doc(id).update({subs});await loadAll()}
async function subMove(k,id,j,dir){const subs=subsOf(k,id),t=j+dir;if(t<0||t>=subs.length)return;[subs[j],subs[t]]=[subs[t],subs[j]];
 await db.collection(CK[k].col).doc(id).update({subs});await loadAll()}
async function subRename(k,id,j){const C=CK[k],c=C.cats().find(x=>x.id==id),subs=subsOf(k,id),old=subs[j];
 const nn=(prompt("Rename subcategory:",old)||"").trim();if(!nn||nn==old)return;
 if(subs.some((x,i)=>i!=j&&x.toLowerCase()==nn.toLowerCase()))return alert("That subcategory already exists in this category");
 subs[j]=nn;await db.collection(C.col).doc(id).update({subs});
 await batchUpdate(C.icol,C.items().filter(x=>x.cat==c.name&&x.sub==old).map(x=>[x.id,{sub:nn}]));await loadAll()}
async function subDel(k,id,j){const C=CK[k],c=C.cats().find(x=>x.id==id),subs=subsOf(k,id),old=subs[j];
 const aff=C.items().filter(x=>x.cat==c.name&&x.sub==old);
 if(!confirm(aff.length?`Delete subcategory "${old}"?\n\n${aff.length} ${C.noun}(s) will stay in "${c.name}" with no subcategory.`:`Delete subcategory "${old}"?`))return;
 subs.splice(j,1);await db.collection(C.col).doc(id).update({subs});
 await batchUpdate(C.icol,aff.map(x=>[x.id,{sub:""}]));await loadAll()}

PANEL.categories=()=>catPanel("book");
PANEL.linkcats=()=>catPanel("link");

/* ---------- BOOKS (category + subcategory + #tags, edit) ---------- */
PANEL.books=()=>{const e=BOOKS.find(b=>b.id==EDIT.book);
if(!CATS.length)return panel("Books",`<p>Add at least one <b>Book Category</b> first (left menu), then come back here.</p>`,"");
const cats=sortedCats("book"),cur=e?(e.cat||""):cats[0].name;
return panel("Books",`<div class="list">
<select id="b1" onchange="document.getElementById('b1s').innerHTML=subOptions('book',this.value,'')">${cats.map(c=>`<option value="${esc(c.name)}" ${cur==c.name?"selected":""}>${esc(c.name)}</option>`).join("")}<option value="" ${cur===""?"selected":""}>— No category (General) —</option></select>
<select id="b1s">${subOptions("book",cur,e?e.sub||"":"")}</select>
<input id="b2" placeholder="Book title" value="${esc(e?e.title:"")}">
<input id="b3" placeholder="Google Drive link" value="${esc(e?e.link||"":"")}">
<input id="b5" placeholder="Optional #tags (e.g. #cbta, #exam, #2024) — helps visitors find similar books" value="${esc(tagsTxt(e))}">
${tagHints("book","b5")}
<input id="b4" placeholder="Order within category (e.g. 1, 2, A, B)" value="${esc(e?e.order||"":"")}">
${colorPicker("bc",e)}
<button class="btn" onclick="saveBook()">${e?"Update book":"Add book"}</button>
${e?`<button class="btn sm ghost" onclick="cancelEdit('book')">Cancel edit</button>`:""}
</div>`,
adminItems("book").map(b=>`<div class="item"><span>${esc(b.order?"["+b.order+"] ":"")}${esc(b.title)} ${itemMeta(b)}</span><span>${editBtn("book",b.id)} ${del("books",b.id)}</span></div>`).join(""))}
async function saveBook(){if(!v("b2"))return alert("Enter a title");const data={cat:v("b1"),sub:v("b1s"),title:v("b2"),link:v("b3"),order:v("b4"),tags:parseTags(v("b5")),color:cb("bc4")?v("bc5"):""};
if(EDIT.book){await db.collection("books").doc(EDIT.book).update(data);EDIT.book=null}else{await db.collection("books").add(data)}
await loadAll()}

/* ---------- LINKS (category + subcategory + #tags, edit) ---------- */
PANEL.sites=()=>{const e=SITES.find(s=>s.id==EDIT.site);
if(!LCATS.length)return panel("Links",`<p>Add at least one <b>Link Category</b> first (left menu), then come back here.</p>`,"");
const cats=sortedCats("link"),cur=e?(e.cat||""):cats[0].name;
return panel("Links",`<div class="list">
<select id="w0" onchange="document.getElementById('w0s').innerHTML=subOptions('link',this.value,'')">${cats.map(c=>`<option value="${esc(c.name)}" ${cur==c.name?"selected":""}>${esc(c.name)}</option>`).join("")}<option value="" ${cur===""?"selected":""}>— No category (General) —</option></select>
<select id="w0s">${subOptions("link",cur,e?e.sub||"":"")}</select>
<input id="w1" placeholder="Title" value="${esc(e?e.title:"")}">
<input id="w2" placeholder="Short description" value="${esc(e?e.desc||"":"")}">
<input id="w3" placeholder="Link" value="${esc(e?e.link||"":"")}">
<input id="w5" placeholder="Optional #tags (e.g. #government, #forms) — helps visitors find similar links" value="${esc(tagsTxt(e))}">
${tagHints("link","w5")}
<input id="w4" placeholder="Order within category (e.g. 1, 2, A, B)" value="${esc(e?e.order||"":"")}">
${colorPicker("wc",e)}
<button class="btn" onclick="saveSite()">${e?"Update link":"Add link"}</button>
${e?`<button class="btn sm ghost" onclick="cancelEdit('site')">Cancel edit</button>`:""}
</div>`,
adminItems("link").map(s=>`<div class="item"><span>${esc(s.order?"["+s.order+"] ":"")}${esc(s.title)} ${itemMeta(s)}</span><span>${editBtn("site",s.id)} ${del("sites",s.id)}</span></div>`).join(""))}
async function saveSite(){if(!v("w1"))return alert("Enter a title");const data={cat:v("w0"),sub:v("w0s"),title:v("w1"),desc:v("w2"),link:v("w3"),order:v("w4"),tags:parseTags(v("w5")),color:cb("wc4")?v("wc5"):""};
if(EDIT.site){await db.collection("sites").doc(EDIT.site).update(data);EDIT.site=null}else{await db.collection("sites").add(data)}
await loadAll()}

/* ---------- HOMEPAGE TILES (add / edit / delete) ---------- */
PANEL.tiles=()=>{const e=TILES.find(t=>t.id==EDIT.tile);
return panel("Homepage Tiles",`<p class="muted" style="margin-top:0">Extra cards on your homepage, linking anywhere you like — another page on your site, or an outside link.</p>
<div class="list">
<input id="t1" placeholder="Tile title (e.g. Certificates)" value="${esc(e?e.title:"")}">
<input id="t2" placeholder="Short description" value="${esc(e?e.desc||"":"")}">
<input id="t3" placeholder="Link (e.g. #/books or https://drive.google.com/...)" value="${esc(e?e.link||"":"")}">
<button class="btn" onclick="saveTile()">${e?"Update tile":"Add tile"}</button>
${e?`<button class="btn sm ghost" onclick="cancelEdit('tile')">Cancel edit</button>`:""}
</div>`,
TILES.map(t=>`<div class="item"><span>${esc(t.title)} <small>${esc(t.desc||"")} ${esc(t.link||"")}</small></span><span>${editBtn("tile",t.id)} ${del("tiles",t.id)}</span></div>`).join(""))}
async function saveTile(){if(!v("t1"))return alert("Enter a title");const data={title:v("t1"),desc:v("t2"),link:v("t3")};
if(EDIT.tile){await db.collection("tiles").doc(EDIT.tile).update(data);EDIT.tile=null}else{await db.collection("tiles").add(data)}
await loadAll()}

/* ---------- FOOTER BUTTONS (add / edit / delete; icons: Mobile, WhatsApp, Email, LinkedIn, Facebook, Website, Custom) ---------- */
/* v7.1: the form is remembered before every re-render, so picking a type no longer jumps back to Mobile */
function flKeep(){window.__fForm={type:v("f1")||"Mobile",label:v("f2"),link:v("f3"),on:cb("f4"),color:v("f5")||"#2b6cb0"};renderShell("flinks")}
PANEL.flinks=()=>{const e=FLINKS.find(f=>f.id==EDIT.flink);
const F=window.__fForm||(e?{type:e.type||"Custom",label:e.label||"",link:e.link||"",on:!!e.color,color:e.color||"#2b6cb0"}:{type:"Mobile",label:"",link:"",on:false,color:"#2b6cb0"});
const ph=F.type=="Email"?"Email address":F.type=="WhatsApp"?"Phone number (digits only) or full link":F.type=="Mobile"?"Phone number":"Link (https://...)";
return panel("Footer Buttons",`<div class="list">
<select id="f1" onchange="flKeep()">${FTYPES.map(t=>`<option ${t==F.type?"selected":""}>${t}</option>`).join("")}</select>
<input id="f2" placeholder="Button label (e.g. Mobile, Chat on WhatsApp)" value="${esc(F.label)}">
<input id="f3" placeholder="${ph}" value="${esc(F.link)}">
<label><input type="checkbox" id="f4" ${F.on?"checked":""} onchange="document.getElementById('f5').disabled=!this.checked"> Use a custom button color (default: preset color per type)</label> <input type="color" id="f5" value="${esc(F.color)}" ${F.on?"":"disabled"}>
<button class="btn" onclick="saveFlink()">${e?"Update button":"Add button"}</button>
${e?`<button class="btn sm ghost" onclick="cancelEdit('flink')">Cancel edit</button>`:""}
</div>
<p class="muted" style="font-size:13px">Preloaded icons: ${FTYPES.map(t=>FICON[t]+" "+t).join("  ·  ")}</p>`,
FLINKS.map(f=>`<div class="item"><span>${FICON[f.type]||"🔗"} ${esc(f.label)} <small>${esc(f.type)}: ${esc(f.link)}</small></span><span>${editBtn("flink",f.id)} ${del("footerlinks",f.id)}</span></div>`).join(""))}
async function saveFlink(){if(!v("f2")||!v("f3"))return alert("Enter a label and a link/number");
const data={type:v("f1"),label:v("f2"),link:v("f3"),color:cb("f4")?v("f5"):""};
if(EDIT.flink){await db.collection("footerlinks").doc(EDIT.flink).update(data);EDIT.flink=null;window.__fForm=null}
else{await db.collection("footerlinks").add(data);window.__fForm={type:data.type,label:"",link:"",on:false,color:"#2b6cb0"}}
await loadAll()}
