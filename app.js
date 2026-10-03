/* Allies Learn Together by Fuad Hasan - public site (app.js) v7.4: image-link fixes + 5 items per category/subcategory with See more, smaller book/link cards, hidden site pages (#/page/slug), colored homepage tiles */
const app=document.getElementById("app"),esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let SET={heroTitle:"Allies Learn Together",heroText:"Courses, practice and resources for trainees.",showBooks:true,showSites:true};
let COURSES=[],LESSONS=[],QUESTIONS=[],BOOKS=[],SITES=[],TILES=[],FLINKS=[],CATS=[],LCATS=[],PAGES=[];
const FICON={Mobile:"📞",WhatsApp:"💬",Email:"✉️",LinkedIn:"💼",Facebook:"📘",Website:"🌐",Custom:"🔗"};
const FCOLOR={Mobile:"rgba(255,255,255,.16)",WhatsApp:"#145214",Email:"#7a1f1f",LinkedIn:"#0a3d62",Facebook:"#1456a3",Website:"#8a5a2b",Custom:"#3a3a3a"};
function flinkHref(it){const v=(it.link||"").trim();
 if(it.type=="Mobile")return v.startsWith("tel:")?v:"tel:"+v.replace(/[^\d+]/g,"");
 if(it.type=="WhatsApp"){if(/^https?:\/\//.test(v))return v;return "https://wa.me/"+v.replace(/[^\d]/g,"")}
 if(it.type=="Email")return v.startsWith("mailto:")?v:"mailto:"+v;
 return v}
function renderFooterLinks(){const el=document.getElementById("footerlinks");if(!el)return;
 el.innerHTML=FLINKS.length?`<div class="footerlinks">${FLINKS.map(it=>`<a class="flink" style="background:${esc(it.color||FCOLOR[it.type]||FCOLOR.Custom)}" href="${esc(flinkHref(it))}" target="_blank" rel="noopener"><span>${FICON[it.type]||FICON.Custom}</span> ${esc(it.label)}</a>`).join("")}</div>`:""}
/* v7.3: turns normal share links (Google Drive, Dropbox, GitHub, Imgur page) into direct image links */
function imgUrl(u){u=String(u||"").trim();if(!u)return"";let m;
 if(/^https?:\/\/(drive|docs)\.google\.com\//i.test(u)){m=u.match(/\/d\/([\w-]{10,})/)||u.match(/[?&]id=([\w-]{10,})/);if(m)return "https://drive.google.com/thumbnail?id="+m[1]+"&sz=w1600"}
 if(/^https?:\/\/(www\.)?dropbox\.com\//i.test(u))return u.replace(/^https?:\/\/(www\.)?dropbox\.com/i,"https://dl.dropboxusercontent.com").replace(/([?&])dl=\d/,"$1").replace(/[?&]+$/,"").replace(/\?&/,"?");
 m=u.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/(.+?)(\?.*)?$/i);if(m)return "https://raw.githubusercontent.com/"+m[1]+"/"+m[2]+"/"+m[3];
 m=u.match(/^https?:\/\/(?:www\.)?imgur\.com\/(?:gallery\/|a\/)?(\w{5,8})$/i);if(m)return "https://i.imgur.com/"+m[1]+".png";
 return u}
const shuffle=a=>a.map(x=>[Math.random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const orderKey=o=>(o&&String(o).trim())?String(o).trim():"\uFFFF";
const natSort=(a,b)=>orderKey(a).localeCompare(orderKey(b),undefined,{numeric:true,sensitivity:"base"});
async function loadAll(){
 try{const s=await db.collection("config").doc("main").get();if(s.exists)SET=Object.assign(SET,s.data())}catch(e){}
 const ord=a=>a.sort((x,y)=>natSort(x.order,y.order));
 const grab=async(name)=>{try{const q=await db.collection(name).get();return q.docs.map(d=>({id:d.id,...d.data()}))}catch(e){return[]}};
 COURSES=ord((await grab("courses")).filter(c=>!c.hidden));
 LESSONS=ord(await grab("lessons"));QUESTIONS=await grab("questions");BOOKS=await grab("books");SITES=await grab("sites");TILES=await grab("tiles");FLINKS=await grab("footerlinks");CATS=await grab("categories");LCATS=await grab("linkcats");PAGES=await grab("pages");
 document.getElementById("brandLink").innerHTML=(SET.logoUrl?`<img src="${esc(imgUrl(SET.logoUrl))}" alt="logo" referrerpolicy="no-referrer" onerror="this.style.display='none'" style="height:30px;width:auto;max-width:140px;object-fit:contain;vertical-align:middle;margin-right:8px;border-radius:6px">`:"")+esc(SET.heroTitle||"Development Allies BD");
 document.title=SET.heroTitle||"Development Allies BD";
 renderFooterLinks();
 route()}
function cname(id){const c=COURSES.find(x=>x.id==id);return c?c.name:id}
function lname(id){const l=LESSONS.find(x=>x.id==id);return l?l.title:id}
function embed(u){if(!u)return"";if(u.includes("youtu")){const id=(u.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/)||[])[1];if(id)return `<div style="aspect-ratio:16/9"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe></div>`}return `<a class="btn sm" href="${esc(u)}" target="_blank" rel="noopener">Watch video</a>`}
const H=(t,s)=>`<div><h2>${esc(t)}</h2><p class="muted">${esc(s)}</p></div>`;
function textColorFor(hex){const h=(hex||"").replace("#",""),r=parseInt(h.substr(0,2),16)||0,g=parseInt(h.substr(2,2),16)||0,b=parseInt(h.substr(4,2),16)||0;return((0.299*r+0.587*g+0.114*b)/255)>0.55?"#1a1a1a":"#ffffff"}
function cstyle(c){return c?` style="background:${esc(c)};color:${textColorFor(c)}"`:""}
function inline(s){let t=esc(s);
t=t.replace(/\|\|(.+?)\|\|/g,'<span class="spoiler" onclick="this.classList.toggle(\'rv\')" title="Click to reveal">$1</span>');
t=t.replace(/`([^`]+?)`/g,"<code>$1</code>");
t=t.replace(/==(.+?)==/g,"<mark>$1</mark>");
t=t.replace(/\[([^\]]+)\]\{(#?[A-Za-z0-9]+)\}/g,'<span style="color:$2">$1</span>');
t=t.replace(/\*\*\*(.+?)\*\*\*/g,"<b><i>$1</i></b>");
t=t.replace(/~~(.+?)~~/g,"<s>$1</s>");
t=t.replace(/__(.+?)__/g,"<u>$1</u>");
t=t.replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
t=t.replace(/\*(.+?)\*/g,"<i>$1</i>");
t=t.replace(/(^|[^\w])_(.+?)_(?=[^\w]|$)/g,"$1<i>$2</i>");
t=t.replace(/~(.+?)~/g,"<sub>$1</sub>");
t=t.replace(/\^(.+?)\^/g,"<sup>$1</sup>");
t=t.replace(/tel:(\+?[\d\-\s]{6,15})/gi,(m,num)=>`<a href="tel:${num.trim()}">${num.trim()}</a>`);
t=t.replace(/(?<!\]\()(https?:\/\/[^\s<)\]]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
t=t.replace(/\[([^\]]+)\]\((#\/[^\s)]+)\)/g,'<a href="$2">$1</a>');
t=t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
t=t.replace(/([\w.+-]+@[\w-]+\.[\w.-]+)(?![^<]*>)/g,'<a href="mailto:$1">$1</a>');
return t}
function md(raw){if(!raw)return"";return raw.split(/\n{2,}/).map(block=>{
 const lines=block.split("\n").filter(l=>l.trim()!=="");if(!lines.length)return"";
 if(lines.every(l=>/^-\s+/.test(l.trim())))return `<ul>${lines.map(l=>`<li>${inline(l.trim().replace(/^-\s+/,""))}</li>`).join("")}</ul>`;
 if(lines.every(l=>/^\d+\.\s+/.test(l.trim())))return `<ol>${lines.map(l=>`<li>${inline(l.trim().replace(/^\d+\.\s+/,""))}</li>`).join("")}</ol>`;
 if(lines.length==1&&/^##\s+/.test(lines[0].trim()))return `<h3 style="margin:16px 0 4px">${inline(lines[0].trim().replace(/^##\s+/,""))}</h3>`;
 return `<p>${lines.map(inline).join("<br>")}</p>`}).join("")}
const V={};
V.home=()=>`<section class="hero"><h1>${esc(SET.heroTitle)}</h1><p class="lead">${esc(SET.heroText)}</p><div style="display:flex;gap:10px;flex-wrap:wrap">${SET.heroImageUrl?`<div style="width:100%;margin:16px 0"><img src="${esc(imgUrl(SET.heroImageUrl))}" alt="" referrerpolicy="no-referrer" onerror="this.parentNode.style.display='none'" style="max-width:100%;border-radius:16px;display:block"></div>`:""}<a class="btn" href="#/courses">Explore courses</a><a class="btn ghost" href="#/practice">Start practice</a></div></section>
${SET.aboutText?`<div class="card rich" style="margin:20px 0"><h2>${esc(SET.aboutTitle||"About")}</h2><div style="color:var(--mut)">${md(SET.aboutText)}</div></div>`:""}
<div class="grid mini">${[["courses","Courses",COURSES.length+" courses"],["practice","Practice",QUESTIONS.length+" questions"]].concat(SET.showBooks?[["books","Books",BOOKS.length+" books"]]:[]).concat(SET.showSites?[["sites","Links",SITES.length+" links"]]:[]).map(x=>`<a class="card tile mini" href="#/${x[0]}"><h3>${x[1]}</h3><p>${x[2]}</p></a>`).join("")}${TILES.map(t=>`<a class="card tile mini"${cstyle(t.color)} href="${esc(t.link)}" ${esc(t.link).startsWith('#')?"":'target="_blank" rel="noopener"'}><h3>${esc(t.title)}</h3><p>${esc(t.desc||"")}</p></a>`).join("")}</div>`;
V.courses=()=>H("Courses","Pick a course to see lessons and resources.")+`<div class="grid">${COURSES.map(c=>`<a class="card tile"${cstyle(c.color)} href="#/course/${c.id}"><h3>${esc(c.name)}</h3><p>${esc(c.desc||"")}</p></a>`).join("")||"<p class=muted>No courses yet.</p>"}</div>`;
V.course=id=>{const c=COURSES.find(x=>x.id==id);if(!c)return V.courses();const ls=LESSONS.filter(l=>l.courseId==id);
return H(c.name,c.desc||"")+`<div class="list">${ls.map(l=>`<div class="card"><h3>${esc(l.title)}</h3>${embed(l.videoUrl)}${l.pdfUrl?`<p><a class="btn sm ghost" href="${esc(l.pdfUrl)}" target="_blank" rel="noopener">Open PDF / file</a></p>`:""}${(l.materials||[]).length?`<div class="list" style="margin-top:8px">${l.materials.map(m=>`<div class="item"><span>${esc(m.type)}: ${esc(m.title)}</span><a class="btn sm ghost" href="${esc(m.link)}" target="_blank" rel="noopener">Open</a></div>`).join("")}</div>`:""}<p><a class="btn sm" href="#/practice/lesson/${l.id}">Practise this lesson</a></p></div>`).join("")||"<p class=muted>No lessons yet.</p>"}</div>`};

/* ---------------- PRACTICE: course -> lesson -> type -> set -> quiz ---------------- */
const TY={MCQ:"Choose the correct answer.",Written:"Type a short answer.",Matching:"Match each item."};
V.practice=parts=>{parts=parts||[];
 if(!parts.length)return H("Practice","Pick a course to begin.")+`<div class="grid">${COURSES.map(c=>`<a class="card tile" href="#/practice/course/${c.id}"><h3>${esc(c.name)}</h3><p>${LESSONS.filter(l=>l.courseId==c.id).length} lessons</p></a>`).join("")||"<p class=muted>No courses yet.</p>"}</div>`;
 if(parts[0]=="course"){const cid=parts[1],ls=LESSONS.filter(l=>l.courseId==cid);
  return H(cname(cid),"Pick a lesson.")+`<div class="grid">${ls.map(l=>`<a class="card tile" href="#/practice/lesson/${l.id}"><h3>${esc(l.title)}</h3><p>${QUESTIONS.filter(q=>q.lessonId==l.id).length} questions</p></a>`).join("")||"<p class=muted>No lessons in this course yet.</p>"}</div>`}
 if(parts[0]=="lesson"&&!parts[2]){const lid=parts[1];
  return H(lname(lid),"Choose a question type.")+`<div class="grid">${Object.keys(TY).map(t=>{const n=QUESTIONS.filter(q=>q.lessonId==lid&&q.type==t).length;return `<a class="card tile" href="#/practice/lesson/${lid}/${t}"><h3>${t}</h3><p>${TY[t]}</p><small>${n} questions</small></a>`}).join("")}</div>`}
 if(parts[0]=="lesson"&&parts[2]){const lid=parts[1],t=parts[2],qs=QUESTIONS.filter(q=>q.lessonId==lid&&q.type==t);
  const sets=[...new Set(qs.map(q=>q.setNo||1))].sort((a,b)=>a-b);
  return H(t+" — "+lname(lid),"Choose a set to begin. Questions are shuffled each time.")+`<div class="grid">${sets.map(s=>`<a class="card tile" href="javascript:startSet('${lid}','${t}',${s})"><h3>Set ${s}</h3><p>${qs.filter(q=>(q.setNo||1)==s).length} questions</p></a>`).join("")||"<p class=muted>No questions in this lesson/type yet.</p>"}</div>`}
 return V.practice([])};

/* ------------- Quiz runner (own state, own render, not part of hash router) ------------- */
let QUIZ=null;
function startSet(lid,type,setNo){const qs=shuffle(QUESTIONS.filter(q=>q.lessonId==lid&&q.type==type&&(q.setNo||1)==setNo));
 QUIZ={lid,type,setNo,qs,idx:0,revealed:false,results:new Array(qs.length).fill(null)};renderQuiz()}
function qInput(q){if(q.type=="MCQ")return (q.opts||[]).map((o,j)=>`<label class="opt"><input type="radio" name="qa" value="${esc(o)}"> ${esc(o)}</label>`).join("");
 if(q.type=="Written")return `<textarea id="qaw" rows="3" placeholder="Type your answer"></textarea>`;
 const R=shuffle((q.opts||[]).map(p=>p.split("|")[1]));
 return (q.opts||[]).map((p,j)=>`<div style="display:flex;justify-content:space-between;gap:10px;margin:6px 0"><span>${esc(p.split("|")[0])}</span><select id="qam_${j}"><option value="">Choose</option>${R.map(r=>`<option>${esc(r)}</option>`).join("")}</select></div>`).join("")}
function gradeCurrent(q){if(q.type=="MCQ"){const c=document.querySelector('[name=qa]:checked');const ok=c&&c.value==q.ans?1:0;return{ok,n:1,your:c?c.value:"(no answer)",correct:q.ans}}
 if(q.type=="Written"){const a=(document.getElementById("qaw").value||"").toLowerCase(),k=(q.ans||"").toLowerCase().split(",").map(x=>x.trim()).filter(Boolean);const ok=k.length&&k.filter(x=>a.includes(x)).length>=Math.ceil(k.length/2)?1:0;return{ok,n:1,your:document.getElementById("qaw").value||"(no answer)",correct:q.ans}}
 let ok=0;const n=(q.opts||[]).length;const pairs=[];(q.opts||[]).forEach((p,j)=>{const[left,right]=p.split("|"),sel=(document.getElementById("qam_"+j)||{}).value||"";pairs.push({left,your:sel||"—",correct:right,ok:sel==right});if(sel==right)ok++});
 return{ok,n,pairs}}
function quizNext(){const q=QUIZ.qs[QUIZ.idx];QUIZ.results[QUIZ.idx]=gradeCurrent(q);QUIZ.idx++;QUIZ.revealed=false;renderQuiz()}
function checkWritten(){const q=QUIZ.qs[QUIZ.idx];QUIZ.results[QUIZ.idx]=gradeCurrent(q);QUIZ.revealed=true;renderQuiz()}
function reviewItem(q,r,i){
 if(q.type=="Matching")return `<div class="card"><b>Q${i+1}. ${esc(q.q)}</b> <small class="muted">${r.ok}/${r.n} correct</small><table class="review-table"><tr><th>Item</th><th>Your match</th><th>Correct match</th></tr>${r.pairs.map(p=>`<tr><td>${esc(p.left)}</td><td class="${p.ok?"ok":"bad"}">${esc(p.your)}</td><td>${p.ok?"✓":esc(p.correct)}</td></tr>`).join("")}</table></div>`;
 const label=q.type=="Written"?"Sample answer":"Correct answer";
 return `<div class="item ${r.ok==r.n?"good":"bad"}"><span><b>Q${i+1}.</b> ${esc(q.q)}<br><small>Your answer: ${esc(r.your)}</small></span>${r.ok<r.n?`<small>${label}: ${esc(r.correct)}</small>`:""}</div>`}
function renderQuiz(){if(!QUIZ)return;
 if(QUIZ.idx>=QUIZ.qs.length){let sc=0,tot=0,fb="";QUIZ.results.forEach((r,i)=>{sc+=r.ok;tot+=r.n;fb+=reviewItem(QUIZ.qs[i],r,i)});
  const p=Math.round(sc/tot*100),g=p>=70;
  app.innerHTML=H("Set complete","Here's how you did — right answers are shown below.")+`<div class="card" style="text-align:center"><h2>${sc}/${tot} (${p}%)</h2><span class="badge ${g?"good":"bad"}">${g?"Competent":"Not Yet Competent"}</span></div><div class="list">${fb}</div><p><a class="btn ghost" href="#/practice/lesson/${QUIZ.lid}/${QUIZ.type}">Back to sets</a> <a class="btn" href="javascript:startSet('${QUIZ.lid}','${QUIZ.type}',${QUIZ.setNo})">Try this set again</a></p>`;
  QUIZ=null;return}
 const q=QUIZ.qs[QUIZ.idx],isLast=QUIZ.idx+1==QUIZ.qs.length;
 if(q.type=="Written"&&QUIZ.revealed){const r=QUIZ.results[QUIZ.idx];
  app.innerHTML=`<p class="muted">Question ${QUIZ.idx+1} of ${QUIZ.qs.length}</p><div class="card"><h3>${esc(q.q)}</h3><p><small class="muted">Your answer:</small><br>${esc(r.your)}</p><div class="item ${r.ok?"good":"bad"}"><span>Sample answer: ${esc(r.correct)}</span></div></div><button class="btn" onclick="quizNext()">${isLast?"Finish set":"Next question"}</button>`;return}
 app.innerHTML=`<p class="muted">Question ${QUIZ.idx+1} of ${QUIZ.qs.length}</p><div class="card"><h3>${esc(q.q)}</h3>${qInput(q)}</div><button class="btn" onclick="${q.type=="Written"?"checkWritten()":"quizNext()"}">${q.type=="Written"?"Check answer":(isLast?"Finish set":"Next question")}</button>`}

/* ---------------- BOOKS + LINKS: categories (ordered), subcategories, #tags, search ---------------- */
const SQ={books:"",sites:""};
const tagsOf=x=>Array.isArray(x.tags)?x.tags:[];
const catName=x=>x.cat||"General";
const catOrd=x=>(x.order===undefined||x.order===null||x.order==="")?1e9:Number(x.order);
const tagLine=(kind,x)=>tagsOf(x).length?`<div class="tags">${tagsOf(x).map(t=>`<a class="tagchip" href="#/${kind}/tag/${encodeURIComponent(t)}">#${esc(t)}</a>`).join("")}</div>`:"";
const bookCard=b=>`<div class="card mini"${cstyle(b.color)}><h3 class="bk">${esc(b.title)}</h3>${tagLine("books",b)}<a class="btn sm" href="${esc(b.link)}" target="_blank" rel="noopener">Open</a></div>`;
const siteCard=s=>`<div class="card mini"${cstyle(s.color)}><h3 class="bk">${esc(s.title)}</h3>${s.desc?`<p>${esc(s.desc)}</p>`:""}${tagLine("sites",s)}<a class="btn sm" href="${esc(s.link)}" target="_blank" rel="noopener">Visit</a></div>`;
const BK={
 books:{label:"Books",noun:"book",desc:"Browse by category, search, or tap a #tag to find similar books.",items:()=>BOOKS,cats:()=>CATS,card:bookCard,preview:5},
 sites:{label:"Links",noun:"link",desc:"Helpful links, by category. Tap a #tag to find similar links.",items:()=>SITES,cats:()=>LCATS,card:siteCard,preview:5}};
function orderedCats(kind){const items=BK[kind].items(),used=[...new Set(items.map(catName))];
 const names=BK[kind].cats().slice().sort((a,b)=>catOrd(a)-catOrd(b)||String(a.name).localeCompare(String(b.name))).map(c=>c.name).filter(n=>used.includes(n));
 used.filter(n=>!names.includes(n)).forEach(n=>names.push(n));return names}
function subOrder(kind,cat,list){const doc=BK[kind].cats().find(c=>c.name==cat),defined=(doc&&doc.subs)||[],used=[...new Set(list.map(x=>x.sub).filter(Boolean))];
 const res=defined.filter(s=>used.includes(s));used.filter(s=>!res.includes(s)).forEach(s=>res.push(s));return res}
/* v7.4: "limit" applies to EACH block: the category's own books (no subcategory) and every subcategory, 5 at a time + See more */
function groupHtml(kind,cat,list,limit){const B=BK[kind];list=list.slice().sort((a,b)=>natSort(a.order,b.order));
 const blocks=[{sub:"",key:"_main",items:list.filter(x=>!x.sub)}].concat(subOrder(kind,cat,list).map(s=>({sub:s,key:s,items:list.filter(x=>x.sub==s)}))).filter(b=>b.items.length);
 let html="",shown=0;
 for(const b of blocks){const its=limit?b.items.slice(0,limit):b.items;shown+=its.length;
  html+=(b.sub?`<h4 class="subgrp">${esc(b.sub)}</h4>`:"")+`<div class="grid mini">${its.map(B.card).join("")}</div>`+
   (its.length<b.items.length?`<p class="more"><a class="btn sm ghost" href="#/${kind}/cat/${encodeURIComponent(cat)}/${encodeURIComponent(b.key)}">See more — ${b.items.length-its.length} more${b.sub?" in "+esc(b.sub):""} →</a></p>`:"")}
 return{html,total:list.length,shown}}
function groupsByCat(kind,list,limit){
 return orderedCats(kind).map(c=>{const l=list.filter(x=>catName(x)==c);if(!l.length)return"";const g=groupHtml(kind,c,l,limit);
  return `<h3 class="grp"><a href="#/${kind}/cat/${encodeURIComponent(c)}">${esc(c)}</a> <small class="muted">${l.length}</small></h3>${g.html}`}).join("")}
function browseResults(kind){const B=BK[kind],toks=(SQ[kind]||"").trim().toLowerCase().split(/\s+/).filter(Boolean);let items=B.items();
 if(toks.length){items=items.filter(x=>{const h=[x.title,x.desc,catName(x),x.sub,tagsOf(x).map(t=>"#"+t).join(" ")].join(" ").toLowerCase();return toks.every(t=>h.includes(t))});
  return `<p class="muted">${items.length} result${items.length==1?"":"s"}</p>`+(groupsByCat(kind,items,0)||"<p class=muted>Nothing matches your search.</p>")}
 return groupsByCat(kind,items,B.preview)||`<p class=muted>No ${B.label.toLowerCase()} yet.</p>`}
function bSearch(kind,val){SQ[kind]=val;const el=document.getElementById("bresults");if(el)el.innerHTML=browseResults(kind)}
function browse(kind,mode,a,b){const B=BK[kind],items=B.items(),back=`<p><a class="btn ghost" href="#/${kind}">← Back to ${B.label}</a></p>`;
 if(mode=="cat"&&a){const sub=b||"",inCat=items.filter(x=>catName(x)==a),list=inCat.filter(x=>!sub||(sub=="_main"?!x.sub:x.sub==sub)),subs=subOrder(kind,a,inCat),hasMain=inCat.some(x=>!x.sub);
  const chip=(label,key)=>`<a class="tagchip ${sub==key?"on":""}" href="#/${kind}/cat/${encodeURIComponent(a)}${key?"/"+encodeURIComponent(key):""}">${esc(label)}</a>`;
  const bar=subs.length?`<div class="subbar">${chip("All","")}${hasMain?chip("Main","_main"):""}${subs.map(s=>chip(s,s)).join("")}</div>`:"";
  const title=sub=="_main"?a+" (main)":sub?a+" › "+sub:a;
  return H(title,`${list.length} ${B.noun}${list.length==1?"":"s"}.`)+bar+(groupHtml(kind,a,list,0).html||`<p class=muted>Nothing here yet.</p>`)+back}
 if(mode=="tag"&&a){const list=items.filter(x=>tagsOf(x).includes(a));
  return H("#"+a,`${list.length} ${B.noun}${list.length==1?"":"s"} with this tag.`)+(groupsByCat(kind,list,0)||`<p class=muted>Nothing has this tag.</p>`)+back}
 const cnt={};items.forEach(x=>tagsOf(x).forEach(t=>cnt[t]=(cnt[t]||0)+1));
 const tags=Object.keys(cnt).sort((x,y)=>cnt[y]-cnt[x]||x.localeCompare(y));
 return H(B.label,B.desc)+`<input class="search" placeholder="Search all ${B.label.toLowerCase()} by title, category or #tag…" value="${esc(SQ[kind])}" oninput="bSearch('${kind}',this.value)">`+
  (tags.length?`<div class="tagcloud">${tags.map(t=>`<a class="tagchip" href="#/${kind}/tag/${encodeURIComponent(t)}">#${esc(t)}<small>${cnt[t]}</small></a>`).join("")}</div>`:"")+
  `<div id="bresults">${browseResults(kind)}</div>`}
V.books=(m,a,b)=>browse("books",m,a,b);
V.sites=(m,a,b)=>browse("sites",m,a,b);
/* v7.4: hidden site pages — not in the menu; reached only through a link (#/page/<slug>) such as a homepage tile */
V.page=slug=>{const p=PAGES.find(x=>x.slug==slug);
 if(!p)return H("Page not found","This page does not exist or has been removed.")+`<p><a class="btn ghost" href="#/home">← Back to Home</a></p>`;
 return `<h2>${esc(p.title)}</h2><div class="card rich pagebody">${md(p.body||"")||"<p class=muted>This page is empty.</p>"}</div><p><a class="btn ghost" href="#/home">← Back to Home</a></p>`};
function go(h){location.hash=h}
function route(){const parts=location.hash.slice(2).split("/").map(decodeURIComponent),p=parts[0]||"home";
 QUIZ=null;SQ.books=SQ.sites="";
 app.innerHTML=p=="practice"?V.practice(parts.slice(1)):(V[p]||V.home)(parts[1],parts[2],parts[3]);
 document.querySelectorAll("nav a").forEach(a=>a.classList.toggle("on",a.getAttribute("href")=="#/"+(p=="course"?"courses":p)))}
addEventListener("hashchange",()=>{route();scrollTo(0,0)});
loadAll();
