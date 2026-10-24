import type { Grade, SixForms, ThreeImperativeForms, VerbEntry, VerbGroup } from './types';

/**
 * Banque de verbes de ConjuLab.
 * Les verbes réguliers sont construits par des fabriques commentées ; les verbes
 * irréguliers enregistrent explicitement leurs formes sensibles. Le moteur ne
 * prétend pas déduire tous les verbes français à partir de leur seule terminaison.
 */

const GRADE_ORDER: Record<Grade, number> = { '6H': 6, '7H': 7, '8H': 8, '9H': 9 };

function regularEr(
  infinitive: string,
  options: {
    minGrade?: Grade;
    present?: SixForms;
    subjunctive?: SixForms;
    imperfectStem?: string;
    futureStem?: string;
    participePasse?: string;
    imperative?: ThreeImperativeForms;
    note?: string;
    acceptedAlternatives?: Record<string, string[]>;
  } = {}
): VerbEntry {
  const stem = infinitive.slice(0, -2);
  return {
    infinitive,
    group: 1,
    minGrade: options.minGrade ?? '6H',
    participePasse: options.participePasse ?? `${stem}é`,
    auxiliary: 'avoir',
    present: options.present ?? [
      `${stem}e`, `${stem}es`, `${stem}e`, `${stem}ons`, `${stem}ez`, `${stem}ent`
    ],
    subjunctive: options.subjunctive,
    imperfectStem: options.imperfectStem ?? stem,
    futureStem: options.futureStem ?? infinitive,
    imperative: options.imperative ?? [`${stem}e`, `${stem}ons`, `${stem}ez`],
    note: options.note ?? 'Verbe du 1er groupe : le radical est généralement stable et les terminaisons suivent un modèle régulier.',
    acceptedAlternatives: options.acceptedAlternatives
  };
}

function regularIr2(infinitive: string, minGrade: Grade = '6H'): VerbEntry {
  const stem = infinitive.slice(0, -2);
  return {
    infinitive,
    group: 2,
    minGrade,
    participePasse: `${stem}i`,
    auxiliary: 'avoir',
    present: [
      `${stem}is`, `${stem}is`, `${stem}it`,
      `${stem}issons`, `${stem}issez`, `${stem}issent`
    ],
    imperfectStem: `${stem}iss`,
    futureStem: infinitive,
    subjunctive: [
      `${stem}isse`, `${stem}isses`, `${stem}isse`,
      `${stem}issions`, `${stem}issiez`, `${stem}issent`
    ],
    imperative: [`${stem}is`, `${stem}issons`, `${stem}issez`],
    note: 'Verbe du 2e groupe : au présent, le modèle est -is, -is, -it, -issons, -issez, -issent.'
  };
}

const verbs: VerbEntry[] = [
  // 1er groupe : modèles réguliers servant de points d'appui.
  regularEr('aimer'),
  regularEr('chanter'),
  regularEr('parler'),
  regularEr('jouer'),
  regularEr('regarder'),
  regularEr('danser'),
  regularEr('écouter'),
  regularEr('marcher'),
  regularEr('travailler'),
  regularEr('tomber'),
  regularEr('oublier'),
  regularEr('manger', {
    present: ['mange', 'manges', 'mange', 'mangeons', 'mangez', 'mangent'],
    imperfectStem: 'mange',
    imperative: ['mange', 'mangeons', 'mangez'],
    subjunctive: ['mange', 'manges', 'mange', 'mangions', 'mangiez', 'mangent'],
    note: 'Verbe en -ger : le e est conservé devant certaines terminaisons pour garder le son doux de g.'
  }),
  regularEr('commencer', {
    present: ['commence', 'commences', 'commence', 'commençons', 'commencez', 'commencent'],
    imperfectStem: 'commenç',
    imperative: ['commence', 'commençons', 'commencez'],
    subjunctive: ['commence', 'commences', 'commence', 'commencions', 'commenciez', 'commencent'],
    note: 'Verbe en -cer : c devient ç devant o dans « nous commençons ».'
  }),
  regularEr('acheter', {
    minGrade: '7H',
    present: ['achète', 'achètes', 'achète', 'achetons', 'achetez', 'achètent'],
    imperfectStem: 'achet',
    futureStem: 'achèter',
    imperative: ['achète', 'achetons', 'achetez'],
    subjunctive: ['achète', 'achètes', 'achète', 'achetions', 'achetiez', 'achètent'],
    note: 'Verbe avec changement d’accent : j’achète, mais nous achetons ; au futur, j’achèterai.'
  }),
  regularEr('peler', {
    minGrade: '7H',
    present: ['pèle', 'pèles', 'pèle', 'pelons', 'pelez', 'pèlent'],
    imperfectStem: 'pel',
    futureStem: 'pèler',
    imperative: ['pèle', 'pelons', 'pelez'],
    subjunctive: ['pèle', 'pèles', 'pèle', 'pelions', 'peliez', 'pèlent'],
    note: 'Comme acheter, le e devient è dans certaines formes : je pèle, mais nous pelons ; au futur, je pèlerai.'
  }),
  regularEr('appeler', {
    minGrade: '8H',
    present: ['appelle', 'appelles', 'appelle', 'appelons', 'appelez', 'appellent'],
    imperfectStem: 'appel',
    futureStem: 'appeller',
    imperative: ['appelle', 'appelons', 'appelez'],
    subjunctive: ['appelle', 'appelles', 'appelle', 'appelions', 'appeliez', 'appellent'],
    note: 'Verbe avec consonne doublée : j’appelle, mais nous appelons ; au futur, j’appellerai.'
  }),
  regularEr('jeter', {
    minGrade: '8H',
    present: ['jette', 'jettes', 'jette', 'jetons', 'jetez', 'jettent'],
    imperfectStem: 'jet',
    futureStem: 'jetter',
    imperative: ['jette', 'jetons', 'jetez'],
    subjunctive: ['jette', 'jettes', 'jette', 'jetions', 'jetiez', 'jettent'],
    note: 'Verbe avec consonne doublée : je jette, mais nous jetons ; au futur, je jetterai.'
  }),
  regularEr('payer', {
    minGrade: '7H',
    present: ['paie', 'paies', 'paie', 'payons', 'payez', 'paient'],
    imperfectStem: 'pay',
    futureStem: 'paier',
    note: 'Certaines formes de payer admettent plusieurs graphies. Le jeu présente ici la série en -ai-.' ,
    imperative: ['paie', 'payons', 'payez'],
    subjunctive: ['paie', 'paies', 'paie', 'payions', 'payiez', 'paient'],
    acceptedAlternatives: {
      present: ['paye', 'payes', 'paye', 'payons', 'payez', 'payent'],
      futurSimple: ['payerai', 'payeras', 'payera', 'payerons', 'payerez', 'payeront']
    }
  }),
  regularEr('envoyer', {
    present: ['envoie', 'envoies', 'envoie', 'envoyons', 'envoyez', 'envoient'],
    imperfectStem: 'envoy',
    futureStem: 'enverr',
    imperative: ['envoie', 'envoyons', 'envoyez'],
    subjunctive: ['envoie', 'envoies', 'envoie', 'envoyions', 'envoyiez', 'envoient'],
    note: 'Verbe en -oyer : le futur est irrégulier, par exemple j’enverrai.'
  }),

  regularEr('placer', {
    present: ['place', 'places', 'place', 'plaçons', 'placez', 'placent'],
    imperfectStem: 'plaç',
    imperative: ['place', 'plaçons', 'placez'],
    subjunctive: ['place', 'places', 'place', 'placions', 'placiez', 'placent'],
    note: 'Verbe en -cer : le c devient ç devant o pour conserver le son doux (« nous plaçons »).'
  }),
  regularEr('employer', {
    minGrade: '7H',
    present: ['emploie', 'emploies', 'emploie', 'employons', 'employez', 'emploient'],
    imperfectStem: 'employ',
    futureStem: 'emploier',
    imperative: ['emploie', 'employons', 'employez'],
    subjunctive: ['emploie', 'emploies', 'emploie', 'employions', 'employiez', 'emploient'],
    note: 'Le y devient i dans certaines formes : j’emploie, mais nous employons.'
  }),

  // 2e groupe : verbes en -ir qui suivent le modèle de finir.
  regularIr2('finir'),
  regularIr2('choisir'),
  regularIr2('grandir'),
  regularIr2('réussir'),
  regularIr2('réfléchir'),
  regularIr2('remplir', '7H'),
  regularIr2('agir', '7H'),

  // 3e groupe : les six formes du présent et les radicaux irréguliers sont écrits explicitement.
  {
    infinitive: 'être', group: 3, minGrade: '6H', participePasse: 'été', auxiliary: 'avoir',
    present: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], imperfectStem: 'ét', futureStem: 'ser',
    subjunctive: ['sois', 'sois', 'soit', 'soyons', 'soyez', 'soient'],
    passeSimple: ['fus', 'fus', 'fut', 'fûmes', 'fûtes', 'furent'],
    imperative: ['sois', 'soyons', 'soyez'], note: 'Verbe très fréquent et très irrégulier : apprendre ses formes comme un modèle de référence.'
  },
  {
    infinitive: 'avoir', group: 3, minGrade: '6H', participePasse: 'eu', auxiliary: 'avoir',
    present: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], imperfectStem: 'av', futureStem: 'aur',
    subjunctive: ['aie', 'aies', 'ait', 'ayons', 'ayez', 'aient'],
    passeSimple: ['eus', 'eus', 'eut', 'eûmes', 'eûtes', 'eurent'],
    imperative: ['aie', 'ayons', 'ayez'], note: 'Auxiliaire très fréquent ; ses formes doivent être mémorisées.'
  },
  {
    infinitive: 'aller', group: 3, minGrade: '6H', participePasse: 'allé', auxiliary: 'être',
    present: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], imperfectStem: 'all', futureStem: 'ir',
    subjunctive: ['aille', 'ailles', 'aille', 'allions', 'alliez', 'aillent'],
    passeSimple: ['allai', 'allas', 'alla', 'allâmes', 'allâtes', 'allèrent'],
    imperative: ['va', 'allons', 'allez'], note: 'Verbe irrégulier. Au passé composé, aller se construit avec être.'
  },
  {
    infinitive: 'dire', group: 3, minGrade: '6H', participePasse: 'dit', auxiliary: 'avoir',
    present: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'], imperfectStem: 'dis', futureStem: 'dir',
    subjunctive: ['dise', 'dises', 'dise', 'disions', 'disiez', 'disent'],
    passeSimple: ['dis', 'dis', 'dit', 'dîmes', 'dîtes', 'dirent'],
    imperative: ['dis', 'disons', 'dites'], note: 'Attention à « vous dites » et au participe passé « dit ».'
  },
  {
    infinitive: 'faire', group: 3, minGrade: '6H', participePasse: 'fait', auxiliary: 'avoir',
    present: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], imperfectStem: 'fais', futureStem: 'fer',
    subjunctive: ['fasse', 'fasses', 'fasse', 'fassions', 'fassiez', 'fassent'],
    passeSimple: ['fis', 'fis', 'fit', 'fîmes', 'fîtes', 'firent'],
    imperative: ['fais', 'faisons', 'faites'], note: 'Le radical varie : je fais, nous faisons, ils font ; futur : je ferai.'
  },
  {
    infinitive: 'savoir', group: 3, minGrade: '6H', participePasse: 'su', auxiliary: 'avoir',
    present: ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'], imperfectStem: 'sav', futureStem: 'saur',
    subjunctive: ['sache', 'saches', 'sache', 'sachions', 'sachiez', 'sachent'],
    passeSimple: ['sus', 'sus', 'sut', 'sûmes', 'sûtes', 'surent'],
    imperative: ['sache', 'sachons', 'sachez'], note: 'Futur irrégulier : je saurai.'
  },
  {
    infinitive: 'vouloir', group: 3, minGrade: '6H', participePasse: 'voulu', auxiliary: 'avoir',
    present: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'], imperfectStem: 'voul', futureStem: 'voudr',
    subjunctive: ['veuille', 'veuilles', 'veuille', 'voulions', 'vouliez', 'veuillent'],
    passeSimple: ['voulus', 'voulus', 'voulut', 'voulûmes', 'voulûtes', 'voulurent'],
    imperative: ['veuille', 'veuillons', 'veuillez'], note: 'Futur irrégulier : je voudrai. L’impératif est surtout utilisé sous une forme polie (« veuillez »).'
  },
  {
    infinitive: 'pouvoir', group: 3, minGrade: '6H', participePasse: 'pu', auxiliary: 'avoir',
    present: ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'], imperfectStem: 'pouv', futureStem: 'pourr',
    subjunctive: ['puisse', 'puisses', 'puisse', 'puissions', 'puissiez', 'puissent'],
    passeSimple: ['pus', 'pus', 'put', 'pûmes', 'pûtes', 'purent'],
    note: 'Futur irrégulier : je pourrai. Pas d’impératif courant à travailler.'
  },
  {
    infinitive: 'devoir', group: 3, minGrade: '7H', participePasse: 'dû', auxiliary: 'avoir',
    present: ['dois', 'dois', 'doit', 'devons', 'devez', 'doivent'], imperfectStem: 'dev', futureStem: 'devr',
    subjunctive: ['doive', 'doives', 'doive', 'devions', 'deviez', 'doivent'],
    passeSimple: ['dus', 'dus', 'dut', 'dûmes', 'dûtes', 'durent'],
    imperative: ['dois', 'devons', 'devez'], note: 'Futur irrégulier : je devrai.'
  },
  {
    infinitive: 'prendre', group: 3, minGrade: '6H', participePasse: 'pris', auxiliary: 'avoir',
    present: ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'], imperfectStem: 'pren', futureStem: 'prendr',
    subjunctive: ['prenne', 'prennes', 'prenne', 'prenions', 'preniez', 'prennent'],
    passeSimple: ['pris', 'pris', 'prit', 'prîmes', 'prîtes', 'prirent'],
    imperative: ['prends', 'prenons', 'prenez'], note: 'Le radical change selon les personnes : je prends, nous prenons, ils prennent.'
  },
  {
    infinitive: 'comprendre', group: 3, minGrade: '7H', participePasse: 'compris', auxiliary: 'avoir',
    present: ['comprends', 'comprends', 'comprend', 'comprenons', 'comprenez', 'comprennent'], imperfectStem: 'compren', futureStem: 'comprendr',
    subjunctive: ['comprenne', 'comprennes', 'comprenne', 'comprenions', 'compreniez', 'comprennent'],
    passeSimple: ['compris', 'compris', 'comprit', 'comprîmes', 'comprîtes', 'comprirent'],
    imperative: ['comprends', 'comprenons', 'comprenez'], note: 'Se conjugue sur le modèle de prendre.'
  },
  {
    infinitive: 'apprendre', group: 3, minGrade: '7H', participePasse: 'appris', auxiliary: 'avoir',
    present: ['apprends', 'apprends', 'apprend', 'apprenons', 'apprenez', 'apprennent'], imperfectStem: 'appren', futureStem: 'apprendr',
    subjunctive: ['apprenne', 'apprennes', 'apprenne', 'apprenions', 'appreniez', 'apprennent'],
    passeSimple: ['appris', 'appris', 'apprit', 'apprîmes', 'apprîtes', 'apprirent'],
    imperative: ['apprends', 'apprenons', 'apprenez'], note: 'Se conjugue sur le modèle de prendre.'
  },
  {
    infinitive: 'mettre', group: 3, minGrade: '6H', participePasse: 'mis', auxiliary: 'avoir',
    present: ['mets', 'mets', 'met', 'mettons', 'mettez', 'mettent'], imperfectStem: 'mett', futureStem: 'mettr',
    subjunctive: ['mette', 'mettes', 'mette', 'mettions', 'mettiez', 'mettent'],
    passeSimple: ['mis', 'mis', 'mit', 'mîmes', 'mîtes', 'mirent'],
    imperative: ['mets', 'mettons', 'mettez'], note: 'Le double t apparaît dans « nous mettons » et au futur : je mettrai.'
  },
  {
    infinitive: 'rendre', group: 3, minGrade: '6H', participePasse: 'rendu', auxiliary: 'avoir',
    present: ['rends', 'rends', 'rend', 'rendons', 'rendez', 'rendent'], imperfectStem: 'rend', futureStem: 'rendr',
    subjunctive: ['rende', 'rendes', 'rende', 'rendions', 'rendiez', 'rendent'],
    passeSimple: ['rendis', 'rendis', 'rendit', 'rendîmes', 'rendîtes', 'rendirent'],
    imperative: ['rends', 'rendons', 'rendez'], note: 'Verbe du 3e groupe : rendre, attendre, répondre et perdre suivent des modèles proches avec certaines différences.'
  },
  {
    infinitive: 'venir', group: 3, minGrade: '6H', participePasse: 'venu', auxiliary: 'être',
    present: ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'], imperfectStem: 'ven', futureStem: 'viendr',
    subjunctive: ['vienne', 'viennes', 'vienne', 'venions', 'veniez', 'viennent'],
    passeSimple: ['vins', 'vins', 'vint', 'vînmes', 'vîntes', 'vinrent'],
    imperative: ['viens', 'venons', 'venez'], note: 'Futur irrégulier : je viendrai. Au passé composé, venir se construit avec être.'
  },
  {
    infinitive: 'tenir', group: 3, minGrade: '7H', participePasse: 'tenu', auxiliary: 'avoir',
    present: ['tiens', 'tiens', 'tient', 'tenons', 'tenez', 'tiennent'], imperfectStem: 'ten', futureStem: 'tiendr',
    subjunctive: ['tienne', 'tiennes', 'tienne', 'tenions', 'teniez', 'tiennent'],
    passeSimple: ['tins', 'tins', 'tint', 'tînmes', 'tîntes', 'tinrent'],
    imperative: ['tiens', 'tenons', 'tenez'], note: 'Se conjugue sur un modèle proche de venir, mais se construit avec avoir aux temps composés.'
  },
  {
    infinitive: 'voir', group: 3, minGrade: '6H', participePasse: 'vu', auxiliary: 'avoir',
    present: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'], imperfectStem: 'voy', futureStem: 'verr',
    subjunctive: ['voie', 'voies', 'voie', 'voyions', 'voyiez', 'voient'],
    passeSimple: ['vis', 'vis', 'vit', 'vîmes', 'vîtes', 'virent'],
    imperative: ['vois', 'voyons', 'voyez'], note: 'Futur irrégulier : je verrai.'
  },
  {
    infinitive: 'lire', group: 3, minGrade: '7H', participePasse: 'lu', auxiliary: 'avoir',
    present: ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'], imperfectStem: 'lis', futureStem: 'lir',
    subjunctive: ['lise', 'lises', 'lise', 'lisions', 'lisiez', 'lisent'],
    passeSimple: ['lus', 'lus', 'lut', 'lûmes', 'lûtes', 'lurent'],
    imperative: ['lis', 'lisons', 'lisez'], note: 'Futur : je lirai ; participe passé : lu.'
  },
  {
    infinitive: 'écrire', group: 3, minGrade: '7H', participePasse: 'écrit', auxiliary: 'avoir',
    present: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'], imperfectStem: 'écriv', futureStem: 'écrir',
    subjunctive: ['écrive', 'écrives', 'écrive', 'écrivions', 'écriviez', 'écrivent'],
    passeSimple: ['écrivis', 'écrivis', 'écrivit', 'écrivîmes', 'écrivîtes', 'écrivirent'],
    imperative: ['écris', 'écrivons', 'écrivez'], note: 'Le radical varie : j’écris, nous écrivons ; futur : j’écrirai.'
  },
  {
    infinitive: 'vivre', group: 3, minGrade: '8H', participePasse: 'vécu', auxiliary: 'avoir',
    present: ['vis', 'vis', 'vit', 'vivons', 'vivez', 'vivent'], imperfectStem: 'viv', futureStem: 'vivr',
    subjunctive: ['vive', 'vives', 'vive', 'vivions', 'viviez', 'vivent'],
    passeSimple: ['vécus', 'vécus', 'vécut', 'vécûmes', 'vécûtes', 'vécurent'],
    imperative: ['vis', 'vivons', 'vivez'], note: 'Participe passé irrégulier : vécu.'
  },
  {
    infinitive: 'croire', group: 3, minGrade: '8H', participePasse: 'cru', auxiliary: 'avoir',
    present: ['crois', 'crois', 'croit', 'croyons', 'croyez', 'croient'], imperfectStem: 'croy', futureStem: 'croir',
    subjunctive: ['croie', 'croies', 'croie', 'croyions', 'croyiez', 'croient'],
    passeSimple: ['crus', 'crus', 'crut', 'crûmes', 'crûtes', 'crurent'],
    imperative: ['crois', 'croyons', 'croyez'], note: 'Le radical change : je crois, nous croyons.'
  },
  {
    infinitive: 'boire', group: 3, minGrade: '8H', participePasse: 'bu', auxiliary: 'avoir',
    present: ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'], imperfectStem: 'buv', futureStem: 'boir',
    subjunctive: ['boive', 'boives', 'boive', 'buvions', 'buviez', 'boivent'],
    passeSimple: ['bus', 'bus', 'but', 'bûmes', 'bûtes', 'burent'],
    imperative: ['bois', 'buvons', 'buvez'], note: 'Le radical varie : je bois, nous buvons ; participe passé : bu.'
  },
  {
    infinitive: 'fuir', group: 3, minGrade: '8H', participePasse: 'fui', auxiliary: 'avoir',
    present: ['fuis', 'fuis', 'fuit', 'fuyons', 'fuyez', 'fuient'], imperfectStem: 'fuy', futureStem: 'fuir',
    subjunctive: ['fuie', 'fuies', 'fuie', 'fuyions', 'fuyiez', 'fuient'],
    passeSimple: ['fuis', 'fuis', 'fuit', 'fuîmes', 'fuîtes', 'fuirent'],
    imperative: ['fuis', 'fuyons', 'fuyez'], note: 'Le radical varie : je fuis, nous fuyons. Au participe présent : fuyant.'
  },
  {
    infinitive: 'valoir', group: 3, minGrade: '8H', participePasse: 'valu', auxiliary: 'avoir',
    present: ['vaux', 'vaux', 'vaut', 'valons', 'valez', 'valent'], imperfectStem: 'val', futureStem: 'vaudr',
    subjunctive: ['vaille', 'vailles', 'vaille', 'valions', 'valiez', 'vaillent'],
    passeSimple: ['valus', 'valus', 'valut', 'valûmes', 'valûtes', 'valurent'],
    note: 'Le futur et le conditionnel ont un radical particulier : je vaudrai, je vaudrais. Le verbe est souvent employé dans des tournures comme « il vaut mieux ». '
  },
  {
    infinitive: 'recevoir', group: 3, minGrade: '8H', participePasse: 'reçu', auxiliary: 'avoir',
    present: ['reçois', 'reçois', 'reçoit', 'recevons', 'recevez', 'reçoivent'], imperfectStem: 'recev', futureStem: 'recevr',
    subjunctive: ['reçoive', 'reçoives', 'reçoive', 'recevions', 'receviez', 'reçoivent'],
    passeSimple: ['reçus', 'reçus', 'reçut', 'reçûmes', 'reçûtes', 'reçurent'],
    imperative: ['reçois', 'recevons', 'recevez'], note: 'Le c devient ç dans certaines formes : je reçois, ils reçoivent.'
  },
  {
    infinitive: 'ouvrir', group: 3, minGrade: '8H', participePasse: 'ouvert', auxiliary: 'avoir',
    present: ['ouvre', 'ouvres', 'ouvre', 'ouvrons', 'ouvrez', 'ouvrent'], imperfectStem: 'ouvr', futureStem: 'ouvrir',
    subjunctive: ['ouvre', 'ouvres', 'ouvre', 'ouvrions', 'ouvriez', 'ouvrent'],
    passeSimple: ['ouvris', 'ouvris', 'ouvrit', 'ouvrîmes', 'ouvrîtes', 'ouvrirent'],
    imperative: ['ouvre', 'ouvrons', 'ouvrez'], note: 'Malgré -ir, ouvrir suit plusieurs terminaisons du présent des verbes en -er.'
  },
  {
    infinitive: 'offrir', group: 3, minGrade: '8H', participePasse: 'offert', auxiliary: 'avoir',
    present: ['offre', 'offres', 'offre', 'offrons', 'offrez', 'offrent'], imperfectStem: 'offr', futureStem: 'offrir',
    subjunctive: ['offre', 'offres', 'offre', 'offrions', 'offriez', 'offrent'],
    passeSimple: ['offris', 'offris', 'offrit', 'offrîmes', 'offrîtes', 'offrirent'],
    imperative: ['offre', 'offrons', 'offrez'], note: 'Malgré -ir, offrir suit plusieurs terminaisons du présent des verbes en -er.'
  },
  {
    infinitive: 'servir', group: 3, minGrade: '8H', participePasse: 'servi', auxiliary: 'avoir',
    present: ['sers', 'sers', 'sert', 'servons', 'servez', 'servent'], imperfectStem: 'serv', futureStem: 'servir',
    subjunctive: ['serve', 'serves', 'serve', 'servions', 'serviez', 'servent'],
    passeSimple: ['servis', 'servis', 'servit', 'servîmes', 'servîtes', 'servirent'],
    imperative: ['sers', 'servons', 'servez'], note: 'Présent irrégulier : je sers, nous servons.'
  },
  {
    infinitive: 'dormir', group: 3, minGrade: '8H', participePasse: 'dormi', auxiliary: 'avoir',
    present: ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'], imperfectStem: 'dorm', futureStem: 'dormir',
    subjunctive: ['dorme', 'dormes', 'dorme', 'dormions', 'dormiez', 'dorment'],
    passeSimple: ['dormis', 'dormis', 'dormit', 'dormîmes', 'dormîtes', 'dormirent'],
    imperative: ['dors', 'dormons', 'dormez'], note: 'Présent irrégulier : je dors, nous dormons.'
  },
  {
    infinitive: 'partir', group: 3, minGrade: '8H', participePasse: 'parti', auxiliary: 'être',
    present: ['pars', 'pars', 'part', 'partons', 'partez', 'partent'], imperfectStem: 'part', futureStem: 'partir',
    subjunctive: ['parte', 'partes', 'parte', 'partions', 'partiez', 'partent'],
    passeSimple: ['partis', 'partis', 'partit', 'partîmes', 'partîtes', 'partirent'],
    imperative: ['pars', 'partons', 'partez'], note: 'Dans le sens de quitter un lieu, partir se construit avec être au passé composé.'
  },
  {
    infinitive: 'sortir', group: 3, minGrade: '8H', participePasse: 'sorti', auxiliary: 'être',
    present: ['sors', 'sors', 'sort', 'sortons', 'sortez', 'sortent'], imperfectStem: 'sort', futureStem: 'sortir',
    subjunctive: ['sorte', 'sortes', 'sorte', 'sortions', 'sortiez', 'sortent'],
    passeSimple: ['sortis', 'sortis', 'sortit', 'sortîmes', 'sortîtes', 'sortirent'],
    imperative: ['sors', 'sortons', 'sortez'], note: 'Ici, sortir est travaillé au sens intransitif (« elle est sortie »). Il se construit aussi avec avoir dans d’autres emplois.'
  },
  {
    infinitive: 'courir', group: 3, minGrade: '8H', participePasse: 'couru', auxiliary: 'avoir',
    present: ['cours', 'cours', 'court', 'courons', 'courez', 'courent'], imperfectStem: 'cour', futureStem: 'courr',
    subjunctive: ['coure', 'coures', 'coure', 'courions', 'couriez', 'courent'],
    passeSimple: ['courus', 'courus', 'courut', 'courûmes', 'courûtes', 'coururent'],
    imperative: ['cours', 'courons', 'courez'], note: 'Futur irrégulier : je courrai.'
  },
  {
    infinitive: 'connaître', group: 3, minGrade: '8H', participePasse: 'connu', auxiliary: 'avoir',
    present: ['connais', 'connais', 'connaît', 'connaissons', 'connaissez', 'connaissent'], imperfectStem: 'connaiss', futureStem: 'connaîtr',
    subjunctive: ['connaisse', 'connaisses', 'connaisse', 'connaissions', 'connaissiez', 'connaissent'],
    passeSimple: ['connus', 'connus', 'connut', 'connûmes', 'connûtes', 'connurent'],
    imperative: ['connais', 'connaissons', 'connaissez'], note: 'Le participe passé est « connu ».'
  },
  {
    infinitive: 'craindre', group: 3, minGrade: '8H', participePasse: 'craint', auxiliary: 'avoir',
    present: ['crains', 'crains', 'craint', 'craignons', 'craignez', 'craignent'], imperfectStem: 'craign', futureStem: 'craindr',
    subjunctive: ['craigne', 'craignes', 'craigne', 'craignions', 'craigniez', 'craignent'],
    passeSimple: ['craignis', 'craignis', 'craignit', 'craignîmes', 'craignîtes', 'craignirent'],
    imperative: ['crains', 'craignons', 'craignez'], note: 'Modèle en -indre : le radical contient gn dans plusieurs formes.'
  },
  {
    infinitive: 'plaire', group: 3, minGrade: '8H', participePasse: 'plu', auxiliary: 'avoir',
    present: ['plais', 'plais', 'plaît', 'plaisons', 'plaisez', 'plaisent'], imperfectStem: 'plais', futureStem: 'plair',
    subjunctive: ['plaise', 'plaises', 'plaise', 'plaisions', 'plaisiez', 'plaisent'],
    passeSimple: ['plus', 'plus', 'plut', 'plûmes', 'plûtes', 'plurent'],
    imperative: ['plais', 'plaisons', 'plaisez'], note: 'Présent : il plaît ; participe passé : plu.'
  },
  {
    infinitive: 'naître', group: 3, minGrade: '9H', participePasse: 'né', auxiliary: 'être',
    present: ['nais', 'nais', 'naît', 'naissons', 'naissez', 'naissent'], imperfectStem: 'naiss', futureStem: 'naîtr',
    subjunctive: ['naisse', 'naisses', 'naisse', 'naissions', 'naissiez', 'naissent'],
    passeSimple: ['naquis', 'naquis', 'naquit', 'naquîmes', 'naquîtes', 'naquirent'],
    imperative: ['nais', 'naissons', 'naissez'], note: 'Au passé composé, naître se construit avec être et le participe passé s’accorde avec le sujet.'
  },
  {
    infinitive: 'mourir', group: 3, minGrade: '9H', participePasse: 'mort', auxiliary: 'être',
    present: ['meurs', 'meurs', 'meurt', 'mourons', 'mourez', 'meurent'], imperfectStem: 'mour', futureStem: 'mourr',
    subjunctive: ['meure', 'meures', 'meure', 'mourions', 'mouriez', 'meurent'],
    passeSimple: ['mourus', 'mourus', 'mourut', 'mourûmes', 'mourûtes', 'moururent'],
    imperative: ['meurs', 'mourons', 'mourez'], note: 'Futur : je mourrai. Au passé composé, mourir se construit avec être.'
  },
  {
    infinitive: 'entendre', group: 3, minGrade: '7H', participePasse: 'entendu', auxiliary: 'avoir',
    present: ['entends', 'entends', 'entend', 'entendons', 'entendez', 'entendent'], imperfectStem: 'entend', futureStem: 'entendr',
    subjunctive: ['entende', 'entendes', 'entende', 'entendions', 'entendiez', 'entendent'],
    passeSimple: ['entendis', 'entendis', 'entendit', 'entendîmes', 'entendîtes', 'entendirent'],
    imperative: ['entends', 'entendons', 'entendez'], note: 'Entendre suit un modèle régulier du 3e groupe en -re ; compare « j’entends » et « nous entendons ».'
  },
  {
    infinitive: 'attendre', group: 3, minGrade: '9H', participePasse: 'attendu', auxiliary: 'avoir',
    present: ['attends', 'attends', 'attend', 'attendons', 'attendez', 'attendent'], imperfectStem: 'attend', futureStem: 'attendr',
    subjunctive: ['attende', 'attendes', 'attende', 'attendions', 'attendiez', 'attendent'],
    passeSimple: ['attendis', 'attendis', 'attendit', 'attendîmes', 'attendîtes', 'attendirent'],
    imperative: ['attends', 'attendons', 'attendez'], note: 'Le modèle d’attendre est proche de celui de rendre et de perdre.'
  },
  {
    infinitive: 'répondre', group: 3, minGrade: '9H', participePasse: 'répondu', auxiliary: 'avoir',
    present: ['réponds', 'réponds', 'répond', 'répondons', 'répondez', 'répondent'], imperfectStem: 'répond', futureStem: 'répondr',
    subjunctive: ['réponde', 'répondes', 'réponde', 'répondions', 'répondiez', 'répondent'],
    passeSimple: ['répondis', 'répondis', 'répondit', 'répondîmes', 'répondîtes', 'répondirent'],
    imperative: ['réponds', 'répondons', 'répondez'], note: 'Le radical répond- reste reconnaissable dans les formes les plus fréquentes.'
  },
  {
    infinitive: 'perdre', group: 3, minGrade: '9H', participePasse: 'perdu', auxiliary: 'avoir',
    present: ['perds', 'perds', 'perd', 'perdons', 'perdez', 'perdent'], imperfectStem: 'perd', futureStem: 'perdr',
    subjunctive: ['perde', 'perdes', 'perde', 'perdions', 'perdiez', 'perdent'],
    passeSimple: ['perdis', 'perdis', 'perdit', 'perdîmes', 'perdîtes', 'perdirent'],
    imperative: ['perds', 'perdons', 'perdez'], note: 'Le modèle est proche de rendre et attendre.'
  },
  {
    infinitive: 'devenir', group: 3, minGrade: '9H', participePasse: 'devenu', auxiliary: 'être',
    present: ['deviens', 'deviens', 'devient', 'devenons', 'devenez', 'deviennent'], imperfectStem: 'deven', futureStem: 'deviendr',
    subjunctive: ['devienne', 'deviennes', 'devienne', 'devenions', 'deveniez', 'deviennent'],
    passeSimple: ['devins', 'devins', 'devint', 'devînmes', 'devîntes', 'devinrent'],
    imperative: ['deviens', 'devenons', 'devenez'], note: 'Se conjugue sur le modèle de venir. Aux temps composés, on utilise être.'
  },
  {
    infinitive: 'retenir', group: 3, minGrade: '9H', participePasse: 'retenu', auxiliary: 'avoir',
    present: ['retiens', 'retiens', 'retient', 'retenons', 'retenez', 'retiennent'], imperfectStem: 'reten', futureStem: 'retiendr',
    subjunctive: ['retienne', 'retiennes', 'retienne', 'retenions', 'reteniez', 'retiennent'],
    passeSimple: ['retins', 'retins', 'retint', 'retînmes', 'retîntes', 'retinrent'],
    imperative: ['retiens', 'retenons', 'retenez'], note: 'Se conjugue sur le modèle de tenir.'
  },
  {
    infinitive: 'suivre', group: 3, minGrade: '9H', participePasse: 'suivi', auxiliary: 'avoir',
    present: ['suis', 'suis', 'suit', 'suivons', 'suivez', 'suivent'], imperfectStem: 'suiv', futureStem: 'suivr',
    subjunctive: ['suive', 'suives', 'suive', 'suivions', 'suiviez', 'suivent'],
    passeSimple: ['suivis', 'suivis', 'suivit', 'suivîmes', 'suivîtes', 'suivirent'],
    imperative: ['suis', 'suivons', 'suivez'], note: 'Attention : « je suis » peut être une forme de suivre ou d’être ; le contexte aide à distinguer le verbe.'
  },
  {
    infinitive: 'sentir', group: 3, minGrade: '9H', participePasse: 'senti', auxiliary: 'avoir',
    present: ['sens', 'sens', 'sent', 'sentons', 'sentez', 'sentent'], imperfectStem: 'sent', futureStem: 'sentir',
    subjunctive: ['sente', 'sentes', 'sente', 'sentions', 'sentiez', 'sentent'],
    passeSimple: ['sentis', 'sentis', 'sentit', 'sentîmes', 'sentîtes', 'sentirent'],
    imperative: ['sens', 'sentons', 'sentez'], note: 'Le radical présent est différent entre « je sens » et « nous sentons » si l’on repère la base orthographique.'
  },
  {
    infinitive: 'couvrir', group: 3, minGrade: '9H', participePasse: 'couvert', auxiliary: 'avoir',
    present: ['couvre', 'couvres', 'couvre', 'couvrons', 'couvrez', 'couvrent'], imperfectStem: 'couvr', futureStem: 'couvrir',
    subjunctive: ['couvre', 'couvres', 'couvre', 'couvrions', 'couvriez', 'couvrent'],
    passeSimple: ['couvris', 'couvris', 'couvrit', 'couvrîmes', 'couvrîtes', 'couvrirent'],
    imperative: ['couvre', 'couvrons', 'couvrez'], note: 'Malgré -ir, couvrir se conjugue au présent avec plusieurs terminaisons du modèle en -er.'
  },
  {
    infinitive: 'souffrir', group: 3, minGrade: '9H', participePasse: 'souffert', auxiliary: 'avoir',
    present: ['souffre', 'souffres', 'souffre', 'souffrons', 'souffrez', 'souffrent'], imperfectStem: 'souffr', futureStem: 'souffrir',
    subjunctive: ['souffre', 'souffres', 'souffre', 'souffrions', 'souffriez', 'souffrent'],
    passeSimple: ['souffris', 'souffris', 'souffrit', 'souffrîmes', 'souffrîtes', 'souffrirent'],
    imperative: ['souffre', 'souffrons', 'souffrez'], note: 'Même modèle au présent que ouvrir et offrir ; participe passé irrégulier : souffert.'
  },
  {
    infinitive: 'reconnaître', group: 3, minGrade: '9H', participePasse: 'reconnu', auxiliary: 'avoir',
    present: ['reconnais', 'reconnais', 'reconnaît', 'reconnaissons', 'reconnaissez', 'reconnaissent'], imperfectStem: 'reconnaiss', futureStem: 'reconnaîtr',
    subjunctive: ['reconnaisse', 'reconnaisses', 'reconnaisse', 'reconnaissions', 'reconnaissiez', 'reconnaissent'],
    passeSimple: ['reconnus', 'reconnus', 'reconnut', 'reconnûmes', 'reconnûtes', 'reconnurent'],
    imperative: ['reconnais', 'reconnaissons', 'reconnaissez'], note: 'Se conjugue sur le modèle de connaître.'
  },
  {
    infinitive: 'paraître', group: 3, minGrade: '9H', participePasse: 'paru', auxiliary: 'avoir',
    present: ['parais', 'parais', 'paraît', 'paraissons', 'paraissez', 'paraissent'], imperfectStem: 'paraiss', futureStem: 'paraîtr',
    subjunctive: ['paraisse', 'paraisses', 'paraisse', 'paraissions', 'paraissiez', 'paraissent'],
    passeSimple: ['parus', 'parus', 'parut', 'parûmes', 'parûtes', 'parurent'],
    imperative: ['parais', 'paraissons', 'paraissez'], note: 'Se conjugue sur le modèle de connaître ; participe passé : paru.'
  },
  {
    infinitive: 'rire', group: 3, minGrade: '9H', participePasse: 'ri', auxiliary: 'avoir',
    present: ['ris', 'ris', 'rit', 'rions', 'riez', 'rient'], imperfectStem: 'ri', futureStem: 'rir',
    subjunctive: ['rie', 'ries', 'rie', 'riions', 'riiez', 'rient'],
    passeSimple: ['ris', 'ris', 'rit', 'rîmes', 'rîtes', 'rirent'],
    imperative: ['ris', 'rions', 'riez'], note: 'Présent : je ris, nous rions, ils rient ; participe passé : ri.'
  },
  {
    infinitive: 'sourire', group: 3, minGrade: '9H', participePasse: 'souri', auxiliary: 'avoir',
    present: ['souris', 'souris', 'sourit', 'sourions', 'souriez', 'sourient'], imperfectStem: 'souri', futureStem: 'sourir',
    subjunctive: ['sourie', 'souries', 'sourie', 'souriions', 'souriiez', 'sourient'],
    passeSimple: ['souris', 'souris', 'sourit', 'sourîmes', 'sourîtes', 'sourirent'],
    imperative: ['souris', 'sourions', 'souriez'], note: 'Se conjugue sur le modèle de rire.'
  },
  {
    infinitive: 'falloir', group: 3, minGrade: '8H', participePasse: 'fallu', auxiliary: 'avoir',
    present: ['', '', 'faut', '', '', ''], imperfectStem: 'fall', futureStem: 'faudr',
    subjunctive: ['', '', 'faille', '', '', ''],
    passeSimple: ['', '', 'fallut', '', '', ''],
    note: 'Verbe impersonnel : on utilise surtout « il faut », « il fallait », « il faudra » et « il a fallu ».', impersonal: true
  }
];

/** Retourne les verbes introduits à ce niveau ou avant. */
export function getVerbsForGrade(grade: Grade): VerbEntry[] {
  const ceiling = GRADE_ORDER[grade];
  return verbs.filter((verb) => GRADE_ORDER[verb.minGrade] <= ceiling);
}

/** Expose la liste complète en lecture seule pour les fiches de référence et les tests. */
export function getAllVerbs(): VerbEntry[] {
  return [...verbs];
}

/** Libellé clair du groupe pour les élèves. */
export function getGroupLabel(group: VerbGroup): string {
  if (group === 1) return '1er groupe · verbes en -er';
  if (group === 2) return '2e groupe · verbes en -ir, modèle finir';
  return '3e groupe · autres modèles';
}
