/* In-app PDF viewer with a Back button (Alexandra, Oct 16 2026).
   Opening a made-on-the-phone PDF used to replace the app (home-screen apps have no browser back button), so the
   artist got stuck on the PDF. Now the PDF opens on top of the app: Back closes it (so does the phone's back swipe),
   Share sends it. Pages are drawn with pdf.js so every page shows on iPhone and iPad. */
(function(){
  const LIB='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  let libP=null;
  function lib(){
    if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if(libP) return libP;
    libP=new Promise((res,rej)=>{const sc=document.createElement('script');sc.src=LIB+'pdf.min.js';
      sc.onload=()=>{try{window.pdfjsLib.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob(["importScripts('"+LIB+"pdf.worker.min.js')"],{type:'text/javascript'}))}catch(e){}res(window.pdfjsLib)};
      sc.onerror=()=>{libP=null;rej(new Error('lib'))};document.head.append(sc)});
    return libP;
  }
  function css(){
    if(document.getElementById('pdfv-css')) return;
    const st=document.createElement('style');st.id='pdfv-css';
    st.textContent=`.pdfv{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;background:var(--marshmallow,#f2f1ec)}
.pdfv-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:calc(10px + env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) 10px max(16px,env(safe-area-inset-left,0px));border-bottom:1px solid var(--line,#dcd6cb);background:var(--marshmallow,#f2f1ec)}
.pdfv-bar button{font:inherit;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;border:1px solid var(--ink,#000);background:transparent;color:var(--ink,#000);border-radius:999px;height:38px;padding:0 18px;cursor:pointer}
.pdfv-bar .pdfv-name{flex:1;min-width:0;text-align:center;font-size:13px;color:var(--muted,#2b2b2b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pdfv-body{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:16px max(12px,env(safe-area-inset-right,0px)) calc(24px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));display:flex;flex-direction:column;align-items:center;gap:12px}
.pdfv-tip{font-size:12.5px;color:var(--muted,#2b2b2b);margin:0 0 10px;text-align:center;max-width:640px}
.pdfv-body img{width:100%;max-width:640px;height:auto;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.08);-webkit-touch-callout:default;-webkit-user-select:auto;user-select:auto}
.pdfv-body canvas{width:100%;max-width:640px;height:auto;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.08)}
.pdfv-body iframe{width:100%;max-width:640px;flex:1;min-height:70vh;border:0;background:#fff}
.pdfv-msg{font-size:14px;color:var(--muted,#2b2b2b);margin:24px 0}`;
    document.head.append(st);
  }
  let open=null;
  function close(fromPop){
    if(!open) return; const o=open; open=null;
    o.el.remove(); document.documentElement.style.overflow=o.ov;
    if(o.url) setTimeout(()=>URL.revokeObjectURL(o.url),1000);
    window.removeEventListener('popstate',o.pop);
    if(!fromPop&&history.state&&history.state.pdfv) history.back();
  }
  window.pdfOverlay=async function(blob,name){
    css(); if(open) close();
    const back=document.createElement('button');back.type='button';back.textContent='‹ Back';
    const share=document.createElement('button');share.type='button';share.textContent='Share';
    const nm=document.createElement('span');nm.className='pdfv-name';nm.textContent=(name||'').replace(/\.pdf$/i,'');
    const bar=document.createElement('div');bar.className='pdfv-bar';bar.append(back,nm,share);
    const body=document.createElement('div');body.className='pdfv-body';
    const msg=document.createElement('p');msg.className='pdfv-msg';msg.textContent='Opening…';body.append(msg);
    const el=document.createElement('div');el.className='pdfv';el.setAttribute('role','dialog');el.setAttribute('aria-label',nm.textContent||'PDF');
    el.append(bar,body);document.body.append(el);
    const o={el,ov:document.documentElement.style.overflow,url:null,pop:()=>close(true)};open=o;
    document.documentElement.style.overflow='hidden';
    try{history.pushState({pdfv:1},'')}catch(e){}
    window.addEventListener('popstate',o.pop);
    back.onclick=()=>close(false);
    const file=new File([blob],name||'Taffeta.pdf',{type:'application/pdf'});
    share.onclick=async()=>{
      if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:nm.textContent})}catch(e){}return}
      const a=document.createElement('a');a.href=o.url||(o.url=URL.createObjectURL(blob));a.download=file.name;document.body.append(a);a.click();a.remove();
    };
    back.focus();
    try{
      const pdfjs=await lib(); const doc=await pdfjs.getDocument({data:new Uint8Array(await blob.arrayBuffer())}).promise;
      if(open!==o) return; msg.remove();
      const tip=document.createElement('p');tip.className='pdfv-tip';tip.textContent='Hold your finger on the picture to copy it or save it to Photos, then paste it in a text.';body.append(tip);
      const w=Math.min(body.clientWidth-24,640), dpr=Math.min(window.devicePixelRatio||1,3);
      for(let i=1;i<=doc.numPages;i++){
        if(open!==o) return;
        const pg=await doc.getPage(i), vp0=pg.getViewport({scale:1}), vp=pg.getViewport({scale:w/vp0.width*dpr});
        const c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;c.setAttribute('aria-label','Page '+i);
        body.append(c); await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
        /* as a picture, so she can hold her finger on it to copy or save it and text it (Alexandra, Oct 20 2026) */
        try{const im=document.createElement('img');im.src=c.toDataURL('image/png');im.alt=(nm.textContent||'PDF')+(doc.numPages>1?' page '+i:'');c.replaceWith(im)}catch(e){}
      }
    }catch(e){
      if(open!==o) return;
      msg.remove(); o.url=o.url||URL.createObjectURL(blob);
      const f=document.createElement('iframe');f.src=o.url;f.title=nm.textContent||'PDF';body.append(f);
    }
  };
})();

/* "Leave us a review" on the guest PDFs (Alexandra, Oct 21 2026): five empty stars she taps to open our Google
   review page. Google doesn't let a link fill in the stars or the words, so she picks them there herself.
   Draws centered at y on a jsPDF doc and returns the height used (0, and nothing drawn, while the link is blank). */
window.pdfReview=function(doc,W,y,font,ink,soft){
  const url=(window.TAFFETA_REVIEWS||{}).salon; if(!url) return 0;   /* set in g/config.js, same link as the gratuity tab QR */
  const r=7.5, gap=6, n=5, sw=n*2*r+(n-1)*gap, x0=W/2-sw/2, cy=y+r+2;
  doc.setDrawColor(...ink); doc.setLineWidth(.7); doc.setLineJoin && doc.setLineJoin('round');
  for(let k=0;k<n;k++){
    const cx=x0+r+k*(2*r+gap), pts=[];
    for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5, rr=i%2?r*.42:r; pts.push([cx+rr*Math.cos(a),cy+rr*Math.sin(a)])}
    doc.lines(pts.slice(1).map((p,i)=>[p[0]-pts[i][0],p[1]-pts[i][1]]),pts[0][0],pts[0][1],[1,1],'S',true);
  }
  doc.setLineWidth(.2);
  doc.setFont(font,'italic'); doc.setFontSize(12); doc.setTextColor(...ink);
  doc.text('Loved your visit? Tap the stars',W/2,cy+r+15,{align:'center'});
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...soft);
  doc.text('to leave us a Google review. It means the world to us.',W/2,cy+r+27,{align:'center'});
  const h=2*r+2+29;
  doc.link(x0-6,y-2,sw+12,h+4,{url});
  return h+6;
};
