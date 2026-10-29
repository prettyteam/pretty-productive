/* Weekly Inventory report (Alexandra, Oct 29 2026): the same Paired Plus Retail Inventory Report as Pretty Life's
   Inventory page, for the Front Desk app and Rose's app. The data comes from the desk script (apps-script/Inventory.gs),
   which reads the newest report in Drive, so this page updates itself each week. Staff copy: counts only, no costs
   or sales dollars. Inventory.html(D) returns the page as HTML; D is the script's reply, or null while it loads. */
(function(){
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const css='<style>.ivr{display:grid;gap:14px;max-width:640px}.ivr h1{margin:0}.ivr .ivsub{margin:-8px 0 0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;color:var(--green,#2f5d46)}'
    +'.ivr p{margin:0;font-size:13.5px;color:var(--soft,#5f5b55)}.ivr details{border:1px solid var(--line,#e2ded5);border-radius:4px;background:var(--card,#fff);padding:0 14px}'
    +'.ivr summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;padding:14px 0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:600}.ivr summary::-webkit-details-marker{display:none}'
    +'.ivr summary .c{font-size:12px;letter-spacing:0;background:var(--bg,#f6f3ee);border-radius:10px;padding:2px 9px;font-weight:500}.ivr summary:after{content:"+";margin-left:auto;font-size:18px;font-weight:400}.ivr details[open] summary:after{content:"–"}'
    +'.ivr .in{display:grid;gap:0;padding:0 0 12px}.ivr .in>p{padding:0 0 10px}'
    +'.ivr .ir{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:9px 0;border-top:1px solid var(--line,#e2ded5);font-size:14px}.ivr .ir>span{min-width:0}.ivr .ir>.pl{flex-shrink:0}.ivr .ir small{display:block;color:var(--soft,#5f5b55);font-size:12.5px}'
    +'.ivr .pl{white-space:nowrap;font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;border-radius:12px;padding:4px 10px;background:#fbefdc;color:#8a5a12}.ivr .pl.b{background:#e9edf5;color:#3e4f6e}.ivr .pl.r{background:#f7e3e1;color:#8a2a22}'
    +'.ivr h3{margin:12px 0 2px;font-size:13px;font-weight:600}</style>';
  const n=x=>Number(x)||0, plural=(k,w)=>k+' '+w+(k===1?'':'s');
  const row=(name,detail,pill,kind)=>'<div class="ir"><span><b>'+esc(name)+'</b>'+(detail?'<small>'+esc(detail)+'</small>':'')+'</span>'+(pill?'<span class="pl'+(kind?' '+kind:'')+'">'+esc(pill)+'</span>':'')+'</div>';
  const sec=(title,count,body,open)=>'<details'+(open?' open':'')+'><summary>'+esc(title)+(count!=null?' <span class="c">'+count+'</span>':'')+'</summary><div class="in">'+body+'</div></details>';
  const left=(oh,w)=>oh<0?'Shows '+oh+', count the shelf first':oh+' on hand'+(w>0&&w<8?', about '+plural(Math.max(1,Math.round(w)),'week')+' left':'');
  function html(D,opts){
    opts=opts||{};
    const head='<h1>Inventory</h1>';
    if(!D) return css+'<div class="ivr">'+head+'<p>'+(opts.err?'Couldn’t open the report right now. Check the Wi-Fi and try again.':'Opening the report…')+'</p></div>';
    if(D.error) return css+'<div class="ivr">'+head+'<p>'+(D.error==='none'?'No inventory report yet. It shows here as soon as this week’s report is saved.':'Couldn’t read the report right now. Try again in a few minutes.')+'</p></div>';
    const G=D.glance||{}, date=String(D.asOf||'').replace(/,\s*\d{4}$/,'');
    let h=css+'<div class="ivr">'+head+'<p class="ivsub">'+n(G.reorder)+' To Reorder</p>'
      +'<p>From the Retail Inventory Report dated '+esc(date)+' (Paired Plus). Reorders are suggestions only; nothing is ordered automatically. A new report comes in every week.</p>';
    h+=sec('At a Glance',null,'<p>'+n(G.products)+' retail products and '+n(G.units)+' units on the shelf. '+n(G.out)+' items are out of stock and still selling, '+n(G.low)+' are low (under 4 weeks), and there are '+n(G.reorder)+' reorder suggestions. '
      +plural(n(G.negative),'item')+' show a negative count and '+plural(n(G.noCost),'product')+' are missing a cost in Paired Plus.</p>',true);
    if((D.notes||[]).length) h+=sec('Needs a Look',D.notes.length,D.notes.map(t=>{const m=/^([^:]{3,40}):\s*(.+)$/.exec(t);const urgent=/recall/i.test(t);
      return row(m?m[1].replace(/\b\w/g,c=>c.toUpperCase()).replace(/\B\w+/g,w=>w.toLowerCase()):'',m?m[2]:t,urgent?'Urgent':/count/i.test(t)?'Count':'Ask',urgent?'r':'b')}).join(''),true);
    h+=sec('Reorder List',(D.reorder||[]).length,'<p>Biggest first. Enough for about 8 weeks at the current pace.</p>'+(D.reorder||[]).slice().sort((a,b)=>b[6]-a[6]).map(r=>{
      const [br,it,oh,ytd,d30,w,q,note]=r, cnt=oh<0||/count/i.test(note||'');
      return row(it,br+' · '+left(oh,w)+', '+ytd+' sold this year'+(d30?', '+d30+' in the last 30 days':'')+'.',cnt?'Count, then '+q:'Order '+q,cnt?'b':'')}).join(''));
    h+=sec('Out or Low',(D.outLow||[]).length,(D.outLow||[]).map(([br,it,st,oh,ytd,w])=>row(it,br+' · '+(st==='Out'?'Out':left(oh,w))+', '+ytd+' sold this year.',st,st==='Out'?'r':'')).join(''));
    h+=sec('Counts to Fix',(D.negative||[]).length,'<p>These sold but were never received, so Paired Plus shows a negative count. Count the shelf, then fix it in Paired Plus (Inventory Adjustments).</p>'
      +(D.negative||[]).map(([br,it,oh])=>row(it,br,'Shows '+oh,'b')).join(''));
    const nc=D.noCost||[], by={};nc.forEach(r=>(by[r[0]]||=[]).push(r));
    h+=sec('Products Missing a Cost',nc.length,'<p>Their cost is blank in Paired Plus, so the inventory value reads low. Open each product in Paired Plus, type the cost from the vendor invoice or the vendor’s site, and save.'+(opts.desk?' They’re also on the To Do list so you can check them off.':'')+'</p>'
      +Object.keys(by).sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1).map(b=>'<h3>'+esc(b)+' ('+by[b].length+')</h3>'+by[b].map(([br,it,sku,oh,ytd])=>row(it,'SKU '+sku+' · '+oh+' on hand'+(ytd?' · '+ytd+' sold this year':''))).join('')).join(''));
    h+=sec('Best Sellers',(D.top||[]).length,'<p>By units sold this year.</p>'+(D.top||[]).map(([br,it,ytd,oh],i)=>row((i+1)+'. '+it,br+' · '+ytd+' sold · '+(oh>0?oh+' left':oh<0?'shows '+oh:'out'))).join(''));
    if((D.idle||[]).length) h+=sec('Not Selling',D.idle.length,'<p>The most stock with no sales this year. Good ones to suggest to guests or feature on the shelf.</p>'+D.idle.map(([br,it,oh])=>row(it,br+' · '+oh+' on the shelf, 0 sold this year')).join(''));
    return h+'</div>';
  }
  window.Inventory={html};
})();
