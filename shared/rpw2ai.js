/* RPW2.AI v2 — multi-provider BYOK AI layer + offline smart generators */
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
.ai-badge.gemini,.ai-badge.live{color:#7ef9d2;border-color:rgba(126,249,210,.4);background:rgba(126,249,210,.08)}
.ai-badge.offline{color:#ffd166;border-color:rgba(255,209,102,.35);background:rgba(255,209,102,.07)}
.ai-out{max-height:46vh;overflow:auto;border:1px solid var(--glass-brd,rgba(255,255,255,.14));border-radius:12px;padding:10px;margin-top:6px;font-size:13px;line-height:1.5}
.ai-item{padding:9px 11px;border-radius:10px;background:rgba(255,255,255,.04);margin-bottom:7px;border-left:3px solid #00cec9}
.ai-spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.25);border-top-color:#fff;border-radius:50%;animation:aispin .7s linear infinite;vertical-align:-2px;margin-right:7px}
@keyframes aispin{to{transform:rotate(360deg)}}
.ai-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.ai-tab{padding:7px 13px;border-radius:99px;border:1px solid var(--glass-brd);background:transparent;color:var(--txt,#eaf0ff);cursor:pointer;font-size:12px;font-weight:700}
.ai-tab.on{background:linear-gradient(135deg,#7c3aed,#00cec9);border-color:transparent;color:#fff}
.ai-test-out{font-size:12px;padding:9px 11px;border-radius:10px;margin-top:8px;display:none}
`;
document.head.appendChild(css);

/* ---------- provider registry ---------- */
const PROVIDERS={
 google:{name:"Google Gemini",keyph:"AIza…",keyUrl:"https://aistudio.google.com/apikey",keyHint:"free tier",
  models:["gemini-3.6-flash","gemini-3.5-flash","gemini-3.5-flash-lite","gemini-3.1-flash-lite","gemini-3.1-pro-preview"]},
 openai:{name:"OpenAI",keyph:"sk-…",keyUrl:"https://platform.openai.com/api-keys",keyHint:"paid",
  models:["gpt-5.4-mini","gpt-5.6-luna","gpt-5.6-terra","gpt-5.6-sol","gpt-5.4-nano","gpt-5.2"]},
 groq:{name:"Groq",keyph:"gsk_…",keyUrl:"https://console.groq.com/keys",keyHint:"generous free tier",
  models:["openai/gpt-oss-120b","openai/gpt-oss-20b","qwen/qwen3.6-27b"]},
 openrouter:{name:"OpenRouter",keyph:"sk-or-…",keyUrl:"https://openrouter.ai/settings/keys",keyHint:"many :free models",
  models:["openrouter/auto","google/gemini-3-flash-preview","deepseek/deepseek-chat-v3.1:free","meta-llama/llama-4-maverick:free"]},
 custom:{name:"Custom (OpenAI-compatible)",keyph:"sk-… or token",models:[],link:"your endpoint /v1/chat/completions"}
};
const CFG={
 provider:store.get("ai.provider","google"),
 keys:store.get("ai.keys",{}),
 models:store.get("ai.models",{}),
 defaults:{google:"gemini-3.6-flash",openai:"gpt-5.4-mini",groq:"openai/gpt-oss-120b",openrouter:"openrouter/auto",custom:""},
 baseUrl:store.get("ai.baseUrl","")
};
function model(){return CFG.models[CFG.provider]||CFG.defaults[CFG.provider]||"";}
function hasKey(p){p=p||CFG.provider;return !!(CFG.keys[p]&&CFG.keys[p].trim());}

/* ---------- live model catalog ---------- */
const JUNK=/embed|whisper|tts|guard|moderation|dall-e|image|realtime|transcribe|distil|rerank/i;
function baseOf(p){
 if(p==="groq")return "https://api.groq.com/openai/v1";
 if(p==="openrouter")return "https://openrouter.ai/api/v1";
 if(p==="openai")return "https://api.openai.com/v1";
 return (CFG.baseUrl||"").replace(/\/+$/,"");
}
async function fetchCatalog(p){
 p=p||CFG.provider;
 let list=[];
 if(p==="google"){
  const res=await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key="+encodeURIComponent((CFG.keys.google||"").trim()));
  if(!res.ok)throw new Error("HTTP "+res.status);
  const j=await res.json();
  list=(j.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes("generateContent")&&!JUNK.test(m.name))
   .map(m=>m.name.replace(/^models\//,""));
 }else{
  const b=baseOf(p);
  if(!b)throw new Error("Set a base URL first");
  const h={};
  if(hasKey(p))h.Authorization="Bearer "+(CFG.keys[p]||"").trim();
  const res=await fetch(b+"/models",{headers:h});
  if(!res.ok)throw new Error("HTTP "+res.status+(res.status===404?" — endpoint does not expose /models":""));
  const j=await res.json();
  list=((j.data||j.models||[]).map(m=>m.id||m.name)||[]).filter(id=>id&&!JUNK.test(id));
 }
 list=[...new Set(list)];
 if(list.length)store.set("ai.catalog."+p,{t:Date.now(),list:list.slice(0,300)});
 return list;
}
function catalogOf(p){p=p||CFG.provider;const c=store.get("ai.catalog."+p,null);return c?c.list:[];}
function modelOptionsFor(p){return [...new Set([...((PROVIDERS[p]&&PROVIDERS[p].models)||[]),...catalogOf(p)])];}

/* ---------- unified LLM call ---------- */
async function callLLM(prompt,o){
 o=o||{};
 const p=o.provider||CFG.provider,key=(CFG.keys[p]||"").trim();
 if(!key)throw new Error("No API key set for "+PROVIDERS[p].name+" — add one in AI Settings");
 const mdl=o.model||model(),temp=o.temperature!=null?o.temperature:.9;
 let txt="";
 if(p==="google"){
  const url="https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(mdl)+":generateContent?key="+encodeURIComponent(key);
  const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({contents:o.system?[{role:"user",parts:[{text:o.system+"\n\n"+prompt}]}]:[{parts:[{text:prompt}]}],
    generationConfig:{temperature:temp,maxOutputTokens:o.maxTokens||2048}})});
  if(!res.ok)throw await httpErr(res);
  const j=await res.json();
  txt=(j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts||[]).map(x=>x.text||"").join("");
 }else{
  let url,body,headers={"Content-Type":"application/json"};
  if(p==="custom"){if(!CFG.baseUrl)throw new Error("Set a base URL for the custom provider in AI Settings");
   url=CFG.baseUrl.replace(/\/+$/,"")+"/chat/completions";}
  else if(p==="openai")url="https://api.openai.com/v1/chat/completions";
  else if(p==="groq")url="https://api.groq.com/openai/v1/chat/completions";
  else if(p==="openrouter"){url="https://openrouter.ai/api/v1/chat/completions";headers["HTTP-Referer"]=location.origin;}
  headers.Authorization="Bearer "+key;
  body={model:mdl,temperature:temp,max_tokens:o.maxTokens||2048,
   messages:[...(o.system?[{role:"system",content:o.system}]:[]),{role:"user",content:prompt}]};
  const res=await fetch(url,{method:"POST",headers,body:JSON.stringify(body)});
  if(!res.ok)throw await httpErr(res);
  const j=await res.json();
  txt=((j.choices||[])[0]||{}).message?((j.choices[0].message.content||"")):"";
 }
 if(!txt)throw new Error("Empty response from "+PROVIDERS[p].name);
 return txt;
}
async function httpErr(res){let m="HTTP "+res.status;try{const e=await res.json();m=e.error&&(e.error.message||e.error.type)||m;}catch(e){}const err=new Error(m);err.status=res.status;return err;}

function extractJSON(text){
 let t=String(text).trim().replace(/^```(?:json)?/i,"").replace(/```\s*$/,"").trim();
 const s=t.search(/[[{]/);if(s<0)throw new Error("no JSON found in response");
 const open=t[s],close=open==="["?"]":"}";
 const e=t.lastIndexOf(close);if(e<=s)throw new Error("unterminated JSON in response");
 return JSON.parse(t.slice(s,e+1));
}

/* ---------- orchestrator ---------- */
async function generate(opts){
 const provider=opts.provider||"auto";
 if(provider!=="offline"&&hasKey()){
  try{
   let data=extractJSON(await callLLM(opts.prompt));
   if(opts.validate)data=opts.validate(data);
   return {source:provider==="auto"?CFG.provider:provider,data};
  }catch(err){
   toast(PROVIDERS[CFG.provider].name+" failed ("+err.message+") — using smart generator","err");
  }
 }
 if(!opts.offline)throw new Error("No offline generator available and no working API key.");
 let data=await opts.offline();
 if(opts.validate){try{data=opts.validate(data);}catch(e){}}
 return {source:"offline",data};
}

/* ---------- offline smart-generation engine ---------- */
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seedStr){let a=hashStr(String(seedStr));return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const pick=(arr,r)=>arr[Math.floor(r()*arr.length)];
function shuf(a,r){const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}
const STOP=new Set("the a an of for and or to in on with how what why when which that this is are was were be been being it its into from as at by about".split(" "));
function kw(topic){return String(topic||"study topic").toLowerCase().replace(/[^a-z0-9\s-]/g," ").split(/\s+/).filter(w=>w.length>3&&!STOP.has(w));}
function T(topic){topic=String(topic||"").trim()||"the topic";return topic.charAt(0).toUpperCase()+topic.slice(1);}
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
   `Only experts can ever reason about ${t.toLowerCase()} — basics are irrelevant.`],r).slice(0,3);
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
  return {q:`Fill in the blank: A key term associated with ${t.toLowerCase()} is “____”, which appears throughout this topic.`,answer:k};
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

/* ---------- AI Settings (multi-provider, with live test) ---------- */
function settingsModal(after){
 const m=modal("⚙️ AI Settings — Providers & Keys",
  `<div class="ai-tabs" id="aiProvTabs">${Object.entries(PROVIDERS).map(([id,p])=>
   `<button class="ai-tab ${id===CFG.provider?"on":""}" data-p="${id}">${p.name}${hasKey(id)?" ✓":""}</button>`).join("")}</div>
   <div id="aiProvBody"></div>
   <p class="tiny muted">Keys are stored only in this browser (localStorage) and sent directly to the provider you choose. Without a key, apps use the built-in offline smart generator.</p>`,
  bd=>{
   function paint(){
    const p=CFG.provider,P=PROVIDERS[p];
    bd.querySelector("#aiProvBody").innerHTML=
      `<div class="ai-row"><label>API key ${P.keyUrl?`<a href="${P.keyUrl}" target="_blank" rel="noopener" class="ai-keylink">Get a key (${P.keyHint}) ↗</a>`:""}</label>
        <div class="row" style="gap:8px"><input class="rpw-input grow" id="aiKeyInp" type="password" placeholder="${P.keyph}" value="${escapeHtml(CFG.keys[p]||"")}">
        <button class="rpw-btn sm" id="aiTest">Test</button></div>
        <div class="ai-test-out" id="aiTestOut"></div></div>
       ${p==="custom"?`<div class="ai-row"><label>Base URL (OpenAI-compatible, incl. /v1)</label>
        <input class="rpw-input" id="aiBase" placeholder="https://host.example/v1" value="${escapeHtml(CFG.baseUrl||"")}"></div>`:""}
       <div class="ai-row"><label>Model <button class="rpw-btn sm ghost" id="aiFetchMdl" style="margin-left:8px">↻ Fetch latest models</button></label>
        <input class="rpw-input" id="aiModelCustom" list="aiModelDL" placeholder="type or pick a model id" value="${escapeHtml(model())}">
        <datalist id="aiModelDL">${modelOptionsFor(p).map(x=>`<option value="${escapeHtml(x)}">`).join("")}</datalist>
        <div class="tiny muted" id="aiCatInfo"></div></div>
       <div class="row spread mt-2"><button class="rpw-btn ghost danger" id="aiClearKey">Remove key</button>
        <button class="rpw-btn primary" id="aiSaveCfg">Save & activate</button></div>`;
    bd.querySelectorAll("#aiProvTabs .ai-tab").forEach(b=>b.classList.toggle("on",b.dataset.p===p));
    bd.querySelectorAll("#aiProvTabs .ai-tab").forEach(b=>b.onclick=()=>{CFG.provider=b.dataset.p;store.set("ai.provider",CFG.provider);paint();});
    const tout=bd.querySelector("#aiTestOut");
    bd.querySelector("#aiTest").onclick=async()=>{
     saveFields();
     if(!hasKey()){tout.style.display="block";tout.style.color="#ff9bad";tout.textContent="Enter a key first.";return;}
     tout.style.display="block";tout.style.color="#9aa7c7";tout.innerHTML='<span class="ai-spin"></span>Pinging '+PROVIDERS[p].name+" · "+model()+" …";
     const t0=performance.now();
     try{
      const r=await callLLM("Reply with exactly: OK",{temperature:0,maxTokens:10});
      tout.style.color="#7ef9d2";tout.textContent="✔ "+PROVIDERS[p].name+" responded in "+Math.round(performance.now()-t0)+" ms → "+JSON.stringify(r.slice(0,40));
     }catch(e){tout.style.color="#ff9bad";tout.textContent="✖ "+e.message;}
    };
    const catInfo=bd.querySelector("#aiCatInfo");
     function showCat(n){if(catInfo)catInfo.textContent=n==null?"":n+" models available"+(catalogOf(p).length?" (cached)":"");}
     showCat(catalogOf(p).length||null);
     const fb=bd.querySelector("#aiFetchMdl");
     if(fb)fb.onclick=async()=>{
      saveFields();
      fb.disabled=true;fb.textContent="Fetching…";
      try{const l=await fetchCatalog(p);showCat(l.length);
       bd.querySelector("#aiModelDL").innerHTML=l.map(x=>`<option value="${escapeHtml(x)}">`).join("");
       toast(l.length?("Loaded "+l.length+" models from "+PROVIDERS[p].name):"No models returned","ok");
      }catch(e){toast("Could not load models: "+e.message,"err");showCat(null);}
      fb.disabled=false;fb.textContent="↻ Fetch latest models";
     };
     if(hasKey(p)&&!catalogOf(p).length&&fb)setTimeout(()=>fb.click(),50);
     function saveFields(){
     CFG.keys[p]=bd.querySelector("#aiKeyInp").value.trim();
     const sel=bd.querySelector("#aiModelSel"),cus=bd.querySelector("#aiModelCustom");
     CFG.models[p]=(cus&&cus.value.trim())||(sel?sel.value:"")||CFG.defaults[p]||"";
     const baseEl=bd.querySelector("#aiBase");if(baseEl)CFG.baseUrl=baseEl.value.trim();
    }
    bd.querySelector("#aiSaveCfg").onclick=()=>{
     saveFields();store.set("ai.keys",CFG.keys);store.set("ai.models",CFG.models);store.set("ai.baseUrl",CFG.baseUrl);
     toast(hasKey()?("Active engine: "+PROVIDERS[CFG.provider].name+" · "+model()):"Saved — no key set (offline mode)","ok");
     m.close();after&&after();
    };
    bd.querySelector("#aiClearKey").onclick=()=>{delete CFG.keys[p];store.set("ai.keys",CFG.keys);paint();toast("Key removed for "+PROVIDERS[p].name,"info");};
   }
   paint();
  });
 return m;
}
const keyModal=settingsModal;

/* ---------- engine status helpers ---------- */
function activeLabel(){return hasKey()?PROVIDERS[CFG.provider].name+" · "+model():"Offline smart generator";}
function refreshEngineLabels(root){
 document.querySelectorAll(".ai-status b").forEach(b=>{if(b.id==="aiEng")b.textContent=activeLabel();});
}

/* ---------- AI Studio modal ---------- */
function studio(opts){
 const fields=opts.fields||[];
 const m=modal(`${opts.title||"✨ AI Generator"}`,
  `<p class="muted small" style="margin-top:-4px">${opts.subtitle||"Generate material with your AI provider or the built-in smart generator."}</p>
   <div class="ai-status"><span>Engine: <b id="aiEng">${activeLabel()}</b></span>
    <span class="row" style="gap:6px"><button class="rpw-btn sm ghost" id="aiCfg">${hasKey()?"Switch / test":"Add API key"}</button></span></div>
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
   bd.querySelector("#aiCfg").onclick=()=>settingsModal(()=>refreshEngineLabels(bd));
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
     badge.className="ai-badge "+(r.source==="offline"?"offline":"live");
     badge.textContent=r.source==="offline"?"◈ Smart generator":"◆ "+(PROVIDERS[r.source]?PROVIDERS[r.source].name:r.source);
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

RPW2.AI={
 AI:{get key(){return CFG.keys[CFG.provider]||"";},cfg:CFG,providers:PROVIDERS},
 PROVIDERS,CFG,callLLM,extractJSON,generate,settingsModal,keyModal,studio,attachFab,
 hasKey,model,activeLabel,listModels:fetchCatalog,catalogOf,modelOptionsFor,
 gen:Object.assign({rng,pick,shuf,kw,T,gloss},gen)
};
})();
