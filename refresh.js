/* Refresh bar for the team apps (Alexandra, 2026-10-12): one obvious Refresh button on every screen,
   the time this copy was loaded, and "Update ready" when a newer version of the page is on the site. */
(function(){
  if(window.__refreshBar) return; window.__refreshBar=1;
  const css=`.rbar{display:flex;align-items:center;justify-content:space-between;gap:12px;box-sizing:border-box;max-width:min(720px,calc(100% - 16px));margin:8px auto 18px;padding:8px 10px 8px 14px;border:1px solid #121212;border-radius:999px;background:#f8f6f0;color:#121212;font:14px/1.3 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
.rbar small{font-size:13px;color:#4a4a4a}
.rbar.new{background:#121212;color:#f8f6f0}.rbar.new small{color:#f8f6f0}
.rbar button{appearance:none;border:1px solid currentColor;background:#121212;color:#f8f6f0;border-radius:999px;padding:8px 16px;font:600 14px/1 inherit;font-family:inherit;cursor:pointer;min-height:36px;white-space:nowrap}
.rbar.new button{background:#f8f6f0;color:#121212}
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
    btn.disabled=true; btn.textContent='Refreshing…';
    try{await fetch(page,{cache:'reload'});await fetch('/refresh.js',{cache:'reload'})}catch(e){}
    location.reload();
  });
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
