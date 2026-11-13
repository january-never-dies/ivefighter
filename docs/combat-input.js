'use strict';

// Each slot supplies { held, pressed }. Only true actions need to be present.
const combatBindings = {
 KeyA:'left', ArrowLeft:'left', KeyD:'right', ArrowRight:'right',
 KeyS:'crouch', ArrowDown:'crouch', KeyW:'jump', ArrowUp:'jump',
 KeyU:'lp', KeyI:'mp', KeyO:'hp', KeyJ:'lk', KeyK:'mk', KeyL:'hk',
 KeyQ:'special', KeyR:'super'
};
function emptyCombatInput() {
 return {held:{}, pressed:{}};
}

function createLocalInput() {
 const down = new Map();
 const pulses = new Set();
 function press(source, code, keyboard) {
  const action = combatBindings[code];
  if (!action || down.has(source)) return;
  down.set(source, action);
  if (action === 'left' || action === 'right' || action === 'crouch') return;
  // Keyboard Q/R historically take the most recent of the two commands.
  if (keyboard && (action === 'special' || action === 'super')) {
   pulses.delete(action === 'special' ? 'super' : 'special');
  }
  pulses.add(action);
 }
 return {
  press,
  release(source) { down.delete(source); },
  read() {
   const input = emptyCombatInput();
   for (const action of down.values()) {
    if (action === 'left' || action === 'right' || action === 'crouch') input.held[action] = true;
   }
   for (const action of pulses) input.pressed[action] = true;
   pulses.clear();
   return input;
  },
  endFrame() {
   // Basic attacks and jump expire each frame; skills survive hitstop until read.
   for (const action of pulses) {
    if (action !== 'special' && action !== 'super') pulses.delete(action);
   }
  },
  reset() { down.clear(); pulses.clear(); }
 };
}
