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

const trapQuestions = [
  {
    text: "If resistance in this tube doubles while the pressure gradient stays exactly the same, what happens to flow?",
    options: [
      { label: "Flow stays the same", correct: false },
      { label: "Flow increases", correct: false },
      { label: "Flow drops by half", correct: true }
    ],
    correctMsg: "Correct. Q = ΔP / R. Double the resistance, halve the flow, even if pressure never moves. Most students fixate on upstream pressure and miss the gradient doing the actual work.",
    wrongMsg: "Actually, flow drops by half. Q = ΔP / R: resistance doubles, flow halves, even with pressure unchanged. This is the exact mix-up most physiology students make."
  },
  {
    text: "Pressure at the start of the tube increases, but resistance also increases by the same proportion. What happens to flow?",
    options: [
      { label: "Flow increases", correct: false },
      { label: "Flow stays the same", correct: true },
      { label: "Flow drops to zero", correct: false }
    ],
    correctMsg: "Correct. Flow depends on the ratio of pressure to resistance, not either value alone. If both scale together, Q stays fixed. This is why absolute pressure readings alone never tell the whole story.",
    wrongMsg: "Actually, flow stays the same. Q = ΔP / R: if pressure and resistance rise by the same factor, they cancel out. This is the trap of reading pressure in isolation."
  }
];

let trapIndex = 0;

function renderTrap() {
  const q = trapQuestions[trapIndex];
  document.getElementById('trap-question').textContent = q.text;
  const optsDiv = document.getElementById('trap-options');
  optsDiv.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.textContent = opt.label;
    btn.dataset.correct = opt.correct;
    btn.addEventListener('click', () => handleTrapAnswer(btn, opt.correct, q));
    optsDiv.appendChild(btn);
  });
  document.getElementById('trap-result').classList.add('hidden');
  document.getElementById('trap-result').innerHTML = '';
}

function handleTrapAnswer(btn, correct, q) {
  document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
  btn.classList.add(correct ? 'correct' : 'wrong');
  const result = document.getElementById('trap-result');
  result.classList.remove('hidden');
  if (correct) {
    result.textContent = q.correctMsg;
  } else {
    const correctBtn = document.querySelector('.opt-btn[data-correct="true"]');
    correctBtn.classList.add('correct');
    result.textContent = q.wrongMsg;
  }
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn-primary';
  nextBtn.textContent = trapIndex < trapQuestions.length - 1 ? 'Next question' : 'Back to tube';
  nextBtn.style.marginTop = '16px';
  nextBtn.addEventListener('click', () => {
    if (trapIndex < trapQuestions.length - 1) {
      trapIndex++;
      renderTrap();
    } else {
      trapIndex = 0;
      showScreen('module');
    }
  });
  result.appendChild(document.createElement('br'));
  result.appendChild(nextBtn);
}

renderTrap();
