export const PER_MSN24_URL = 'https://bdper.plandetudes.ch/uploads/per_pdf/Mathematiques_et_sciences_de_la_nature/Mathematiques/PER_print_MSN_24.pdf';

export type MeasureFamily = 'length' | 'capacity' | 'mass' | 'duration' | 'area' | 'volume';
export type Belt = 'blanche' | 'jaune' | 'verte' | 'bleue' | 'noire';

export type PerMeasureLink = { label: string; progression: string };
export type HouseCurriculumEntry = {
  title: string; code: string; belts: Belt[]; objective: string; success: string[];
  families: MeasureFamily[]; per: PerMeasureLink;
};
export type VillageCurriculumEntry = {
  name: string; subtitle: string; level: string; belts: Belt[]; code: string;
  objective: string; priorities: string[]; story: string; palette: string[];
};

export const perMeasureLinks: Record<string, PerMeasureLink> = {
  foundations: { label: 'MSN 24 · comparer des grandeurs et choisir une unité conventionnelle', progression: 'Distinguer les grandeurs, estimer une mesure et choisir une unité adaptée.' },
  conversions: { label: 'MSN 24 · exprimer une même grandeur dans différentes unités', progression: 'Longueurs, capacités et masses utilisent les unités décimales ; les durées utilisent les relations 60, 24 et 7.' },
  lengths: { label: 'MSN 24 · longueurs : mm, cm, dm, m et km', progression: 'Mesurer, comparer, ordonner et exprimer une longueur dans différentes unités.' },
  capacities: { label: 'MSN 24 · capacités : L et dL', progression: 'Comparer des capacités et exprimer une même capacité dans différentes unités ; Mesurovia explicite les unités intermédiaires.' },
  masses: { label: 'MSN 24 · masses : kg et g', progression: 'Comparer des masses et exprimer une même masse dans différentes unités ; Mesurovia utilise les colonnes intermédiaires.' },
  durations: { label: 'MSN 24 · durées : h↔min et min↔s', progression: 'Comparer et calculer des durées avec les relations 60, 24, 7 et le calendrier.' },
  perimeter: { label: 'MSN 24 · calcul de longueurs et de périmètres', progression: 'Distinguer longueur et périmètre, puis calculer le périmètre de figures simples.' },
  areas: { label: 'MSN 24 · aires : cm², dm² et m²', progression: 'Comparer, mesurer et calculer l’aire du carré et du rectangle.' },
  volumes: { label: 'MSN 24 · volumes : cm³, dm³ et m³', progression: 'Comparer et calculer le volume du cube et du pavé droit.' },
  problems: { label: 'MSN 24 · résoudre des problèmes de mesure', progression: 'Choisir une stratégie, convertir si nécessaire, calculer et contrôler la vraisemblance.' }
};

export const villageCurriculum: Record<string, VillageCurriculumEntry> = {
  'fondations-mesure': {
    name: 'Les Fondations de la mesure', subtitle: 'Le village où chaque grandeur trouve son unité', level: '7H', belts: ['blanche'],
    code: '7H / Grandeurs et mesures / Ceinture blanche', objective: 'Distinguer les grandeurs, choisir une unité adaptée, mesurer et estimer.',
    priorities: ['Grandeur et unité', 'Repères concrets', 'Longueurs', 'Mesures réelles'],
    story: 'Les enseignes du village ont perdu leurs unités. Aide les habitants à reconnaître ce qu’ils mesurent et à choisir des repères fiables.', palette: ['#d7e7b7', '#659765', '#e5b764']
  },
  'royaume-conversions': {
    name: 'Le Royaume des conversions', subtitle: 'Les quatre ateliers du tableau', level: '7H', belts: ['blanche', 'bleue', 'noire'],
    code: '7H / Grandeurs et mesures / Ceintures blanche, bleue et noire', objective: 'Placer les chiffres dans le bon tableau et lire une mesure dans une autre unité.',
    priorities: ['Longueurs', 'Capacités', 'Masses', 'Durées non décimales'],
    story: 'Quatre ateliers ont mélangé leurs colonnes. Remets les chiffres, les virgules et les unités à leur juste place.', palette: ['#cae4af', '#4f9678', '#dfa85f']
  },
  'aires-perimetres': {
    name: 'La Cité des aires et périmètres', subtitle: 'Des contours aux surfaces', level: '7H–8H', belts: ['jaune', 'verte'],
    code: '7H–8H / Grandeurs et mesures / Ceintures jaune et verte', objective: 'Distinguer longueur, périmètre et aire, puis calculer des surfaces simples.',
    priorities: ['Périmètres', 'Unités carrées', 'Quadrillages', 'Carrés et rectangles'],
    story: 'Les architectes confondent le bord des jardins et la surface à paver. Aide-les à mesurer ce qui entoure et ce qui recouvre.', palette: ['#c5e5db', '#4a9ba0', '#e2b875']
  },
  'volumes-capacites': {
    name: 'Les Ateliers des volumes', subtitle: 'Des cubes, des pavés et des litres', level: '8H', belts: ['verte', 'bleue'],
    code: '8H / Grandeurs et mesures / Ceintures verte et bleue', objective: 'Distinguer volume et capacité, puis calculer le volume de solides simples.',
    priorities: ['Solides', 'Unités cubiques', 'Pavés droits', 'Lien L et dm³'],
    story: 'Les artisans savent construire des caisses, mais ils ne savent plus combien elles peuvent contenir. Explore les solides et leurs unités.', palette: ['#c4dce9', '#5d88ad', '#d4a96e']
  },
  'missions-maitrise': {
    name: 'Les Expéditions de maîtrise', subtitle: 'Le village des stratégies et des preuves', level: '8H', belts: ['jaune', 'bleue', 'noire'],
    code: '8H / Grandeurs et mesures / Ceintures jaune, bleue et noire', objective: 'Résoudre, expliquer et contrôler des problèmes de mesure à plusieurs étapes.',
    priorities: ['Masses avancées', 'Aires et hectare', 'Durées et calendrier', 'Enquêtes de mesure'],
    story: 'Les expéditions partent demain. Chaque chargement, chaque durée et chaque surface doit être vérifié et justifié.', palette: ['#bcded8', '#4f877d', '#d6a451']
  }
};

const h = (title: string, code: string, belts: Belt[], objective: string, success: string[], families: MeasureFamily[], per: PerMeasureLink): HouseCurriculumEntry => ({ title, code, belts, objective, success, families, per });

export const houseCurriculum: Record<string, Record<string, HouseCurriculumEntry>> = {
  'fondations-mesure': {
    grandeurs: h('La Maison des grandeurs', '7H / Grandeurs et mesures / Ceinture blanche', ['blanche'], 'Distinguer longueur, masse, capacité, durée, aire et volume.', ['Je nomme la grandeur mesurée.', 'Je ne confonds pas l’objet avec son unité.', 'Je choisis la bonne famille d’unités.'], ['length', 'mass', 'capacity', 'duration', 'area', 'volume'], perMeasureLinks.foundations),
    reperes: h('L’Atelier des repères', '7H / Grandeurs et mesures / Ceinture blanche', ['blanche'], 'Choisir une unité adaptée et estimer une mesure vraisemblable.', ['Je choisis une unité adaptée.', 'Je donne un ordre de grandeur.', 'Je repère une mesure impossible.'], ['length', 'mass', 'capacity', 'duration'], perMeasureLinks.foundations),
    longueurs: h('Le Sentier des longueurs', '7H / Grandeurs et mesures / Ceinture blanche', ['blanche'], 'Mesurer, comparer et ordonner des longueurs en mm, cm, dm, m et km.', ['Je mesure avec le bon instrument.', 'Je compare dans une unité commune.', 'J’écris toujours l’unité.'], ['length'], perMeasureLinks.lengths),
    mesures: h('Le Laboratoire des mesures', '7H / Grandeurs et mesures / Ceinture blanche', ['blanche'], 'Estimer puis vérifier une mesure réelle avec un instrument.', ['J’estime avant de mesurer.', 'Je lis correctement l’instrument.', 'Je compare estimation et mesure.'], ['length', 'mass', 'capacity', 'duration'], perMeasureLinks.foundations)
  },
  'royaume-conversions': {
    'table-longueurs': h('L’Atelier des longueurs', '7H / Grandeurs et mesures / Ceinture blanche', ['blanche'], 'Utiliser le tableau pour convertir km, hm, dam, m, dm, cm et mm.', ['Je place le chiffre des unités au bon endroit.', 'Je place la virgule.', 'Je complète seulement les cases nécessaires.'], ['length'], perMeasureLinks.lengths),
    'table-capacites': h('La Maison des capacités', '7H / Grandeurs et mesures / Ceinture bleue', ['bleue'], 'Convertir kL, hL, daL, L, dL, cL et mL sans changer la capacité.', ['Je reconnais une capacité.', 'Je place les chiffres dans le tableau des capacités.', 'Je contrôle la taille du résultat.'], ['capacity'], perMeasureLinks.capacities),
    'table-masses': h('La Halle des masses', '7H / Grandeurs et mesures / Ceinture noire', ['noire'], 'Convertir kg, hg, dag, g, dg, cg et mg avec toutes les colonnes intermédiaires.', ['Je reconnais une masse.', 'J’utilise toutes les colonnes intermédiaires.', 'Je contrôle la vraisemblance.'], ['mass'], perMeasureLinks.masses),
    'table-durees': h('L’Horloge des durées', '7H / Grandeurs et mesures / Ceinture noire', ['noire'], 'Convertir h, min et s avec les relations de 60, sans tableau décimal.', ['Je sais que 1 h = 60 min.', 'Je sais que 1 min = 60 s.', 'Je recompose la durée pour vérifier.'], ['duration'], perMeasureLinks.durations)
  },
  'aires-perimetres': {
    contours: h('La Maison des contours', '7H–8H / Grandeurs et mesures / Ceinture verte', ['verte'], 'Distinguer une longueur d’un périmètre et calculer le tour d’une figure.', ['Je repère tous les côtés.', 'J’additionne des longueurs compatibles.', 'J’écris une unité de longueur.'], ['length'], perMeasureLinks.perimeter),
    surfaces: h('La Cour des surfaces', '7H–8H / Grandeurs et mesures / Ceinture jaune', ['jaune'], 'Comprendre qu’une aire mesure une surface en unités carrées.', ['Je distingue m et m².', 'Je choisis une unité carrée.', 'Je compare des surfaces.'], ['area'], perMeasureLinks.areas),
    quadrillages: h('L’Atelier des quadrillages', '7H–8H / Grandeurs et mesures / Ceinture jaune', ['jaune'], 'Calculer une aire en comptant ou en regroupant des carrés-unités.', ['Je compte chaque carré une seule fois.', 'Je peux regrouper lignes et colonnes.', 'J’écris l’unité carrée.'], ['area'], perMeasureLinks.areas),
    figures: h('Le Chantier des figures', '7H–8H / Grandeurs et mesures / Ceintures jaune et verte', ['jaune', 'verte'], 'Calculer le périmètre et l’aire d’un carré ou d’un rectangle.', ['Je choisis la bonne formule.', 'Je distingue unités simples et carrées.', 'Je vérifie avec un dessin.'], ['length', 'area'], perMeasureLinks.areas)
  },
  'volumes-capacites': {
    solides: h('La Maison des solides', '8H / Grandeurs et mesures / Ceinture verte', ['verte'], 'Distinguer longueur, aire et volume dans une situation concrète.', ['Je reconnais un solide.', 'Je choisis une unité cubique.', 'Je distingue surface et espace occupé.'], ['area', 'volume'], perMeasureLinks.volumes),
    cubes: h('L’Atelier des cubes', '8H / Grandeurs et mesures / Ceinture verte', ['verte'], 'Comprendre et convertir les unités cm³, dm³ et m³.', ['Je sais qu’un changement voisin vaut ×1 000.', 'Je place trois chiffres par unité.', 'Je vérifie l’ordre de grandeur.'], ['volume'], perMeasureLinks.volumes),
    paves: h('Le Chantier des pavés', '8H / Grandeurs et mesures / Ceinture verte', ['verte'], 'Calculer le volume d’un cube ou d’un pavé droit.', ['Je relève trois dimensions.', 'Je calcule longueur × largeur × hauteur.', 'J’écris une unité cubique.'], ['volume'], perMeasureLinks.volumes),
    litres: h('Le Laboratoire des litres', '8H / Grandeurs et mesures / Ceinture bleue', ['bleue'], 'Relier volume et capacité avec 1 dm³ = 1 L et 1 cm³ = 1 mL.', ['Je distingue volume et capacité.', 'J’utilise les deux relations de référence.', 'Je ne mélange pas les tableaux.'], ['volume', 'capacity'], perMeasureLinks.volumes)
  },
  'missions-maitrise': {
    masses: h('L’Expédition des masses', '8H / Grandeurs et mesures / Ceinture bleue', ['bleue'], 'Comparer et convertir des masses avec toutes les unités intermédiaires.', ['Je mets les masses dans une unité commune.', 'J’utilise kg à mg.', 'Je justifie le facteur choisi.'], ['mass'], perMeasureLinks.masses),
    aires: h('L’Expédition des terrains', '8H / Grandeurs et mesures / Ceintures jaune et bleue', ['jaune', 'bleue'], 'Convertir les aires avec km², hm², ha, dam², a, m², dm², cm² et mm².', ['Je garde deux cases par unité.', 'Je place ha sous hm² et a sous dam².', 'Je contrôle le facteur 100.'], ['area'], perMeasureLinks.areas),
    durees: h('L’Expédition du calendrier', '8H / Grandeurs et mesures / Ceinture noire', ['noire'], 'Résoudre des problèmes avec h, min, s, jours, semaines, mois et années.', ['J’utilise 60, 24 et 7.', 'Je consulte le calendrier pour les mois.', 'Je distingue durée et date.'], ['duration'], perMeasureLinks.durations),
    enquetes: h('Le Bureau des enquêtes', '8H / Grandeurs et mesures / Ceintures blanche à noire', ['blanche', 'jaune', 'verte', 'bleue', 'noire'], 'Résoudre un problème à plusieurs étapes, expliquer et contrôler la réponse.', ['Je repère la grandeur demandée.', 'Je choisis une stratégie.', 'Je contrôle unité et vraisemblance.'], ['length', 'mass', 'capacity', 'duration', 'area', 'volume'], perMeasureLinks.problems)
  }
};

export const villagePerLinks: Record<string, PerMeasureLink> = Object.fromEntries(Object.keys(villageCurriculum).map((id) => [id, id === 'royaume-conversions' ? perMeasureLinks.conversions : id === 'aires-perimetres' ? perMeasureLinks.areas : id === 'volumes-capacites' ? perMeasureLinks.volumes : id === 'missions-maitrise' ? perMeasureLinks.problems : perMeasureLinks.foundations]));
export const housePerLinks: Record<string, Record<string, PerMeasureLink>> = Object.fromEntries(Object.entries(houseCurriculum).map(([villageId, houses]) => [villageId, Object.fromEntries(Object.entries(houses).map(([houseId, house]) => [houseId, house.per]))]));
