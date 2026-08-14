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
const qVal = document.getElementById('q-val');
const particlesGroup = document.getElementById('particles');

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

function updateReadout() {
  const Q = dP / R;
  dpVal.textContent = Math.round(dP);
  rVal.textContent = R.toFixed(1);
  qVal.textContent = Math.round(Q);
  pressureHandle.setAttribute('cy', 100 - (dP - 50) * 0.6);
  const width = 15 + R * 15;
  resistanceHandle.setAttribute('width', width);
  resistanceHandle.setAttribute('x', 200 - width / 2);
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
    const scaleY = 200 / rect.height;
    const y = (e.clientY - rect.top) * scaleY;
    onDrag(y);
    updateReadout();
  });
  handle.addEventListener('pointerup', () => dragging = false);
}

makeDraggable(pressureHandle, y => {
  dP = Math.max(10, Math.min(90, 50 + (100 - y) / 0.6));
});

makeDraggable(resistanceHandle, y => {
  const dist = Math.abs(y - 100);
  R = Math.max(0.4, Math.min(3.0, 0.4 + dist / 20));
});

document.querySelectorAll('.opt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
    const correct = btn.dataset.correct === 'true';
    btn.classList.add(correct ? 'correct' : 'wrong');
    const result = document.getElementById('trap-result');
    result.classList.remove('hidden');
    if (correct) {
      result.textContent = 'Correct. Q = ΔP / R. Double the resistance, halve the flow, even if pressure never moves. Most students fixate on upstream pressure and miss the gradient doing the actual work.';
    } else {
      const correctBtn = document.querySelector('.opt-btn[data-correct="true"]');
      correctBtn.classList.add('correct');
      result.textContent = 'Actually, flow drops by half. Q = ΔP / R: resistance doubles, flow halves, even with pressure unchanged. This is the exact mix-up 95-99% of physiology students make.';
    }
  });
});
