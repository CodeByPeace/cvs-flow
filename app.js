const screens = document.querySelectorAll('.screen');
function showScreen(id) {
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.back));
});

document.querySelectorAll('[data-open]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.open;
    showScreen(target + '-landing');
  });
});

const PROGRESS_KEY = 'cvs-flow-progress';
function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function setDone(moduleId) {
  const p = getProgress();
  p[moduleId] = true;
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {}
  renderBadges();
}
function renderBadges() {
  const p = getProgress();
  const flowBadge = document.getElementById('badge-flow');
  const loopBadge = document.getElementById('badge-loop');
  if (p.flow) { flowBadge.textContent = 'Completed'; flowBadge.classList.add('done'); }
  if (p.loop) { loopBadge.textContent = 'Completed'; loopBadge.classList.add('done'); }
}
renderBadges();

document.getElementById('flow-start-btn').addEventListener('click', () => showScreen('flow-module'));
document.getElementById('to-trap-btn').addEventListener('click', () => showScreen('flow-trap'));

const VESSEL_LEFT = 70;
const VESSEL_RIGHT = 350;
const VESSEL_CENTER = (VESSEL_LEFT + VESSEL_RIGHT) / 2;
const NARROW_SPAN = 45;
const BASE_HALF = 28;

function halfGapAt(x, gap) {
  const dist = Math.abs(x - VESSEL_CENTER);
  if (dist > NARROW_SPAN) return BASE_HALF;
  const t = dist / NARROW_SPAN;
  const eased = t * t * (3 - 2 * t);
  return (gap / 2) + (BASE_HALF - gap / 2) * eased;
}

function buildVesselPaths(gap) {
  let top = 'M ' + VESSEL_LEFT + ' ' + (110 - BASE_HALF);
  let bottom = 'M ' + VESSEL_LEFT + ' ' + (110 + BASE_HALF);
  let fill = 'M ' + VESSEL_LEFT + ' ' + (110 - BASE_HALF);
  for (let x = VESSEL_LEFT; x <= VESSEL_RIGHT; x += 4) {
    const h = halfGapAt(x, gap);
    top += ' L ' + x + ' ' + (110 - h);
    fill += ' L ' + x + ' ' + (110 - h);
  }
  for (let x = VESSEL_RIGHT; x >= VESSEL_LEFT; x -= 4) {
    const h = halfGapAt(x, gap);
    bottom += ' L ' + x + ' ' + (110 + h);
    fill += ' L ' + x + ' ' + (110 + h);
  }
  fill += ' Z';
  return { top, bottom, fill };
}

function flowFor(push, gap) {
  const radius = gap / 2;
  const resistance = 1 / Math.pow(radius, 4);
  const K = 1200;
  return push / (resistance * K);
}

function wordFor(v, lowMax, highMin, low, mid, high) {
  if (v <= lowMax) return low;
  if (v >= highMin) return high;
  return mid;
}

function makeParticles(group, n, color) {
  let arr = [];
  for (let i = 0; i < n; i++) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('r', 5);
    c.setAttribute('fill', color);
    group.appendChild(c);
    arr.push({ el: c, t: i / n });
  }
  return arr;
}

(function flowModule() {
  const pushSlider = document.getElementById('push-slider');
  const squeezeSlider = document.getElementById('squeeze-slider');
  const pushOut = document.getElementById('push-out');
  const squeezeOut = document.getElementById('squeeze-out');
  const flowWord = document.getElementById('flow-word');
  const vesselTop = document.getElementById('vessel-top');
  const vesselBottom = document.getElementById('vessel-bottom');
  const vesselFill = document.getElementById('vessel-fill');
  const particleGroup = document.getElementById('particles');

  const particles = makeParticles(particleGroup, 10, '#E24B4A');

  function updateVessel() {
    const gap = parseFloat(squeezeSlider.value);
    const paths = buildVesselPaths(gap);
    vesselTop.setAttribute('d', paths.top);
    vesselBottom.setAttribute('d', paths.bottom);
    vesselFill.setAttribute('d', paths.fill);
  }

  function updateReadout() {
    const push = parseFloat(pushSlider.value);
    const gap = parseFloat(squeezeSlider.value);
    pushOut.textContent = wordFor(push, 30, 70, 'light', 'medium', 'strong');
    squeezeOut.textContent = wordFor(gap, 10, 22, 'tight', 'medium', 'loose');
    const Q = flowFor(push, gap);
    flowWord.textContent = wordFor(Q, 0.6, 4, 'barely any flow', 'medium flow', 'fast flow');
    updateVessel();
  }

  pushSlider.addEventListener('input', updateReadout);
  squeezeSlider.addEventListener('input', updateReadout);

  document.getElementById('tighten-btn').addEventListener('click', () => {
    squeezeSlider.value = 6;
    updateReadout();
  });
  document.getElementById('loosen-btn').addEventListener('click', () => {
    squeezeSlider.value = 30;
    updateReadout();
  });

  function animate() {
    const push = parseFloat(pushSlider.value);
    const gap = parseFloat(squeezeSlider.value);
    const Q = flowFor(push, gap);
    const speed = Math.max(0.02, Math.min(1.4, Q / 3));
    particles.forEach(p => {
      p.t += speed * 0.006;
      if (p.t > 1) p.t -= 1;
      const x = VESSEL_LEFT + p.t * (VESSEL_RIGHT - VESSEL_LEFT);
      const h = halfGapAt(x, gap);
      p.el.setAttribute('cx', x);
      p.el.setAttribute('cy', 110);
      p.el.setAttribute('r', Math.max(2.5, Math.min(5, h / 6)));
    });
    requestAnimationFrame(animate);
  }

  updateReadout();
  animate();
})();

let flowTrapAnswered = false;

document.querySelectorAll('#trap-options .opt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (flowTrapAnswered) return;
    flowTrapAnswered = true;
    document.querySelectorAll('#trap-options .opt-btn').forEach(b => b.disabled = true);
    const correct = btn.dataset.correct === 'true';
    btn.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) {
      document.querySelector('#trap-options .opt-btn[data-correct="true"]').classList.add('correct');
    }
    playFlowReplay();
    setDone('flow');
    document.getElementById('flow-done-btn').classList.remove('hidden');
  });
});

document.getElementById('flow-done-btn').addEventListener('click', () => showScreen('home'));

function playFlowReplay() {
  const replaySvg = document.getElementById('replay-svg');
  const replayTop = document.getElementById('replay-top');
  const replayBottom = document.getElementById('replay-bottom');
  const replayFill = document.getElementById('replay-fill');
  const replayGroup = document.getElementById('replay-particles');
  replaySvg.classList.remove('hidden');
  replayGroup.innerHTML = '';

  const particles = makeParticles(replayGroup, 10, '#E24B4A');
  let frame = 0;

  function step() {
    frame++;
    const t = Math.min(1, frame / 100);
    const gap = 30 - (30 - 6) * t;
    const paths = buildVesselPaths(gap);
    replayTop.setAttribute('d', paths.top);
    replayBottom.setAttribute('d', paths.bottom);
    replayFill.setAttribute('d', paths.fill);

    const Q = flowFor(50, gap);
    const speed = Math.max(0.02, Math.min(1.4, Q / 3));
    particles.forEach(p => {
      p.t += speed * 0.006;
      if (p.t > 1) p.t -= 1;
      const x = VESSEL_LEFT + p.t * (VESSEL_RIGHT - VESSEL_LEFT);
      const h = halfGapAt(x, gap);
      p.el.setAttribute('cx', x);
      p.el.setAttribute('cy', 110);
      p.el.setAttribute('r', Math.max(2.5, Math.min(5, h / 6)));
    });

    if (frame < 260) requestAnimationFrame(step);
  }
  step();

  document.getElementById('trap-result').classList.remove('hidden');
  document.getElementById('trap-result').textContent = 'Watch how fast the flow drops as the vessel narrows, even though the push from the heart never changed. Blood flow depends on the radius raised to the fourth power, so even a small squeeze causes a huge drop, not a small one.';
}

document.getElementById('loop-start-btn').addEventListener('click', () => showScreen('loop-module'));
document.getElementById('to-loop-trap-btn').addEventListener('click', () => showScreen('loop-trap'));

(function loopModule() {
  const group = document.getElementById('loop-particles');
  const playBtn = document.getElementById('loop-play-btn');
  let playing = false;
  let particles = [];

  function makeLoopParticle(color) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('r', 5);
    c.setAttribute('fill', color);
    group.appendChild(c);
    return c;
  }

  const heartCenter = { x: 190, y: 125 };
  const lungCenter = { x: 190, y: 42 };
  const bodyCenter = { x: 190, y: 217 };

  function lerp(a, b, t) { return a + (b - a) * t; }

  playBtn.addEventListener('click', () => {
    if (playing) return;
    playing = true;
    group.innerHTML = '';
    const blue = makeLoopParticle('#378ADD');
    const red = makeLoopParticle('#E24B4A');
    let t = 0;

    function step() {
      t += 0.012;
      const cycle = t % 2;

      if (cycle < 1) {
        const localT = cycle;
        blue.setAttribute('cx', lerp(heartCenter.x, lungCenter.x, localT));
        blue.setAttribute('cy', lerp(heartCenter.y - 20, lungCenter.y + 20, localT));
        red.setAttribute('cx', lerp(heartCenter.x, bodyCenter.x, 0));
        red.setAttribute('cy', lerp(heartCenter.y + 20, bodyCenter.y - 20, 0));
      } else {
        const localT = cycle - 1;
        blue.setAttribute('cx', lerp(lungCenter.x, heartCenter.x, localT));
        blue.setAttribute('cy', lerp(lungCenter.y + 20, heartCenter.y - 20, localT));
        red.setAttribute('cx', lerp(heartCenter.x, bodyCenter.x, localT));
        red.setAttribute('cy', lerp(heartCenter.y + 20, bodyCenter.y - 20, localT));
      }

      if (t < 6) {
        requestAnimationFrame(step);
      } else {
        playing = false;
      }
    }
    step();
  });
})();

let loopTrapAnswered = false;

document.querySelectorAll('#loop-trap-options .opt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (loopTrapAnswered) return;
    loopTrapAnswered = true;
    document.querySelectorAll('#loop-trap-options .opt-btn').forEach(b => b.disabled = true);
    const correct = btn.dataset.correct === 'true';
    btn.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) {
      document.querySelector('#loop-trap-options .opt-btn[data-correct="true"]').classList.add('correct');
    }
    const result = document.getElementById('loop-trap-result');
    result.classList.remove('hidden');
    result.textContent = 'Blood always returns to the heart between circuits. It never travels lungs to body directly. The heart is the hub for both loops, the pulmonary circuit (heart to lungs to heart) and the systemic circuit (heart to body to heart), not a single continuous path.';
    setDone('loop');
    document.getElementById('loop-done-btn').classList.remove('hidden');
  });
});

document.getElementById('loop-done-btn').addEventListener('click', () => showScreen('home'));
