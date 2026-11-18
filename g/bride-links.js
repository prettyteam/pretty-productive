/* Bride links (Alexandra, Nov 18 2026): Copy and Share buttons for the two bride forms, for Alexandra and Dom only.
   Shown on Pretty Life, Dom's My Apps home and the Weddings app Texts tab. Bridal look: black and white, thin lines.
   Use: BrideLinks.mount(element) or BrideLinks.el() for a new element. */
(function(){
const BASE='https://prettyteam.taffetadesign.com/';
const LINKS=[
  ['Tell us about your day','Her inquiry form',BASE+'bride/'],
  ['Her photos','Hair, skin and looks she loves',BASE+'bride-photos/']];
const CSS=`
@font-face{font-family:BLDisplay;src:url(https://prettyteam.taffetadesign.com/g/fraunces-latin-300-normal.woff2) format("woff2");font-weight:300}
@font-face{font-family:BLBody;src:url(https://prettyteam.taffetadesign.com/g/libertinus-sans-latin-400-normal.woff2) format("woff2")}
.bl{box-sizing:border-box;max-width:380px;width:100%;margin:0 auto;background:#fff;color:#111;border:1px solid #111;outline:1px solid #111;outline-offset:-6px;
  padding:18px 18px 16px;display:flex;flex-direction:column;gap:12px;font-family:BLBody,"Libertinus Sans",system-ui,sans-serif;text-align:left}
.bl *{box-sizing:border-box}
.bl .bl-k{font-size:10.5px;letter-spacing:.28em;display:flex;align-items:center;justify-content:center;gap:12px;margin:0}
.bl .bl-k::before,.bl .bl-k::after{content:"";width:28px;height:1px;background:#111}
.bl .bl-r{display:flex;align-items:center;gap:8px;border-top:1px solid #d9d9d9;padding-top:12px}
.bl .bl-t{flex:1;min-width:0;font-family:BLDisplay,Fraunces,Georgia,serif;font-weight:300;font-size:17px;line-height:1.2}
.bl .bl-t small{display:block;font-family:BLBody,"Libertinus Sans",system-ui,sans-serif;font-size:11px;line-height:1.35;color:#6b6b6b;margin-top:2px}
.bl button{all:unset;cursor:pointer;flex:0 0 auto;font-family:BLBody,"Libertinus Sans",system-ui,sans-serif;font-size:10px;letter-spacing:.22em;padding:8px 11px;border:1px solid #111;line-height:1.2}
.bl .bl-c{background:#111;color:#fff}.bl .bl-s{background:#fff;color:#111}
.bl button:focus-visible{outline:2px solid #111;outline-offset:2px}
.bl .bl-n{font-size:12px;color:#6b6b6b;text-align:center;min-height:1.3em;margin:0}`;
function css(){if(document.getElementById('bl-css'))return;const s=document.createElement('style');s.id='bl-css';s.textContent=CSS;document.head.appendChild(s)}
async function copy(t){
  try{await navigator.clipboard.writeText(t);return true}catch(e){}
  try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();
    const ok=document.execCommand('copy');a.remove();return ok}catch(e){return false}}
function el(){
  css();
  const box=document.createElement('div');box.className='bl';
  const k=document.createElement('p');k.className='bl-k';k.textContent='BRIDE LINKS';box.appendChild(k);
  const note=document.createElement('p');note.className='bl-n';note.setAttribute('role','status');
  const say=t=>{note.textContent=t;clearTimeout(say.t);say.t=setTimeout(()=>note.textContent='',3000)};
  LINKS.forEach(([title,sub,url])=>{
    const r=document.createElement('div');r.className='bl-r';
    const t=document.createElement('div');t.className='bl-t';t.textContent=title;const s=document.createElement('small');s.textContent=sub;t.appendChild(s);
    const c=document.createElement('button');c.type='button';c.className='bl-c';c.textContent='COPY';
    c.onclick=async()=>say(await copy(url)?'Copied. Paste it in your text to her.':'Couldn’t copy. The link is '+url);
    const sh=document.createElement('button');sh.type='button';sh.className='bl-s';sh.textContent='SHARE';
    sh.onclick=async()=>{
      if(navigator.share){try{await navigator.share({url});return}catch(e){if(e&&e.name==='AbortError')return}}
      say(await copy(url)?'Share isn’t on this device, so it’s copied instead.':'The link is '+url)};
    r.append(t,c,sh);box.appendChild(r)});
  box.appendChild(note);
  return box}
function mount(target){if(!target)return null;target.innerHTML='';const b=el();target.appendChild(b);return b}
window.BrideLinks={el,mount,links:LINKS};
})();
