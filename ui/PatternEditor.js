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

    // Configurar fuente VT323 para el canvas
    textFont('VT323');

    // Cursor
    this.cursorRow = 0;
    this.cursorChannel = 0;
    this.cursorField = 0; // 0=note, 1=inst, 2=vol, 3=fx, 4=fxparam

    // Scroll
    this.scrollRow = 0;
    this.visibleRows = 16;

    // Dimensiones de celda (ajustadas para 8 canales)
    this.cellHeight = 20;
    this.channelWidth = 100; // Reducido para acomodar 8 canales

    // Referencias
    this.pattern = null;
    this.song = null;
    this.audioEngine = null; // Para preview

    // Edición
    this.currentOctave = 4; // Octava actual (0-9)
    this.currentInstrument = 0; // Instrumento actual
    this.editStep = 1; // Cuántas filas avanzar después de insertar

    // Selección
    this.selectionActive = false;
    this.selectionStart = { row: 0, channel: 0 };
    this.selectionEnd = { row: 0, channel: 0 };

    // Clipboard
    this.clipboard = null;

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

    // Fondo - Verde oscuro GameBoy
    fill('#306230');
    noStroke();
    rect(0, 0, this.width, this.height);

    // Header
    this.renderHeader();

    // Grid
    this.renderGrid();

    // Cells
    this.renderCells();

    // Selección
    this.renderSelection();

    // Cursor
    this.renderCursor();

    // Indicadores de scroll
    this.renderScrollIndicators();

    // Info de edición
    this.renderEditInfo();

    pop();
  }

  /**
   * Renderiza el header con números de canal
   */
  renderHeader() {
    // Header background - Negro para máximo contraste
    fill('#0f380f');
    noStroke();
    rect(0, 0, this.width, 30);

    // Info de pattern (tamaño) - Verde claro GameBoy
    fill('#9bbc0f');
    textSize(16);
    textAlign(LEFT, CENTER);
    text(`${this.pattern.rows} rows`, 5, 15);

    // Canales - Verde claro GameBoy
    fill('#9bbc0f');
    textSize(18);
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
    // Grid lines - Verde muy oscuro
    stroke('#0f380f');
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
    textSize(18);

    for (let i = 0; i < endRow - startRow; i++) {
      const row = startRow + i;
      const y = 30 + i * this.cellHeight + this.cellHeight / 2;

      // Número de fila - Más brillante cada 4 beats
      fill(row % 4 === 0 ? '#9bbc0f' : '#8bac0f');
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

    // Cell text - Verde claro GameBoy
    fill('#9bbc0f');

    // Nota
    const noteStr = this.formatNote(cell.note);
    text(noteStr, x, y);

    // Instrumento (ajustado para 8 canales)
    const instStr = cell.instrument !== null
      ? cell.instrument.toString(16).toUpperCase().padStart(2, '0')
      : '..';
    text(instStr, x + 27, y);

    // Volumen (ajustado para 8 canales)
    const volStr = cell.volume !== null
      ? cell.volume.toString(16).toUpperCase().padStart(2, '0')
      : '..';
    text(volStr, x + 47, y);

    // Efecto (ajustado para 8 canales)
    if (cell.effect !== 0x0 || cell.effectParam !== 0x0) {
      const fxStr = Effects.format(cell.effect, cell.effectParam);
      text(fxStr, x + 67, y);
    } else {
      text('...', x + 67, y);
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
   * Renderiza la selección activa
   */
  renderSelection() {
    if (!this.selectionActive) {
      return;
    }

    const selRect = this.getSelectionRect();

    // Highlight de selección - Verde claro con transparencia
    fill('#9bbc0f');
    colorMode(RGB, 255);
    fill(155, 188, 15, 100);
    noStroke();

    for (let row = selRect.startRow; row <= selRect.endRow; row++) {
      const displayRow = row - this.scrollRow;

      if (displayRow < 0 || displayRow >= this.visibleRows) {
        continue;
      }

      const y = 30 + displayRow * this.cellHeight;
      const startX = 40 + selRect.startChannel * this.channelWidth;
      const width = (selRect.endChannel - selRect.startChannel + 1) * this.channelWidth;

      rect(startX, y, width, this.cellHeight);
    }
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

    // Solo mostrar el cursor del campo (sin highlight de fila completa)
    // Offsets y anchos ajustados para channelWidth de 100px
    const fieldOffsets = [0, 27, 47, 67, 78];
    const fieldWidths = [25, 18, 18, 10, 17];
    const fieldX = x + fieldOffsets[this.cursorField] + 5;
    const fieldW = fieldWidths[this.cursorField];

    stroke('#9bbc0f');
    strokeWeight(2);
    noFill();
    rect(fieldX, y + 2, fieldW, this.cellHeight - 4);
  }

  /**
   * Renderiza indicadores de scroll
   */
  renderScrollIndicators() {
    const indicatorX = 5;
    fill('#9bbc0f');
    textAlign(LEFT, CENTER);
    textSize(16);

    // Indicador arriba (si hay contenido arriba)
    if (this.scrollRow > 0) {
      const y = 30 + 10;
      text('▲', indicatorX, y);
    }

    // Indicador abajo (si hay contenido abajo)
    if (this.scrollRow + this.visibleRows < this.pattern.rows) {
      const y = 30 + this.visibleRows * this.cellHeight - 10;
      text('▼', indicatorX, y);
    }

    // Mostrar scroll info (fila actual / total)
    fill('#8bac0f');
    textSize(14);
    const scrollInfo = `${this.scrollRow + 1}-${Math.min(this.scrollRow + this.visibleRows, this.pattern.rows)}/${this.pattern.rows}`;
    text(scrollInfo, this.width - 60, 30 + this.visibleRows * this.cellHeight + 10);
  }

  /**
   * Renderiza información de edición (octava, instrumento)
   */
  renderEditInfo() {
    // Fondo para info - Verde muy oscuro
    fill('#0f380f');
    noStroke();
    rect(this.width - 180, 5, 175, 20);

    // Texto de info - Verde claro GameBoy
    fill('#9bbc0f');
    textSize(18);
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

  /**
   * Inicia una selección
   */
  startSelection() {
    this.selectionActive = true;
    this.selectionStart = { row: this.cursorRow, channel: this.cursorChannel };
    this.selectionEnd = { row: this.cursorRow, channel: this.cursorChannel };
  }

  /**
   * Actualiza el final de la selección
   */
  updateSelection() {
    if (this.selectionActive) {
      this.selectionEnd = { row: this.cursorRow, channel: this.cursorChannel };
    }
  }

  /**
   * Cancela la selección
   */
  cancelSelection() {
    this.selectionActive = false;
  }

  /**
   * Obtiene el rectángulo de selección normalizado
   * @returns {Object} Rectángulo con startRow, endRow, startChannel, endChannel
   */
  getSelectionRect() {
    if (!this.selectionActive) {
      // Si no hay selección, usar solo la celda del cursor
      return {
        startRow: this.cursorRow,
        endRow: this.cursorRow,
        startChannel: this.cursorChannel,
        endChannel: this.cursorChannel
      };
    }

    return {
      startRow: Math.min(this.selectionStart.row, this.selectionEnd.row),
      endRow: Math.max(this.selectionStart.row, this.selectionEnd.row),
      startChannel: Math.min(this.selectionStart.channel, this.selectionEnd.channel),
      endChannel: Math.max(this.selectionStart.channel, this.selectionEnd.channel)
    };
  }

  /**
   * Copia la selección al clipboard
   */
  copySelection() {
    const rect = this.getSelectionRect();
    const data = [];

    for (let row = rect.startRow; row <= rect.endRow; row++) {
      const rowData = [];
      for (let ch = rect.startChannel; ch <= rect.endChannel; ch++) {
        const cell = this.pattern.getCell(row, ch);
        rowData.push(cell ? { ...cell } : this.pattern.createEmptyCell());
      }
      data.push(rowData);
    }

    this.clipboard = {
      rows: data.length,
      channels: data[0].length,
      data: data
    };

    console.log(`Copiado ${this.clipboard.rows}x${this.clipboard.channels} celdas`);
  }

  /**
   * Corta la selección al clipboard y la borra
   */
  cutSelection() {
    this.copySelection();

    const rect = this.getSelectionRect();
    for (let row = rect.startRow; row <= rect.endRow; row++) {
      for (let ch = rect.startChannel; ch <= rect.endChannel; ch++) {
        this.pattern.clearCell(row, ch);
      }
    }

    console.log('Selección cortada');
  }

  /**
   * Pega el contenido del clipboard
   */
  pasteSelection() {
    if (!this.clipboard) {
      console.warn('Clipboard vacío');
      return;
    }

    const startRow = this.cursorRow;
    const startChannel = this.cursorChannel;

    for (let r = 0; r < this.clipboard.rows; r++) {
      const targetRow = startRow + r;
      if (targetRow >= this.pattern.rows) break;

      for (let c = 0; c < this.clipboard.channels; c++) {
        const targetChannel = startChannel + c;
        if (targetChannel >= this.pattern.channels) break;

        const cellData = this.clipboard.data[r][c];
        this.pattern.setCell(targetRow, targetChannel, cellData);
      }
    }

    console.log(`Pegado ${this.clipboard.rows}x${this.clipboard.channels} celdas`);
  }
}
