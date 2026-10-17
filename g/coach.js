/* Call Coach (Alexandra, Oct 17 2026): grades and tips from Granola for the sales line (bridal app)
   and the front desk line (front desk app). CallCoach.render(box, data, opts) draws the page from
   {calls, focus}; opts.people lists the names that always get a filter, opts.load refreshes. */
(function(){
  const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const PTS={"A+":4.3,"A":4,"A-":3.7,"B+":3.3,"B":3,"B-":2.7,"C+":2.3,"C":2,"C-":1.7,"D":1,"F":0};
  const toGrade=v=>{let best="F",d=9;Object.entries(PTS).forEach(([g,p])=>{const x=Math.abs(p-v);if(x<d){d=x;best=g}});return best};
  const day=iso=>{const t=new Date(iso);return isNaN(t)?"":t.toLocaleDateString("en-US",{month:"short",day:"numeric"})};
  const BOOKED=/booked|scheduled|deposit|confirmed/i;
  let who="Everyone",open={};
  function render(box,data,opts){
    opts=opts||{};data=data||{};
    const all=(data.calls||[]).slice();
    const people=["Everyone"].concat((opts.people||[]).concat(all.map(c=>c.person)).filter((p,i,a)=>p&&a.indexOf(p)===i));
    if(people.indexOf(who)<0)who="Everyone";
    const calls=all.filter(c=>who==="Everyone"||c.person===who);
    const month=calls.filter(c=>Date.now()-new Date(c.at)<30*864e5);
    const graded=month.filter(c=>PTS[c.grade]!=null);
    const avg=graded.length?toGrade(graded.reduce((s,c)=>s+PTS[c.grade],0)/graded.length):"\u2013";
    const real=month.filter(c=>c.kind!=="voicemail");
    const won=real.length?Math.round(100*real.filter(c=>BOOKED.test(c.outcome)).length/real.length)+"%":"\u2013";
    let h='<div class="cc"><h1 class="cc-h">Call Coach</h1><p class="cc-sub">'+esc(opts.sub||"Graded from Granola after every call")+'</p>';
    if(people.length>2)h+='<div class="cc-seg" role="tablist">'+people.map(p=>'<button type="button" role="tab" aria-selected="'+(p===who)+'" data-who="'+esc(p)+'">'+esc(p)+'</button>').join("")+'</div>';
    h+='<div class="cc-stats"><div><b>'+esc(avg)+'</b><small>Avg grade</small></div><div><b>'+month.length+'</b><small>Calls \u00b7 30 days</small></div><div><b>'+esc(won)+'</b><small>'+esc(opts.wonLabel||"Booked")+'</small></div></div>';
    const f=data.focus;
    if(f&&f.title)h+='<div class="cc-lbl">Work on this week</div><div class="cc-card"><b class="cc-ft">'+esc(f.title)+'</b>'+(f.why?' '+esc(f.why):'')+(f.try?'<div class="cc-tip"><span class="try">\u201c'+esc(String(f.try).replace(/^[\u201c"]|[\u201d"]$/g,""))+'\u201d</span></div>':'')+'</div>';
    h+='<div class="cc-lbl">Recent calls</div>';
    if(!calls.length){
      h+='<div class="cc-card cc-empty">'+(all.length?'No calls for '+esc(who)+' yet.':esc(opts.empty||"No graded calls yet. Record your calls in Granola and save them to the right folder; they show up here the next morning."))+'</div>';
    }
    calls.slice(0,40).forEach(c=>{
      const id=c.id,isOpen=!!open[id],vm=c.kind==="voicemail";
      h+='<div class="cc-card"><div class="cc-row"><div><div class="cc-nm">'+(vm?'Voicemail \u00b7 ':'')+esc(c.guest||"Caller")+'</div>'
        +'<div class="cc-meta">'+[day(c.at),c.person,c.minutes?(vm?c.minutes+' min':c.minutes+' min'):""].filter(Boolean).map(esc).join(" \u00b7 ")+'</div>'
        +(c.outcome?'<span class="cc-tag'+(BOOKED.test(c.outcome)?' ok':'')+'">'+esc(c.outcome)+'</span>':'')+'</div>'
        +(c.grade?'<div class="cc-gr">'+esc(c.grade)+'</div>':'')+'</div>';
      if(isOpen&&c.scores&&c.scores.length)h+='<div class="cc-bars">'+c.scores.map(s=>'<span>'+esc(s[0])+'</span><span>'+Number(s[1])+'/10</span><div class="cc-bar"><i style="width:'+Math.max(0,Math.min(100,Number(s[1])*10))+'%"></i></div>').join("")+'</div>';
      if(isOpen&&c.summary)h+='<p class="cc-sum">'+esc(c.summary)+'</p>';
      if(c.strength)h+='<div class="cc-tip">'+(isOpen?'<span class="cc-k">Great</span> ':'')+esc(c.strength)+'</div>';
      (isOpen?c.tips:(c.tips||[]).slice(0,1)).forEach(t=>{h+='<div class="cc-tip">'+(t.was?'<span class="was">'+esc(t.was)+'</span>':'')+'<span class="try">\u201c'+esc(String(t.try).replace(/^[\u201c"]|[\u201d"]$/g,""))+'\u201d</span></div>'});
      const more=(c.scores&&c.scores.length)||(c.tips||[]).length>1||c.summary;
      if(more)h+='<button type="button" class="cc-more" data-open="'+esc(id)+'">'+(isOpen?'Show less \u2212':'See all scores +')+'</button>';
      h+='</div>';
    });
    h+='</div>';
    box.innerHTML=h;
    box.querySelectorAll("[data-who]").forEach(b=>b.onclick=()=>{who=b.dataset.who;render(box,data,opts)});
    box.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{open[b.dataset.open]=!open[b.dataset.open];render(box,data,opts)});
  }
  window.CallCoach={render};
})();
