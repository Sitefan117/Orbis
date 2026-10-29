import { lesson, type VillageCourses } from './types';

export const masteryCourses: VillageCourses = {
  masses: [
    lesson('Je lis toutes les colonnes', 'Le tableau des masses est kg | hg | dag | g | dg | cg | mg. Chaque unité intermédiaire garde sa propre colonne.', 'Quelle unité se trouve entre kg et dag ?', ['hg', 'g', 'mg'], 'hg', 'L’hectogramme est la colonne intermédiaire.'),
    lesson('Je compare dans une unité commune', 'Avant de comparer, je convertis les masses dans la même unité.', 'Pour comparer 1,2 kg et 950 g, quelle unité commune est pratique ?', ['g', 'L', 'm'], 'g', '1,2 kg peut être écrit 1 200 g.'),
    lesson('Je justifie mon facteur', 'Chaque colonne voisine change par 10. Trois colonnes correspondent donc à un facteur 1 000.', '2,4 kg valent…', ['2 400 g', '240 g', '24 g'], '2 400 g', 'kg → hg → dag → g : trois déplacements.'),
    lesson('Je contrôle la vraisemblance', 'Je compare le résultat à une masse réelle et je vérifie le sens du changement d’unité.', 'Une pomme pèse plutôt…', ['150 g', '150 kg', '150 mg'], '150 g', 'Quelques centaines de grammes sont plausibles.')
  ],
  aires: [
    lesson('Je garde deux cases par unité', 'Chaque unité d’aire occupe deux positions car le facteur entre unités voisines est 100.', 'Entre m² et dm², le facteur est…', ['100', '10', '1 000'], '100', '10 × 10 = 100.'),
    lesson('Je place hectare et are', '1 ha = 1 hm² et 1 a = 1 dam². Ces noms apparaissent sur une deuxième ligne du même tableau.', '1 ha vaut…', ['10 000 m²', '1 000 m²', '100 m²'], '10 000 m²', '1 hm² = 100 m × 100 m = 10 000 m².'),
    lesson('Je convertis sans sauter les colonnes', 'Le tableau complet est km² | hm²/ha | dam²/a | m² | dm² | cm² | mm².', 'Quelle unité se trouve entre ha et m² ?', ['a', 'cm²', 'km²'], 'a', 'L’are correspond à dam².'),
    lesson('Je vérifie le sens', 'Vers une unité d’aire plus petite, le nombre augmente par facteurs 100.', '2 m² valent…', ['20 000 cm²', '200 cm²', '20 cm²'], '20 000 cm²', 'm² → dm² → cm² : ×100 puis ×100.')
  ],
  durees: [
    lesson('Je choisis la bonne relation', 'Les durées utilisent 60, 24 et 7. Les mois utilisent le calendrier.', '1 semaine vaut…', ['7 jours', '10 jours', '24 jours'], '7 jours', 'Une semaine contient sept jours.'),
    lesson('Je calcule avec heures et minutes', 'Je transforme les heures en minutes puis j’ajoute les minutes restantes.', '2 h 35 min valent…', ['155 min', '235 min', '125 min'], '155 min', '2 × 60 + 35 = 155.'),
    lesson('Je distingue mois et durée fixe', 'Un mois peut compter 28, 29, 30 ou 31 jours. Pour passer des mois aux jours, il faut connaître les dates.', 'Peut-on toujours dire 1 mois = 30 jours ?', ['Non', 'Oui', 'Seulement en secondes'], 'Non', 'La durée d’un mois dépend du calendrier.'),
    lesson('Je vérifie une date', 'Pour un problème de calendrier, je compte les jours réels et j’identifie les dates de départ et d’arrivée.', 'Du 28 février au 1er mars, faut-il connaître l’année ?', ['Oui', 'Non', 'Jamais'], 'Oui', 'Février peut avoir 28 ou 29 jours.')
  ],
  enquetes: [
    lesson('Je lis toute la situation', 'Je repère la grandeur demandée, les données utiles et l’unité attendue avant de calculer.', 'Quelle est la première étape ?', ['Repérer ce qui est demandé', 'Multiplier tous les nombres', 'Supprimer les unités'], 'Repérer ce qui est demandé', 'La stratégie dépend de la question.'),
    lesson('Je rends les unités compatibles', 'J’additionne ou compare seulement des mesures de même grandeur exprimées dans une unité compatible.', 'Peut-on additionner directement 2 m et 30 cm ?', ['Non, il faut une unité commune', 'Oui, cela fait 32', 'Non, ce sont deux masses'], 'Non, il faut une unité commune', '2 m peut être converti en 200 cm.'),
    lesson('J’explique ma démarche', 'Une solution complète montre la conversion, le calcul et l’unité finale.', 'Quelle réponse est la plus complète ?', ['2 m = 200 cm ; 200 + 30 = 230 cm', '230', '2 + 30'], '2 m = 200 cm ; 200 + 30 = 230 cm', 'La conversion et l’unité rendent la démarche vérifiable.'),
    lesson('Je contrôle le résultat', 'Je vérifie l’ordre de grandeur, le sens de la conversion et, si possible, l’opération inverse.', 'Après une conversion m → cm, le nombre doit généralement…', ['augmenter', 'diminuer', 'rester sans unité'], 'augmenter', 'Le centimètre est plus petit : il en faut davantage pour la même longueur.')
  ]
};
