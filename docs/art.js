'use strict';
// Generated pixel-art atlas. Separate connected silhouettes so neighboring kick
// frames cannot bleed into one another, even when their bounding boxes overlap.
const pixelArt={ready:false,error:null,rows:[],background:null};
function canvasOf(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function extractSprites(image){
 const source=canvasOf(image.width,image.height),sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(image,0,0);
 const pixels=sc.getImageData(0,0,source.width,source.height),d=pixels.data,w=source.width,h=source.height,n=w*h;
 const visited=new Uint8Array(n),queue=new Int32Array(n),groups=[];
 for(let start=0;start<n;start++){
  if(visited[start]||d[start*4+3]<70)continue;
  let head=0,tail=1,minX=w,minY=h,maxX=0,maxY=0;queue[0]=start;visited[start]=1;
  while(head<tail){const p=queue[head++],x=p%w,y=(p/w)|0;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
   for(const next of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(next>=0&&!visited[next]&&d[next*4+3]>=70){visited[next]=1;queue[tail++]=next;}
  }
  if(tail<1000)continue;
  const sprite=canvasOf(maxX-minX+3,maxY-minY+3),cx=sprite.getContext('2d'),out=cx.createImageData(sprite.width,sprite.height);
  for(let k=0;k<tail;k++){const p=queue[k],target=(((p/w|0)-minY+1)*sprite.width+(p%w)-minX+1)*4;out.data.set(d.subarray(p*4,p*4+4),target);}
  cx.putImageData(out,0,0);groups.push({image:sprite,x:minX,y:minY,width:sprite.width,height:sprite.height});
 }
 const rows=Array.from({length:6},()=>[]);for(const g of groups){const row=Math.min(5,Math.floor((g.y+12)/(h/6)));rows[row].push(g);}for(const row of rows)row.sort((a,b)=>a.x-b.x);
 if(rows.some(row=>row.length!==8))throw new Error('Sprite atlas must contain six rows of eight poses: '+rows.map(r=>r.length).join(','));
 return rows;
}
function loadPixelArt(){
 const atlas=new Image(),bg=new Image();let loaded=0;
 function ready(){loaded++;if(loaded!==2)return;pixelArt.ready=true;document.documentElement.dataset.pixelArt='ready';renderCards();$('start').disabled=false;$('start').innerHTML='대전 시작 <span>↗</span>';$('overlayText').textContent='파이터 선택 후 대전을 시작하세요';}
 function fail(){pixelArt.error='도트 에셋을 불러오지 못했습니다. 새로고침해 주세요.';$('overlayText').textContent=pixelArt.error;document.documentElement.dataset.pixelArt='error';}
 atlas.onload=()=>{try{pixelArt.rows=extractSprites(atlas);ready();}catch(e){console.error(e);fail();}};atlas.onerror=fail;
 bg.onload=()=>{pixelArt.background=bg;ready();};bg.onerror=fail;
 atlas.src=FIGHTER_ATLAS_URL;bg.src='assets/training-center.png';
}
function poseFor(f,portrait){if(portrait||((phase==='matchend'||phase==='roundend')&&f.hp>0))return 0;if(f.hp<=0||f.stun>0&&!f.guard)return 6;if(f.move==='skill'){const k=f.def;if(k.id==='slip'&&f.boost)return f.hit?3:7;if(k.id==='force')return f.hit?4:7;if(k.id==='proof')return f.hit?2:5;return f.moveTime<k.start*.45?1:k.pose;}if(f.move){const m=basicMove(f,f.move);const p=f.moveTime/m.duration;if(p<.16||p>.88)return 0;return m.type==='kick'?(f.attackHeight==='low'?4:3):2;}if(f.guard)return 5;if(f.crouch)return 4;if(f.y>.05)return 7;if(f.walk)return Math.floor(f.walk*1.5)%2;return 0;}
function drawModel(c,f,t,project,portrait=false){
 if(!pixelArt.ready)return;const row=pixelArt.rows[roster.indexOf(f.def)];if(!row)return;
 const pose=poseFor(f,portrait),sprite=row[pose],origin=project(f.x,f.y,0),unit=Math.abs(project(0,1,0)[1]-project(0,0,0)[1]);
 const scale=unit*3.6/row[0].height;let width=Math.round(sprite.width*scale),height=Math.round(sprite.height*scale);
 // Align torso instead of the outer silhouette: punches and kicks extend forward.
 const anchors=[.5,.5,.39,.29,.3,.5,.5,.5];const bob=!portrait&&!f.move&&!f.stun&&!f.crouch&&f.y===0?(Math.floor(t*6)%2)*2:0;
 c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(origin[0]),Math.round(origin[1]+bob));c.scale(f.move==='skill'?f.direction:f.face,1);
 if(f.move==='skill'&&!portrait){const swing=Math.sin(Math.PI*Math.min(1,f.moveTime/f.def.end));if(f.def.id==='slip'){c.rotate(swing*.19);c.scale(1,1-swing*.12);}if(f.def.id==='force')c.rotate(f.hit?swing*.12:-swing*.16);if(f.def.id==='braid')c.rotate(-swing*.1);}
 if(f.hp<=0&&!portrait){c.translate(70,-105);c.rotate(-Math.PI/2);}
 if(portrait){c.drawImage(sprite.image,0,0,sprite.width,sprite.height,-width*.5,-height,width,height);}
 else{c.drawImage(sprite.image,0,0,sprite.width,sprite.height,-Math.round(width*anchors[pose]),-height,width,height);}
 drawGear(c,f,Math.round(unit*3.6));c.restore();
}
function render(){const c=ctx,W=1200,H=600;c.save();c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);c.imageSmoothingEnabled=false;c.clearRect(0,0,W,H);
 if(pixelArt.background){
  const bg=pixelArt.background, zoom=2.35;
  const width=bg.naturalWidth/zoom, height=bg.naturalHeight/zoom;
  // Frame the training mat from the fighters' level, centered on the rear shutter.
  c.drawImage(bg,(bg.naturalWidth-width)/2,bg.naturalHeight-height,width,height,0,0,W,H);
 }else{c.fillStyle='#1a1531';c.fillRect(0,0,W,H);}
 // Keep life bars legible without dimming the foreground artwork.
 let shade=c.createLinearGradient(0,0,0,170);shade.addColorStop(0,'#090e22dc');shade.addColorStop(1,'#090e2200');c.fillStyle=shade;c.fillRect(0,0,W,170);
 c.translate(Math.round((Math.random()-.5)*shake*12),Math.round((Math.random()-.5)*shake*8));const project=(x,y,z)=>[600+x*62,520-y*78];
 for(const f of fighters){const p=project(f.x,0,0);c.fillStyle='#11152a88';c.fillRect(Math.round(p[0]-45),518,90,8);c.fillRect(Math.round(p[0]-32),526,64,4);drawModel(c,f,elapsed,project);}
 for(const p of projectiles){const at=project(p.x,p.y,0);c.save();c.translate(...at);drawSkillObject(c,p,elapsed);c.restore();}
 for(const p of particles){const a=project(p.x,p.y,0);c.fillStyle=p.color;c.fillRect(Math.round(a[0]/3)*3,Math.round(a[1]/3)*3,6,6);c.fillStyle='#fff4d5';c.fillRect(Math.round(a[0]/3)*3,Math.round(a[1]/3)*3,3,3);}
 c.restore();}

function inkLine(c,points,color,width){
 c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.beginPath();
 points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
}
function drawGear(c,f,height){
 const id=f.def.id,skill=f.move==='skill',p=skill?f.moveTime/f.def.end:0;
 const attacking=skill||f.move&&moves[f.move]?.type==='punch';
 const extension=skill?Math.min(1,f.moveTime/f.def.start)*Math.max(0,Math.min(1,(1-p)*3)):attacking?Math.sin(Math.PI*Math.min(1,f.moveTime/basicMove(f,f.move).duration)):0;
 c.save();c.scale(height/280,height/280);
 if(id==='staff'){
  const sweep=skill&&f.boost&&f.moveTime>.36;
  c.translate(attacking?32:15,sweep?-70:attacking?-169:-158);c.rotate(sweep?.17:attacking?-.9+extension*.89:-.98);
  const length=attacking?115+extension*(f.boost&&skill?145:105):108;
  inkLine(c,[[-58,0],[length,0]],'#482547',10);inkLine(c,[[-57,-1],[length,-1]],'#ff9179',6);
  c.fillStyle='#ffe793';c.fillRect(length-12,-4,11,7);c.fillRect(-58,-4,9,7);
 }else if(id==='braid'&&attacking){
  const length=58+extension*(skill?230:160);
  for(const offset of (skill&&f.boost?[-12,16]:[0])){
   const points=Array.from({length:26},(_,i)=>{const t=i/25;return [-9+t*length,-216+45*t+Math.sin(t*8-extension*4)*24*t+offset*t];});
   inkLine(c,points,'#482038',11);inkLine(c,points,'#cf383b',7);
   for(let i=1;i<25;i+=2)inkLine(c,[points[i],points[i+1]],'#ff8760',3);
  }
 }else if(id==='proof'){
  c.translate(skill?22:12,skill?-182:-154);c.rotate(skill?-.16:.13);
  c.fillStyle='#193737';c.fillRect(-20,-24,44,45);c.fillStyle='#ece6c5';c.fillRect(-17,-21,38,39);
  c.fillStyle='#306651';c.fillRect(-15,-18,34,11);c.fillStyle='#253f38';c.font='bold 10px sans-serif';c.fillText('정석',-10,7);
  if(skill){c.fillStyle='#adffe6';c.font='bold 16px monospace';c.fillText('Σ x²',28,-19);}
 }else if(id==='star'&&(skill||!f.move)){c.translate(skill?53:30,-178);drawStar(c,11);}
 else if(id==='slip'&&skill){for(let i=0;i<4;i++)inkLine(c,[[-72-i*12,-23-i*10],[-22,-28-i*10]],'#ffdb72',3);}
 else if(id==='force'&&skill&&f.hit){
  for(const direction of [-1,1]){const radius=55+Math.min(1,(f.moveTime-f.def.start)*4)*(f.boost?145:92);
   inkLine(c,[[0,-3],[direction*radius*.4,-9],[direction*radius*.48,-30],[direction*radius*.57,-8],[direction*radius,-4]],'#ccacff',6);}
 }
 c.restore();
}
function drawStar(c,size){
 c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?size*.28:size;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.fillStyle='#b9ebff';c.fill();c.strokeStyle='#2274b7';c.lineWidth=2;c.stroke();c.fillStyle='#244564';c.fillRect(-2,-2,4,4);
}
function drawSkillObject(c,p,t){
 if(p.delay>0&&p.kind==='star')return;
 if(p.kind==='star'){c.rotate(t*14);drawStar(c,p.superMove?21:17);return;}
 c.globalAlpha=p.delay>0?.5:.9;c.scale(1,.52);c.strokeStyle=p.color;c.lineWidth=3;
 c.strokeRect(-29,-29,58,58);c.rotate(Math.PI/4);c.strokeRect(-24,-24,48,48);c.rotate(-Math.PI/4);
 c.fillStyle='#d6fff0';c.font='bold 22px monospace';c.fillText(p.superMove?'∑':'x²',-12,8);
}
