/**
 * AudioEngine.js
 * Motor de síntesis de audio 8-bit usando WebAudio API
 */

class AudioEngine {
  /**
   * Crea un nuevo motor de audio
   * @param {AudioContext} audioContext - Contexto de audio de WebAudio API
   */
  constructor(audioContext) {
    this.context = audioContext;

    // Master gain (volumen principal)
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.3; // Volumen moderado por defecto
    this.masterGain.connect(this.context.destination);

    // Canales de audio (8 canales)
    this.channels = [];
    for (let i = 0; i < 8; i++) {
      this.channels.push({
        gain: this.createChannelGain(),
        currentNote: null,
        oscillator: null,
        envelope: null,
        filter: null,  // SVF filter (BiquadFilterNode)
        lfo: null      // LFO oscillator
      });
    }

    // Analyzer para visualización
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.masterGain.connect(this.analyser);

    // Buffers para análisis FFT
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  /**
   * Crea un gain node para un canal
   * @returns {GainNode} Gain node
   */
  createChannelGain() {
    const gain = this.context.createGain();
    gain.gain.value = 1.0;
    gain.connect(this.masterGain);
    return gain;
  }

  /**
   * Convierte nota MIDI a frecuencia en Hz
   * @param {number} midiNote - Nota MIDI (0-127, donde 60 = C4)
   * @returns {number} Frecuencia en Hz
   */
  noteToFrequency(midiNote) {
    // Fórmula estándar: f = 440 * 2^((n-69)/12)
    // Donde 69 = A4 = 440Hz
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  /**
   * Crea un oscilador según el tipo de waveform
   * @param {string} waveform - Tipo de onda (pulse, triangle, sawtooth, noise, fm, karplus, formant)
   * @param {number} frequency - Frecuencia en Hz
   * @param {number} dutyCycle - Duty cycle para pulse wave (0-1)
   * @param {Object} params - Parámetros adicionales para síntesis avanzada
   * @returns {OscillatorNode|AudioBufferSourceNode|Object} Oscilador o estructura compleja
   */
  createOscillator(waveform, frequency, dutyCycle = 0.5, params = {}) {
    if (waveform === 'noise') {
      return this.createNoiseSource();
    }

    // Síntesis FM (2-operator)
    if (waveform === 'fm') {
      return this.createFMOscillator(frequency, params);
    }

    // Karplus-Strong (string synthesis)
    if (waveform === 'karplus') {
      return this.createKarplusStrongOscillator(frequency, params);
    }

    const osc = this.context.createOscillator();

    switch (waveform) {
      case 'pulse':
        // Usar square wave y simular PWM con PeriodicWave
        if (dutyCycle === 0.5) {
          osc.type = 'square';
        } else {
          osc.setPeriodicWave(this.createPulseWave(dutyCycle));
        }
        break;
      case 'triangle':
        osc.type = 'triangle';
        break;
      case 'sawtooth':
        osc.type = 'sawtooth';
        break;
      default:
        osc.type = 'square';
    }

    osc.frequency.value = frequency;
    return osc;
  }

  /**
   * Crea una onda PWM (Pulse Width Modulation)
   * @param {number} dutyCycle - Duty cycle (0-1)
   * @returns {PeriodicWave} Onda periódica
   */
  createPulseWave(dutyCycle) {
    const real = new Float32Array(2);
    const imag = new Float32Array(2);
    real[0] = 0;
    real[1] = dutyCycle * 2 - 1;
    imag[0] = 0;
    imag[1] = 0;
    return this.context.createPeriodicWave(real, imag);
  }

  /**
   * Crea un generador de ruido blanco
   * @returns {AudioBufferSourceNode} Fuente de ruido
   */
  createNoiseSource() {
    const bufferSize = this.context.sampleRate * 2; // 2 segundos
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    // Generar ruido blanco
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  /**
   * Crea un oscilador FM (2-operator)
   * @param {number} carrierFreq - Frecuencia carrier en Hz
   * @param {Object} params - Parámetros: { ratio, index, feedback }
   * @returns {Object} Estructura FM con carrier, modulator y gainNode de salida
   */
  createFMOscillator(carrierFreq, params = {}) {
    const ratio = params.ratio || 1.0;      // Ratio modulador/carrier (default 1:1)
    const index = params.index || 2.0;      // Índice de modulación (intensidad)
    const feedback = params.feedback || 0;  // Feedback del modulador (0-1)

    // Oscilador carrier (portadora)
    const carrier = this.context.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = carrierFreq;

    // Oscilador modulator
    const modulator = this.context.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.value = carrierFreq * ratio;

    // Gain para el índice de modulación
    const modulationGain = this.context.createGain();
    modulationGain.gain.value = carrierFreq * index;

    // Conectar: modulator -> modulationGain -> carrier.frequency
    modulator.connect(modulationGain);
    modulationGain.connect(carrier.frequency);

    // Feedback del modulador (opcional)
    if (feedback > 0) {
      const feedbackGain = this.context.createGain();
      feedbackGain.gain.value = feedback;
      const feedbackDelay = this.context.createDelay(0.01);
      feedbackDelay.delayTime.value = 1 / modulator.frequency.value;

      modulator.connect(feedbackDelay);
      feedbackDelay.connect(feedbackGain);
      feedbackGain.connect(modulator.frequency);
    }

    // Estructura de retorno
    return {
      type: 'fm',
      carrier: carrier,
      modulator: modulator,
      output: carrier,
      start: (time) => {
        modulator.start(time);
        carrier.start(time);
      },
      stop: (time) => {
        modulator.stop(time);
        carrier.stop(time);
      },
      frequency: carrier.frequency  // Para modulación externa
    };
  }

  /**
   * Crea un oscilador Karplus-Strong (string synthesis)
   * @param {number} frequency - Frecuencia fundamental en Hz
   * @param {Object} params - Parámetros: { damping, brightness }
   * @returns {Object} Estructura KS con noise, delay y output
   */
  createKarplusStrongOscillator(frequency, params = {}) {
    const damping = params.damping || 0.99;      // Factor de amortiguamiento (0-1)
    const brightness = params.brightness || 0.5;  // Brillo del sonido (0-1)

    // Burst de ruido para excitación
    const burstLength = 0.01; // 10ms burst
    const bufferSize = Math.floor(this.context.sampleRate * burstLength);
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 5);
    }

    const burst = this.context.createBufferSource();
    burst.buffer = buffer;

    // Delay line (determina el pitch)
    const delayTime = 1 / frequency;
    const delay = this.context.createDelay(1.0);
    delay.delayTime.value = delayTime;

    // Feedback gain (damping)
    const feedback = this.context.createGain();
    feedback.gain.value = damping;

    // Filtro de amortiguamiento (simula pérdida de armónicos)
    const dampingFilter = this.context.createBiquadFilter();
    dampingFilter.type = 'lowpass';
    dampingFilter.frequency.value = frequency * (1 + brightness * 10);
    dampingFilter.Q.value = 0.5;

    // Conexiones: burst -> delay -> filter -> feedback -> delay
    burst.connect(delay);
    delay.connect(dampingFilter);
    dampingFilter.connect(feedback);
    feedback.connect(delay);

    // Salida
    const output = this.context.createGain();
    output.gain.value = 0.5;
    dampingFilter.connect(output);

    return {
      type: 'karplus',
      burst: burst,
      delay: delay,
      output: output,
      start: (time) => {
        burst.start(time);
      },
      stop: (time) => {
        // Karplus-Strong decae naturalmente, no necesita stop explícito
      },
      frequency: {
        value: frequency,
        setValueAtTime: (freq, time) => {
          delay.delayTime.setValueAtTime(1 / freq, time);
        }
      }
    };
  }

  /**
   * Crea filtros formantes para síntesis de vocales
   * @param {OscillatorNode} source - Oscilador fuente
   * @param {string} vowel - Vocal: 'a', 'e', 'i', 'o', 'u'
   * @returns {GainNode} Nodo de salida con formantes aplicados
   */
  createFormantFilter(source, vowel = 'a') {
    // Frecuencias formantes aproximadas (F1, F2, F3) para cada vocal
    const formants = {
      'a': [730, 1090, 2440],
      'e': [530, 1840, 2480],
      'i': [290, 2250, 2890],
      'o': [490, 880, 2540],
      'u': [350, 870, 2250]
    };

    const freqs = formants[vowel] || formants['a'];
    const output = this.context.createGain();
    output.gain.value = 0.3;

    // Crear 3 filtros bandpass para los 3 formantes
    let currentNode = source;
    for (let i = 0; i < 3; i++) {
      const filter = this.context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freqs[i];
      filter.Q.value = 10;  // Resonancia alta para formantes definidos

      currentNode.connect(filter);
      filter.connect(output);
      currentNode = filter;
    }

    return output;
  }

  /**
   * Crea un wavefolder para distorsión armónica
   * @returns {WaveShaperNode} Nodo waveshaper con curva de fold
   */
  createWavefolder() {
    const waveshaper = this.context.createWaveShaper();
    const samples = 1024;
    const curve = new Float32Array(samples);

    // Función de wavefold (pliegue de onda)
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * 2 - 1;  // -1 a 1
      // Fold: refleja la onda cuando excede ±1
      const folded = Math.abs((x % 4 + 4) % 4 - 2) - 1;
      curve[i] = Math.tanh(folded * 2);  // Soft clipping adicional
    }

    waveshaper.curve = curve;
    waveshaper.oversample = '4x';  // Oversampling para reducir aliasing
    return waveshaper;
  }

  /**
   * Reproduce una nota en un canal específico
   * @param {number} channel - Canal (0-7)
   * @param {number} note - Nota MIDI
   * @param {Instrument} instrument - Instrumento a usar
   * @param {number} volume - Volumen (0-64)
   */
  playNote(channel, note, instrument, volume = 48) {
    if (channel < 0 || channel >= this.channels.length) {
      return;
    }

    // Detener nota anterior si existe
    this.stopNote(channel);

    const ch = this.channels[channel];
    const frequency = this.noteToFrequency(note);
    const now = this.context.currentTime;

    // Parámetros para síntesis avanzada
    const params = {
      // FM
      ratio: instrument.fmRatio || 1.0,
      index: instrument.fmIndex || 2.0,
      feedback: instrument.fmFeedback || 0,
      // Karplus-Strong
      damping: instrument.ksDamping || 0.99,
      brightness: instrument.ksBrightness || 0.5,
      // Formant
      vowel: instrument.vowel || 'a'
    };

    // Crear oscilador (puede ser simple o complejo)
    const osc = this.createOscillator(
      instrument.waveform,
      frequency,
      instrument.dutyCycle,
      params
    );

    // Crear envelope (ADSR)
    const envelope = this.context.createGain();
    envelope.gain.value = 0;

    // Determinar el nodo de salida del oscilador
    let oscOutput;
    if (osc.output) {
      // Oscilador complejo (FM, Karplus-Strong)
      oscOutput = osc.output;
    } else {
      // Oscilador simple
      oscOutput = osc;
    }

    // Aplicar wavefolder si está habilitado
    let audioChain = oscOutput;
    if (instrument.wavefold && instrument.wavefold > 0) {
      const wavefolder = this.createWavefolder();
      const foldGain = this.context.createGain();
      foldGain.gain.value = 1 + instrument.wavefold * 3;  // Aumentar gain para folding

      oscOutput.connect(foldGain);
      foldGain.connect(wavefolder);
      audioChain = wavefolder;
    }

    // SVF Filter (si está habilitado)
    if (instrument.filter && instrument.filter.enabled) {
      const filter = this.context.createBiquadFilter();
      filter.type = instrument.filter.type;
      filter.frequency.value = instrument.filter.cutoff;
      filter.Q.value = instrument.filter.resonance;

      // Conectar en la cadena
      audioChain.connect(filter);
      filter.connect(envelope);
      audioChain = filter;

      // Guardar referencia al filter
      ch.filter = filter;
    } else {
      // Sin filter, conexión directa
      audioChain.connect(envelope);
      ch.filter = null;
    }

    envelope.connect(ch.gain);

    // LFO (Low Frequency Oscillator) para modulación
    if (instrument.lfo && instrument.lfo.enabled) {
      const lfo = this.context.createOscillator();
      lfo.type = instrument.lfo.waveform;
      lfo.frequency.value = instrument.lfo.rate;

      const lfoGain = this.context.createGain();
      lfoGain.gain.value = instrument.lfo.depth;

      lfo.connect(lfoGain);

      // Conectar LFO según el target
      switch (instrument.lfo.target) {
        case 'pitch':
          // Modular frecuencia del oscilador
          const freqNode = osc.frequency || (osc.carrier && osc.carrier.frequency);
          if (freqNode) {
            lfoGain.connect(freqNode);
          }
          break;

        case 'filter':
          // Modular cutoff del filtro (si existe)
          if (ch.filter && ch.filter.frequency) {
            lfoGain.gain.value = instrument.lfo.depth * 1000; // Escalar para Hz
            lfoGain.connect(ch.filter.frequency);
          }
          break;

        case 'volume':
          // Modular volumen del envelope
          lfoGain.gain.value = instrument.lfo.depth * 0.5;
          lfoGain.connect(envelope.gain);
          break;
      }

      lfo.start(now);
      ch.lfo = lfo;
    } else {
      ch.lfo = null;
    }

    // Calcular volumen final
    const finalVolume = (volume / 64) * instrument.volume;

    // Aplicar ADSR envelope
    const { attack, decay, sustain, release } = instrument.envelope;

    // Attack
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(finalVolume, now + attack);

    // Decay
    envelope.gain.linearRampToValueAtTime(
      finalVolume * sustain,
      now + attack + decay
    );

    // Iniciar oscilador (simple o complejo)
    if (osc.start) {
      osc.start(now);
    } else if (typeof osc === 'function') {
      osc();
    }

    // Guardar referencias
    ch.oscillator = osc;
    ch.envelope = envelope;
    ch.currentNote = note;
  }

  /**
   * Detiene la nota en un canal
   * @param {number} channel - Canal (0-7)
   */
  stopNote(channel) {
    if (channel < 0 || channel >= this.channels.length) {
      return;
    }

    const ch = this.channels[channel];
    if (!ch.oscillator) {
      return;
    }

    // Aplicar release
    const now = this.context.currentTime;
    const release = 0.05; // Release por defecto

    ch.envelope.gain.cancelScheduledValues(now);
    ch.envelope.gain.setValueAtTime(ch.envelope.gain.value, now);
    ch.envelope.gain.linearRampToValueAtTime(0, now + release);

    // Detener oscilador después del release
    const osc = ch.oscillator;
    if (osc.stop) {
      // Oscilador complejo (FM, Karplus-Strong) o simple
      osc.stop(now + release);
    } else if (osc.carrier) {
      // FM specific
      osc.carrier.stop(now + release);
      if (osc.modulator) osc.modulator.stop(now + release);
    } else if (osc.burst) {
      // Karplus-Strong specific (burst ya se autodestruye)
    }

    // Detener LFO si existe
    if (ch.lfo) {
      ch.lfo.stop(now + release);
    }

    // Limpiar referencias
    ch.oscillator = null;
    ch.envelope = null;
    ch.currentNote = null;
    ch.filter = null;
    ch.lfo = null;
  }

  /**
   * Detiene todas las notas
   */
  stopAll() {
    for (let i = 0; i < this.channels.length; i++) {
      this.stopNote(i);
    }
  }

  /**
   * Obtiene datos FFT para visualización
   * @returns {Uint8Array} Datos de frecuencia
   */
  getFFTData() {
    this.analyser.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  /**
   * Obtiene datos de waveform para visualización
   * @returns {Uint8Array} Datos de dominio temporal
   */
  getWaveformData() {
    this.analyser.getByteTimeDomainData(this.timeDomainData);
    return this.timeDomainData;
  }

  /**
   * Establece el volumen maestro
   * @param {number} volume - Volumen (0-1)
   */
  setMasterVolume(volume) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Establece la frecuencia de un canal en tiempo real (para efectos)
   * @param {number} channel - Canal (0-7)
   * @param {number} frequency - Frecuencia en Hz
   */
  setChannelFrequency(channel, frequency) {
    const ch = this.channels[channel];
    if (!ch || !ch.oscillator) {
      return;
    }

    // Cambiar frecuencia del oscilador activo
    if (ch.oscillator.frequency) {
      ch.oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    }
  }

  /**
   * Establece el volumen de un canal en tiempo real (para efectos)
   * @param {number} channel - Canal (0-7)
   * @param {number} volume - Volumen normalizado (0-1)
   */
  setChannelVolume(channel, volume) {
    const ch = this.channels[channel];
    if (!ch || !ch.gain) {
      return;
    }

    // Cambiar volumen del gain node
    ch.gain.gain.setValueAtTime(volume, this.context.currentTime);
  }
}
