/**
 * Instrument.js
 * Representa un instrumento 8-bit con configuración de síntesis
 */

class Instrument {
  /**
   * Crea un nuevo instrumento
   * @param {string} name - Nombre del instrumento
   * @param {string} waveform - Tipo de onda (pulse, triangle, sawtooth, noise)
   */
  constructor(name = 'Untitled', waveform = 'pulse') {
    this.name = name;
    this.waveform = waveform; // pulse, triangle, sawtooth, noise

    // Configuración específica del waveform
    this.dutyCycle = 0.5; // Para pulse wave (0-1)

    // ADSR Envelope
    this.envelope = {
      attack: 0.01,   // 10ms
      decay: 0.05,    // 50ms
      sustain: 0.7,   // 70% volumen
      release: 0.05   // 50ms
    };

    // Volumen base
    this.volume = 0.5; // 0-1
  }

  /**
   * Serializa el instrumento a JSON
   * @returns {Object} Representación JSON del instrumento
   */
  toJSON() {
    return {
      name: this.name,
      waveform: this.waveform,
      dutyCycle: this.dutyCycle,
      envelope: { ...this.envelope },
      volume: this.volume
    };
  }

  /**
   * Carga un instrumento desde JSON
   * @param {Object} data - Datos JSON del instrumento
   * @returns {Instrument} Nuevo instrumento cargado
   */
  static fromJSON(data) {
    const instrument = new Instrument(data.name, data.waveform);
    instrument.dutyCycle = data.dutyCycle || 0.5;
    instrument.envelope = { ...data.envelope };
    instrument.volume = data.volume || 0.5;
    return instrument;
  }

  /**
   * Crea una copia del instrumento
   * @returns {Instrument} Copia del instrumento
   */
  clone() {
    return Instrument.fromJSON(this.toJSON());
  }
}

// Instrumentos predefinidos
Instrument.PRESETS = {
  SQUARE_50: () => {
    const inst = new Instrument('Square 50%', 'pulse');
    inst.dutyCycle = 0.5;
    return inst;
  },

  SQUARE_25: () => {
    const inst = new Instrument('Square 25%', 'pulse');
    inst.dutyCycle = 0.25;
    return inst;
  },

  TRIANGLE: () => {
    return new Instrument('Triangle', 'triangle');
  },

  SAWTOOTH: () => {
    return new Instrument('Sawtooth', 'sawtooth');
  },

  NOISE: () => {
    const inst = new Instrument('Noise', 'noise');
    inst.envelope.attack = 0.001;
    inst.envelope.decay = 0.02;
    inst.envelope.sustain = 0.3;
    inst.envelope.release = 0.02;
    return inst;
  }
};
