import { lesson, type VillageCourses } from './types';

export const fondationsCourses: VillageCourses = {
  grandeurs: [
    lesson('Je reconnais ce que je mesure', 'Une longueur décrit une distance. Une masse indique ce qui est pesé. Une capacité décrit ce qu’un récipient peut contenir. Une durée mesure le temps.', 'Une bouteille contient 1,5 L. Quelle grandeur est mesurée ?', ['Une capacité', 'Une masse', 'Une longueur'], 'Une capacité', 'Le litre est une unité de capacité.'),
    lesson('Je distingue surface et espace occupé', 'Une aire mesure une surface en unités carrées. Un volume mesure l’espace occupé par un solide en unités cubiques.', 'Quelle grandeur s’écrit en cm³ ?', ['Une longueur', 'Une aire', 'Un volume'], 'Un volume', 'L’exposant 3 indique une unité cubique, donc un volume.'),
    lesson('Je relie grandeur et unité', 'Chaque grandeur possède sa famille d’unités. On ne compare pas directement des mètres avec des kilogrammes.', 'Quelle association est correcte ?', ['masse — kg', 'durée — cm', 'aire — L'], 'masse — kg', 'Le kilogramme mesure une masse.'),
    lesson('Je vérifie le sens', 'Avant tout calcul, je nomme la grandeur et l’unité demandées. Cette étape évite de mélanger les familles.', 'Pour mesurer le temps d’un trajet, je choisis…', ['une durée', 'une capacité', 'une aire'], 'une durée', 'Le temps écoulé est une durée.')
  ],
  reperes: [
    lesson('Je choisis une unité adaptée', 'Une fourmi se mesure en millimètres, une porte en mètres et un trajet entre villes en kilomètres.', 'Quelle unité convient pour la hauteur d’une porte ?', ['m', 'mm', 'km'], 'm', 'Une porte mesure environ deux mètres.'),
    lesson('J’utilise des repères', 'Un crayon mesure environ 15 cm, une bouteille contient environ 1 L et un sac d’école pèse quelques kilogrammes.', 'Quelle masse est plausible pour un sac d’école ?', ['4 kg', '4 g', '4 mg'], '4 kg', 'Quelques kilogrammes sont plausibles pour un sac.'),
    lesson('J’estime avant de calculer', 'Une estimation donne une zone attendue. Elle permet de repérer un zéro de trop ou une unité impossible.', 'Une table mesure plutôt…', ['2 m', '2 mm', '2 km'], '2 m', 'Deux mètres est un ordre de grandeur cohérent.'),
    lesson('Je contrôle la vraisemblance', 'Je relis le nombre et l’unité ensemble. Un nombre correct avec une unité absurde reste une mauvaise réponse.', 'Quelle capacité convient pour un verre ?', ['2 dL', '2 kL', '2 m³'], '2 dL', 'Un verre contient quelques décilitres.')
  ],
  longueurs: [
    lesson('Je mesure une longueur', 'Je place le zéro de la règle au début de l’objet, je lis la graduation à la fin et j’écris l’unité.', 'Où placer le zéro de la règle ?', ['Au début de l’objet', 'Au milieu', 'Après l’objet'], 'Au début de l’objet', 'La mesure commence au zéro de l’instrument.'),
    lesson('Je compare dans la même unité', 'Pour comparer deux longueurs écrites dans des unités différentes, je les exprime d’abord dans une unité commune.', 'Pour comparer 1 m et 95 cm, quelle étape est utile ?', ['Convertir dans la même unité', 'Additionner', 'Changer de grandeur'], 'Convertir dans la même unité', '1 m peut être écrit 100 cm.'),
    lesson('J’ordonne les longueurs', 'Une fois les unités identiques, je compare les nombres puis je range du plus petit au plus grand.', 'Quelle longueur est la plus grande ?', ['120 cm', '1 m', '9 dm'], '120 cm', '120 cm est supérieur à 100 cm et à 90 cm.'),
    lesson('Je garde l’unité', 'Une réponse de mesure comporte toujours un nombre et une unité.', 'Quelle réponse est complète ?', ['35 cm', '35', 'cm'], '35 cm', 'Le nombre et l’unité sont nécessaires.')
  ],
  mesures: [
    lesson('J’estime avant de mesurer', 'Je donne d’abord une valeur approximative à partir d’un repère connu.', 'Avant de mesurer une table, je dois d’abord…', ['estimer sa longueur', 'changer son unité', 'calculer son aire'], 'estimer sa longueur', 'L’estimation permet ensuite de contrôler la mesure.'),
    lesson('Je choisis un instrument', 'La règle mesure de petits objets, le mètre mesure des objets plus grands, la balance mesure une masse et un récipient gradué mesure une capacité.', 'Quel instrument mesure une masse ?', ['Une balance', 'Une règle', 'Une horloge'], 'Une balance', 'La balance sert à peser.'),
    lesson('Je lis une graduation', 'Je repère la valeur d’une grande graduation puis le nombre de petites divisions entre deux valeurs.', 'Une graduation partage 1 cm en 10 parties. Une partie vaut…', ['1 mm', '1 dm', '10 cm'], '1 mm', 'Un centimètre contient dix millimètres.'),
    lesson('Je compare estimation et mesure', 'Si la mesure est très éloignée de l’estimation, je vérifie le zéro, la graduation et l’unité.', 'Une porte mesurée à 2 mm indique probablement…', ['une erreur de mesure', 'une mesure plausible', 'une aire'], 'une erreur de mesure', 'Une porte mesure environ deux mètres, pas deux millimètres.')
  ]
};
