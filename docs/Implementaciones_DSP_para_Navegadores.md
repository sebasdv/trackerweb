# Mutable Instruments en la Web: Implementaciones DSP para Navegadores

Los módulos de síntesis de Mutable Instruments ya funcionan en navegadores gracias a WebAssembly. El proyecto **Cardinal** ejecuta el catálogo completo de Audible Instruments (Plaits, Rings, Clouds, Elements y más) directamente en el navegador, demostrando que la integración con Web Audio API es viable para aplicaciones de música como trackers. Para implementaciones más ligeras, existen paquetes npm como **@vectorsize/woscillators** (Plaits) y ports en Rust listos para compilar a WASM.

---

## El ecosistema de ports web de Mutable Instruments

El código fuente original reside en **github.com/pichenettes/eurorack**, publicado bajo licencia MIT para los proyectos STM32F (Plaits, Rings, Clouds, Elements, Marbles, Warps, Tides). Esta licencia permisiva ha permitido múltiples implementaciones multiplataforma que sirven como base para ports web.

La implementación web más completa es **Cardinal** (cardinal.kx.studio), que compila más de **1,193 módulos** a WebAssembly incluyendo todos los Audible Instruments de VCV Rack. Utiliza el framework DPF con Emscripten, soporta Web-SIMD para optimización, y demuestra que físico modelado complejo como Elements funciona en tiempo real en navegadores modernos. Una versión reducida está disponible en minicardinal.kx.studio para cargas más rápidas.

Para integraciones más específicas existen opciones modulares:

| Implementación | Módulos | Tecnología | Estado |
|----------------|---------|------------|--------|
| **@vectorsize/woscillators** | Plaits (16 motores) | Emscripten → WASM + AudioWorklet | Disponible en npm |
| **mi-plaits-dsp-rs** | Plaits (24 motores, firmware 1.2) | Rust puro, no_std | crates.io, actualizado 2025 |
| **VCV Audible Instruments** | Todos (Braids, Clouds, Elements, Rings, Plaits, Marbles, etc.) | C++ → VCV Rack (WASM experimental en Pro) | Mantenido activamente |
| **vb.mi objects** | Plaits, Rings, Clouds, Braids, Elements, Warps, Marbles | C++ → Max/MSP externals | Código fuente reutilizable |

El paquete npm **@vectorsize/woscillators** ofrece la ruta más directa para integrar Plaits en aplicaciones web. Expone los 16 modelos de síntesis con parámetros de frecuencia, armónicos, timbre y morph como AudioWorkletNode.

---

## Características técnicas de los módulos principales

La arquitectura del código de Mutable Instruments separa limpiamente el DSP del hardware, facilitando ports a otras plataformas. Todos los módulos comparten la librería **stmlib** que provee filtros SVF, polyblep para anti-aliasing, interpolación de parámetros y conversión de semitonos.

**Plaits** implementa **16 modelos de síntesis** en clases C++ independientes: síntesis virtual analógica, FM, aditiva con 24 armónicos, wavetable, resonador modal, Karplus-Strong, y síntesis de voz (SAM, LPC, formantes). Opera a 48kHz con procesamiento interno en punto flotante de 32 bits. Los modelos más intensivos computacionalmente son el aditivo y el granular de partículas. Ha sido exitosamente portado a VCV Rack, Rust, MaxMSP y Korg Prologue, validando su portabilidad.

**Rings** utiliza un banco de **60 filtros pasa-banda paralelos** implementados como SVF que pueden dividirse para polifonía (2×30 o 4×15 voces). Ofrece tres modelos de resonador: modal (compartido con Elements), cuerdas simpáticas (red de filtros comb), y cuerdas con dispersión no lineal. Consume aproximadamente 60% menos CPU que Elements al no incluir secciones de excitador ni reverb.

**Elements** es el módulo más demandante: opera a **32kHz** (decisión de diseño para ajustarse al presupuesto de CPU del hardware) con un excitador de tres secciones (bowing, blowing, striking) alimentando **64 filtros SVF zero-delay feedback** para el resonador modal, más reverb estéreo integrada. El acoplamiento entre parámetros del excitador y resonador añade complejidad a la implementación.

**Clouds** implementa síntesis granular con hasta **40-60 granos concurrentes**, tamaños de grano de 16ms a 1 segundo, y un buffer de grabación de 1-8 segundos según la calidad seleccionada. El modo espectral utiliza **FFT** para almacenar coeficientes de frecuencia en lugar de audio, permitiendo warping de frecuencias—este es el único modo que requiere dependencias de FFT (CMSIS DSP en el original).

**Marbles** y **Tides** presentan menor complejidad DSP. Marbles se centra en generación de patrones aleatorios, sample & hold cuantizado y procesadores de lag. Tides es esencialmente un generador de funciones basado en wavetable. Ambos son candidatos ideales para primeros ports debido a su menor carga computacional.

| Módulo | LOC DSP Estimado | Requiere FFT | Filtros Paralelos | CPU Relativa |
|--------|------------------|--------------|-------------------|--------------|
| Tides | ~2,000 | No | 0 | Baja |
| Marbles | ~3,000 | No | 0 | Baja |
| Warps | ~4,000 | Sí (vocoder) | 0 | Media |
| Braids | ~8,000 | No | 0 | Media-Alta |
| Plaits | ~10,000 | No | 24 parciales modales | Alta |
| Rings | ~5,000 | No | 60 | Alta |
| Elements | ~8,000 | No | 64 | Muy Alta |
| Clouds | ~6,000 | Sí (modo espectral) | Diffuser 4 AP | Muy Alta |

---

## Integración con Web Audio API para trackers

La arquitectura recomendada combina **AudioWorkletProcessor** ejecutándose en un thread de audio dedicado con módulos WebAssembly compilados vía Emscripten. El quantum de renderizado fijo de **128 muestras** en Web Audio establece un presupuesto de tiempo de ~2.67ms a 48kHz—suficiente para módulos individuales de MI pero ajustado para cadenas complejas.

Los flags de compilación críticos para Emscripten son:
```bash
emcc dsp.cpp -o dsp.js \
  -sAUDIO_WORKLET -sWASM_WORKERS \
  -sALLOW_MEMORY_GROWTH -O3 \
  -msimd128
```

El soporte **SIMD de 128 bits** está estandarizado en WebAssembly y disponible en Chrome, Firefox 89+ y Safari, proporcionando aceleraciones de **2-4x** en operaciones vectorizables como copias de buffers, multiplicación de samples y cálculos de filtros.

Para módulos que necesitan bloques mayores a 128 samples (como Clouds con su buffer de grabación), se implementa un **ring buffer** que acumula bloques de 128 frames hasta alcanzar el umbral requerido (256-2048 frames), procesa, y extrae 128 frames por callback. La librería **ringbuf.js** de Paul Adenot (Mozilla) demuestra mejoras de ~325% sobre postMessage para comunicación entre threads.

La gestión de memoria entre el heap de WASM y los typed arrays de JavaScript requiere clonación explícita:

```javascript
process(inputs, outputs) {
  // Copiar entrada al heap WASM
  this.wasmHeap.set(inputs[0][0], inputOffset);
  // Llamar procesamiento WASM
  this.wasmInstance.exports.process();
  // Copiar salida desde heap WASM
  outputs[0][0].set(this.wasmHeap.subarray(outputOffset, outputOffset + 128));
  return true;
}
```

Para trackers específicamente, el patrón más efectivo utiliza **SharedArrayBuffer + Atomics** para comunicación lock-free entre el thread principal (UI del tracker, secuenciador de patrones) y el AudioWorklet. Esto evita pausas de garbage collection que causan glitches audibles. Requiere headers HTTP específicos:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

---

## Proyectos de referencia para arquitecturas de tracker

**Efflux** (github.com/igorski/efflux-tracker) representa la referencia más relevante para trackers web modernos. Utiliza Vue.js con TypeScript para el motor de audio, separando claramente el modelo de canción en Vuex del renderizado de audio. Su AudioService maneja routing, conexiones de nodos, efectos y grabación con eventos noteOn/noteOff estilo MIDI. Aunque no incorpora código MI, su arquitectura es directamente aplicable.

**BeepBox** (github.com/johnnesky/beepbox) demuestra síntesis computacional completa en navegador con patrón de 8 canales y 32 slots de nota por patrón. Su carpeta `synth/` contiene código de playback standalone disponible como paquete npm. Usa ScriptProcessorNode (deprecated pero estable) con su método `audioProcessCallback` para generación de samples.

**Strudel** (strudel.cc) implementa secuenciamiento basado en patrones de forma algorítmica, portando el lenguaje de patrones de TidalCycles a JavaScript. Su sintetizador integrado "superdough" incluye síntesis granular y visualizaciones FFT inline con el código.

**Cardinal** permanece como la referencia definitiva para DSP de MI en navegador. Su arquitectura compila el runtime completo de VCV Rack a WASM, demostrando que módulos como Elements (64 filtros paralelos) y Clouds (40-60 granos + FFT) funcionan en tiempo real. El código está bajo GPL-3.0+.

---

## Recomendaciones para implementación en tracker

Para integrar módulos MI en un music tracker web, la estrategia óptima considera tres factores: complejidad de port, demanda de CPU, y utilidad musical en contexto de secuenciamiento por patrones.

**Plaits emerge como el candidato prioritario**. Su diseño como macro-oscilador con 16 modelos cubre desde síntesis sustractiva hasta percusión física, exactamente lo que un tracker necesita. El paquete npm @vectorsize/woscillators proporciona integración inmediata, mientras que mi-plaits-dsp-rs ofrece control total para compilación personalizada a WASM con optimizaciones específicas.

**Rings** como segundo candidato añade resonancia modal característica con CPU moderada, ideal para texturas y leads con carácter físico. Su API limpia (audio de entrada → salida resonada) simplifica integración.

**Clouds** requiere consideración especial: el buffer de grabación de 1-8 segundos demanda memoria significativa en el heap de WASM, y el modo espectral necesita implementación FFT. Para trackers, los modos granular básico y delay son más prácticos que el modo espectral completo.

**Elements** debería reservarse para implementaciones avanzadas. Sus 64 filtros paralelos consumen CPU significativa incluso en hardware nativo, y su sample rate reducido de 32kHz requiere resampling hacia los 44.1/48kHz típicos del navegador.

**Tides y Marbles** como moduladores son valiosos para automatización de parámetros en el tracker: Tides como LFO/envelope sofisticado, Marbles para secuencias generativas y cuantizadas.

El orden de implementación recomendado: **Tides → Plaits → Rings → Warps → Clouds → Elements**, progresando de menor a mayor complejidad mientras se valida la arquitectura AudioWorklet + WASM.

---

## Conclusión

La viabilidad de ejecutar DSP de Mutable Instruments en navegadores está demostrada por Cardinal, que compila el catálogo completo de Audible Instruments a WebAssembly. Para un music tracker, **Plaits** vía @vectorsize/woscillators o mi-plaits-dsp-rs ofrece la ruta más directa hacia síntesis de calidad eurorack en la web. La arquitectura debe basarse en AudioWorklet con WASM compilado con SIMD habilitado, usando SharedArrayBuffer para comunicación sin pausas de GC entre el secuenciador del tracker y el thread de audio. Los módulos con menor footprint de CPU (Tides, Marbles, Warps) complementan la síntesis principal, mientras que Elements y Clouds representan objetivos avanzados para implementaciones maduras.