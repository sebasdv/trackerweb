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
let controls;

// Estado
let audioStarted = false;
let currentPatternIndex = 0; // Pattern actual en edición

/**
 * Setup de p5.js
 */
function setup() {
  // Crear canvas - Altura ajustada para UI compacta
  // Título (~40px) + Controls (~70px) + PatternEditor (380px) + Margen (~30px) = ~520px
  const canvas = createCanvas(1200, 550);
  canvas.parent('canvas-container');

  // Configurar p5.js
  frameRate(60);
  colorMode(HSB, 360, 100, 100);

  // Crear canción de ejemplo
  createExampleSong();

  // Crear UI components
  // Altura ajustada para 16 filas: header (30px) + 16 filas (16×20=320px) + info (30px) = 380px
  patternEditor = new PatternEditor(20, 120, 1160, 380);
  patternEditor.setPattern(song.patterns[0], song);

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
    // Actualizar botón de play/pause
    updatePlayPauseButton();
    return false; // Prevenir default
  }

  // Pattern editor
  patternEditor.handleKeyPress(key, keyCode);

  // Actualizar selección si Shift está presionado y se movió el cursor
  if (keyIsDown(SHIFT)) {
    const isArrow = keyCode === UP_ARROW || keyCode === DOWN_ARROW ||
                    keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW;
    if (isArrow) {
      patternEditor.updateSelection();
    }
  } else {
    // Si no hay Shift, cancelar selección al mover
    const isArrow = keyCode === UP_ARROW || keyCode === DOWN_ARROW ||
                    keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW;
    if (isArrow) {
      patternEditor.cancelSelection();
    }
  }

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

  // Conectar UI con sequencer y audio engine
  controls.setSequencer(sequencer, song);
  patternEditor.setPattern(song.patterns[0], song, audioEngine);

  // Callback para sincronizar cursor con playback
  sequencer.onRowChange = (row) => {
    if (sequencer.isPlaying) {
      patternEditor.setCursorRow(row);
    }
  };

  audioStarted = true;

  // Inicializar displays
  updateTempoDisplay();
  updatePatternRowsDisplay();
  updatePatternInfo();
  updateOrderDisplay();

  console.log('Audio iniciado - Edición de notas habilitada');
  console.log('Teclas: Z-M para notas | 0-9 para cambiar octava | Tab para cambiar campo');
}

/**
 * Crea una canción de ejemplo
 */
function createExampleSong() {
  song = new Song('Demo Song', 'TrackWeb');
  song.bpm = 125;
  song.speed = 6;

  // Obtener pattern
  const pattern = song.patterns[0];

  // Agregar algunas notas de ejemplo mostrando los 8 instrumentos
  // C major scale
  const scale = [60, 62, 64, 65, 67, 69, 71, 72]; // C4 to C5

  // Canal 0: Melodía principal con Square 50% (inst 0)
  for (let i = 0; i < 8; i++) {
    pattern.setNote(i * 4, 0, scale[i], 0, 48);
  }

  // Canal 1: Bajo con Square 25% (inst 1)
  pattern.setNote(0, 1, 48, 1, 52);  // C3
  pattern.setNote(8, 1, 48, 1, 52);
  pattern.setNote(16, 1, 53, 1, 52); // F3
  pattern.setNote(24, 1, 55, 1, 52); // G3

  // Canal 2: Arpegios con Square 12.5% (inst 2)
  pattern.setNote(0, 2, 72, 2, 40);   // C5
  pattern.setNote(2, 2, 76, 2, 40);   // E5
  pattern.setNote(4, 2, 79, 2, 40);   // G5
  pattern.setNote(6, 2, 76, 2, 40);   // E5

  // Canal 3: Melodía secundaria con Triangle (inst 3)
  pattern.setNote(16, 3, 65, 3, 45);  // F4
  pattern.setNote(20, 3, 67, 3, 45);  // G4
  pattern.setNote(24, 3, 69, 3, 45);  // A4
  pattern.setNote(28, 3, 67, 3, 45);  // G4

  // Canal 4: Lead agresivo con Sawtooth (inst 4) - opcional
  pattern.setNote(32, 4, 72, 4, 50);  // C5
  pattern.setNote(40, 4, 74, 4, 50);  // D5
  pattern.setNote(48, 4, 76, 4, 50);  // E5

  // Canal 5: Hi-hat con Noise (inst 5)
  for (let i = 0; i < 64; i += 4) {
    pattern.setNote(i, 5, 60, 5, 30); // Nota irrelevante para noise
  }

  // Canal 6: Kick drum (inst 6)
  pattern.setNote(0, 6, 36, 6, 64);   // C2 - kick
  pattern.setNote(16, 6, 36, 6, 64);
  pattern.setNote(32, 6, 36, 6, 64);
  pattern.setNote(48, 6, 36, 6, 64);

  // Canal 7: Snare drum (inst 7)
  pattern.setNote(8, 7, 38, 7, 55);   // D2 - snare
  pattern.setNote(24, 7, 38, 7, 55);
  pattern.setNote(40, 7, 38, 7, 55);
  pattern.setNote(56, 7, 38, 7, 55);
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

        // Resetear índice de pattern actual
        currentPatternIndex = 0;

        // Actualizar editor con el primer pattern
        patternEditor.setPattern(song.patterns[0], song, audioEngine);
        patternEditor.cursorRow = 0;
        patternEditor.setCursorRow(0);

        // Actualizar sequencer
        if (sequencer) {
          sequencer.song = song;
          sequencer.stop();
          controls.setSequencer(sequencer, song);
        }

        // Actualizar todos los displays
        updateTempoDisplay();
        updatePatternRowsDisplay();
        updatePatternInfo();
        updateOrderDisplay();

        console.log('Canción cargada:', song.title);
      } catch (error) {
        console.error('Error cargando canción:', error);
        alert('Error al cargar el archivo: ' + error.message);
      }
    }
  };

  input.click();
}

// Agregar shortcuts para save/load y copy/paste
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

  // Ctrl+C: Copy
  if (e.ctrlKey && e.key === 'c') {
    e.preventDefault();
    if (audioStarted && patternEditor) {
      patternEditor.copySelection();
    }
  }

  // Ctrl+X: Cut
  if (e.ctrlKey && e.key === 'x') {
    e.preventDefault();
    if (audioStarted && patternEditor) {
      patternEditor.cutSelection();
    }
  }

  // Ctrl+V: Paste
  if (e.ctrlKey && e.key === 'v') {
    e.preventDefault();
    if (audioStarted && patternEditor) {
      patternEditor.pasteSelection();
    }
  }

  // Shift+Flechas: Selección
  if (e.shiftKey && audioStarted && patternEditor) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();

      // Iniciar selección si no está activa
      if (!patternEditor.selectionActive) {
        patternEditor.startSelection();
      }

      // El movimiento del cursor lo maneja p5.js keyPressed
      // Solo necesitamos actualizar la selección después
    }
  }

  // Escape: Cancelar selección
  if (e.key === 'Escape' && audioStarted && patternEditor) {
    patternEditor.cancelSelection();
  }
});

// Event listeners para botones de control
document.addEventListener('DOMContentLoaded', () => {
  // Botones de tempo
  const tempoDown = document.getElementById('tempo-down');
  const tempoUp = document.getElementById('tempo-up');
  const tempoDisplay = document.getElementById('tempo-display');

  tempoDown.addEventListener('click', () => {
    if (audioStarted && sequencer) {
      sequencer.setBPM(song.bpm - 5);
      updateTempoDisplay();
    }
  });

  tempoUp.addEventListener('click', () => {
    if (audioStarted && sequencer) {
      sequencer.setBPM(song.bpm + 5);
      updateTempoDisplay();
    }
  });

  // Pattern rows selector
  const patternRowsSelect = document.getElementById('pattern-rows');

  patternRowsSelect.addEventListener('change', (e) => {
    if (audioStarted && song) {
      const newRows = parseInt(e.target.value);
      const currentPattern = song.patterns[0]; // TODO: Soportar múltiples patterns

      if (currentPattern) {
        currentPattern.resize(newRows);

        // Ajustar cursor si está fuera del nuevo rango
        if (patternEditor && patternEditor.cursorRow >= newRows) {
          patternEditor.cursorRow = newRows - 1;
          patternEditor.setCursorRow(newRows - 1);
        }

        console.log(`Pattern resized to ${newRows} rows`);
      }
    }
  });

  // Botones de reproducción
  const playPauseBtn = document.getElementById('play-pause');
  const stopBtn = document.getElementById('stop');

  playPauseBtn.addEventListener('click', () => {
    if (!audioStarted) {
      startAudio();
    } else if (sequencer) {
      if (sequencer.isPlaying) {
        sequencer.pause();
        playPauseBtn.textContent = '▶ Play';
      } else {
        sequencer.play();
        playPauseBtn.textContent = '⏸ Pause';
      }
    }
  });

  stopBtn.addEventListener('click', () => {
    if (audioStarted && sequencer) {
      sequencer.stop();
      playPauseBtn.textContent = '▶ Play';
    }
  });

  // Botones de navegación de patterns
  const patternPrev = document.getElementById('pattern-prev');
  const patternNext = document.getElementById('pattern-next');

  patternPrev.addEventListener('click', () => {
    if (audioStarted) {
      previousPattern();
    }
  });

  patternNext.addEventListener('click', () => {
    if (audioStarted) {
      nextPattern();
    }
  });

  // Botones de acciones de patterns
  const patternNew = document.getElementById('pattern-new');
  const patternClone = document.getElementById('pattern-clone');
  const patternDelete = document.getElementById('pattern-delete');

  patternNew.addEventListener('click', () => {
    if (audioStarted) {
      createNewPattern();
    }
  });

  patternClone.addEventListener('click', () => {
    if (audioStarted) {
      cloneCurrentPattern();
    }
  });

  patternDelete.addEventListener('click', () => {
    if (audioStarted) {
      deleteCurrentPattern();
    }
  });

  // Botón para agregar pattern al order
  const orderAdd = document.getElementById('order-add');

  orderAdd.addEventListener('click', () => {
    if (audioStarted) {
      addPatternToOrder();
    }
  });
});

/**
 * Actualiza el botón de play/pause
 */
function updatePlayPauseButton() {
  const playPauseBtn = document.getElementById('play-pause');
  if (playPauseBtn && sequencer) {
    playPauseBtn.textContent = sequencer.isPlaying ? '⏸ Pause' : '▶ Play';
  }
}

/**
 * Actualiza el display del tempo
 */
function updateTempoDisplay() {
  const tempoDisplay = document.getElementById('tempo-display');
  if (tempoDisplay && song) {
    tempoDisplay.textContent = song.bpm;
  }
}

/**
 * Actualiza el selector de tamaño de pattern
 */
function updatePatternRowsDisplay() {
  const patternRowsSelect = document.getElementById('pattern-rows');
  if (patternRowsSelect && song && song.patterns[currentPatternIndex]) {
    patternRowsSelect.value = song.patterns[currentPatternIndex].rows;
  }
}

/**
 * Actualiza el display de información del pattern
 */
function updatePatternInfo() {
  const patternInfo = document.getElementById('pattern-info');
  if (patternInfo && song) {
    patternInfo.textContent = `Pattern ${currentPatternIndex} / ${song.patterns.length - 1}`;
  }
}

/**
 * Actualiza el display del order
 */
function updateOrderDisplay() {
  const orderList = document.getElementById('order-list');
  if (orderList && song) {
    orderList.textContent = song.order.join(', ');
  }
}

/**
 * Cambia al pattern especificado
 */
function switchToPattern(index) {
  if (!song || index < 0 || index >= song.patterns.length) {
    return;
  }

  currentPatternIndex = index;
  const pattern = song.patterns[currentPatternIndex];

  if (patternEditor && audioEngine) {
    patternEditor.setPattern(pattern, song, audioEngine);
    // Resetear cursor
    patternEditor.cursorRow = 0;
    patternEditor.setCursorRow(0);
  }

  updatePatternInfo();
  updatePatternRowsDisplay();
}

/**
 * Navega al pattern anterior
 */
function previousPattern() {
  if (currentPatternIndex > 0) {
    switchToPattern(currentPatternIndex - 1);
  }
}

/**
 * Navega al siguiente pattern
 */
function nextPattern() {
  if (currentPatternIndex < song.patterns.length - 1) {
    switchToPattern(currentPatternIndex + 1);
  }
}

/**
 * Crea un nuevo pattern
 */
function createNewPattern() {
  if (!song) return;

  // Obtener tamaño del selector
  const patternRowsSelect = document.getElementById('pattern-rows');
  const rows = patternRowsSelect ? parseInt(patternRowsSelect.value) : 64;

  const newIndex = song.addPattern(rows);
  switchToPattern(newIndex);
  console.log(`Nuevo pattern ${newIndex} creado con ${rows} filas`);
}

/**
 * Clona el pattern actual
 */
function cloneCurrentPattern() {
  if (!song) return;

  const clonedIndex = song.clonePattern(currentPatternIndex);
  if (clonedIndex >= 0) {
    switchToPattern(clonedIndex);
    console.log(`Pattern ${currentPatternIndex} clonado a ${clonedIndex}`);
  }
}

/**
 * Elimina el pattern actual
 */
function deleteCurrentPattern() {
  if (!song) return;

  const success = song.deletePattern(currentPatternIndex);
  if (success) {
    // Cambiar a pattern anterior o siguiente
    const newIndex = Math.min(currentPatternIndex, song.patterns.length - 1);
    switchToPattern(newIndex);
    console.log(`Pattern eliminado`);
  } else {
    console.warn('No se pudo eliminar el pattern (puede estar en uso en el order)');
  }
}

/**
 * Agrega el pattern actual al order
 */
function addPatternToOrder() {
  if (!song) return;

  song.addToOrder(currentPatternIndex);
  updateOrderDisplay();
  console.log(`Pattern ${currentPatternIndex} agregado al order`);
}
