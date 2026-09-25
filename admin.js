const app=document.getElementById("app"),who=document.getElementById("who");
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const v=id=>(document.getElementById(id)||{value:""}).value.trim();
let COURSES=[],LESSONS=[],QUESTIONS=[],BOOKS=[],SITES=[],SET={};
auth.onAuthStateChanged(u=>{if(u){who.textContent=u.email;loadAll()}else{who.textContent="";renderLogin()}});
function renderLogin(){app.innerHTML=`<div class="card narrow"><h2>Trainer login</h2><p class="muted">Sign in with the account created in Firebase (see setup guide).</p>
<div class="list"><input id="em" placeholder="Email"><input id="pw" type="password" placeholder="Password"><button class="btn" onclick="doLogin()">Log in</button><p id="err" style="color:#ff9a9a"></p></div></div>`}
function doLogin(){auth.signInWithEmailAndPassword(v("em"),v("pw")).catch(e=>document.getElementById("err").textContent=e.message)}
function logout(){auth.signOut()}
async function loadAll(){
 const grab=async n=>{const q=await db.collection(n).get();return q.docs.map(d=>({id:d.id,...d.data()}))};
 [COURSES,LESSONS,QUESTIONS,BOOKS,SITES]=await Promise.all(["courses","lessons","questions","books","sites"].map(grab));
 const s=await db.collection("config").doc("main").get();SET=s.exists?s.data():{heroTitle:"Development Allies BD",heroText:"",showBooks:true,showSites:true};
 renderShell("settings")}
const NAV=[["settings","Site Settings"],["courses","Courses"],["lessons","Lessons"],["questions","Questions"],["books","Books"],["sites","Useful Websites"]];
function renderShell(sec){app.innerHTML=`<div class="dash"><aside class="card">${NAV.map(x=>`<a href="javascript:renderShell('${x[0]}')" class="${x[0]==sec?"on":""}">${x[1]}</a>`).join("")}<a href="javascript:logout()" style="color:#ff9a9a">Log out</a></aside><div id="panel"></div></div>`;
 document.getElementById("panel").innerHTML=PANEL[sec]()}
const panel=(t,form,list)=>`<h2>${esc(t)}</h2><div class="card">${form}</div><div class="list">${list||"<p class=muted>Nothing yet.</p>"}</div>`;
const del=(col,id)=>`<button class="btn sm ghost" onclick="rm('${col}','${id}')">Delete</button>`;
async function rm(col,id){if(!confirm("Delete this?"))return;await db.collection(col).doc(id).delete();await loadAll()}
const PANEL={};
PANEL.settings=()=>`<h2>Site Settings</h2><div class="card list">
<label>Site / brand name<br><input id="s1" value="${esc(SET.heroTitle||"")}" style="width:100%"></label>
<label>Homepage welcome text<br><textarea id="s2" rows="2" style="width:100%">${esc(SET.heroText||"")}</textarea></label>
<label><input type="checkbox" id="s3" ${SET.showBooks!==false?"checked":""}> Show Books section</label>
<label><input type="checkbox" id="s4" ${SET.showSites!==false?"checked":""}> Show Useful Websites section</label>
<button class="btn" onclick="saveSettings()">Save</button></div>`;
async function saveSettings(){await db.collection("config").doc("main").set({heroTitle:v("s1"),heroText:v("s2"),showBooks:document.getElementById("s3").checked,showSites:document.getElementById("s4").checked});alert("Saved. Refresh the public site to see changes.");loadAll()}
PANEL.courses=()=>panel("Courses",`<div class="list"><input id="c1" placeholder="Course name"><input id="c2" placeholder="Short description"><button class="btn" onclick="addCourse()">Add course</button></div>`,
COURSES.map(c=>`<div class="item"><span>${esc(c.name)} <small>${esc(c.desc||"")}</small></span>${del("courses",c.id)}</div>`).join(""));
async function addCourse(){if(!v("c1"))return alert("Enter a course name");await db.collection("courses").add({name:v("c1"),desc:v("c2"),hidden:false});await loadAll()}
PANEL.lessons=()=>panel("Lessons",`<div class="list"><select id="l1">${COURSES.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select><input id="l2" placeholder="Lesson title"><input id="l3" placeholder="Video link (YouTube, optional)"><input id="l4" placeholder="PDF / Google Drive link (optional)"><button class="btn" onclick="addLesson()">Add lesson</button></div>`,
LESSONS.map(l=>`<div class="item"><span>${esc(l.title)} <small>${esc((COURSES.find(c=>c.id==l.courseId)||{}).name||"")}</small></span>${del("lessons",l.id)}</div>`).join(""));
async function addLesson(){if(!COURSES.length)return alert("Add a course first");if(!v("l2"))return alert("Enter a lesson title");await db.collection("lessons").add({courseId:v("l1"),title:v("l2"),videoUrl:v("l3"),pdfUrl:v("l4")});await loadAll()}
PANEL.questions=()=>panel("Questions",`<div class="list"><select id="q1"><option>MCQ</option><option>Written</option><option>Matching</option></select><select id="q2">${COURSES.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select><input id="q3" placeholder="Question text"><textarea id="q4" rows="3" placeholder="MCQ: one option per line. Matching: Left|Right per line. Written: leave blank."></textarea><input id="q5" placeholder="Answer (MCQ: correct option text. Written: key words, comma separated)"><button class="btn" onclick="addQuestion()">Add question</button></div>`,
QUESTIONS.map(q=>`<div class="item"><span>${q.type}: ${esc(q.q)} <small>${esc((COURSES.find(c=>c.id==q.courseId)||{}).name||"")}</small></span>${del("questions",q.id)}</div>`).join(""));
async function addQuestion(){if(!COURSES.length)return alert("Add a course first");if(!v("q3"))return alert("Enter the question");await db.collection("questions").add({type:v("q1"),courseId:v("q2"),q:v("q3"),opts:v("q4").split("\n").map(x=>x.trim()).filter(Boolean),ans:v("q5")});await loadAll()}
PANEL.books=()=>panel("Books",`<div class="list"><input id="b1" placeholder="Category"><input id="b2" placeholder="Book title"><input id="b3" placeholder="Google Drive link"><button class="btn" onclick="addBook()">Add book</button></div>`,
BOOKS.map(b=>`<div class="item"><span>${esc(b.title)} <small>${esc(b.cat)}</small></span>${del("books",b.id)}</div>`).join(""));
async function addBook(){if(!v("b2"))return alert("Enter a title");await db.collection("books").add({cat:v("b1")||"General",title:v("b2"),link:v("b3")});await loadAll()}
PANEL.sites=()=>panel("Useful Websites",`<div class="list"><input id="w1" placeholder="Title"><input id="w2" placeholder="Short description"><input id="w3" placeholder="Link"><button class="btn" onclick="addSite()">Add link</button></div>`,
SITES.map(s=>`<div class="item"><span>${esc(s.title)}</span>${del("sites",s.id)}</div>`).join(""));
async function addSite(){if(!v("w1"))return alert("Enter a title");await db.collection("sites").add({title:v("w1"),desc:v("w2"),link:v("w3")});await loadAll()}
