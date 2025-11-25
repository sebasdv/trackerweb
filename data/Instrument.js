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
    this.waveform = waveform; // pulse, triangle, sawtooth, noise, fm, karplus

    // Configuración específica del waveform
    this.dutyCycle = 0.5; // Para pulse wave (0-1)

    // FM Synthesis parameters
    this.fmRatio = 1.0;      // Modulator/Carrier ratio (0.5-8)
    this.fmIndex = 2.0;      // Modulation index (0-10)
    this.fmFeedback = 0;     // Feedback amount (0-1)

    // Karplus-Strong parameters
    this.ksDamping = 0.99;     // Damping factor (0.9-0.999)
    this.ksBrightness = 0.5;   // Brightness (0-1)

    // Formant/Vowel parameters
    this.vowel = 'a';  // a, e, i, o, u

    // Wavefolder amount
    this.wavefold = 0;  // 0-1, amount of wavefolding

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
      fmRatio: this.fmRatio,
      fmIndex: this.fmIndex,
      fmFeedback: this.fmFeedback,
      ksDamping: this.ksDamping,
      ksBrightness: this.ksBrightness,
      vowel: this.vowel,
      wavefold: this.wavefold,
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

    // FM parameters
    instrument.fmRatio = data.fmRatio !== undefined ? data.fmRatio : 1.0;
    instrument.fmIndex = data.fmIndex !== undefined ? data.fmIndex : 2.0;
    instrument.fmFeedback = data.fmFeedback || 0;

    // Karplus-Strong parameters
    instrument.ksDamping = data.ksDamping !== undefined ? data.ksDamping : 0.99;
    instrument.ksBrightness = data.ksBrightness !== undefined ? data.ksBrightness : 0.5;

    // Formant/Wavefold
    instrument.vowel = data.vowel || 'a';
    instrument.wavefold = data.wavefold || 0;

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

// Instrumentos predefinidos - Set C (Mutable Instruments inspired)
Instrument.PRESETS = {
  // 0. Square 50% con PWM (LFO opcional)
  PWM_LEAD: () => {
    const inst = new Instrument('PWM Lead', 'pulse');
    inst.dutyCycle = 0.5;
    inst.envelope.attack = 0.01;
    inst.envelope.decay = 0.05;
    inst.envelope.sustain = 0.7;
    inst.envelope.release = 0.1;
    inst.volume = 0.5;
    // LFO para PWM (deshabilitado por defecto, activar manualmente)
    inst.lfo.target = 'pitch';
    inst.lfo.rate = 5.0;
    inst.lfo.depth = 0.05;
    return inst;
  },

  // 1. FM Bass (2-operator)
  FM_BASS: () => {
    const inst = new Instrument('FM Bass', 'fm');
    inst.fmRatio = 0.5;      // Modulador a la mitad de la carrier (bajo)
    inst.fmIndex = 3.0;      // Índice de modulación medio-alto
    inst.fmFeedback = 0.2;   // Poco feedback para cuerpo
    inst.envelope.attack = 0.005;
    inst.envelope.decay = 0.15;
    inst.envelope.sustain = 0.6;
    inst.envelope.release = 0.2;
    inst.volume = 0.7;
    return inst;
  },

  // 2. Karplus-Strong Pluck
  PLUCK: () => {
    const inst = new Instrument('Pluck String', 'karplus');
    inst.ksDamping = 0.98;      // Decay natural
    inst.ksBrightness = 0.7;    // Brillante
    inst.envelope.attack = 0.001;
    inst.envelope.decay = 0.05;
    inst.envelope.sustain = 0.4;
    inst.envelope.release = 0.3;
    inst.volume = 0.6;
    return inst;
  },

  // 3. Triangle con formante (vocal "a")
  FORMANT_VOCAL: () => {
    const inst = new Instrument('Vocal (A)', 'sawtooth');
    inst.vowel = 'a';  // Usar sawtooth + filtros formantes en playNote
    inst.envelope.attack = 0.02;
    inst.envelope.decay = 0.08;
    inst.envelope.sustain = 0.75;
    inst.envelope.release = 0.15;
    inst.volume = 0.45;
    // Filtros bandpass para formantes (implementar en AudioEngine)
    inst.filter.enabled = true;
    inst.filter.type = 'bandpass';
    inst.filter.cutoff = 730;   // F1 de 'a'
    inst.filter.resonance = 10;
    return inst;
  },

  // 4. Sawtooth con Wavefolder
  WAVEFOLD_LEAD: () => {
    const inst = new Instrument('Wavefold Lead', 'sawtooth');
    inst.wavefold = 0.6;  // Wavefolding medio
    inst.envelope.attack = 0.005;
    inst.envelope.decay = 0.04;
    inst.envelope.sustain = 0.65;
    inst.envelope.release = 0.1;
    inst.volume = 0.4;  // Reducir volumen por la distorsión
    return inst;
  },

  // 5. Filtered Noise (sweep)
  FILTERED_NOISE: () => {
    const inst = new Instrument('Filtered Noise', 'noise');
    inst.envelope.attack = 0.001;
    inst.envelope.decay = 0.02;
    inst.envelope.sustain = 0.3;
    inst.envelope.release = 0.02;
    inst.volume = 0.35;
    // Filtro resonante con sweep
    inst.filter.enabled = true;
    inst.filter.type = 'bandpass';
    inst.filter.cutoff = 2000;
    inst.filter.resonance = 8.0;
    return inst;
  },

  // 6. FM Kick
  FM_KICK: () => {
    const inst = new Instrument('FM Kick', 'fm');
    inst.fmRatio = 2.0;      // Modulador al doble (genera armónicos)
    inst.fmIndex = 8.0;      // Índice alto para punch
    inst.fmFeedback = 0.3;   // Feedback para cuerpo
    inst.envelope.attack = 0.001;
    inst.envelope.decay = 0.15;
    inst.envelope.sustain = 0.0;
    inst.envelope.release = 0.05;
    inst.volume = 0.8;
    return inst;
  },

  // 7. Snare Drum (noise filtrado)
  SNARE: () => {
    const inst = new Instrument('Snare Drum', 'noise');
    inst.envelope.attack = 0.001;
    inst.envelope.decay = 0.08;
    inst.envelope.sustain = 0.1;
    inst.envelope.release = 0.05;
    inst.volume = 0.5;
    inst.filter.enabled = true;
    inst.filter.type = 'highpass';
    inst.filter.cutoff = 800;
    inst.filter.resonance = 2.0;
    return inst;
  }
};
