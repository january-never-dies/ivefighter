'use strict';
// Generated pixel-art atlas. Separate connected silhouettes so neighboring kick
// frames cannot bleed into one another, even when their bounding boxes overlap.
const pixelArt={ready:false,error:null,rows:[],background:null};
function canvasOf(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
// Eye-line centers for the eight poses of each fighter, on a 1400px atlas proof.
const faceCenters = [
 [[110,36],[296,36],[467,44],[648,42],[852,95],[1047,37],[1181,33],[1363,38]],
 [[105,205],[292,205],[460,214],[642,211],[837,277],[1049,210],[1182,207],[1356,207]],
 [[104,387],[290,388],[460,388],[641,389],[845,458],[1048,390],[1180,382],[1355,388]],
 [[102,559],[291,559],[461,562],[643,560],[844,620],[1047,559],[1180,553],[1357,559]],
 [[106,738],[295,741],[469,744],[644,742],[852,804],[1055,742],[1182,731],[1363,733]],
 [[105,906],[293,907],[466,908],[642,909],[831,979],[1049,910],[1180,905],[1362,909]]
];
function clarifyFaces(pixels) {
 const {width, height, data} = pixels;
 const scale = width / 1400;
 for (const row of faceCenters) for (const [cx, cy] of row) {
  const left = Math.max(1, Math.floor((cx - 16) * scale));
  const right = Math.min(width - 2, Math.ceil((cx + 16) * scale));
  const top = Math.max(1, Math.floor((cy - 15) * scale));
  const bottom = Math.min(height - 2, Math.ceil((cy + 15) * scale));
  const changes = [];
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
   const dx = (x / scale - cx) / 16, dy = (y / scale - cy) / 15;
   const mask = Math.min(1, (1 - dx * dx - dy * dy) * 3);
   const i = (y * width + x) * 4;
   if (mask <= 0 || data[i + 3] < 250) continue;
   // Lift local contrast along existing eyes and bangs, leaving flat skin quiet.
   let sum = 0, count = 0;
   const light = j => (data[j] + 2 * data[j + 1] + data[j + 2]) / 4;
   for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
    const j = i + (oy * width + ox) * 4;
    if (data[j + 3] >= 250) { sum += light(j); count++; }
   }
   const edge = light(i) - sum / count;
   if (Math.abs(edge) > 3) changes.push([i, Math.max(-30, Math.min(22, edge * 1.25)) * mask]);
  }
  for (const [i, delta] of changes) for (let c = 0; c < 3; c++) data[i + c] += delta;
 }
}
// Coordinates use the same atlas proof as faceCenters. Work on extracted frames so
// changing the hair silhouette does not move a fighter's feet or attack anchor.
function styleCombatHair(rows, scale) {
 const rearEdges = [
  [[89,5],[91,10],[86,15],[84,24],[85,33],[91,43],[90,49],[81,55],[74,67],[69,78],[70,88]],
  [[273,4],[276,10],[271,15],[268,25],[270,37],[278,48],[276,54],[269,58],[260,70],[249,84],[251,91]],
  [[448,10],[450,17],[445,22],[443,32],[447,45],[452,52],[448,58],[440,64],[427,76],[424,88]],
  [[624,8],[629,15],[624,23],[623,34],[626,45],[631,54],[627,61],[620,70],[613,91],[618,102]],
  [[832,65],[836,71],[832,78],[830,89],[832,101],[836,109],[830,115],[822,130],[814,155],[809,165]],
  [[1026,5],[1029,11],[1024,18],[1021,28],[1025,39],[1030,48],[1024,53],[1017,63],[1016,76],[1019,89]],
  [[1167,11],[1171,17],[1167,22],[1167,32],[1172,42],[1181,48],[1174,53],[1167,62],[1158,71],[1158,88]],
  [[1340,4],[1344,11],[1339,18],[1337,30],[1342,41],[1347,48],[1340,54],[1334,62],[1328,79],[1324,91]]
 ];
 rows[0].forEach((frame, pose) => {
  const c = frame.image.getContext('2d'), edge = rearEdges[pose];
  c.save();
  c.setTransform(scale, 0, 0, scale, 1-frame.x, 1-frame.y);
  c.beginPath();
  c.moveTo(edge[0][0]-115, edge[0][1]-18);
  edge.forEach(([x,y]) => c.lineTo(x,y));
  c.lineTo(edge[0][0]-115, edge.at(-1)[1]+18);
  c.closePath(); c.save(); c.clip(); c.clearRect(0,0,1400,1050); c.restore();
  const [x,y] = edge[5];
  // Remove stray pink ends below the clipped tail and blend the former high tie into the crown.
  const img=c.getImageData(0,0,frame.width,frame.height);
  for(let j=0;j<img.data.length;j+=4){
   const ax=((j/4)%frame.width+frame.x-1)/scale;
   const ay=(Math.floor(j/4/frame.width)+frame.y-1)/scale;
   const r=img.data[j],g=img.data[j+1],b=img.data[j+2];
   if(ax<x-20 && ay>edge.at(-1)[1]-8 && ay<edge.at(-1)[1]+22 && r>g*1.25 && b>g*1.12)img.data[j+3]=0;
   if(ay<edge[0][1]+12 && ax<x+12 && r>g*1.35 && b>g*1.18){
    img.data[j]=62;img.data[j+1]=40;img.data[j+2]=47;
   }
   if(ay<edge[1][1] && ax<x+3 && ax<x+2+(edge[1][1]-ay)*1.3)img.data[j+3]=0;
  }
  c.putImageData(img,0,0);
  c.globalCompositeOperation = 'destination-over';
  const end = pose === 6 ? -6 : -20;
  c.translate(x,y);
  const lock = (points, color) => {
   c.fillStyle=color; c.beginPath(); points.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b)); c.closePath(); c.fill();
  };
  lock([[3,0],[5,-2],[1,15],[end+5,48],[end+2,55],[end+2,45]],'#d36194');
  lock([[-2,-3],[2,-4],[-2,14],[end+2,47],[end,54],[-6,18]],'#654350');
  lock([[0,-9],[6,-4],[3,9],[end+6,49],[end,59],[end+1,48],[end-3,53],[-8,21],[-6,3]],'#39232d');
  c.restore();
 });
 rows[4].forEach((frame, pose) => {
  const c=frame.image.getContext('2d'), [x,y]=faceCenters[4][pose];
  c.save(); c.setTransform(scale,0,0,scale,1-frame.x,1-frame.y);
  c.translate(x,y);
  if(pose===6)c.rotate(-.43);
  c.globalCompositeOperation='source-atop';
  const patch=c.getImageData(0,0,frame.width,frame.height);
  for(let j=0;j<patch.data.length;j+=4){
   const dx=((j/4)%frame.width+frame.x-1)/scale-x;
   const dy=(Math.floor(j/4/frame.width)+frame.y-1)/scale-y;
   if(dx < -15 || dx > 23 || dy < -26 || dy > 4)continue;
   const r=patch.data[j],g=patch.data[j+1],b=patch.data[j+2];
   if(b>r*1.2 && b>g*1.1 && !(dy>-4 && dx>-8 && dx<9)){
    patch.data[j]=g*.8+18;patch.data[j+1]=g*.54+9;patch.data[j+2]=g*.5+8;
   }
  }
  c.putImageData(patch,0,0);
  // Dark roots transition into narrow blue streaks on the blunt cheek pieces.
  for(const [left,top,length] of [[-14,-12,22],[11,-10,17]]) {
   c.fillStyle='#513633'; c.fillRect(left,top,4,length);
   c.fillStyle='#77514b'; c.fillRect(left+1,top+1,2,6);
   c.fillStyle='#5595bf'; c.fillRect(left+1,top+8,2,length-8);
   c.fillStyle='#9bdcff'; c.fillRect(left+2,top+10,1,length-11);
  }
  c.restore();
 });
}

function extractSprites(image){
 const source=canvasOf(image.width,image.height),sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(image,0,0);
 const pixels=sc.getImageData(0,0,source.width,source.height),d=pixels.data,w=source.width,h=source.height,n=w*h;
 clarifyFaces(pixels);
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
 styleCombatHair(rows,w/1400);
 return rows;
}
function loadPixelArt(){
 const atlas=new Image(),bg=new Image();let loaded=0;
 function ready(){loaded++;if(loaded!==2)return;pixelArt.ready=true;$('launch').disabled=false;$('launch').textContent='대전 시작　→';document.documentElement.dataset.pixelArt='ready';renderCards();$('start').disabled=false;$('start').innerHTML='대전 시작 <span>↗</span>';$('overlayText').textContent='파이터 선택 후 대전을 시작하세요';}
 function fail(){pixelArt.error='도트 에셋을 불러오지 못했습니다. 새로고침해 주세요.';$('overlayText').textContent=pixelArt.error;$('launch').textContent=pixelArt.error;document.documentElement.dataset.pixelArt='error';}
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
  c.save();c.scale(skill?f.direction:f.face,1);
  c.fillStyle='#40353d';c.fillRect(-22,-27,44,55);
  c.fillStyle='#d6cfd0';c.fillRect(-20,-25,41,52);
  c.fillStyle='#fffcf6';c.fillRect(-20,-26,40,51);
  c.fillStyle='#e9787b';c.fillRect(-17,-14,34,1);c.fillRect(-17,0,34,8);
  c.textAlign='center';c.fillStyle='#241e23';c.font='bold 10px serif';c.fillText('수학의 정석',0,-3,35);
  c.fillStyle='#fff';c.font='7px Galmuri11, sans-serif';c.fillText('수학(하)',0,7);
  c.fillStyle='#514951';c.font='5px serif';c.fillText('홍성대 지음',0,16);
  c.restore();
  if(skill){c.fillStyle='#adffe6';c.font='16px "Kemco Pixel", Galmuri11, monospace';c.fillText('Σ x²',28,-19);}
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
 c.fillStyle='#d6fff0';c.font='22px "Kemco Pixel", Galmuri11, monospace';c.fillText(p.superMove?'∑':'x²',-12,8);
}
