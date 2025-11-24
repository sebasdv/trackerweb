/**
 * main.js
 * Sketch principal de p5.js para TrackWeb
 */

// Variables globales
let audioContext;
let audioEngine;
let song;
let sequencer;

// UI Components
let patternEditor;
let visualizer;
let controls;

// Estado
let audioStarted = false;

/**
 * Setup de p5.js
 */
function setup() {
  // Crear canvas
  const canvas = createCanvas(1200, 800);
  canvas.parent('canvas-container');

  // Configurar p5.js
  frameRate(60);
  colorMode(HSB, 360, 100, 100);

  // Crear canción de ejemplo
  createExampleSong();

  // Crear UI components
  patternEditor = new PatternEditor(20, 120, 1160, 420);
  patternEditor.setPattern(song.patterns[0], song);

  visualizer = new Visualizer(20, 560, 1160, 160);

  controls = new Controls(20, 50, 1160);

  // Mostrar mensaje inicial
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(16);
  text('Click anywhere to start audio', width / 2, height / 2);
}

/**
 * Draw loop de p5.js
 */
function draw() {
  // Fondo
  background(10);

  // Si audio no iniciado, mostrar mensaje
  if (!audioStarted) {
    fill(200);
    textAlign(CENTER, CENTER);
    textSize(20);
    text('Click para iniciar audio', width / 2, height / 2);
    return;
  }

  // Actualizar sequencer
  if (sequencer) {
    sequencer.update();
  }

  // Título
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text('TrackWeb', 20, 10);

  fill(150);
  textSize(14);
  text(`${song.title} - ${song.author}`, 20, 35);

  // Renderizar UI
  controls.render();
  patternEditor.render();
  visualizer.render(audioEngine);
}

/**
 * Maneja clicks del mouse
 */
function mousePressed() {
  if (!audioStarted) {
    startAudio();
  }
}

/**
 * Maneja input de teclado
 */
function keyPressed() {
  if (!audioStarted) {
    return;
  }

  // Controles primero
  if (controls.handleKeyPress(key, keyCode)) {
    return false; // Prevenir default
  }

  // Pattern editor
  patternEditor.handleKeyPress(key, keyCode);

  return false; // Prevenir default
}

/**
 * Inicia el audio (requiere user gesture)
 */
function startAudio() {
  // Obtener AudioContext de p5.sound
  audioContext = getAudioContext();

  // Reanudar si está suspendido (Safari)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  // Crear audio engine
  audioEngine = new AudioEngine(audioContext);

  // Crear sequencer
  sequencer = new Sequencer(audioEngine, song);

  // Conectar UI con sequencer
  controls.setSequencer(sequencer, song);

  // Callback para sincronizar cursor con playback
  sequencer.onRowChange = (row) => {
    if (sequencer.isPlaying) {
      patternEditor.setCursorRow(row);
    }
  };

  audioStarted = true;
  console.log('Audio iniciado');
}

/**
 * Crea una canción de ejemplo
 */
function createExampleSong() {
  song = new Song('Demo Song', 'TrackWeb');
  song.bpm = 140;
  song.speed = 6;

  // Obtener pattern
  const pattern = song.patterns[0];

  // Agregar algunas notas de ejemplo
  // C major scale
  const scale = [60, 62, 64, 65, 67, 69, 71, 72]; // C4 to C5

  // Canal 0: Melodía con square wave
  for (let i = 0; i < 8; i++) {
    pattern.setNote(i * 4, 0, scale[i], 0, 48);
  }

  // Canal 1: Bajo con square 25%
  pattern.setNote(0, 1, 48, 1, 52);  // C3
  pattern.setNote(8, 1, 48, 1, 52);
  pattern.setNote(16, 1, 53, 1, 52); // F3
  pattern.setNote(24, 1, 55, 1, 52); // G3

  // Canal 2: Acordes con triangle
  pattern.setNote(0, 2, 64, 2, 40);   // E4
  pattern.setNote(0, 2, 67, 2, 40);   // G4
  pattern.setNote(16, 2, 65, 2, 40);  // F4
  pattern.setNote(16, 2, 69, 2, 40);  // A4

  // Canal 3: Hi-hat con noise
  for (let i = 0; i < 32; i += 4) {
    pattern.setNote(i, 3, 60, 4, 30); // Nota irrelevante para noise
  }
}

/**
 * Guarda la canción actual
 */
function saveSong() {
  const blob = song.save();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${song.title}.wtk`;
  a.click();
  URL.revokeObjectURL(url);
  console.log('Canción guardada');
}

/**
 * Carga una canción desde archivo
 */
function loadSong() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.wtk,.json';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        song = await Song.load(file);
        patternEditor.setPattern(song.patterns[0], song);
        if (sequencer) {
          sequencer.song = song;
          sequencer.stop();
          controls.setSequencer(sequencer, song);
        }
        console.log('Canción cargada:', song.title);
      } catch (error) {
        console.error('Error cargando canción:', error);
      }
    }
  };

  input.click();
}

// Agregar shortcuts para save/load
document.addEventListener('keydown', (e) => {
  // Ctrl+S: Save
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    if (audioStarted) {
      saveSong();
    }
  }

  // Ctrl+O: Open
  if (e.ctrlKey && e.key === 'o') {
    e.preventDefault();
    if (audioStarted) {
      loadSong();
    }
  }
});
