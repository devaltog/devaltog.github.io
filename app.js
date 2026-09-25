const app=document.getElementById("app"),esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let SET={heroTitle:"Development Allies BD",heroText:"Courses, practice and resources for trainees.",showBooks:true,showSites:true};
let COURSES=[],LESSONS=[],QUESTIONS=[],BOOKS=[],SITES=[],TILES=[];
async function loadAll(){
 try{const s=await db.collection("config").doc("main").get();if(s.exists)SET=Object.assign(SET,s.data())}catch(e){}
 const ord=a=>a.sort((x,y)=>(x.order||0)-(y.order||0));
 const grab=async(name)=>{try{const q=await db.collection(name).get();return q.docs.map(d=>({id:d.id,...d.data()}))}catch(e){return[]}};
 COURSES=ord((await grab("courses")).filter(c=>!c.hidden));
 LESSONS=ord(await grab("lessons"));QUESTIONS=await grab("questions");BOOKS=await grab("books");SITES=await grab("sites");TILES=await grab("tiles");
 document.getElementById("brandLink").textContent=SET.heroTitle||"Development Allies BD";document.title=SET.heroTitle||"Development Allies BD";
 route()}
function cname(id){const c=COURSES.find(x=>x.id==id);return c?c.name:id}
function embed(u){if(!u)return"";if(u.includes("youtu")){const id=(u.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/)||[])[1];if(id)return `<div style="aspect-ratio:16/9"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe></div>`}return `<a class="btn sm" href="${esc(u)}" target="_blank" rel="noopener">Watch video</a>`}
const H=(t,s)=>`<div><h2>${esc(t)}</h2><p class="muted">${esc(s)}</p></div>`;
const V={};
V.home=()=>`<section class="hero"><h1>${esc(SET.heroTitle)}</h1><p class="lead">${esc(SET.heroText)}</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="#/courses">Explore courses</a><a class="btn ghost" href="#/practice">Start practice</a></div></section>
${SET.aboutText?`<div class="card" style="margin:20px 0"><h2>${esc(SET.aboutTitle||"About")}</h2><p style="white-space:pre-wrap;color:var(--mut)">${esc(SET.aboutText)}</p></div>`:""}
<div class="grid">${[["courses","Courses",COURSES.length+" courses"],["practice","Practice",QUESTIONS.length+" questions"]].concat(SET.showBooks?[["books","Books",BOOKS.length+" books"]]:[]).concat(SET.showSites?[["sites","Useful Websites",SITES.length+" links"]]:[]).map(x=>`<a class="card tile" href="#/${x[0]}"><h3>${x[1]}</h3><p>${x[2]}</p></a>`).join("")}${TILES.map(t=>`<a class="card tile" href="${esc(t.link).startsWith('#')?esc(t.link):esc(t.link)}" ${esc(t.link).startsWith('#')?"":'target="_blank" rel="noopener"'}><h3>${esc(t.title)}</h3><p>${esc(t.desc||"")}</p></a>`).join("")}</div>`;
V.courses=()=>H("Courses","Pick a course to see lessons and resources.")+`<div class="grid">${COURSES.map(c=>`<a class="card tile" href="#/course/${c.id}"><h3>${esc(c.name)}</h3><p>${esc(c.desc||"")}</p></a>`).join("")||"<p class=muted>No courses yet.</p>"}</div>`;
V.course=id=>{const c=COURSES.find(x=>x.id==id);if(!c)return V.courses();const ls=LESSONS.filter(l=>l.courseId==id);
return H(c.name,c.desc||"")+`<div class="list">${ls.map(l=>`<div class="card"><h3>${esc(l.title)}</h3>${embed(l.videoUrl)}${l.pdfUrl?`<p><a class="btn sm ghost" href="${esc(l.pdfUrl)}" target="_blank" rel="noopener">Open PDF / file</a></p>`:""}</div>`).join("")||"<p class=muted>No lessons yet.</p>"}</div><a class="btn ghost" href="#/practice">Practise this course</a>`};
const TY={MCQ:"Choose the correct answer.",Written:"Type a short answer.",Matching:"Match each item."};
V.practice=(t,cid)=>{if(!TY[t])return H("Practice","Choose a type and test yourself.")+`<div class="grid">${Object.keys(TY).map(k=>`<a class="card tile" href="#/practice/${k}"><h3>${k}</h3><p>${TY[k]}</p><small>${QUESTIONS.filter(q=>q.type==k).length} questions</small></a>`).join("")}</div>`;
cid=cid||"all";const L=QUESTIONS.filter(q=>q.type==t&&(cid=="all"||q.courseId==cid));window.QL=L;
return H(t+" practice",TY[t])+`<div class="card"><select onchange="go('#/practice/${t}/'+this.value)"><option value="all">All courses</option>${COURSES.map(c=>`<option value="${c.id}" ${c.id==cid?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div>${L.map((q,i)=>`<div class="card"><h3>${i+1}. ${esc(q.q)}</h3>${qbody(q,i)}</div>`).join("")||"<p class=muted>No questions yet.</p>"}${L.length?`<button class="btn" onclick="submitQ()">Submit answers</button>`:""}<div id="out"></div>`};
function qbody(q,i){if(q.type=="MCQ")return (q.opts||[]).map(o=>`<label class="opt"><input type="radio" name="q${i}" value="${esc(o)}"> ${esc(o)}</label>`).join("");
if(q.type=="Written")return `<textarea name="q${i}" rows="3" placeholder="Type your answer"></textarea>`;
const R=(q.opts||[]).map(p=>p.split("|")[1]).sort(()=>Math.random()-.5);
return (q.opts||[]).map((p,j)=>`<div style="display:flex;justify-content:space-between;gap:10px;margin:6px 0"><span>${esc(p.split("|")[0])}</span><select name="q${i}_${j}"><option value="">Choose</option>${R.map(r=>`<option>${esc(r)}</option>`).join("")}</select></div>`).join("")}
function submitQ(){let sc=0,tot=0,fb="";const q1=s=>document.querySelector(s);
window.QL.forEach((q,i)=>{let ok=0,n=1,line;
if(q.type=="MCQ"){const c=q1(`[name=q${i}]:checked`);ok=c&&c.value==q.ans?1:0;line="Answer: "+q.ans}
else if(q.type=="Written"){const a=(q1(`[name=q${i}]`).value||"").toLowerCase(),k=(q.ans||"").toLowerCase().split(",").map(x=>x.trim()).filter(Boolean);ok=k.length&&k.filter(x=>a.includes(x)).length>=Math.ceil(k.length/2)?1:0;line="Key points: "+q.ans}
else{n=(q.opts||[]).length;q.opts.forEach((p,j)=>{if(q1(`[name=q${i}_${j}]`).value==p.split("|")[1])ok++});line=q.opts.map(p=>p.replace("|"," = ")).join(", ")}
sc+=ok;tot+=n;fb+=`<div class="item"><span>Q${i+1}: ${ok}/${n}</span><small>${esc(line)}</small></div>`});
const p=Math.round(sc/tot*100),g=p>=70;
document.getElementById("out").innerHTML=`<div class="card" style="text-align:center"><h2>${sc}/${tot} (${p}%)</h2><span class="badge ${g?"good":"bad"}">${g?"Competent":"Not Yet Competent"}</span></div><div class="list">${fb}</div>`;document.getElementById("out").scrollIntoView()}
V.books=()=>{const cats=[...new Set(BOOKS.map(b=>b.cat))];return H("Books","Browse by category.")+cats.map(c=>`<h3 class="grp">${esc(c)}</h3><div class="grid">${BOOKS.filter(b=>b.cat==c).map(b=>`<div class="card"><h3>${esc(b.title)}</h3><a class="btn sm" href="${esc(b.link)}" target="_blank" rel="noopener">Open</a></div>`).join("")}</div>`).join("")||"<p class=muted>No books yet.</p>"};
V.sites=()=>H("Useful Websites","Helpful links.")+`<div class="grid">${SITES.map(s=>`<div class="card"><h3>${esc(s.title)}</h3><p>${esc(s.desc||"")}</p><a class="btn sm" href="${esc(s.link)}" target="_blank" rel="noopener">Visit</a></div>`).join("")||"<p class=muted>No links yet.</p>"}</div>`;
function go(h){location.hash=h}
function route(){const h=location.hash.slice(2).split("/"),p=h[0]||"home";app.innerHTML=(V[p]||V.home)(h[1]&&decodeURIComponent(h[1]),h[2]);
document.querySelectorAll("nav a").forEach(a=>a.classList.toggle("on",a.getAttribute("href")=="#/"+(p=="course"?"courses":p)))}
addEventListener("hashchange",()=>{route();scrollTo(0,0)});
loadAll();
