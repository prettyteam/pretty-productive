/* Taffeta shared uploader (Alexandra, Nov 12 2026).
   "Every single feature where the team or myself are able to upload a photo or video should have the same exact features:
   upload the fastest, always tell us when it's saved, add many at a time, and drag things in from the computer."
   Every page that has an upload loads this one file, so each upload spot gets the same:
   - Drag and drop: drag photos or videos from Finder, the Desktop or the Photos app onto any upload button or album/folder
     and they go in there. While you drag, every spot you can drop on lights up.
   - One message at the bottom of the screen: "Uploading 3 of 10…" with a bar, then "✓ Saved! 10 photos uploaded."
     If anything fails it says so in red and stays up until you close it.
   - Faster photo prep: each photo is opened once and shrunk to every size it needs from that one copy, off the main screen
     when the phone allows it. iPhone HEIC photos open on any computer.
   - The screen stays awake while things upload.
   Pages keep their own server calls; this file only does the shared parts. Page code: TUp.say/progress/saved/failed,
   TUp.shrink(file,max,q) (data URL), TUp.shrinkBlob(file,max,q), TUp.pool(list,n,fn), TUp.awake(on), TUp.zone(el,input). */
(function(){
  if(window.TUp)return;
  var T=window.TUp={CONC:4};

  /* ---------- look ---------- */
  var css='#tup-toast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);z-index:2147483000;'
   +'max-width:min(92vw,460px);min-width:220px;box-sizing:border-box;padding:12px 40px 12px 16px;border-radius:14px;background:#121212;color:#fff;'
   +'font:15px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.22);opacity:0;pointer-events:none;transition:opacity .2s,transform .2s}'
   +'#tup-toast.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}#tup-toast.ok{background:#1f3d2b}#tup-toast.err{background:#7a1f1f}'
   +'#tup-toast .bar{height:4px;border-radius:2px;background:rgba(255,255,255,.25);margin-top:8px;overflow:hidden}#tup-toast .bar i{display:block;height:100%;width:0;background:#fff;transition:width .3s}'
   +'#tup-toast button{position:absolute;right:6px;top:6px;border:0;background:none;color:inherit;font-size:20px;line-height:1;padding:6px 8px;cursor:pointer;opacity:.8}'
   +'.tup-on .tup-zone{outline:2px dashed #121212!important;outline-offset:3px;border-radius:6px}'
   +'.tup-zone.tup-over{outline:3px solid #121212!important;background-color:rgba(18,18,18,.06)!important}'
   +'#tup-hint{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483000;background:#121212;color:#fff;padding:8px 14px;border-radius:20px;'
   +'font:14px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;pointer-events:none;display:none}.tup-on #tup-hint{display:block}';
  function ready(fn){if(document.body)fn();else document.addEventListener('DOMContentLoaded',fn)}
  var box,txt,bar,closeB,hideT=0;
  ready(function(){var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    box=document.createElement('div');box.id='tup-toast';box.setAttribute('role','status');box.setAttribute('aria-live','polite');
    txt=document.createElement('div');bar=document.createElement('div');bar.className='bar';bar.innerHTML='<i></i>';bar.hidden=true;
    closeB=document.createElement('button');closeB.type='button';closeB.setAttribute('aria-label','Close');closeB.textContent='×';closeB.onclick=function(){box.classList.remove('on')};
    box.appendChild(txt);box.appendChild(bar);box.appendChild(closeB);document.body.appendChild(box);
    var hint=document.createElement('div');hint.id='tup-hint';hint.textContent='Drop on a spot with a dashed line';document.body.appendChild(hint);});

  /* kind: 'busy' (stays), 'ok' (green, goes away after 5s), 'err' (red, stays until closed). pct 0-100 shows a bar. */
  T.say=function(text,kind,pct){ready(function(){clearTimeout(hideT);txt.textContent=text;box.className='on'+(kind&&kind!=='busy'?' '+kind:'');
    if(pct==null){bar.hidden=true}else{bar.hidden=false;bar.firstChild.style.width=Math.max(0,Math.min(100,pct))+'%'}
    if(kind==='ok')hideT=setTimeout(function(){box.classList.remove('on')},5000);});};
  var nm=function(n,what){what=what||'photo';return n+' '+what+(n===1?'':'s')};
  T.progress=function(done,total,what,extra){T.say('Uploading '+Math.min(done+1,total)+' of '+total+(what?' '+what+'s':'')+'… Keep this page open.'+(extra?' '+extra:''),'busy',total?100*done/total:null)};
  T.saved=function(n,what,extra){T.say('✓ Saved! '+(n==null?'':nm(n,what)+' uploaded.')+(extra?' '+extra:''),'ok')};
  T.failed=function(n,what,extra){T.say((n?nm(n,what)+' did not upload. ':'That did not upload. ')+(extra||'Check your signal and try again.'),'err')};
  T.done=function(ok,bad,what,extra){if(bad)T.say((ok?'✓ '+nm(ok,what)+' saved. ':'')+nm(bad,what)+' did not upload. Try '+(bad===1?'it':'those')+' again.','err');else if(ok)T.saved(ok,what,extra)};

  /* ---------- keep the screen awake ---------- */
  var wl=null,wn=0;
  function grab(){try{if(!wl&&navigator.wakeLock)navigator.wakeLock.request('screen').then(function(w){wl=w;w.addEventListener('release',function(){wl=null})}).catch(function(){})}catch(e){}}
  T.awake=function(on){wn=Math.max(0,wn+(on?1:-1));if(wn)grab();else if(wl){try{wl.release()}catch(e){}wl=null}};
  document.addEventListener('visibilitychange',function(){if(wn&&document.visibilityState==='visible')grab()});

  /* ---------- run a list a few at a time ---------- */
  T.pool=function(list,n,fn){var q=list.slice(),i=0;n=n||T.CONC;
    function w(){if(!q.length)return Promise.resolve();var k=i++,x=q.shift();return Promise.resolve().then(function(){return fn(x,k)}).then(null,function(e){console.warn(e)}).then(w)}
    var ws=[];for(var j=0;j<Math.min(n,list.length);j++)ws.push(w());return Promise.all(ws)};

  /* ---------- faster photo prep ---------- */
  var heicLib=null;
  function heicJs(){return heicLib||(heicLib=new Promise(function(res,rej){var s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';s.onload=function(){res(window.heic2any)};s.onerror=function(){heicLib=null;rej(new Error('heic'))};document.head.appendChild(s)}))}
  var isHeic=function(f){return /hei[cf]/i.test(f.type||'')||/\.hei[cf]$/i.test(f.name||'')};
  function viaImg(blob){return new Promise(function(res,rej){var u=URL.createObjectURL(blob),im=new Image();im.decoding='async';
    im.onload=function(){res({src:im,w:im.naturalWidth,h:im.naturalHeight,done:function(){URL.revokeObjectURL(u)}})};im.onerror=function(){URL.revokeObjectURL(u);rej(new Error('decode'))};im.src=u})}
  function decode1(blob){
    if(window.createImageBitmap)return createImageBitmap(blob,{imageOrientation:'from-image'}).then(function(b){return{src:b,w:b.width,h:b.height,done:function(){try{b.close()}catch(e){}}}},function(){return viaImg(blob)});
    return viaImg(blob)}
  function decode(file){return decode1(file).catch(function(err){if(!isHeic(file))throw err;
    return heicJs().then(function(h){return h({blob:file,toType:'image/jpeg',quality:.92})}).then(function(b){return decode1(Array.isArray(b)?b[0]:b)})})}
  // A photo is opened once and kept for a few seconds, so a big copy and a small copy of the same photo don't open it twice.
  var cache=new Map();
  function opened(file){var c=cache.get(file);if(c){clearTimeout(c.t);c.t=setTimeout(function(){drop(file)},4000);return c.p}
    c={p:decode(file)};c.t=setTimeout(function(){drop(file)},4000);cache.set(file,c);c.p.catch(function(){drop(file)});return c.p}
  function drop(file){var c=cache.get(file);if(!c)return;cache.delete(file);c.p.then(function(d){d.done()},function(){})}
  function canvasOf(d,max){var k=Math.min(1,max/Math.max(d.w,d.h)),w=Math.max(1,Math.round(d.w*k)),h=Math.max(1,Math.round(d.h*k));
    var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.imageSmoothingQuality='high';x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(d.src,0,0,w,h);return c}
  T.shrinkBlob=function(file,max,q){return opened(file).then(function(d){var c=canvasOf(d,max);
    return new Promise(function(res,rej){c.toBlob(function(b){b?res({blob:b,w:c.width,h:c.height}):rej(new Error('encode'))},'image/jpeg',q||.85)})})};
  T.shrink=function(file,max,q){return T.shrinkBlob(file,max,q).then(function(r){return T.b64(r.blob,true)})};
  T.size=function(file){return opened(file).then(function(d){return{w:d.w,h:d.h}},function(){return{w:0,h:0}})};
  T.b64=function(blob,whole){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(whole?String(r.result):String(r.result).split(',')[1])};r.onerror=rej;r.readAsDataURL(blob)})};
  T.isVid=function(f){return /^video\//.test(f.type||'')||/\.(mov|mp4|m4v|3gp|webm|avi)$/i.test(f.name||'')};
  T.isImg=function(f){return /^image\//.test(f.type||'')||/\.(jpe?g|png|webp|gif|hei[cf])$/i.test(f.name||'')};

  /* ---------- drag and drop onto every upload spot ---------- */
  // A spot is: the label or button around a file box, any element marked data-drop-for="<file box id>", or one a page
  // registers with TUp.zone(el,input) (an album, a folder, a photo group).
  T.zone=function(el,input){if(!el||!input)return el;el._tupIn=input;el.classList.add('tup-zone');return el};
  function inputOf(z){if(z._tupIn)return z._tupIn;var id=z.getAttribute&&z.getAttribute('data-drop-for');if(id)return document.getElementById(id);
    return z.querySelector&&z.querySelector('input[type=file]')}
  function shown(el){if(!el||!el.isConnected)return false;if(el.closest('[hidden]'))return false;var r=el.getBoundingClientRect();return r.width>0&&r.height>0}
  function mark(){
    document.querySelectorAll('input[type=file]:not([data-nodrop])').forEach(function(inp){
      var z=inp.closest('label,.filebtn,[data-drop]');
      if(!z&&inp.id)z=document.querySelector('[data-drop-for="'+inp.id+'"]');
      if(!z){var p=inp.parentElement;if(p&&p.querySelectorAll('input[type=file]').length===1&&p!==document.body&&p.getBoundingClientRect().height<400)z=p}
      if(z&&!z._tupIn){z._tupIn=inp;z.classList.add('tup-zone')}
      // a closed dropdown hides its choices, so its summary takes the drop for the first choice
      var dd=inp.closest('details');if(dd&&!dd.open){var s=dd.querySelector('summary');if(s&&!s._tupIn){s._tupIn=inp;s.classList.add('tup-zone')}}
    });
    document.querySelectorAll('[data-drop-for]').forEach(function(z){if(!z.classList.contains('tup-zone'))z.classList.add('tup-zone')});
  }
  function zones(){mark();return [].filter.call(document.querySelectorAll('.tup-zone'),function(z){var i=inputOf(z);return i&&!i.disabled&&(shown(z))})}
  function fits(inp,f){var a=(inp.getAttribute('accept')||'').split(',').map(function(s){return s.trim().toLowerCase()}).filter(Boolean);if(!a.length)return true;
    var t=(f.type||'').toLowerCase(),n=(f.name||'').toLowerCase();
    return a.some(function(x){if(x.charAt(0)==='.')return n.slice(-x.length)===x;if(/\/\*$/.test(x))return t.indexOf(x.slice(0,-1))===0||(x==='image/*'&&T.isImg(f)&&!t)||(x==='video/*'&&T.isVid(f)&&!t)||(x==='image/*'&&isHeic(f));return t===x})}
  T.give=function(inp,files){
    var ok=files.filter(function(f){return fits(inp,f)});
    if(!ok.length){T.say(inp.getAttribute('accept')&&/video/.test(inp.getAttribute('accept'))?'Those were not photos or videos. Nothing was added.':'Those were not photos. Nothing was added.','err');return false}
    if(!inp.multiple&&ok.length>1){ok=ok.slice(0,1);T.say('This spot takes one at a time, so I used the first one.','busy')}
    else if(ok.length<files.length)T.say((files.length-ok.length)+' of those could not go here, so I left '+(files.length-ok.length===1?'it':'them')+' out.','busy');
    try{var dt=new DataTransfer();ok.forEach(function(f){dt.items.add(f)});inp.files=dt.files}catch(e){T.say('This browser could not take a drop here. Tap the button instead.','err');return false}
    inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));return true};
  function hasFiles(e){return e.dataTransfer&&[].indexOf.call(e.dataTransfer.types||[],'Files')>=0}
  var depth=0,over=null;
  function off(){depth=0;document.documentElement.classList.remove('tup-on');if(over)over.classList.remove('tup-over');over=null}
  function zoneAt(e){var el=e.target&&e.target.closest?e.target.closest('.tup-zone'):null;return el&&inputOf(el)?el:null}
  // Window listeners run after the page's own, so a page that handles drops itself (Marketing Proofs) still wins.
  window.addEventListener('dragenter',function(e){if(e.defaultPrevented||!hasFiles(e))return;var z=zones();if(!z.length)return;e.preventDefault();depth++;document.documentElement.classList.add('tup-on')});
  window.addEventListener('dragover',function(e){if(!hasFiles(e))return;if(e.defaultPrevented){off();return}if(!document.documentElement.classList.contains('tup-on'))return;e.preventDefault();e.dataTransfer.dropEffect='copy';
    var z=zoneAt(e);if(z!==over){if(over)over.classList.remove('tup-over');over=z;if(z)z.classList.add('tup-over')}});
  window.addEventListener('dragleave',function(){if(depth&&!--depth)off()});
  window.addEventListener('drop',function(e){if(!hasFiles(e))return;var on=document.documentElement.classList.contains('tup-on'),z=zoneAt(e);off();
    if(e.defaultPrevented||!on)return;e.preventDefault();
    var files=[].slice.call(e.dataTransfer.files||[]);
    if(!files.length){T.say('Those could not come straight from the Photos app. Drag them to your Desktop first, then onto the page.','err');return}
    if(!z){var all=zones();if(all.length===1)z=all[0];else{T.say('Drop them right on one of the spots with a dashed line.','err');return}}
    var dd=z.closest('details');if(dd&&z.tagName==='SUMMARY')dd.open=false;
    T.give(inputOf(z),files)});
})();
