/* Taffeta top bar for every app (Alexandra, Oct 15 2026): ‹ Back on the left returns to the page before,
   the disco ball in the middle goes Home. Each app calls TopNav.init({get,set,home}):
   get() names the page showing now (null hides the bar), set(name) shows that page, home() names Home.
   Every page change becomes a browser history step, so the phone's back swipe works too. */
(function(){
const DISCO="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='%23121212' stroke-width='1.1'%3E%3Cdefs%3E%3CclipPath id='c'%3E%3Ccircle cx='15' cy='19' r='10'/%3E%3C/clipPath%3E%3C/defs%3E%3Cpath d='M15 1v8'/%3E%3Cg clip-path='url%28%23c%29' stroke-width='.8'%3E%3Cpath d='M4 12.5h22M4 15.75h22M4 19h22M4 22.25h22M4 25.5h22'/%3E%3Cellipse cx='15' cy='19' rx='3.6' ry='10'/%3E%3Cellipse cx='15' cy='19' rx='7.4' ry='10'/%3E%3Cpath d='M15 9v20'/%3E%3Crect x='15.4' y='12.9' width='3' height='2.5' fill='%23121212' stroke='none'/%3E%3Crect x='18.8' y='16.1' width='3' height='2.5' fill='%23121212' stroke='none'/%3E%3Crect x='11.8' y='19.4' width='3' height='2.5' fill='%23121212' stroke='none'/%3E%3C/g%3E%3Ccircle cx='15' cy='19' r='10'/%3E%3Cpath d='M27 3.5l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7z' fill='%23121212' stroke='none'/%3E%3Cpath d='M5 4l.45 1.35 1.35.45-1.35.45L5 7.6l-.45-1.35L3.2 5.8l1.35-.45z' fill='%23121212' stroke='none'/%3E%3C/svg%3E";
let cfg=null,last=null,bar=null,back=null,ball=null,mbtn=null,sheet=null,mopen=false;
const st=()=>history.state&&history.state.tn!=null?history.state:null;
function draw(){
  if(!bar)return;
  const cur=cfg.get(); bar.hidden=cur==null; if(cur==null)return;
  const s=st(); back.style.visibility=(cur!==cfg.home()||(s&&s.d>0))?'visible':'hidden';
  if(cur===cfg.home())ball.setAttribute('aria-current','page');else ball.removeAttribute('aria-current');
  drawMenu();
}
/* optional Menu ▾ on the right, grouped like the Employee Experience App (Alexandra, Oct 17 2026): cfg.menu() gives [[group,[[page,label],…]],…] */
function drawMenu(){
  if(!mbtn)return;const groups=(cfg.menu&&cfg.menu())||[];
  mbtn.hidden=!groups.length;mbtn.textContent=mopen?'Close ✕':'Menu ▾';mbtn.setAttribute('aria-expanded',String(mopen));
  sheet.hidden=!mopen;if(!mopen)return;sheet.replaceChildren();const cur=cfg.get();
  groups.forEach(([g,items])=>{const box=document.createElement('div');box.className='tngrp';
    const l=document.createElement('span');l.textContent=g;box.append(l);
    items.forEach(([k,lab])=>{const b=document.createElement('button');b.type='button';b.textContent=lab;if(k===cur)b.setAttribute('aria-current','page');
      b.onclick=()=>{mopen=false;go(k)};box.append(b)});sheet.append(box)});
}
function check(){
  if(!cfg)return;
  const cur=cfg.get();
  if(cur!=null&&cur!==last){
    try{if(last==null&&!st())history.replaceState({tn:cur,d:0},'',location.href);
      else if(!st()||st().tn!==cur)history.pushState({tn:cur,d:((st()&&st().d)||0)+1},'',location.href)}catch(e){}
  }
  last=cur;draw();
}
function go(name){cfg.set(name);window.scrollTo(0,0);check()}
function build(){
  const css=document.createElement('style');
  css.textContent='.tnav{position:sticky;top:0;z-index:30;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;'+
    'background:#f8f6f0;border-bottom:1px solid #d9d5cc;padding:calc(8px + env(safe-area-inset-top)) 16px 8px;margin:0 0 12px}'+
    '.tnav[hidden]{display:none}'+
    '.tnav .tnback{justify-self:start;border:0;background:none;padding:6px 4px;margin:0;color:#121212;font:400 11px/1 "Libertinus Sans",system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}'+
    '.tnav .tnhome{border:0;background:none;padding:0 6px;margin:0;cursor:pointer;line-height:0}'+
    '.tnav .tnhome img{width:34px;height:34px;display:block}'+
    '.tnav .tnmenu{justify-self:end;border:0;background:none;padding:6px 4px;margin:0;color:#121212;font:400 11px/1 "Libertinus Sans",system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}'+
    '.tnav .tnmenu[hidden],.tnav .tnsheet[hidden]{display:none}'+
    '.tnav .tnsheet{position:absolute;top:calc(100% + 6px);left:50%;transform:translateX(-50%);width:calc(100% - 32px);max-width:560px;max-height:calc(100vh - 140px);overflow-y:auto;background:#f8f6f0;border:1px solid #d9d5cc;padding:14px 16px;box-sizing:border-box;display:flex;flex-direction:column;gap:14px;box-shadow:0 4px 20px rgba(18,18,18,.12)}'+
    '.tnav .tngrp{display:flex;flex-direction:column;gap:2px}'+
    '.tnav .tngrp>span{font-family:"TaffetaJ","Lora",Georgia,serif;font-size:19px;font-weight:500;color:#121212;padding:2px 4px 0}'+
    '.tnav .tngrp button{border:0;background:none;text-align:left;font:400 15px "Libertinus Sans",system-ui,sans-serif;color:#555250;padding:6px 4px 6px 14px;cursor:pointer}'+
    '.tnav .tngrp button[aria-current="page"]{color:#121212;text-decoration:underline;text-underline-offset:5px}';
  document.head.append(css);
  bar=document.createElement('nav');bar.className='tnav';bar.setAttribute('aria-label','Back and Home');
  back=document.createElement('button');back.type='button';back.className='tnback';back.textContent='‹ Back';
  back.onclick=()=>{const s=st();if(s&&s.d>0)history.back();else go(cfg.home())};
  ball=document.createElement('button');ball.type='button';ball.className='tnhome';ball.setAttribute('aria-label','Home');ball.title='Home';
  const im=document.createElement('img');im.src=DISCO;im.alt='';ball.append(im);
  ball.onclick=()=>go(cfg.home());
  mbtn=document.createElement('button');mbtn.type='button';mbtn.className='tnmenu';mbtn.hidden=true;
  mbtn.onclick=()=>{mopen=!mopen;drawMenu()};
  sheet=document.createElement('div');sheet.className='tnsheet';sheet.hidden=true;sheet.setAttribute('role','menu');
  bar.append(back,ball,mbtn,sheet);
  document.addEventListener('click',e=>{if(mopen&&!bar.contains(e.target)){mopen=false;drawMenu()}});
  document.body.prepend(bar);
  addEventListener('load',()=>document.body.prepend(bar));   // stay above the Refresh line
}
addEventListener('popstate',e=>{const s=e.state;if(cfg&&s&&s.tn!=null){cfg.set(s.tn);last=cfg.get();window.scrollTo(0,0);draw()}});
window.TopNav={init(c){cfg=c;build();check();document.addEventListener('click',()=>setTimeout(check,0),true)},check};
})();
