const screens = document.querySelectorAll('.screen');
function showScreen(id) {
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

document.getElementById('start-btn').addEventListener('click', () => showScreen('module'));
document.getElementById('to-trap-btn').addEventListener('click', () => showScreen('trap'));

let dP = 50;
let R = 1.0;
const tubeLeft = 60, tubeRight = 340;

const pressureHandle = document.getElementById('pressure-handle');
const resistanceHandle = document.getElementById('resistance-handle');
const dpVal = document.getElementById('dp-val');
const rVal = document.getElementById('r-val');
const flowBarFill = document.getElementById('flow-bar-fill');
const particlesGroup = document.getElementById('particles');

function wordFor(value, low, mid, high, lowMax, highMin) {
  if (value <= lowMax) return low;
  if (value >= highMin) return high;
  return mid;
}

const NUM_PARTICLES = 8;
let particles = [];
for (let i = 0; i < NUM_PARTICLES; i++) {
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('r', 5);
  c.setAttribute('fill', '#f2ede3');
  c.setAttribute('cy', 100);
  particlesGroup.appendChild(c);
  particles.push({ el: c, t: i / NUM_PARTICLES });
}

const Q_MIN = 10 / 3.0;
const Q_MAX = 90 / 0.4;

function updateReadout() {
  const Q = dP / R;
  dpVal.textContent = wordFor(dP, 'light', 'medium', 'strong', 30, 70);
  rVal.textContent = wordFor(R, 'loose', 'medium', 'tight', 0.9, 2.0);
  const pct = Math.max(4, Math.min(100, ((Q - Q_MIN) / (Q_MAX - Q_MIN)) * 100));
  flowBarFill.style.width = pct + '%';
  pressureHandle.setAttribute('cy', 100 - (dP - 50) * 0.6);
  const width = 15 + R * 15;
  resistanceHandle.setAttribute('width', width);
  resistanceHandle.setAttribute('x', 200 - width / 2);
  resistanceHandle.setAttribute('height', 20 + R * 20);
  resistanceHandle.setAttribute('y', 100 - (20 + R * 20) / 2);
}

function animate() {
  const Q = dP / R;
  const speed = Math.max(0.15, Q / 300);
  particles.forEach(p => {
    p.t += speed * 0.01;
    if (p.t > 1) p.t -= 1;
    const x = tubeLeft + p.t * (tubeRight - tubeLeft);
    p.el.setAttribute('cx', x);
  });
  requestAnimationFrame(animate);
}
animate();
updateReadout();

function makeDraggable(handle, onDrag) {
  let dragging = false;
  handle.addEventListener('pointerdown', e => {
    dragging = true;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', e => {
    if (!dragging) return;
    const svg = document.getElementById('tube-svg');
    const rect = svg.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 200 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    onDrag(x, y);
    updateReadout();
  });
  handle.addEventListener('pointerup', () => dragging = false);
}

makeDraggable(pressureHandle, (x, y) => {
  dP = Math.max(10, Math.min(90, 50 + (100 - y) / 0.6));
});

makeDraggable(resistanceHandle, (x, y) => {
  const dist = Math.abs(y - 100);
  R = Math.max(0.4, Math.min(3.0, 0.4 + dist / 12));
});

document.getElementById('tighten-btn').addEventListener('click', () => {
  R = 3.0;
  updateReadout();
});
document.getElementById('loosen-btn').addEventListener('click', () => {
  R = 0.4;
  updateReadout();
});

let trapAnswered = false;

document.querySelectorAll('.opt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (trapAnswered) return;
    trapAnswered = true;
    document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
    const correct = btn.dataset.correct === 'true';
    btn.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) {
      const correctBtn = document.querySelector('.opt-btn[data-correct="true"]');
      correctBtn.classList.add('correct');
    }
    playReplay(correct);
  });
});

function playReplay(wasCorrect) {
  const replaySvg = document.getElementById('replay-svg');
  const replayGroup = document.getElementById('replay-particles');
  const replayResistance = document.getElementById('replay-resistance');
  replaySvg.classList.remove('hidden');
  replayGroup.innerHTML = '';

  let rParticles = [];
  for (let i = 0; i < 8; i++) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('r', 5);
    c.setAttribute('fill', '#f2ede3');
    c.setAttribute('cy', 100);
    replayGroup.appendChild(c);
    rParticles.push({ el: c, t: i / 8 });
  }

  let squeeze = 0.4;
  let frame = 0;
  const totalFrames = 90;

  function step() {
    frame++;
    if (frame < totalFrames) {
      squeeze = 0.4 + (3.0 - 0.4) * (frame / totalFrames);
    } else {
      squeeze = 3.0;
    }
    const width = 15 + squeeze * 15;
    replayResistance.setAttribute('width', width);
    replayResistance.setAttribute('x', 200 - width / 2);
    replayResistance.setAttribute('height', 20 + squeeze * 20);
    replayResistance.setAttribute('y', 100 - (20 + squeeze * 20) / 2);

    const Q = 50 / squeeze;
    const speed = Math.max(0.15, Q / 300);
    rParticles.forEach(p => {
      p.t += speed * 0.01;
      if (p.t > 1) p.t -= 1;
      const x = 60 + p.t * (340 - 60);
      p.el.setAttribute('cx', x);
    });

    if (frame < 240) {
      requestAnimationFrame(step);
    }
  }
  step();

  const result = document.getElementById('trap-result');
  result.classList.remove('hidden');
  if (wasCorrect) {
    result.textContent = 'Right. Watch the dots slow down as the tube tightens, even though the push never changed. Squeeze the tube more, and less gets through, every time.';
  } else {
    result.textContent = 'Watch what actually happens: the dots slow down as the tube tightens, even with the push staying the same. This is the exact mix-up most students make, focusing on the push and missing the squeeze.';
  }
}
