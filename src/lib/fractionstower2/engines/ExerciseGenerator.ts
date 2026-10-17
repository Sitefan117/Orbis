/**
 * FractionTower2 — générateur algorithmique d'exercices.
 *
 * Les questions sont créées à la demande : les nombres, les opérations et les
 * réponses varient d'une session à l'autre. Le générateur reste compatible avec
 * les types déjà pris en charge par TrainingSession.svelte.
 * Aucune dépendance externe.
 */

export interface Exercise {
  id: string;
  question: string;
  correctAnswer: string;
  type: 'input' | 'qcm' | 'comparison' | 'number_line' | 'color_interactive' | 'slice_interactive';
  options?: string[];
  fractions?: Array<{ numerator: number; denominator: number }>;
  hint?: string;
  /** 'exact' pour un format explicitement demandé ; 'equivalent' accepte une fraction de même valeur. */
  answerMode?: 'exact' | 'equivalent';
  interactiveData?: {
    totalParts?: number;
    targetParts?: number;
  };
}

type ExerciseType = Exercise['type'];
type ComparisonSymbol = '<' | '>' | '=';

const COMPARISON_OPTIONS: ComparisonSymbol[] = ['<', '>', '='];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choose<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function idFactory(floor: number): () => string {
  let counter = 0;
  return () => `f${floor}-${++counter}`;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x || 1;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

function fractionText(numerator: number, denominator: number): string {
  return `${numerator}/${denominator}`;
}

function reducedFractionText(numerator: number, denominator: number): string {
  const divisor = gcd(numerator, denominator);
  return fractionText(numerator / divisor, denominator / divisor);
}

function compareNumbers(a: number, b: number): ComparisonSymbol {
  if (a < b) return '<';
  if (a > b) return '>';
  return '=';
}

function makeQcm(
  id: string,
  question: string,
  correctAnswer: string,
  options: string[],
  hint: string
): Exercise {
  const uniqueOptions = [...new Set(options)];
  if (!uniqueOptions.includes(correctAnswer)) uniqueOptions.unshift(correctAnswer);
  return {
    id,
    question,
    correctAnswer,
    type: 'qcm',
    options: shuffle(uniqueOptions),
    hint
  };
}

function makeInput(
  id: string,
  question: string,
  correctAnswer: string,
  hint: string,
  answerMode: 'exact' | 'equivalent' = 'equivalent'
): Exercise {
  return { id, question, correctAnswer, type: 'input', hint, answerMode };
}

function makeComparison(
  id: string,
  question: string,
  correctAnswer: ComparisonSymbol,
  hint: string,
  fractions?: Array<{ numerator: number; denominator: number }>
): Exercise {
  return {
    id,
    question,
    correctAnswer,
    type: 'comparison',
    options: [...COMPARISON_OPTIONS],
    fractions,
    hint
  };
}

function makeColor(
  id: string,
  question: string,
  totalParts: number,
  targetParts: number,
  hint: string
): Exercise {
  return {
    id,
    question,
    correctAnswer: fractionText(targetParts, totalParts),
    type: 'color_interactive',
    interactiveData: { totalParts, targetParts },
    hint,
    answerMode: 'exact'
  };
}

function makeSlice(id: string, question: string, targetParts: number, hint: string): Exercise {
  return {
    id,
    question,
    correctAnswer: String(targetParts),
    type: 'slice_interactive',
    interactiveData: { targetParts },
    hint
  };
}

function makeNumberLine(
  id: string,
  totalParts: number,
  targetParts: number
): Exercise {
  return {
    id,
    question: `Sur une droite graduée de 0 à 1 partagée en ${totalParts} intervalles égaux, place ${targetParts}/${totalParts}. Clique sur la bonne graduation.`,
    correctAnswer: fractionText(targetParts, totalParts),
    type: 'number_line',
    interactiveData: { totalParts, targetParts },
    answerMode: 'exact',
    hint: `Le dénominateur ${totalParts} indique le nombre total d'intervalles. À partir de 0, avance de ${targetParts} intervalle(s).`
  };
}

function makeOptions(correct: string, distractors: string[], total = 4): string[] {
  const unique = [...new Set([correct, ...shuffle(distractors).filter((item) => item !== correct)])];
  return shuffle(unique.slice(0, Math.max(total, 2)));
}

function numberName(value: number): string {
  const names: Record<number, string> = {
    1: 'un', 2: 'deux', 3: 'trois', 4: 'quatre', 5: 'cinq', 6: 'six',
    7: 'sept', 8: 'huit', 9: 'neuf', 10: 'dix', 11: 'onze', 12: 'douze'
  };
  return names[value] ?? String(value);
}

function fractionReading(numerator: number, denominator: number): string {
  const singularOrPlural: Record<number, [string, string]> = {
    2: ['demi', 'demis'],
    3: ['tiers', 'tiers'],
    4: ['quart', 'quarts'],
    5: ['cinquième', 'cinquièmes'],
    6: ['sixième', 'sixièmes'],
    7: ['septième', 'septièmes'],
    8: ['huitième', 'huitièmes'],
    9: ['neuvième', 'neuvièmes'],
    10: ['dixième', 'dixièmes'],
    12: ['douzième', 'douzièmes'],
    100: ['centième', 'centièmes']
  };
  const names = singularOrPlural[denominator];
  if (!names) return `${numberName(numerator)} sur ${numberName(denominator)}`;
  const first = numerator === 1 ? 'un' : numberName(numerator);
  return `${first} ${numerator === 1 ? names[0] : names[1]}`;
}

function formatDecimal(numerator: number, denominator: 10 | 100): string {
  if (denominator === 10) return `0,${numerator}`;
  return `0,${String(numerator).padStart(2, '0')}`;
}

function randomProperFraction(denominatorMin = 2, denominatorMax = 12): { n: number; d: number } {
  const d = randomInt(denominatorMin, denominatorMax);
  return { n: randomInt(1, d - 1), d };
}

function decimalValue(numerator: number, denominator: number): number {
  return numerator / denominator;
}

function pickDifferentNumber(correct: number, min: number, max: number): number {
  if (min === max) return correct;
  let value = randomInt(min, max);
  while (value === correct) value = randomInt(min, max);
  return value;
}

function makeSessionPool(floor: number): Exercise[] {
  const makeId = idFactory(floor);
  const exercises: Exercise[] = [];

  switch (floor) {
    case 1: {
      // Partage équitable, numérateur, dénominateur et vocabulaire numérique.
      for (let i = 0; i < 12; i++) {
        const total = randomInt(3, 10);
        const taken = randomInt(1, total - 1);
        if (i % 3 === 0) {
          const correct = i % 2 === 0 ? 'oui' : 'non';
          exercises.push(makeQcm(
            makeId(),
            i % 2 === 0
              ? `Pour représenter ${total} parts de même taille, faut-il que les parts soient égales ?`
              : 'Peut-on appeler « quarts » quatre morceaux de tailles différentes ?',
            correct,
            ['oui', 'non'],
            'Une fraction décrit des parts de même taille : le partage doit être équitable.'
          ));
        } else if (i % 3 === 1) {
          const askNumerator = Math.random() < 0.5;
          exercises.push(makeQcm(
            makeId(),
            askNumerator
              ? `Dans ${taken}/${total}, quel est le numérateur ?`
              : `Dans ${taken}/${total}, quel est le dénominateur ?`,
            String(askNumerator ? taken : total),
            makeOptions(String(askNumerator ? taken : total), [String(total), String(taken), String(taken + total), String(Math.abs(total - taken))]),
            askNumerator ? 'Le numérateur est le nombre placé en haut.' : 'Le dénominateur est le nombre placé en bas.'
          ));
        } else {
          exercises.push(makeQcm(
            makeId(),
            `Quelle fraction représente ${taken} part(s) sur ${total} parts égales ?`,
            fractionText(taken, total),
            makeOptions(fractionText(taken, total), [fractionText(total, taken), fractionText(taken + 1, total), fractionText(taken, total + 1)]),
            'Les parts prises vont au numérateur, en haut. Le total va au dénominateur, en bas.'
          ));
        }
      }
      for (let i = 0; i < 12; i++) {
        const total = randomInt(2, 12);
        const taken = randomInt(1, total);
        exercises.push(makeInput(
          makeId(),
          `Écris la fraction qui représente ${taken} part(s) prise(s) sur ${total} parts égales.`,
          fractionText(taken, total),
          `Écris ${taken} en haut et ${total} en bas : numérateur/dénominateur.`
        ));
      }
      for (let i = 0; i < 7; i++) {
        const total = randomInt(3, 10);
        const taken = randomInt(1, total - 1);
        exercises.push(makeColor(
          makeId(),
          `Colorie ${taken} part(s) sur les ${total} parts égales pour représenter ${taken}/${total}.`,
          total,
          taken,
          `Le nombre du haut indique combien de parts colorier : ${taken}.`
        ));
      }
      for (let i = 0; i < 5; i++) {
        const total = randomInt(2, 12);
        exercises.push(makeSlice(makeId(), `Découpe l'unité en ${total} parts égales.`, total, `Ajuste le compteur pour obtenir ${total} parts égales.`));
      }
      break;
    }

    case 2: {
      // Lire, écrire, représenter et relier les trois formes.
      const readableDenominators = [2, 3, 4, 5, 6, 7, 8, 10, 12];
      for (let i = 0; i < 14; i++) {
        const d = choose(readableDenominators);
        const n = randomInt(1, Math.min(d - 1, 9));
        const correct = fractionReading(n, d);
        const wrong1 = fractionReading(Math.min(d - 1, n + 1), d);
        const wrong2 = fractionReading(n, choose(readableDenominators.filter((item) => item !== d)));
        exercises.push(makeQcm(
          makeId(),
          `Comment lit-on la fraction ${n}/${d} ?`,
          correct,
          makeOptions(correct, [wrong1, wrong2, `${numberName(d)} sur ${numberName(n)}`]),
          'Lis d’abord le numérateur, puis le nom donné par le dénominateur. Dans ce type de question, les mots sont proposés dans le QCM.'
        ));
      }
      for (let i = 0; i < 14; i++) {
        const d = randomInt(2, 12);
        const n = randomInt(1, d);
        exercises.push(makeInput(
          makeId(),
          `Écris en chiffres la fraction représentée par ${n} part(s) sur ${d} parts égales.`,
          fractionText(n, d),
          `Le nombre de parts comptées est ${n} ; le nombre total de parts est ${d}. Écris ${n}/${d}.`
        ));
      }
      for (let i = 0; i < 8; i++) {
        const d = randomInt(3, 10);
        const n = randomInt(1, d - 1);
        exercises.push(makeColor(
          makeId(),
          `Représente ${n}/${d} en coloriant les parts nécessaires.`,
          d,
          n,
          `Il faut colorier ${n} parts parmi ${d} parts égales.`
        ));
      }
      for (let i = 0; i < 5; i++) {
        const d = choose(readableDenominators);
        const n = randomInt(1, d - 1);
        exercises.push(makeQcm(
          makeId(),
          `Un dessin montre ${n} case(s) coloriée(s) parmi ${d} cases égales. Quelle fraction écrit-on ?`,
          fractionText(n, d),
          makeOptions(fractionText(n, d), [fractionText(d, n), fractionText(n, d + 1), fractionText(Math.max(1, n - 1), d)]),
          'Le numérateur compte les cases coloriées ; le dénominateur compte toutes les cases.'
        ));
      }
      break;
    }

    case 3: {
      // Droite graduée : questions écrites et placements sur une droite interactive.
      for (let i = 0; i < 12; i++) {
        const total = randomInt(3, 12);
        const target = randomInt(1, total - 1);
        exercises.push(makeNumberLine(makeId(), total, target));
      }
      for (let i = 0; i < 10; i++) {
        const total = randomInt(3, 12);
        const target = randomInt(1, total - 1);
        exercises.push(makeInput(
          makeId(),
          `Entre 0 et 1, la droite est partagée en ${total} intervalles égaux. Écris la fraction du ${target}${target === 1 ? 'er' : 'e'} trait après 0.`,
          fractionText(target, total),
          `Le dénominateur compte ${total} intervalles ; le numérateur compte les ${target} pas depuis 0.`
        ));
      }
      for (let i = 0; i < 8; i++) {
        const total = randomInt(3, 12);
        const target = randomInt(1, total - 1);
        exercises.push(makeQcm(
          makeId(),
          `Sur une droite de 0 à 1 partagée en ${total} intervalles égaux, que représente le ${target}${target === 1 ? 'er' : 'e'} trait après 0 ?`,
          fractionText(target, total),
          makeOptions(fractionText(target, total), [fractionText(target + 1, total), fractionText(target, total - 1), fractionText(total, target)]),
          `Compte les intervalles depuis 0 : ${target} pas sur ${total}.`
        ));
      }
      for (let i = 0; i < 5; i++) {
        const total = randomInt(3, 10);
        exercises.push(makeSlice(makeId(), `Découpe l'unité en ${total} intervalles égaux.`, total, `Sur la droite, l'unité doit contenir ${total} intervalles égaux.`));
      }
      break;
    }

    case 4: {
      // Équivalences, complétion, simplification et comparaison.
      for (let i = 0; i < 10; i++) {
        const base = randomProperFraction(2, 8);
        const factor = randomInt(2, 4);
        const biggerN = base.n * factor;
        const biggerD = base.d * factor;
        exercises.push(makeInput(
          makeId(),
          `Complète : ${base.n}/${base.d} = ?/${biggerD}. Écris le numérateur manquant.`,
          String(biggerN),
          `Le dénominateur est multiplié par ${factor}. Multiplie aussi le numérateur par ${factor}.`
        ));
      }
      for (let i = 0; i < 10; i++) {
        let baseD = randomInt(2, 6);
        let baseN = randomInt(1, baseD - 1);
        while (gcd(baseN, baseD) !== 1) {
          baseD = randomInt(2, 6);
          baseN = randomInt(1, baseD - 1);
        }
        const factor = randomInt(2, 4);
        const n = baseN * factor;
        const d = baseD * factor;
        exercises.push(makeInput(
          makeId(),
          `Simplifie ${n}/${d}. Écris la fraction simplifiée.`,
          reducedFractionText(n, d),
          `Divise le numérateur ${n} et le dénominateur ${d} par leur diviseur commun ${factor} si possible.`
        ));
      }
      for (let i = 0; i < 8; i++) {
        const base = randomProperFraction(2, 5);
        const factor = randomInt(2, Math.min(4, Math.floor(12 / base.d)));
        const total = base.d * factor;
        const target = base.n * factor;
        exercises.push(makeColor(
          makeId(),
          `Colorie ${target} part(s) sur ${total}. Cette quantité est équivalente à ${base.n}/${base.d}.`,
          total,
          target,
          `Multiplie le numérateur et le dénominateur de ${base.n}/${base.d} par ${factor}.`
        ));
      }
      for (let i = 0; i < 10; i++) {
        const n = randomInt(1, 4);
        const d = randomInt(n + 1, 6);
        const factor = choose([2, 3, 4]);
        const leftN = n;
        const leftD = d;
        const rightN = n * factor;
        const rightD = d * factor;
        exercises.push(makeComparison(
          makeId(),
          `Quel symbole convient ? ${leftN}/${leftD} __ ${rightN}/${rightD}`,
          '=',
          'Les nombres du haut et du bas ont été multipliés par le même nombre : la quantité ne change pas.',
          [{ numerator: leftN, denominator: leftD }, { numerator: rightN, denominator: rightD }]
        ));
      }
      for (let i = 0; i < 5; i++) {
        const n = randomInt(1, 5);
        const factor = randomInt(2, 5);
        const correct = fractionText(n, n * factor);
        exercises.push(makeQcm(
          makeId(),
          `Quelle est la forme simplifiée de ${n}/${n * factor} ?`,
          reducedFractionText(n, n * factor),
          makeOptions(reducedFractionText(n, n * factor), [correct, fractionText(n, factor), fractionText(n * factor, n)]),
          'Divise le numérateur et le dénominateur par le même facteur.'
        ));
      }
      break;
    }

    case 5: {
      // Comparer : dénominateur commun, numérateur commun, équivalences et ordre.
      for (let i = 0; i < 14; i++) {
        const d = randomInt(4, 12);
        let a = randomInt(1, d - 1);
        let b = randomInt(1, d - 1);
        if (a === b) b = a === d - 1 ? a - 1 : a + 1;
        const symbol = compareNumbers(a, b);
        exercises.push(makeComparison(
          makeId(),
          `Quel symbole convient ? ${a}/${d} __ ${b}/${d}`,
          symbol,
          'Les dénominateurs sont identiques : les parts ont la même taille. Compare les numérateurs.',
          [{ numerator: a, denominator: d }, { numerator: b, denominator: d }]
        ));
      }
      for (let i = 0; i < 10; i++) {
        const n = randomInt(1, 4);
        const d1 = randomInt(n + 2, 12);
        const possibleDenominators = Array.from({ length: 12 - n }, (_, index) => n + 1 + index)
          .filter((denominator) => denominator !== d1);
        const d2 = choose(possibleDenominators);
        const symbol = compareNumbers(n / d1, n / d2);
        exercises.push(makeComparison(
          makeId(),
          `Quel symbole convient ? ${n}/${d1} __ ${n}/${d2}`,
          symbol,
          'Le numérateur est identique : les parts les plus grandes correspondent au plus petit dénominateur.',
          [{ numerator: n, denominator: d1 }, { numerator: n, denominator: d2 }]
        ));
      }
      for (let i = 0; i < 10; i++) {
        const base = randomProperFraction(2, 8);
        const factor = randomInt(2, 4);
        const equivalent = { n: base.n * factor, d: base.d * factor };
        exercises.push(makeComparison(
          makeId(),
          `Quel symbole convient ? ${base.n}/${base.d} __ ${equivalent.n}/${equivalent.d}`,
          '=',
          'Les deux fractions sont équivalentes : on a multiplié le haut et le bas par le même nombre.',
          [{ numerator: base.n, denominator: base.d }, { numerator: equivalent.n, denominator: equivalent.d }]
        ));
      }
      for (let i = 0; i < 10; i++) {
        const d = randomInt(4, 12);
        let a = randomInt(1, d - 1);
        let b = randomInt(1, d - 1);
        if (a === b) b = a === d - 1 ? a - 1 : a + 1;
        const larger = a > b ? fractionText(a, d) : fractionText(b, d);
        exercises.push(makeInput(
          makeId(),
          `Écris la plus grande fraction : ${a}/${d} ou ${b}/${d}.`,
          larger,
          `Les dénominateurs sont égaux : compare ${a} et ${b}. Le plus grand numérateur donne la plus grande fraction.`
        ));
      }
      for (let i = 0; i < 6; i++) {
        const d = randomInt(3, 10);
        const n = randomInt(1, d - 1);
        exercises.push(makeColor(makeId(), `Représente ${n}/${d} pour pouvoir comparer cette quantité à d'autres fractions.`, d, n, `Colorie ${n} part(s) sur ${d}.`));
      }
      break;
    }

    case 6: {
      // Fractions décimales et conversions dans les deux sens.
      for (let i = 0; i < 14; i++) {
        const denominator: 10 | 100 = Math.random() < 0.5 ? 10 : 100;
        const n = randomInt(1, denominator - 1);
        const decimal = formatDecimal(n, denominator);
        exercises.push(makeInput(
          makeId(),
          `Écris ${n}/${denominator} sous forme de nombre décimal.`,
          decimal,
          denominator === 10
            ? `Le dénominateur est 10 : écris ${n} au rang des dixièmes.`
            : `Le dénominateur est 100 : écris deux chiffres après la virgule. Pour ${n} centièmes, utilise ${decimal}.`
        ));
      }
      for (let i = 0; i < 12; i++) {
        const denominator: 10 | 100 = Math.random() < 0.5 ? 10 : 100;
        const n = randomInt(1, denominator - 1);
        const decimal = formatDecimal(n, denominator);
        exercises.push(makeInput(
          makeId(),
          `Écris ${decimal} sous forme de fraction décimale.`,
          fractionText(n, denominator),
          denominator === 10
            ? 'Un chiffre après la virgule correspond ici à des dixièmes : le dénominateur est 10.'
            : 'Deux chiffres après la virgule correspondent à des centièmes : le dénominateur est 100.'
        ));
      }
      for (let i = 0; i < 12; i++) {
        const a = randomInt(1, 98);
        let b = randomInt(1, 98);
        if (b === a) b = a === 98 ? 97 : a + 1;
        const da = a / 100;
        const db = b / 100;
        const left = `0,${String(a).padStart(2, '0')}`;
        const right = `0,${String(b).padStart(2, '0')}`;
        exercises.push(makeComparison(
          makeId(),
          `Quel symbole convient ? ${left} __ ${right}`,
          compareNumbers(da, db),
          'Compare les chiffres après la virgule en respectant leur rang : dixièmes, puis centièmes.'
        ));
      }
      for (let i = 0; i < 8; i++) {
        const n = randomInt(1, 9);
        const decimal = `0,${n}`;
        exercises.push(makeQcm(
          makeId(),
          `Quelle écriture correspond à ${n}/10 ?`,
          decimal,
          makeOptions(decimal, [`0,0${n}`, `${n},0`, `0,${Math.min(9, n + 1)}`]),
          'Le dénominateur 10 signifie que le chiffre est placé au rang des dixièmes.'
        ));
      }
      for (let i = 0; i < 6; i++) {
        const n = randomInt(1, 9);
        exercises.push(makeColor(makeId(), `Représente ${n}/10 en coloriant les dixièmes nécessaires.`, 10, n, `Colorie ${n} parts sur les 10 parts égales.`));
      }
      break;
    }

    case 7: {
      // Additions et soustractions avec même dénominateur.
      for (let i = 0; i < 16; i++) {
        const d = randomInt(5, 12);
        const a = randomInt(1, d - 2);
        const b = randomInt(1, d - a);
        exercises.push(makeInput(
          makeId(),
          `Calcule : ${a}/${d} + ${b}/${d}. Écris le résultat sous forme de fraction.`,
          fractionText(a + b, d),
          `Les parts ont la même taille : calcule ${a} + ${b} en haut et garde ${d} en bas.`
        ));
      }
      for (let i = 0; i < 16; i++) {
        const d = randomInt(5, 12);
        const a = randomInt(2, d);
        const b = randomInt(1, a - 1);
        exercises.push(makeInput(
          makeId(),
          `Calcule : ${a}/${d} − ${b}/${d}. Écris le résultat sous forme de fraction.`,
          fractionText(a - b, d),
          `Retire ${b} parts des ${a} parts : calcule ${a} − ${b} en haut et garde ${d} en bas.`
        ));
      }
      for (let i = 0; i < 10; i++) {
        const d = randomInt(5, 12);
        const a = randomInt(1, d - 2);
        const b = randomInt(1, d - a);
        const isAddition = Math.random() < 0.5;
        const operation = isAddition ? '+' : '−';
        const start = isAddition ? a : Math.min(d, a + b);
        const removed = isAddition ? b : b;
        const expectedN = isAddition ? a + b : start - removed;
        exercises.push(makeQcm(
          makeId(),
          isAddition
            ? `Quel est le résultat de ${a}/${d} + ${b}/${d} ?`
            : `Quel est le résultat de ${start}/${d} − ${removed}/${d} ?`,
          fractionText(expectedN, d),
          makeOptions(fractionText(expectedN, d), [fractionText(expectedN, d + 1), fractionText(expectedN + 1, d), fractionText(Math.abs(a - b), d)]),
          `Les dénominateurs sont identiques : ${operation === '+' ? 'additionne' : 'soustrais'} les numérateurs et garde ${d} au dénominateur.`
        ));
      }
      for (let i = 0; i < 8; i++) {
        const d = randomInt(4, 10);
        const target = randomInt(1, d);
        exercises.push(makeColor(makeId(), `Représente ${target}/${d} en coloriant les parts nécessaires.`, d, target, `Colorie ${target} part(s) parmi ${d}.`));
      }
      for (let i = 0; i < 5; i++) {
        exercises.push(makeQcm(
          makeId(),
          'Quand on additionne ou soustrait deux fractions de même dénominateur, que fait-on du dénominateur ?',
          'on le garde',
          ['on le garde', 'on l’additionne', 'on le multiplie', 'on le remplace par 1'],
          'Les parts gardent la même taille : le dénominateur ne change pas.'
        ));
      }
      break;
    }

    case 8: {
      // Additions et soustractions : dénominateur commun obtenu par équivalence.
      const denominatorPairs: Array<[number, number]> = [[2, 3], [2, 4], [2, 5], [3, 4], [3, 6], [3, 8], [4, 6], [4, 8], [4, 10], [5, 10], [6, 8], [6, 12]];
      for (let i = 0; i < 20; i++) {
        let [d1, d2] = choose(denominatorPairs);
        if (Math.random() < 0.5) [d1, d2] = [d2, d1];
        let n1 = randomInt(1, d1 - 1);
        let n2 = randomInt(1, d2 - 1);
        const isAddition = Math.random() < 0.65;
        // En soustraction, choisir deux valeurs différentes et mettre la plus grande en premier.
        if (!isAddition) {
          let safety = 0;
          while (Math.abs(n1 / d1 - n2 / d2) < 1e-9 && safety < 20) {
            n2 = randomInt(1, d2 - 1);
            safety += 1;
          }
          if (Math.abs(n1 / d1 - n2 / d2) < 1e-9) {
            n1 = 1;
            n2 = d2 - 1;
          }
          if (n1 / d1 < n2 / d2) {
            const oldN = n1;
            const oldD = d1;
            n1 = n2;
            d1 = d2;
            n2 = oldN;
            d2 = oldD;
          }
        }
        const common = lcm(d1, d2);
        const scaled1 = n1 * (common / d1);
        const scaled2 = n2 * (common / d2);
        const resultN = isAddition ? scaled1 + scaled2 : scaled1 - scaled2;
        const operation = isAddition ? '+' : '−';
        exercises.push(makeInput(
          makeId(),
          `Calcule : ${n1}/${d1} ${operation} ${n2}/${d2}. Utilise un dénominateur commun et écris la fraction obtenue.`,
          fractionText(resultN, common),
          `Le dénominateur commun est ${common}. Transforme ${n1}/${d1} et ${n2}/${d2} en fractions de dénominateur ${common}, puis ${isAddition ? 'additionne' : 'soustrais'} les numérateurs.`
        ));
      }
      for (let i = 0; i < 12; i++) {
        const d1 = choose([2, 3, 4, 5, 6, 8]);
        const factor = choose([2, 3, 4]);
        const d2 = d1 * factor;
        if (d2 > 24) continue;
        const n = randomInt(1, d1 - 1);
        exercises.push(makeInput(
          makeId(),
          `Complète l'équivalence : ${n}/${d1} = ?/${d2}. Écris le numérateur manquant.`,
          String(n * factor),
          `Le dénominateur ${d1} est multiplié par ${factor} pour devenir ${d2}. Multiplie aussi le numérateur par ${factor}.`
        ));
      }
      for (let i = 0; i < 10; i++) {
        const total = choose([4, 6, 8, 10, 12]);
        const target = randomInt(1, total - 1);
        exercises.push(makeComparison(
          makeId(),
          `Quel symbole convient ? ${target}/${total} __ ${reducedFractionText(target, total)}`,
          '=',
          'Les deux écritures représentent la même quantité : la fraction de droite est simplifiée.'
        ));
      }
      for (let i = 0; i < 8; i++) {
        const correct = 'même dénominateur';
        exercises.push(makeQcm(
          makeId(),
          'Avant d’additionner deux fractions de dénominateurs différents, que faut-il chercher ?',
          correct,
          ['même dénominateur', 'même numérateur', 'un dénominateur égal à zéro', 'des dénominateurs différents'],
          'On transforme les fractions pour compter des parts de même taille.'
        ));
      }
      for (let i = 0; i < 6; i++) {
        const total = choose([4, 6, 8, 10, 12]);
        const target = randomInt(1, total - 1);
        exercises.push(makeColor(makeId(), `Représente ${target}/${total}. Cette représentation t'aidera à visualiser une fraction équivalente.`, total, target, `Colorie ${target} parts sur ${total} parts égales.`));
      }
      break;
    }

    case 9: {
      // Multiplication, inverse et division par une fraction.
      for (let i = 0; i < 16; i++) {
        const a = randomInt(1, 5);
        const b = randomInt(a + 1, 8);
        const c = randomInt(1, 5);
        const d = randomInt(c + 1, 8);
        exercises.push(makeInput(
          makeId(),
          `Calcule : ${a}/${b} × ${c}/${d}. Écris le résultat sans simplifier.`,
          fractionText(a * c, b * d),
          `Multiplie les numérateurs : ${a} × ${c}. Puis multiplie les dénominateurs : ${b} × ${d}.`,
          'exact'
        ));
      }
      for (let i = 0; i < 14; i++) {
        const a = randomInt(1, 5);
        const b = randomInt(a + 1, 8);
        const c = randomInt(1, 5);
        const d = randomInt(c + 1, 8);
        const resultN = a * d;
        const resultD = b * c;
        exercises.push(makeInput(
          makeId(),
          `Calcule : ${a}/${b} ÷ ${c}/${d}. Écris le résultat sous forme de fraction.`,
          fractionText(resultN, resultD),
          `Garde ${a}/${b}, remplace ÷ par ×, puis inverse la deuxième fraction : ${d}/${c}. Calcule ensuite ${a}/${b} × ${d}/${c}.`
        ));
      }
      for (let i = 0; i < 12; i++) {
        const n = randomInt(1, 8);
        const d = randomInt(n + 1, 10);
        exercises.push(makeQcm(
          makeId(),
          `Quel est l'inverse de ${n}/${d} ?`,
          fractionText(d, n),
          makeOptions(fractionText(d, n), [fractionText(n, d), fractionText(1, d), fractionText(d, d + n)]),
          'L’inverse s’obtient en échangeant le numérateur et le dénominateur.'
        ));
      }
      for (let i = 0; i < 9; i++) {
        if (i % 3 === 0) {
          const correct = 'multiplier les numérateurs entre eux et les dénominateurs entre eux';
          exercises.push(makeQcm(
            makeId(),
            'Pour multiplier deux fractions, quelle règle faut-il appliquer ?',
            correct,
            [correct, 'additionner les numérateurs et les dénominateurs', 'multiplier seulement les nombres du haut', 'chercher toujours un dénominateur commun'],
            'Multiplie les nombres du haut entre eux, puis les nombres du bas entre eux.'
          ));
        } else if (i % 3 === 1) {
          exercises.push(makeQcm(
            makeId(),
            'Diviser par une fraction revient à multiplier par…',
            'son inverse',
            ['son inverse', 'son double', 'son opposé', 'son dénominateur seulement'],
            'Remplace la division par une multiplication et inverse la deuxième fraction.'
          ));
        } else {
          const n = randomInt(1, 7);
          const d = randomInt(n + 1, 10);
          exercises.push(makeQcm(
            makeId(),
            `Quel est l’inverse de ${n}/${d} ?`,
            fractionText(d, n),
            makeOptions(fractionText(d, n), [fractionText(n, d), fractionText(1, d), fractionText(d, d + n)]),
            'Échange le numérateur et le dénominateur : le haut passe en bas et le bas passe en haut.'
          ));
        }
      }
      for (let i = 0; i < 8; i++) {
        const total = choose([4, 6, 8, 10, 12]);
        const target = randomInt(1, total - 1);
        exercises.push(makeColor(makeId(), `Représente ${target}/${total} en coloriant les parts nécessaires.`, total, target, `Colorie ${target} parts sur ${total}.`));
      }
      for (let i = 0; i < 5; i++) {
        exercises.push(makeSlice(makeId(), 'Une moitié contient combien de quarts ? Règle le compteur sur ce nombre.', 2, 'Une moitié correspond à deux quarts : 1/2 = 2/4.'));
      }
      break;
    }

    default:
      return makeSessionPool(1);
  }

  return exercises;
}

export class ExerciseGenerator {
  /**
   * Produit une session avec un choix équilibré des types d'exercices.
   * Les données sont régénérées à chaque appel pour renouveler les questions.
   */
  static generateSession(floorId: string, count = 10): Exercise[] {
    const parsed = Number.parseInt(String(floorId).match(/\d+/)?.[0] ?? '1', 10);
    const floor = Number.isFinite(parsed) ? Math.min(9, Math.max(1, parsed)) : 1;
    const requestedCount = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 10;
    const pool = makeSessionPool(floor);

    if (requestedCount <= pool.length) {
      return this.selectBalanced(pool, requestedCount);
    }

    const selected = this.selectBalanced(pool, pool.length);
    let round = 1;
    while (selected.length < requestedCount) {
      const extraPool = makeSessionPool(floor);
      const needed = Math.min(extraPool.length, requestedCount - selected.length);
      const extra = this.selectBalanced(extraPool, needed);
      selected.push(...extra.map((exercise, index) => ({
        ...exercise,
        id: `${exercise.id}-r${round}-${index + 1}`
      })));
      round++;
    }
    return selected;
  }

  private static selectBalanced(pool: Exercise[], count: number): Exercise[] {
    const groups = new Map<ExerciseType, Exercise[]>();
    for (const exercise of shuffle(pool)) {
      const group = groups.get(exercise.type) ?? [];
      group.push(exercise);
      groups.set(exercise.type, group);
    }

    const types = shuffle([...groups.keys()]);
    const selected: Exercise[] = [];
    while (selected.length < count) {
      let added = false;
      for (const type of types) {
        const exercise = groups.get(type)?.pop();
        if (!exercise) continue;
        selected.push(exercise);
        added = true;
        if (selected.length >= count) break;
      }
      if (!added) break;
    }
    return shuffle(selected);
  }
}
