/**
 * Song.js
 * Representa una canción completa con patterns, instrumentos y metadata
 */

class Song {
  /**
   * Crea una nueva canción
   * @param {string} title - Título de la canción
   * @param {string} author - Autor
   */
  constructor(title = 'Untitled', author = 'Unknown') {
    this.title = title;
    this.author = author;

    // Configuración de reproducción
    this.bpm = 125;        // Beats por minuto
    this.speed = 6;        // Ticks por row
    this.channels = 4;     // Número de canales

    // Instrumentos
    this.instruments = [
      Instrument.PRESETS.SQUARE_50(),
      Instrument.PRESETS.SQUARE_25(),
      Instrument.PRESETS.TRIANGLE(),
      Instrument.PRESETS.SAWTOOTH()
    ];

    // Patterns
    this.patterns = [
      new Pattern(this.channels, 64)
    ];

    // Order (secuencia de patterns)
    this.order = [0]; // Índices de patterns
  }

  /**
   * Agrega un nuevo pattern
   * @returns {number} Índice del nuevo pattern
   */
  addPattern() {
    const pattern = new Pattern(this.channels, 64);
    this.patterns.push(pattern);
    return this.patterns.length - 1;
  }

  /**
   * Obtiene un pattern por índice
   * @param {number} index - Índice del pattern
   * @returns {Pattern} Pattern
   */
  getPattern(index) {
    if (index < 0 || index >= this.patterns.length) {
      return null;
    }
    return this.patterns[index];
  }

  /**
   * Agrega un nuevo instrumento
   * @param {Instrument} instrument - Instrumento a agregar
   * @returns {number} Índice del nuevo instrumento
   */
  addInstrument(instrument) {
    this.instruments.push(instrument);
    return this.instruments.length - 1;
  }

  /**
   * Obtiene un instrumento por índice
   * @param {number} index - Índice del instrumento
   * @returns {Instrument} Instrumento
   */
  getInstrument(index) {
    if (index < 0 || index >= this.instruments.length) {
      return this.instruments[0]; // Default
    }
    return this.instruments[index];
  }

  /**
   * Calcula la duración total de la canción en segundos
   * @returns {number} Duración en segundos
   */
  getDuration() {
    const ticksPerSecond = (this.bpm * this.speed) / 150;
    const ticksPerRow = this.speed;
    const rowsPerSecond = ticksPerSecond / ticksPerRow;
    const totalRows = this.order.length * 64; // Asumiendo 64 rows por pattern
    return totalRows / rowsPerSecond;
  }

  /**
   * Serializa la canción a JSON
   * @returns {Object} Representación JSON de la canción
   */
  toJSON() {
    return {
      title: this.title,
      author: this.author,
      bpm: this.bpm,
      speed: this.speed,
      channels: this.channels,
      instruments: this.instruments.map(inst => inst.toJSON()),
      patterns: this.patterns.map(pat => pat.toJSON()),
      order: [...this.order]
    };
  }

  /**
   * Carga una canción desde JSON
   * @param {Object} data - Datos JSON de la canción
   * @returns {Song} Nueva canción cargada
   */
  static fromJSON(data) {
    const song = new Song(data.title, data.author);
    song.bpm = data.bpm || 125;
    song.speed = data.speed || 6;
    song.channels = data.channels || 4;

    song.instruments = data.instruments.map(inst => Instrument.fromJSON(inst));
    song.patterns = data.patterns.map(pat => Pattern.fromJSON(pat));
    song.order = [...data.order];

    return song;
  }

  /**
   * Guarda la canción como archivo JSON
   * @returns {Blob} Blob con los datos JSON
   */
  save() {
    const json = JSON.stringify(this.toJSON(), null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Carga una canción desde un archivo
   * @param {File} file - Archivo a cargar
   * @returns {Promise<Song>} Promesa con la canción cargada
   */
  static async load(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const song = Song.fromJSON(data);
          resolve(song);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}
