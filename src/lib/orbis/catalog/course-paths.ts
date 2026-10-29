/** Adresses courtes et uniques des cours HTML publiés sous static/. */
export const coursePaths = {
  fractions: {
    complete: '/cours/maths/fractions/complet.html',
    stages: '/cours/maths/fractions/etapes.html'
  },
  measures: {
    reference: '/cours/maths/mesures/reference.html',
    mesurovia: {
      'fondations-mesure': '/cours/maths/mesures/mesurovia/fondations.html',
      'royaume-conversions': '/cours/maths/mesures/mesurovia/conversions.html',
      'aires-perimetres': '/cours/maths/mesures/mesurovia/aires-perimetres.html',
      'volumes-capacites': '/cours/maths/mesures/mesurovia/volumes-capacites.html',
      'missions-maitrise': '/cours/maths/mesures/mesurovia/missions-maitrise.html'
    }
  },
  geometry: {
    notebook: '/cours/maths/geometrie/carnet.html',
    sketch: '/cours/maths/geometrie/croquis.html'
  }
} as const;
