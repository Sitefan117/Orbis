/** Génère les questions de Racer sans dépendre de Three.js ni de son interface. */
export type PracticeLevel = 'guided' | 'standard' | 'challenge';

export type Notion =
  | 'livrets'
  | 'doubles'
  | 'triples'
  | 'quadruples'
  | 'complements10'
  | 'complements100'
  | 'complements1000'
  | 'dizaineSuivante'
  | 'centaineSuivante'
  | 'millierSuivant'
  | 'trous'
  | 'divisions';

export interface QuestionBase {
  notion: Notion;
  notionLabel: string;
  questionText: string;
  fullFormula: string;
  answer: number;
  factKey: string;
}

export interface GateOption {
  text: string;
  isCorrect: boolean;
  lane: number;
}

export interface GateQuestion {
  base: QuestionBase;
  questionText: string;
  fullFormula: string;
  gates: GateOption[];
}

export interface FactStat {
  attempts: number;
  correct: number;
  streak: number;
  lastSeen: number;
  formula: string;
  level: PracticeLevel;
  /** Garder la question permet de reproposer les faits encore fragiles. */
  base: QuestionBase;
}

// Petits outils communs utilisés par les générateurs de notions.
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function choose<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 0 }).format(value);
}

// Transforme une notion choisie en question stable, formule de correction et clé de suivi.
export function makeQuestionBase(
  notion: Notion,
  practiceLevel: PracticeLevel,
  notionLabels: Record<Notion, string>,
  selectedTables: number[] = []
): QuestionBase {
  let questionText = '';
  let fullFormula = '';
  let answer = 0;
  let factKey = '';

  if (notion === 'livrets') {
    const tables = selectedTables.length > 0 ? selectedTables : Array.from({ length: 11 }, (_, index) => index + 2);
    const a = choose(tables);
    const b = randomInt(1, 12);
    answer = a * b;
    questionText = `${a} × ${b}`;
    fullFormula = `${a} × ${b} = ${answer}`;
    factKey = `livrets:${Math.min(a, b)}x${Math.max(a, b)}`;
  } else if (notion === 'doubles') {
    const range = practiceLevel === 'guided' ? 12 : practiceLevel === 'standard' ? 50 : 100;
    const value = randomInt(2, range);
    const isDouble = Math.random() < 0.65;
    answer = isDouble ? value * 2 : value;
    questionText = isDouble ? `Double de ${value}` : `Moitié de ${value * 2}`;
    fullFormula = isDouble ? `${value} × 2 = ${answer}` : `${value * 2} ÷ 2 = ${answer}`;
    factKey = isDouble ? `double:${value}` : `moitie:${value * 2}`;
  } else if (notion === 'triples') {
    const range = practiceLevel === 'guided' ? 10 : practiceLevel === 'standard' ? 30 : 60;
    const value = randomInt(2, range);
    answer = value * 3;
    questionText = `Triple de ${value}`;
    fullFormula = `${value} × 3 = ${answer}`;
    factKey = `triple:${value}`;
  } else if (notion === 'quadruples') {
    const range = practiceLevel === 'guided' ? 8 : practiceLevel === 'standard' ? 25 : 50;
    const value = randomInt(2, range);
    answer = value * 4;
    questionText = `Quadruple de ${value}`;
    fullFormula = `${value} × 4 = ${answer}`;
    factKey = `quadruple:${value}`;
  } else if (notion === 'complements10') {
    const value = randomInt(1, 9);
    answer = 10 - value;
    questionText = `De ${value} à 10 : combien manque-t-il ?`;
    fullFormula = `${value} + ${answer} = 10`;
    factKey = `complement10:${value}`;
  } else if (notion === 'complements100') {
    const value = practiceLevel === 'guided' ? randomInt(1, 9) * 10 : randomInt(1, 99);
    answer = 100 - value;
    questionText = `De ${value} à 100 : combien manque-t-il ?`;
    fullFormula = `${value} + ${answer} = 100`;
    factKey = `complement100:${value}`;
  } else if (notion === 'complements1000') {
    const value = practiceLevel === 'guided' ? randomInt(1, 9) * 100 : randomInt(1, 999);
    answer = 1000 - value;
    questionText = `De ${formatNumber(value)} à 1 000 : combien manque-t-il ?`;
    fullFormula = `${formatNumber(value)} + ${formatNumber(answer)} = ${formatNumber(1000)}`;
    factKey = `complement1000:${value}`;
  } else if (notion === 'dizaineSuivante') {
    const minValue = practiceLevel === 'challenge' ? 101 : 11;
    const maxValue = practiceLevel === 'guided' ? 89 : practiceLevel === 'standard' ? 99 : 999;
    const value = randomInt(minValue, maxValue);
    const target = (Math.floor(value / 10) + 1) * 10;
    answer = target - value;
    questionText = `Ajoute combien : ${formatNumber(value)} → ${formatNumber(target)} ?`;
    fullFormula = `${formatNumber(value)} + ${formatNumber(answer)} = ${formatNumber(target)}`;
    factKey = `dizaineSuivante:${value}`;
  } else if (notion === 'centaineSuivante') {
    const minValue = practiceLevel === 'challenge' ? 1001 : 101;
    const maxValue = practiceLevel === 'guided' ? 599 : practiceLevel === 'standard' ? 999 : 9899;
    const value = randomInt(minValue, maxValue);
    const target = (Math.floor(value / 100) + 1) * 100;
    answer = target - value;
    questionText = `Ajoute combien : ${formatNumber(value)} → ${formatNumber(target)} ?`;
    fullFormula = `${formatNumber(value)} + ${formatNumber(answer)} = ${formatNumber(target)}`;
    factKey = `centaineSuivante:${value}`;
  } else if (notion === 'millierSuivant') {
    const minValue = practiceLevel === 'challenge' ? 10001 : 1001;
    const maxValue = practiceLevel === 'guided' ? 4999 : practiceLevel === 'standard' ? 9999 : 98999;
    const value = randomInt(minValue, maxValue);
    const target = (Math.floor(value / 1000) + 1) * 1000;
    answer = target - value;
    questionText = `Ajoute combien : ${formatNumber(value)} → ${formatNumber(target)} ?`;
    fullFormula = `${formatNumber(value)} + ${formatNumber(answer)} = ${formatNumber(target)}`;
    factKey = `millierSuivant:${value}`;
  } else if (notion === 'trous') {
    const tables = selectedTables.length > 0 ? selectedTables : Array.from({ length: 11 }, (_, index) => index + 2);
    const a = choose(tables);
    const b = randomInt(1, 12);
    const product = a * b;
    const hideA = Math.random() < 0.5;
    answer = hideA ? a : b;
    questionText = hideA ? `? × ${b} = ${product}` : `${a} × ? = ${product}`;
    fullFormula = `${a} × ${b} = ${product}`;
    factKey = `trou:${Math.min(a, b)}x${Math.max(a, b)}`;
  } else {
    const tables = selectedTables.length > 0 ? selectedTables : Array.from({ length: 11 }, (_, index) => index + 2);
    const a = choose(tables);
    const b = randomInt(1, 12);
    const product = a * b;
    const divisor = Math.random() < 0.5 ? a : b;
    answer = product / divisor;
    questionText = `${product} ÷ ${divisor}`;
    fullFormula = `${divisor} × ${answer} = ${product}`;
    factKey = `division:${product}div${divisor}`;
  }

  return { notion, notionLabel: notionLabels[notion], questionText, fullFormula, answer, factKey };
}

// Crée deux réponses plausibles, puis mélange les voies en conservant la bonne réponse.
export function buildChoices(base: QuestionBase): GateOption[] {
  const answer = base.answer;
  const candidates = [
    answer + 1, answer - 1, answer + 2, answer - 2,
    answer + 5, answer - 5, answer + 10, answer - 10,
    answer * 2, Math.floor(answer / 2), answer + 3, answer + 4,
    answer + 7, answer + 9, answer + 20
  ];
  const uniqueWrong = [...new Set(candidates.filter((value) => Number.isInteger(value) && value > 0 && value !== answer))];

  let offset = 3;
  while (uniqueWrong.length < 2) {
    const candidate = answer + offset;
    if (candidate > 0 && candidate !== answer && !uniqueWrong.includes(candidate)) uniqueWrong.push(candidate);
    offset++;
  }

  const values = [answer, uniqueWrong[0], uniqueWrong[1]];
  for (let index = values.length - 1; index > 0; index--) {
    const swapIndex = randomInt(0, index);
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }

  return values.map((value, lane) => ({ text: String(value), isCorrect: value === answer, lane }));
}
