import { lesson, type VillageCourses } from './types';
import { getConversionFamily } from '../conversion-table';

const orderFor = (family: string) => getConversionFamily(family).units.map((unit) => unit.alias ? `${unit.label} (${unit.alias})` : unit.label).join(' | ');

const tableCourse = (name: string, order: string, example: string, question: string, options: string[], answer: string, explanation: string): ReturnType<typeof lesson>[] => [
  lesson(`Je lis le tableau des ${name}`, `L’ordre du tableau est ${order}. La plus grande unité est à gauche et la plus petite à droite.`, question, options, answer, explanation, 'TABLE'),
  lesson('Je place le chiffre des unités', 'Le chiffre des unités du nombre se place dans la colonne de l’unité de départ. Les autres chiffres se placent un par un autour de lui.', `Dans ${example}, où placer le chiffre des unités ?`, ['Dans l’unité de départ', 'Dans l’unité d’arrivée', 'Toujours à droite'], 'Dans l’unité de départ', 'Le tableau est ancré sur l’unité donnée.', 'TABLE_EXAMPLE'),
  lesson(`Je complète le tableau des ${name}`, `Dans le tableau des ${name}, je complète seulement les cases nécessaires jusqu’à l’unité d’arrivée, puis je place la virgule finale juste après cette unité.`, `Dans le tableau des ${name}, une case vide nécessaire à la lecture reçoit…`, ['un zéro', 'un point', 'deux chiffres'], 'un zéro', 'Le zéro occupe une position sans changer la mesure.', 'TABLE_EXAMPLE'),
  lesson(`Je vérifie une conversion de ${name}`, `Pour les ${name}, aller vers une unité plus petite fait augmenter le nombre ; aller vers une unité plus grande le fait diminuer. La mesure réelle ne change jamais.`, `Quel contrôle convient aux ${name} ?`, ['Le sens du nombre et l’unité', 'Le nombre seul', 'La couleur du tableau'], 'Le sens du nombre et l’unité', 'On vérifie toujours le nombre avec son unité.', 'TABLE')
];

export const conversionsCourses: VillageCourses = {
  'table-longueurs': tableCourse('longueurs', orderFor('length'), '2,4 m', 'Quelle unité est juste à droite de m ?', ['dm', 'dam', 'cm'], 'dm', 'Le décimètre est dix fois plus petit que le mètre.'),
  'table-capacites': tableCourse('capacités', orderFor('capacity'), '1,5 L', 'Quelle unité est juste à droite de L ?', ['dL', 'daL', 'mL'], 'dL', 'Le décilitre est dix fois plus petit que le litre.'),
  'table-masses': tableCourse('masses', orderFor('mass'), '2,4 kg', 'Quelle unité est entre kg et dag ?', ['hg', 'g', 'mg'], 'hg', 'L’hectogramme est la colonne intermédiaire entre kg et dag.'),
  'table-durees': [
    lesson('Les durées ne sont pas décimales', 'Le tableau par 10 ne convient pas au temps : 1 minute vaut 60 secondes et 1 heure vaut 60 minutes.', '1 heure vaut…', ['60 min', '100 min', '10 min'], '60 min', 'Les heures sont groupées par 60 minutes.'),
    lesson('Je décompose une durée', 'Pour 2 h 15 min, je transforme 2 h en 120 min puis j’ajoute 15 min.', '2 h 15 min vaut…', ['135 min', '215 min', '125 min'], '135 min', '120 + 15 = 135 minutes.'),
    lesson('Je transforme une écriture décimale', 'Dans 1,5 h, la partie 0,5 h représente une demi-heure, donc 30 minutes.', '1,5 h vaut…', ['90 min', '150 min', '1 h 5 min'], '90 min', '60 minutes + 30 minutes = 90 minutes.'),
    lesson('Je recompose pour vérifier', 'Après une conversion, je peux regrouper les minutes par paquets de 60 pour retrouver les heures.', '150 min correspond à…', ['2 h 30 min', '1 h 50 min', '15 h'], '2 h 30 min', 'Deux paquets de 60 font 120 minutes, il reste 30 minutes.')
  ]
};
