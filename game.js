const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const shell = document.querySelector('.game-shell');
const ammoEl = document.querySelector('#ammo');
const scoreEl = document.querySelector('#score');
const comboEl = document.querySelector('#combo');
const timerEl = document.querySelector('#timer');
const trigger = document.querySelector('#trigger');
const overlay = document.querySelector('#overlay');
const resultTitle = document.querySelector('#result-title');
const resultCopy = document.querySelector('#result-copy');
const finalScore = document.querySelector('#final-score');
const restart = document.querySelector('#restart');
const gunImage = new Image();
gunImage.src = 'assets/singularity-justice-gun.png';

const view = { w: 720, h: 1280 };
const target = { x: 150, y: 650, radius: 42, type: 'bottle', phase: 0 };
const state = {
  ammo: 12, score: 0, combo: 0, time: 30, running: true, gunY: 650,
  direction: 1, last: 0, recoil: 0, flash: 0, bullet: null, stuckBullets: [],
  particles: [], spawn: 0, shake: 0, message: '', messageAge: 0,
};
const plate = { left: 250, right: 680, stopX: 465 };

function resize() {
  const rect = shell.getBoundingClientRect();
  canvas.width = Math.round(rect.width * devicePixelRatio);
  canvas.height = Math.round(rect.height * devicePixelRatio);
  ctx.setTransform(devicePixelRatio * rect.width / view.w, 0, 0, devicePixelRatio * rect.height / view.h, 0, 0);
}

function reset() {
  Object.assign(state, { ammo: 12, score: 0, combo: 0, time: 30, running: true, gunY: 650,
    direction: 1, last: 0, recoil: 0, flash: 0, bullet: null, stuckBullets: [], particles: [],
    spawn: 0, shake: 0, message: '', messageAge: 0 });
  newTarget();
  overlay.classList.add('hidden');
  updateHud();
}

function newTarget() {
  target.y = 285 + Math.random() * 730;
  target.phase = Math.random() * Math.PI * 2;
  const roll = Math.random();
  target.type = roll < .16 ? 'bomb' : roll < .34 ? 'gold' : 'bottle';
}

function updateHud() {
  ammoEl.textContent = state.ammo;
  scoreEl.textContent = state.score;
  comboEl.textContent = `连击 x${Math.max(1, state.combo)}`;
  timerEl.textContent = `${Math.max(0, state.time).toFixed(1)}s`;
  timerEl.style.color = state.time < 8 ? '#ff604b' : '#fff';
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, view.w, 0);
  gradient.addColorStop(0, '#202d31'); gradient.addColorStop(.55, '#6b6e68'); gradient.addColorStop(1, '#24282a');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, view.w, view.h);
  ctx.fillStyle = '#11191dcc'; ctx.fillRect(0, 0, view.w, view.h);
  ctx.fillStyle = '#25292b'; ctx.fillRect(205, 0, 36, view.h);
  ctx.fillStyle = '#777b7b'; ctx.fillRect(216, 0, 14, view.h);
  ctx.fillStyle = '#a6a293'; ctx.fillRect(58, 0, 12, view.h);
  for (let y = 0; y < view.h; y += 78) { ctx.fillStyle = '#c5c0ac'; ctx.fillRect(96, y + 8, 6, 45); }
  ctx.fillStyle = '#ffffff13'; ctx.fillRect(25, target.y - 48, 670, 96);
  ctx.fillStyle = '#687074'; ctx.fillRect(plate.left, target.y - 41, plate.right - plate.left, 82);
  ctx.fillStyle = '#a8b0af'; ctx.fillRect(plate.left, target.y - 39, plate.right - plate.left, 5);
  ctx.fillStyle = '#3a4043'; ctx.fillRect(plate.left, target.y + 34, plate.right - plate.left, 5);
  ctx.strokeStyle = '#293033'; ctx.lineWidth = 3; ctx.strokeRect(plate.left, target.y - 41, plate.right - plate.left, 82);
  ctx.strokeStyle = target.type === 'bomb' ? '#ff574d' : '#ffd52d'; ctx.lineWidth = 3; ctx.setLineDash([12, 12]);
  ctx.beginPath(); ctx.moveTo(25, target.y); ctx.lineTo(695, target.y); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffd52d'; ctx.font = 'bold 18px Arial'; ctx.fillText('目标线', 565, target.y - 59);
}

function drawBottle() {
  const color = target.type === 'gold' ? '#d69a20' : target.type === 'bomb' ? '#9c302d' : '#2b8b34';
  ctx.save(); ctx.translate(target.x, target.y); ctx.rotate(Math.sin(target.phase) * .05);
  ctx.strokeStyle = '#c3c3b3'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -170); ctx.lineTo(0, -58); ctx.stroke();
  ctx.fillStyle = '#b8b8a6'; ctx.fillRect(-15, -175, 30, 10);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-24, -50); ctx.lineTo(24, -50); ctx.lineTo(34, -28); ctx.lineTo(34, 56); ctx.quadraticCurveTo(0, 76, -34, 56); ctx.lineTo(-34, -28); ctx.closePath(); ctx.fill();
  ctx.fillStyle = target.type === 'bomb' ? '#e4473c' : target.type === 'gold' ? '#f6c735' : '#64bd37'; ctx.fillRect(-26, -40, 52, 88);
  ctx.fillStyle = target.type === 'bomb' ? '#fff' : '#f5d865'; ctx.fillRect(-29, 0, 58, 29);
  ctx.strokeStyle = '#b08726'; ctx.lineWidth = 3; ctx.strokeRect(-29, 0, 58, 29);
  ctx.fillStyle = target.type === 'bomb' ? '#b51f25' : '#fff'; ctx.font = 'bold 17px Arial'; ctx.textAlign = 'center'; ctx.fillText(target.type === 'bomb' ? '危险' : target.type === 'gold' ? '金奖' : '啤酒', 0, 20);
  ctx.restore();
}

function drawGun() {
  const y = state.gunY;
  if (gunImage.complete && gunImage.naturalWidth) {
    ctx.save(); ctx.globalAlpha = .98; ctx.drawImage(gunImage, 350 + state.recoil * 18, y - 120, 430, 242); ctx.restore();
  }
  if (state.flash > 0) { ctx.fillStyle = `rgba(255,225,105,${state.flash})`; ctx.beginPath(); ctx.moveTo(402, y - 28); ctx.lineTo(350, y - 58); ctx.lineTo(375, y); ctx.lineTo(350, y + 58); ctx.lineTo(415, y + 28); ctx.closePath(); ctx.fill(); }
}

function drawBullets() {
  state.stuckBullets.forEach((bullet) => { ctx.save(); ctx.translate(bullet.x, bullet.y); ctx.rotate(-.15); ctx.fillStyle = '#202629'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#d9942f'; ctx.fillRect(-2, -4, 16, 8); ctx.fillStyle = '#f7c85c'; ctx.fillRect(12, -3, 5, 6); ctx.restore(); });
  if (!state.bullet) return;
  ctx.fillStyle = '#f0b13b'; ctx.beginPath(); ctx.arc(state.bullet.x, state.bullet.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff2a0'; ctx.fillRect(state.bullet.x + 7, state.bullet.y - 2, 18, 4);
}

function drawParticles() {
  state.particles.forEach((p) => { ctx.globalAlpha = Math.max(0, 1 - p.age / p.life); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); }); ctx.globalAlpha = 1;
  if (state.messageAge > 0) { ctx.fillStyle = state.message.startsWith('危险') ? '#ff624f' : '#ffe064'; ctx.font = 'bold 32px Arial'; ctx.textAlign = 'center'; ctx.fillText(state.message, 215, target.y - 85 - (1 - state.messageAge) * 30); }
}

function burst(hit) {
  const colors = hit ? ['#6bd044', '#f5d865', '#c9f7b3'] : ['#ff624f', '#ffad3d', '#fff'];
  for (let i = 0; i < 24; i++) state.particles.push({ x: target.x, y: target.y, size: 4 + Math.random() * 8, age: 0, life: .45 + Math.random() * .6, vx: (Math.random() - .5) * 280, vy: (Math.random() - .5) * 280, color: colors[i % colors.length] });
}

function shoot() {
  if (!state.running || state.bullet || state.ammo <= 0) return;
  state.ammo--; state.recoil = 1; state.flash = 1; state.bullet = { x: 405, y: state.gunY, speed: 1100 }; updateHud();
}

function resolveShot() {
  const aligned = Math.abs(state.bullet.y - target.y) < 34;
  state.bullet = null;
  if (aligned) {
    if (target.type === 'bomb') { state.score = Math.max(0, state.score - 150); state.combo = 0; state.message = '危险目标！-150'; }
    else { state.combo++; const points = (target.type === 'gold' ? 250 : 100) * Math.max(1, state.combo); state.score += points; state.ammo = Math.min(15, state.ammo + 1); state.message = target.type === 'gold' ? `金奖 +${points}` : `精准 +${points}`; }
    state.messageAge = 1; state.shake = 8; burst(target.type !== 'bomb'); newTarget();
  } else { state.combo = 0; state.message = '脱靶'; state.messageAge = 1; state.stuckBullets.push({ x: plate.stopX, y: target.y - 25 + Math.random() * 50 }); }
  updateHud();
}

function finish() {
  state.running = false; state.bullet = null; resultTitle.textContent = state.score >= 1000 ? '清场高手' : '还差一点'; resultCopy.textContent = '本局结束，看看你的精准度'; finalScore.textContent = `${state.score} 分 · 连击记录 ${state.combo}x`; overlay.classList.remove('hidden');
}

function update(dt) {
  state.recoil = Math.max(0, state.recoil - dt * 7); state.flash = Math.max(0, state.flash - dt * 10); state.messageAge = Math.max(0, state.messageAge - dt); state.shake = Math.max(0, state.shake - dt * 30);
  if (!state.running) return;
  state.time -= dt; state.spawn += dt; target.phase += dt * 2.4; target.y += Math.sin(target.phase) * dt * 32;
  if (target.y < 275 || target.y > 1015) target.y = Math.max(275, Math.min(1015, target.y));
  state.gunY += state.direction * (180 + state.combo * 8) * dt; if (state.gunY > 1030) { state.gunY = 1030; state.direction = -1; } if (state.gunY < 250) { state.gunY = 250; state.direction = 1; }
  if (state.bullet) { state.bullet.x -= state.bullet.speed * dt; if (state.bullet.x <= target.x + target.radius) resolveShot(); }
  state.particles.forEach((p) => { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; }); state.particles = state.particles.filter((p) => p.age < p.life);
  if (state.time <= 0 || (state.ammo <= 0 && !state.bullet)) finish(); updateHud();
}

function frame(time) {
  const dt = Math.min((time - state.last) / 1000 || 0, .04); state.last = time; update(dt); ctx.save(); if (state.shake) ctx.translate((Math.random() - .5) * state.shake, (Math.random() - .5) * state.shake); drawBackground(); drawBottle(); drawBullets(); drawParticles(); drawGun(); ctx.restore(); requestAnimationFrame(frame);
}

canvas.addEventListener('pointerdown', shoot); trigger.addEventListener('click', shoot); restart.addEventListener('click', reset); window.addEventListener('resize', resize); resize(); reset(); requestAnimationFrame(frame);
