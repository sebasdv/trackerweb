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

    // Nombres de notas
    this.noteNames = [
      'C-', 'C#', 'D-', 'D#', 'E-', 'F-',
      'F#', 'G-', 'G#', 'A-', 'A#', 'B-'
    ];
  }

  /**
   * Establece el pattern a editar
   * @param {Pattern} pattern - Pattern
   * @param {Song} song - Canción (para instrumentos)
   */
  setPattern(pattern, song) {
    this.pattern = pattern;
    this.song = song;
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

    pop();
  }

  /**
   * Renderiza el header con números de canal
   */
  renderHeader() {
    fill(60);
    noStroke();
    rect(0, 0, this.width, 30);

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
   * Maneja input de teclado
   * @param {string} key - Tecla presionada
   * @param {number} keyCode - Código de tecla
   */
  handleKeyPress(key, keyCode) {
    // Navegación
    if (keyCode === UP_ARROW) {
      this.moveCursor(0, -1);
    } else if (keyCode === DOWN_ARROW) {
      this.moveCursor(0, 1);
    } else if (keyCode === LEFT_ARROW) {
      this.moveCursor(-1, 0);
    } else if (keyCode === RIGHT_ARROW) {
      this.moveCursor(1, 0);
    }

    // TODO: Implementar edición de notas
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
