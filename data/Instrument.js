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

    // SVF Filter (State Variable Filter)
    this.filter = {
      enabled: false,
      type: 'lowpass',  // lowpass, highpass, bandpass, notch
      cutoff: 2000,     // Hz (20-20000)
      resonance: 1.0,   // Q factor (0.1-20)
      envelope: 0       // Filter envelope amount (0-1)
    };

    // LFO (Low Frequency Oscillator)
    this.lfo = {
      enabled: false,
      target: 'pitch',  // pitch, filter, volume, pwm
      waveform: 'sine', // sine, triangle, square, sawtooth
      rate: 4.0,        // Hz (0.1-20)
      depth: 0.5        // 0-1
    };
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
      volume: this.volume,
      filter: { ...this.filter },
      lfo: { ...this.lfo }
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

    // Cargar filter y LFO si existen (retrocompatibilidad)
    if (data.filter) {
      instrument.filter = { ...data.filter };
    }
    if (data.lfo) {
      instrument.lfo = { ...data.lfo };
    }

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
    inst.envelope.attack = 0.01;
    inst.envelope.decay = 0.05;
    inst.envelope.sustain = 0.7;
    inst.envelope.release = 0.1;
    return inst;
  },

  SQUARE_25: () => {
    const inst = new Instrument('Square 25%', 'pulse');
    inst.dutyCycle = 0.25;
    inst.envelope.attack = 0.01;
    inst.envelope.decay = 0.1;
    inst.envelope.sustain = 0.8;
    inst.envelope.release = 0.15;
    return inst;
  },

  SQUARE_125: () => {
    const inst = new Instrument('Square 12.5%', 'pulse');
    inst.dutyCycle = 0.125;
    inst.envelope.attack = 0.005;
    inst.envelope.decay = 0.03;
    inst.envelope.sustain = 0.6;
    inst.envelope.release = 0.08;
    inst.volume = 0.45;
    return inst;
  },

  TRIANGLE: () => {
    const inst = new Instrument('Triangle', 'triangle');
    inst.envelope.attack = 0.02;
    inst.envelope.decay = 0.08;
    inst.envelope.sustain = 0.75;
    inst.envelope.release = 0.15;
    inst.volume = 0.6;
    return inst;
  },

  SAWTOOTH: () => {
    const inst = new Instrument('Sawtooth', 'sawtooth');
    inst.envelope.attack = 0.005;
    inst.envelope.decay = 0.04;
    inst.envelope.sustain = 0.65;
    inst.envelope.release = 0.1;
    inst.volume = 0.5;
    return inst;
  },

  NOISE: () => {
    const inst = new Instrument('Noise', 'noise');
    inst.envelope.attack = 0.001;
    inst.envelope.decay = 0.02;
    inst.envelope.sustain = 0.3;
    inst.envelope.release = 0.02;
    inst.volume = 0.4;
    return inst;
  },

  KICK: () => {
    const inst = new Instrument('Kick Drum', 'triangle');
    inst.envelope.attack = 0.001;
    inst.envelope.decay = 0.15;
    inst.envelope.sustain = 0.0;
    inst.envelope.release = 0.05;
    inst.volume = 0.8;
    // El kick se toca típicamente en notas bajas (C1-C2)
    return inst;
  },

  SNARE: () => {
    const inst = new Instrument('Snare Drum', 'noise');
    inst.envelope.attack = 0.001;
    inst.envelope.decay = 0.08;
    inst.envelope.sustain = 0.1;
    inst.envelope.release = 0.05;
    inst.volume = 0.5;
    // Filtro para dar carácter
    inst.filter.enabled = true;
    inst.filter.type = 'highpass';
    inst.filter.cutoff = 800;
    inst.filter.resonance = 2.0;
    return inst;
  }
};
