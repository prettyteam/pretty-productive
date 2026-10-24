/* Back to Pretty Life (Alexandra, Oct 24 2026): "a back button on every page and the icons clicked back to home".
   Pretty Life opens each app with ?from=life; this tab then remembers it, so Back on an app's Home goes to Pretty Life.
   The Taffeta logo at the top goes to the app's Home (from Home, to Pretty Life).
   Apps with their own top bar register PPLife.app={atHome(),home()}; pages without one get a small ‹ Back bar. */
(function(){
const K='pp-from-life', LIFE='https://prettyteam.taffetadesign.com/briefing/';
let from=false;
try{const u=new URL(location.href);
  if(u.searchParams.get('from')==='life'){sessionStorage.setItem(K,'1');u.searchParams.delete('from');history.replaceState(history.state,'',u.toString())}
  from=sessionStorage.getItem(K)==='1'}catch(e){}
/* came here by a link inside our own site (not a fresh open) */
const inside=(()=>{try{return !!document.referrer&&new URL(document.referrer).origin===location.origin&&history.length>1}catch(e){return false}})();
const appRoot=location.pathname.replace(/[^/]*$/,'');
const P=window.PPLife={app:null,from:()=>from,life(){location.href=LIFE},
  /* Back when the app has nowhere left to go inside itself */
  out(){if(inside)history.back();else if(from)P.life();else location.href=appRoot},
  canOut:()=>inside||from,
  home(){const a=P.app;if(a&&!a.atHome()){a.home();window.scrollTo(0,0)}else if(from)P.life();else if(!a)location.href=appRoot}};

const LOGOS='img.wreath,img[src*="logo.png"],img[src*="wreath-weddings"]';
function wire(){
  /* client pages (forms on the iPad) keep a still logo unless she came from Pretty Life */
  if(P.app||from)document.querySelectorAll(LOGOS).forEach(im=>{
    if(im.dataset.pphome||im.closest('button,a,.crest,.done,.tnav,.navrow'))return;
    im.dataset.pphome='1';im.style.cursor='pointer';im.setAttribute('role','link');im.tabIndex=0;
    im.title=from?'Home · Pretty Life':'Home';
    im.addEventListener('click',P.home);im.addEventListener('keydown',e=>{if(e.key==='Enter')P.home()});
  });
  /* a small Back bar only when the page shows no Back of its own */
  if(!bar)return;
  const own=document.querySelector('.tnav:not([hidden]) .tnback,.navrow button.navback,[data-ppback]');
  bar.hidden=!P.canOut()||!!own||P.app&&!P.app.atHome();
}
let bar=null;
function build(){
  const css=document.createElement('style');
  css.textContent='.ppback{position:sticky;top:0;z-index:30;display:flex;align-items:center;background:#f8f6f0;border-bottom:1px solid #d9d5cc;padding:calc(8px + env(safe-area-inset-top)) 16px 8px;margin:0 0 12px}'+
    '.ppback[hidden]{display:none}'+
    '.ppback button{border:0;background:none;padding:6px 4px;margin:0;color:#121212;font:400 11px/1 "Libertinus Sans",system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}'+
    '@media print{.ppback{display:none}}';
  document.head.append(css);
  bar=document.createElement('nav');bar.className='ppback';bar.hidden=true;bar.setAttribute('aria-label','Back');
  const b=document.createElement('button');b.type='button';b.textContent=from&&!inside?'‹ Back to Pretty Life':'‹ Back';b.onclick=P.out;
  bar.append(b);document.body.prepend(bar);
  addEventListener('load',()=>document.body.prepend(bar));   // stay above the Refresh line
  let q=0;new MutationObserver(()=>{if(!q){q=1;requestAnimationFrame(()=>{q=0;wire()})}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  wire();
}
try{if(window.self!==window.top)return}catch(e){return}   /* inside another page: that page has the Back */
if(document.body)build();else document.addEventListener('DOMContentLoaded',build);
})();
