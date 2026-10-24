/* Photos tab (prettyteam version, Oct 17 2026): albums and photos added from phones are saved in Google Drive;
   the photos added on the Claude version came along and stay in their albums. */
(function(){
  var BUILT=[{id:'branding',name:'Hi Pretty Branding Shoot'},{id:'bridal',name:'Taffeta Bridal'},{id:'salon',name:'Taffeta Salon & Spa'}];
  var albums=BUILT.slice(),weds=[],photos=[],cur='branding',ready=false,busy=false;
  /* Wedding Day Favorites (Oct 23 2026): each wedding the team adds favorites to gets its own album (album.parent 'bridal').
     They show as folders inside Taffeta Bridal, photos grouped by who added them; videos play from Drive. */
  var css=document.createElement('style');css.textContent='#p-photos .pfolders{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px;margin:0 0 22px}'
    +'#p-photos .pfolder{all:unset;cursor:pointer;background:var(--paper);padding:8px 8px 10px;box-shadow:0 1px 2px rgba(0,0,0,.06),0 6px 18px -10px rgba(0,0,0,.18);display:block}'
    +'#p-photos .pfolder .pcov{aspect-ratio:1;background:var(--line);overflow:hidden}#p-photos .pfolder img{width:100%;height:100%;object-fit:cover;display:block}'
    +'#p-photos .pfolder b{display:block;font-weight:500;font-size:14px;margin:8px 2px 2px}#p-photos .pfolder small{display:block;font-size:12px;opacity:.7;margin:0 2px}'
    +'#p-photos .pfh{font-size:13px;letter-spacing:.14em;text-transform:uppercase;font-weight:500;margin:6px 0 12px}#p-photos .pback{all:unset;cursor:pointer;font-size:14px;text-decoration:underline;text-underline-offset:3px;margin:0 0 10px;display:inline-block}'
    +'#p-photos .ptile button{position:relative}#p-photos .pplay{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.9);display:grid;place-items:center;font-size:16px;padding-left:3px;box-sizing:border-box;pointer-events:none}'
    +'#lb-vid{display:block;border:0;width:min(92vw,960px);height:min(72vh,720px);background:#000}';
  document.head.appendChild(css);
  function box(id,cls,tag,before){var e=$(id);if(!e){e=document.createElement(tag||'div');e.id=id;if(cls)e.className=cls;before.parentNode.insertBefore(e,before)}return e}
  var $=function(id){return document.getElementById(id)};
  try{var s=localStorage.getItem('album');if(s)cur=s}catch(e){}
  var h=(location.hash.match(/album=([\w-]+)/)||[])[1];if(h)cur=h;

  function fmt(ms){try{return new Date(ms).toLocaleDateString(undefined,{month:'short',day:'numeric'})}catch(e){return''}}
  function albumOf(id){var all=albums.concat(weds);for(var i=0;i<all.length;i++)if(all[i].id===id)return all[i];return null}
  function isWed(id){var a=albumOf(id);return !!(a&&a.parent==='bridal')}

  function renderTabs(){
    var nav=$('albums');nav.textContent='';
    albums.forEach(function(a){var b=document.createElement('button');b.type='button';b.textContent=a.name;
      b.setAttribute('aria-current',a.id===cur||(a.id==='bridal'&&isWed(cur))?'true':'false');b.onclick=function(){go(a.id)};nav.appendChild(b);});
    if(ready){var n=document.createElement('button');n.type='button';n.className='add';n.textContent='+ New album';n.onclick=newAlbum;nav.appendChild(n);}
  }
  function tile(p){
    var f=document.createElement('figure');f.className='ptile';
    var b=document.createElement('button');b.type='button';b.dataset.doc=p.id;b.dataset.kind=p.kind;b.dataset.n=fmt(p.addedAt);
    if(p.vf)b.dataset.vf=p.vf;if(p.by)b.dataset.by=p.by;
    b.setAttribute('aria-label','Open '+(p.video?'video':'photo')+' added '+fmt(p.addedAt));
    var im=document.createElement('img');im.loading='lazy';im.alt='Photo added '+fmt(p.addedAt);
    if(p.kind==='m'){im.dataset.e='alb/t/'+p.id+'.jpg';b.dataset.full='alb/'+p.id+'.jpg';}else{im.dataset.d=p.id;}
    if(p.w&&p.h){im.width=p.w>p.h?560:374;im.height=Math.round(im.width*p.h/p.w);}
    b.appendChild(im);if(p.video){var pl=document.createElement('span');pl.className='pplay';pl.textContent='▶';b.appendChild(pl)}f.appendChild(b);
    var c=document.createElement('figcaption');c.textContent='Added '+fmt(p.addedAt)+(p.by?' by '+p.by:'');f.appendChild(c);return f;
  }
  function renderPhotos(){
    var a=albumOf(cur)||albums[0];cur=a.id;
    var mine=photos.filter(function(p){return p.album===cur});
    var isB=cur==='branding';
    $('v-branding').hidden=!isB;$('v-other').hidden=isB;
    var grid=isB?$('phone-grid'):$('o-grid');grid.textContent='';
    mine.forEach(function(p){grid.appendChild(tile(p))});
    if(isB){$('phone-n').textContent=mine.length;$('phone-count').textContent=mine.length+' photos';$('phone-empty').hidden=mine.length>0;}
    else{
      var wed=a.parent==='bridal',nv=mine.filter(function(p){return p.video}).length,np=mine.length-nv;
      $('o-brand').textContent=wed?'Taffeta Bridal':(a.brand||'');$('o-brand').hidden=!(wed||a.brand);$('o-title').textContent=a.name;
      $('o-sub').textContent=mine.length?(wed?[np?np+(np>1?' photos':' photo'):'',nv?nv+(nv>1?' videos':' video'):''].filter(Boolean).join(' and ')+' from the team. Tap any one to see it bigger.':mine.length+' photos. Tap any photo to see it bigger.'):'';
      var back=box('o-back','pback','button',$('o-title').parentNode);back.type='button';back.textContent='← All weddings';back.hidden=!wed;back.onclick=function(){go('bridal')};
      var fold=box('o-folders','pfolders','div',$('o-empty'));fold.textContent='';fold.hidden=!(cur==='bridal'&&weds.length);
      if(!fold.hidden){var fh=box('o-fh','pfh','h3',fold);fh.hidden=false;fh.textContent='Weddings';
        weds.forEach(function(w){var list=photos.filter(function(p){return p.album===w.id});var k=document.createElement('button');k.type='button';k.className='pfolder';
          k.innerHTML='<div class="pcov"></div><b></b><small></small>';k.querySelector('b').textContent=w.name;k.querySelector('small').textContent=list.length+(list.length===1?' item':' items');
          if(list[0]){var im=document.createElement('img');im.alt='';im.dataset.d=list[0].id;k.querySelector('.pcov').appendChild(im)}
          k.onclick=function(){go(w.id)};fold.appendChild(k)});
        MK.scan(fold);}else if($('o-fh'))$('o-fh').hidden=true;
      var groups=$('o-groups');if(!groups){groups=document.createElement('div');groups.id='o-groups';grid.parentNode.after(groups)}groups.textContent='';
      if(wed){grid.textContent='';var by=[];mine.forEach(function(p){var n=p.by||'Team';if(by.indexOf(n)<0)by.push(n)});
        by.forEach(function(n){var h3=document.createElement('h3');h3.className='pfh';h3.textContent=n;var g=document.createElement('div');g.className='pgrid';
          mine.filter(function(p){return(p.by||'Team')===n}).forEach(function(p){g.appendChild(tile(p))});groups.appendChild(h3);groups.appendChild(g)});MK.scan(groups);}
      $('o-empty').hidden=mine.length>0||(cur==='bridal'&&weds.length>0);}
    MK.scan(grid);
  }
  function go(id,back){if(!back&&id!==cur)remember();cur=id;try{localStorage.setItem('album',id)}catch(e){}
    history.replaceState(null,'','#album='+id);renderTabs();renderPhotos();var pp=document.getElementById('p-photos');if(pp)pp.scrollIntoView();}

  function newAlbum(){
    var name=(prompt('Name for the new album (for example: Holiday Party 2026)')||'').trim();if(!name)return;
    MK.api('album',{name:name.slice(0,60)}).then(function(r){cur=r.id;MK.applyState(r)}).catch(function(){msg('Could not add that album. Try again.')});
  }
  function msg(t){$('upmsg').textContent=t}

  // Photo prep: normal keeps up to 2048px (Instagram tops out at 1440, and smaller goes up faster over a phone's data, Oct 24 2026);
  // full size keeps the original when it can.
  var OK={'image/jpeg':1,'image/png':1,'image/webp':1};
  function load1(file){return new Promise(function(res,rej){var u=URL.createObjectURL(file),im=new Image();
    im.onload=function(){res({im:im,u:u})};im.onerror=function(){URL.revokeObjectURL(u);rej(new Error('decode'))};im.src=u;})}
  // iPhone photos are often HEIC, which Chrome can't open, so those get turned into JPEGs first (Oct 23 2026).
  var heicLib=null;
  function heicJs(){return heicLib||(heicLib=new Promise(function(res,rej){var sc=document.createElement('script');
    sc.src='https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';sc.onload=function(){res(window.heic2any)};sc.onerror=function(){heicLib=null;rej(new Error('heic lib'))};document.head.appendChild(sc);}))}
  function isHeic(f){return /hei[cf]/i.test(f.type||'')||/\.hei[cf]$/i.test(f.name||'')}
  function load(file){return load1(file).catch(function(err){if(!isHeic(file))throw err;
    return heicJs().then(function(h2a){return h2a({blob:file,toType:'image/jpeg',quality:.92})}).then(function(b){return load1(Array.isArray(b)?b[0]:b)});});}
  function shrink(im,max,q){var w=im.naturalWidth,h=im.naturalHeight,k=Math.min(1,max/Math.max(w,h)),cw=Math.round(w*k),ch=Math.round(h*k);
    var c=document.createElement('canvas');c.width=cw;c.height=ch;c.getContext('2d').drawImage(im,0,0,cw,ch);
    return new Promise(function(res,rej){c.toBlob(function(b){b?res({blob:b,w:cw,h:ch}):rej(new Error('encode'))},'image/jpeg',q)});}
  function prep(file,full){
    return load(file).then(function(o){
      var w=o.im.naturalWidth,h=o.im.naturalHeight,keep=full&&OK[file.type]&&file.size<18*1048576;
      var main=keep?Promise.resolve({blob:file,w:w,h:h}):shrink(o.im,full?4096:2048,full?.92:.86);
      var fp=fpOf(o.im);
      return Promise.all([main,shrink(o.im,480,.82)]).then(function(r){URL.revokeObjectURL(o.u);return{blob:r[0].blob,w:r[0].w,h:r[0].h,thumb:r[1].blob,fp:fp}});
    });
  }
  // Doubles (Alexandra, Oct 24 2026): a picture-fingerprint (17x16 difference hash) of every photo in the album, so the same
  // photo isn't added twice and doubles already there can be cleared. Re-saved or resized copies still match; different shots don't.
  var HK='mkt-fp',fps={};try{fps=JSON.parse(localStorage.getItem(HK)||'{}')}catch(e){}
  function keepFps(){try{localStorage.setItem(HK,JSON.stringify(fps))}catch(e){}}
  function fpOf(im){var src=im,w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;
    while(w>68||h>64){w=Math.max(17,Math.ceil(w/2));h=Math.max(16,Math.ceil(h/2));var t=document.createElement('canvas');t.width=w;t.height=h;var tx=t.getContext('2d');tx.imageSmoothingQuality='high';tx.drawImage(src,0,0,w,h);src=t}
    var c=document.createElement('canvas');c.width=17;c.height=16;var x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(src,0,0,17,16);
    var d=x.getImageData(0,0,17,16).data,out='',n=0,k=0;
    for(var y=0;y<16;y++)for(var i=0;i<16;i++){var a=(y*17+i)*4,b=a+4;n=n<<1|((d[a]*3+d[a+1]*6+d[a+2])>(d[b]*3+d[b+1]*6+d[b+2])?1:0);if(++k%4===0){out+=n.toString(16);n=0}}
    return out}
  var BITS=[0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4];
  function same(a,b){if(!a||!b||a.length!==b.length)return false;var d=0;for(var i=0;i<a.length;i++){d+=BITS[parseInt(a[i],16)^parseInt(b[i],16)];if(d>28)return false}return true}
  function imgFrom(u){return new Promise(function(res){var im=new Image();im.onload=function(){res(im)};im.onerror=function(){res(null)};im.src=u})}
  function albumFps(album){
    var list=photos.filter(function(p){return p.album===album&&!p.video&&!fps[p.id]}),need=list.filter(function(p){return p.kind==='d'&&!MK._thumbs.has(p.id)}).map(function(p){return p.id}),b=[];
    for(var i=0;i<need.length;i+=30)b.push(need.slice(i,i+30));
    return b.reduce(function(pr,ids){return pr.then(function(){return MK.api('thumbs',{ids:ids}).then(function(r){Object.keys(r.photos||{}).forEach(function(id){MK._thumbs.set(id,r.photos[id])})}).catch(function(){})})},Promise.resolve())
      .then(function(){return Promise.all(list.map(function(p){var u=p.kind==='m'?MK.url('alb/t/'+p.id+'.jpg').catch(function(){return''}):Promise.resolve(MK._thumbs.get(p.id)||'');
        return u.then(function(x){return x?imgFrom(x):null}).then(function(im){if(im)fps[p.id]=fpOf(im)})}))})
      .then(function(){keepFps();return photos.filter(function(p){return p.album===album&&fps[p.id]}).map(function(p){return{id:p.id,fp:fps[p.id],p:p}})});
  }
  function b64(blob){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(String(r.result).split(',')[1])};r.onerror=rej;r.readAsDataURL(blob)})}
  // Phone uploads (Alexandra, Oct 24 2026): each photo shows in the album as soon as it's saved instead of all at the end,
  // two go up at a time (thumbnails no longer wait behind them), and the screen stays awake so the phone doesn't stop halfway.
  var wake=null;
  function awake(on){try{if(on&&!wake&&navigator.wakeLock)navigator.wakeLock.request('screen').then(function(w){wake=w;w.addEventListener('release',function(){wake=null})}).catch(function(){});
    else if(!on&&wake){wake.release();wake=null}}catch(e){}}
  document.addEventListener('visibilitychange',function(){if(busy&&document.visibilityState==='visible')awake(true)});
  function landed(ph,thumb,fp){var s=MK._state;if(!s||!ph)return;MK._thumbs.set(ph.id,'data:image/jpeg;base64,'+thumb);if(fp){fps[ph.id]=fp;keepFps()}
    if(!(s.photos||[]).some(function(x){return x.id===ph.id}))MK.applyState(Object.assign({},s,{photos:[ph].concat(s.photos||[])}));}
  function uploadAll(files){
    if(busy||!files.length)return;busy=true;MK.busy=true;awake(true);
    var album=cur,full=$('fullsize').checked,done=0,fail=0,dup=0,total=files.length,q=files.slice(),have=[];
    var bar=$('prog');bar.hidden=false;
    function step(){bar.firstChild.style.width=Math.round(100*(done+fail+dup)/total)+'%';msg('Adding photos: '+(done+fail+dup)+' of '+total+(dup?' ('+dup+' already here, skipped)':'')+(fail?' ('+fail+' did not work)':'')+'. Keep this page open.');}
    msg('Getting ready\u2026');
    function worker(){var f=q.shift();if(!f)return Promise.resolve();
      return prep(f,full).then(function(p){
        if(have.some(function(x){return same(x,p.fp)})){dup++;return}
        have.push(p.fp);
        return Promise.all([b64(p.blob),b64(p.thumb)]).then(function(d){
        var body={album:album,data:d[0],thumb:d[1],w:p.w,h:p.h,type:p.blob.type||'image/jpeg'};
        return MK.api('addPhoto',body).catch(function(){return new Promise(function(r){setTimeout(r,4000)}).then(function(){return MK.api('addPhoto',body)})})
          .then(function(r){landed(r.photo,d[1],p.fp);done++});});})
      .then(null,function(e){fail++;console.warn(e)})
      .then(function(){step();return worker()});}
    // Waits at most 20 seconds for the album's fingerprints, so a slow connection never holds up the upload.
    Promise.race([albumFps(album),new Promise(function(r){setTimeout(function(){r(null)},20000)})]).catch(function(){return null}).then(function(l){return l||photos.filter(function(p){return p.album===album&&fps[p.id]}).map(function(p){return{fp:fps[p.id]}})}).then(function(l){have=l.map(function(x){return x.fp});step();return Promise.all([worker(),worker()])}).then(function(){busy=false;MK.busy=false;awake(false);bar.hidden=true;
      msg(done+' photo'+(done===1?'':'s')+' added'+(dup?'. '+dup+(dup===1?' was':' were')+' already in this album, so I skipped '+(dup===1?'it':'them'):'')+(fail?'. '+fail+' did not work. Try those again, or turn off Full size.':'.'));$('pick').value='';MK.refresh();});
  }

  // Lightbox works on whichever album is showing, always at full size.
  var lb=$('lb'),img=$('lb-img'),cap=$('lb-cap'),i=0,list=[];
  var vid=document.createElement('iframe');vid.id='lb-vid';vid.hidden=true;vid.setAttribute('allow','autoplay; fullscreen');vid.setAttribute('allowfullscreen','');vid.title='Wedding video';img.after(vid);
  lb.addEventListener('close',function(){vid.src='about:blank'});
  function show(k){i=(k+list.length)%list.length;var b=list[i],im=b.querySelector('img');img.removeAttribute('src');img.alt=im.alt;
    if(b.dataset.vf){img.hidden=true;vid.hidden=false;vid.src='https://drive.google.com/file/d/'+b.dataset.vf+'/preview';$('lb-open').href='https://drive.google.com/file/d/'+b.dataset.vf+'/view';
      cap.textContent='Added '+b.dataset.n+(b.dataset.by?' by '+b.dataset.by:'');$('lb-del').hidden=!ready;return;}
    img.hidden=false;vid.hidden=true;vid.src='about:blank';
    var path=b.dataset.full||((im.dataset.e||'').indexOf('shoot/')===0?im.dataset.e.replace('shoot/','full/'):'');
    var want=b;var got=function(u){if(list[i]===want){img.src=u;$('lb-open').href=u;}};
    if(path)MK.url(path).then(got);else if(b.dataset.kind==='d')MK.driveFull(b.dataset.doc).then(got);else if(im.src)got(im.src);
    cap.textContent=b.dataset.doc?'Added '+b.dataset.n+(b.dataset.by?' by '+b.dataset.by:''):'Photo #'+b.dataset.n;$('lb-del').hidden=!(b.dataset.doc&&ready);}
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.ptile button');if(!b)return;
    var view=b.closest('.pview');list=[].slice.call(view.querySelectorAll('.ptile button'));show(list.indexOf(b));if(lb.showModal)lb.showModal();});
  $('lb-prev').onclick=function(){show(i-1)};$('lb-next').onclick=function(){show(i+1)};$('lb-close').onclick=function(){lb.close()};
  lb.addEventListener('click',function(e){if(e.target===lb)lb.close();});
  document.addEventListener('keydown',function(e){if(!lb.open)return;if(e.key==='ArrowRight')show(i+1);if(e.key==='ArrowLeft')show(i-1);});
  $('lb-del').onclick=function(){var b=list[i];if(!b||!confirm('Delete this photo from the album for everyone?'))return;
    MK.api('delPhoto',{id:b.dataset.doc}).then(function(s){lb.close();MK.applyState(s)}).catch(function(){alert('Could not delete it. Try again.')});};

  // Back and Refresh (Alexandra, Oct 23 2026). Back steps to the last tab or album she looked at on this page;
  // Refresh reloads the page and lands on the same tab and album (both are remembered in localStorage and the address).
  var trail=[];
  function view(){var t=document.querySelector('[role=tab][aria-selected=true]');return{tab:t?t.id.slice(2):'',album:cur}}
  function remember(){var v=view(),l=trail[trail.length-1];if(!l||l.tab!==v.tab||l.album!==v.album)trail.push(v);if(trail.length>50)trail.shift();navState();}
  document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[role=tab]');if(t&&t.getAttribute('aria-selected')!=='true')remember();},true);
  var nav=document.createElement('div');nav.className='mknav';
  nav.innerHTML='<button type="button" id="mk-back">\u2039 Back</button><button type="button" id="mk-refresh">Refresh</button>';
  document.body.prepend(nav);
  var nst=document.createElement('style');nst.textContent='.mknav{display:flex;justify-content:flex-end;gap:6px;max-width:1200px;margin:0 auto;padding:12px 16px 0;box-sizing:border-box}'
    +'.mknav button{font:inherit;font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding:8px 12px;border:1px solid #111;background:transparent;color:#111;cursor:pointer;border-radius:0}'
    +'.mknav button:disabled{opacity:.35;cursor:default}@media print{.mknav{display:none}}';document.head.appendChild(nst);
  function navState(){$('mk-back').disabled=!trail.length}
  $('mk-back').onclick=function(){var v=trail.pop();navState();if(!v)return;
    var cv=view();if(v.tab&&v.tab!==cv.tab){var b=$('t-'+v.tab);if(b)b.click();trail.pop();navState();}
    if(v.album!==cur)go(v.album,true);else window.scrollTo(0,0);};
  $('mk-refresh').onclick=function(){this.disabled=true;this.textContent='Refreshing\u2026';location.reload();};
  navState();

  $('pick').addEventListener('change',function(){uploadAll([].slice.call(this.files||[]))});

  // Remove doubles: finds copies of the same photo in the open album, keeps the first one added, and removes the rest
  // (Drive keeps removed photos in its trash for 30 days).
  var dupb=document.createElement('button');dupb.type='button';dupb.id='mk-dups';dupb.textContent='Remove Doubles';$('fullsize').parentNode.after(dupb);
  var dst2=document.createElement('style');dst2.textContent='#mk-dups{font:inherit;font-size:13px;padding:10px 14px;min-height:40px;border:1px solid var(--ink,#111);background:transparent;color:var(--ink,#111);cursor:pointer;border-radius:2px}#mk-dups:disabled{opacity:.4;cursor:default}';document.head.appendChild(dst2);
  dupb.onclick=function(){if(busy)return;var album=cur;busy=true;dupb.disabled=true;msg('Looking for doubles\u2026');
    albumFps(album).then(function(l){l.sort(function(a,b){return(a.p.addedAt||0)-(b.p.addedAt||0)});var keep=[],extra=[];
      l.forEach(function(x){if(keep.some(function(k){return same(k.fp,x.fp)}))extra.push(x);else keep.push(x)});
      if(!extra.length){msg('No doubles in this album.');return}
      if(!confirm('Found '+extra.length+' double'+(extra.length>1?'s':'')+' in this album. Remove the extra copies? The first one of each stays.')){msg('');return}
      var n=0;return extra.reduce(function(pr,x){return pr.then(function(){return MK.api('delPhoto',{id:x.id}).then(function(st){n++;msg('Removing doubles: '+n+' of '+extra.length);MK.applyState(st)}).catch(function(){})})},Promise.resolve())
        .then(function(){msg(n+' double'+(n===1?'':'s')+' removed.')});})
      .catch(function(){msg('Could not check for doubles. Try again.')}).then(function(){busy=false;dupb.disabled=false});};

  // Drag and drop (Alexandra, Oct 23 2026): the Mac file window hides her Photos albums, so on a computer she can drag
  // pictures straight out of an album in the Photos app onto the page and they go into the album that's open.
  var drop=document.createElement('div');drop.className='pdrop';drop.hidden=true;document.body.appendChild(drop);
  var dst=document.createElement('style');dst.textContent='.pdrop{position:fixed;inset:12px;z-index:50;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;border:2px dashed #111;background:rgba(250,249,247,.92);font:inherit;font-size:22px;color:#111;pointer-events:none}.pdrop[hidden]{display:none}.pdrophint{margin:6px 0 0;color:#555250;font-size:14px}';document.head.appendChild(dst);
  if(window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches){var hint=document.createElement('p');hint.className='pdrophint';
    hint.textContent='On a computer, you can also open an album in your Photos app and drag the pictures onto this page.';$('upmsg').before(hint);}
  function hasFiles(e){return e.dataTransfer&&[].indexOf.call(e.dataTransfer.types||[],'Files')>=0}
  function albumName(){var a=albums.concat(weds).filter(function(x){return x.id===cur})[0];return a?a.name:'this album'}
  var depth=0;
  function onPhotos(){var pp=document.getElementById('p-photos');return ready&&!(pp&&pp.hidden)}
  document.addEventListener('dragenter',function(e){if(!onPhotos())return;e.preventDefault();depth++;drop.textContent='Drop to add to '+albumName();drop.hidden=false;});
  document.addEventListener('dragover',function(e){if(!onPhotos())return;e.preventDefault();e.dataTransfer.dropEffect='copy';});
  document.addEventListener('dragleave',function(e){if(!onPhotos())return;depth=Math.max(0,depth-1);if(!depth)drop.hidden=true;});
  document.addEventListener('drop',function(e){if(!onPhotos())return;e.preventDefault();depth=0;drop.hidden=true;
    if(!hasFiles(e)||!(e.dataTransfer.files||[]).length){msg('Chrome could not take those straight from Photos. Drag them to your Desktop first, then from the Desktop onto this page.');return;}
    var fs=[].filter.call(e.dataTransfer.files||[],function(f){return /^image\//.test(f.type)||/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)});
    if(!fs.length){msg('Those were not photos. Drag pictures from the Photos app, your Desktop or a folder.');return;}
    var pp=document.getElementById('p-photos');if(pp&&pp.hidden){msg('Open Photos first, then drag them in.');return;}
    uploadAll(fs);});
  renderTabs();renderPhotos();

  MK.onState(function(s){
    var hide={};(s.hidden||[]).forEach(function(x){hide[x]=1});
    var all=(s.albums||[]).map(function(a){return{id:a.id,name:String(a.name||'Album'),brand:'',parent:a.parent||'',date:a.date||''}});
    albums=BUILT.concat(all.filter(function(a){return !a.parent}));
    weds=all.filter(function(a){return a.parent==='bridal'}).sort(function(x,y){return(y.date||'').localeCompare(x.date||'')});
    photos=(s.photos||[]).map(function(p){return{id:p.id,album:p.album,w:p.w,h:p.h,addedAt:p.addedAt,kind:'d',by:p.by||'',video:!!p.video,vf:p.vf||''}})
      .concat(MK.migrated.map(function(p){return{id:p.id,album:p.album,w:p.w,h:p.h,addedAt:p.addedAt,kind:'m'}}))
      .filter(function(p){return !hide[p.id]}).sort(function(a,b){return(b.addedAt||0)-(a.addedAt||0)});
    ready=true;$('upbar').hidden=false;renderTabs();renderPhotos();
  });
})();
