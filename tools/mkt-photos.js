/* Photos tab (prettyteam version, Oct 17 2026): albums and photos added from phones are saved in Google Drive;
   the photos added on the Claude version came along and stay in their albums. */
(function(){
  var BUILT=[{id:'branding',name:'Hi Pretty Branding Shoot'},{id:'bridal',name:'Taffeta Bridal'},{id:'salon',name:'Taffeta Salon & Spa'}];
  var albums=BUILT.slice(),photos=[],cur='branding',ready=false,busy=false;
  var $=function(id){return document.getElementById(id)};
  try{var s=localStorage.getItem('album');if(s)cur=s}catch(e){}
  var h=(location.hash.match(/album=([\w-]+)/)||[])[1];if(h)cur=h;

  function fmt(ms){try{return new Date(ms).toLocaleDateString(undefined,{month:'short',day:'numeric'})}catch(e){return''}}
  function albumOf(id){for(var i=0;i<albums.length;i++)if(albums[i].id===id)return albums[i];return null}

  function renderTabs(){
    var nav=$('albums');nav.textContent='';
    albums.forEach(function(a){var b=document.createElement('button');b.type='button';b.textContent=a.name;
      b.setAttribute('aria-current',a.id===cur?'true':'false');b.onclick=function(){go(a.id)};nav.appendChild(b);});
    if(ready){var n=document.createElement('button');n.type='button';n.className='add';n.textContent='+ New album';n.onclick=newAlbum;nav.appendChild(n);}
  }
  function tile(p){
    var f=document.createElement('figure');f.className='ptile';
    var b=document.createElement('button');b.type='button';b.dataset.doc=p.id;b.dataset.kind=p.kind;b.dataset.n=fmt(p.addedAt);
    b.setAttribute('aria-label','Open photo added '+fmt(p.addedAt));
    var im=document.createElement('img');im.loading='lazy';im.alt='Photo added '+fmt(p.addedAt);
    if(p.kind==='m'){im.dataset.e='alb/t/'+p.id+'.jpg';b.dataset.full='alb/'+p.id+'.jpg';}else{im.dataset.d=p.id;}
    if(p.w&&p.h){im.width=p.w>p.h?560:374;im.height=Math.round(im.width*p.h/p.w);}
    b.appendChild(im);f.appendChild(b);
    var c=document.createElement('figcaption');c.textContent='Added '+fmt(p.addedAt);f.appendChild(c);return f;
  }
  function renderPhotos(){
    var a=albumOf(cur)||albums[0];cur=a.id;
    var mine=photos.filter(function(p){return p.album===cur});
    var isB=cur==='branding';
    $('v-branding').hidden=!isB;$('v-other').hidden=isB;
    var grid=isB?$('phone-grid'):$('o-grid');grid.textContent='';
    mine.forEach(function(p){grid.appendChild(tile(p))});
    if(isB){$('phone-n').textContent=mine.length;$('phone-count').textContent=mine.length+' photos';$('phone-empty').hidden=mine.length>0;}
    else{$('o-brand').textContent=a.brand||'';$('o-brand').hidden=!a.brand;$('o-title').textContent=a.name;
      $('o-sub').textContent=mine.length?mine.length+' photos. Tap any photo to see it bigger.':'';$('o-empty').hidden=mine.length>0;}
    MK.scan(grid);
  }
  function go(id){cur=id;try{localStorage.setItem('album',id)}catch(e){}
    history.replaceState(null,'','#album='+id);renderTabs();renderPhotos();var pp=document.getElementById('p-photos');if(pp)pp.scrollIntoView();}

  function newAlbum(){
    var name=(prompt('Name for the new album (for example: Holiday Party 2026)')||'').trim();if(!name)return;
    MK.api('album',{name:name.slice(0,60)}).then(function(r){cur=r.id;MK.applyState(r)}).catch(function(){msg('Could not add that album. Try again.')});
  }
  function msg(t){$('upmsg').textContent=t}

  // Photo prep: normal keeps up to 2560px (plenty for Instagram); full size keeps the original when it can.
  var OK={'image/jpeg':1,'image/png':1,'image/webp':1};
  function load(file){return new Promise(function(res,rej){var u=URL.createObjectURL(file),im=new Image();
    im.onload=function(){res({im:im,u:u})};im.onerror=function(){URL.revokeObjectURL(u);rej(new Error('decode'))};im.src=u;})}
  function shrink(im,max,q){var w=im.naturalWidth,h=im.naturalHeight,k=Math.min(1,max/Math.max(w,h)),cw=Math.round(w*k),ch=Math.round(h*k);
    var c=document.createElement('canvas');c.width=cw;c.height=ch;c.getContext('2d').drawImage(im,0,0,cw,ch);
    return new Promise(function(res,rej){c.toBlob(function(b){b?res({blob:b,w:cw,h:ch}):rej(new Error('encode'))},'image/jpeg',q)});}
  function prep(file,full){
    return load(file).then(function(o){
      var w=o.im.naturalWidth,h=o.im.naturalHeight,keep=full&&OK[file.type]&&file.size<18*1048576;
      var main=keep?Promise.resolve({blob:file,w:w,h:h}):shrink(o.im,full?4096:2560,full?.92:.88);
      return Promise.all([main,shrink(o.im,480,.82)]).then(function(r){URL.revokeObjectURL(o.u);return{blob:r[0].blob,w:r[0].w,h:r[0].h,thumb:r[1].blob}});
    });
  }
  function b64(blob){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(String(r.result).split(',')[1])};r.onerror=rej;r.readAsDataURL(blob)})}
  function uploadAll(files){
    if(busy||!files.length)return;busy=true;
    var album=cur,full=$('fullsize').checked,done=0,fail=0,total=files.length,q=files.slice();
    var bar=$('prog');bar.hidden=false;
    function step(){bar.firstChild.style.width=Math.round(100*(done+fail)/total)+'%';msg('Adding photos: '+(done+fail)+' of '+total+(fail?' ('+fail+' did not work)':'')+'. Keep this page open.');}
    step();
    function worker(){var f=q.shift();if(!f)return Promise.resolve();
      return prep(f,full).then(function(p){return Promise.all([b64(p.blob),b64(p.thumb)]).then(function(d){
        return MK.api('addPhoto',{album:album,data:d[0],thumb:d[1],w:p.w,h:p.h,type:p.blob.type||'image/jpeg'});});})
      .then(function(){done++},function(e){fail++;console.warn(e)})
      .then(function(){step();return worker()});}
    Promise.all([worker(),worker()]).then(function(){busy=false;bar.hidden=true;
      msg(done+' photo'+(done===1?'':'s')+' added'+(fail?'. '+fail+' did not work. Try those again, or turn off Full size.':'.'));$('pick').value='';MK.refresh();});
  }

  // Lightbox works on whichever album is showing, always at full size.
  var lb=$('lb'),img=$('lb-img'),cap=$('lb-cap'),i=0,list=[];
  function show(k){i=(k+list.length)%list.length;var b=list[i],im=b.querySelector('img');img.removeAttribute('src');img.alt=im.alt;
    var path=b.dataset.full||((im.dataset.e||'').indexOf('shoot/')===0?im.dataset.e.replace('shoot/','full/'):'');
    var want=b;var got=function(u){if(list[i]===want){img.src=u;$('lb-open').href=u;}};
    if(path)MK.url(path).then(got);else if(b.dataset.kind==='d')MK.driveFull(b.dataset.doc).then(got);else if(im.src)got(im.src);
    cap.textContent=b.dataset.doc?'Added '+b.dataset.n:'Photo #'+b.dataset.n;$('lb-del').hidden=!(b.dataset.doc&&ready);}
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.ptile button');if(!b)return;
    var view=b.closest('.pview');list=[].slice.call(view.querySelectorAll('.ptile button'));show(list.indexOf(b));if(lb.showModal)lb.showModal();});
  $('lb-prev').onclick=function(){show(i-1)};$('lb-next').onclick=function(){show(i+1)};$('lb-close').onclick=function(){lb.close()};
  lb.addEventListener('click',function(e){if(e.target===lb)lb.close();});
  document.addEventListener('keydown',function(e){if(!lb.open)return;if(e.key==='ArrowRight')show(i+1);if(e.key==='ArrowLeft')show(i-1);});
  $('lb-del').onclick=function(){var b=list[i];if(!b||!confirm('Delete this photo from the album for everyone?'))return;
    MK.api('delPhoto',{id:b.dataset.doc}).then(function(s){lb.close();MK.applyState(s)}).catch(function(){alert('Could not delete it. Try again.')});};

  $('pick').addEventListener('change',function(){uploadAll([].slice.call(this.files||[]))});
  renderTabs();renderPhotos();

  MK.onState(function(s){
    var hide={};(s.hidden||[]).forEach(function(x){hide[x]=1});
    albums=BUILT.concat((s.albums||[]).map(function(a){return{id:a.id,name:String(a.name||'Album'),brand:''}}));
    photos=(s.photos||[]).map(function(p){return{id:p.id,album:p.album,w:p.w,h:p.h,addedAt:p.addedAt,kind:'d'}})
      .concat(MK.migrated.map(function(p){return{id:p.id,album:p.album,w:p.w,h:p.h,addedAt:p.addedAt,kind:'m'}}))
      .filter(function(p){return !hide[p.id]}).sort(function(a,b){return(b.addedAt||0)-(a.addedAt||0)});
    ready=true;$('upbar').hidden=false;renderTabs();renderPhotos();
  });
})();
