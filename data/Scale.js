/**
 * Scale.js
 * Sistema de escalas musicales para mantener armonía entre patrones
 */

class Scale {
  /**
   * Definiciones de escalas como intervalos desde la tónica (semitonos)
   */
  static SCALES = {
    'Chromatic': {
      intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      name: 'Chromatic (All Notes)'
    },
    'Major': {
      intervals: [0, 2, 4, 5, 7, 9, 11],
      name: 'Major (Ionian)'
    },
    'Minor': {
      intervals: [0, 2, 3, 5, 7, 8, 10],
      name: 'Minor (Aeolian)'
    },
    'Dorian': {
      intervals: [0, 2, 3, 5, 7, 9, 10],
      name: 'Dorian'
    },
    'Phrygian': {
      intervals: [0, 1, 3, 5, 7, 8, 10],
      name: 'Phrygian'
    },
    'Lydian': {
      intervals: [0, 2, 4, 6, 7, 9, 11],
      name: 'Lydian'
    },
    'Mixolydian': {
      intervals: [0, 2, 4, 5, 7, 9, 10],
      name: 'Mixolydian'
    },
    'Locrian': {
      intervals: [0, 1, 3, 5, 6, 8, 10],
      name: 'Locrian'
    },
    'Pentatonic Major': {
      intervals: [0, 2, 4, 7, 9],
      name: 'Pentatonic Major'
    },
    'Pentatonic Minor': {
      intervals: [0, 3, 5, 7, 10],
      name: 'Pentatonic Minor'
    },
    'Blues': {
      intervals: [0, 3, 5, 6, 7, 10],
      name: 'Blues'
    },
    'Harmonic Minor': {
      intervals: [0, 2, 3, 5, 7, 8, 11],
      name: 'Harmonic Minor'
    },
    'Melodic Minor': {
      intervals: [0, 2, 3, 5, 7, 9, 11],
      name: 'Melodic Minor (Ascending)'
    },
    'Whole Tone': {
      intervals: [0, 2, 4, 6, 8, 10],
      name: 'Whole Tone'
    },
    'Diminished': {
      intervals: [0, 2, 3, 5, 6, 8, 9, 11],
      name: 'Diminished (Half-Whole)'
    }
  };

  /**
   * Nombres de notas
   */
  static NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  /**
   * Cuantiza una nota MIDI a la escala más cercana
   * @param {number} midiNote - Nota MIDI (0-127)
   * @param {number} rootNote - Nota raíz (0-11, donde 0=C)
   * @param {string} scaleName - Nombre de la escala
   * @returns {number} Nota MIDI cuantizada
   */
  static quantizeToScale(midiNote, rootNote, scaleName) {
    const scaleData = this.SCALES[scaleName];
    if (!scaleData || scaleName === 'Chromatic') {
      return midiNote; // Sin cuantización
    }

    const intervals = scaleData.intervals;
    const octave = Math.floor(midiNote / 12);
    const noteInOctave = midiNote % 12;

    // Ajustar por root note
    const relativeNote = (noteInOctave - rootNote + 12) % 12;

    // Encontrar la nota más cercana en la escala
    let closestInterval = intervals[0];
    let minDistance = Math.abs(relativeNote - closestInterval);

    for (let i = 1; i < intervals.length; i++) {
      const distance = Math.abs(relativeNote - intervals[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestInterval = intervals[i];
      }
    }

    // Si la distancia es la misma hacia arriba o abajo, preferir hacia abajo
    if (relativeNote > intervals[intervals.length - 1]) {
      // Nota está arriba de la escala, podría ser más cercana a la octava siguiente
      const distanceToNextOctave = Math.abs(relativeNote - (intervals[0] + 12));
      if (distanceToNextOctave < minDistance) {
        closestInterval = intervals[0];
        return octave * 12 + ((rootNote + closestInterval) % 12) + 12;
      }
    }

    // Reconstruir la nota MIDI
    const quantizedNote = octave * 12 + ((rootNote + closestInterval) % 12);

    // Ajustar si pasamos al siguiente o anterior octava
    if (quantizedNote < midiNote - 6) {
      return quantizedNote + 12;
    } else if (quantizedNote > midiNote + 6) {
      return quantizedNote - 12;
    }

    return quantizedNote;
  }

  /**
   * Verifica si una nota está en la escala
   * @param {number} midiNote - Nota MIDI
   * @param {number} rootNote - Nota raíz (0-11)
   * @param {string} scaleName - Nombre de la escala
   * @returns {boolean} True si la nota está en la escala
   */
  static isNoteInScale(midiNote, rootNote, scaleName) {
    const scaleData = this.SCALES[scaleName];
    if (!scaleData || scaleName === 'Chromatic') {
      return true;
    }

    const noteInOctave = midiNote % 12;
    const relativeNote = (noteInOctave - rootNote + 12) % 12;

    return scaleData.intervals.includes(relativeNote);
  }

  /**
   * Obtiene todas las notas de la escala en una octava
   * @param {number} rootNote - Nota raíz (0-11)
   * @param {string} scaleName - Nombre de la escala
   * @param {number} octave - Octava (0-9)
   * @returns {number[]} Array de notas MIDI en la escala
   */
  static getScaleNotes(rootNote, scaleName, octave = 4) {
    const scaleData = this.SCALES[scaleName];
    if (!scaleData) {
      return [];
    }

    return scaleData.intervals.map(interval => {
      return octave * 12 + ((rootNote + interval) % 12);
    });
  }

  /**
   * Obtiene la lista de nombres de escalas disponibles
   * @returns {string[]} Array de nombres de escalas
   */
  static getScaleNames() {
    return Object.keys(this.SCALES);
  }
}
