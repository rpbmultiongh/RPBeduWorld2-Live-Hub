/* RPW2.AI — shared AI layer: Gemini BYOK + offline smart generators */
(function(){
"use strict";
if(!window.RPW2){console.error("rpw2ai.js requires rpw2.js");return;}
const {store,toast,modal,escapeHtml}=RPW2;

/* ---------- injected styles ---------- */
const css=document.createElement("style");css.textContent=`
.rpw-fab{position:fixed;right:18px;bottom:18px;z-index:900;display:flex;align-items:center;gap:8px;padding:12px 18px;border-radius:99px;border:1px solid rgba(255,255,255,.18);cursor:pointer;font-weight:700;font-size:13.5px;color:#fff;background:linear-gradient(135deg,#7c3aed,#00cec9);box-shadow:0 10px 28px rgba(124,58,237,.45);transition:transform .15s ease,box-shadow .15s ease}
.rpw-fab:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(0,206,201,.5)}
.ai-row{display:flex;flex-direction:column;gap:5px;margin-bottom:12px}
.ai-row label{font-size:12px;font-weight:700;color:var(--muted,#9aa7c7)}
.ai-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:480px){.ai-grid2{grid-template-columns:1fr}}
.ai-status{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 11px;border-radius:10px;border:1px dashed var(--glass-brd,rgba(255,255,255,.15));font-size:12px;margin-bottom:12px}
.ai-badge{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:99px;font-size:10.5px;font-weight:700;border:1px solid var(--glass-brd,rgba(255,255,255,.15))}
.ai-badge.gemini{color:#7ef9d2;border-color:rgba(126,249,210,.4);background:rgba(126,249,210,.08)}
.ai-badge.offline{color:#ffd166;border-color:rgba(255,209,102,.35);background:rgba(255,209,102,.07)}
.ai-out{max-height:46vh;overflow:auto;border:1px solid var(--glass-brd,rgba(255,255,255,.14));border-radius:12px;padding:10px;margin-top:6px;font-size:13px;line-height:1.5}
.ai-item{padding:9px 11px;border-radius:10px;background:rgba(255,255,255,.04);margin-bottom:7px;border-left:3px solid #00cec9}
.ai-spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.25);border-top-color:#fff;border-radius:50%;animation:aispin .7s linear infinite;vertical-align:-2px;margin-right:7px}
@keyframes aispin{to{transform:rotate(360deg)}}
`;
document.head.appendChild(css);

/* ---------- key & prefs ---------- */
const AI={
 key:store.get("ai.key","")||"",
 model:store.get("ai.model","gemini-2.0-flash"),
 setKey(k){this.key=(k||"").trim();store.set("ai.key",this.key);},
 setModel(m){this.model=m;store.set("ai.model",m);}
};

/* ---------- offline smart-generation engine ---------- */
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seedStr){let a=hashStr(String(seedStr));return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const pick=(arr,r)=>arr[Math.floor(r()*arr.length)];
function shuf(a,r){const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}
const STOP=new Set("the a an of for and or to in on with how what why when which that this is are was were be been being it its into from as at by about".split(" "));
function kw(topic){return String(topic||"study topic").toLowerCase().replace(/[^a-z0-9\s-]/g," ").split(/\s+/).filter(w=>w.length>3&&!STOP.has(w));}
function T(topic){topic=String(topic||"").trim()||"the topic";return topic.charAt(0).toUpperCase()+topic.slice(1);}

/* micro-glossary: detected concepts get richer generated content */
const GLOSSARY=[
 [/\bphotosynth/i,"Photosynthesis converts light energy into chemical energy (glucose) using chlorophyll, water and CO₂, releasing oxygen."],
 [/\bcell(ular)?\b/i,"Cells are the basic structural and functional units of life, enclosed by a membrane and carrying genetic material."],
 [/\bgravity|gravit/i,"Gravity is the mutual attraction between masses; near Earth's surface it accelerates objects at ≈9.8 m/s²."],
 [/\bquadratic|equation|algebra/i,"A quadratic equation ax²+bx+c=0 has solutions x=(−b±√(b²−4ac))/2a; the discriminant determines root types."],
 [/\bfraction|decimal|percent/i,"Fractions express parts of a whole; converting between fractions, decimals and percentages uses equivalent representations."],
 [/\bww2|world war|history|revolution|empire/i,"Historical events are analyzed through causes, key figures, turning points and long-term consequences."],
 [/\bgrammar|verb|noun|sentence|writing/i,"Effective writing organizes ideas into clear sentences and paragraphs with correct grammar and purposeful vocabulary."],
 [/\balgorithm|program|code|comput|network|data\b/i,"Computing systems process data through defined algorithms; networks exchange packets under agreed protocols."],
 [/\beconom|supply|demand|market|money/i,"Markets balance supply and demand; prices act as signals that coordinate decisions of buyers and sellers."],
 [/\bchemi|molecule|reaction|atom|bond/i,"Chemical reactions rearrange atoms by breaking and forming bonds, conserving mass and energy throughout."],
 [/\bplanet|space|star|solar|astronom/i,"Celestial bodies follow predictable orbital dynamics governed by gravitation and conservation of angular momentum."],
 [/\bmusic|art|paint|design|drama/i,"Creative works communicate meaning through elements such as form, contrast, rhythm and audience interpretation."],
 [/\bhealth|nutrition|muscle|fitness|sport|body/i,"Human health depends on nutrition, movement, sleep and homeostatic regulation of body systems."],
 [/\bclimate|ecosystem|environment|energy|pollut/i,"Environmental systems cycle matter and flow energy; human activity alters these balances measurably."]
];
function gloss(topic){for(const [re,def] of GLOSSARY)if(re.test(topic))return def;return null;}

/* generic item factories — all deterministic given seed */
const gen={
 mcq(topic,r){
  const t=T(topic),g=gloss(topic);
  const right=g||pick([
   `${t} is best understood through its core principles, key terminology and practical applications.`,
   `A central idea of ${t.toLowerCase()} is that its parts interact systematically to produce observable outcomes.`,
   `Mastery of ${t.toLowerCase()} requires connecting core concepts to concrete examples and practice.`],r);
  const wrongs=shuf([
   `${t} is purely memorized trivia with no underlying structure or principles.`,
   `${t} applies identically in every context, requiring no adjustment for conditions.`,
   `Nothing measurable can be concluded about ${t.toLowerCase()} in practice.`,
   `${t} was fully solved long ago and no active research continues.`,
   `Only experts can ever reason about ${t.toLowerCase()} — basics are irrelevant.`].map(s=>s.replace(/\s+/g," ")),r).slice(0,3);
  const stem=pick([
   `Which statement best describes ${t.toLowerCase()}?`,
   `Regarding ${t.toLowerCase()}, which claim is accurate?`,
   `Select the most defensible statement about ${t.toLowerCase()}.`,
   `Which option reflects sound understanding of ${t.toLowerCase()}?`],r);
  const opts=shuf([right,...wrongs],r);
  return {q:stem,options:opts,answer:opts.indexOf(right)};
 },
 cloze(topic,r){
  const kws=kw(topic),t=T(topic),k=kws.length?pick(kws,r):t;
  return {q:`Fill in the blank: A key term associated with ${t.toLowerCase()} is “____”, which appears throughout this topic.`,
   answer:k};
 },
 shortQA(topic,r){
  const t=T(topic),g=gloss(topic);
  const qs=shuf([
   [`Define ${t.toLowerCase()} in one or two sentences.`,g||`${t} is defined by its core principles, key terms and the relationships among its parts.`],
   [`Why does ${t.toLowerCase()} matter? Give a real-world connection.`,`It explains observable patterns and supports better decisions — from classroom problems to everyday situations involving ${kw(topic)[0]||"the subject"}.`],
   [`Describe one common misconception about ${t.toLowerCase()}.`,`That it is pure memorization — in reality it relies on transferable reasoning and structured practice.`],
   [`Outline the steps you would take to study ${t.toLowerCase()} effectively.`,`Preview key terms, work through worked examples, self-test with questions, then review errors on a spaced schedule.`]
  ],r);
  return {pairs:qs};
 },
 objectives(topic,n,r){
  const t=T(topic),verbs=["Define","Explain","Compare","Apply","Analyze","Evaluate","Create","Summarize","Classify","Demonstrate"];
  return shuf(verbs,r).slice(0,n||4).map(v=>`${v} ${t.toLowerCase()} using appropriate terminology and at least one example.`);
 },
 outline(topic,n,r){
  const t=T(topic);
  return ["Introduction & motivation","Key terms and definitions",`Core principles of ${t.toLowerCase()}`,"Worked examples","Common misconceptions","Practice questions","Summary & further reading"].slice(0,Math.max(3,Math.min(n||6,7)));
 }
};

/* ---------- Gemini (BYOK) ---------- */
async function gemini(prompt){
 if(!AI.key)throw new Error("no-key");
 const url=`https://generativelanguage.googleapis.com/v1beta/models/${AI.model}:generateContent?key=${encodeURIComponent(AI.key)}`;
 const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.9,maxOutputTokens:2048}})});
 if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.error?.message||("HTTP "+res.status));}
 const j=await res.json();
 const txt=j.candidates?.[0]?.content?.parts?.map(p=>p.text).join("")||"";
 if(!txt)throw new Error("empty response");
 return txt;
}
function extractJSON(text){
 let t=String(text).trim().replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
 const s=t.search(/[[{]/);if(s<0)throw new Error("no JSON found");
 const open=t[s],close=open==="["?"]":"}";
 const e=t.lastIndexOf(close);if(e<=s)throw new Error("unterminated JSON");
 return JSON.parse(t.slice(s,e+1));
}

/* ---------- orchestrator ---------- */
async function generate(opts){
 // opts: {prompt, offline, validate, provider} -> {source:"gemini"|"offline", data, raw?}
 const provider=opts.provider||"auto";
 if(provider!=="offline"&&AI.key){
  try{
   let data=extractJSON(await gemini(opts.prompt));
   if(opts.validate)data=opts.validate(data);
   return {source:"gemini",data};
  }catch(err){
   toast("Gemini failed ("+err.message+") — using smart generator","err");
  }
 }
 if(!opts.offline)throw new Error("No offline generator provided and no API key set.");
 let data=await opts.offline();
 if(opts.validate){try{data=opts.validate(data);}catch(e){}}
 return {source:"offline",data};
}

/* ---------- key manager ---------- */
function keyModal(after){
 const m=modal("🔑 AI Settings",
  `<div class="ai-row"><label>Google Gemini API key <span class="muted">(free tier · stored only in your browser)</span></label>
    <input class="rpw-input" id="aiKeyInp" type="password" placeholder="AIza…  (leave empty to use offline smart generator)" value="${escapeHtml(AI.key)}"></div>
   <div class="ai-row"><label>Model</label>
    <select class="rpw-input" id="aiModelSel">
     ${["gemini-2.0-flash","gemini-2.5-flash","gemini-2.0-flash-lite"].map(x=>`<option ${x===AI.model?"selected":""}>${x}</option>`).join("")}
    </select></div>
   <p class="tiny muted">Get a free key at aistudio.google.com/apikey. Apps stay fully usable offline without a key.</p>
   <div class="row spread mt-2"><button class="rpw-btn ghost" id="aiClear">Clear key</button><button class="rpw-btn primary" id="aiSave">Save</button></div>`,
  bd=>{
   bd.querySelector("#aiSave").onclick=()=>{AI.setKey(bd.querySelector("#aiKeyInp").value);AI.setModel(bd.querySelector("#aiModelSel").value);toast(AI.key?"API key saved ✨":"Key cleared — offline mode","ok");m.close();after&&after();};
   bd.querySelector("#aiClear").onclick=()=>{AI.setKey("");bd.querySelector("#aiKeyInp").value="";toast("Key cleared","info");};
  });
}

/* ---------- AI Studio modal ---------- */
function studio(opts){
 // opts: {title,subtitle,fields,hint,buildPrompt(v),offline(v),validate(d),onData(data,source,close),preview(d)->html}
 const fields=opts.fields||[];
 const m=modal(`${opts.title||"✨ AI Generator"}`,
  `<p class="muted small" style="margin-top:-4px">${opts.subtitle||"Generate material with Gemini (your key) or the built-in smart generator."}</p>
   <div class="ai-status"><span>Engine: <b id="aiEng">${AI.key?("Gemini · "+AI.model):"Offline smart generator"}</b></span>
    <button class="rpw-btn sm ghost" id="aiCfg">${AI.key?"Change":"Add key"}</button></div>
   ${fields.map(f=>{
     const ctl=f.type==="select"
      ?`<select class="rpw-input" data-f="${f.id}">${(f.options||[]).map(o=>`<option value="${escapeHtml(o.v??o)}" ${String(o.v??o)===String(f.value)?"selected":""}>${escapeHtml(o.t??o)}</option>`).join("")}</select>`
      :f.type==="textarea"
      ?`<textarea class="rpw-input" rows="3" data-f="${f.id}" placeholder="${escapeHtml(f.placeholder||"")}">${escapeHtml(f.value||"")}</textarea>`
      :`<input class="rpw-input" type="${f.type||"text"}" data-f="${f.id}" value="${escapeHtml(f.value??"")}" placeholder="${escapeHtml(f.placeholder||"")}" ${f.min!=null?`min="${f.min}"`:""} ${f.max!=null?`max="${f.max}"`:""}>`;
     return `<div class="ai-row"><label>${f.label}</label>${ctl}</div>`;
   }).join("")}
   <div class="row spread mt-1"><span class="ai-badge offline" id="aiSrcBadge" style="display:none"></span>
    <button class="rpw-btn primary" id="aiGo">✨ Generate</button></div>
   <div id="aiOutWrap" style="display:none"><div class="ai-out" id="aiOut"></div>
    <div class="row spread mt-2"><button class="rpw-btn ghost" id="aiAgain">↻ Regenerate</button>
     <button class="rpw-btn primary" id="aiUse">✔ Use this</button></div></div>`,
  bd=>{
   bd.querySelector("#aiCfg").onclick=()=>keyModal(()=>{bd.querySelector("#aiEng").textContent=AI.key?("Gemini · "+AI.model):"Offline smart generator";bd.querySelector("#aiCfg").textContent=AI.key?"Change":"Add key";});
   const vals=()=>{const v={};bd.querySelectorAll("[data-f]").forEach(el=>v[el.dataset.f]=el.value.trim());return v;};
   let last=null,lastSrc="";
   async function run(){
    const btn=bd.querySelector("#aiGo");btn.disabled=true;btn.innerHTML='<span class="ai-spin"></span>Generating…';
    try{
     const v=vals();
     if(!v.topic&&fields.some(f=>f.id==="topic"))throw new Error("Enter a topic first");
     const r=await generate({prompt:opts.buildPrompt?opts.buildPrompt(v):"",offline:()=>opts.offline(v),validate:opts.validate});
     last=r.data;lastSrc=r.source;
     bd.querySelector("#aiOut").innerHTML=opts.preview?opts.preview(r.data):'<pre style="white-space:pre-wrap;margin:0">'+escapeHtml(JSON.stringify(r.data,null,1))+'</pre>';
     const badge=bd.querySelector("#aiSrcBadge");badge.style.display="inline-flex";
     badge.className="ai-badge "+(r.source==="gemini"?"gemini":"offline");
     badge.textContent=r.source==="gemini"?"◆ Gemini live":"◈ Smart generator";
     bd.querySelector("#aiOutWrap").style.display="block";
    }catch(err){toast(err.message||"Generation failed","err");}
    btn.disabled=false;btn.textContent="✨ Generate";
   }
   bd.querySelector("#aiGo").onclick=run;
   bd.querySelector("#aiAgain").onclick=run;
   bd.querySelector("#aiUse").onclick=()=>{if(last)opts.onData(last,lastSrc,()=>m.close());};
  });
 return m;
}

/* ---------- floating action button ---------- */
function attachFab(onClick,label){
 const b=document.createElement("button");
 b.className="rpw-fab no-print";b.innerHTML=(label||"✨ AI Studio");
 b.addEventListener("click",onClick);
 document.body.appendChild(b);
 return b;
}

RPW2.AI={AI,gemini,generate,keyModal,studio,attachFab,
 gen:{rng,pick,shuf,kw,T,gloss,mcq,cloze,shortQA,objectives,outline}};
})();
