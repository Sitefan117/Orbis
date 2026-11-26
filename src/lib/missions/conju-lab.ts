import { getTensesForGrade, getTenseInfo } from '$lib/conju-lab/curriculum';
import type { ActivityFocus, AnswerStyle, Grade, PlayPath, TenseId, VerbGroup } from '$lib/conju-lab/types';

export interface ConjuLabMissionConfiguration {
  schemaVersion: 1;
  grade: Grade;
  playPath: PlayPath;
  focus: ActivityFocus;
  answerStyle: AnswerStyle;
  selectedTenses: TenseId[];
  selectedGroups: VerbGroup[];
}

const grades: Grade[] = ['6H', '7H', '8H', '9H'];
const paths: PlayPath[] = ['guide', 'libre'];
const focuses: ActivityFocus[] = ['mixte', 'conjuguer', 'identifier', 'groupes', 'radicaux'];
const answerStyles: AnswerStyle[] = ['mixte', 'qcm', 'saisie'];

export const DEFAULT_CONJU_LAB_CONFIGURATION: ConjuLabMissionConfiguration = {
  schemaVersion: 1,
  grade: '6H',
  playPath: 'guide',
  focus: 'mixte',
  answerStyle: 'mixte',
  selectedTenses: ['present', 'imparfait', 'futurSimple', 'passeCompose'],
  selectedGroups: [1, 2, 3]
};

export function normalizeConjuLabConfiguration(value: unknown): ConjuLabMissionConfiguration | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (!grades.includes(raw.grade as Grade) || !paths.includes(raw.playPath as PlayPath) || !focuses.includes(raw.focus as ActivityFocus) || !answerStyles.includes(raw.answerStyle as AnswerStyle)) return null;
  const grade = raw.grade as Grade;
  const allowedTenses = new Set(getTensesForGrade(grade).map((tense) => tense.id));
  const selectedTenses = [...new Set((Array.isArray(raw.selectedTenses) ? raw.selectedTenses : [])
    .filter((tense): tense is TenseId => typeof tense === 'string' && allowedTenses.has(tense as TenseId)))];
  const selectedGroups = [...new Set((Array.isArray(raw.selectedGroups) ? raw.selectedGroups : []).map(Number)
    .filter((group): group is VerbGroup => group === 1 || group === 2 || group === 3))];
  if (selectedTenses.length === 0 || selectedGroups.length === 0) return null;
  return { schemaVersion: 1, grade, playPath: raw.playPath as PlayPath, focus: raw.focus as ActivityFocus, answerStyle: raw.answerStyle as AnswerStyle, selectedTenses, selectedGroups };
}

export function summarizeConjuLabConfiguration(configuration: ConjuLabMissionConfiguration): string[] {
  return [configuration.grade, configuration.playPath === 'guide' ? 'Parcours guidé' : 'Accès libre', configuration.selectedTenses.map((tense) => getTenseInfo(tense).shortLabel).join(', '), `Groupes ${configuration.selectedGroups.join(', ')}`, configuration.answerStyle === 'mixte' ? 'Réponses variées' : configuration.answerStyle === 'qcm' ? 'Choix multiples' : 'Réponse écrite'];
}
