/**
 * Pattern.js
 * Representa un pattern (matriz de notas) tipo MOD/XM
 */

class Pattern {
  /**
   * Crea un nuevo pattern
   * @param {number} channels - Número de canales (típicamente 4)
   * @param {number} rows - Número de filas (típicamente 64)
   */
  constructor(channels = 4, rows = 64) {
    this.channels = channels;
    this.rows = rows;
    this.data = [];

    // Inicializar pattern vacío
    for (let row = 0; row < rows; row++) {
      const rowData = [];
      for (let ch = 0; ch < channels; ch++) {
        rowData.push(this.createEmptyCell());
      }
      this.data.push(rowData);
    }
  }

  /**
   * Crea una celda vacía
   * @returns {Object} Celda vacía
   */
  createEmptyCell() {
    return {
      note: null,        // MIDI note (60 = C4) o null
      instrument: null,  // Índice del instrumento o null
      volume: null,      // 0-64 o null
      effect: 0x0,       // Código de efecto (hex)
      effectParam: 0x0   // Parámetro del efecto (hex)
    };
  }

  /**
   * Obtiene una celda del pattern
   * @param {number} row - Fila (0-63)
   * @param {number} channel - Canal (0-3)
   * @returns {Object} Celda
   */
  getCell(row, channel) {
    if (row < 0 || row >= this.rows || channel < 0 || channel >= this.channels) {
      return null;
    }
    return this.data[row][channel];
  }

  /**
   * Establece una celda del pattern
   * @param {number} row - Fila
   * @param {number} channel - Canal
   * @param {Object} cell - Datos de la celda
   */
  setCell(row, channel, cell) {
    if (row < 0 || row >= this.rows || channel < 0 || channel >= this.channels) {
      return;
    }
    this.data[row][channel] = { ...cell };
  }

  /**
   * Establece una nota en el pattern
   * @param {number} row - Fila
   * @param {number} channel - Canal
   * @param {number} note - Nota MIDI (0-127)
   * @param {number} instrument - Índice del instrumento
   * @param {number} volume - Volumen (0-64)
   */
  setNote(row, channel, note, instrument = 0, volume = 48) {
    const cell = this.getCell(row, channel);
    if (cell) {
      cell.note = note;
      cell.instrument = instrument;
      cell.volume = volume;
    }
  }

  /**
   * Limpia una celda
   * @param {number} row - Fila
   * @param {number} channel - Canal
   */
  clearCell(row, channel) {
    this.setCell(row, channel, this.createEmptyCell());
  }

  /**
   * Limpia todo el pattern
   */
  clear() {
    for (let row = 0; row < this.rows; row++) {
      for (let ch = 0; ch < this.channels; ch++) {
        this.clearCell(row, ch);
      }
    }
  }

  /**
   * Serializa el pattern a JSON
   * @returns {Object} Representación JSON del pattern
   */
  toJSON() {
    return {
      channels: this.channels,
      rows: this.rows,
      data: this.data.map(row => row.map(cell => ({ ...cell })))
    };
  }

  /**
   * Carga un pattern desde JSON
   * @param {Object} data - Datos JSON del pattern
   * @returns {Pattern} Nuevo pattern cargado
   */
  static fromJSON(data) {
    const pattern = new Pattern(data.channels, data.rows);
    pattern.data = data.data.map(row => row.map(cell => ({ ...cell })));
    return pattern;
  }

  /**
   * Crea una copia del pattern
   * @returns {Pattern} Copia del pattern
   */
  clone() {
    return Pattern.fromJSON(this.toJSON());
  }
}
