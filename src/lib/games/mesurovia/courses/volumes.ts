import { lesson, type VillageCourses } from './types';

export const volumesCourses: VillageCourses = {
  solides: [
    lesson('Je reconnais un solide', 'Un solide occupe un espace en trois dimensions : longueur, largeur et hauteur.', 'Une boîte possède combien de dimensions utiles au volume ?', ['3', '2', '1'], '3', 'Le volume dépend de trois dimensions.'),
    lesson('Je distingue aire et volume', 'L’aire mesure une surface ; le volume mesure l’espace occupé.', 'Quelle unité convient au volume d’une boîte ?', ['dm³', 'dm²', 'dm'], 'dm³', 'Une unité cubique mesure un volume.'),
    lesson('Je choisis une unité adaptée', 'Un dé peut être mesuré en cm³, une boîte en dm³ et une pièce en m³.', 'Quelle unité convient au volume d’un dé ?', ['cm³', 'm³', 'km³'], 'cm³', 'Le centimètre cube convient à un petit objet.'),
    lesson('Je garde les grandeurs séparées', 'Une surface en m² ne se convertit pas directement en volume en m³.', 'Peut-on convertir 5 m² en m³ sans autre information ?', ['Non', 'Oui', 'Toujours en multipliant par 10'], 'Non', 'Il manque une troisième dimension.')
  ],
  cubes: [
    lesson('Je lis les unités cubiques', 'Le tableau utilise trois cases par unité : m³, dm³, cm³ et mm³.', 'Combien de cases représente une unité cubique ?', ['3', '2', '1'], '3', 'Le cube agit sur trois dimensions.'),
    lesson('Je comprends le facteur 1 000', 'Comme 1 m = 10 dm sur trois dimensions, 1 m³ = 10 × 10 × 10 = 1 000 dm³.', '1 m³ vaut…', ['1 000 dm³', '100 dm³', '10 dm³'], '1 000 dm³', '10³ = 1 000.'),
    lesson('Je convertis un volume', 'Entre deux unités cubiques voisines, je multiplie ou divise par 1 000.', '2 dm³ valent…', ['2 000 cm³', '200 cm³', '20 cm³'], '2 000 cm³', '1 dm³ = 1 000 cm³.'),
    lesson('Je contrôle l’ordre de grandeur', 'Vers une unité cubique plus petite, le nombre augmente fortement.', '0,5 m³ vaut…', ['500 dm³', '50 dm³', '5 dm³'], '500 dm³', '0,5 × 1 000 = 500.')
  ],
  paves: [
    lesson('Je relève trois dimensions', 'Pour calculer un volume, je relève longueur, largeur et hauteur dans la même unité.', 'Quelle donnée manque avec longueur et largeur ?', ['La hauteur', 'Le périmètre', 'La durée'], 'La hauteur', 'Un volume utilise trois dimensions.'),
    lesson('Je calcule le volume du pavé', 'Volume = longueur × largeur × hauteur.', 'Pavé de 4 cm × 3 cm × 2 cm : volume ?', ['24 cm³', '18 cm²', '9 cm'], '24 cm³', '4 × 3 × 2 = 24 cm³.'),
    lesson('Je calcule le volume du cube', 'Pour un cube, les trois dimensions sont égales : côté × côté × côté.', 'Cube de 3 cm de côté : volume ?', ['27 cm³', '9 cm²', '12 cm'], '27 cm³', '3 × 3 × 3 = 27 cm³.'),
    lesson('Je vérifie avec des cubes unités', 'Le résultat indique combien de cubes unités remplissent le solide.', 'Un volume de 24 cm³ contient combien de cubes de 1 cm³ ?', ['24', '12', '48'], '24', 'Chaque cube unité occupe 1 cm³.')
  ],
  litres: [
    lesson('Volume et capacité sont liés', 'Le volume décrit l’espace intérieur ; la capacité décrit ce que le récipient peut contenir.', 'Un récipient de 1 dm³ contient…', ['1 L', '10 L', '1 mL'], '1 L', 'La relation de référence est 1 dm³ = 1 L.'),
    lesson('Je retiens les deux relations', '1 dm³ = 1 L et 1 cm³ = 1 mL.', '250 cm³ correspondent à…', ['250 mL', '25 mL', '2 500 mL'], '250 mL', 'Chaque centimètre cube correspond à un millilitre.'),
    lesson('Je choisis le bon tableau', 'Je convertis d’abord dans la famille de départ, puis j’utilise une relation-pont seulement si la question relie volume et capacité.', 'Pour passer de dm³ à L, j’utilise…', ['1 dm³ = 1 L', 'le facteur 60', '1 m² = 100 dm²'], '1 dm³ = 1 L', 'Cette égalité relie précisément volume et capacité.'),
    lesson('Je contrôle le contexte', 'Un litre et un décimètre cube représentent la même quantité, mais les mots volume et capacité ne décrivent pas exactement la même idée.', 'Une boîte de 2 dm³ peut contenir…', ['2 L', '200 L', '2 mL'], '2 L', '2 dm³ = 2 L.')
  ]
};
