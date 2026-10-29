import type { MesuroviaEngineApiV3 } from './engine-v3-adapter';

type Template = { family: string; prompt: string; options: string[]; answer: string; explain: string };

const q = (family: string, prompt: string, options: string[], answer: string, explain: string): Template => ({ family, prompt, options, answer, explain });

const BANKS: Record<string, Template[]> = {
  grandeurs: [
    q('length', 'Une distance entre deux villages mesure quelle grandeur ?', ['Une longueur', 'Une masse', 'Une capacité', 'Une aire'], 'Une longueur', 'Une distance est une longueur.'),
    q('mass', 'La quantité indiquée par une balance est…', ['une masse', 'une durée', 'une aire', 'un volume'], 'une masse', 'Une balance sert à mesurer une masse.'),
    q('capacity', 'Ce qu’une bouteille peut contenir est…', ['une capacité', 'un périmètre', 'une longueur', 'une durée'], 'une capacité', 'La capacité décrit ce qu’un récipient peut contenir.'),
    q('area', 'La surface d’un sol est…', ['une aire', 'un volume', 'une durée', 'une masse'], 'une aire', 'Une aire mesure une surface.'),
    q('volume', 'L’espace occupé par une boîte est…', ['un volume', 'une aire', 'une longueur', 'une capacité uniquement'], 'un volume', 'Un volume mesure l’espace occupé par un solide.'),
    q('duration', 'Le temps écoulé pendant une course est…', ['une durée', 'une masse', 'une aire', 'une capacité'], 'une durée', 'Le temps écoulé est une durée.')
  ],
  reperes: [
    q('length', 'Quelle longueur est plausible pour une porte ?', ['2 m', '2 mm', '2 km', '2 cm'], '2 m', 'Une porte mesure environ deux mètres.'),
    q('mass', 'Quelle masse est plausible pour un cartable rempli ?', ['4 kg', '4 mg', '4 g', '400 kg'], '4 kg', 'Un cartable rempli pèse quelques kilogrammes.'),
    q('capacity', 'Quelle capacité est plausible pour un verre ?', ['2 dL', '2 kL', '2 m³', '2 mg'], '2 dL', 'Un verre contient quelques décilitres.'),
    q('duration', 'Quelle durée est plausible pour un film ?', ['90 min', '90 s', '90 jours', '90 semaines'], '90 min', 'Un film dure généralement autour d’une heure et demie.')
  ],
  mesures: [
    q('length', 'Quel instrument convient pour mesurer une table ?', ['Un mètre', 'Une balance', 'Une horloge', 'Un verre gradué'], 'Un mètre', 'Le mètre permet de mesurer un objet assez grand.'),
    q('mass', 'Quel instrument convient pour mesurer la masse d’un fruit ?', ['Une balance', 'Une règle', 'Un chronomètre', 'Un rapporteur'], 'Une balance', 'Une balance mesure une masse.'),
    q('capacity', 'Quel instrument convient pour mesurer 500 mL ?', ['Un récipient gradué', 'Une règle', 'Une balance', 'Une boussole'], 'Un récipient gradué', 'Les graduations permettent de lire une capacité.'),
    q('length', 'Une porte mesurée à 2 mm indique probablement…', ['une erreur de mesure', 'une mesure plausible', 'une aire', 'un volume'], 'une erreur de mesure', 'Une porte mesure environ deux mètres.')
  ],
  contours: [
    q('length', 'Un rectangle mesure 5 m sur 3 m. Quel est son périmètre ?', ['16 m', '15 m²', '8 m', '25 m'], '16 m', '2 × (5 + 3) = 16 m.'),
    q('length', 'Un carré a un côté de 4 cm. Quel est son périmètre ?', ['16 cm', '16 cm²', '8 cm', '12 cm²'], '16 cm', '4 côtés × 4 cm = 16 cm.'),
    q('length', 'Quelle unité convient pour un périmètre ?', ['cm', 'cm²', 'cm³', 'L'], 'cm', 'Un périmètre est une longueur.'),
    q('length', 'Pour clôturer un jardin, quelle grandeur faut-il calculer ?', ['Le périmètre', 'L’aire', 'Le volume', 'La capacité'], 'Le périmètre', 'La clôture suit le contour du jardin.')
  ],
  surfaces: [
    q('area', 'Quelle unité convient pour l’aire d’une chambre ?', ['m²', 'm', 'm³', 'L'], 'm²', 'Une chambre est une surface mesurée en mètres carrés.'),
    q('area', 'Quelle écriture désigne une aire ?', ['12 cm²', '12 cm', '12 cm³', '12 mL'], '12 cm²', 'L’exposant 2 indique une aire.'),
    q('area', 'La peinture nécessaire pour un mur dépend surtout de…', ['son aire', 'son périmètre uniquement', 'son volume', 'sa durée'], 'son aire', 'La peinture recouvre une surface.'),
    q('area', 'Peut-on additionner directement 2 m² et 30 cm² ?', ['Non, il faut une unité commune', 'Oui, cela donne 32 m²', 'Non, ce sont des volumes', 'Oui, cela donne 230'], 'Non, il faut une unité commune', 'Les deux aires doivent être exprimées dans la même unité.')
  ],
  quadrillages: [
    q('area', 'Une grille a 3 lignes de 4 carrés. Quelle est son aire ?', ['12 unités²', '7 unités²', '14 unités²', '24 unités²'], '12 unités²', '3 × 4 = 12 carrés-unités.'),
    q('area', 'Une grille a 5 lignes de 6 carrés de 1 cm². Quelle est son aire ?', ['30 cm²', '11 cm²', '30 cm', '60 cm²'], '30 cm²', '5 × 6 = 30 cm².'),
    q('area', 'Pour mesurer l’aire d’une forme en L, je peux…', ['la découper en rectangles', 'compter seulement le bord', 'changer en litres', 'mesurer le temps'], 'la découper en rectangles', 'Les aires des rectangles peuvent être additionnées.'),
    q('area', 'Chaque petit carré vaut 1 dm². Une figure en couvre 18. Son aire est…', ['18 dm²', '18 dm', '18 dm³', '180 dm²'], '18 dm²', 'On compte 18 carrés de 1 dm².')
  ],
  figures: [
    q('area', 'Rectangle de 6 cm sur 4 cm : quelle aire ?', ['24 cm²', '20 cm', '10 cm²', '24 cm'], '24 cm²', 'Aire = 6 × 4 = 24 cm².'),
    q('area', 'Carré de 5 m de côté : quelle aire ?', ['25 m²', '20 m', '10 m²', '25 m'], '25 m²', 'Aire = 5 × 5 = 25 m².'),
    q('length', 'Rectangle de 6 cm sur 4 cm : quel périmètre ?', ['20 cm', '24 cm²', '10 cm', '20 cm²'], '20 cm', 'Périmètre = 2 × (6 + 4) = 20 cm.'),
    q('area', 'Pour carreler un sol, je calcule…', ['l’aire', 'le périmètre uniquement', 'le volume', 'la durée'], 'l’aire', 'Le carrelage recouvre la surface du sol.')
  ],
  solides: [
    q('volume', 'Quelle unité convient pour le volume d’une boîte ?', ['dm³', 'dm²', 'dm', 'dL²'], 'dm³', 'Un volume s’exprime avec une unité cubique.'),
    q('area', 'Quelle unité convient pour la surface extérieure d’une boîte ?', ['dm²', 'dm³', 'dm', 'L'], 'dm²', 'Une surface s’exprime avec une unité carrée.'),
    q('volume', 'Peut-on convertir 5 m² en m³ sans autre information ?', ['Non', 'Oui', 'Toujours en multipliant par 10', 'Toujours en divisant par 10'], 'Non', 'Une troisième dimension est nécessaire.'),
    q('volume', 'Le volume d’un petit dé se mesure plutôt en…', ['cm³', 'm³', 'km³', 'cm²'], 'cm³', 'Le centimètre cube convient à un petit objet.')
  ],
  paves: [
    q('volume', 'Pavé de 4 cm × 3 cm × 2 cm : quel volume ?', ['24 cm³', '18 cm²', '9 cm', '24 cm²'], '24 cm³', '4 × 3 × 2 = 24 cm³.'),
    q('volume', 'Cube de 3 cm de côté : quel volume ?', ['27 cm³', '9 cm²', '12 cm', '18 cm³'], '27 cm³', '3 × 3 × 3 = 27 cm³.'),
    q('volume', 'Quelles dimensions faut-il pour calculer un pavé droit ?', ['longueur, largeur et hauteur', 'longueur et largeur seulement', 'périmètre et aire', 'masse et durée'], 'longueur, largeur et hauteur', 'Le volume utilise trois dimensions.'),
    q('volume', 'Un pavé de 5 dm × 2 dm × 3 dm a un volume de…', ['30 dm³', '10 dm²', '30 dm²', '15 dm³'], '30 dm³', '5 × 2 × 3 = 30 dm³.')
  ],
  litres: [
    q('volume', '1 dm³ correspond à…', ['1 L', '10 L', '1 mL', '100 L'], '1 L', '1 dm³ = 1 L.'),
    q('volume', '250 cm³ correspondent à…', ['250 mL', '25 mL', '2 500 mL', '250 L'], '250 mL', '1 cm³ = 1 mL.'),
    q('capacity', 'Une boîte de 2 dm³ peut contenir…', ['2 L', '200 L', '2 mL', '20 mL'], '2 L', '2 dm³ = 2 L.'),
    q('volume', 'Pour passer de cm³ à mL, quelle relation utiliser ?', ['1 cm³ = 1 mL', '1 dm³ = 10 L', '1 m² = 100 dm²', '1 h = 60 min'], '1 cm³ = 1 mL', 'Cette relation relie volume et capacité.')
  ],
  durees: [
    q('duration', '1 semaine vaut…', ['7 jours', '10 jours', '24 jours', '30 jours'], '7 jours', 'Une semaine contient sept jours.'),
    q('duration', '2 h 35 min valent…', ['155 min', '235 min', '125 min', '135 min'], '155 min', '2 × 60 + 35 = 155.'),
    q('duration', 'Peut-on toujours dire 1 mois = 30 jours ?', ['Non', 'Oui', 'Seulement en hiver', 'Seulement en secondes'], 'Non', 'Un mois peut compter 28, 29, 30 ou 31 jours.'),
    q('duration', 'Du 28 février au 1er mars, faut-il connaître l’année ?', ['Oui', 'Non', 'Jamais', 'Seulement l’heure'], 'Oui', 'Février peut avoir 28 ou 29 jours.')
  ],
  enquetes: [
    q('length', 'Lina écrit 2 m + 30 cm = 32 cm. Quelle correction faut-il faire ?', ['2 m = 200 cm, donc 230 cm', '2 m = 20 cm, donc 50 cm', 'La réponse est 32 m', 'On ne peut pas calculer'], '2 m = 200 cm, donc 230 cm', 'Il faut d’abord utiliser une unité commune.'),
    q('area', 'Noé écrit 2 m² = 200 cm². Quelle est la bonne réponse ?', ['20 000 cm²', '200 cm²', '2 000 cm²', '20 cm²'], '20 000 cm²', 'm² → dm² → cm² : ×100 puis ×100.'),
    q('duration', 'Samir écrit 1,5 h = 1 h 5 min. Quelle est la bonne durée ?', ['1 h 30 min', '1 h 50 min', '15 min', '105 min'], '1 h 30 min', '0,5 h correspond à 30 minutes.'),
    q('mass', 'Zoé écrit 2,4 kg = 240 g. Quelle est la bonne masse ?', ['2 400 g', '240 g', '24 g', '24 000 g'], '2 400 g', 'kg → g correspond à un facteur 1 000.')
  ]
};

export function hasHouseQuestionBank(houseId: string): boolean {
  return Boolean(BANKS[houseId]?.length);
}

export function makeHouseQuestion(engine: MesuroviaEngineApiV3, houseId: string, index: number) {
  const bank = BANKS[houseId];
  if (!bank?.length) return null;
  const item = bank[index % bank.length];
  return {
    ...item,
    type: 'choice',
    answerLabel: item.answer,
    hint: 'Repère d’abord la grandeur demandée, puis l’unité ou la formule utile.',
    worked: item.explain
  };
}
