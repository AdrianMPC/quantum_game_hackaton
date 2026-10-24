// Interactive tutorial on the tutorial level (one entry, two routes, one blocked).
// Info steps advance with "Siguiente"; action steps wait for the player to click the
// highlighted control. Script: take the blocked route, fail, scan, then take the open one.
// The moves below match the "tutorial" entry in levels.json.

export const TUTORIAL_STEPS = [
  { target: '#board', title: 'Objetivo', text: 'Lleva el rayo desde la compuerta <b>S</b> hasta ★. Hay 2 caminos, pero los muros están ocultos.' },
  { target: '#slots', title: 'Secuencia', text: 'Cada casilla es un movimiento. Este nivel usa 2.' },
  { target: '[data-move="UP_RIGHT"]', act: true, title: 'Camino derecho', text: 'Pulsa <b>↗</b>.' },
  { target: '[data-move="UP_LEFT"]', act: true, title: 'Camino derecho', text: 'Ahora pulsa <b>↖</b>.' },
  { target: '#play', act: true, wait: 1100, title: 'Play', text: 'Pulsa <b>Play</b> para probar tu secuencia.' },
  { target: '#board', title: 'No ganaste', text: 'Play dibuja tu ruta <b>sin muros</b>, por eso parece llegar. Pero algo la bloquea. El <b>%</b> indica cuántos movimientos están en su lugar.' },
  { target: '#scan', act: true, wait: 700, title: 'Scanner', text: 'Pulsa <b>Scanner</b> para ver dónde choca.' },
  { target: '#board', title: '¡Muro!', text: 'La marca <b>roja</b> es el muro donde choca el rayo. Este camino está bloqueado.' },
  { target: '[data-move="UP_LEFT"]', act: true, title: 'Otro camino', text: 'Prueba el izquierdo: pulsa <b>↖</b>.' },
  { target: '[data-move="UP_RIGHT"]', act: true, title: 'Otro camino', text: 'Ahora pulsa <b>↗</b>.' },
  { target: '#play', act: true, wait: 1100, title: '¡Último paso!', text: 'Pulsa <b>Play</b>.' },
  { target: '#board', title: '¡Ganaste!', text: 'La secuencia <b>↖ ↗</b> desde S llega a ★ sin chocar: el camino izquierdo no tiene muros. Ganas cuando la secuencia y la compuerta son las correctas (100 %).' },
];

// Short tour on level 1 (two gates): how to change the selected gate.
export const GATE_STEPS = [
  { target: '#board', title: 'Compuertas', text: 'Este nivel tiene <b>2 compuertas</b>. Juegas desde la de <b>abajo</b>, la que brilla.' },
  { target: '.start:not(.selected)', act: true, wait: 450, title: 'Cambiar de compuerta', text: 'Toca la otra compuerta.' },
  { target: '#rotate', act: true, wait: 450, title: 'Rotar', text: 'O pulsa <b>Rotar</b> para pasar a la siguiente.' },
  { target: '#board', title: '¡Listo!', text: 'La compuerta de abajo es la elegida. Encuentra cuál llega a ★.' },
];

// onClose runs when the tour ends (finished or skipped).
export function startTutorial(STEPS, onClose = () => {}) {
  let i = 0;
  let waiting = false;
  const root = document.createElement('div');
  root.className = 'tour';
  root.innerHTML = `
    <div class="tour-spot"></div>
    <section class="tour-card" role="dialog" aria-labelledby="tour-title">
      <p class="tour-step"></p>
      <h2 id="tour-title"></h2>
      <p class="tour-text"></p>
      <div class="tour-nav">
        <button data-tour="skip">Saltar tutorial</button>
        <span></span>
        <button data-tour="next" class="primary">Siguiente</button>
      </div>
    </section>`;
  document.body.appendChild(root);
  const spot = root.querySelector('.tour-spot');
  const card = root.querySelector('.tour-card');
  const next = root.querySelector('[data-tour="next"]');
  const target = () => document.querySelector(STEPS[i].target);

  function place() {
    const r = target().getBoundingClientRect();
    const pad = 8;
    spot.style.cssText = `top:${r.top - pad}px;left:${r.left - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
    // Card goes on the side of the screen the target is not on.
    card.dataset.pos = r.top + r.height / 2 > innerHeight / 2 ? 'top' : 'bottom';
  }

  function show() {
    const step = STEPS[i];
    target().scrollIntoView({ block: 'center', behavior: 'instant' });
    root.querySelector('.tour-step').textContent = `Paso ${i + 1} de ${STEPS.length}`;
    root.querySelector('#tour-title').textContent = step.title;
    root.querySelector('.tour-text').innerHTML = step.text;
    // Action steps let clicks through to the page; the guard below keeps them on the target.
    root.classList.toggle('acting', !!step.act);
    next.hidden = !!step.act;
    place();
    next.textContent = i === STEPS.length - 1 ? 'Terminar' : 'Siguiente';
    if (!step.act) next.focus();
  }

  function close() {
    removeEventListener('resize', place);
    removeEventListener('scroll', place, true);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('click', guard, true);
    root.remove();
    onClose();
  }

  function advance() {
    if (i + 1 >= STEPS.length) return close();
    i++;
    show();
  }

  // During an action step, only the highlighted control (and the card) accept clicks.
  function guard(e) {
    const step = STEPS[i];
    if (!step.act || card.contains(e.target)) return;
    if (waiting || !target().contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Let the game handle this click first, then move on.
    waiting = true;
    setTimeout(() => { waiting = false; advance(); }, step.wait ?? 0);
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' && !STEPS[i].act) advance();
  }

  next.onclick = advance;
  root.querySelector('[data-tour="skip"]').onclick = close;
  addEventListener('resize', place);
  addEventListener('scroll', place, true);
  document.addEventListener('keydown', onKey);
  document.addEventListener('click', guard, true);
  show();
}
