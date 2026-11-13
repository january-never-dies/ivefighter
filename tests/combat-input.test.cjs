const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {runInNewContext} = require('node:vm');
const {resolve} = require('node:path');
const source = readFileSync(resolve(__dirname, '../docs/combat-input.js'), 'utf8');
const makeInput = runInNewContext(source + '\ncreateLocalInput');

test('independent devices can hold the same movement until both release', () => {
 const input = makeInput();
 input.press('ArrowRight', 'ArrowRight', true);
 input.press(9, 'KeyD', false);
 assert.equal(input.read().held.right, true);
 input.release('ArrowRight');
 input.endFrame();
 assert.equal(input.read().held.right, true);
 input.release(9);
 assert.equal(input.read().held.right, undefined);
});

test('jump and basic attacks pulse once and expire on skipped combat frames', () => {
 for (const [code, action] of Object.entries({KeyW:'jump',KeyU:'lp',KeyI:'mp',KeyO:'hp',KeyJ:'lk',KeyK:'mk',KeyL:'hk'})) {
  const input = makeInput();
  input.press(code, code, true);
  assert.equal(input.read().pressed[action], true);
  input.press(code, code, true);
  assert.equal(input.read().pressed[action], undefined);
  input.release(code);
  input.press(code, code, true);
  input.endFrame();
  assert.equal(input.read().pressed[action], undefined);
 }
});

test('skill commands survive hitstop, respect keyboard order, and reset on pause', () => {
 const input = makeInput();
 input.press('KeyQ','KeyQ',true);
 input.press('KeyR','KeyR',true);
 input.endFrame();
 const {pressed} = input.read();
 assert.equal(pressed.special, undefined);
 assert.equal(pressed.super, true);
 assert.equal(input.read().pressed.super, undefined);
 input.press(3,'KeyQ',false);
 input.press(4,'KeyS',false);
 input.reset();
 assert.equal(input.read().pressed.special, undefined);
 assert.equal(input.read().held.crouch, undefined);
});
