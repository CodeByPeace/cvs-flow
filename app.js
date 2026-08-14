const screens = document.querySelectorAll('.screen');
function showScreen(id) {
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

document.getElementById('start-btn').addEventListener('click', () => showScreen('module'));
document.getElementById('to-trap-btn').addEventListener('click', () => showScreen('trap'));

const VESSEL_LEFT = 70;
const VESSEL_RIGHT = 350;
const VESSEL_CENTER = (VESSEL_LEFT + VESSEL_RIGHT) / 2;
const NARROW_SPAN = 45;
const BASE_HALF = 28;
const MIN_HALF = 5;

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

// Real Poiseuille relationship: resistance scales as 1 / radius^4.
// gap slider ranges 4 (tight) to 30 (loose), representing the narrowed radius.
// A radius-based resistance means flow crashes fast as the vessel tightens,
// matching the real physiology instead of a flat linear approximation.
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

(function mainModule() {
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

let trapAnswered = false;

document.querySelectorAll('.opt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (trapAnswered) return;
    trapAnswered = true;
    document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
    const correct = btn.dataset.correct === 'true';
    btn.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) {
      document.querySelector('.opt-btn[data-correct="true"]').classList.add('correct');
    }
    playReplay(correct);
  });
});

function playReplay(wasCorrect) {
  const replaySvg = document.getElementById('replay-svg');
  const replayTop = document.getElementById('replay-top');
  const replayBottom = document.getElementById('replay-bottom');
  const replayFill = document.getElementById('replay-fill');
  const replayGroup = document.getElementById('replay-particles');
  replaySvg.classList.remove('hidden');
  replayGroup.innerHTML = '';

  const particles = makeParticles(replayGroup, 10, '#E24B4A');
  let frame = 0;
  const totalFrames = 100;

  function step() {
    frame++;
    const t = Math.min(1, frame / totalFrames);
    const gap = 30 - (30 - 6) * t;
    const paths = buildVesselPaths(gap);
    replayTop.setAttribute('d', paths.top);
    replayBottom.setAttribute('d', paths.bottom);
    replayFill.setAttribute('d', paths.fill);

    const push = 50;
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

    if (frame < 260) {
      requestAnimationFrame(step);
    }
  }
  step();

  const result = document.getElementById('trap-result');
  result.classList.remove('hidden');
  if (wasCorrect) {
    result.textContent = 'Right. Watch how fast the flow drops as the vessel narrows, even though the push from the heart never changed. Blood flow depends on the radius raised to the fourth power, so even a small squeeze causes a huge drop, not a small one.';
  } else {
    result.textContent = 'Watch what actually happens: the flow crashes fast as the vessel narrows, even with the push staying the same. In real vessels, resistance depends on radius to the fourth power, so a modest squeeze causes a massive drop in flow, this is the exact mix-up most students make.';
  }
}
