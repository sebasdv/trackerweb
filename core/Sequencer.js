/**
 * Sequencer.js
 * Maneja el timing y reproducción de patterns
 */

class Sequencer {
  /**
   * Crea un nuevo secuenciador
   * @param {AudioEngine} audioEngine - Motor de audio
   * @param {Song} song - Canción a reproducir
   */
  constructor(audioEngine, song) {
    this.audioEngine = audioEngine;
    this.song = song;

    // Estado de reproducción
    this.isPlaying = false;
    this.currentOrder = 0;      // Posición en song.order
    this.currentRow = 0;         // Fila actual en pattern (0-63)
    this.currentTick = 0;        // Tick dentro de row (0-speed)

    // Timing
    this.lastTickTime = 0;
    this.tickInterval = this.calculateTickInterval();

    // Procesador de efectos
    this.effectProcessor = new EffectProcessor(audioEngine);

    // Efectos activos por canal (para procesamiento continuo) - 8 canales
    this.activeEffects = [
      { effect: 0x0, param: 0x0 },
      { effect: 0x0, param: 0x0 },
      { effect: 0x0, param: 0x0 },
      { effect: 0x0, param: 0x0 },
      { effect: 0x0, param: 0x0 },
      { effect: 0x0, param: 0x0 },
      { effect: 0x0, param: 0x0 },
      { effect: 0x0, param: 0x0 }
    ];

    // Callbacks
    this.onRowChange = null;     // Callback cuando cambia la fila
    this.onOrderChange = null;   // Callback cuando cambia el order
  }

  /**
   * Calcula el intervalo entre ticks en milisegundos
   * @returns {number} Intervalo en ms
   */
  calculateTickInterval() {
    // Formula estándar de FastTracker 2: cada tick = 2500ms / BPM
    // El speed determina cuántos ticks por row, no afecta el tiempo del tick
    return 2500 / this.song.bpm;
  }

  /**
   * Inicia la reproducción
   */
  play() {
    if (this.isPlaying) {
      return;
    }

    this.isPlaying = true;
    this.lastTickTime = Date.now();
    this.tickInterval = this.calculateTickInterval();
  }

  /**
   * Pausa la reproducción
   */
  pause() {
    this.isPlaying = false;
    this.audioEngine.stopAll();
  }

  /**
   * Detiene la reproducción y vuelve al inicio
   */
  stop() {
    this.isPlaying = false;
    this.currentOrder = 0;
    this.currentRow = 0;
    this.currentTick = 0;
    this.audioEngine.stopAll();

    if (this.onRowChange) {
      this.onRowChange(this.currentRow);
    }
    if (this.onOrderChange) {
      this.onOrderChange(this.currentOrder);
    }
  }

  /**
   * Actualiza el secuenciador (llamar en cada frame)
   */
  update() {
    if (!this.isPlaying) {
      return;
    }

    const now = Date.now();
    const deltaTime = now - this.lastTickTime;

    if (deltaTime >= this.tickInterval) {
      this.tick();
      this.lastTickTime = now;
    }
  }

  /**
   * Procesa un tick del secuenciador
   */
  tick() {
    // En tick 0, procesar la fila
    if (this.currentTick === 0) {
      this.processRow();
    } else {
      // En ticks posteriores, procesar efectos continuos
      for (let ch = 0; ch < this.song.channels; ch++) {
        const activeEffect = this.activeEffects[ch];
        if (activeEffect.effect !== 0x0) {
          this.effectProcessor.processTick(ch, activeEffect.effect, this.currentTick);
        }
      }
    }

    // Incrementar tick
    this.currentTick++;

    // Si completamos todos los ticks, avanzar a siguiente fila
    if (this.currentTick >= this.song.speed) {
      this.currentTick = 0;
      this.nextRow();
    }
  }

  /**
   * Procesa la fila actual
   */
  processRow() {
    // Obtener pattern actual
    const patternIndex = this.song.order[this.currentOrder];
    const pattern = this.song.getPattern(patternIndex);

    if (!pattern) {
      return;
    }

    // Procesar cada canal
    for (let ch = 0; ch < this.song.channels; ch++) {
      const cell = pattern.getCell(this.currentRow, ch);

      if (!cell) {
        continue;
      }

      // Guardar efecto activo del canal para procesamiento continuo
      this.activeEffects[ch] = {
        effect: cell.effect || 0x0,
        param: cell.effectParam || 0x0
      };

      // Si hay nota, reproducirla
      if (cell.note !== null) {
        const instrument = this.song.getInstrument(cell.instrument || 0);
        const volume = cell.volume !== null ? cell.volume : 48;

        this.audioEngine.playNote(ch, cell.note, instrument, volume);
      }

      // Trigger del efecto (procesamiento inicial)
      if (cell.effect !== 0x0 || cell.note !== null) {
        this.effectProcessor.trigger(
          ch,
          cell.note,
          cell.volume,
          cell.effect || 0x0,
          cell.effectParam || 0x0
        );
      }

      // Procesar efectos globales (speed/tempo)
      if (cell.effect === 0xF) {
        this.processEffect(ch, cell.effect, cell.effectParam);
      }
    }

    // Callback de cambio de fila
    if (this.onRowChange) {
      this.onRowChange(this.currentRow);
    }
  }

  /**
   * Avanza a la siguiente fila
   */
  nextRow() {
    this.currentRow++;

    // Obtener pattern actual para saber su tamaño
    const patternIndex = this.song.order[this.currentOrder];
    const pattern = this.song.getPattern(patternIndex);
    const patternRows = pattern ? pattern.rows : 64;

    // Si llegamos al final del pattern
    if (this.currentRow >= patternRows) {
      this.currentRow = 0;
      this.nextOrder();
    }
  }

  /**
   * Avanza al siguiente order
   */
  nextOrder() {
    this.currentOrder++;

    // Si llegamos al final de la canción, volver al inicio
    if (this.currentOrder >= this.song.order.length) {
      this.currentOrder = 0;
    }

    // Callback de cambio de order
    if (this.onOrderChange) {
      this.onOrderChange(this.currentOrder);
    }
  }

  /**
   * Procesa un efecto (stub, implementar con Effects.js)
   * @param {number} channel - Canal
   * @param {number} effect - Código de efecto
   * @param {number} param - Parámetro del efecto
   */
  processEffect(channel, effect, param) {
    // TODO: Implementar efectos
    // Por ahora solo manejamos algunos básicos

    switch (effect) {
      case 0xC: // Set Volume
        // Cambiar volumen del canal
        break;
      case 0xF: // Set Speed/Tempo
        if (param < 32) {
          this.song.speed = param;
        } else {
          this.song.bpm = param;
          this.tickInterval = this.calculateTickInterval();
          // Resetear el tiempo del último tick para evitar saltos
          if (this.isPlaying) {
            this.lastTickTime = Date.now();
          }
        }
        break;
    }
  }

  /**
   * Salta a una posición específica
   * @param {number} order - Order index
   * @param {number} row - Row number
   */
  jumpTo(order, row = 0) {
    this.currentOrder = Math.max(0, Math.min(order, this.song.order.length - 1));
    this.currentRow = Math.max(0, Math.min(row, 63));
    this.currentTick = 0;

    if (this.onRowChange) {
      this.onRowChange(this.currentRow);
    }
    if (this.onOrderChange) {
      this.onOrderChange(this.currentOrder);
    }
  }

  /**
   * Establece el BPM
   * @param {number} bpm - Beats por minuto
   */
  setBPM(bpm) {
    this.song.bpm = Math.max(32, Math.min(255, bpm));
    this.tickInterval = this.calculateTickInterval();
    // Resetear el tiempo del último tick para evitar saltos
    if (this.isPlaying) {
      this.lastTickTime = Date.now();
    }
  }

  /**
   * Establece el speed
   * @param {number} speed - Ticks por row
   */
  setSpeed(speed) {
    this.song.speed = Math.max(1, Math.min(31, speed));
    // El speed no afecta el tickInterval en el sistema FastTracker 2
    // pero reseteamos el tiempo por consistencia
    if (this.isPlaying) {
      this.lastTickTime = Date.now();
    }
  }
}
