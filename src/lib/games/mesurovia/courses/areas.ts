import { lesson, type VillageCourses } from './types';

export const areasCourses: VillageCourses = {
  contours: [
    lesson('Le périmètre est un contour', 'Le périmètre mesure tout le tour d’une figure. Il s’exprime avec une unité de longueur.', 'Quelle unité convient pour un périmètre ?', ['m', 'm²', 'm³'], 'm', 'Un périmètre est une longueur.'),
    lesson('Je repère tous les côtés', 'Je parcours le contour sans oublier de côté et sans en compter deux fois.', 'Un rectangle possède combien de côtés ?', ['4', '2', '8'], '4', 'Un rectangle possède quatre côtés.'),
    lesson('Je calcule le périmètre', 'Pour un rectangle, je peux additionner les quatre côtés ou calculer 2 × (longueur + largeur).', 'Rectangle de 5 m sur 3 m : quel périmètre ?', ['16 m', '15 m²', '8 m'], '16 m', '2 × (5 + 3) = 16 m.'),
    lesson('Je vérifie l’unité', 'Le résultat d’un périmètre garde une unité simple, même si la figure entoure une surface.', 'Quelle écriture est correcte ?', ['P = 20 cm', 'P = 20 cm²', 'P = 20 cm³'], 'P = 20 cm', 'Le périmètre est une longueur.')
  ],
  surfaces: [
    lesson('L’aire mesure une surface', 'Une aire indique combien d’unités carrées recouvrent une surface.', 'Quelle unité convient pour le sol d’une chambre ?', ['m²', 'm', 'm³'], 'm²', 'Le sol est une surface.'),
    lesson('Je distingue côté et surface', 'Le côté se mesure en cm ou m. La surface se mesure en cm² ou m².', 'Quelle écriture désigne une aire ?', ['12 cm²', '12 cm', '12 L'], '12 cm²', 'L’exposant 2 indique une unité carrée.'),
    lesson('Je compare des surfaces', 'Pour comparer des aires, je les exprime dans la même unité carrée.', 'Avant de comparer 1 m² et 90 dm², je dois…', ['utiliser une unité commune', 'additionner', 'changer en litres'], 'utiliser une unité commune', 'Les unités doivent être compatibles.'),
    lesson('Je contrôle le résultat', 'Une aire ne peut pas être exprimée avec une unité de longueur ou de volume.', 'Quelle réponse est impossible pour une aire ?', ['8 m', '8 m²', '800 dm²'], '8 m', 'Le mètre sans exposant mesure une longueur.')
  ],
  quadrillages: [
    lesson('Un carré représente une unité', 'Dans un quadrillage, chaque petit carré vaut une unité carrée.', 'Une grille de 3 lignes et 4 colonnes contient…', ['12 carrés', '7 carrés', '24 carrés'], '12 carrés', '3 × 4 = 12.'),
    lesson('Je regroupe lignes et colonnes', 'Au lieu de compter un à un, je multiplie le nombre de lignes par le nombre de colonnes.', '5 lignes de 6 carrés donnent…', ['30 carrés', '11 carrés', '56 carrés'], '30 carrés', '5 × 6 = 30.'),
    lesson('Je traite une figure composée', 'Je peux découper une forme en rectangles, calculer chaque partie puis additionner.', 'Pour une forme en L, quelle stratégie est utile ?', ['La découper en rectangles', 'Compter seulement le contour', 'Changer en litres'], 'La découper en rectangles', 'Les aires des parties peuvent être additionnées.'),
    lesson('J’écris l’unité carrée', 'Le nombre de carrés doit être accompagné de cm², dm² ou m² selon la taille du carré unité.', 'Une grille de carrés de 1 cm de côté donne une aire en…', ['cm²', 'cm', 'm³'], 'cm²', 'Chaque carré unité mesure 1 cm².')
  ],
  figures: [
    lesson('Je choisis entre périmètre et aire', 'Le périmètre concerne le bord ; l’aire concerne l’intérieur.', 'Quelle grandeur donne la quantité de peinture pour un mur ?', ['L’aire', 'Le périmètre', 'La durée'], 'L’aire', 'La peinture recouvre une surface.'),
    lesson('Je calcule l’aire du rectangle', 'Aire = longueur × largeur. Les deux dimensions doivent utiliser la même unité.', 'Rectangle de 6 cm sur 4 cm : aire ?', ['24 cm²', '20 cm', '10 cm²'], '24 cm²', '6 × 4 = 24 cm².'),
    lesson('Je calcule l’aire du carré', 'Aire du carré = côté × côté.', 'Carré de 5 m de côté : aire ?', ['25 m²', '20 m', '10 m²'], '25 m²', '5 × 5 = 25 m².'),
    lesson('Je vérifie formule et unité', 'J’explique si j’ai calculé le tour ou la surface, puis je contrôle l’unité.', 'Pour une aire, le résultat doit contenir…', ['une unité carrée', 'une unité simple', 'une unité cubique'], 'une unité carrée', 'L’aire s’exprime au carré.')
  ]
};
