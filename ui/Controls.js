/**
 * Controls.js
 * Controles de reproducción y configuración
 */

class Controls {
  /**
   * Crea nuevos controles
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} w - Ancho
   */
  constructor(x, y, w) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = 60;

    // Referencias
    this.sequencer = null;
    this.song = null;
  }

  /**
   * Establece el sequencer
   * @param {Sequencer} sequencer - Sequencer
   * @param {Song} song - Canción
   */
  setSequencer(sequencer, song) {
    this.sequencer = sequencer;
    this.song = song;
  }

  /**
   * Renderiza los controles
   */
  render() {
    push();
    translate(this.x, this.y);

    // Fondo
    fill(40);
    noStroke();
    rect(0, 0, this.width, this.height);

    if (!this.sequencer || !this.song) {
      pop();
      return;
    }

    // Info de reproducción
    fill(200);
    textSize(14);
    textAlign(LEFT, CENTER);

    const status = this.sequencer.isPlaying ? '▶ PLAYING' : '⏸ STOPPED';
    text(status, 10, 20);

    text(`Order: ${this.sequencer.currentOrder + 1}/${this.song.order.length}`, 120, 20);
    text(`Row: ${this.sequencer.currentRow.toString().padStart(2, '0')}`, 250, 20);
    text(`BPM: ${this.song.bpm}`, 350, 20);
    text(`Speed: ${this.song.speed}`, 450, 20);

    // Instrucciones
    fill(150);
    textSize(11);
    text('SPACE: Play/Pause | ENTER: Stop | Arrows: Navigate', 10, 45);

    pop();
  }

  /**
   * Maneja input de teclado
   * @param {string} key - Tecla presionada
   * @param {number} keyCode - Código de tecla
   */
  handleKeyPress(key, keyCode) {
    if (!this.sequencer) {
      return;
    }

    // Space: Play/Pause
    if (key === ' ') {
      if (this.sequencer.isPlaying) {
        this.sequencer.pause();
      } else {
        this.sequencer.play();
      }
      return true;
    }

    // Enter: Stop
    if (keyCode === ENTER) {
      this.sequencer.stop();
      return true;
    }

    return false;
  }
}
