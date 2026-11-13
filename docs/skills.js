'use strict';
// Distances use arena coordinates. Times are in seconds.
const kits = [
 {id:'staff',style:'봉술',speed:3.7,power:1,reach:1.05,q:'유성 찌르기',r:'만월 봉무',tip:'긴 봉으로 유진의 접근을 끊으세요. 헛찌른 뒤에는 레이의 슬라이드에 취약해요.',range:4.1,start:.22,end:.7,pose:2},
 {id:'slip',style:'유연한 기동전',speed:5.1,power:.86,reach:.95,q:'슬립 킥',r:'초승달 도약',tip:'낮게 미끄러져 리즈의 표창을 피하세요. 가을의 바닥 수식은 뛰어넘어야 해요.',range:1.65,start:.22,end:.49,pose:4},
 {id:'proof',style:'수식 설치',speed:3.45,power:.95,reach:.98,q:'수학의 정석 · 명제 설치',r:'최종 증명',tip:'책을 펼쳐 두 걸음 앞에 수식을 남겨요. 레이의 돌진을 읽으면 유리하고, 멀리 선 리즈를 조심하세요.',range:2.6,start:.27,end:.58,pose:5},
 {id:'force',style:'괴력 인파이터',speed:3.15,power:1.24,reach:.94,q:'지반 강타',r:'루프톱 브레이커',tip:'근접 강타로 큰 피해를 주세요. 충격은 지상에만 닿고 원영의 봉 끝에서는 반격하기 어려워요.',range:2.5,start:.37,end:.82,pose:4},
 {id:'star',style:'표창 견제',speed:3.8,power:.92,reach:.98,q:'청색 표창',r:'삼연성',tip:'멀리서 가을의 설치를 견제하세요. 레이는 슬립 킥으로 표창 밑을 통과할 수 있어요.',range:8,start:.16,end:.46,pose:2},
 {id:'braid',style:'브레이드 채찍',speed:3.85,power:.96,reach:1.04,q:'홍사 휘감기',r:'쌍홍 나선',tip:'땋은 머리로 먼 상대를 끌어와요. 끝거리는 길지만 상대를 가까이 당기면 위험해요.',range:4.7,start:.32,end:.86,pose:2}
];
function basicMove(f,key){
 const base=moves[key], id=f.def.id;
 if(base.type==='punch'&&(id==='staff'||id==='braid'))
  return {...base,range:base.range+(id==='staff'?.85:1.15),duration:base.duration+(id==='braid'?.13:.04)};
 if(id==='slip'&&base.type==='kick')return {...base,active:base.active*.72,duration:base.duration*.8};
 return base;
}
function cast(f,superMove){
 if(f.move||f.stun>0||f.y>0||f.specialCooldown>0||(superMove&&f.meter<100))return;
 if(superMove)f.meter=0;
 f.move='skill';f.boost=superMove;f.moveTime=0;f.hit=false;f.guard=false;f.crouch=false;
 f.followThrough=false;f.direction=f.face;f.specialCooldown=superMove?1.8:1.15;
 $('status').textContent=f.def.name+' · '+(superMove?f.def.r:f.def.q);
 beep(superMove?650:360,.18);
}
function skillHit(f,o,damage,height,push,boost){
 const blocked=o.guard&&(height==='low'?o.crouch:height==='overhead'?!o.crouch:true);
 const amount=blocked?(boost?3:0):damage;
 o.hp=Math.max(0,o.hp-amount);o.stun=blocked?.09:.26;
 if(!blocked){o.move=null;o.guard=false;}
 o.x=Math.max(-7.3,Math.min(7.3,o.x+push*(blocked?.25:1)));
 if(!boost)f.meter=Math.min(100,f.meter+(blocked?2:7));
 o.meter=Math.min(100,o.meter+amount*.4);hitstop=.045;shake=boost?.55:.25;
 $('status').textContent=blocked?'GUARD':(boost?f.def.r:f.def.q)+' · HIT';
 for(let i=0;i<12;i++)particles.push({x:o.x,y:o.y+1.3,vx:(Math.random()-.5)*8,vy:Math.random()*6,color:f.def.color,life:.25});
}
function stepSkill(f,o,dt){
 const k=f.def,dir=f.direction,b=f.boost;
 f.moveTime+=dt;
 if(k.id==='slip'&&f.moveTime<=k.start+.05){
  f.x=Math.max(-7.3,Math.min(7.3,f.x+dir*Math.min(Math.max(0,(o.x-f.x)*dir-.85),dt*(b?13:10))));
  if(b)f.y=Math.sin(Math.min(1,f.moveTime/(k.start+.05))*Math.PI)*.85;
 }
 const secondSweep=b&&k.id==='staff'&&f.hit&&!f.followThrough&&f.moveTime>=.48;
 if((!f.hit&&f.moveTime>=k.start)||secondSweep){
  if(secondSweep)f.followThrough=true;
  f.hit=true;
  if(k.id==='star'||k.id==='proof'){
   const trap=k.id==='proof';
   for(let i=0;i<(b?3:1);i++)projectiles.push({owner:f,dir,superMove:b,kind:k.id,color:k.color,
    x:f.x+dir*(trap?2+i*1.3:.85),y:trap?.05:1.7,life:trap?2.3:1.45,delay:trap?.24:i*.13,speed:trap?0:8.4});
  }else{
   const gap=(o.x-f.x)*dir,reach=k.range+(b?.9:0);
   const inRange=k.id==='force'?Math.abs(gap)<reach:gap>=-.1&&gap<reach;
   const height=secondSweep?'low':k.id==='slip'?(b?'overhead':'low'):k.id==='force'?'low':'mid';
   if(inRange&&o.y<(k.id==='force'?.42:1.6))
    skillHit(f,o,b?(k.id==='staff'?15:30):k.id==='force'?20:13,height,dir*(k.id==='braid'?-Math.max(0,gap-1.25):k.id==='force'?1.15:.32),b);
  }
 }
 if(f.moveTime>=k.end){f.move=null;f.boost=false;}
}
function stepProjectiles(dt){
 for(const p of projectiles){
  if(p.delay>0){p.delay-=dt;continue;}
  const before=p.x;p.x+=p.dir*p.speed*dt;p.life-=dt;
  const o=fighters.find(f=>f!==p.owner),trap=p.kind==='proof';
  const duck=o.crouch||(o.move==='skill'&&o.def.id==='slip'&&!o.boost);
  if(trap?o.y>.4:o.y>1.25||duck)continue;
  if(o.x<Math.min(before,p.x)-.55||o.x>Math.max(before,p.x)+.55)continue;
  skillHit(p.owner,o,trap?16:p.superMove?9:10,trap?'low':'mid',p.dir*.22,p.superMove);p.life=0;
 }
 projectiles=projectiles.filter(p=>p.life>0&&Math.abs(p.x)<10);
}
