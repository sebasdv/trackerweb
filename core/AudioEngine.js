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

    // Canales de audio (típicamente 4)
    this.channels = [];
    for (let i = 0; i < 4; i++) {
      this.channels.push({
        gain: this.createChannelGain(),
        currentNote: null,
        oscillator: null,
        envelope: null
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
   * @param {string} waveform - Tipo de onda (pulse, triangle, sawtooth, noise)
   * @param {number} frequency - Frecuencia en Hz
   * @param {number} dutyCycle - Duty cycle para pulse wave (0-1)
   * @returns {OscillatorNode|AudioBufferSourceNode} Oscilador
   */
  createOscillator(waveform, frequency, dutyCycle = 0.5) {
    if (waveform === 'noise') {
      return this.createNoiseSource();
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
   * Reproduce una nota en un canal específico
   * @param {number} channel - Canal (0-3)
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

    // Crear oscilador
    const osc = this.createOscillator(
      instrument.waveform,
      frequency,
      instrument.dutyCycle
    );

    // Crear envelope (ADSR)
    const envelope = this.context.createGain();
    envelope.gain.value = 0;

    // Conectar: oscilador -> envelope -> canal gain
    osc.connect(envelope);
    envelope.connect(ch.gain);

    // Calcular volumen final
    const finalVolume = (volume / 64) * instrument.volume;

    // Aplicar ADSR envelope
    const now = this.context.currentTime;
    const { attack, decay, sustain, release } = instrument.envelope;

    // Attack
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(finalVolume, now + attack);

    // Decay
    envelope.gain.linearRampToValueAtTime(
      finalVolume * sustain,
      now + attack + decay
    );

    // Iniciar oscilador
    osc.start(now);

    // Guardar referencias
    ch.oscillator = osc;
    ch.envelope = envelope;
    ch.currentNote = note;
  }

  /**
   * Detiene la nota en un canal
   * @param {number} channel - Canal (0-3)
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
    ch.oscillator.stop(now + release);

    // Limpiar referencias
    ch.oscillator = null;
    ch.envelope = null;
    ch.currentNote = null;
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
   * @param {number} channel - Canal (0-3)
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
   * @param {number} channel - Canal (0-3)
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
