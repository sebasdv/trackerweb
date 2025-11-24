# Desarrollo con Claude Code

Guía de desarrollo del proyecto trackerweb usando Claude Code para implementación y debugging.

## Setup Inicial

```bash
# 1. Inicializar proyecto
claude code init trackerweb

# 2. Crear estructura de archivos
claude code "Crea la estructura completa del proyecto según el README"

# 3. Implementar AudioEngine básico
claude code "Implementa AudioEngine.js con osciladores pulse, triangle, sawtooth y noise"

# 4. Crear estructuras de datos
claude code "Implementa Song.js, Pattern.js e Instrument.js con serialización JSON"
```

## Workflow de Desarrollo

### Fase 1: Motor de Audio

```bash
# Implementar síntesis básica
claude code "Agrega método playNote() al AudioEngine con ADSR envelope"

# Test síntesis
claude code "Crea archivo test/audio-test.html para probar los osciladores"

# Implementar conversión nota a frecuencia
claude code "Implementa noteToFrequency() usando fórmula MIDI estándar"
```

### Fase 2: Secuenciador

```bash
# Implementar timing
claude code "Implementa Sequencer.js con control de BPM y speed"

# Pattern playback
claude code "Agrega método processRow() para trigger de notas"

# Multi-canal
claude code "Implementa soporte para 4 canales simultáneos"
```

### Fase 3: UI con p5.js

```bash
# Pattern editor visual
claude code "Implementa PatternEditor.js con grid rendering en canvas"

# Input handling
claude code "Agrega handleKeyPress() con soporte de teclado QWERTY"

# Visualizador
claude code "Implementa Visualizer.js con FFT spectrum display"
```

### Fase 4: Efectos

```bash
# Efectos básicos
claude code "Implementa efecto Arpeggio (0xy) en Effects.js"
claude code "Implementa efecto Vibrato (4xy) con LFO senoidal"
claude code "Implementa efectos Portamento Up/Down (1xx, 2xx)"

# Test efectos
claude code "Crea pattern de ejemplo con todos los efectos implementados"
```

### Fase 5: Export y Stems

```bash
# Grabación
claude code "Implementa StemRecorder.js con MediaRecorder API"

# Export WAV
claude code "Agrega método audioBufferToWav() para export offline"

# UI export
claude code "Crea modal de export con opciones de formato y stems"
```

## Testing y Debug

```bash
# Verificar síntesis
claude code "Agrega console logs para debugging de frecuencias"

# Performance profiling
claude code "Implementa contador de voces activas y uso de CPU"

# Browser compatibility
claude code "Agrega detección de features y fallbacks para Safari"
```

## Comandos Útiles

```bash
# Generar documentación JSDoc
claude code "Agrega JSDoc comments a todos los métodos públicos"

# Crear canciones de ejemplo
claude code "Genera 3 patterns de ejemplo: techno, chiptune, ambient"

# Optimizar performance
claude code "Refactoriza PatternEditor.render() para usar createGraphics"

# Mobile support
claude code "Agrega touch events y UI responsive"
```

## Best Practices

- Usar Claude Code para implementar features incrementalmente
- Probar cada componente antes de integrar
- Mantener la estructura modular del proyecto
- Documentar cambios significativos
- Realizar commits frecuentes con mensajes descriptivos
