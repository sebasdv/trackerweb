/**
 * Visualizer.js
 * Visualizador de espectro FFT y waveform
 */

class Visualizer {
  /**
   * Crea un nuevo visualizador
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
    this.mode = 'spectrum'; // 'spectrum' o 'waveform'
  }

  /**
   * Renderiza el visualizador
   * @param {AudioEngine} audioEngine - Motor de audio
   */
  render(audioEngine) {
    if (!audioEngine) {
      return;
    }

    push();
    translate(this.x, this.y);

    // Fondo
    fill(20);
    noStroke();
    rect(0, 0, this.width, this.height);

    // Renderizar según modo
    if (this.mode === 'spectrum') {
      this.renderSpectrum(audioEngine);
    } else {
      this.renderWaveform(audioEngine);
    }

    pop();
  }

  /**
   * Renderiza el espectro de frecuencias
   * @param {AudioEngine} audioEngine - Motor de audio
   */
  renderSpectrum(audioEngine) {
    const data = audioEngine.getFFTData();
    const barCount = 64;
    const barWidth = this.width / barCount;

    noStroke();

    for (let i = 0; i < barCount; i++) {
      const index = Math.floor((i / barCount) * data.length);
      const value = data[index];
      const barHeight = (value / 255) * this.height;

      // Color degradado
      const hue = map(i, 0, barCount, 180, 280);
      fill(hue, 80, 90);

      rect(i * barWidth, this.height - barHeight, barWidth - 2, barHeight);
    }
  }

  /**
   * Renderiza la forma de onda
   * @param {AudioEngine} audioEngine - Motor de audio
   */
  renderWaveform(audioEngine) {
    const data = audioEngine.getWaveformData();

    stroke(100, 200, 255);
    strokeWeight(2);
    noFill();

    beginShape();
    for (let i = 0; i < data.length; i++) {
      const x = map(i, 0, data.length, 0, this.width);
      const y = map(data[i], 0, 255, 0, this.height);
      vertex(x, y);
    }
    endShape();
  }

  /**
   * Alterna entre modos de visualización
   */
  toggleMode() {
    this.mode = this.mode === 'spectrum' ? 'waveform' : 'spectrum';
  }
}
