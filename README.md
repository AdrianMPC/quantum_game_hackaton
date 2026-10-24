# BlaQ · Quantum Maze

Prototipo EdTech para la Hackathon Qiskit Fall Fest 2026 (reto EdTech, IEEE Computer Society PUCP).

**Demo:** https://quantum-maze-ebon.vercel.app

## La Ilusión de la "Palabra Mágica" y la Amputación del Paradigma Cuántico

En la última década, el Perú ha demostrado un patrón sistemático frente a las tecnologías disruptivas: se adoptan en el discurso como "palabras mágicas" para promesas políticas o corporativas, pero se ignoran los cimientos necesarios para su funcionamiento real. Ocurrió con la infraestructura básica, donde el Estado invirtió $290 millones de dólares en una Red Dorsal de fibra óptica que terminó usándose solo al 3% de su capacidad por errores contractuales, y con la educación, donde se gastaron más de $200 millones de dólares en laptops escolares sin ningún impacto en el aprendizaje de matemáticas o lenguaje al regalar "autos sin enseñar a manejar". Se repitió con la Inteligencia Artificial, donde las autoridades la proclaman como el motor del Estado eficiente mientras instituciones vitales como el Ministerio de Salud siguen respaldando información en CDs y solo 1 de cada 7 centros de salud cuenta con historias clínicas electrónicas a más de diez años de aprobada su ley.

**El aterrizaje a la Computación Cuántica:** Hoy nos enfrentamos a la llegada de la Computación Cuántica, una tecnología capaz de rediseñar la criptografía, la simulación de materiales y el procesamiento de datos a escalas antes impensables. Sin embargo, el riesgo inminente es repetir exactamente el mismo ciclo de la IA: tratar a la computación cuántica como un slogan de innovación sin entender su arquitectura ni sus requisitos previos.

- **Ignorancia del funcionamiento y planificación a ciegas:** Líderes y decisiones operativas pretenden implementar o hablar de tecnologías avanzadas sin entender sus bases. Así como el 60% de los empleos que la IA podría potenciar en el país ni siquiera cuentan con una computadora para ejecutarla, la computación cuántica será inaccesible si no existen datos estructurados, infraestructura digital previa y un entorno básico de computación.
- **Brecha de talento crítico:** La computación cuántica no es solo un programa informático; requiere capacidades avanzadas en física, algoritmos y pensamiento matemático. Actualmente, en el país solo 13 de cada 100 estudiantes de secundaria alcanzan el nivel esperado en matemáticas y solo el 20% de los postulantes docentes aprueban las evaluaciones estatales. Intentar saltar a la era cuántica con este vacío formativo es planificar el fracaso en condiciones absolutamente desfavorables.
- **Incapacidad de explotar el valor:** Al no existir una estrategia de mentoreo y aprendizaje práctico, la tecnología no se explota, no genera valor local y termina convertida en una compra de infraestructura inútil o en servicios costosos contratados a terceros. Como resume la evidencia actual: "La gente no conoce la tecnología de la que habla".

## Nuestra propuesta

BlaQ es un juego de deducción corto, pensado para jugarse **una vez al día**, que parte de algo conocido, la probabilidad clásica, y lleva al jugador a la idea central de la computación cuántica. Un algoritmo cuántico no "prueba todo a la vez": **reforma la distribución de probabilidad** de lo que vas a medir.

- **Concepto estadístico:** búsqueda a ciegas como muestreo aleatorio (Monte Carlo). Con N candidatos, el número de intentos sigue una distribución uniforme en 1…N, con media (N+1)/2.
- **Equivalente cuántico:** amplificación de amplitud. Los N candidatos son estados de la base de ⌈log₂ N⌉ qubits. La medición sigue la regla de Born (probabilidad = |amplitud|²), y cada iteración rota el estado hacia la respuesta correcta.
- **Edad sugerida:** desde 12 años. Solo se necesita leer flechas y porcentajes.

## Cómo jugar (tutorial)

Al abrir la página siempre aparece el **nivel Tutorial**, guiado paso a paso. El jugador hace cada acción mientras avanza la guía.

### 1. El objetivo
Lleva el rayo desde una **compuerta** (entrada) hasta la estrella ★. Los **muros están ocultos**: solo una compuerta, con la secuencia correcta, llega al destino.

### 2. La secuencia
Cada casilla es un movimiento. Cada flecha (↖ ↗ ↙ ↘) avanza **una casilla** en esa dirección. Cuando la secuencia está completa, la siguiente flecha empieza una nueva; tocar una casilla cambia solo ese movimiento.

### 3. Play
Dibuja tu secuencia desde **todas las compuertas** a la vez, como si no hubiera muros. Ganas solo si la secuencia **y** la compuerta elegida son las correctas. El **%** junto a los movimientos indica cuántos movimientos están en su lugar. Es una pista del juego, **no** una probabilidad.

### 4. Primer intento (fallido)
En el tutorial hay una sola compuerta (S) y dos caminos que parecen iguales. Primero pruebas el de la derecha (↗ ↖) y pulsas Play: el rayo parece llegar, pero **no ganas**.

### 5. Scanner
Pulsa **Scanner**: marca en **rojo** el muro donde choca cada rayo. En el tutorial la marca queda visible para que puedas observarla; en los niveles dura 2 segundos y cada uso resta puntos.

### 6. El camino correcto
Vuelves y pruebas el camino de la izquierda (↖ ↗). Play: el rayo llega a ★ sin chocar. **¡Ganaste!** La secuencia y la compuerta eran las correctas.

### 7. Cambiar de compuerta
Al entrar al nivel 1 aparece un mini tutorial. Juegas desde la compuerta de **abajo** (la que brilla). Para cambiarla, **toca otra compuerta** o pulsa **Rotar**: el tablero gira y la compuerta elegida queda abajo. El laberinto no cambia.

### 8. Niveles

| Nivel | Compuertas | Movimientos |
| --- | --- | --- |
| Tutorial | 1 | 2 |
| 1 · Dos compuertas | 2 | 1 |
| 2 · Tres compuertas | 3 | 2 |
| 3 · Cuatro compuertas | 4 | 3 |
| 4 · Seis compuertas | 6 | 3 |

Puntuación: 1000 − 2 por segundo − 25 por Play − 10 por Scanner (configurable en `levels.json`).

### 9. Reto diario y racha 🔥
Cada día hay un laberinto nuevo, el mismo para todos, generado a partir de la fecha. Resolverlo días seguidos sube tu **racha**. El resultado se puede compartir al estilo Wordle.

### 10. ¿Y si fuera cuántico?
Al ganar un nivel, abre el panel **✦ ¿Y si fuera cuántico? ✦**. Ahí verás:

- **Tu partida vs cuántico:** tus Play reales, el promedio del azar clásico y lo que logra la amplificación de amplitud.
- **Clásico:** «Adivinar al azar ×1000», un histograma de intentos con media (N+1)/2.
- **Cuántico:** probabilidades de medición tras 0, 1 y 2 iteraciones, calculadas con Qiskit, y el circuito.

Lo que enseña cada nivel (P(k) = sin²((2k+1)·asin(1/√N))):

| Compuertas | Qubits | 0 iter. | 1 iter. | 2 iter. | Lección |
| --- | --- | --- | --- | --- | --- |
| 2 | 1 | 50 % | 50 % | 50 % | Lo cuántico no siempre gana |
| 3 | 2 | 33,3 % | 92,6 % | 0,4 % | Pasarse de vueltas baja la probabilidad |
| 4 | 2 | 25 % | 100 % | 25 % | Una sola iteración basta |
| 6 | 3 | 16,7 % | 90,7 % | 74,3 % | Es una rotación, no "probar todo" |

## Cómo ejecutarlo

Sitio estático, sin paso de build ni dependencias en tiempo de ejecución.

```bash
python3 -m http.server 8000   # abrir http://localhost:8000
npm test                      # node --test (Node 22+)
uv run quantum/amplify.py     # regenera quantum/amplify.json con Qiskit
```

## Estructura

| Ruta | Rol |
| --- | --- |
| `levels.json` | Tutorial y niveles: tamaño, compuertas, muros, destino, secuencia objetivo, puntuación |
| `src/engine.js` | Lógica pura: movimientos, trazado, validación (solución única), coincidencia %, puntuación |
| `src/game.js` | Máquina de estados del nivel (READY / PLAYING / SCANNING / LEVEL_COMPLETED), sin DOM |
| `src/render.js` | Tablero SVG, rayos, muros, barrido del scanner; solo dibuja |
| `src/tutorial.js` | Tutorial interactivo y mini tutorial de compuertas |
| `src/daily.js` | Reto diario generado por fecha (validado por el motor) y racha local |
| `src/quantum.js` | Panel «¿Y si fuera cuántico?» |
| `src/main.js` | Carga datos, valida niveles, conecta eventos |
| `quantum/amplify.py` | Script Qiskit que produce `quantum/amplify.json` |
| `test/engine.test.js` | Valida niveles, reglas, tutorial, reto diario, racha y los datos cuánticos contra la teoría |

Agregar un nivel = agregar un objeto en `levels.json`. `validateLevel` rechaza niveles con más de una solución o donde una compuerta incorrecta no choca con ningún muro; los niveles inválidos se reportan en pantalla y se omiten.

## Qué hace Qiskit

`quantum/amplify.py` construye, para N = 2, 3, 4 y 6 compuertas, este circuito:

- **Preparación A:** `StatePreparation`, superposición uniforme sobre exactamente N estados.
- **Oráculo:** invierte la fase de la compuerta correcta.
- **Difusor:** A(2|0⟩⟨0| − I)A†.

Las probabilidades exactas salen de `Statevector`, y los conteos de `StatevectorSampler` (1024 disparos, semilla 42). Los tests comparan cada probabilidad con la fórmula teórica.

**Reproducibilidad:** Qiskit 2.6.1 fijado en la cabecera del script, Python 3.13 vía `uv`, semilla 42. Ejecutar de nuevo el script produce un `amplify.json` idéntico byte a byte.

## Limitaciones (con honestidad)

- El laberinto es un puzzle **clásico**. Los rayos son una analogía visual calculada uno por uno; no son superposición ni muestran ventaja cuántica.
- El % junto a los movimientos es una coincidencia de secuencia, no una probabilidad.
- El panel cuántico es una simulación ideal, sin ruido, con muy pocos candidatos: no hay ventaja práctica a esta escala. La aceleración real es cuadrática (O(√N) frente a O(N)) y solo importa con N grande.
- La racha vive en `localStorage`: es por navegador y se pierde si se borran los datos del sitio.
- Pendiente: ejecución en hardware real de IBM (comparar ruido vs ideal) y más niveles.
