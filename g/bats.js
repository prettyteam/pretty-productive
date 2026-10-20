/* Halloween bats for the team apps (Alexandra, Oct 20 2026): a few tiny black bats flap across the screen, behind taps
   (they never block a button). October only, so they leave on their own Nov 1. Off for anyone who has reduced motion set. */
(function(){
  if(window.__bats) return; window.__bats=1;
  const d=new Date(); if(d.getMonth()!==9) return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const BAT='<svg viewBox="110 300 140 48" aria-hidden="true"><path fill="#121212" d="M 180.0 314.8 Q 182.3 313.6 183.7 313.3 L 186.3 305.0 L 187.8 315.4 Q 190.3 317.7 193.8 318.2 Q 219.1 305.6 249.0 342.4 L 238.7 338.9 Q 237.5 330.9 228.3 334.4 Q 224.8 326.3 215.7 332.1 Q 211.1 325.1 203.0 332.1 Q 193.8 329.8 185.8 341.2 L 180.0 349.3 L 174.2 341.2 Q 166.2 329.8 157.0 332.1 Q 148.9 325.1 144.3 332.1 Q 135.2 326.3 131.7 334.4 Q 122.5 330.9 121.3 338.9 L 111.0 342.4 Q 140.9 305.6 166.2 318.2 Q 169.7 317.7 172.2 315.4 L 173.7 305.0 L 176.3 313.3 Q 177.7 313.6 180.0 314.8 Z"/></svg>';
  const css=`.bats{position:fixed;inset:0;z-index:3;pointer-events:none;overflow:hidden}
.bats i{position:absolute;left:0;display:block;animation:batfly linear infinite}
.bats i b{display:block;animation:batbob ease-in-out infinite alternate}
.bats svg{display:block;width:100%;height:auto;transform-origin:50% 30%;animation:batflap .22s ease-in-out infinite alternate}
@keyframes batfly{from{transform:translateX(-40px)}to{transform:translateX(calc(100vw + 40px))}}
@keyframes batbob{from{transform:translateY(-14px) rotate(-6deg)}to{transform:translateY(14px) rotate(6deg)}}
@keyframes batflap{from{transform:scaleY(1)}to{transform:scaleY(.35)}}
@media print{.bats{display:none}}`;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  const box=document.createElement('div'); box.className='bats';
  [[12,22,0,18,1.6],[30,17,-7,24,1.3],[52,24,-3,21,1.9],[70,16,-12,27,1.4],[86,20,-17,23,1.7]].forEach(([top,w,delay,dur,bob],n)=>{
    const i=document.createElement('i'); i.style.cssText='top:'+top+'%;width:'+w+'px;animation-duration:'+dur+'s;animation-delay:'+delay+'s'+(n%2?';animation-direction:reverse':'');
    i.innerHTML='<b style="animation-duration:'+bob+'s">'+BAT+'</b>';
    box.appendChild(i);
  });
  const add=()=>document.body.appendChild(box); document.body?add():addEventListener('DOMContentLoaded',add);
})();
