const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const shell = document.querySelector('.game-shell');
const ammoEl = document.querySelector('#ammo');
const scoreEl = document.querySelector('#score');
const trigger = document.querySelector('#trigger');
const overlay = document.querySelector('#overlay');
const resultTitle = document.querySelector('#result-title');
const resultCopy = document.querySelector('#result-copy');
const restart = document.querySelector('#restart');
const gunImage = new Image();
gunImage.src = 'assets/singularity-justice-gun.png';

const view = { w: 720, h: 1280 };
const state = {
  ammo: 5,
  running: true,
  gunY: 650,
  direction: 1,
  last: 0,
  recoil: 0,
  flash: 0,
  bullet: null,
  stuckBullets: [],
  shatter: null,
  hit: false,
};
const bottle = { x: 150, y: 650, radius: 42 };
const hitWindow = { top: 616, bottom: 684 };
const steelPlate = { left: 250, right: 680, stopX: 465 };

function resize() {
  const rect = shell.getBoundingClientRect();
  canvas.width = Math.round(rect.width * devicePixelRatio);
  canvas.height = Math.round(rect.height * devicePixelRatio);
  ctx.setTransform(devicePixelRatio * rect.width / view.w, 0, 0, devicePixelRatio * rect.height / view.h, 0, 0);
}

function reset() {
  state.ammo = 5;
  state.running = true;
  state.gunY = 650;
  state.direction = 1;
  state.last = 0;
  state.recoil = 0;
  state.flash = 0;
  state.bullet = null;
  state.stuckBullets = [];
  state.shatter = null;
  state.hit = false;
  overlay.classList.add('hidden');
  updateHud();
}

function updateHud() {
  ammoEl.textContent = state.ammo;
  scoreEl.textContent = state.hit ? '命中' : '等待时机';
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, view.w, 0);
  gradient.addColorStop(0, '#3d4244');
  gradient.addColorStop(.5, '#777a78');
  gradient.addColorStop(1, '#25292c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.w, view.h);

  ctx.fillStyle = '#25292b';
  ctx.fillRect(205, 0, 36, view.h);
  ctx.fillStyle = '#777b7b';
  ctx.fillRect(216, 0, 14, view.h);
  ctx.fillStyle = '#a6a293';
  ctx.fillRect(58, 0, 12, view.h);
  ctx.fillStyle = '#585d5d';
  ctx.fillRect(76, 0, 8, view.h);
  for (let y = 0; y < view.h; y += 78) {
    ctx.fillStyle = '#c5c0ac';
    ctx.fillRect(96, y + 8, 6, 45);
    ctx.fillStyle = '#4d5354';
    ctx.fillRect(108, y + 32, 5, 42);
  }

  ctx.fillStyle = '#171a1dcc';
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.fillStyle = '#ffffff18';
  ctx.fillRect(25, hitWindow.top, 670, hitWindow.bottom - hitWindow.top);
  ctx.fillStyle = '#687074';
  ctx.fillRect(steelPlate.left, hitWindow.top + 7, steelPlate.right - steelPlate.left, hitWindow.bottom - hitWindow.top - 14);
  ctx.fillStyle = '#a8b0af';
  ctx.fillRect(steelPlate.left, hitWindow.top + 9, steelPlate.right - steelPlate.left, 5);
  ctx.fillStyle = '#3a4043';
  ctx.fillRect(steelPlate.left, hitWindow.bottom - 14, steelPlate.right - steelPlate.left, 5);
  ctx.strokeStyle = '#293033';
  ctx.lineWidth = 3;
  ctx.strokeRect(steelPlate.left, hitWindow.top + 7, steelPlate.right - steelPlate.left, hitWindow.bottom - hitWindow.top - 14);
  ctx.strokeStyle = '#ffd52d';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(25, bottle.y);
  ctx.lineTo(695, bottle.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffd52d';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('命中区', 565, hitWindow.top - 14);
}

function drawBottle() {
  if (state.shatter) return;
  ctx.save();
  ctx.translate(bottle.x, bottle.y);
  ctx.strokeStyle = '#c3c3b3';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, -170);
  ctx.lineTo(0, -58);
  ctx.stroke();
  ctx.fillStyle = '#b8b8a6';
  ctx.fillRect(-15, -175, 30, 10);
  ctx.fillStyle = '#2b8b34';
  ctx.beginPath();
  ctx.moveTo(-24, -50);
  ctx.lineTo(24, -50);
  ctx.lineTo(34, -28);
  ctx.lineTo(34, 56);
  ctx.quadraticCurveTo(0, 76, -34, 56);
  ctx.lineTo(-34, -28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#64bd37';
  ctx.fillRect(-26, -40, 52, 88);
  ctx.fillStyle = '#f5d865';
  ctx.fillRect(-29, 0, 58, 29);
  ctx.strokeStyle = '#b08726';
  ctx.lineWidth = 3;
  ctx.strokeRect(-29, 0, 58, 29);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('啤酒', 0, 20);
  ctx.restore();
}

function drawGun() {
  const x = 585 + state.recoil * 18;
  const y = state.gunY;
  if (gunImage.complete && gunImage.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = .98;
    ctx.drawImage(gunImage, 350 + state.recoil * 18, y - 120, 430, 242);
    ctx.restore();
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 225, 105, ${state.flash})`;
      ctx.beginPath();
      ctx.moveTo(402, y - 28);
      ctx.lineTo(350, y - 58);
      ctx.lineTo(375, y);
      ctx.lineTo(350, y + 58);
      ctx.lineTo(415, y + 28);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#1d2022';
  ctx.fillRect(-180, -25, 170, 50);
  ctx.fillStyle = '#626565';
  ctx.fillRect(-174, -14, 142, 12);
  ctx.fillStyle = '#aeb5b3';
  ctx.fillRect(-166, -11, 105, 4);
  ctx.fillStyle = '#111415';
  ctx.fillRect(-95, -25, 8, 50);
  ctx.fillStyle = '#474c4e';
  ctx.fillRect(-48, -21, 18, 42);
  ctx.fillStyle = '#191b1d';
  ctx.beginPath();
  ctx.moveTo(-24, 18);
  ctx.lineTo(42, 28);
  ctx.lineTo(76, 150);
  ctx.lineTo(12, 166);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3d4446';
  ctx.beginPath();
  ctx.moveTo(2, 30);
  ctx.lineTo(38, 35);
  ctx.lineTo(60, 136);
  ctx.lineTo(25, 145);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#151718';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(17, 49);
  ctx.lineTo(46, 137);
  ctx.stroke();
  ctx.fillStyle = '#e9a27d';
  ctx.beginPath();
  ctx.arc(28, 92, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 225, 105, ${state.flash})`;
    ctx.beginPath();
    ctx.moveTo(395, y - 28);
    ctx.lineTo(350, y - 58);
    ctx.lineTo(375, y);
    ctx.lineTo(350, y + 58);
    ctx.lineTo(415, y + 28);
    ctx.closePath();
    ctx.fill();
  }
}

function drawShatter() {
  if (!state.shatter) return;
  const burst = state.shatter;
  burst.particles.forEach((particle) => {
    const life = Math.max(0, 1 - burst.age / particle.life);
    if (life <= 0) return;
    const x = bottle.x + particle.x * burst.age;
    const y = bottle.y + particle.y * burst.age + 280 * burst.age * burst.age;
    ctx.save();
    ctx.globalAlpha = life;
    ctx.translate(x, y);
    ctx.rotate(particle.spin * burst.age);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.moveTo(-particle.size, particle.size);
    ctx.lineTo(particle.size, 0);
    ctx.lineTo(0, -particle.size * 1.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  ctx.globalAlpha = Math.max(0, 1 - burst.age / .75);
  ctx.strokeStyle = '#f3d36a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(bottle.x, bottle.y, 38 + burst.age * 65, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawBullet() {
  state.stuckBullets.forEach((bullet) => {
    ctx.save();
    ctx.translate(bullet.x, bullet.y);
    ctx.rotate(-.15);
    ctx.fillStyle = '#d9942f';
    ctx.fillRect(-5, -4, 18, 8);
    ctx.fillStyle = '#ffe5a2';
    ctx.fillRect(10, -3, 5, 6);
    ctx.fillStyle = '#202629';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9942f';
    ctx.fillRect(-2, -4, 16, 8);
    ctx.fillStyle = '#f7c85c';
    ctx.fillRect(12, -3, 5, 6);
    ctx.restore();
  });
  if (!state.bullet) return;
  ctx.fillStyle = '#f0b13b';
  ctx.beginPath();
  ctx.arc(state.bullet.x, state.bullet.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff2a0';
  ctx.fillRect(state.bullet.x + 7, state.bullet.y - 2, 18, 4);
}

function shoot() {
  if (!state.running || state.hit || state.bullet || state.ammo <= 0) return;
  state.ammo -= 1;
  state.recoil = 1;
  state.flash = 1;
  state.bullet = { x: 405, y: state.gunY, speed: 1100 };
  updateHud();
}

function createShatter() {
  const colors = ['#6bd044', '#a4e66a', '#f5d865', '#c9f7b3', '#e1f4d0'];
  return {
    age: 0,
    particles: Array.from({ length: 20 }, (_, index) => ({
      x: (Math.random() - .5) * 120,
      y: (Math.random() - .8) * 170,
      size: 4 + Math.random() * 7,
      spin: (Math.random() - .5) * 8,
      life: .75 + Math.random() * .65,
      color: colors[index % colors.length],
    })),
  };
}

function finish(success) {
  state.running = false;
  state.bullet = null;
  resultTitle.textContent = success ? '挑战成功' : '挑战失败';
  resultCopy.textContent = success ? '在命中区击中了啤酒瓶' : '只有经过中间命中区时才能击中';
  overlay.classList.remove('hidden');
}

function update(dt) {
  state.recoil = Math.max(0, state.recoil - dt * 7);
  state.flash = Math.max(0, state.flash - dt * 10);
  if (!state.running) return;
  state.gunY += state.direction * 190 * dt;
  if (state.gunY > 1030) { state.gunY = 1030; state.direction = -1; }
  if (state.gunY < 250) { state.gunY = 250; state.direction = 1; }
  if (state.bullet) {
    state.bullet.x -= state.bullet.speed * dt;
    if (state.bullet.x <= bottle.x + bottle.radius) {
      const aligned = state.bullet.y >= hitWindow.top && state.bullet.y <= hitWindow.bottom;
      const impactX = state.bullet.x;
      state.bullet = null;
      if (aligned) {
        state.hit = true;
        state.shatter = createShatter();
        updateHud();
      } else {
        state.stuckBullets.push({
          x: steelPlate.stopX,
          y: hitWindow.top + 20 + Math.random() * (hitWindow.bottom - hitWindow.top - 40),
        });
      }
      if (!state.hit && state.ammo === 0) finish(false);
    }
  }
  if (state.shatter) {
    state.shatter.age += dt;
    if (state.shatter.age > 1.1) finish(true);
  }
}

function frame(time) {
  const dt = Math.min((time - state.last) / 1000 || 0, .04);
  state.last = time;
  update(dt);
  drawBackground();
  drawBottle();
  drawBullet();
  drawShatter();
  drawGun();
  requestAnimationFrame(frame);
}

canvas.addEventListener('pointerdown', shoot);
trigger.addEventListener('click', shoot);
restart.addEventListener('click', reset);
window.addEventListener('resize', resize);
resize();
reset();
requestAnimationFrame(frame);
