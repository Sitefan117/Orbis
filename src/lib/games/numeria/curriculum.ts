import type { Grade, Realm } from './types';

/**
 * Les 15 royaumes forment une progression de jeu. Les intitulés décrivent les
 * compétences travaillées ; ils ne prétendent pas reproduire à eux seuls tout le PER.
 * Le champ core aide à distinguer la trame principale des défis d'extension.
 */
export const GRADES: Grade[] = ['6H', '7H', '8H'];

export const GRADE_STORIES: Record<Grade, { title: string; subtitle: string; range: string }> = {
  '6H': {
    title: 'Les Archives des nombres',
    subtitle: 'Répare les sceaux des unités, dizaines, centaines et milliers.',
    range: 'Nombres naturels et valeur de position'
  },
  '7H': {
    title: 'La Frontière des écritures',
    subtitle: 'Relie les nombres, les fractions et les écritures décimales.',
    range: 'Décompositions, fractions et premières écritures décimales'
  },
  '8H': {
    title: 'Les Marches de la précision',
    subtitle: 'Traverse les décimaux et révèle la valeur de chaque rang.',
    range: 'Nombres rationnels positifs et décimaux jusqu’aux millièmes'
  }
};

export const REALMS: Realm[] = [
  // 6H — nombres naturels, regroupements, lecture, droite et décomposition.
  { id: '6h-collections', grade: '6H', order: 1, name: 'Vallée des Collections', subtitle: 'Faire des paquets sans perdre la quantité', symbol: '▦', region: 'Les plaines des dix', skill: 'Regrouper par 10', learningGoal: 'Passer d’unités isolées à des dizaines et des centaines, puis lire la quantité totale.', story: 'Les artisans ont dispersé les pierres de pouvoir. Regroupe-les pour rallumer les bornes.', guardian: 'Le Gardien des paquets', color: 'jade', core: true },
  { id: '6h-runes', grade: '6H', order: 2, name: 'Runes de Lecture', subtitle: 'Lire et comparer les nombres', symbol: 'ᚱ', region: 'Les archives gravées', skill: 'Lire, écrire et comparer', learningGoal: 'Identifier l’écriture chiffrée et comparer des nombres naturels.', story: 'Les runes se sont mélangées. Retrouve la bonne inscription avant la fermeture des archives.', guardian: 'La Sentinelle des runes', color: 'gold', core: true },
  { id: '6h-horizon', grade: '6H', order: 3, name: 'L’Horizon Gradué', subtitle: 'Situer un nombre entre des repères', symbol: '⌁', region: 'Le pont des repères', skill: 'Droite graduée', learningGoal: 'Repérer une position et l’associer à la valeur correspondante.', story: 'Le pont ne se matérialise que si les repères sont placés au bon endroit.', guardian: 'Le Veilleur de l’horizon', color: 'blue', core: true },
  { id: '6h-atelier', grade: '6H', order: 4, name: 'Atelier des Rangs', subtitle: 'Comprendre la valeur d’un chiffre', symbol: '⚒', region: 'La forge des rangs', skill: 'Unités, dizaines, centaines, milliers', learningGoal: 'Décomposer un nombre et distinguer un chiffre de sa valeur selon sa position.', story: 'La forge s’est déréglée : chaque chiffre doit retrouver sa place et sa valeur.', guardian: 'Le Maître-forgeron', color: 'violet', core: true },
  { id: '6h-seuils', grade: '6H', order: 5, name: 'Portes des Seuils', subtitle: 'Encadrer et franchir une borne', symbol: '門', region: 'Le rempart des milliers', skill: 'Encadrement et ordre', learningGoal: 'Comparer et encadrer des nombres autour d’une borne simple.', story: 'Les portes ne s’ouvrent qu’au nombre qui respecte exactement la règle gravée.', guardian: 'Le Juge des seuils', color: 'rose', core: true },

  // 7H — décomposition, intercalation, extraction et écritures fractionnaires/décimales.
  { id: '7h-rangs', grade: '7H', order: 1, name: 'Tour des Rangs', subtitle: 'Les nombres s’étendent au-delà des milliers', symbol: '▤', region: 'La tour des colonnes', skill: 'Valeur de position', learningGoal: 'Lire la valeur d’un chiffre dans un nombre à plusieurs rangs.', story: 'Les colonnes de la tour clignotent. Réattribue à chaque chiffre sa valeur.', guardian: 'Le Cartographe des rangs', color: 'violet', core: true },
  { id: '7h-intervalles', grade: '7H', order: 2, name: 'Jardin des Intervalles', subtitle: 'Trouver un nombre entre deux bornes', symbol: '↔', region: 'Les allées numériques', skill: 'Encadrer et intercaler', learningGoal: 'Choisir ou construire un nombre situé entre deux valeurs.', story: 'Les passerelles ont disparu. Une valeur correctement intercalée fera réapparaître chaque dalle.', guardian: 'La Gardienne des intervalles', color: 'blue', core: true },
  { id: '7h-extraction', grade: '7H', order: 3, name: 'Mine des Quantités', subtitle: 'Compter des dizaines, centaines et milliers entiers', symbol: '⛏', region: 'La mine profonde', skill: 'Extraire des unités de rang', learningGoal: 'Distinguer le chiffre d’un rang du nombre de groupes entiers de ce rang.', story: 'La mine compte les blocs complets, pas seulement le chiffre écrit dans la colonne.', guardian: 'Le Compteur de la mine', color: 'gold', core: true },
  { id: '7h-fractions', grade: '7H', order: 4, name: 'Sanctuaire des Fractions', subtitle: 'Relier une quantité à plusieurs écritures', symbol: '◒', region: 'Le sanctuaire partagé', skill: 'Fractions et égalités', learningGoal: 'Interpréter une fraction et reconnaître des écritures simples équivalentes.', story: 'Les fragments du sceau ne s’assemblent que si les parts représentent la même quantité.', guardian: 'L’Archiviste des parts', color: 'rose', core: true },
  { id: '7h-decimaux', grade: '7H', order: 5, name: 'Passerelle des Décimaux', subtitle: 'Faire le lien entre dixièmes et écriture décimale', symbol: '·', region: 'Le miroir des dixièmes', skill: 'Fractions décimales et décimaux', learningGoal: 'Lire des dixièmes et centièmes dans une écriture décimale simple.', story: 'Le miroir déforme les nombres tant que les virgules et les rangs ne sont pas remis en place.', guardian: 'Le Gardien du miroir', color: 'jade', core: true },

  // 8H — nombres rationnels positifs, décimaux et rangs fins. Les milliards sont extension.
  { id: '8h-grands-nombres', grade: '8H', order: 1, name: 'Observatoire des Grands Nombres', subtitle: 'Un défi d’extension aux très grands nombres', symbol: '✧', region: 'L’observatoire', skill: 'Grands nombres (extension)', learningGoal: 'Mobiliser la valeur de position sur de très grands nombres, au-delà du cœur de cette progression.', story: 'Un signal venu des confins s’écrit avec des rangs immenses. Il s’agit d’un défi bonus, pas d’un prérequis du parcours.', guardian: 'Le Veilleur des milliards', color: 'violet', core: false },
  { id: '8h-mots', grade: '8H', order: 2, name: 'Bibliothèque des Mots-nombres', subtitle: 'Passer des mots aux chiffres et inversement', symbol: 'Aa', region: 'La bibliothèque parlante', skill: 'Mots-nombres', learningGoal: 'Relier une formulation verbale à une écriture chiffrée, y compris avec plusieurs rangs.', story: 'Les grimoires ne s’ouvrent que lorsqu’on sait lire le nombre sous ses deux formes.', guardian: 'La Bibliothécaire des nombres', color: 'gold', core: true },
  { id: '8h-intercalation', grade: '8H', order: 3, name: 'Passage des Millièmes', subtitle: 'Intercaler entre deux nombres décimaux proches', symbol: '⋯', region: 'Le passage fin', skill: 'Ordre et intercalation décimale', learningGoal: 'Comparer et intercaler des nombres décimaux avec plusieurs chiffres après la virgule.', story: 'Le passage est étroit : une toute petite différence suffit à choisir la bonne dalle.', guardian: 'Le Jumeau de précision', color: 'blue', core: true },
  { id: '8h-milliemes', grade: '8H', order: 4, name: 'Laboratoire des Millièmes', subtitle: 'Associer une fraction décimale à un décimal', symbol: '∴', region: 'Le laboratoire de précision', skill: 'Millièmes', learningGoal: 'Lire et écrire des millièmes et relier la fraction décimale à l’écriture chiffrée.', story: 'Le laboratoire mesure des quantités minuscules. Le moindre rang oublié dérègle la machine.', guardian: 'Le Scientifique des millièmes', color: 'jade', core: true },
  { id: '8h-extraction', grade: '8H', order: 5, name: 'Chambre des Valeurs', subtitle: 'Extraire la valeur exacte d’un rang décimal', symbol: '⌕', region: 'La chambre des chiffres', skill: 'Valeur des rangs décimaux', learningGoal: 'Distinguer dixièmes, centièmes et millièmes dans un nombre décimal.', story: 'Le dernier sceau ne répond qu’à la valeur exacte du chiffre, pas à sa seule position.', guardian: 'La Gardienne des valeurs', color: 'rose', core: true }
];

export const CODEX: Record<string, { title: string; text: string }> = {
  '6h-collections': { title: 'Le pacte du regroupement', text: 'Dix unités peuvent être échangées contre une dizaine. La quantité totale ne change pas : seule sa représentation évolue.' },
  '6h-runes': { title: 'La lecture des runes', text: 'Pour comparer deux nombres naturels, regarde d’abord leur nombre de chiffres, puis compare les rangs de gauche à droite.' },
  '6h-horizon': { title: 'Le pont des repères', text: 'Sur une droite graduée, des intervalles égaux représentent des écarts égaux. Repère d’abord les bornes puis la taille d’un pas.' },
  '6h-atelier': { title: 'Le secret de la position', text: 'Un chiffre ne porte pas toujours la même valeur : dans 4’582, le 5 vaut 500 parce qu’il est à la place des centaines.' },
  '6h-seuils': { title: 'La règle des seuils', text: 'Encadrer un nombre consiste à trouver une borne plus petite et une borne plus grande. Lis attentivement si la borne doit être incluse ou non.' },
  '7h-rangs': { title: 'La tour des rangs', text: 'La valeur d’un chiffre dépend de sa position. Sépare mentalement les classes puis repère le rang demandé.' },
  '7h-intervalles': { title: 'La passerelle', text: 'Un nombre strictement entre deux bornes est plus grand que la borne inférieure et plus petit que la borne supérieure.' },
  '7h-extraction': { title: 'Les blocs entiers', text: 'Le nombre de centaines entières dans 5’628 est 56, tandis que le chiffre des centaines est 6. Ce ne sont pas les mêmes questions.' },
  '7h-fractions': { title: 'Le sanctuaire partagé', text: 'Dans une fraction a/b, le dénominateur indique en combien de parts égales on partage l’unité ; le numérateur indique combien de parts on prend.' },
  '7h-decimaux': { title: 'Le miroir des décimaux', text: 'Après la virgule, le premier rang est celui des dixièmes, puis viennent les centièmes et les millièmes.' },
  '8h-grands-nombres': { title: 'Le signal des confins', text: 'Les classes se regroupent par trois chiffres. Ce défi d’extension réutilise le même principe de valeur de position à très grande échelle.' },
  '8h-mots': { title: 'Les deux écritures', text: 'Pour passer des mots aux chiffres, découpe la formulation en classes (millions, milliers, unités) avant d’assembler le nombre.' },
  '8h-intercalation': { title: 'Le passage étroit', text: 'Pour comparer deux décimaux, on peut ajouter des zéros à droite sans changer la valeur : 2,5 = 2,50 = 2,500.' },
  '8h-milliemes': { title: 'La mesure fine', text: 'Un millième vaut 1/1000, soit 0,001. Dix millièmes valent 0,010, c’est-à-dire un centième.' },
  '8h-extraction': { title: 'La chambre des valeurs', text: 'Dans 18,407, le 4 représente 4 dixièmes (0,4), le 0 représente 0 centième et le 7 représente 7 millièmes (0,007).' }
};

export function getRealm(realmId: string): Realm | undefined {
  return REALMS.find((realm) => realm.id === realmId);
}

export function realmsForGrade(grade: Grade): Realm[] {
  return REALMS.filter((realm) => realm.grade === grade).sort((a, b) => a.order - b.order);
}
