/**
 * Effects.js
 * Efectos clásicos de tracker (arpeggio, vibrato, portamento, etc.)
 * TODO: Implementar efectos completos en fase futura
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
