/* Daily jokes for the homepages (Alexandra, Oct 17 2026): the bridal app gets wedding, bride, hair and makeup jokes;
   The Pretty Report gets jokes about running a business; the front desk gets customer service jokes. One a day, the same for everyone that day.
   Oct 18: the morning run now writes a fresh joke for each app into d/jokes.json, the same way it writes the Employee Experience
   App's giggle. On its date that one shows; otherwise (Sundays, or before the run) the day's pick from these lists.
   Every line is a real setup and punchline (or a short one-liner) with a pun that works both ways. */
window.TJOKES={
service:[
"Why did the front desk phone need a spa day? Too many hang-ups.",
"What’s the front desk’s favorite tea? Hospitali-tea.",
"Why did the coffee file a complaint at the front desk? It was getting mugged every morning.",
"What did the receipt say to the guest? “Thanks for checking me out!”",
"Why are receptionists great on first dates? They’re experts at first impressions.",
"What did one phone line say to the other? “Please hold. You mean a lot to me.”",
"Why do front desk pros never feel lonely? They’re always booked.",
"What do you call a front desk with no coffee? A help desk.",
"Why did the front desk bring a broom to work? To sweep every guest off her feet.",
"How does the front desk stay so cool on busy Saturdays? It’s surrounded by fans.",
"Why did the cordless phone get a promotion? It really knew how to work the room.",
"What did the receptionist say to the ringing phone at 9:59? “Hold that thought.”",
"Why did the sticky note get hired at the front desk? It sticks with every guest until the job is done.",
"Why did the hold music get a standing ovation? Nobody had to hear it. The desk picked up on the first ring.",
"Why did the waitlist stay so positive? It knew something would open up.",
"What did the front desk say to the double booking? “Not on my watch.”",
"Why did the appointment book go to yoga? To work on its flexibility for last-minute guests.",
"Why are front desk pros great at tennis? They always return the call.",
"Why did the stapler love working the front desk? It’s great at keeping things together.",
"How many front desk pros does it take to change a lightbulb? One. She also rebooked the electrician and sold him a shampoo.",
"What’s the front desk’s favorite exercise? Phone lifts, about 200 reps a day."
],
bridal:[
"Why did the bobby pin get invited to the wedding? It always holds things together.",
"What did the lash glue whisper at the altar? “I’ll stick with you, through thick and thin.”",
"Why did the mascara RSVP “waterproof only”? It knew there would be happy tears.",
"What’s a makeup artist’s favorite wedding vow? “I promise to blend, in good lighting and in bad.”",
"What’s a makeup artist’s favorite part of the ceremony? The kiss. It’s the ultimate lipstick test.",
"Why did the veil feel so special? It’s the only one allowed to cover for the bride.",
"Why did the setting spray get asked to be maid of honor? It stood by the bride all day long.",
"Why did the bridesmaid pack extra bobby pins? You can never have too many plus-ones.",
"Why do the champagne and the makeup artist get along so well? They both make everyone glow.",
"Why did the lipstick show up to the wedding early? It wanted to make a lasting impression.",
"What did the bride say when she saw her updo? “That’s pin-credible.”",
"Why did the bride hire a makeup artist and a photographer? One makes the magic. The other proves it.",
"Something old, something new, something borrowed, and about 200 bobby pins.",
"Why did the curling iron love the wedding morning? It was the perfect day to make waves.",
"Why are bridal hair artists so good at keeping secrets? They keep everything pinned down.",
"What’s every bride’s favorite weather forecast? Zero percent humidity.",
"Why did the bride’s hair get a toast at the reception? It held up better than the best man’s speech.",
"What did the bride say to her touch-up kit? “You complete me.”",
"What did the hairspray say to the updo at midnight? “I told you I’d be there till the last dance.”",
"How do you calm a nervous bride? Tell her the mascara is waterproof and the champagne is cold.",
"What do you call a bride with perfect brows? Arch-itecturally sound.",
"Why did the bridal party love their artists? They brought the glam and the calm."
],
business:[
"Why are salon owners great at business? They know how to cut costs and add volume.",
"Cash flow is like hairspray: you only notice it when it runs out.",
"Why did the budget book a facial? It needed to be balanced.",
"Why did the salon owner bring a mirror to the quarterly meeting? To reflect on the numbers.",
"What’s a business owner’s favorite workout? Running the numbers.",
"Why did the spreadsheet look so good? Great cells.",
"How does a salon owner stay young? Lots of moisturizer and a very good bookkeeper.",
"Why did the payroll report feel so loved? It’s the one email everybody opens.",
"What did the owner say when retail doubled? “Now that’s a healthy glow.”",
"Why did the owner smile at the rebooking report? Nothing says “I love you” like a guest booked six weeks out.",
"Profit is like a good blowout: it takes planning, the right tools and a little heat.",
"What do you call a salon owner on vacation? Still answering emails, just with a better view.",
"Why are good managers like good shears? They’re sharp and they keep everything in line.",
"Why did the salon owner sleep so well? She balanced her books and her pH.",
"Why did the price list start going to the gym? It was time to raise its rates.",
"Why was the invoice so popular? Everyone was waiting to hear from it.",
"Why did the retail shelf get a raise? It finally started pulling its own weight.",
"Owning a salon means your boss is great, but she never lets you leave early.",
"Why did the cash register love Saturdays? So many guests stopped by to check out.",
"Why did the marketing post get so many likes? It had great highlights.",
"What do business owners and colorists have in common? They both know a good formula is worth writing down."
]};
window.dayJoke=function(kind){const F=window.TJOKES_TODAY;if(F&&F[kind])return F[kind];
  const L=(window.TJOKES||{})[kind]||[];if(!L.length)return '';
  const d=new Date(),n=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(2026,0,1))/864e5);
  return L[((n%L.length)+L.length)%L.length]};
(function(){const s=document.currentScript;if(!s||!window.fetch)return;
  const d=new Date(),ymd=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  fetch(new URL('../d/jokes.json?t='+Date.now(),s.src),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{
    if(!j||j.date!==ymd)return;window.TJOKES_TODAY=j;
    document.querySelectorAll('[data-joke]').forEach(el=>{const t=j[el.dataset.joke];if(t)el.textContent=t})}).catch(()=>{})})();
