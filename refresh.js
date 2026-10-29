/* Refresh bar for the team apps (Alexandra, 2026-10-12; plain words, no bubble, 2026-10-15): one obvious Refresh button on every screen,
   the time this copy was loaded, and "Update ready" when a newer version of the page is on the site. */
(function(){
  if(window.__refreshBar) return; window.__refreshBar=1;
  try{if(window.self!==window.top) return}catch(e){return}   /* inside another page (her card in the app): that page has its own Refresh */
  const css=`.rbar{position:fixed;left:0;right:0;bottom:0;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:12px;box-sizing:border-box;margin:0;padding:10px 20px calc(10px + env(safe-area-inset-bottom));border:0;border-top:1px solid #dcd6cb;border-radius:0;background:#f8f6f0;color:#121212;font:14px/1.3 "Libertinus Sans",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
body{padding-bottom:calc(56px + env(safe-area-inset-bottom))}
.rbar small{font-size:13px;color:#121212}
.rbar button{appearance:none;border:0;background:none;color:#121212;border-radius:0;padding:4px 2px;font:400 11px/1 inherit;font-family:inherit;letter-spacing:.18em;text-transform:uppercase;cursor:pointer;min-height:0;white-space:nowrap}
.rbar.new small{font-weight:700}.rbar.new button{font-weight:700;text-decoration:underline;text-underline-offset:4px}
.rbar button:focus-visible{outline:2px solid #121212;outline-offset:3px}
@media print{.rbar{display:none}}`;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  const t=d=>d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}).toLowerCase().replace(' ',' ');
  const bar=document.createElement('div'); bar.className='rbar'; bar.setAttribute('role','status');
  const msg=document.createElement('small'); msg.textContent='Refreshed '+t(new Date());
  const btn=document.createElement('button'); btn.type='button'; btn.textContent='↻ Refresh';
  bar.append(msg,btn);
  const page=location.href.split('#')[0];
  btn.addEventListener('click',async()=>{
    btn.disabled=true; btn.textContent='Refreshing…'; keep(1);
    try{await fetch(page,{cache:'reload'});await fetch('/refresh.js',{cache:'reload'})}catch(e){}
    /* a plain reload can show the old copy in a Home Screen app, so open the page at a fresh address (keeps the link after #) */
    const u=new URL(page); u.searchParams.set('_r',Date.now().toString(36));
    location.replace(u.toString()+location.hash);
  });
  /* Refresh stays on the page you were on (Alexandra, Oct 23 2026). Each app names its page with window.__ppView={get,set}
     (TopNav does it for the desk, weddings and cards apps). Refresh notes the page and scroll spot for this tab, and once the
     app is back and signed in, it opens that page again. A fresh open of the app still starts on Home. */
  const VK='pp-view:'+location.pathname;
  function keep(r){try{const v=window.__ppView&&window.__ppView.get();if(v!=null)sessionStorage.setItem(VK,JSON.stringify({v,y:Math.round(scrollY),r,t:Date.now()}))}catch(e){}}
  addEventListener('pagehide',()=>{try{const o=JSON.parse(sessionStorage.getItem(VK)||'null');if(!(o&&o.r&&Date.now()-o.t<5000))keep(0)}catch(e){}});
  (function back(){
    let o=null;try{o=JSON.parse(sessionStorage.getItem(VK)||'null');sessionStorage.removeItem(VK)}catch(e){}
    let nav='';try{nav=(performance.getEntriesByType('navigation')[0]||{}).type||''}catch(e){}
    if(!o||Date.now()-o.t>10*60*1000||!(o.r||nav==='reload'))return;
    let tries=0,moved=false;['touchstart','wheel','keydown'].forEach(e=>addEventListener(e,()=>{moved=true},{once:true,passive:true}));
    (function wait(){
      const p=window.__ppView;let cur=null;try{cur=p&&p.get()}catch(e){}
      if(cur==null){if(++tries<150)setTimeout(wait,200);return}   /* still signing in or loading: try for about 30 seconds */
      if(cur!==o.v){try{p.set(o.v)}catch(e){return}}
      const y=o.y||0;if(!y)return;
      [50,600,1500].forEach(ms=>setTimeout(()=>{if(!moved&&scrollY<y-40)scrollTo(0,y)},ms));
    })();
  })();
  /* the copy on this phone vs. the copy on the site, by Last-Modified */
  const mine=Date.parse(document.lastModified)||0;
  async function check(){
    try{const r=await fetch(page,{method:'HEAD',cache:'no-store'}); const lm=Date.parse(r.headers.get('last-modified')||'');
      if(lm&&mine&&lm>mine+1000){bar.classList.add('new'); msg.textContent='Update ready · tap Refresh'}}catch(e){}
  }
  function mount(){document.body.insertBefore(bar,document.body.firstChild); check()}
  if(document.body) mount(); else document.addEventListener('DOMContentLoaded',mount);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) check()});
  setInterval(check,5*60*1000);
})();
