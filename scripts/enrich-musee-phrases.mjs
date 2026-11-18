import fs from 'node:fs';

const csvPath = new URL('../static/vocabulaire/lexique.csv', import.meta.url);

const additions = {
  ecole: {
    exercice: 'Je termine l’___ avant la fin du cours.'
  },
  maison: {
    clé: 'Je ferme la porte avec ma ___.',
    chambre: 'Mon lit et mon armoire sont dans ma ___.',
    cuisine: 'Je prépare le repas dans la ___.',
    ranger: 'Après avoir travaillé, je dois ___ mes affaires.'
  },
  budget: {
    budget: 'Je prépare un ___ pour savoir combien je peux dépenser.',
    facture: 'Je dois payer cette ___ avant la fin du mois.',
    reçu: 'Après mon achat, la vendeuse me donne un ___.',
    'comparer les prix': 'Avant d’acheter, je vais ___ dans plusieurs magasins.'
  },
  securite: {
    symptôme: 'La toux peut être un ___ de maladie.',
    dose: 'Je respecte la ___ indiquée sur l’ordonnance.',
    urgence: 'En cas d’___, j’appelle rapidement les secours.',
    'issue de secours': 'En cas d’incendie, je sors par l’___.'
  },
  numerique: {
    'mot de passe': 'Je choisis un ___ difficile à deviner.',
    télécharger: 'Je vais ___ le document sur mon téléphone.',
    'pièce jointe': 'Le document se trouve dans la ___ de l’e-mail.',
    'bloquer un contact': 'Cette personne m’envoie des messages dangereux. Je vais ___.'
  },
  logement: {
    bail: 'Je lis le ___ avant de louer l’appartement.',
    régie: 'Je téléphone à la ___ pour signaler la fuite d’eau.',
    'état des lieux': 'Avant d’emménager, nous faisons l’___ du logement.',
    préavis: 'Je respecte le ___ avant de quitter mon appartement.'
  },
  argumentation: {
    argument: 'Je donne un ___ pour expliquer mon avis.',
    comparer: 'Pour ___ deux solutions, je cherche leurs différences.'
  },
  citoyennete: {
    droit: 'Chaque élève a le ___ d’être respecté.',
    médiation: 'Une personne neutre propose une ___ pour résoudre le conflit.'
  },
  environnement: {
    pollution: 'Les déchets dans la rivière causent de la ___.',
    recycler: 'Je trie le verre pour pouvoir le ___.',
    'économiser l’eau': 'Je ferme le robinet pour ___.',
    'transport public': 'Le train est un ___ utilisé par beaucoup de personnes.'
  },
  coiffeuse: {
    peigne: 'La coiffeuse utilise un ___ pour démêler les cheveux.',
    shampoing: 'Elle lave les cheveux avec du ___.',
    frange: 'Je souhaite garder une ___ au-dessus des yeux.',
    rincer: 'Après le shampoing, il faut ___ les cheveux avec de l’eau.',
    'sèche-cheveux': 'Elle sèche les cheveux avec un ___.'
  },
  fleuriste: {
    bouquet: 'La fleuriste prépare un ___ pour un anniversaire.',
    vase: 'Je mets les fleurs dans un ___ avec de l’eau.',
    sécateur: 'Elle coupe les tiges avec un ___.',
    arroser: 'Il faut ___ cette plante deux fois par semaine.',
    fané: 'Cette fleur est ___ : ses pétales commencent à tomber.'
  },
  tatoueuse: {
    motif: 'La cliente choisit le ___ de son tatouage.',
    pochoir: 'La tatoueuse place le ___ sur la peau avant de commencer.',
    désinfection: 'La ___ du matériel réduit le risque d’infection.',
    consentement: 'La cliente donne son ___ avant le tatouage.',
    cicatrisation: 'Je suis les conseils de soin pendant la ___.'
  },
  'carrossiere-peintre': {
    rayure: 'La portière a une longue ___ dans la peinture.',
    bosse: 'Le choc a laissé une ___ sur le capot.',
    poncer: 'Avant de peindre, il faut ___ la surface.',
    teinte: 'La carrossière cherche la même ___ que la peinture du véhicule.',
    vernis: 'À la fin, elle applique un ___ pour protéger la peinture.'
  },
  'pharmacie-urgences': {
    ordonnance: 'Je présente mon ___ à la pharmacie.',
    respirer: 'Cette personne a de la difficulté à ___.',
    pansement: 'Je protège la petite blessure avec un ___.',
    'numéro d’urgence': 'En cas de danger, j’appelle le ___.',
    repos: 'Après la maladie, le médecin conseille du ___.'
  },
  'travail-stage': {
    horaire: 'Je regarde mon ___ pour connaître l’heure de début du travail.',
    consigne: 'Avant d’utiliser la machine, j’écoute la ___.',
    ponctuel: 'J’arrive toujours à l’heure : je suis ___.',
    postuler: 'Je vais ___ pour cette place d’apprentissage.',
    sécurité: 'Dans l’atelier, je respecte les règles de ___.'
  },
  'hygiene-soins': {
    savon: 'Je me lave les mains avec du ___.',
    'brosse à dents': 'J’utilise ma ___ après le repas.',
    propre: 'Après la douche, ma peau est ___.',
    déodorant: 'Après m’être lavé, je mets du ___.',
    intime: 'Je respecte l’espace ___ de chaque personne.'
  },
  'poste-banque-assurances': {
    timbre: 'Je colle un ___ sur l’enveloppe.',
    colis: 'Je vais à la poste pour envoyer ce ___.',
    retrait: 'Je fais un ___ pour prendre de l’argent sur mon compte.',
    virement: 'Je paie la facture par ___ bancaire.',
    assurance: 'Après l’accident, je contacte mon ___.'
  },
  'reparation-entretien': {
    panne: 'La machine ne fonctionne plus à cause d’une ___.',
    tournevis: 'J’utilise un ___ pour serrer cette vis.',
    remplacer: 'La pièce est cassée. Il faut la ___.',
    mesurer: 'Avant de couper, je dois ___ la planche.',
    fuite: 'De l’eau coule sous l’évier : il y a une ___.'
  },
  'loisirs-sorties': {
    cinéma: 'Nous allons au ___ pour voir un film.',
    réserver: 'Je vais ___ deux places pour le concert.',
    horaire: 'Je vérifie l’___ de la séance avant de partir.',
    musée: 'Au ___, nous regardons une exposition.',
    's’amuser': 'Pendant la sortie, nous voulons ___ avec nos amis.'
  },
  'sports-equipements': {
    football: 'Au ___, les joueurs essaient de marquer avec les pieds.',
    raquette: 'Au badminton, je frappe le volant avec une ___.',
    gants: 'Pour la boxe, je protège mes mains avec des ___.',
    entraîneur: 'L’___ explique les exercices à l’équipe.',
    's’entraîner': 'Pour progresser, il faut ___ régulièrement.'
  }
};

function parseLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index++;
      } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(value);
      value = '';
    } else value += char;
  }
  values.push(value);
  return values;
}

function encode(value) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

const lines = fs.readFileSync(csvPath, 'utf8').trimEnd().split(/\r?\n/);
const headers = parseLine(lines[0]);
const themeIndex = headers.indexOf('theme');
const wordIndex = headers.indexOf('mot');
const phraseIndex = headers.indexOf('phrase_a_trou');
let added = 0;

for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
  const row = parseLine(lines[lineIndex]);
  const phrase = additions[row[themeIndex]]?.[row[wordIndex]];
  if (phrase && !row[phraseIndex]) {
    row[phraseIndex] = phrase;
    lines[lineIndex] = row.map(encode).join(',');
    added++;
  }
}

fs.writeFileSync(csvPath, `${lines.join('\n')}\n`);
console.log(`${added} phrases ajoutées.`);
