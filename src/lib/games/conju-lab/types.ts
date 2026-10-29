/**
 * Types partagés par ConjuLab.
 * Les identifiants des temps sont stables : ils sont utilisés par les données,
 * le moteur d'exercices et l'interface Svelte.
 */
export type Grade = '6H' | '7H' | '8H' | '9H';
export type VerbGroup = 1 | 2 | 3;
export type AnswerStyle = 'mixte' | 'qcm' | 'saisie';
export type ActivityFocus = 'mixte' | 'conjuguer' | 'identifier' | 'personnes' | 'groupes' | 'radicaux';

export type TenseId =
  | 'present'
  | 'imparfait'
  | 'futurSimple'
  | 'passeCompose'
  | 'conditionnelPresent'
  | 'imperatif'
  | 'plusQueParfait'
  | 'futurAnterieur'
  | 'passeSimple3e'
  | 'subjonctifPresent'
  | 'passeSimple'
  | 'passeAnterieur'
  | 'subjonctifPasse'
  | 'conditionnelPasse';

export type PersonIndex = 0 | 1 | 2 | 3 | 4 | 5;
export type Auxiliary = 'avoir' | 'être';
export type SubjectId = 'je' | 'tu' | 'il' | 'elle' | 'on' | 'nous' | 'vous' | 'ils' | 'elles';

export type SixForms = [string, string, string, string, string, string];
export type ThreeImperativeForms = [string, string, string];

/** Une entrée de verbe contient les exceptions à la règle générale. */
export interface VerbEntry {
  infinitive: string;
  group: VerbGroup;
  minGrade: Grade;
  participePasse: string;
  auxiliary: Auxiliary;
  present: SixForms;
  /** Radical d'imparfait, lorsqu'il ne peut pas être déduit de « nous ». */
  imperfectStem?: string;
  /** Radical du futur / conditionnel (ex. ser-, aur-, viendr-). */
  futureStem: string;
  /** Formes explicites pour les irrégularités de subjonctif présent. */
  subjunctive?: SixForms;
  /** Formes explicites du passé simple pour les verbes du 3e groupe. */
  passeSimple?: SixForms;
  /** Impératif dans l'ordre tu, nous, vous. Absent pour les verbes sans impératif. */
  imperative?: ThreeImperativeForms;
  /** La liste aide à expliquer le modèle ou l'exception à l'élève. */
  note?: string;
  /** Verbe impersonnel : seules certaines personnes peuvent être générées. */
  impersonal?: boolean;
  /** D'autres graphies correctes peuvent être acceptées (ex. certaines formes en -ayer). */
  acceptedAlternatives?: Record<string, string[]>;
}

export interface SubjectOption {
  id: SubjectId;
  label: string;
  personIndex: PersonIndex;
  gender: 'm' | 'f' | 'neutral';
  plural: boolean;
}

export interface TenseInfo {
  id: TenseId;
  label: string;
  shortLabel: string;
  mood: string;
  description: string;
  minGrade: Grade;
  /** Le temps est introduit en reconnaissance partielle en 8H (passé simple 3e personne). */
  recognitionOnlyAt8H?: boolean;
  advanced?: boolean;
}

export type QuestionKind = 'conjuguer' | 'identifier' | 'personne' | 'groupe' | 'terminaison' | 'radical';

/** Une question complète et validée avant affichage. */
export interface VerbQuestion {
  id: string;
  kind: QuestionKind;
  prompt: string;
  sentence: string;
  verb: VerbEntry;
  tense?: TenseId;
  subject?: SubjectOption;
  correctAnswer: string;
  options: string[];
  explanation: string;
  hintSteps: string[];
  feedbackTag: 'groupe' | 'radical' | 'terminaison' | 'temps' | 'personne' | 'auxiliaire' | 'forme' | 'generique';
  /** Dans les questions de terminaison, la forme est explicitement décomposée. */
  displayedStem?: string;
  displayedEnding?: string;
}

export interface EngineConfig {
  grade: Grade;
  focus: ActivityFocus;
  answerStyle: AnswerStyle;
  selectedTenses: TenseId[];
  selectedGroups: VerbGroup[];
  /** Filtre facultatif : une liste vide signifie « tous les verbes des groupes choisis ». */
  selectedInfinitives?: string[];
}

export interface AnswerAnalysis {
  isCorrect: boolean;
  isNearMiss: boolean;
  hint: string;
  explanation: string;
}
