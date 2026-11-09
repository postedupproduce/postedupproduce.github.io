/* Posted Up: 45-second "how it works" tour (Nov 2).
   One shared file for every page. Any element with [data-tour] opens it; window.puTour() opens it from script.
   Music is an original loop synthesized live with Web Audio (no audio file, no license). It starts only after a tap,
   fades in quietly, and mute / pause / close stay on screen. Respects prefers-reduced-motion. */
(function(){
  if(window.puTour)return;
  const CSS=`
.tourBtn{display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;box-sizing:border-box;min-height:52px;border-radius:999px;border:2px solid var(--ink,#24392C);background:var(--ink,#24392C);color:var(--bg,#F8F2E6);font:700 17px/1.2 var(--body,"Figtree",system-ui,sans-serif);cursor:pointer;padding:12px 18px;margin-top:10px;text-decoration:none}
.tourBtn .pl{width:0;height:0;border-left:13px solid currentColor;border-top:8px solid transparent;border-bottom:8px solid transparent}
.tourBtn:focus-visible,.pu-tour button:focus-visible,.pu-tour a:focus-visible{outline:3px solid #D2452B;outline-offset:3px}
.pu-tour{position:fixed;inset:0;z-index:100000;background:#141a16;color:#f4ecd9;display:grid;grid-template-rows:auto 1fr auto;font-family:var(--body,"Figtree",system-ui,sans-serif);padding:max(12px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(14px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
.pu-tour[hidden]{display:none}
.pu-tour .bar{display:flex;gap:6px;max-width:640px;width:100%;justify-self:center}.pu-tour .bar i{flex:1;height:4px;border-radius:2px;background:rgba(244,236,217,.25);overflow:hidden}.pu-tour .bar i b{display:block;height:100%;width:0;background:#f0b94a}
.pu-tour .stage{position:relative;overflow:hidden;border-radius:18px;margin:12px 0;max-width:640px;width:100%;justify-self:center}
.pu-tour .pic{position:absolute;inset:0;background-size:cover;background-position:center;transform:scale(1.04);transition:transform 9s linear}
.pu-tour .pic.go{transform:scale(1.16)}
.pu-tour .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,26,22,.05) 30%,rgba(20,26,22,.92) 78%)}
.pu-tour .txt{position:absolute;left:0;right:0;bottom:0;padding:22px 20px 24px;display:grid;gap:8px}
.pu-tour .n{font:700 13px/1 var(--body,system-ui,sans-serif);letter-spacing:.14em;text-transform:uppercase;color:#f0b94a}
.pu-tour h3{font:400 clamp(28px,8vw,42px)/1.05 var(--display,"Alfa Slab One",Georgia,serif);margin:0;text-wrap:balance;color:#f4ecd9}
.pu-tour p{margin:0;font-size:18px;line-height:1.45;max-width:34em;color:#f4ecd9}
.pu-tour .txt>*{opacity:0;transform:translateY(10px);transition:opacity .5s,transform .5s}
.pu-tour .txt.in>*{opacity:1;transform:none}.pu-tour .txt.in>*:nth-child(2){transition-delay:.15s}.pu-tour .txt.in>*:nth-child(3){transition-delay:.3s}.pu-tour .txt.in>*:nth-child(4){transition-delay:.45s}
.pu-tour .end{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}
.pu-tour .end a{flex:1 1 180px;text-align:center;border-radius:999px;padding:13px 16px;font-weight:700;text-decoration:none;background:#f0b94a;color:#1f2a22}
.pu-tour .end a.alt{background:transparent;color:#f4ecd9;border:2px solid rgba(244,236,217,.6)}
.pu-tour .ctl{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;max-width:640px;width:100%;justify-self:center}
.pu-tour .ctl button{min-width:48px;min-height:48px;border-radius:999px;border:2px solid rgba(244,236,217,.5);background:transparent;color:#f4ecd9;font:700 15px/1 var(--body,system-ui,sans-serif);padding:0 16px;cursor:pointer}
.pu-tour .credit{font-size:12px;color:rgba(244,236,217,.6);text-align:center;width:100%}
/* Home page has its own fixed .bar (cart bar): reset it inside the tour so the photo stage keeps its height. */
.pu-tour>.bar{position:static;inset:auto;z-index:auto;background:none;color:inherit;padding:0;grid-row:1}.pu-tour>.stage{grid-row:2}.pu-tour>.ctl{grid-row:3}
/* Animated actions per step (Nov 2): drawn over the photo, above the text. */
.pu-tour .fx{position:absolute;left:0;right:0;top:0;height:56%;display:grid;place-items:center;pointer-events:none;padding:16px;box-sizing:border-box}
.pu-tour.paused .fx *{animation-play-state:paused!important}
.pu-tour .fx .card{background:rgba(20,26,22,.78);border:1px solid rgba(244,236,217,.25);border-radius:16px;padding:12px;display:grid;gap:8px;width:min(300px,86%);box-shadow:0 8px 24px rgba(0,0,0,.35);position:relative;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
.pu-tour .fx .opt{display:flex;justify-content:space-between;align-items:center;border:2px solid rgba(244,236,217,.35);border-radius:10px;padding:9px 12px;font:700 15px/1 var(--body,system-ui,sans-serif);color:#f4ecd9}
.pu-tour .fx .opt.tpick{animation:puPick 9s both}
.pu-tour .fx .opt .ck{opacity:0;color:#f0b94a}.pu-tour .fx .opt.tpick .ck{animation:puShow 9s both}
.pu-tour .fx .paid{justify-self:center;background:#f0b94a;color:#1f2a22;border-radius:999px;padding:8px 14px;font:700 14px/1 var(--body,system-ui,sans-serif);animation:puPop 9s both;--at:52%}
.pu-tour .fx .tap{position:absolute;font-size:34px;line-height:1;animation:puTap 9s both;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}
@keyframes puTap{0%,8%{opacity:0;transform:translate(60px,110px)}18%{opacity:1;transform:translate(170px,60px)}26%{transform:translate(170px,60px) scale(.85)}30%{transform:translate(170px,60px) scale(1)}40%{opacity:1;transform:translate(150px,150px)}46%{opacity:0;transform:translate(150px,160px)}100%{opacity:0}}
@keyframes puPick{0%,25%{border-color:rgba(244,236,217,.35);background:transparent}30%,100%{border-color:#f0b94a;background:rgba(240,185,74,.18)}}
@keyframes puShow{0%,26%{opacity:0}32%,100%{opacity:1}}
@keyframes puPop{0%,48%{opacity:0;transform:scale(.6)}54%{opacity:1;transform:scale(1.08)}58%,100%{opacity:1;transform:scale(1)}}
.pu-tour .fx .bag{position:relative;width:150px;height:150px;display:grid;place-items:end center}
.pu-tour .fx .bag .tote{font-size:92px;line-height:1;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45));animation:puBob 9s both}
.pu-tour .fx .bag .tf{position:absolute;top:-10px;font-size:38px;opacity:0;animation:puDrop 9s both;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))}
.pu-tour .fx .clock{position:absolute;top:0;left:50%;transform:translateX(-50%);background:rgba(20,26,22,.78);color:#f0b94a;border-radius:999px;padding:7px 14px;font:700 14px/1 var(--body,system-ui,sans-serif);white-space:nowrap}
@keyframes puBob{0%,100%{transform:none}20%,40%,60%,80%{transform:translateY(3px)}}
.pu-tour .fx .tchain{display:grid;grid-template-columns:auto 1fr auto 1fr auto;align-items:center;gap:6px;width:min(420px,94%);background:rgba(20,26,22,.78);border-radius:16px;padding:16px 12px;position:relative;box-sizing:border-box}
.pu-tour .fx .nd{display:grid;justify-items:center;gap:6px;font:700 13px/1.1 var(--body,system-ui,sans-serif);color:#f4ecd9;text-align:center;opacity:0;animation:puPop 9s both}
.pu-tour .fx .nd i{font-style:normal;font-size:36px;line-height:1}
.pu-tour .fx .ln{height:4px;border-radius:2px;background:rgba(244,236,217,.25);position:relative;overflow:hidden}
.pu-tour .fx .ln b{position:absolute;inset:0;background:#f0b94a;transform-origin:left;transform:scaleX(0);animation:puLine 9s both}
.pu-tour .fx .full{grid-column:1/-1;justify-self:center;margin-top:6px;background:#f0b94a;color:#1f2a22;border-radius:999px;padding:7px 12px;font:700 13px/1 var(--body,system-ui,sans-serif);opacity:0;animation:puPop 9s both}
.pu-tour .fx .route{width:min(340px,92%);background:rgba(20,26,22,.78);border-radius:16px;padding:12px 14px;display:grid;gap:8px;box-sizing:border-box}
.pu-tour .fx .tstop{display:flex;align-items:center;gap:10px;font:700 15px/1.1 var(--body,system-ui,sans-serif);color:#f4ecd9;opacity:0;animation:puSlide 9s both}
.pu-tour .fx .tstop i{font-style:normal;font-size:22px}.pu-tour .fx .tstop small{font-weight:400;color:rgba(244,236,217,.75);margin-left:auto;font-size:14px}
.pu-tour .fx .tstop.dl{border-top:1px solid rgba(244,236,217,.25);padding-top:8px}
.pu-tour .fx .wks{display:flex;gap:8px;background:rgba(20,26,22,.78);border-radius:16px;padding:14px}
.pu-tour .fx .wk{width:58px;height:66px;border-radius:12px;border:2px solid rgba(244,236,217,.35);display:grid;place-items:center;align-content:center;gap:4px;font:700 12px/1 var(--body,system-ui,sans-serif);color:#f4ecd9;animation:puWk 9s both}
.pu-tour .fx .wk b{font-size:22px;opacity:0;animation:puShow2 9s both}
.pu-tour .fx .wk.skip{animation:none;opacity:.55}.pu-tour .fx .wk.skip b{font-size:13px;font-weight:400}
@media (prefers-reduced-motion: reduce){.pu-tour .pic,.pu-tour .pic.go{transform:none;transition:none}.pu-tour .txt>*{transition:none}.pu-tour .fx *{animation:none!important;opacity:1!important;transform:none!important}.pu-tour .fx .tap{display:none}.pu-tour .fx .ln b{transform:scaleX(1)!important}}`;
  const st=document.createElement("style");st.textContent=CSS;document.head.append(st);

  const SC=[
    {img:"/img/haul-vegan.jpg",n:"Step 1",h:"Pick your box.",p:"Choose a Half Peck, Full Crate or Vegan Box, or build your own. Order and pay by 9 PM the night before."},
    {img:"/img/pumpkins.jpg",n:"Step 2",h:"We shop the morning market.",p:"Saturday morning we hand-pick what's peaking from small farms and makers within 150 miles of the Loop."},
    {img:"/img/carrots.jpg",n:"Why it's different",h:"Farm stand → your shopper → you.",p:"We pay the full stand price, so every dollar we spend on your food goes to the farm or maker who grew it."},
    {img:"/img/haul-byo.jpg",n:"Step 3",h:"Pick it up or get it delivered.",p:"Saturday pickup in Goose Island, Hyde Park or Rogers Park, or same-day delivery from $8. Bring a cooler bag if you have one."},
    {img:"/img/sweetpotato.jpg",n:"That's it",h:"Order the weeks you want.",p:"No subscription. No season commitment. Just the best of the market, picked for you.",end:true}
  ];
  /* Animated actions, one per step (index matches SC). Timings are % of the 9 s step via --a / --at. */
  const FX=[
    '<div class="card"><div class="opt">Half Peck<span class="ck">✓</span></div><div class="opt tpick">Full Crate<span class="ck">✓</span></div><div class="opt">Vegan Box<span class="ck">✓</span></div><div class="opt">Build your own<span class="ck">✓</span></div><span class="paid">✓ Paid · before 9 PM</span><span class="tap" aria-hidden="true">👆</span></div>',
    '<div class="bag"><span class="clock">☀ Saturday morning market</span>'+[["🥕",-44,8],["🍎",8,22],["🥬",-16,36],["🧅",30,50],["🎃",-2,64]].map(([e,x,a])=>'<span class="tf" style="left:calc(50% + '+x+'px - 19px);--a:'+a+'%;animation-name:puDrop'+a+'">'+e+'</span>').join("")+'<span class="tote">🛍️</span></div>',
    '<div class="tchain"><span class="nd" style="--at:6%;animation-name:puPop6"><i>🧑‍🌾</i>Farm stand</span><span class="ln"><b style="--a:18%;animation-name:puLine18"></b></span><span class="nd" style="animation-name:puPop30"><i>🛍️</i>Your shopper</span><span class="ln"><b style="animation-name:puLine42"></b></span><span class="nd" style="animation-name:puPop54"><i>🏠</i>You</span><span class="full" style="animation-name:puPop68">Farmer gets the full stand price</span></div>',
    '<div class="route">'+[["📍","Goose Island","12–1 PM",8],["📍","Hyde Park","2–3 PM",22],["📍","Rogers Park","4–5 PM",36],["🚚","Or delivered","from $8",52]].map(([i,a,b,t],k)=>'<span class="tstop'+(k===3?' dl':'')+'" style="animation-name:puSlide'+t+'"><i>'+i+'</i>'+a+'<small>'+b+'</small></span>').join("")+'</div>',
    '<div class="wks">'+[["Wk 1",10],["Wk 2",24],["Wk 3",0],["Wk 4",38]].map(([w,a])=>a?'<span class="wk" style="animation-name:puWk'+a+'">'+w+'<b style="animation-name:puShow2'+a+'">✓</b></span>':'<span class="wk skip">'+w+'<b>skip</b></span>').join("")+'</div>'
  ];
  /* CSS keyframes can't read var() inside selectors, so build one keyframe per start time used above. */
  (function(){const kf=[];const pc=n=>n+"%";
    for(const a of [8,22,36,50,64])kf.push("@keyframes puDrop"+a+"{0%,"+pc(a)+"{opacity:0;transform:translateY(-60px) rotate(-20deg)}"+pc(a+6)+"{opacity:1;transform:translateY(54px) rotate(8deg)}"+pc(a+9)+",100%{opacity:1;transform:translateY(46px) rotate(0)}}");
    for(const a of [6,30,54,68])kf.push("@keyframes puPop"+a+"{0%,"+pc(a)+"{opacity:0;transform:scale(.6)}"+pc(a+5)+"{opacity:1;transform:scale(1.08)}"+pc(a+8)+",100%{opacity:1;transform:scale(1)}}");
    for(const a of [18,42])kf.push("@keyframes puLine"+a+"{0%,"+pc(a)+"{transform:scaleX(0)}"+pc(a+10)+",100%{transform:scaleX(1)}}");
    for(const a of [8,22,36,52])kf.push("@keyframes puSlide"+a+"{0%,"+pc(a)+"{opacity:0;transform:translateX(-18px)}"+pc(a+5)+",100%{opacity:1;transform:none}}");
    for(const a of [10,24,38]){kf.push("@keyframes puWk"+a+"{0%,"+pc(a)+"{border-color:rgba(244,236,217,.35);background:transparent}"+pc(a+4)+",100%{border-color:#f0b94a;background:rgba(240,185,74,.18)}}");kf.push("@keyframes puShow2"+a+"{0%,"+pc(a)+"{opacity:0;transform:scale(.5)}"+pc(a+4)+",100%{opacity:1;transform:none}}")}
    const s=document.createElement("style");s.textContent=kf.join("\n");document.head.append(s)})();
  const DUR=9000;
  let T,bar,pic,txt,fx,bPrev,bNext,bPause,bMute,bClose,fills;
  let i=0,t0=0,left=DUR,timer=null,raf=null,paused=false,opener=null,built=false;

  function build(){
    if(built)return;built=true;
    T=document.createElement("div");T.className="pu-tour";T.id="puTour";T.hidden=true;
    T.setAttribute("role","dialog");T.setAttribute("aria-modal","true");T.setAttribute("aria-label","How Posted Up works, a 45-second tour");
    T.innerHTML='<div class="bar" aria-hidden="true"></div><div class="stage"><div class="pic"></div><div class="shade"></div><div class="fx" aria-hidden="true"></div><div class="txt" aria-live="polite"></div></div>'
      +'<div class="ctl"><button type="button" data-k="prev" aria-label="Previous step">&larr;</button><button type="button" data-k="pause">Pause</button><button type="button" data-k="next" aria-label="Next step">&rarr;</button><button type="button" data-k="mute" aria-pressed="false">Music on</button><button type="button" data-k="close">Close</button>'
      +'<p class="credit">Music: an original loop made for Posted Up, playing live in your browser.</p></div>';
    document.body.append(T);
    bar=T.querySelector(".bar");pic=T.querySelector(".pic");txt=T.querySelector(".txt");fx=T.querySelector(".fx");
    const q=k=>T.querySelector('[data-k="'+k+'"]');bPrev=q("prev");bNext=q("next");bPause=q("pause");bMute=q("mute");bClose=q("close");
    bar.innerHTML=SC.map(()=>"<i><b></b></i>").join("");fills=[...bar.querySelectorAll("b")];
    SC.forEach(x=>{const im=new Image();im.src=x.img});
    bPrev.addEventListener("click",()=>show(i-1));bNext.addEventListener("click",()=>show(i+1));
    bPause.addEventListener("click",()=>paused?play():pause());bMute.addEventListener("click",()=>setMute(!musicOn));bClose.addEventListener("click",close);
    T.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();close()}else if(e.key==="ArrowRight")show(i+1);else if(e.key==="ArrowLeft")show(i-1);else if(e.key==="Tab"){const f=[...T.querySelectorAll("button,a[href]")];const a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
    document.addEventListener("visibilitychange",()=>{if(document.hidden&&!T.hidden)pause()});
  }

  /* ---- music: an original, gentle loop (C · G · Am · F) built with Web Audio ---- */
  let ac=null,master=null,musicOn=true,loopT=null;
  const BPM=92,BEAT=60/BPM,CH=[[60,64,67,72],[55,59,62,67],[57,60,64,69],[53,57,60,65]];
  const hz=m=>440*Math.pow(2,(m-69)/12);
  function note(m,at,len,vol,type){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=hz(m);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(vol,at+0.02);g.gain.exponentialRampToValueAtTime(0.0008,at+len);o.connect(g);g.connect(master);o.start(at);o.stop(at+len+0.05)}
  function bar4(start,c){const ch=CH[c%4];note(ch[0]-24,start,BEAT*3.6,0.22,"sine");for(let b=0;b<8;b++){const m=ch[[0,1,2,3,2,1,2,3][b]]+(b%4===3?12:0);note(m,start+b*BEAT/2,BEAT*1.2,0.07,"triangle")}for(const m of ch.slice(1))note(m,start,BEAT*3.8,0.025,"sine");if(c%2===1)note(ch[3]+12,start+BEAT*2,BEAT*1.5,0.05,"sine")}
  function startMusic(){try{
    if(!ac){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ac=new AC();master=ac.createGain();master.gain.value=0;master.connect(ac.destination)}
    ac.resume();master.gain.cancelScheduledValues(ac.currentTime);master.gain.setValueAtTime(master.gain.value,ac.currentTime);master.gain.linearRampToValueAtTime(0.5,ac.currentTime+1.2);
    if(loopT)return;let next=ac.currentTime+0.1,c=0;const sched=()=>{while(next<ac.currentTime+1.5){bar4(next,c++);next+=BEAT*4}};sched();loopT=setInterval(sched,400);
  }catch(e){}}
  function stopMusic(fade){if(!ac)return;const now=ac.currentTime;master.gain.cancelScheduledValues(now);master.gain.setValueAtTime(master.gain.value,now);master.gain.linearRampToValueAtTime(0,now+(fade||0.6));clearInterval(loopT);loopT=null}
  function setMute(on){musicOn=on;bMute.textContent=on?"Music on":"Music off";bMute.setAttribute("aria-pressed",String(!on));if(on&&!paused&&!T.hidden)startMusic();else stopMusic(0.3)}

  function shopHref(){const tag=(new URLSearchParams(location.search).get("s")||"").replace(/[^a-z0-9-]/gi,"").slice(0,30).toLowerCase();return "/?s="+(tag||"tour")+"#shop"}
  function show(k){
    i=Math.max(0,Math.min(SC.length-1,k));const x=SC[i];
    pic.classList.remove("go");pic.style.backgroundImage="url('"+x.img+"')";void pic.offsetWidth;pic.classList.add("go");
    fx.innerHTML=FX[i]||"";
    txt.classList.remove("in");txt.textContent="";
    const n=document.createElement("span");n.className="n";n.textContent=x.n;
    const h=document.createElement("h3");h.textContent=x.h;const p=document.createElement("p");p.textContent=x.p;txt.append(n,h,p);
    if(x.end){const e=document.createElement("div");e.className="end";const a=document.createElement("a");a.href=shopHref();a.textContent="See this week’s boxes";
      a.addEventListener("click",ev=>{if(location.pathname==="/"||location.pathname==="/index.html"){ev.preventDefault();close();location.hash="#shop"}});
      const r=document.createElement("a");r.className="alt";r.href="#";r.textContent="Watch again";r.addEventListener("click",ev=>{ev.preventDefault();show(0);play()});e.append(a,r);txt.append(e)}
    requestAnimationFrame(()=>txt.classList.add("in"));
    fills.forEach((f,j)=>f.style.width=j<i?"100%":"0");left=DUR;if(!paused)run();
  }
  function tick(){const el=Date.now()-t0,frac=Math.min(1,(DUR-left+el)/DUR);fills[i].style.width=(frac*100)+"%";if(!paused)raf=requestAnimationFrame(tick)}
  function run(){clearTimeout(timer);cancelAnimationFrame(raf);t0=Date.now();if(SC[i].end){fills[i].style.width="100%";setTimeout(()=>{if(i===SC.length-1&&!paused)stopMusic(4)},6000);return}timer=setTimeout(()=>show(i+1),left);raf=requestAnimationFrame(tick)}
  function pause(){if(paused)return;paused=true;T.classList.add("paused");clearTimeout(timer);cancelAnimationFrame(raf);left=Math.max(0,left-(Date.now()-t0));bPause.textContent="Play";stopMusic(0.3)}
  function play(){paused=false;T.classList.remove("paused");bPause.textContent="Pause";if(musicOn)startMusic();run()}
  function open(from){build();opener=from||document.activeElement;T.hidden=false;document.documentElement.style.overflow="hidden";paused=false;T.classList.remove("paused");bPause.textContent="Pause";show(0);if(musicOn)startMusic();bClose.focus()}
  function close(){pause();T.hidden=true;document.documentElement.style.overflow="";stopMusic(0.2);if(opener&&opener.isConnected&&opener.focus)opener.focus()}
  window.puTour=open;
  /* Shareable link: any page with ?tour=1 opens the tour on load (music waits for a tap: browsers block sound before one). */
  if(new URLSearchParams(location.search).has("tour")){const go=()=>{musicOn=false;open();bMute.textContent="Music off";bMute.setAttribute("aria-pressed","true")};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go()}
  /* Any [data-tour] element, now or added later (splashes are built by script). */
  document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-tour]");if(!b)return;e.preventDefault();open(b)},true);
})();
