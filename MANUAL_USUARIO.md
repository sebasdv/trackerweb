# 📖 TrackWeb - Manual de Usuario

**TrackWeb** es un tracker de música 8-bit inspirado en FastTracker 2 y los sintetizadores Mutable Instruments, con capacidades de síntesis avanzada en el navegador.

---

## 🎯 Tabla de Contenidos

1. [Primeros Pasos](#primeros-pasos)
2. [Interfaz de Usuario](#interfaz-de-usuario)
3. [Conceptos Básicos](#conceptos-básicos)
4. [Edición de Patterns](#edición-de-patterns)
5. [Instrumentos (Set C)](#instrumentos-set-c)
6. [Sistema de Escalas](#sistema-de-escalas)
7. [Atajos de Teclado](#atajos-de-teclado)
8. [Gestión de Canciones](#gestión-de-canciones)
9. [Tips y Trucos](#tips-y-trucos)

---

## 🚀 Primeros Pasos

### Iniciar el Tracker

1. Abre `index.html` en tu navegador
2. **Haz click en cualquier lugar** para iniciar el audio
3. ¡Listo! Ya puedes empezar a hacer música

### Primera Canción

El tracker viene con una canción de ejemplo que demuestra los 8 instrumentos. Presiona **Espacio** para reproducir.

---

## 🖥️ Interfaz de Usuario

### Áreas Principales

```
┌─────────────────────────────────────────────┐
│ TrackWeb - 8-bit Music Tracker              │
├─────────────────────────────────────────────┤
│ [Tempo] [Pattern Rows] [Key/Scale] [Play]   │ ← Controles
├─────────────────────────────────────────────┤
│ [Pattern Nav] [Actions] [Order]             │ ← Pattern Manager
├─────────────────────────────────────────────┤
│                                             │
│     PATTERN EDITOR (16 filas visibles)      │
│     8 canales × N filas                     │
│                                             │
│     ▲ Scroll indicators ▼                   │
│                                             │
├─────────────────────────────────────────────┤
│ Z-I: Notes | 0-9: Octave | Tab: Field       │ ← Info
└─────────────────────────────────────────────┘
```

### Controles Superiores

- **Tempo (BPM):** Velocidad de reproducción (botones +/-)
- **Pattern Rows:** Tamaño del pattern (16, 32, 64, 128)
- **Key:** Nota raíz (C-B)
- **Scale:** Escala musical (Major, Minor, etc.)
- **Snap:** Activar cuantización a escala
- **▶ Play / ⏸ Pause:** Reproducir/pausar
- **⏹ Stop:** Detener reproducción

### Pattern Editor

El área principal donde editas las notas. Muestra **16 filas a la vez** con scroll automático.

**Estructura de cada celda:**
```
C-4 01 30 ...
│   │  │  │
│   │  │  └─ Efecto (FX + parámetro)
│   │  └──── Volumen (hex: 00-40)
│   └─────── Instrumento (hex: 00-07)
└─────────── Nota (C-4 = C en octava 4)
```

---

## 📚 Conceptos Básicos

### Pattern

Un **pattern** es una matriz de notas con:
- **8 canales** (tracks verticales)
- **N filas** (16-128, configurable)
- Cada celda contiene: Nota, Instrumento, Volumen, Efecto

### Song Structure

```
Song
 ├─ Patterns (0, 1, 2, ...)
 ├─ Order [0, 1, 0, 2, ...]  ← Secuencia de reproducción
 └─ Instruments (0-7)
```

### Cursor

El cursor tiene **5 campos** que puedes editar:

1. **Note** - Nota musical (C-0 a B-9)
2. **Inst** - Instrumento (00-07)
3. **Vol** - Volumen (00-40 en hex = 0-64)
4. **FX** - Código de efecto
5. **Param** - Parámetro del efecto

Usa **Tab** para moverte entre campos.

---

## ✏️ Edición de Patterns

### Navegación

| Tecla | Acción |
|-------|--------|
| **↑ ↓** | Mover cursor arriba/abajo |
| **← →** | Cambiar canal |
| **Tab** | Siguiente campo (Note → Inst → Vol → FX → Param) |
| **PageUp/PageDown** | Scroll rápido (8 filas) |

### Ingresar Notas

**Teclado tipo piano:**

```
Fila superior (octava +1):
 Q  W  E  R  T  Y  U  I
 C  D  E  F  G  A  B  C

Fila inferior (octava base):
 Z  X  C  V  B  N  M
 C  D  E  F  G  A  B

Sostenidos (#):
 S  D  G  H  J  (entre teclas principales)
```

**Cambiar octava:**
- Teclas **0-9**: Establece la octava actual
- La octava actual se muestra en la esquina superior derecha

### Editar Campos

1. **Nota**: Tocar teclas del piano
2. **Instrumento**: Teclas **0-9, A-F** (hexadecimal)
3. **Volumen**: Teclas **0-9, A-F** (hex: 00-40)
4. **Efecto**: Teclas **0-9, A-F**

### Borrar

- **Delete/Backspace**: Borra el campo actual o toda la nota

### Copiar/Pegar

| Atajo | Acción |
|-------|--------|
| **Shift + ↑↓←→** | Seleccionar área |
| **Ctrl+C** | Copiar selección |
| **Ctrl+X** | Cortar selección |
| **Ctrl+V** | Pegar en cursor |
| **Esc** | Cancelar selección |

---

## 🎛️ Instrumentos (Set C)

TrackWeb incluye **8 instrumentos avanzados** inspirados en Mutable Instruments:

### 0. PWM Lead
- **Tipo:** Pulse 50% con vibrato
- **Uso:** Melodías principales, leads
- **Características:** Sonido clásico chiptune, vibrato sutil

### 1. FM Bass
- **Tipo:** FM Synthesis 2-operator
- **Uso:** Líneas de bajo potentes
- **Características:** Ratio 0.5, index 3.0, sonido gordo y profundo
- **Parámetros FM:**
  - Ratio: 0.5 (modulador más grave que carrier)
  - Index: 3.0 (modulación media-alta)
  - Feedback: 0.2

### 2. Pluck String
- **Tipo:** Karplus-Strong (physical modeling)
- **Uso:** Arpegios, guitarras, bajos pluck
- **Características:** Decay natural, sonido realista
- **Parámetros:**
  - Damping: 0.98 (decay natural)
  - Brightness: 0.7 (brillante)

### 3. Vocal (A)
- **Tipo:** Formant synthesis
- **Uso:** Melodías vocales, pads atmosféricos
- **Características:** Filtros formantes de vocal 'a'
- **Formantes:** F1=730Hz, F2=1090Hz, F3=2440Hz

### 4. Wavefold Lead
- **Tipo:** Sawtooth + Wavefolder
- **Uso:** Leads agresivos, sonidos distorsionados
- **Características:** Distorsión armónica controlada
- **Wavefold:** 0.6 (60% de folding)

### 5. Filtered Noise
- **Tipo:** Noise + Filtro Bandpass
- **Uso:** Hi-hats, FX, sweeps
- **Características:** Alta resonancia (Q=8.0)
- **Filtro:** Bandpass 2000Hz

### 6. FM Kick
- **Tipo:** FM Synthesis 2-operator
- **Uso:** Bombo/kick drum
- **Características:** Punch potente con FM
- **Parámetros FM:**
  - Ratio: 2.0 (armónicos altos)
  - Index: 8.0 (modulación extrema)
  - Feedback: 0.3

### 7. Snare Drum
- **Tipo:** Noise + Filtro Highpass
- **Uso:** Caja/snare
- **Características:** Filtro 800Hz, sonido clásico

### Notas para Batería

Aunque las notas MIDI son irrelevantes para noise, usa:
- **Kick:** C2 (nota 36)
- **Snare:** D2 (nota 38)
- **Hi-hat:** cualquier nota

---

## 🎼 Sistema de Escalas

El sistema de escalas ayuda a mantener **armonía** entre todos los patterns.

### Escalas Disponibles

1. **Chromatic** - Todas las notas (sin restricción)
2. **Major** - Do mayor (C-D-E-F-G-A-B)
3. **Minor** - La menor natural
4. **Dorian** - Modo dórico
5. **Phrygian** - Modo frigio
6. **Lydian** - Modo lidio
7. **Mixolydian** - Modo mixolidio
8. **Pentatonic Major** - Pentatónica mayor
9. **Pentatonic Minor** - Pentatónica menor
10. **Blues** - Escala de blues
11. **Harmonic Minor** - Menor armónica

### Cómo Usar

1. **Selecciona Key (Root Note)**: Ej: C, D#, G
2. **Selecciona Scale**: Ej: Major, Minor, Blues
3. **Activa "Snap"**: Checkbox para cuantización automática
4. **Toca notas**: Se cuantizan automáticamente a la escala

### Ejemplo

```
Key: C
Scale: Major
Snap: ON

Tocas D# → Se cuantiza a E (nota más cercana en C Major)
Tocas F# → Se cuantiza a G
Tocas A# → Se cuantiza a B
```

**Ventajas:**
- ✅ Nunca tocarás notas "feas"
- ✅ Armonía garantizada entre patterns
- ✅ Composición más rápida sin pensar en teoría

---

## ⌨️ Atajos de Teclado

### Globales

| Atajo | Acción |
|-------|--------|
| **Click** | Iniciar audio (primera vez) |
| **Espacio** | Play/Pause |
| **Ctrl+S** | Guardar canción |
| **Ctrl+O** | Abrir canción |

### Navegación

| Atajo | Acción |
|-------|--------|
| **↑ ↓ ← →** | Mover cursor |
| **Tab** | Siguiente campo |
| **PageUp** | Subir 8 filas |
| **PageDown** | Bajar 8 filas |

### Edición

| Atajo | Acción |
|-------|--------|
| **Z-M** | Notas (fila inferior) |
| **Q-I** | Notas (fila superior, octava +1) |
| **0-9** | Cambiar octava (en campo Note) |
| **0-9, A-F** | Ingresar hex (en otros campos) |
| **Delete/Backspace** | Borrar |

### Selección

| Atajo | Acción |
|-------|--------|
| **Shift + ↑↓←→** | Seleccionar área |
| **Ctrl+C** | Copiar |
| **Ctrl+X** | Cortar |
| **Ctrl+V** | Pegar |
| **Esc** | Cancelar selección |

### Edit Step

El "edit step" determina cuántas filas avanza el cursor después de insertar una nota.

Por defecto: **1 fila**

---

## 💾 Gestión de Canciones

### Guardar

1. **Ctrl+S** o botón "Save"
2. Descarga archivo `.wtk` (WebTracker format)
3. El archivo incluye:
   - Todos los patterns
   - Instrumentos
   - Order
   - Configuración de BPM, escalas, etc.

### Cargar

1. **Ctrl+O** o botón "Load"
2. Selecciona archivo `.wtk` o `.json`
3. La canción se carga automáticamente

### Formato

Los archivos `.wtk` son JSON con esta estructura:

```json
{
  "title": "Demo Song",
  "author": "TrackWeb",
  "bpm": 125,
  "speed": 6,
  "channels": 8,
  "rootNote": 0,
  "scale": "Chromatic",
  "snapToScale": false,
  "instruments": [...],
  "patterns": [...],
  "order": [0]
}
```

---

## 💡 Tips y Trucos

### Composición

1. **Empieza simple**: Usa solo kick, snare, hi-hat y bajo
2. **Usa escalas**: Activa "Snap to Scale" para evitar notas feas
3. **Copia patterns**: Clona patterns y modifícalos ligeramente
4. **Varía instrumentos**: Cada canal puede usar cualquier instrumento

### Batería

Patrón básico de batería:

```
Row  Ch6 (Kick)  Ch7 (Snare)  Ch5 (Hi-hat)
00   C2 06 64    ...          ... 05 30
04   ...         ...          ... 05 30
08   ...         D2 07 55     ... 05 30
12   ...         ...          ... 05 30
16   C2 06 64    ...          ... 05 30
...
```

### Bajo y Armonía

1. **Bajo en canal 1**: FM Bass (inst 01)
2. **Toca notas graves**: C2-C3 (octavas 2-3)
3. **Sigue la progresión**: I-IV-V en la escala seleccionada

Ejemplo en C Major:
- C2 (tónica)
- F2 (cuarta)
- G2 (quinta)
- C2 (tónica)

### Leads y Melodías

1. **Lead en canal 0**: PWM Lead o Wavefold Lead
2. **Octavas medias-altas**: C4-C6
3. **Usa formant para vocales**: Inst 03 (Vocal A)
4. **Pluck para arpegios**: Inst 02 (Pluck String)

### Efectos con Instrumentos

**Vibrato natural**: PWM Lead tiene vibrato integrado

**Distorsión controlada**: Wavefold Lead (inst 04)

**Sweeps**: Filtered Noise con alta resonancia

### Workflow Recomendado

1. **Configurar escala**: Key + Scale + Snap ON
2. **Batería primero**: Canales 5-7 (kick, snare, hi-hat)
3. **Bajo**: Canal 1 (FM Bass)
4. **Melodía**: Canal 0 (PWM Lead o Pluck)
5. **Armonía**: Canales 2-4 (acordes, contramelodías)

### Optimización

**Scroll de 16 filas**: El tracker solo muestra 16 filas a la vez. Usa PageUp/PageDown para navegar rápido.

**Copiar bloques**: Selecciona con Shift+flechas, copia con Ctrl+C, pega en múltiples lugares.

**Patterns reutilizables**: Crea un pattern de batería, clónalo, úsalo en todo el order.

---

## 🎓 Ejercicio Práctico

### Tu Primera Canción en 5 Minutos

1. **Configurar escala**:
   - Key: C
   - Scale: Pentatonic Minor
   - Snap: ON

2. **Batería básica** (canales 5-7):
   ```
   Row  Kick(6)   Snare(7)  Hi-hat(5)
   00   C2 06 64  ...       ... 05 30
   04   ...       ...       ... 05 30
   08   ...       D2 07 55  ... 05 30
   12   ...       ...       ... 05 30
   ```

3. **Bajo** (canal 1):
   ```
   Row  Bass
   00   C2 01 50
   16   F2 01 50
   32   G2 01 50
   48   C2 01 50
   ```

4. **Melodía** (canal 0):
   - Toca en octava 4-5 con PWM Lead
   - Usa la escala pentatónica (no hay notas malas!)

5. **Press Play!** ▶

---

## 🔧 Solución de Problemas

### No se escucha audio

- ✅ Haz click en la página para iniciar audio
- ✅ Verifica volumen del navegador
- ✅ Revisa que las notas tengan volumen (30-64)

### Las notas no se insertan

- ✅ Verifica que estés en el campo "Note" (Tab para cambiar)
- ✅ Verifica la octava actual (0-9)
- ✅ Presiona las teclas correctas (Z-M, Q-I)

### El tracker se ve cortado

- ✅ Canvas ajustado a 1200×550px
- ✅ Zoom del navegador al 100%

### La canción no se guarda

- ✅ Usa Ctrl+S
- ✅ Permite descargas en el navegador
- ✅ Verifica permisos de archivos

---

## 📖 Glosario

**BPM**: Beats Per Minute (velocidad del tempo)

**Pattern**: Matriz de notas (8 canales × N filas)

**Order**: Secuencia de reproducción de patterns

**Tracker**: Software de creación musical basado en patrones

**FM Synthesis**: Síntesis por modulación de frecuencia

**Karplus-Strong**: Algoritmo de síntesis física de cuerdas

**Formant**: Resonancia característica de vocales

**Wavefolder**: Distorsión por plegado de onda

**ADSR**: Attack, Decay, Sustain, Release (envelope)

**Hex**: Hexadecimal (0-9, A-F)

**Quantize**: Ajustar notas a una escala/grid

---

## 📚 Recursos Adicionales

### Inspiración

- **FastTracker 2**: Tracker clásico de los 90s
- **Mutable Instruments**: Sintetizadores modulares (Plaits, Braids)
- **Chiptune**: Música de videojuegos 8-bit

### Tutoriales de Tracker

- Busca "FastTracker 2 tutorial" en YouTube
- Conceptos aplican a TrackWeb

### Teoría Musical

- Escalas y modos
- Progresiones de acordes (I-IV-V, etc.)
- Armonía básica

---

## ✨ Características Avanzadas

### LFO (Low Frequency Oscillator)

Algunos instrumentos tienen LFO integrado:
- PWM Lead: Vibrato en pitch
- Se puede activar manualmente editando el instrumento

### Filtros Resonantes

Varios instrumentos usan filtros:
- Formant Vocal: Bandpass (vocal 'a')
- Filtered Noise: Bandpass 2000Hz
- Snare: Highpass 800Hz

### Síntesis FM

FM Bass y FM Kick usan 2-operator FM:
- **Carrier**: Oscilador portadora (frecuencia base)
- **Modulator**: Oscilador modulador (crea armónicos)
- **Ratio**: Relación modulador/carrier
- **Index**: Intensidad de modulación
- **Feedback**: Retroalimentación del modulador

---

## 🎉 ¡Ahora eres un experto en TrackWeb!

**Disfruta creando música chiptune con síntesis avanzada** 🎹🎶

---

*TrackWeb - 8-bit Music Tracker*
*Inspirado en FastTracker 2 y Mutable Instruments*
*Made with ❤️ using p5.js y Web Audio API*
