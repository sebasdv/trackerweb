/**
 * Effects.js
 * Efectos clásicos de tracker (arpeggio, vibrato, portamento, etc.)
 */

class Effects {
  /**
   * Códigos de efectos MOD/XM
   */
  static CODES = {
    ARPEGGIO: 0x0,
    PORTA_UP: 0x1,
    PORTA_DOWN: 0x2,
    TONE_PORTA: 0x3,
    VIBRATO: 0x4,
    TREMOLO: 0x7,
    SET_VOLUME: 0xC,
    SET_SPEED_TEMPO: 0xF
  };

  /**
   * Nombres de efectos
   */
  static NAMES = {
    0x0: 'Arpeggio',
    0x1: 'Porta Up',
    0x2: 'Porta Down',
    0x3: 'Tone Porta',
    0x4: 'Vibrato',
    0x7: 'Tremolo',
    0xC: 'Set Volume',
    0xF: 'Set Speed/Tempo'
  };

  /**
   * Obtiene el nombre de un efecto
   * @param {number} code - Código del efecto
   * @returns {string} Nombre del efecto
   */
  static getName(code) {
    return Effects.NAMES[code] || 'Unknown';
  }

  /**
   * Formatea un código de efecto en hexadecimal
   * @param {number} code - Código del efecto
   * @param {number} param - Parámetro del efecto
   * @returns {string} String formateado (ej: "F0A")
   */
  static format(code, param) {
    const codeHex = code.toString(16).toUpperCase();
    const paramHex = param.toString(16).toUpperCase().padStart(2, '0');
    return `${codeHex}${paramHex}`;
  }
}

/**
 * EffectProcessor
 * Procesa efectos por canal con estado persistente
 */
class EffectProcessor {
  /**
   * Crea un procesador de efectos
   * @param {AudioEngine} audioEngine - Motor de audio
   */
  constructor(audioEngine) {
    this.audioEngine = audioEngine;

    // Estado por canal
    this.channels = [];
    for (let i = 0; i < 4; i++) {
      this.channels.push({
        // Estado general
        note: null,          // Nota actual
        frequency: 0,        // Frecuencia actual
        volume: 48,          // Volumen actual (0-64)

        // Arpeggio (0x0)
        arpeggioParam: 0,
        arpeggioTick: 0,

        // Portamento (0x1, 0x2, 0x3)
        portaSpeed: 0,       // Velocidad de portamento
        portaTarget: 0,      // Frecuencia objetivo para tone portamento

        // Vibrato (0x4)
        vibratoSpeed: 0,
        vibratoDepth: 0,
        vibratoPos: 0
      });
    }
  }

  /**
   * Procesa un efecto en el inicio de una fila (trigger)
   * @param {number} channel - Canal
   * @param {number} note - Nota MIDI (o null)
   * @param {number} volume - Volumen (0-64)
   * @param {number} effect - Código de efecto
   * @param {number} param - Parámetro del efecto
   */
  trigger(channel, note, volume, effect, param) {
    const ch = this.channels[channel];

    // Actualizar nota y volumen base
    if (note !== null) {
      ch.note = note;
      ch.frequency = this.noteToFrequency(note);
    }

    if (volume !== null) {
      ch.volume = volume;
    }

    // Procesar efectos específicos en trigger
    switch (effect) {
      case 0x0: // Arpeggio
        ch.arpeggioParam = param;
        ch.arpeggioTick = 0;
        break;

      case 0x1: // Porta Up
        if (param > 0) {
          ch.portaSpeed = param;
        }
        break;

      case 0x2: // Porta Down
        if (param > 0) {
          ch.portaSpeed = param;
        }
        break;

      case 0x3: // Tone Portamento
        if (note !== null) {
          ch.portaTarget = this.noteToFrequency(note);
        }
        if (param > 0) {
          ch.portaSpeed = param;
        }
        break;

      case 0x4: // Vibrato
        if (param > 0) {
          const speed = (param >> 4) & 0xF;
          const depth = param & 0xF;
          if (speed > 0) ch.vibratoSpeed = speed;
          if (depth > 0) ch.vibratoDepth = depth;
        }
        break;

      case 0xC: // Set Volume
        ch.volume = Math.min(64, param);
        this.audioEngine.setChannelVolume(channel, ch.volume / 64);
        break;
    }
  }

  /**
   * Procesa efectos en cada tick (llamado por el sequencer)
   * @param {number} channel - Canal
   * @param {number} effect - Código de efecto
   * @param {number} tick - Tick actual dentro de la fila
   */
  processTick(channel, effect, tick) {
    const ch = this.channels[channel];

    switch (effect) {
      case 0x0: // Arpeggio
        this.processArpeggio(channel, tick);
        break;

      case 0x1: // Porta Up
        this.processPortaUp(channel);
        break;

      case 0x2: // Porta Down
        this.processPortaDown(channel);
        break;

      case 0x3: // Tone Portamento
        this.processTonePorta(channel);
        break;

      case 0x4: // Vibrato
        this.processVibrato(channel);
        break;
    }
  }

  /**
   * Procesa arpeggio (cicla entre 3 notas)
   * @param {number} channel - Canal
   * @param {number} tick - Tick actual
   */
  processArpeggio(channel, tick) {
    const ch = this.channels[channel];
    if (ch.arpeggioParam === 0 || ch.note === null) return;

    const x = (ch.arpeggioParam >> 4) & 0xF;
    const y = ch.arpeggioParam & 0xF;

    const tickMod = tick % 3;
    let offset = 0;

    if (tickMod === 1) offset = x;
    else if (tickMod === 2) offset = y;

    const freq = this.noteToFrequency(ch.note + offset);
    this.audioEngine.setChannelFrequency(channel, freq);
  }

  /**
   * Procesa pitch slide up
   * @param {number} channel - Canal
   */
  processPortaUp(channel) {
    const ch = this.channels[channel];
    if (ch.portaSpeed === 0) return;

    // Incrementar frecuencia (slide up)
    ch.frequency *= Math.pow(2, ch.portaSpeed / 768);

    // Limitar a rango válido
    ch.frequency = Math.min(ch.frequency, 20000);

    this.audioEngine.setChannelFrequency(channel, ch.frequency);
  }

  /**
   * Procesa pitch slide down
   * @param {number} channel - Canal
   */
  processPortaDown(channel) {
    const ch = this.channels[channel];
    if (ch.portaSpeed === 0) return;

    // Decrementar frecuencia (slide down)
    ch.frequency /= Math.pow(2, ch.portaSpeed / 768);

    // Limitar a rango válido
    ch.frequency = Math.max(ch.frequency, 20);

    this.audioEngine.setChannelFrequency(channel, ch.frequency);
  }

  /**
   * Procesa tone portamento (slide hacia nota objetivo)
   * @param {number} channel - Canal
   */
  processTonePorta(channel) {
    const ch = this.channels[channel];
    if (ch.portaSpeed === 0 || ch.portaTarget === 0) return;

    const delta = ch.portaTarget - ch.frequency;
    const step = ch.portaSpeed * 0.5;

    if (Math.abs(delta) < step) {
      ch.frequency = ch.portaTarget;
    } else if (delta > 0) {
      ch.frequency += step;
    } else {
      ch.frequency -= step;
    }

    this.audioEngine.setChannelFrequency(channel, ch.frequency);
  }

  /**
   * Procesa vibrato (modulación de pitch)
   * @param {number} channel - Canal
   */
  processVibrato(channel) {
    const ch = this.channels[channel];
    if (ch.vibratoDepth === 0) return;

    // Onda sinusoidal para vibrato
    const phase = (ch.vibratoPos / 64) * Math.PI * 2;
    const offset = Math.sin(phase) * ch.vibratoDepth * 0.01;

    const freq = ch.frequency * Math.pow(2, offset / 12);
    this.audioEngine.setChannelFrequency(channel, freq);

    // Avanzar posición
    ch.vibratoPos = (ch.vibratoPos + ch.vibratoSpeed) % 64;
  }

  /**
   * Convierte nota MIDI a frecuencia
   * @param {number} note - Nota MIDI
   * @returns {number} Frecuencia en Hz
   */
  noteToFrequency(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }
}
