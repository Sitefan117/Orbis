import type { Grade, MissionMode, Question, QuestionKind } from './types';
import { getRealm } from './curriculum';

export type RandomSource = () => number;
const random: RandomSource = Math.random;
const int = (min: number, max: number, rng: RandomSource = random): number => Math.floor(rng() * (max - min + 1)) + min;
const pick = <T>(items: T[], rng: RandomSource = random): T => items[int(0, items.length - 1, rng)];
const swiss = (value: number): string => Math.trunc(value).toLocaleString('de-CH').replace(/[’']/g, '’');
const decimal = (value: number, places = 3): string => value.toFixed(places).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
const fixedDecimal = (value: number, places: number): string => value.toFixed(places).replace('.', ',');

interface Draft {
  kind: QuestionKind;
  prompt: string;
  expected: string | number;
  options?: string[];
  hint: string;
  explanation: string;
  errorFamily: string;
  line?: Question['line'];
}

function choice(prompt: string, expected: string | number, options: Array<string | number>, hint: string, explanation: string, errorFamily: string): Draft {
  const answer = String(expected);
  const unique = Array.from(new Set(options.map(String)));
  while (unique.length < 4) unique.push(String(int(1, 99)));
  return { kind: 'choice', prompt, expected: answer, options: shuffle(unique).slice(0, 4), hint, explanation, errorFamily };
}
function input(prompt: string, expected: string | number, hint: string, explanation: string, errorFamily: string): Draft {
  return { kind: 'input', prompt, expected: String(expected), hint, explanation, errorFamily };
}
function lineQuestion(prompt: string, expected: string | number, min: number, max: number, hint: string, explanation: string, errorFamily: string): Draft {
  const target = Number(expected);
  const distractors = new Set<number>([target]);
  while (distractors.size < 4) {
    const step = Math.max(1, Math.round((max - min) / 10));
    distractors.add(Math.max(min, Math.min(max, target + int(-3, 3) * step)));
  }
  const answerLabel = swiss(target);
  return { kind: 'numberline', prompt, expected: answerLabel, options: shuffle([...distractors].map(swiss)), hint, explanation, errorFamily, line: { min, max, target, label: `${swiss(min)} à ${swiss(max)}` } };
}
function shuffle<T>(items: T[], rng: RandomSource = random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = int(0, i, rng);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const WORD_NUMBER_EXAMPLES = [
  { words: 'trois mille quarante-deux', value: 3042 },
  { words: 'douze mille cinq cent huit', value: 12508 },
  { words: 'cent vingt mille soixante', value: 120060 },
  { words: 'deux cent cinq mille neuf', value: 205009 },
  { words: 'quatre millions trente-deux mille sept', value: 4032007 },
  { words: 'six millions deux cent mille quarante', value: 6200040 },
  { words: 'septante-quatre mille trois cent douze', value: 74312 },
  { words: 'neuf cent mille quatre-vingt-un', value: 900081 }
];

function buildDraft(realmId: string, rng: RandomSource, challenge = false): Draft {
  switch (realmId) {
    case '6h-collections': {
      const tens = challenge ? int(12, 89, rng) : int(2, 9, rng); const units = int(1, 9, rng); const total = tens * 10 + units;
      return choice(`Tu as ${tens} paquets de 10 pierres et ${units} pierres seules. Combien de pierres en tout ?`, total,
        [total, total + 10, tens + units, tens * 100 + units], 'Chaque paquet représente dix pierres : calcule les dizaines, puis ajoute les unités.', `${tens} dizaines = ${tens * 10}. Puis ${tens * 10} + ${units} = ${total}.`, 'regroupement');
    }
    case '6h-runes': {
      const maximum = challenge ? 99999 : 9999;
      const values = [int(1000, maximum, rng), int(1000, maximum, rng), int(1000, maximum, rng), int(1000, maximum, rng)];
      const answer = String(Math.max(...values));
      return choice(`Quelle rune représente le plus grand nombre ?`, swiss(Number(answer)), values.map(swiss), 'Compare d’abord les milliers, puis les centaines si nécessaire.', `${swiss(Number(answer))} est le plus grand : en comparant les chiffres de gauche à droite, aucun autre nombre ne le dépasse.`, 'comparaison');
    }
    case '6h-horizon': {
      const interval = pick(challenge ? [{ min: 0, max: 1000 }, { min: 1000, max: 5000 }, { min: 0, max: 10000 }] : [{ min: 0, max: 100 }, { min: 0, max: 1000 }, { min: 1000, max: 2000 }], rng);
      const step = (interval.max - interval.min) / 10;
      const position = int(1, 9, rng); const answer = interval.min + position * step;
      return lineQuestion(`Sur la droite graduée de ${swiss(interval.min)} à ${swiss(interval.max)}, le repère est au ${position}e pas sur 10. Quelle valeur indique-t-il ?`, answer, interval.min, interval.max,
        'Compte les intervalles égaux depuis la borne de gauche. Un pas vaut l’écart total divisé par 10.', `Un pas vaut (${swiss(interval.max)} − ${swiss(interval.min)}) ÷ 10 = ${swiss(step)}. Après ${position} pas : ${swiss(answer)}.`, 'droite-graduee');
    }
    case '6h-atelier': {
      const choices = challenge ? [100000, 10000, 1000, 100, 10, 1] : [1000, 100, 10, 1];
      const labels = new Map<number, string>([[100000, 'centaines de milliers'], [10000, 'dizaines de milliers'], [1000, 'milliers'], [100, 'centaines'], [10, 'dizaines'], [1, 'unités']]);
      const place = pick(choices, rng);
      const number = challenge
        ? int(1, 9, rng) * 100000 + int(0, 9, rng) * 10000 + int(0, 9, rng) * 1000 + int(0, 9, rng) * 100 + int(0, 9, rng) * 10 + int(0, 9, rng)
        : int(1, 9, rng) * 1000 + int(0, 9, rng) * 100 + int(0, 9, rng) * 10 + int(0, 9, rng);
      const digit = Math.floor(number / place) % 10;
      return input(`Dans ${swiss(number)}, quelle valeur représente le chiffre ${digit} ? (Écris la valeur, par exemple 3’000.)`, digit * place,
        `Regarde la position du ${digit} : ${labels.get(place)}. Multiplie le chiffre par la valeur de ce rang.`, `Le chiffre ${digit} est à la place des ${labels.get(place)}. Il vaut donc ${digit} × ${swiss(place)} = ${swiss(digit * place)}.`, 'valeur-position');
    }
    case '6h-seuils': {
      const base = pick(challenge ? [10000, 100000, 1000000] : [100, 1000, 9999], rng); const answer = base + 1;
      const options = [answer, base - 1, base, base - 10];
      return choice(`Quel est le plus petit nombre entier strictement supérieur à ${swiss(base)} ?`, swiss(answer), options.map(swiss), '« Strictement supérieur » signifie plus grand, mais pas égal. Cherche le nombre entier qui vient juste après la borne.', `Le plus petit entier strictement supérieur à ${swiss(base)} est ${swiss(base)} + 1 = ${swiss(answer)}.`, 'seuil');
    }
    case '7h-rangs': {
      const number = int(100000, challenge ? 99999999 : 9999999, rng); const str = String(number); const digitIndex = int(0, str.length - 2, rng); const digit = Number(str[digitIndex]);
      const place = 10 ** (str.length - digitIndex - 1); const value = digit * place;
      return input(`Dans ${swiss(number)}, quelle valeur représente le chiffre ${digit} ?`, value,
        'Le rang dépend de la position en partant de la droite : unités, dizaines, centaines, milliers…', `Le chiffre ${digit} est au rang ${swiss(place)}. Sa valeur est ${digit} × ${swiss(place)} = ${swiss(value)}.`, 'valeur-position');
    }
    case '7h-intervalles': {
      const lower = int(challenge ? 12000 : 1200, challenge ? 98000 : 9800, rng) * 10; const gap = challenge ? 200 : 1000; const upper = lower + gap; const answer = lower + gap / 2;
      return input(`Quel nombre se trouve exactement au milieu entre ${swiss(lower)} et ${swiss(upper)} ?`, answer,
        'Le milieu est à la même distance de chaque borne : ajoute la moitié de l’écart à la borne inférieure.', `L’écart est ${swiss(upper - lower)}. Sa moitié vaut ${swiss((upper - lower) / 2)}. Donc ${swiss(lower)} + ${swiss((upper - lower) / 2)} = ${swiss(answer)}.`, 'intercalation');
    }
    case '7h-extraction': {
      const number = int(10000, challenge ? 99999999 : 999999, rng); const ranks = [{ name: 'dizaines', value: 10 }, { name: 'centaines', value: 100 }, { name: 'milliers', value: 1000 }];
      if (challenge) ranks.push({ name: 'dizaines de milliers', value: 10000 });
      const rank = pick(ranks, rng);
      const answer = Math.floor(number / rank.value);
      return input(`Combien de ${rank.name} entières contient ${swiss(number)} ?`, answer,
        `Ici, on demande le nombre de groupes entiers de ${rank.name}, pas seulement le chiffre de ce rang.`, `${swiss(number)} ÷ ${swiss(rank.value)} = ${answer} groupes entiers de ${rank.name}.`, 'extraction-rang');
    }
    case '7h-fractions': {
      const denominator = pick([2, 3, 4, 5, 8, 10], rng); const numerator = int(1, denominator - 1, rng);
      const equivalents: Record<string, string> = { '1/2': '5/10', '2/4': '1/2', '3/4': '6/8', '1/4': '2/8', '2/5': '4/10', '3/5': '6/10' };
      const challengePair = pick([{ from: '1/2', to: '5/10' }, { from: '2/4', to: '1/2' }, { from: '3/4', to: '6/8' }, { from: '1/4', to: '2/8' }, { from: '2/5', to: '4/10' }, { from: '3/5', to: '6/10' }], rng);
      const frac = challenge ? challengePair.from : `${numerator}/${denominator}`; const known = challenge ? challengePair.to : equivalents[frac];
      if (known) {
        const wrongOptions: Record<string, string[]> = {
          '1/2': ['1/3', '1/4', '3/4'], '2/4': ['2/3', '1/4', '3/4'],
          '3/4': ['3/8', '2/4', '7/8'], '1/4': ['1/8', '1/2', '3/8'],
          '2/5': ['2/10', '5/10', '4/5'], '3/5': ['3/10', '5/10', '4/5']
        };
        const choicesForAnswer = (wrongOptions[frac] ?? [`${numerator}/${denominator + 1}`, `${Math.max(1, numerator - 1)}/${denominator}`, `${numerator + 1}/${denominator}`]).concat(known);
        return choice(`Quelle fraction représente la même quantité que ${frac} ?`, known, choicesForAnswer, 'Une fraction équivalente garde la même quantité : on multiplie ou divise le numérateur et le dénominateur par le même nombre.', `Pour passer de ${frac} à ${known}, on multiplie le numérateur et le dénominateur par le même facteur.`, 'fractions-equivalentes');
      }
      return choice(`Une tablette est partagée en ${denominator} parts égales. On en prend ${numerator}. Quelle fraction a été prise ?`, frac, [frac, `${denominator}/${numerator}`, `${numerator}/${denominator + 1}`, `${numerator + 1}/${denominator}`], 'Le numérateur compte les parts prises ; le dénominateur compte toutes les parts égales.', `On prend ${numerator} part(s) sur ${denominator} : la fraction est ${frac}.`, 'lecture-fraction');
    }
    case '7h-decimaux': {
      const denom = pick(challenge ? [10, 100, 1000] : [10, 100], rng); const numerator = int(1, denom - 1, rng); const value = numerator / denom;
      const places = denom === 10 ? 1 : denom === 100 ? 2 : 3;
      const expected = fixedDecimal(value, places);
      return choice(`Quelle écriture décimale correspond à ${numerator}/${denom} ?`, expected, [expected, fixedDecimal(Math.min(1, value + 1 / denom), places), fixedDecimal(value / 10, 3), fixedDecimal(1 - value, places)], '10 parts égales correspondent à des dixièmes ; 100 parts égales à des centièmes ; 1’000 parts égales à des millièmes.', `${numerator}/${denom} = ${expected}. Le nombre de chiffres après la virgule permet de repérer le rang utilisé.`, 'conversion-decimale');
    }
    case '8h-grands-nombres': {
      const millions = int(1, 8, rng); const thousands = int(0, 999, rng); const units = int(0, 999, rng);
      const answer = millions * 1000000000 + thousands * 1000 + units;
      return input(`Défi d’extension : dans ${swiss(answer)}, quelle valeur représente le chiffre des milliards (${millions}) ?`, millions * 1000000000,
        'Les grands nombres sont organisés en classes de trois chiffres. Ici, le chiffre indiqué est au rang des milliards.', `${millions} milliard(s) correspond(ent) à ${swiss(millions * 1000000000)}. Ce royaume est un défi d’extension et non un prérequis du parcours principal.`, 'grands-nombres');
    }
    case '8h-mots': {
      const example = pick(WORD_NUMBER_EXAMPLES, rng);
      const distractors = [example.value, example.value + 100, Math.max(0, example.value - 1000), example.value + 10000];
      return choice(`Quelle écriture chiffrée correspond à « ${example.words} » ?`, swiss(example.value), distractors.map(swiss), 'Repère les classes annoncées (millions, milliers, unités), puis assemble-les en groupes de trois chiffres.', `« ${example.words} » s’écrit ${swiss(example.value)}. Les groupes absents sont représentés par des zéros.`, 'mots-nombres');
    }
    case '8h-intercalation': {
      const hundredths = int(10, 89, rng); const lower = hundredths / 100; const answer = Number((lower + 0.005).toFixed(3)); const upper = lower + 0.01;
      return input(`Écris un nombre au millième situé exactement au milieu entre ${fixedDecimal(lower, 2)} et ${fixedDecimal(upper, 2)}.`, fixedDecimal(answer, 3),
        'Écris les deux bornes avec trois chiffres après la virgule, puis cherche la valeur à égale distance.', `${decimal(lower, 3)} et ${decimal(upper, 3)} sont séparés de 0,010. La moitié vaut 0,005 : le milieu est ${decimal(answer, 3)}.`, 'intercalation-decimale');
    }
    case '8h-milliemes': {
      const numerator = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 25, 37, 125, 250, 406, 725, 999], rng);
      const expected = fixedDecimal(numerator / 1000, 3);
      return choice(`Quelle écriture décimale correspond à ${numerator}/1000 ?`, expected, [expected, fixedDecimal(numerator / 100, 3), fixedDecimal(numerator / 10, 3), fixedDecimal(numerator / 1000 + 0.01, 3)], 'Un millième occupe le troisième rang après la virgule. Conserve les zéros utiles.', `${numerator}/1000 = ${expected}. Par exemple, 7/1000 = 0,007, pas 0,7.`, 'milliemes');
    }
    case '8h-extraction': {
      const integer = int(10, 99, rng); const tenths = int(1, 9, rng); const hundredths = int(0, 9, rng); const thousandths = int(1, 9, rng);
      const number = `${integer},${tenths}${hundredths}${thousandths}`;
      const rank = pick([{ name: 'dixièmes', digit: tenths, factor: 0.1 }, { name: 'centièmes', digit: hundredths, factor: 0.01 }, { name: 'millièmes', digit: thousandths, factor: 0.001 }], rng);
      return input(`Dans ${number}, quelle valeur représente le chiffre des ${rank.name} ?`, decimal(rank.digit * rank.factor, 3),
        `Le rang demandé est celui des ${rank.name}. Demande-toi combien vaut un seul chiffre à cet endroit.`, `Le chiffre ${rank.digit} est au rang des ${rank.name} : sa valeur est ${rank.digit} × ${decimal(rank.factor, 3)} = ${decimal(rank.digit * rank.factor, 3)}.`, 'valeur-rang-decimal');
    }
    default:
      return input('Combien font 7 dizaines ?', 70, 'Une dizaine vaut 10 unités.', '7 × 10 = 70.', 'regroupement');
  }
}

export function normalizeAnswer(value: string | number): string {
  return String(value)
    .trim()
    .toLocaleLowerCase('fr-CH')
    .replace(/[\s’' _]/g, '')
    .replace(/,/g, '.')
    .replace(/−/g, '-');
}

/** Compare nombres, décimaux et fractions simples sans pénaliser la virgule française. */
export function answersEqual(given: string, expected: string): boolean {
  const a = normalizeAnswer(given);
  const b = normalizeAnswer(expected);
  // Une fraction avec dénominateur nul est invalide, même si les chaînes sont identiques.
  const hasZeroDenominator = (value: string) => {
    const match = value.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    return Boolean(match && Number(match[2]) === 0);
  };
  if (hasZeroDenominator(a) || hasZeroDenominator(b)) return false;
  if (a === b) return true;
  const parseFraction = (value: string): number | null => {
    const match = value.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    if (!match) return null;
    const numerator = Number(match[1]); const denominator = Number(match[2]);
    return denominator === 0 ? null : numerator / denominator;
  };
  const fa = parseFraction(a); const fb = parseFraction(b);
  const na = fa ?? (a !== '' && Number.isFinite(Number(a)) ? Number(a) : null);
  const nb = fb ?? (b !== '' && Number.isFinite(Number(b)) ? Number(b) : null);
  if (na === null || nb === null) return false;
  return Math.abs(na - nb) < 1e-9;
}

/** Génère 5 exercices d'entraînement ou 7 exercices du gardien, sur la même compétence. */
export function generateQuestions(grade: Grade, realmId: string, mode: MissionMode, rng: RandomSource = random): Question[] {
  const realm = getRealm(realmId);
  if (!realm || realm.grade !== grade) throw new Error(`Royaume inconnu ou incompatible avec ${grade}: ${realmId}`);
  const total = mode === 'training' ? 5 : 7;
  return Array.from({ length: total }, (_, index) => {
    // Le gardien propose des valeurs plus étendues ou une seconde lecture de la même compétence.
    const draft = buildDraft(realmId, rng, mode === 'guardian');
    return { ...draft, id: `${realmId}-${mode}-${index + 1}`, realmId, grade, expected: String(draft.expected) };
  });
}
