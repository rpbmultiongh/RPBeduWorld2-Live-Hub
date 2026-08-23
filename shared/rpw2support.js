/* RPW2.Support — injects a ♥ Support button into the app topbar */
(function(){
"use strict";
if(!window.RPW2)return;
const PATREON="https://www.patreon.com/LearnMasterPlatform";
function open(){
 RPW2.modal("♥ Support RPBedu",
  `<div style="text-align:center;padding:6px 4px">
    <div style="font-size:42px;line-height:1">☕️♥️</div>
    <p class="mt-2" style="font-size:14px;line-height:1.6">The <b>RPBedu</b> apps are free, ad-free and offline-first.<br>
    If they help you learn or teach, consider supporting development on Patreon —
    it funds new features, AI integrations and keeps everything free for everyone.</p>
    <a class="rpw-btn primary lg mt-3" href="${PATREON}" target="_blank" rel="noopener"
      style="display:inline-flex;align-items:center;gap:8px;text-decoration:none" data-support-link>♥ Become a patron</a>
    <p class="tiny muted mt-2">patreon.com/LearnMasterPlatform</p>
   </div>`,
  bd=>{const a=bd.querySelector("[data-support-link]");if(a)a.addEventListener("click",()=>setTimeout(()=>bd.remove(),150));});
}
function inject(){
 const bar=document.querySelector(".rpw-topbar-actions");
 if(!bar)return;
 const b=document.createElement("button");
 b.className="rpw-btn sm ghost rpw-support-btn no-print";
 b.setAttribute("aria-label","Support RPBedu on Patreon");
 b.innerHTML="♥<span style=\"margin-left:5px\">Support</span>";
 b.addEventListener("click",open);
 bar.insertBefore(b,bar.firstChild);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inject);else inject();
window.RPW2.openSupport=open;
})();
