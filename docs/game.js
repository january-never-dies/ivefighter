'use strict';
const $=id=>document.getElementById(id);
const roster=[
{name:'장원영',roman:'WONYOUNG',style:'밸런스',color:'#ff75b5',skin:'#edc4b0',hair:'#302129',look:'pony',speed:3.8,power:1,reach:1,build:1,detail:'핑크 브릿지 · 낮게 묶은 생머리'},
{name:'레이',roman:'REI',style:'파워',color:'#f4d755',skin:'#edc7ad',hair:'#613c2e',look:'bob',speed:2.8,power:1.28,reach:1.08,build:.96,detail:'옐로 포인트 · 브라운 단발'},
{name:'가을',roman:'GAEUL',style:'스피드',color:'#75ded4',skin:'#e6c3b2',hair:'#191d2b',look:'hood',speed:4.7,power:.84,reach:.94,build:.92,detail:'민트 브레이드 · 후드'},
{name:'안유진',roman:'YUJIN',style:'아웃복서',color:'#ac88ff',skin:'#edc1aa',hair:'#1e192e',look:'long',speed:4.1,power:.92,reach:1.18,build:1.02,detail:'퍼플 스트릭 · 긴 생머리'},
{name:'리즈',roman:'LIZ',style:'브루저',color:'#4ccaff',skin:'#f0cbb9',hair:'#55382f',look:'ribbon',speed:3.2,power:1.15,reach:1.02,build:1,detail:'갈색 앞머리 · 하늘색 히메컷'},
{name:'이서',roman:'LEESEO',style:'테크니션',color:'#ff654b',skin:'#eec3ad',hair:'#382329',look:'braids',speed:4.2,power:.95,reach:1.08,build:.96,detail:'레드 트윈 브레이드'}
];
roster.forEach((fighter,i)=>Object.assign(fighter,kits[i]));
const moves={
lp:{duration:.26,active:.08,range:1.55,damage:5,stun:.13,type:'punch'},
mp:{duration:.43,active:.16,range:1.8,damage:9,stun:.21,type:'punch'},
hp:{duration:.72,active:.3,range:1.95,damage:16,stun:.34,type:'punch'},
lk:{duration:.32,active:.1,range:1.75,damage:6,stun:.15,type:'kick'},
mk:{duration:.52,active:.2,range:2.15,damage:11,stun:.24,type:'kick'},
hk:{duration:.82,active:.35,range:2.4,damage:18,stun:.38,type:'kick'}
};
const canvas=$('arena'),ctx=canvas.getContext('2d');
let chosen=[0,1],pick=0,phase='select',fighters=[],wins=[0,0],round=1,time=60,phaseTime=0,last=0,elapsed=0,particles=[],shake=0,sound=false,audio=null,aiClock=0,aiInput=emptyCombatInput(),previousPhase='fight',projectiles=[],hitstop=0;
const localInput = createLocalInput();
const inputSources = [localInput.read, cpu];
function makeFighter(i){return {meter:0,specialCooldown:0,def:roster[chosen[i]],x:i?2.7:-2.7,y:0,vy:0,hp:100,face:i?-1:1,move:null,moveTime:0,hit:false,stun:0,guard:false,crouch:false,attackHeight:'mid',walk:0,combo:0,comboAge:0};}
function syncNames(){for(let i=0;i<2;i++)$('name'+(i+1)).textContent=roster[chosen[i]].name;}
function setup(){fighters=[makeFighter(0),makeFighter(1)];time=60;particles=[];projectiles=[];hitstop=0;aiClock=0;aiInput=emptyCombatInput();$('status').textContent='SINGLE PLAYER · VS CPU';syncNames();hud();}
function show(k,t,p,b){$('overlay').style.display='block';$('overlayKicker').textContent=k;$('overlayTitle').textContent=t;$('overlayText').textContent=p;$('start').style.display=b?'inline-block':'none';if(b)$('start').innerHTML=b+' <span>↗</span>';}
function start(){if(!pixelArt.ready)return;if(phase==='pause'){phase=previousPhase;$('overlay').style.display='none';return;}wins=[0,0];round=1;newRound();}
function newRound(){setup();phase='countdown';phaseTime=2.1;show('GET READY','ROUND '+String(round).padStart(2,'0'),'2라운드를 먼저 가져가세요',null);localInput.reset();}
function selectScreen(){pick=0;screen('selection');renderCards();phase='select';wins=[0,0];round=1;setup();show('READY WHEN YOU ARE','ENTER THE ARENA','파이터 선택 후 대전을 시작하세요','대전 시작');}
function pause(){if(phase==='fight'||phase==='countdown'){previousPhase=phase;phase='pause';localInput.reset();show('TAKE A BREATH','PAUSED','준비되면 다시 시작하세요','계속하기');}else if(phase==='pause'){phase=previousPhase;$('overlay').style.display='none';}}
function beep(freq,duration=.08){if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();let o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(35,audio.currentTime+duration);g.gain.setValueAtTime(Math.max(.001,.12*sampleGain/.58),audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
function screen(id){
 document.body.dataset.screen=id;
 for(const name of ['welcome','selection','play','arcade'])$(name).hidden=name!==id;
 window.scrollTo(0,0);
}
let displayed=-1;
function browse(step){chosen[pick]=(chosen[pick]+step+roster.length)%roster.length;renderCards(Math.sign(step));}
$('prev').onclick=()=>browse(-1);$('next').onclick=()=>browse(1);
addEventListener('keydown',e=>{if(document.body.dataset.screen!=='selection'||e.target.tagName==='SELECT')return;
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();browse(e.key==='ArrowLeft'?-1:1);}});
let swipe=null;
$('poster').onpointerdown=e=>{if(e.target.closest('button'))return;swipe=[e.clientX,e.clientY,e.pointerId];$('poster').setPointerCapture(e.pointerId);};
$('poster').onpointercancel=()=>{swipe=null;};
$('poster').onpointerup=e=>{if(!swipe||e.pointerId!==swipe[2])return;const dx=e.clientX-swipe[0],dy=e.clientY-swipe[1];swipe=null;if(Math.abs(dx)>30&&Math.abs(dx)>Math.abs(dy))browse(dx<0?1:-1);};
function renderCards(direction=0){
 const i=chosen[pick], fighter=roster[i], list=$('roster');
 if(i!==displayed){
  const img=new Image();img.src='assets/pose-'+i+'.png?v=fringe3';img.alt=fighter.name+'의 선택 포즈';img.draggable=false;img.dataset.id=i;
  const dir=direction||Math.sign(i-displayed), old=$('slide').lastElementChild;
  const animate=old&&document.body.dataset.screen==='selection'&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
  $('slide').replaceChildren(img);
  if(animate){$('slide').prepend(old);old.alt='';old.animate([{transform:'translateX(0)',opacity:1},{transform:'translateX('+(-dir*55)+'%)',opacity:0}],190).onfinish=()=>old.remove();
   img.animate([{transform:'translateX('+(dir*55)+'%)',opacity:0},{transform:'translateX(0)',opacity:1}],240);}
  displayed=i;
 }
 $('selection').style.setProperty('--accent',fighter.color);
 selectionStage(i, fighter.color);$('roman').textContent=String(i+1).padStart(2,'0')+' / 06　'+fighter.roman;
 $('fighterName').textContent=fighter.name;$('styleName').textContent=fighter.style;
 $('stats').replaceChildren(...[['이동 속도',fighter.speed,5.1],['공격 배율',fighter.power,1.24],['기본 리치 배율',fighter.reach,1.05]].map(([label,value,max])=>{
  const row=document.createElement('div'),name=document.createElement('span'),num=document.createElement('strong'),bar=document.createElement('i');
  name.textContent=label;num.textContent=value.toFixed(2);bar.style.setProperty('--fill',value/max*100+'%');row.append(name,num,bar);return row;}));
 $('kitGuide').textContent='Q　'+fighter.q+'\nR　'+fighter.r;
 $('tip').textContent=fighter.tip;
 $('matchup').textContent='P1　'+roster[chosen[0]].name+'　 VS　 '+roster[chosen[1]].name+'　CPU';
 list.replaceChildren();
 for(const [n,r] of roster.entries()){
  const button=document.createElement('button');
  button.textContent=r.name;button.style.setProperty('--member',r.color);
  button.setAttribute('aria-pressed',String(i===n));
  button.onclick=()=>{chosen[pick]=n;renderCards();list.children[n].focus();};
  list.append(button);
 }
 for(const side of [0,1])$('pick'+(side+1)).setAttribute('aria-pressed',String(side===pick));
}
const slashSound = new Audio('assets/dragon-studio-sword-slice-393847.mp3');
slashSound.preload = 'auto';
slashSound.volume = .58;
const cutCanvas = $('title-cut');
const cutContext = cutCanvas.getContext('2d');
const titleImage = $('game-title').querySelector('img');

const bladeDuration = .21;
const slideDuration = 1.05;
const cutDuration = bladeDuration + slideDuration + .16;

function drawTitleCut(time) {
 // Use the logo's design coordinates for motion, physical pixels for rendering.
 const w = 730, h = 226, c = cutContext;
 const box = titleImage.getBoundingClientRect();
 const width = Math.max(1, Math.round(box.width * window.devicePixelRatio));
 const height = Math.max(1, Math.round(box.height * window.devicePixelRatio));
 if (cutCanvas.width !== width) cutCanvas.width = width;
 if (cutCanvas.height !== height) cutCanvas.height = height;
 c.setTransform(width / w, 0, 0, height / h, 0, 0);
 const travel = Math.min(1, time / bladeDuration);
 const tip = w * travel;
 const slide = 1 - (1 - Math.min(1, Math.max(0, (time - bladeDuration) / slideDuration))) ** 3;
 const cutY = x => h * (.92 - .82 * x / w);
 c.clearRect(0, 0, w, h);
 c.imageSmoothingEnabled = false;
 // Ahead of the blade the wordmark is still one piece.
 if (tip < w) c.drawImage(titleImage, travel * titleImage.naturalWidth, 0,
  (1-travel)*titleImage.naturalWidth, titleImage.naturalHeight, tip, 0, w-tip, h);
 function piece(upper) {
  c.save();
  if (upper) c.translate(-8 * slide, 2.5 * slide);
  const edge = upper ? -1.1 : 1.1;
  const outside = upper ? 0 : h;
  c.beginPath(); c.moveTo(0,outside); c.lineTo(tip,outside);
  c.lineTo(tip,cutY(tip)+edge); c.lineTo(0,cutY(0)+edge); c.closePath();
  c.clip(); c.drawImage(titleImage,0,0,w,h); c.restore();
 }
 piece(false); piece(true);
 const bladeEndX = w - 11;
 if (travel > 0 && travel < 1) {
  const bladeX = travel * bladeEndX;
  const tail = Math.max(0, bladeX - w*.48);
  const shine = c.createLinearGradient(tail,0,bladeX,0);
  shine.addColorStop(0,'transparent'); shine.addColorStop(.65,'#a2dcff'); shine.addColorStop(1,'#fff');
  c.shadowColor='#8bdcff'; c.shadowBlur=6; c.fillStyle=shine; c.beginPath(); c.moveTo(tail,cutY(tail));
  c.lineTo(bladeX-3,cutY(bladeX)-3.6); c.lineTo(bladeX,cutY(bladeX)); c.lineTo(bladeX-5,cutY(bladeX)+3);
  c.closePath(); c.fill(); c.shadowBlur=0;
 }
}
let entering = false;
let cutFrame = 0;

function animateCut(onFinish) {
 cancelAnimationFrame(cutFrame);
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
 $('game-title').classList.add('striking');
 let elapsed = 0, previous;
 function frame(now) {
  if (document.body.dataset.screen !== 'welcome') return;
  if (previous !== undefined) {
   // Keep the blade visible even when a slow frame delays the first paint.
   elapsed += Math.min((now-previous)/1000, .05);
  }
  previous = now;
  drawTitleCut(reduced ? cutDuration : elapsed);
  if (elapsed < (reduced ? .32 : cutDuration)) cutFrame = requestAnimationFrame(frame);
  else onFinish?.();
 }
 cutFrame = requestAnimationFrame(frame);
}

function enterMode(mode) {
 if (entering) return;
 entering = true;
 if (slashSound.readyState >= 1) slashSound.currentTime = .055;
 slashSound.play().catch(() => {}); // iOS requires playback to begin inside the tap handler.
 function finish() {
  $('game-title').classList.remove('striking');
  entering = false;
  openMode(mode);
 }
 if (titleImage.naturalWidth) animateCut(finish);
 else finish();
}
$('enter').onclick=()=>enterMode('solo');
$('duo').onclick=()=>enterMode('duo');
$('home').onclick=()=>{screen('welcome');$('enter').focus();};
$('launch').onclick=()=>{if(pixelArt.ready){screen('play');start();$('pause').focus({preventScroll:true});}};
$('start').onclick=start;$('pause').onclick=pause;$('reset').onclick=selectScreen;$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-label',sound?'효과음 끄기':'효과음 켜기');beep(400);};
for(let i=0;i<2;i++)$('pick'+(i+1)).onclick=()=>{pick=i;$('pick1').classList.toggle('active',i===0);$('pick2').classList.toggle('active',i===1);renderCards();};
addEventListener('keydown', e => {
 if (document.body.dataset.screen !== 'play' || e.target instanceof HTMLSelectElement) return;
 if (e.code === 'Escape') {
  e.preventDefault();
  if (!e.repeat) pause();
 } else if (combatBindings[e.code]) {
  e.preventDefault();
  if (!e.repeat || (e.code !== 'KeyQ' && e.code !== 'KeyR')) localInput.press(e.code, e.code, true);
 }
});
addEventListener('keyup', e => localInput.release(e.code));
addEventListener('blur', () => {
 localInput.reset();
 if (phase === 'fight' || phase === 'countdown') pause();
});
document.addEventListener('visibilitychange', () => {
 if (document.hidden && (phase === 'fight' || phase === 'countdown')) pause();
});
document.querySelectorAll('[data-key]').forEach(button => {
 button.onpointerdown = e => {
  e.preventDefault();
  button.setPointerCapture(e.pointerId);
  localInput.press(e.pointerId, button.dataset.key, false);
 };
 button.onpointerup = button.onpointercancel = e => localInput.release(e.pointerId);
});
function cpu(dt) {
 aiClock -= dt;
 const fighter = fighters[1], opponent = fighters[0];
 const distance = Math.abs(fighter.x - opponent.x), level = $('difficulty').value;
 if (aiClock <= 0) {
  aiClock = level === 'easy' ? .42 : level === 'hard' ? .16 : .28;
  aiInput = emptyCombatInput();
  const {held, pressed} = aiInput;
  const spacing = {star:4.8, braid:2.8, staff:2.35}[fighter.def.id] ?? 1.65;
  const ahead = fighter.x > opponent.x ? 'left' : 'right';
  const back = fighter.x > opponent.x ? 'right' : 'left';
  if (distance > spacing) held[ahead] = true;
  else if (distance < spacing - .65 && Math.random() < .3) held[back] = true;
  if (opponent.move && Math.random() < (level === 'hard' ? .8 : level === 'easy' ? .2 : .5)) {
   held[back] = true;
   held.crouch = opponent.attackHeight === 'low';
  } else if (distance < 2.3 && Math.random() > .15) {
   pressed[Object.keys(moves)[Math.floor(Math.random()*6)]] = true;
  }
  if (!opponent.move && distance < fighter.def.range + 1 && Math.random() < (level === 'hard' ? .35 : .22)) {
   pressed[fighter.meter >= 100 ? 'super' : 'special'] = true;
  }
  if (Math.random() < .04) pressed.jump = true;
 }
 const out = {held:{...aiInput.held}, pressed:aiInput.pressed};
 aiInput.pressed = {};
 return out;
}
function attack(f,a){if(!f.move&&f.stun<=0){f.guard=false;f.attackHeight=f.y>0.2?'overhead':f.crouch&&moves[a].type==='kick'?'low':'mid';f.move=a;f.moveTime=0;f.hit=false;}}
function update(dt){if(phase==='pause')return;if(hitstop>0){hitstop=Math.max(0,hitstop-dt);return;}elapsed+=dt;shake=Math.max(0,shake-dt*20);particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=8*dt;p.life-=dt;});particles=particles.filter(p=>p.life>0);if(phase==='countdown'){phaseTime-=dt;if(phaseTime<.65)show('','FIGHT','',null);if(phaseTime<=0){phase='fight';$('overlay').style.display='none';beep(600);}return;}if(phase==='roundend'){phaseTime-=dt;if(phaseTime<=0){if(wins.some(w=>w>=2)){phase='matchend';let w=wins[0]>wins[1]?0:1;soloResult(w);}else{round++;newRound();}}return;}if(phase!=='fight')return;time=Math.max(0,time-dt);const inputs = inputSources.map(read => read(dt));
 inputs.forEach(({pressed}, slot) => {
  if (pressed.special) cast(fighters[slot], false);
  if (pressed.super) cast(fighters[slot], true);
 });
fighters.forEach((f,i)=>{const o=fighters[1-i],{held,pressed}=inputs[i];f.face=o.x>f.x?1:-1;f.stun=Math.max(0,f.stun-dt);f.specialCooldown=Math.max(0,f.specialCooldown-dt);f.comboAge+=dt;if(f.comboAge>1)f.combo=0;let backward=f.face===1?held.left:held.right;if(!f.move)f.crouch=!!held.crouch&&f.y===0&&f.stun<=0;f.guard=!!backward&&!f.move&&f.stun<=0&&f.y===0;if(f.stun<=0&&!f.move){if(pressed.jump&&f.y===0&&!f.crouch){f.vy=7.2;beep(220);}let dir=(held.right?1:0)-(held.left?1:0);f.x+=dir*f.def.speed*dt*(f.crouch?0:f.guard?.65:1);f.walk=dir?f.walk+dt*10:0;for(const m of Object.keys(moves).reverse())if(pressed[m]){attack(f,m);break;}}f.vy-=19*dt;f.y=Math.max(0,f.y+f.vy*dt);if(f.y===0)f.vy=0;f.x=Math.max(-7.3,Math.min(7.3,f.x));if(f.move==='skill'){stepSkill(f,o,dt);}else if(f.move){let m=basicMove(f,f.move);f.moveTime+=dt;if(f.moveTime>=m.duration){f.move=null;}else if(f.moveTime>=m.active&&!f.hit){f.hit=true;if(Math.abs(f.x-o.x)<m.range*f.def.reach&&Math.abs(f.y-o.y)<1.3){let block=o.guard&&(f.attackHeight==='low'?o.crouch:f.attackHeight==='overhead'?!o.crouch:true);let damage=m.damage*f.def.power*(block?0:1);o.hp=Math.max(0,o.hp-damage);f.meter=Math.min(100,f.meter+(block?3:damage*.9));o.meter=Math.min(100,o.meter+damage*.5);hitstop=block?.025:.065;o.stun=block?.08:m.stun;if(!block){o.move=null;o.guard=false;f.combo++;f.comboAge=0;}o.x=Math.max(-7.3,Math.min(7.3,o.x+f.face*(block?.12:.35)));shake=block?.1:.35;beep(block?180:f.move?.startsWith('h')?80:130,.12);for(let j=0;j<12;j++)particles.push({x:(f.x+o.x)/2,y:1.9+o.y,vx:(Math.random()-.5)*8,vy:Math.random()*5,life:.2+Math.random()*.2,color:block?'#b7d5ff':f.def.color});$('status').textContent=block?'GUARD':f.combo>1?f.combo+' HIT COMBO':(f.attackHeight==='low'?'LOW · ':f.attackHeight==='overhead'?'OVERHEAD · ':'')+f.move.toUpperCase();}}}});
stepProjectiles(dt);
let d=fighters[1].x-fighters[0].x;if(Math.abs(d)<.85&&Math.abs(fighters[0].y-fighters[1].y)<1.3){let push=(.85-Math.abs(d))/2,s=d>=0?1:-1;fighters[0].x-=push*s;fighters[1].x+=push*s;}
if(time<=0||fighters.some(f=>f.hp<=0)){phase='roundend';phaseTime=2.3;let diff=fighters[0].hp-fighters[1].hp;if(Math.abs(diff)<.01){show('DRAW','DOUBLE KO','라운드를 다시 진행합니다',null);round--;}else{let w=diff>0?0:1;wins[w]++;show(time<=0?'TIME UP':'KNOCKOUT',time<=0?'TIME UP':'K.O.',fighters[w].def.name+' · ROUND WIN',null);}beep(75,.35);}hud();}
function hud(){for(let i=0;i<2;i++){let f=fighters[i];$('hp'+(i+1)).style.width=f.hp+'%';$('meter'+(i+1)).style.width=f.meter+'%';$('meterLabel'+(i+1)).textContent=f.meter>=100?'SUPER READY · R':'SUPER '+Math.floor(f.meter)+'%';$('wins'+(i+1)).textContent=Array.from({length:2},(_,j)=>wins[i]>j?'●':'○').join(' ');}$('timer').textContent=String(Math.ceil(time)).padStart(2,'0');$('round').textContent='ROUND '+String(round).padStart(2,'0');}
function frame(ts){let dt=Math.min((ts-last)/1000||0,.035);last=ts;if(document.body.dataset.screen==='play'){update(dt);render();}localInput.endFrame();requestAnimationFrame(frame);}setup();renderCards();$('start').disabled=true;$('start').textContent='도트 에셋 로딩 중…';loadPixelArt();requestAnimationFrame(frame);
