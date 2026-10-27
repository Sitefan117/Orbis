/** Adresses courtes et uniques des cours HTML publiés sous static/. */
export const coursePaths = {
  fractions: {
    complete: '/cours/maths/fractions/complet.html',
    stages: '/cours/maths/fractions/etapes.html'
  },
  measures: {
    reference: '/cours/maths/mesures/reference.html',
    mesurovia: {
      'sentiers-moulin': '/cours/maths/mesures/mesurovia/sentiers.html',
      'clairieres-compas': '/cours/maths/mesures/mesurovia/clairieres.html',
      'canaux-artisans': '/cours/maths/mesures/mesurovia/canaux.html',
      'hautes-terres': '/cours/maths/mesures/mesurovia/hautes-terres.html'
    }
  },
  geometry: {
    notebook: '/cours/maths/geometrie/carnet.html',
    sketch: '/cours/maths/geometrie/croquis.html'
  }
} as const;
