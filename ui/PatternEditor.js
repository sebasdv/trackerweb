/**
 * PatternEditor.js
 * Editor visual de patterns con p5.js
 */

class PatternEditor {
  /**
   * Crea un nuevo editor de patterns
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} w - Ancho
   * @param {number} h - Alto
   */
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;

    // Cursor
    this.cursorRow = 0;
    this.cursorChannel = 0;
    this.cursorField = 0; // 0=note, 1=inst, 2=vol, 3=fx, 4=fxparam

    // Scroll
    this.scrollRow = 0;
    this.visibleRows = 16;

    // Dimensiones de celda
    this.cellHeight = 20;
    this.channelWidth = 140;

    // Referencias
    this.pattern = null;
    this.song = null;
    this.audioEngine = null; // Para preview

    // Edición
    this.currentOctave = 4; // Octava actual (0-9)
    this.currentInstrument = 0; // Instrumento actual
    this.editStep = 1; // Cuántas filas avanzar después de insertar

    // Nombres de notas
    this.noteNames = [
      'C-', 'C#', 'D-', 'D#', 'E-', 'F-',
      'F#', 'G-', 'G#', 'A-', 'A#', 'B-'
    ];

    // Mapeo de teclas a notas (estilo FastTracker 2)
    // Fila inferior: Z X C V B N M
    // Fila media: Q W E R T Y U I
    // Fila superior: A S D F G H J K
    this.keyToNote = {
      // Fila inferior (C a B, escala cromática)
      'z': 0,  // C
      's': 1,  // C#
      'x': 2,  // D
      'd': 3,  // D#
      'c': 4,  // E
      'v': 5,  // F
      'g': 6,  // F#
      'b': 7,  // G
      'h': 8,  // G#
      'n': 9,  // A
      'j': 10, // A#
      'm': 11, // B

      // Fila superior (siguiente octava)
      'q': 12, // C
      '2': 13, // C#
      'w': 14, // D
      '3': 15, // D#
      'e': 16, // E
      'r': 17, // F
      '5': 18, // F#
      't': 19, // G
      '6': 20, // G#
      'y': 21, // A
      '7': 22, // A#
      'u': 23, // B
      'i': 24  // C (siguiente octava)
    };
  }

  /**
   * Establece el pattern a editar
   * @param {Pattern} pattern - Pattern
   * @param {Song} song - Canción (para instrumentos)
   * @param {AudioEngine} audioEngine - Motor de audio (para preview)
   */
  setPattern(pattern, song, audioEngine = null) {
    this.pattern = pattern;
    this.song = song;
    this.audioEngine = audioEngine;
  }

  /**
   * Renderiza el editor
   */
  render() {
    if (!this.pattern) {
      return;
    }

    push();
    translate(this.x, this.y);

    // Fondo
    fill(20);
    noStroke();
    rect(0, 0, this.width, this.height);

    // Header
    this.renderHeader();

    // Grid
    this.renderGrid();

    // Cells
    this.renderCells();

    // Cursor
    this.renderCursor();

    // Info de edición
    this.renderEditInfo();

    pop();
  }

  /**
   * Renderiza el header con números de canal
   */
  renderHeader() {
    fill(60);
    noStroke();
    rect(0, 0, this.width, 30);

    // Info de pattern (tamaño)
    fill(150);
    textSize(11);
    textAlign(LEFT, CENTER);
    text(`${this.pattern.rows} rows`, 5, 15);

    // Canales
    fill(200);
    textSize(12);
    textAlign(CENTER, CENTER);

    for (let ch = 0; ch < this.pattern.channels; ch++) {
      const x = 40 + ch * this.channelWidth + this.channelWidth / 2;
      text(`Channel ${ch + 1}`, x, 15);
    }
  }

  /**
   * Renderiza el grid
   */
  renderGrid() {
    stroke(40);
    strokeWeight(1);

    const startRow = this.scrollRow;
    const endRow = Math.min(startRow + this.visibleRows, this.pattern.rows);

    // Líneas horizontales
    for (let i = 0; i <= this.visibleRows; i++) {
      const y = 30 + i * this.cellHeight;
      line(0, y, this.width, y);
    }

    // Líneas verticales
    line(40, 30, 40, 30 + this.visibleRows * this.cellHeight); // Números de fila

    for (let ch = 0; ch <= this.pattern.channels; ch++) {
      const x = 40 + ch * this.channelWidth;
      line(x, 30, x, 30 + this.visibleRows * this.cellHeight);
    }
  }

  /**
   * Renderiza las celdas
   */
  renderCells() {
    const startRow = this.scrollRow;
    const endRow = Math.min(startRow + this.visibleRows, this.pattern.rows);

    textAlign(LEFT, CENTER);
    textSize(12);

    for (let i = 0; i < endRow - startRow; i++) {
      const row = startRow + i;
      const y = 30 + i * this.cellHeight + this.cellHeight / 2;

      // Número de fila
      fill(row % 4 === 0 ? 200 : 150);
      text(row.toString().padStart(2, '0'), 8, y);

      // Celdas de cada canal
      for (let ch = 0; ch < this.pattern.channels; ch++) {
        const cell = this.pattern.getCell(row, ch);
        const x = 40 + ch * this.channelWidth + 5;

        this.renderCell(cell, x, y);
      }
    }
  }

  /**
   * Renderiza una celda individual
   * @param {Object} cell - Celda
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   */
  renderCell(cell, x, y) {
    if (!cell) {
      return;
    }

    fill(180);

    // Nota
    const noteStr = this.formatNote(cell.note);
    text(noteStr, x, y);

    // Instrumento
    const instStr = cell.instrument !== null
      ? cell.instrument.toString(16).toUpperCase().padStart(2, '0')
      : '..';
    text(instStr, x + 35, y);

    // Volumen
    const volStr = cell.volume !== null
      ? cell.volume.toString(16).toUpperCase().padStart(2, '0')
      : '..';
    text(volStr, x + 60, y);

    // Efecto
    if (cell.effect !== 0x0 || cell.effectParam !== 0x0) {
      const fxStr = Effects.format(cell.effect, cell.effectParam);
      text(fxStr, x + 85, y);
    } else {
      text('...', x + 85, y);
    }
  }

  /**
   * Formatea una nota MIDI a string
   * @param {number} note - Nota MIDI
   * @returns {string} String formateado (ej: "C-4")
   */
  formatNote(note) {
    if (note === null) {
      return '...';
    }

    const octave = Math.floor(note / 12) - 1;
    const noteName = this.noteNames[note % 12];
    return `${noteName}${octave}`;
  }

  /**
   * Renderiza el cursor
   */
  renderCursor() {
    const row = this.cursorRow - this.scrollRow;

    if (row < 0 || row >= this.visibleRows) {
      return;
    }

    const y = 30 + row * this.cellHeight;
    const x = 40 + this.cursorChannel * this.channelWidth;

    // Highlight de fila
    fill(80, 80, 120, 100);
    noStroke();
    rect(40, y, this.pattern.channels * this.channelWidth, this.cellHeight);

    // Cursor específico del campo
    const fieldOffsets = [0, 35, 60, 85, 95];
    const fieldWidths = [30, 20, 20, 10, 20];
    const fieldX = x + fieldOffsets[this.cursorField] + 5;
    const fieldW = fieldWidths[this.cursorField];

    stroke(255, 200, 0);
    strokeWeight(2);
    noFill();
    rect(fieldX, y + 2, fieldW, this.cellHeight - 4);
  }

  /**
   * Renderiza información de edición (octava, instrumento)
   */
  renderEditInfo() {
    // Fondo para info
    fill(30);
    noStroke();
    rect(this.width - 180, 5, 175, 20);

    // Texto de info
    fill(0, 200, 255);
    textSize(12);
    textAlign(LEFT, CENTER);

    const octaveText = `Oct: ${this.currentOctave}`;
    const instText = `Inst: ${this.currentInstrument.toString(16).toUpperCase().padStart(2, '0')}`;
    const fieldNames = ['Note', 'Inst', 'Vol', 'FX', 'Param'];
    const fieldText = `[${fieldNames[this.cursorField]}]`;

    text(`${octaveText} | ${instText} | ${fieldText}`, this.width - 175, 15);
  }

  /**
   * Maneja input de teclado
   * @param {string} key - Tecla presionada
   * @param {number} keyCode - Código de tecla
   */
  handleKeyPress(key, keyCode) {
    if (!this.pattern) {
      return;
    }

    const keyLower = key ? key.toLowerCase() : '';

    // Tab: Cambiar campo
    if (keyCode === TAB) {
      this.cursorField = (this.cursorField + 1) % 5;
      return;
    }

    // Delete/Backspace: Borrar nota
    if (keyCode === DELETE || keyCode === BACKSPACE) {
      this.deleteNote();
      return;
    }

    // Números 0-9: Cambiar octava (solo si no estamos en campo de edición numérica)
    if (this.cursorField === 0 && keyLower >= '0' && keyLower <= '9') {
      const octave = parseInt(keyLower);
      if (octave >= 0 && octave <= 9) {
        this.currentOctave = octave;
        console.log(`Octave changed to: ${this.currentOctave}`);
      }
      return;
    }

    // Navegación con flechas
    if (keyCode === UP_ARROW) {
      this.moveCursor(0, -1);
      return;
    } else if (keyCode === DOWN_ARROW) {
      this.moveCursor(0, 1);
      return;
    } else if (keyCode === LEFT_ARROW) {
      this.moveCursor(-1, 0);
      return;
    } else if (keyCode === RIGHT_ARROW) {
      this.moveCursor(1, 0);
      return;
    }

    // PageUp/PageDown: Scroll rápido
    if (keyCode === 33) { // PageUp
      this.moveCursor(0, -8);
      return;
    } else if (keyCode === 34) { // PageDown
      this.moveCursor(0, 8);
      return;
    }

    // Edición según campo actual
    if (this.cursorField === 0) {
      // Campo de nota
      this.handleNoteInput(keyLower);
    } else if (this.cursorField === 1) {
      // Campo de instrumento
      this.handleInstrumentInput(keyLower);
    } else if (this.cursorField === 2) {
      // Campo de volumen
      this.handleVolumeInput(keyLower);
    } else if (this.cursorField === 3 || this.cursorField === 4) {
      // Campo de efecto
      this.handleEffectInput(keyLower);
    }
  }

  /**
   * Maneja input de notas
   * @param {string} key - Tecla presionada
   */
  handleNoteInput(key) {
    if (this.keyToNote.hasOwnProperty(key)) {
      const noteOffset = this.keyToNote[key];
      const midiNote = (this.currentOctave * 12) + noteOffset;

      // Validar rango MIDI (0-127)
      if (midiNote >= 0 && midiNote <= 127) {
        const cell = this.pattern.getCell(this.cursorRow, this.cursorChannel);
        if (cell) {
          cell.note = midiNote;
          cell.instrument = this.currentInstrument;
          cell.volume = 48; // Volumen por defecto

          // Preview de audio
          if (this.audioEngine && this.song) {
            const instrument = this.song.getInstrument(this.currentInstrument);
            this.audioEngine.playNote(this.cursorChannel, midiNote, instrument, 48);
          }

          // Avanzar cursor
          this.moveCursor(0, this.editStep);
        }
      }
    }
  }

  /**
   * Maneja input de instrumento (hex)
   * @param {string} key - Tecla presionada
   */
  handleInstrumentInput(key) {
    if (this.isHexChar(key)) {
      const cell = this.pattern.getCell(this.cursorRow, this.cursorChannel);
      if (cell) {
        const hexValue = parseInt(key, 16);

        // Construir número de 2 dígitos
        if (cell.instrument === null) {
          cell.instrument = hexValue;
        } else {
          cell.instrument = (cell.instrument * 16 + hexValue) % 256;
        }

        // Actualizar instrumento actual
        this.currentInstrument = cell.instrument;

        // Avanzar cursor
        this.moveCursor(0, this.editStep);
      }
    }
  }

  /**
   * Maneja input de volumen (hex)
   * @param {string} key - Tecla presionada
   */
  handleVolumeInput(key) {
    if (this.isHexChar(key)) {
      const cell = this.pattern.getCell(this.cursorRow, this.cursorChannel);
      if (cell) {
        const hexValue = parseInt(key, 16);

        // Construir número de 2 dígitos (0-64)
        if (cell.volume === null) {
          cell.volume = hexValue;
        } else {
          cell.volume = Math.min(64, (cell.volume * 16 + hexValue) % 256);
        }

        // Avanzar cursor
        this.moveCursor(0, this.editStep);
      }
    }
  }

  /**
   * Maneja input de efecto (hex)
   * @param {string} key - Tecla presionada
   */
  handleEffectInput(key) {
    if (this.isHexChar(key)) {
      const cell = this.pattern.getCell(this.cursorRow, this.cursorChannel);
      if (cell) {
        const hexValue = parseInt(key, 16);

        if (this.cursorField === 3) {
          // Código de efecto (1 dígito)
          cell.effect = hexValue;
        } else {
          // Parámetro de efecto (2 dígitos)
          if (cell.effectParam === null || cell.effectParam === 0) {
            cell.effectParam = hexValue;
          } else {
            cell.effectParam = (cell.effectParam * 16 + hexValue) % 256;
          }
        }

        // Avanzar cursor
        this.moveCursor(0, this.editStep);
      }
    }
  }

  /**
   * Borra la nota/campo actual
   */
  deleteNote() {
    const cell = this.pattern.getCell(this.cursorRow, this.cursorChannel);
    if (!cell) {
      return;
    }

    if (this.cursorField === 0) {
      // Borrar nota
      cell.note = null;
      cell.instrument = null;
      cell.volume = null;
    } else if (this.cursorField === 1) {
      // Borrar instrumento
      cell.instrument = null;
    } else if (this.cursorField === 2) {
      // Borrar volumen
      cell.volume = null;
    } else if (this.cursorField === 3) {
      // Borrar efecto
      cell.effect = 0x0;
      cell.effectParam = 0x0;
    } else if (this.cursorField === 4) {
      // Borrar parámetro de efecto
      cell.effectParam = 0x0;
    }
  }

  /**
   * Verifica si un carácter es hexadecimal válido
   * @param {string} char - Carácter
   * @returns {boolean} True si es hex válido
   */
  isHexChar(char) {
    return /^[0-9a-f]$/i.test(char);
  }

  /**
   * Mueve el cursor
   * @param {number} dChannel - Delta de canal
   * @param {number} dRow - Delta de fila
   */
  moveCursor(dChannel, dRow) {
    // Mover canal
    if (dChannel !== 0) {
      this.cursorChannel += dChannel;
      if (this.cursorChannel < 0) {
        this.cursorChannel = this.pattern.channels - 1;
      } else if (this.cursorChannel >= this.pattern.channels) {
        this.cursorChannel = 0;
      }
    }

    // Mover fila
    if (dRow !== 0) {
      this.cursorRow += dRow;
      if (this.cursorRow < 0) {
        this.cursorRow = 0;
      } else if (this.cursorRow >= this.pattern.rows) {
        this.cursorRow = this.pattern.rows - 1;
      }

      // Auto-scroll
      if (this.cursorRow < this.scrollRow) {
        this.scrollRow = this.cursorRow;
      } else if (this.cursorRow >= this.scrollRow + this.visibleRows) {
        this.scrollRow = this.cursorRow - this.visibleRows + 1;
      }
    }
  }

  /**
   * Establece la fila del cursor (para sincronización con playback)
   * @param {number} row - Fila
   */
  setCursorRow(row) {
    this.cursorRow = row;

    // Auto-scroll
    if (this.cursorRow < this.scrollRow) {
      this.scrollRow = this.cursorRow;
    } else if (this.cursorRow >= this.scrollRow + this.visibleRows) {
      this.scrollRow = this.cursorRow - this.visibleRows + 1;
    }
  }
}
