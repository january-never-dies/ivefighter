'use strict';
const panel = $('panel-content');
let destination = 'solo', lesson = 0, tutorialSeen = false, fromSettings = false;
let scoreFromMatch = false, initials = '', roomCode = 'IVE126', sampleGain = .58;
try { tutorialSeen = !!localStorage.getItem('ive-tutorial-preview'); } catch {}
const lessons = [
 ['MOVE','A / D 또는 ← / →','좌우로 이동해 상대와의 거리를 조절하세요.'],
 ['JUMP / CROUCH','W / S 또는 ↑ / ↓','위로 점프하고 아래로 앉습니다.'],
 ['PUNCH / KICK','U I O · J K L','윗줄은 펀치, 아랫줄은 킥입니다. 왼쪽부터 약·중·강 공격입니다.'],
 ['GUARD','상대 반대 방향','뒤로 이동해 가드하세요. 낮은 공격은 뒤로 앉아 막습니다.'],
 ['SPECIAL / SUPER','Q / R','Q는 캐릭터 고유기입니다. 게이지가 100%일 때 R로 초필살기를 사용하세요.'],
 ['ROUND','60 SEC · FIRST TO 2','상대 체력을 소진하거나 시간 종료 시 더 많은 체력을 남기세요. 두 라운드를 먼저 따면 승리합니다.']
];
function actions(...items) {
 const row = document.createElement('div');
 row.className = 'panel-actions';
 for (const [label, click] of items) {
  const button = document.createElement('button');
  button.textContent = label;
  button.onclick = click;
  row.append(button);
 }
 panel.append(row);
}
function page(title, body) {
 screen('arcade');
 $('panel-title').textContent = title;
 panel.innerHTML = body;
 $('panel-title').focus();
}
function title() { screen('welcome'); $('enter').focus(); }
function openMode(mode) {
 destination = mode;
 document.body.dataset.mode = mode;
 fromSettings = false;
 if (!tutorialSeen) return tutorial(0);
 continueMode();
}
function continueMode() {
 if (fromSettings) return settings();
 if (destination === 'duo') return lobby();
 selectScreen(); $('pick1').focus();
}
function finishLesson() {
 tutorialSeen = true;
 try { localStorage.setItem('ive-tutorial-preview','1'); } catch {}
 continueMode();
}
function tutorial(index) {
 lesson = index;
 const [name,key,description] = lessons[index];
 page('TRAINING', '<small>'+ (index+1)+' / '+lessons.length+'</small><h3>'+name+'</h3><kbd>'+key+'</kbd><p>'+description+'</p>');
 actions([index===lessons.length-1?'FINISH':'NEXT',()=>lesson===lessons.length-1?finishLesson():tutorial(lesson+1)],['SKIP',finishLesson]);
}
function settings() {
 page('SETTINGS','<h3>CONTROLS</h3><p>A D 이동　 W 점프　 S 앉기<br>U I O 펀치　 J K L 킥<br>Q 고유기　 R 초필살기</p>');
 actions(['REPLAY TUTORIAL',()=>{fromSettings=true;tutorial(0);}],['TITLE',title]);
}
function soundPanel() {
 page('SOUND','<fieldset><legend>SFX</legend><label><input type="checkbox" id="fx-toggle"> 전투 효과음</label><p><label>효과음 볼륨 <input type="range" id="fx-volume" min="0" max="100"></label></p></fieldset><fieldset disabled><legend>BGM</legend>음원 준비 중</fieldset>');
 $('fx-toggle').checked=sound;
 $('fx-toggle').onchange=()=>{if(sound!==$('fx-toggle').checked)$('sound').click();};
 $('fx-volume').value=Math.round(sampleGain*100);
 $('fx-volume').oninput=()=>{sampleGain=Number($('fx-volume').value)/100;slashSound.volume=sampleGain;};
 actions(['TITLE',title]);
}
function lobby() {
 page('ONLINE LOBBY','<p>친구 초대 화면 미리보기 · 예시 코드 IVE126</p><label>초대 코드 <input id="room-code" maxlength="6" placeholder="IVE126" autocomplete="off"></label><p id="room-error" role="status"></p>');
 actions(['CREATE ROOM',waiting],['JOIN ROOM',()=>{
  if ($('room-code').value.trim().toUpperCase()!==roomCode){$('room-error').textContent='미리보기 코드 IVE126을 입력하세요.';return;}
  waiting();
 }],['TITLE',title]);
}
function waiting() {
 page('WAITING ROOM','<small>ROOM CODE</small><h3>'+roomCode+'</h3><p>1P　 YOU<br>2P　 GUEST · 예시 상대</p>');
 actions(['SELECT FIGHTER',()=>{selectScreen();$('online-ready').focus();}],['EXIT ROOM',lobby]);
}
function previewBattle() {
 page('ONLINE BATTLE','<small>대전 화면 미리보기</small><div class="vs-preview"><img alt="'+roster[chosen[0]].name+'" src="assets/pose-'+chosen[0]+'.png"><b>VS</b><img alt="'+roster[chosen[1]].name+'" src="assets/pose-'+chosen[1]+'.png"></div>');
 actions(['결과 미리보기',onlineResult],['EXIT ROOM',lobby]);
}
function onlineResult() {
 page('RESULT','<small>예시 결과 · ONLINE</small><h3>YOU WIN</h3><p>ROUND　2 — 1</p>');
 actions(['REMATCH',previewBattle],['CHANGE CHARACTER',()=>{selectScreen();$('online-ready').focus();}],['EXIT ROOM',lobby]);
}
function soloResult(winner) {
 scoreFromMatch=true; initials='';
 page(winner===0?'YOU WIN':'YOU LOSE','<p>'+fighters[0].def.name+'　'+wins.join(' — ')+'　'+fighters[1].def.name+'</p><small>FINAL SCORE · 화면 예시</small><h3>018800</h3>');
 actions(['이니셜 입력 미리보기',entry],['HIGH SCORES',scores],['RETRY',retry],['TITLE',title]);
}
function retry(){screen('play');start();$('pause').focus();}
function entry() {
 page('NEW HIGH SCORE!','<p>예시 점수　018800</p><label>세 글자 이니셜 <input id="initials" maxlength="3" placeholder="AAA" autocomplete="off"></label><p role="status" id="initial-error"></p>');
 actions(['OK',()=>{
  const value=$('initials').value.trim().toUpperCase();
  if(!/^[A-Z]{3}$/.test(value)){$('initial-error').textContent='영문 세 글자를 입력하세요.';return;}
  initials=value;scores();
 }],['SKIP',scores]);
}
function scores() {
 const rows=[['DIV',21950],['MNG',20400],['IVE',19350],['REI',18100],['LIZ',16750],['AAA',15600],['BBB',14400],['CCC',13000],['DDD',12500],['EEE',11950]];
 if(initials&&scoreFromMatch) rows.splice(3,0,[initials,18800]);
 page('HIGH SCORES','<small>1 PLAYER · 예시 기록</small><table><thead><tr><th>RANK</th><th>NAME</th><th>SCORE</th></tr></thead><tbody>'+rows.slice(0,10).map(([name,score],i)=>'<tr class="'+(score===18800?'my-score':'')+'"><td>'+String(i+1).padStart(2,'0')+'</td><td>'+name+'</td><td>'+String(score).padStart(6,'0')+'</td></tr>').join('')+'</tbody></table>');
 if(scoreFromMatch) actions(['RETRY',retry],['TITLE',title]); else actions(['BACK',title]);
}
const ready=document.createElement('button');
ready.id='online-ready';ready.className='flow-cta';ready.textContent='READY';ready.onclick=previewBattle;
$('launch').after(ready);
$('home').onclick=()=>destination==='duo'?waiting():title();
document.querySelector('.tools').onclick=e=>{
 const view=e.target.closest('button')?.dataset.view;
 if(entering||!view)return;
 scoreFromMatch=false;
 ({soundPanel,settings,scores})[view]();
};
