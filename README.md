# TrackWeb

Tracker clásico estilo MOD/XM en el navegador con síntesis 8-bit, efectos clásicos y grabación de stems.

**Stack:** JavaScript + p5.js + WebAudio API

---

## ⚡ Quick Start

```bash
# Clonar repositorio
git clone https://github.com/sebasdv/trackerweb.git
cd trackerweb

# Abrir con servidor local (Python 3)
python -m http.server 8000

# O con Node.js
npx http-server -p 8000

# Abrir en navegador
open http://localhost:8000
```

**No requiere build ni dependencias.** Todo corre en el navegador.

---

## 📁 Estructura del Proyecto

```
trackerweb/
├── index.html              # Punto de entrada
├── main.js                 # p5.js sketch principal
├── style.css               # Estilos UI
│
├── core/                   # Motor de audio y secuenciador
│   ├── AudioEngine.js      # Síntesis 8-bit + WebAudio
│   ├── Sequencer.js        # Timing y reproducción
│   ├── PatternPlayer.js    # Ejecución de patterns
│   └── Effects.js          # Efectos clásicos (arpeggio, vibrato, etc.)
│
├── data/                   # Estructuras de datos
│   ├── Song.js             # Canción completa
│   ├── Pattern.js          # Patterns (filas de notas)
│   └── Instrument.js       # Instrumentos 8-bit
│
├── ui/                     # Interfaz con p5.js
│   ├── PatternEditor.js    # Editor visual de patterns
│   ├── Visualizer.js       # Espectro FFT / waveforms
│   └── Controls.js         # Controles de reproducción
│
├── export/                 # Grabación y export
│   └── StemRecorder.js     # Grabación de stems individuales
│
├── examples/               # Canciones de ejemplo
│   └── demo-song.json
│
├── docs/                   # Documentación técnica
│   ├── ARCHITECTURE.md     # Diseño del sistema
│   ├── EFFECTS.md          # Referencia de efectos
│   └── API.md              # API interna
│
└── README.md               # Este archivo
```

---

## 🎹 Controles

### Navegación
- **Flechas**: Mover cursor en el pattern
- **PageUp/PageDown**: Scroll rápido
- **Tab**: Cambiar entre campos (nota/instrumento/volumen/efecto)

### Reproducción
- **Space**: Play/Pause
- **Enter**: Stop (volver al inicio)
- **F5/F6**: Tempo -/+
- **F7/F8**: Speed -/+

### Edición
- **Q-I**: Notas (C a C#, escala cromática)
- **A-K**: Notas (octava superior)
- **Z**: Eliminar nota
- **X**: Copiar celda
- **C**: Cortar celda
- **V**: Pegar celda
- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo

### Archivo
- **Ctrl+S**: Guardar proyecto (.json)
- **Ctrl+O**: Abrir proyecto
- **Ctrl+E**: Exportar stems (.wav)

---

## 🚀 Desarrollo

Para guías detalladas de desarrollo con Claude Code, workflows y comandos útiles, consulta [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

---

## 🎵 Arquitectura Técnica

### AudioEngine (core/AudioEngine.js)

Maneja toda la síntesis de audio usando WebAudio API.

**Métodos principales:**
```javascript
createVoice(waveform, frequency, volume)  // Crea oscilador
playNote(channel, note, instrument, duration)  // Trigger nota
noteToFrequency(midiNote)  // Conversión MIDI → Hz
getFFTData()  // Datos para visualización
```

**Waveforms soportadas:**
- `pulse`: Square wave (duty cycle configurable)
- `triangle`: Triangle wave (NES style)
- `sawtooth`: Sawtooth wave
- `noise`: White noise (8-bit style)

### Sequencer (core/Sequencer.js)

Control de timing y reproducción de patterns.

**Estados:**
```javascript
{
  isPlaying: boolean,
  currentOrder: number,  // Posición en song.order
  currentRow: number,    // Fila en pattern
  currentTick: number    // Tick dentro de row (0-5)
}
```

**Formula de timing:**
```javascript
ticksPerSecond = (BPM * speed) / 150
msPerTick = 1000 / ticksPerSecond
```

### Pattern Structure (data/Pattern.js)

Formato tipo MOD/XM:

```javascript
{
  channels: 4,
  rows: 64,
  data: [
    [ // Row 0
      { // Channel 0
        note: 60,        // MIDI note (C4)
        instrument: 0,   // Instrumento
        volume: 48,      // 0-64
        effect: 0x0,     // Código efecto
        effectParam: 0x37  // Parámetro
      },
      { /* Channel 1 */ },
      { /* Channel 2 */ },
      { /* Channel 3 */ }
    ],
    // ... 63 rows más
  ]
}
```

### Efectos Clásicos (core/Effects.js)

| Código | Efecto | Parámetro | Descripción |
|--------|--------|-----------|-------------|
| `0xy` | Arpeggio | x=+n, y=+m semitonos | Cicla: base → +x → +y |
| `1xx` | Porta Up | xx=velocidad | Sube pitch |
| `2xx` | Porta Down | xx=velocidad | Baja pitch |
| `3xx` | Tone Porta | xx=velocidad | Slide hacia nota target |
| `4xy` | Vibrato | x=velocidad, y=profundidad | LFO pitch |
| `7xy` | Tremolo | x=velocidad, y=profundidad | LFO volumen |
| `Cxx` | Set Volume | xx=volumen (0-64) | Volumen inmediato |
| `Fxx` | Set Speed/Tempo | xx<32=speed, xx≥32=BPM | Cambio de tempo |

---

## 📦 Formato de Archivo

Los proyectos se guardan como JSON:

```json
{
  "title": "My Song",
  "author": "Username",
  "bpm": 125,
  "speed": 6,
  "channels": 4,
  "instruments": [
    {
      "name": "Square 50%",
      "waveform": "pulse",
      "dutyCycle": 0.5,
      "volume": 0.5,
      "attack": 0.01,
      "decay": 0.05,
      "sustain": 0.7,
      "release": 0.05
    }
  ],
  "patterns": [
    {
      "channels": 4,
      "rows": 64,
      "data": [ /* ... */ ]
    }
  ],
  "order": [0, 0, 1, 2]
}
```

**Extensión recomendada:** `.wtk` (WebTracker)

---

## 🎨 UI con p5.js

### Integration Pattern

```javascript
// main.js
let audioContext;
let audioEngine;

function setup() {
  createCanvas(1200, 800);
  
  // Obtener AudioContext de p5.sound
  audioContext = getAudioContext();
  
  // Crear AudioEngine
  audioEngine = new AudioEngine(audioContext);
  
  // Iniciar en user gesture
  userStartAudio();
}

function draw() {
  background(10);
  
  // Render UI
  patternEditor.render();
  
  // Render visualizer
  const fftData = audioEngine.getFFTData();
  visualizer.render(fftData);
}
```

### PatternEditor Rendering

```javascript
// ui/PatternEditor.js
render() {
  // Grid lines
  stroke(40);
  for (let row = 0; row < visibleRows; row++) {
    line(gridX, gridY + row * cellHeight, 
         gridX + width, gridY + row * cellHeight);
  }
  
  // Cells
  for (let row = 0; row < visibleRows; row++) {
    for (let ch = 0; ch < channels; ch++) {
      const cell = pattern.getCell(row, ch);
      text(formatCell(cell), x, y);
    }
  }
  
  // Cursor
  stroke(255, 200, 0);
  rect(selectedX, selectedY, cellWidth, cellHeight);
}
```

---

## 🔊 Síntesis 8-bit

### Osciladores Básicos

```javascript
// Pulse/Square (variable duty cycle)
createVoice('pulse', 440, 0.5)  // 440Hz, duty 50%

// Triangle (NES style)
createVoice('triangle', 440, 0.4)

// Sawtooth
createVoice('sawtooth', 440, 0.6)

// Noise (white noise)
createVoice('noise', 0, 0.3)  // freq ignorada
```

### ADSR Envelope

```javascript
// Valores típicos 8-bit
const envelope = {
  attack: 0.01,   // 10ms
  decay: 0.05,    // 50ms
  sustain: 0.7,   // 70% volumen
  release: 0.05   // 50ms
}
```

### Custom Waveforms

```javascript
// PWM (Pulse Width Modulation)
createPWMWaveform(dutyCycle) {
  const real = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    real[i] = (i / 256 < dutyCycle) ? 1 : -1;
  }
  return audioContext.createPeriodicWave(real, new Float32Array(256));
}

// NES Triangle (más lineal)
createNESTriangle() {
  const real = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const t = i / 256;
    real[i] = (t < 0.5) ? (4 * t - 1) : (3 - 4 * t);
  }
  return audioContext.createPeriodicWave(real, new Float32Array(256));
}
```

---

## 💾 Grabación de Stems

### MediaRecorder (Tiempo Real)

```javascript
// Grabar mix completo
async function recordMix(duration) {
  const dest = audioContext.createMediaStreamDestination();
  masterGain.connect(dest);
  
  const recorder = new MediaRecorder(dest.stream);
  const chunks = [];
  
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.start();
  
  await sleep(duration * 1000);
  recorder.stop();
  
  return new Blob(chunks, { type: 'audio/webm' });
}
```

### OfflineAudioContext (Render Rápido)

```javascript
// Render no-realtime (más rápido que tiempo real)
async function renderOffline(song, duration) {
  const offlineCtx = new OfflineAudioContext(2, 44100 * duration, 44100);
  const offlineEngine = new AudioEngine(offlineCtx);
  
  // Schedule todas las notas
  scheduleAllNotes(offlineEngine, song);
  
  // Render
  const buffer = await offlineCtx.startRendering();
  
  // Convertir a WAV
  return audioBufferToWav(buffer);
}
```

---

## 🧪 Testing

### Audio Test

```html
<!-- test/audio-test.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Audio Test</title>
</head>
<body>
  <button onclick="testPulse()">Test Pulse</button>
  <button onclick="testTriangle()">Test Triangle</button>
  <button onclick="testSawtooth()">Test Sawtooth</button>
  <button onclick="testNoise()">Test Noise</button>
  
  <script src="../core/AudioEngine.js"></script>
  <script>
    const audioContext = new AudioContext();
    const engine = new AudioEngine(audioContext);
    
    function testPulse() {
      engine.playNote(0, 60, { waveform: 'pulse', volume: 0.5 }, 1.0);
    }
    
    function testTriangle() {
      engine.playNote(0, 60, { waveform: 'triangle', volume: 0.4 }, 1.0);
    }
    
    function testSawtooth() {
      engine.playNote(0, 60, { waveform: 'sawtooth', volume: 0.6 }, 1.0);
    }
    
    function testNoise() {
      engine.playNote(0, 0, { waveform: 'noise', volume: 0.3 }, 1.0);
    }
  </script>
</body>
</html>
```

### Unit Tests (opcional con Jest)

```javascript
// test/AudioEngine.test.js
describe('AudioEngine', () => {
  test('noteToFrequency A4=440Hz', () => {
    const engine = new AudioEngine(new AudioContext());
    expect(engine.noteToFrequency(69)).toBe(440);
  });
  
  test('noteToFrequency C4=261.63Hz', () => {
    const engine = new AudioEngine(new AudioContext());
    expect(engine.noteToFrequency(60)).toBeCloseTo(261.63, 2);
  });
});
```

---

## 📚 Recursos

### Referencias Técnicas
- **WebAudio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **p5.js Reference**: https://p5js.org/reference/
- **MOD Format**: https://www.aes.id.au/modformat.html
- **FastTracker 2 Effects**: http://milkytracker.titandemo.org/docs/effects.html

### Proyectos Similares
- **BassoonTracker**: https://github.com/steffest/BassoonTracker (MOD/XM en JavaScript)
- **BeepBox**: https://github.com/johnnesky/beepbox (Chiptune web tracker)
- **JummBox**: https://github.com/jummbus/jummbox (BeepBox mejorado)

### Herramientas
- **The Mod Archive**: https://modarchive.org/ (MOD files de referencia)
- **Freesound**: https://freesound.org/ (Samples 8-bit)
- **Web Audio Weekly**: https://www.webaudioweekly.com/ (Newsletter)

### Comunidad
- **WebAudio Slack**: https://web-audio-slackin.herokuapp.com/
- **r/webaudio**: https://reddit.com/r/webaudio
- **Scene.org**: https://scene.org (Demoscene/tracker community)

---

## 🐛 Troubleshooting

### Audio no se reproduce
```javascript
// Verificar AudioContext state
console.log(audioContext.state);  // debe ser "running"

// Si está suspended, resume manualmente
audioContext.resume();
```

### Latencia alta
```javascript
// Reducir buffer size (Chrome)
const audioContext = new AudioContext({
  latencyHint: 'interactive',  // ~10ms
  sampleRate: 44100
});
```

### Glitches en mobile
```javascript
// Reducir carga en mobile
if (/iPhone|iPad|Android/i.test(navigator.userAgent)) {
  frameRate(24);  // En lugar de 60
  song.channels = 4;  // En lugar de 8+
}
```

### Safari no reproduce
```javascript
// Safari requiere user gesture
function mousePressed() {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}
```

---

## 🚢 Deployment

### GitHub Pages

```bash
# 1. Push a GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Activar GitHub Pages
# Settings → Pages → Source: main branch → /root

# 3. URL será:
# https://sebasdv.github.io/trackerweb/
```

### Netlify

```bash
# 1. Crear netlify.toml
cat > netlify.toml << EOF
[build]
  publish = "."
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF

# 2. Deploy
netlify deploy --prod
```

### Vercel

```bash
# Deploy directo
vercel --prod
```

---

## 📝 Roadmap

### MVP (En desarrollo)
- [ ] Motor de audio básico (4 waveforms)
- [ ] Secuenciador y patterns
- [ ] Editor visual con p5.js
- [ ] Save/Load JSON

### Próximas Features
- [ ] Efectos MOD completos
- [ ] Visualizador FFT
- [ ] Export WAV/stems
- [ ] UI responsive y mobile support

---

## 🤝 Contribuir

```bash
# Fork el repo
git clone https://github.com/sebasdv/trackerweb.git

# Crear branch
git checkout -b feature/nueva-feature

# Commit cambios
git commit -am "Add nueva feature"

# Push
git push origin feature/nueva-feature

# Crear Pull Request en GitHub
```

**Guidelines:**
- Código JavaScript ES6+
- JSDoc comments en métodos públicos
- Seguir estructura de archivos existente
- Test manual en Chrome, Firefox, Safari

---

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE)

---

## 👨‍💻 Autor

**Sebastian Duarte**
- GitHub: [@sebasdv](https://github.com/sebasdv)
- Email: sebasdv@gmail.com

---

## 🙏 Agradecimientos

- **John Nesky** - BeepBox (inspiración)
- **Steffest** - BassoonTracker (referencia técnica)
- **Processing Foundation** - p5.js
- **W3C** - WebAudio API specification

---

**Made with ❤️ and JavaScript**
