'use strict';
const panel = $('panel-content');
let destination = 'solo', tutorialSeen = false, fromSettings = false;
let scoreFromMatch = false, initials = '', roomCode = 'IVE126', sampleGain = .58;
try { tutorialSeen = !!localStorage.getItem('ive-tutorial-preview'); } catch {}
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
const modeButtons = [$('enter'), $('duo')];
function highlightMode(selected) {
 for (const button of modeButtons) button.classList.toggle('current-mode', button === selected);
}
for (const button of modeButtons) {
 for (const event of ['pointerenter','pointerdown','focus']) {
  button.addEventListener(event, () => { if (!entering) highlightMode(button); });
 }
}
window.addEventListener('keydown', event => {
 if (document.body.dataset.screen !== 'welcome' || entering || event.altKey || event.metaKey || event.ctrlKey) return;
 if (!modeButtons.includes(document.activeElement) && document.activeElement !== document.body) return;
 const current = modeButtons.find(button => button.classList.contains('current-mode'));
 if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
  event.preventDefault();
  modeButtons.find(button => button !== current).focus();
 } else if (event.key === 'Enter') {
  event.preventDefault();
  if (!event.repeat) current.click();
 }
});
function title() { screen('welcome'); $('enter').focus(); }
function openMode(mode) {
 destination = mode;
 document.body.dataset.mode = mode;
 fromSettings = false;
 if (!tutorialSeen) return tutorial();
 continueMode();
}
function continueMode() {
 if (fromSettings) return settings();
 if (destination === 'duo') return lobby();
 selectScreen(); $('pick1').focus();
}
function finishTutorial() {
 tutorialSeen = true;
 try { localStorage.setItem('ive-tutorial-preview','1'); } catch {}
 continueMode();
}
const guideActions = {
 left:['move','왼쪽 이동'], right:['move','오른쪽 이동'], jump:['move','점프'], crouch:['move','앉기'],
 lp:['punch','약펀치'], mp:['punch','중펀치'], hp:['punch','강펀치'],
 lk:['kick','약킥'], mk:['kick','중킥'], hk:['kick','강킥'],
 special:['skill','고유기'], super:['skill','초필살기']
};
function guideKey(label, code) {
 const action = guideActions[combatBindings[code]];
 if (!action) return '<span class="guide-cap" aria-hidden="true">'+label+'</span>';
 const [group,name] = action;
 return '<button type="button" class="guide-cap '+group+'" data-code="'+code+'" aria-label="'+label+' '+name+'">'+label+'</button>';
}
function tutorial() {
 const rows = ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].map(row =>
  '<div class="guide-row">'+[...row].map(key=>guideKey(key,'Key'+key)).join('')+'</div>').join('');
 const arrows = ['Up','Left','Down','Right'].map((key,i)=>guideKey(['↑','←','↓','→'][i],'Arrow'+key)).join('');
 page('CONTROLS', `<div class="key-guide">
  <p>색이 있는 키를 누르거나 터치해 기능을 확인하세요.</p>
  <div class="guide-board"><div class="guide-letters">${rows}</div><div class="guide-arrows">${arrows}</div></div>
  <output class="guide-readout" aria-live="polite">키 입력 대기</output>
  <dl class="guide-legend">
   <div class="move"><dt>이동</dt><dd>A D 좌우 · W 점프 · S 앉기<br>방향키로도 조작 가능</dd></div>
   <div class="skill"><dt>기술</dt><dd>Q 고유기 · R 초필살기<br>초필살기는 게이지 100%에서 사용</dd></div>
   <div class="punch"><dt>펀치</dt><dd>U 약 · I 중 · O 강</dd></div>
   <div class="kick"><dt>킥</dt><dd>J 약 · K 중 · L 강</dd></div>
  </dl><p class="guide-notes">가드는 상대 반대 방향을 유지하세요. 앉아서도 가드할 수 있어요.<br>라운드당 60초 · 2라운드 선승</p></div>`);
 const guide = panel.querySelector('.key-guide');
 const readout = guide.querySelector('output');
 function report(button) { readout.textContent = button.getAttribute('aria-label'); }
 guide.onclick = event => {
  const button = event.target.closest('[data-code]');
  if (button) report(button);
 };
 actions([fromSettings?'설정으로':destination==='duo'?'로비로':'캐릭터 선택',finishTutorial]);
}
window.addEventListener('keydown', event => {
 if (!combatBindings[event.code] || event.altKey || event.metaKey || event.ctrlKey || document.body.dataset.screen !== 'arcade') return;
 const button = panel.querySelector('.key-guide [data-code="'+event.code+'"]');
 if (!button) return;
 event.preventDefault();
 button.classList.add('held');
 if (!event.repeat) panel.querySelector('.guide-readout').textContent = button.getAttribute('aria-label');
});
window.addEventListener('keyup', event => {
 if (combatBindings[event.code]) panel.querySelector('.key-guide [data-code="'+event.code+'"]')?.classList.remove('held');
});
window.addEventListener('blur', () => panel.querySelectorAll('.key-guide .held').forEach(key=>key.classList.remove('held')));
function settings() {
 page('SETTINGS','<h3>CONTROLS</h3><p>A D 이동　 W 점프　 S 앉기<br>U I O 펀치　 J K L 킥<br>Q 고유기　 R 초필살기</p>');
 actions(['REPLAY TUTORIAL',()=>{fromSettings=true;tutorial();}],['TITLE',title]);
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
