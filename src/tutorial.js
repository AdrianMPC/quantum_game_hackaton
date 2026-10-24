// Guided tour: dims the page, spotlights one element per step and explains it.
// Opens automatically on the first visit; the header button replays it.

const STEPS = [
  {
    title: '¡Bienvenido a Quantum Maze!',
    text: 'Tu misión: llevar un rayo de luz hasta la estrella ★. El problema es que el laberinto está <b>oculto</b>: no ves los muros. Tendrás que deducir el camino con pistas.',
  },
  {
    target: '#board',
    title: 'El tablero',
    text: 'Es un laberinto de caminos en diagonal. Hay <b>4 puntos de inicio</b> (N, E, S, O) en el borde del círculo y un destino ★. Solo <b>uno</b> de los inicios lleva a la estrella.',
  },
  {
    target: '.start.selected',
    title: 'Tu inicio',
    text: 'El inicio que está <b>abajo</b> es el que eliges. Toca otro inicio o usa <b>Rotar</b> para cambiarlo; el tablero gira, pero el laberinto no cambia.',
  },
  {
    target: '#slots',
    title: 'La secuencia',
    text: 'Cada casilla es un movimiento. Tienes que llenarlas todas. Toca una casilla para cambiar solo ese movimiento.',
  },
  {
    target: '.moves',
    title: 'Las flechas',
    text: 'Cada flecha mueve el rayo <b>una casilla</b> en esa dirección. Si giras el tablero, las flechas giran con él. Cuando la secuencia está completa, la siguiente flecha empieza una nueva.',
  },
  {
    target: '#play',
    title: 'Play',
    text: 'Dibuja tu secuencia desde los <b>4 inicios a la vez</b>, como si no hubiera muros. Ganas si la secuencia es la correcta <b>y</b> el inicio de abajo es el correcto.',
  },
  {
    target: '#match',
    title: 'Coincidencia',
    text: 'Te dice qué porcentaje de tus movimientos está en la posición correcta. Ejemplo: si la solución es ↖ ↗ ↘ y pones ↖ ↙ ↘, aciertas 2 de 3 = <b>66,7 %</b>. Es una pista del juego, <b>no</b> una probabilidad.',
  },
  {
    target: '#scan',
    title: 'Scanner',
    text: 'Durante 2 segundos muestra en <b>rojo</b> el muro donde choca cada rayo. Si el rayo de un inicio no choca, ¡vas por buen camino! Cada uso resta puntos, úsalo con cabeza.',
  },
  {
    target: '.actions.secondary',
    title: 'Rotar y Reiniciar',
    text: '<b>Rotar</b> cambia qué inicio está abajo. <b>Reiniciar</b> borra la secuencia, el tiempo y los contadores del nivel.',
  },
  {
    target: '.modes',
    title: 'Niveles y Reto diario',
    text: 'Empieza por los 3 niveles. Después juega el <b>Reto diario</b>: un laberinto nuevo cada día, igual para todos. Resuélvelo días seguidos para subir tu racha 🔥.',
  },
  {
    title: '¿Y lo cuántico?',
    text: 'Encontrar el inicio correcto probando uno por uno toma en promedio 2,5 intentos. Una computadora cuántica no "prueba todo a la vez": usa el <b>algoritmo de Grover</b> para cambiar las probabilidades hasta que el inicio correcto sale casi seguro. Al ganar un nivel, abre <b>«¿Y si fuera cuántico?»</b> para verlo con datos de Qiskit.',
  },
];

const DONE_KEY = 'quantum-maze-tutorial-done';

export function tutorialSeen() {
  try { return localStorage.getItem(DONE_KEY) === '1'; } catch { return false; }
}

export function startTutorial() {
  let i = 0;
  const root = document.createElement('div');
  root.className = 'tour';
  root.innerHTML = `
    <div class="tour-spot"></div>
    <section class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <p class="tour-step"></p>
      <h2 id="tour-title"></h2>
      <p class="tour-text"></p>
      <div class="tour-nav">
        <button data-tour="skip">Saltar</button>
        <span></span>
        <button data-tour="prev">Anterior</button>
        <button data-tour="next" class="primary">Siguiente</button>
      </div>
    </section>`;
  document.body.appendChild(root);
  const spot = root.querySelector('.tour-spot');
  const card = root.querySelector('.tour-card');

  function place() {
    const step = STEPS[i];
    const el = step.target && document.querySelector(step.target);
    if (!el) {
      spot.style.cssText = 'top:50%;left:50%;width:0;height:0';
      card.dataset.pos = 'center';
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = 8;
    spot.style.cssText = `top:${r.top - pad}px;left:${r.left - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
    // Card goes on the side of the screen the target is not on.
    card.dataset.pos = r.top + r.height / 2 > innerHeight / 2 ? 'top' : 'bottom';
  }

  function show() {
    const step = STEPS[i];
    const el = step.target && document.querySelector(step.target);
    el?.scrollIntoView({ block: 'center', behavior: 'instant' });
    root.querySelector('.tour-step').textContent = `Paso ${i + 1} de ${STEPS.length}`;
    root.querySelector('#tour-title').textContent = step.title;
    root.querySelector('.tour-text').innerHTML = step.text;
    root.querySelector('[data-tour="prev"]').disabled = i === 0;
    root.querySelector('[data-tour="next"]').textContent = i === STEPS.length - 1 ? '¡A jugar!' : 'Siguiente';
    place();
    root.querySelector('[data-tour="next"]').focus();
  }

  function close() {
    try { localStorage.setItem(DONE_KEY, '1'); } catch { /* private mode: tour shows again next visit */ }
    removeEventListener('resize', place);
    removeEventListener('scroll', place, true);
    document.removeEventListener('keydown', onKey);
    root.remove();
  }

  const go = (d) => {
    if (i + d >= STEPS.length) return close();
    i = Math.max(0, i + d);
    show();
  };
  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  }

  root.querySelector('[data-tour="next"]').onclick = () => go(1);
  root.querySelector('[data-tour="prev"]').onclick = () => go(-1);
  root.querySelector('[data-tour="skip"]').onclick = close;
  addEventListener('resize', place);
  addEventListener('scroll', place, true);
  document.addEventListener('keydown', onKey);
  show();
}
