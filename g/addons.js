/* Quick Add-Ons tab (Alexandra, Nov 16 2026): small services an artist can offer in the chair, grouped by kind.
   Tap a group to open it. Prices match the Prices tab (g/prices.js, our website menu); keep both in sync.
   A price of '' means it is not on our menu yet and shows "Price Coming Soon". Never list massage (house rule).
   Uses the host page's h() and render(). */
const AO_MENU=[
  ['Brows',[
    ['Brow Sculpt','$25','Clean up her shape while her color processes.'],
    ['Brow Tint','$25','Fuller, darker brows that last weeks.'],
    ['Brow Lamination','$85','Brushed-up, fluffy brows. Comes with her take-home kit.'],
    ['Lip or Chin Wax','$15','A quick finish after her brows.']]],
  ['Skin',[
    ['Express Targeted Treatment','$99','30–35 min. One skin need, fixed fast.'],
    ['Taffeta HydroDiamond Express','$99','30 min. Clean, bright, glowing skin.'],
    ['Dermaplaning Add-On','$40','Smooth skin and makeup that goes on better.'],
    ['LED Light Therapy','$50','Calms redness and helps breakouts.'],
    ['Cold Seaweed Masque','$50','Cools and calms. Great before an event.'],
    ['High Frequency','$25','Helps clear and calm breakouts.']]],
  ['Hair',[
    ['Color Lock','$20','Seals in her color so it lasts longer.'],
    ['K18 Bond Protection','$45','Protects and repairs hair during color.'],
    ['Oribe Mirror Glass Shine','$35','Glassy shine after any color or cut.'],
    ['Scalp Treatment','','Soothes and cleans the scalp at the shampoo bowl.'],
    ['Gloss','$45+','Refreshes tone and adds shine between colors.'],
    ['Face Frame Highlight','$100+','Brightens the pieces around her face.']]],
  ['Nails',[
    ['Express Manicure','$15 / $25','Polish or gel. Shape and color, done fast.'],
    ['Express Pedicure','$35 / $45+','Polish or gel. Pretty toes in a hurry.'],
    ['Taffeta Signature Manicure','$35','The full manicure, with polish.'],
    ['Taffeta Signature Pedicure','$60','The full pedicure, with polish.'],
    ['French Tip','$10','Add to any manicure or pedicure.']]],
  ['Lashes & Makeup',[
    ['Individual False Lashes','$25','A little extra for a night out.'],
    ['Just Eyes','$70','Shadow and strip lash, for an event.']]]
];
let AO_Q='';
function addonsView(){
  const q=AO_Q.trim().toLowerCase(), hit=t=>!q||t.toLowerCase().includes(q);
  const s=h('input',{type:'search',id:'aoq',value:AO_Q,placeholder:'Search an add-on',autocomplete:'off'});
  s.addEventListener('input',()=>{AO_Q=s.value;const pos=s.selectionStart;render();const n=document.getElementById('aoq');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}});
  const row=([n,p,why])=>h('div',{class:'rxl'},
    h('div',{class:'rxn'},h('b',{},n),why?h('small',{class:'soft'},why):null),
    h('b',{class:'num',style:'font-weight:500;white-space:nowrap'+(p?'':';font-size:12.5px;color:var(--gold)')},p||'Price Coming Soon'));
  const groups=AO_MENU.map(([g,items])=>{
    const shown=items.filter(([n,,w])=>hit(n)||hit(g)||hit(w||''));if(!shown.length)return null;
    const d=h('details',{class:'invg'},
      h('summary',{},h('h2',{style:'font-size:19px'},g),h('span',{class:'soft invc'},String(shown.length)),h('span',{class:'tplus','aria-hidden':'true'},'+')),
      h('div',{class:'sec2'},...shown.map(row)));
    if(q)d.open=true;return d});
  const body=groups.some(Boolean)?groups:[h('p',{class:'soft',style:'text-align:center'},'Nothing matches “'+AO_Q+'”.')];
  return [h('div',{class:'hub'},
    h('div',{},h('span',{class:'lbl'},'Salon & spa'),h('h1',{style:'font-size:28px;text-wrap:balance'},'Quick Add-Ons'),
      h('p',{class:'soft',style:'margin-top:6px'},'Small extras that fit into her visit. Tap a group to see what you can offer.')),
    h('label',{class:'fld'},s),...body,
    h('small',{class:'soft',style:'text-align:center'},'Prices match our menu. “+” means starting at. Ring up add-ons at the front desk.'))];
}
