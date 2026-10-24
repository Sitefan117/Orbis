import { getTenseInfo, getTensesForGrade } from './curriculum';
import { getVerbsForGrade } from './verbs';
import type {
  ActivityFocus, AnswerAnalysis, AnswerStyle, EngineConfig, Grade, PersonIndex,
  SubjectId, SubjectOption, TenseId, VerbEntry, VerbGroup, VerbQuestion
} from './types';

const PERSONS: SubjectOption[] = [
  { id: 'je', label: 'je', personIndex: 0, gender: 'neutral', plural: false },
  { id: 'tu', label: 'tu', personIndex: 1, gender: 'neutral', plural: false },
  { id: 'il', label: 'il', personIndex: 2, gender: 'm', plural: false },
  { id: 'elle', label: 'elle', personIndex: 2, gender: 'f', plural: false },
  { id: 'on', label: 'on', personIndex: 2, gender: 'm', plural: false },
  { id: 'nous', label: 'nous', personIndex: 3, gender: 'neutral', plural: true },
  { id: 'vous', label: 'vous', personIndex: 4, gender: 'neutral', plural: true },
  { id: 'ils', label: 'ils', personIndex: 5, gender: 'm', plural: true },
  { id: 'elles', label: 'elles', personIndex: 5, gender: 'f', plural: true }
];

const IMPERATIVE_SUBJECTS: SubjectId[] = ['tu', 'nous', 'vous'];
const IMPERFECT_ENDINGS = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'];
const FUTURE_ENDINGS = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];
const PRESENT_ER_ENDINGS = ['e', 'es', 'e', 'ons', 'ez', 'ent'];
const PRESENT_IR2_ENDINGS = ['is', 'is', 'it', 'issons', 'issez', 'issent'];
const IMPERFECT_ENDING_LABELS = ['-ais', '-ais', '-ait', '-ions', '-iez', '-aient'];
const FUTURE_ENDING_LABELS = ['-ai', '-as', '-a', '-ons', '-ez', '-ont'];

let questionSequence = 0;

function randomItem<T>(items: T[]): T {
  if (items.length === 0) throw new Error('Le moteur ne dispose d’aucun élément pour créer une question.');
  return items[Math.floor(Math.random() * items.length)];
}

/** Mélange Fisher–Yates : contrairement à sort(Math.random), il ne dépend pas d’un comparateur aléatoire. */
function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}


function getPerson(subject: SubjectId): SubjectOption {
  return PERSONS.find((item) => item.id === subject)!;
}

function getVerbByInfinitive(infinitive: 'avoir' | 'être'): VerbEntry {
  const found = getVerbsForGrade('9H').find((verb) => verb.infinitive === infinitive);
  if (!found) throw new Error(`Auxiliaire manquant dans la banque : ${infinitive}`);
  return found;
}

function getPersonCandidates(verb: VerbEntry, tense: TenseId): SubjectOption[] {
  if (tense === 'imperatif') {
    return IMPERATIVE_SUBJECTS.map((id) => getPerson(id));
  }
  if (verb.impersonal) return [getPerson('il')];

  // Avec être, le participe passé s’accorde avec le sujet. On choisit des sujets
  // dont le genre et le nombre sont explicites, sans inventer le genre de « je ».
  if (isCompoundTense(tense) && verb.auxiliary === 'être') {
    return (['il', 'elle', 'ils', 'elles'] as SubjectId[]).map((id) => getPerson(id));
  }
  if (tense === 'passeSimple3e') return (['il', 'elle', 'on', 'ils', 'elles'] as SubjectId[]).map((id) => getPerson(id));
  return [...PERSONS];
}

function isCompoundTense(tense: TenseId): boolean {
  return ['passeCompose', 'plusQueParfait', 'futurAnterieur', 'passeAnterieur', 'subjonctifPasse', 'conditionnelPasse'].includes(tense);
}

function getSimpleForm(verb: VerbEntry, tense: TenseId, index: PersonIndex): string {
  const present = verb.present[index];
  if (tense === 'present') return present;

  if (tense === 'imparfait') {
    const stem = verb.imperfectStem ?? verb.present[3].replace(/ons$/, '');
    return stem ? `${stem}${IMPERFECT_ENDINGS[index]}` : '';
  }

  if (tense === 'futurSimple') {
    return verb.futureStem ? `${verb.futureStem}${FUTURE_ENDINGS[index]}` : '';
  }

  if (tense === 'conditionnelPresent') {
    return verb.futureStem ? `${verb.futureStem}${IMPERFECT_ENDINGS[index]}` : '';
  }

  if (tense === 'subjonctifPresent') {
    if (verb.subjunctive) return verb.subjunctive[index] ?? '';
    const stem = verb.infinitive.slice(0, -2);
    if (verb.group === 1) {
      const endings = ['e', 'es', 'e', 'ions', 'iez', 'ent'];
      return `${stem}${endings[index]}`;
    }
    if (verb.group === 2) {
      const endings = ['isse', 'isses', 'isse', 'issions', 'issiez', 'issent'];
      return `${stem}${endings[index]}`;
    }
    return '';
  }

  if (tense === 'passeSimple' || tense === 'passeSimple3e') {
    if (verb.passeSimple) return verb.passeSimple[index] ?? '';
    const stem = verb.infinitive.slice(0, -2);
    if (verb.group === 1) {
      // -ger garde e devant la terminaison du passé simple ; -cer prend ç devant a.
      let pastStem = stem;
      if (verb.infinitive.endsWith('ger')) pastStem += 'e';
      if (verb.infinitive.endsWith('cer')) pastStem = `${pastStem.slice(0, -1)}ç`;
      return `${pastStem}${['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'][index]}`;
    }
    if (verb.group === 2) {
      return `${stem}${['is', 'is', 'it', 'îmes', 'îtes', 'irent'][index]}`;
    }
    return '';
  }

  return '';
}

function auxiliaryTense(tense: TenseId): TenseId | null {
  switch (tense) {
    case 'passeCompose': return 'present';
    case 'plusQueParfait': return 'imparfait';
    case 'futurAnterieur': return 'futurSimple';
    case 'passeAnterieur': return 'passeSimple';
    case 'subjonctifPasse': return 'subjonctifPresent';
    case 'conditionnelPasse': return 'conditionnelPresent';
    default: return null;
  }
}

function agreePastParticiple(participle: string, subject: SubjectOption): string {
  let result = participle;
  if (subject.gender === 'f' && !result.endsWith('e')) result += 'e';
  if (subject.plural && !result.endsWith('s') && !result.endsWith('x')) result += 's';
  return result;
}

/** Conjugue un verbe pour une personne ; les formes composées sont assemblées à partir de l’auxiliaire. */
export function conjugateForm(verb: VerbEntry, tense: TenseId, subject: SubjectOption): string {
  const index = subject.personIndex;
  if (tense === 'imperatif') {
    if (!verb.imperative) return '';
    const imperativeIndex = subject.id === 'tu' ? 0 : subject.id === 'nous' ? 1 : 2;
    return verb.imperative[imperativeIndex] ?? '';
  }

  if (tense === 'passeSimple3e' && index !== 2 && index !== 5) return '';

  const auxTense = auxiliaryTense(tense);
  if (!auxTense) return getSimpleForm(verb, tense, index);

  const auxiliary = getVerbByInfinitive(verb.auxiliary);
  const auxiliaryForm = getSimpleForm(auxiliary, auxTense, index);
  if (!auxiliaryForm) return '';
  const participle = verb.auxiliary === 'être' ? agreePastParticiple(verb.participePasse, subject) : verb.participePasse;
  return `${auxiliaryForm} ${participle}`;
}


function getTenseCandidates(config: EngineConfig): TenseId[] {
  const gradeTenses = getTensesForGrade(config.grade).map((item) => item.id);
  const selected = config.selectedTenses.filter((item) => gradeTenses.includes(item));
  return selected.length ? selected : gradeTenses;
}

function getEligibleVerbs(config: EngineConfig): VerbEntry[] {
  const gradeVerbs = getVerbsForGrade(config.grade);
  const withSelectedGroups = config.selectedGroups.length
    ? gradeVerbs.filter((verb) => config.selectedGroups.includes(verb.group))
    : gradeVerbs;
  return withSelectedGroups.length ? withSelectedGroups : gradeVerbs;
}

function nextQuestionId(): string {
  questionSequence += 1;
  return `conju-${Date.now()}-${questionSequence}`;
}

function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('fr')
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ');
}

function normalizeWithoutAccents(value: string): string {
  return normalizeAnswer(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getHintSteps(verb: VerbEntry, tense: TenseId, subject: SubjectOption): string[] {
  const info = getTenseInfo(tense);
  const groupHint = `Commence par le groupe : ${verb.infinitive} est du ${verb.group === 1 ? '1er' : verb.group === 2 ? '2e' : '3e'} groupe.`;
  const noteHint = verb.note ?? 'Observe la forme du verbe et recherche le modèle qui lui correspond.';
  let ruleHint = `Temps : ${info.shortLabel}. ${info.description}`;
  if (tense === 'imparfait') ruleHint = 'Pour l’imparfait, pense aux terminaisons : -ais, -ais, -ait, -ions, -iez, -aient.';
  if (tense === 'futurSimple') ruleHint = 'Pour le futur, trouve le radical du futur puis ajoute : -ai, -as, -a, -ons, -ez, -ont.';
  if (tense === 'conditionnelPresent') ruleHint = 'Le conditionnel utilise souvent le radical du futur avec les terminaisons de l’imparfait.';
  if (tense === 'passeCompose') ruleHint = `Le passé composé se construit avec un auxiliaire au présent et le participe passé « ${verb.participePasse} ».`;
  if (tense === 'plusQueParfait') ruleHint = 'Le plus-que-parfait : auxiliaire à l’imparfait + participe passé.';
  if (tense === 'futurAnterieur') ruleHint = 'Le futur antérieur : auxiliaire au futur simple + participe passé.';
  if (tense === 'passeAnterieur') ruleHint = 'Le passé antérieur : auxiliaire au passé simple + participe passé.';
  if (tense === 'subjonctifPasse') ruleHint = 'Le subjonctif passé : auxiliaire au subjonctif présent + participe passé.';
  if (tense === 'conditionnelPasse') ruleHint = 'Le conditionnel passé : auxiliaire au conditionnel présent + participe passé.';
  if (tense === 'imperatif') ruleHint = `À l’impératif, il n’y a pas de pronom sujet. Cherche la forme pour « ${subject.label} ».`;
  return [groupHint, ruleHint, noteHint];
}

function optionsWithCorrect(correct: string, candidates: string[]): string[] {
  const seen = new Set<string>();
  const distinct = candidates.filter((item) => {
    const normalized = normalizeAnswer(item);
    if (!normalized || seen.has(normalized) || normalized === normalizeAnswer(correct)) return false;
    seen.add(normalized);
    return true;
  });
  // On choisit d’abord trois distracteurs, puis on mélange : la bonne réponse
  // ne peut ainsi pas disparaître quand le tableau est tronqué à quatre options.
  return shuffle([correct, ...shuffle(distinct).slice(0, 3)]);
}

/** Affiche correctement l’élision de je devant une forme commençant par une voyelle. */
function formatSubjectForm(subject: SubjectOption, form: string): string {
  if (subject.id === 'je' && /^[aeiouyàâäéèêëîïôöùûüœ]/i.test(form)) return `j’${form}`;
  return `${subject.label} ${form}`;
}

/** Formate la phrase autour d'un verbe sans oublier le « que » du subjonctif. */
function formatFormInContext(tense: TenseId, subject: SubjectOption, form: string): string {
  if (tense === 'imperatif') return form;
  if (tense === 'subjonctifPresent' || tense === 'subjonctifPasse') {
    // Le « que » est indispensable au contexte du subjonctif ; il s'élide devant
    // il, elle, on, ils, elles et devant « je » lorsque la forme commence par une voyelle.
    if (subject.id === 'je') {
      return /^[aeiouyàâäéèêëîïôöùûüœ]/i.test(form) ? `que j’${form}` : `que je ${form}`;
    }
    if (['il', 'elle', 'on', 'ils', 'elles'].includes(subject.id)) return `qu’${subject.label} ${form}`;
    return `que ${subject.label} ${form}`;
  }
  return formatSubjectForm(subject, form);
}

function buildConjugationQuestion(config: EngineConfig): VerbQuestion {
  const allVerbs = getEligibleVerbs(config);
  const tenses = getTenseCandidates(config);
  const candidates: Array<{ verb: VerbEntry; tense: TenseId; subject: SubjectOption; answer: string }> = [];

  for (const verb of allVerbs) {
    for (const tense of tenses) {
      if (tense === 'imperatif' && !verb.imperative) continue;
      for (const subject of getPersonCandidates(verb, tense)) {
        const answer = conjugateForm(verb, tense, subject);
        if (answer) candidates.push({ verb, tense, subject, answer });
      }
    }
  }

  if (!candidates.length) throw new Error('Aucune forme conjugée ne correspond aux critères sélectionnés.');
  const selected = randomItem(candidates);
  const info = getTenseInfo(selected.tense);
  const tenseLabel = `${info.label} · ${selected.verb.group === 1 ? '1er' : selected.verb.group === 2 ? '2e' : '3e'} groupe`;
  let sentence: string;
  if (selected.tense === 'imperatif') {
    sentence = `À l’impératif, complète la forme pour « ${selected.subject.label} » : ________ (${selected.verb.infinitive}).`;
  } else {
    const prefix = selected.subject.id === 'je' && /^[aeiouyàâäéèêëîïôöùûüœ]/i.test(selected.answer)
      ? 'J’'
      : `${selected.subject.label.charAt(0).toLocaleUpperCase('fr')}${selected.subject.label.slice(1)}`;
    if (selected.tense === 'subjonctifPresent' || selected.tense === 'subjonctifPasse') {
      const subjectPhrase = selected.subject.id === 'je' && /^[aeiouyàâäéèêëîïôöùûüœ]/i.test(selected.answer)
        ? 'que j’'
        : ['il', 'elle', 'on', 'ils', 'elles'].includes(selected.subject.id)
          ? `qu’${selected.subject.label}`
          : `que ${selected.subject.label}`;
      sentence = `${subjectPhrase} ________ (${selected.verb.infinitive})`;
    } else {
      const verbPrompt = selected.verb.infinitive === 'sortir' && isCompoundTense(selected.tense)
        ? 'sortir du bâtiment'
        : selected.verb.infinitive;
      sentence = `${prefix} ________ (${verbPrompt})`;
    }
  }

  const distractors: string[] = [];
  for (const verb of allVerbs) {
    for (const subject of getPersonCandidates(verb, selected.tense)) {
      const form = conjugateForm(verb, selected.tense, subject);
      if (form && form !== selected.answer) distractors.push(form);
    }
  }
  // Quelques formes d'autres temps créent de bons distracteurs sans fabriquer de conjugaison inventée.
  for (const otherTense of tenses) {
    if (otherTense === selected.tense) continue;
    const form = conjugateForm(selected.verb, otherTense, selected.subject);
    if (form) distractors.push(form);
  }

  return {
    id: nextQuestionId(),
    kind: 'conjuguer',
    prompt: tenseLabel,
    sentence,
    verb: selected.verb,
    tense: selected.tense,
    subject: selected.subject,
    correctAnswer: selected.answer,
    options: optionsWithCorrect(selected.answer, distractors),
    explanation: explainConjugation(selected.verb, selected.tense, selected.subject, selected.answer),
    hintSteps: getHintSteps(selected.verb, selected.tense, selected.subject),
    feedbackTag: isCompoundTense(selected.tense) ? 'auxiliaire' : 'terminaison'
  };
}

function explainConjugation(verb: VerbEntry, tense: TenseId, subject: SubjectOption, answer: string): string {
  const info = getTenseInfo(tense);
  const groupName = verb.group === 1 ? '1er groupe' : verb.group === 2 ? '2e groupe' : '3e groupe';
  let expected: string;
  if (tense === 'imperatif') {
    expected = `À l’impératif, la forme attendue pour « ${subject.label} » est « ${answer} »`;
  } else {
    expected = `La forme attendue est « ${formatFormInContext(tense, subject, answer)} »`;
  }
  let explanation = `${expected}. ${verb.infinitive} appartient au ${groupName}. ${info.description}`;
  if (verb.note) explanation += ` ${verb.note}`;
  if (isCompoundTense(tense)) explanation += ` Le participe passé de ${verb.infinitive} est « ${verb.participePasse} » ; l’auxiliaire utilisé ici est ${verb.auxiliary}.`;
  return explanation;
}

function buildGroupQuestion(config: EngineConfig): VerbQuestion {
  // Pour apprendre à distinguer les groupes, l'activité compare les trois modèles.
  // Le filtre de groupes s'applique aux exercices de conjugaison, pas à cette classification.
  const verb = randomItem(getVerbsForGrade(config.grade));
  const correctAnswer = `Groupe ${verb.group}`;
  const options = shuffle(['Groupe 1', 'Groupe 2', 'Groupe 3']);
  return {
    id: nextQuestionId(), kind: 'groupe', prompt: 'Classer un verbe', sentence: `Dans quel groupe classes-tu « ${verb.infinitive} » ?`,
    verb, correctAnswer, options,
    explanation: `${verb.infinitive} appartient au ${verb.group === 1 ? '1er groupe (verbes en -er, sauf aller)' : verb.group === 2 ? '2e groupe (verbes en -ir qui suivent le modèle de finir)' : '3e groupe (verbes qui suivent d’autres modèles)'}. ${verb.note ?? ''}`.trim(),
    hintSteps: [
      'Observe la terminaison de l’infinitif, mais ne t’arrête pas uniquement aux deux dernières lettres.',
      'Pour le 2e groupe, vérifie le modèle en -issant : finir → finissant.',
      verb.group === 1 ? 'Le verbe se termine en -er et suit un modèle du 1er groupe.' : verb.group === 2 ? 'Le verbe suit le modèle de finir : -ir à l’infinitif et -issant au participe présent.' : 'Le verbe ne suit pas le modèle régulier du 1er ou du 2e groupe.'
    ],
    feedbackTag: 'groupe'
  };
}

function buildIdentifyQuestion(config: EngineConfig): VerbQuestion {
  const eligibleVerbs = getEligibleVerbs(config);
  // La bonne réponse respecte les temps choisis par l’élève ; les autres temps du niveau
  // peuvent servir de distracteurs même si l’élève n’a pas sélectionné leur entraînement.
  const allTenses = getTensesForGrade(config.grade).map((item) => item.id).filter((tense) => tense !== 'imperatif');
  const targetTenses = getTenseCandidates(config).filter((tense) => tense !== 'imperatif');
  const tenses = targetTenses.length ? targetTenses : allTenses;
  const candidates: Array<{ verb: VerbEntry; tense: TenseId; subject: SubjectOption; form: string }> = [];
  for (const verb of eligibleVerbs) {
    for (const tense of tenses) {
      for (const subject of getPersonCandidates(verb, tense)) {
        const form = conjugateForm(verb, tense, subject);
        if (form) candidates.push({ verb, tense, subject, form });
      }
    }
  }
  const selected = randomItem(candidates);
  const correctAnswer = getTenseInfo(selected.tense).label;
  const otherLabels = allTenses.filter((item) => item !== selected.tense).map((item) => getTenseInfo(item).label);
  const distractors = shuffle(otherLabels).slice(0, 3);
  const options = shuffle([correctAnswer, ...distractors]);
  return {
    id: nextQuestionId(), kind: 'identifier',
    prompt: 'Identifier le temps', sentence: `Forme à analyser : « ${formatFormInContext(selected.tense, selected.subject, selected.form)} » · verbe : ${selected.verb.infinitive}`,
    verb: selected.verb, tense: selected.tense, subject: selected.subject,
    correctAnswer, options,
    explanation: `Cette forme est au ${correctAnswer.toLocaleLowerCase('fr')}. ${getTenseInfo(selected.tense).description} Le verbe est ${selected.verb.infinitive}.`,
    hintSteps: [
      'Observe la forme du verbe : est-elle simple ou composée ?',
      isCompoundTense(selected.tense) ? 'Il s’agit d’un temps composé : repère l’auxiliaire puis le participe passé.' : 'Il s’agit d’un temps simple : regarde les terminaisons et le radical.',
      `${getTenseInfo(selected.tense).shortLabel} : ${getTenseInfo(selected.tense).description}`
    ],
    feedbackTag: 'temps'
  };
}

function buildRadicalQuestion(config: EngineConfig): VerbQuestion {
  const eligible = getEligibleVerbs(config);
  const variableModelNames = new Set([
    'être', 'avoir', 'aller', 'venir', 'tenir', 'prendre', 'comprendre', 'apprendre',
    'faire', 'pouvoir', 'vouloir', 'voir', 'boire', 'recevoir', 'écrire', 'lire',
    'savoir', 'croire', 'dormir', 'partir', 'sortir', 'fuir'
  ]);
  const variableCandidates = eligible.filter((verb) => verb.group === 3 && variableModelNames.has(verb.infinitive));

  if (variableCandidates.length > 0) {
    const verb = randomItem(variableCandidates);
    const [jeForm, nousForm, ilsForm] = [verb.present[0], verb.present[3], verb.present[5]];
    const correctAnswer = 'Le radical varie selon la personne.';
    const options = shuffle([
      correctAnswer,
      'Le radical reste toujours identique : seule la terminaison change.',
      'Le verbe appartient forcément au 2e groupe parce que sa forme finit par -s.',
      'Les trois formes sont des temps différents.'
    ]);
    return {
      id: nextQuestionId(), kind: 'radical', prompt: 'Repérer un radical variable',
      sentence: `Compare : « je ${jeForm} » · « nous ${nousForm} » · « ils ${ilsForm} ». Que faut-il observer ?`,
      verb, tense: 'present', correctAnswer, options,
      explanation: `${verb.infinitive} présente des formes qui ne se construisent pas toutes sur la même base. Observe les formes à plusieurs personnes plutôt que d'appliquer mécaniquement une terminaison. ${verb.note ?? ''}`.trim(),
      hintSteps: [
        'Compare le début des trois formes, pas seulement leur dernière lettre.',
        'Pour certains verbes, la base varie selon la personne : une seule forme mémorisée ne suffit pas.',
        verb.note ?? 'Utilise un tableau de conjugaison pour repérer les différentes bases du verbe.'
      ],
      feedbackTag: 'radical'
    };
  }

  // Le filtre peut ne laisser que les verbes réguliers. Dans ce cas, on conserve
  // une activité pertinente au lieu de forcer artificiellement un verbe du 3e groupe.
  const groupTwo = eligible.filter((verb) => verb.group === 2);
  if (groupTwo.length > 0) {
    const verb = randomItem(groupTwo);
    const stem = verb.infinitive.slice(0, -2);
    const correctAnswer = `Deux bases régulières : ${stem}- au singulier et ${stem}iss- au pluriel.`;
    const [jeForm, nousForm, ilsForm] = [verb.present[0], verb.present[3], verb.present[5]];
    const options = shuffle([
      correctAnswer,
      'Le radical est toujours « iss- » aux six personnes.',
      'Le radical est identique à celui du futur, sans exception.',
      'Le verbe est du 1er groupe parce qu’il finit en -ir.'
    ]);
    return {
      id: nextQuestionId(), kind: 'radical', prompt: 'Observer les bases du 2e groupe',
      sentence: `Compare : « je ${jeForm} » · « nous ${nousForm} » · « ils ${ilsForm} ». Comment fonctionne le modèle de ${verb.infinitive} ?`,
      verb, tense: 'present', correctAnswer, options,
      explanation: `Les verbes du 2e groupe suivent un modèle régulier : ${stem}- au singulier et ${stem}iss- au pluriel au présent. ${verb.infinitive} est du 2e groupe car son participe présent se termine en -issant.`,
      hintSteps: [
        'Compare la forme de « je » avec celle de « nous » et de « ils ».',
        'Les verbes du 2e groupe prennent -issons avec « nous » au présent.',
        `Le modèle de ${verb.infinitive} utilise ${stem}- au singulier et ${stem}iss- au pluriel.`
      ],
      feedbackTag: 'radical'
    };
  }

  const stableGroupOneNames = new Set(['aimer', 'chanter', 'parler', 'jouer', 'regarder', 'danser', 'écouter', 'marcher', 'travailler', 'tomber', 'oublier']);
  const groupOne = eligible.filter((verb) => verb.group === 1 && stableGroupOneNames.has(verb.infinitive));
  if (groupOne.length > 0) {
    const verb = randomItem(groupOne);
    const stem = verb.infinitive.slice(0, -2);
    const [jeForm, nousForm, ilsForm] = [verb.present[0], verb.present[3], verb.present[5]];
    const correctAnswer = `Le radical reste stable : ${stem}- ; les terminaisons changent.`;
    const options = shuffle([
      correctAnswer,
      'Le radical change à chaque personne.',
      'Il faut remplacer le verbe par son participe passé.',
      'Le verbe appartient au 3e groupe parce que « nous » finit en -ons.'
    ]);
    return {
      id: nextQuestionId(), kind: 'radical', prompt: 'Repérer le radical régulier',
      sentence: `Compare : « je ${jeForm} » · « nous ${nousForm} » · « ils ${ilsForm} ». Quelle partie reste stable ?`,
      verb, tense: 'present', correctAnswer, options,
      explanation: `Dans le modèle régulier de ${verb.infinitive}, le radical ${stem}- reste stable ; ce sont surtout les terminaisons qui changent.`,
      hintSteps: [
        'Compare le début des trois formes.',
        'Pour un verbe régulier en -er, les terminaisons changent selon la personne.',
        `Le radical du modèle est ${stem}-.`
      ],
      feedbackTag: 'radical'
    };
  }

  throw new Error('Aucun modèle de radical n’est disponible pour les groupes sélectionnés.');
}

function getEndingFor(verb: VerbEntry, tense: TenseId, index: PersonIndex): string | null {
  if (tense === 'present' && verb.group === 1) return PRESENT_ER_ENDINGS[index];
  if (tense === 'present' && verb.group === 2) return PRESENT_IR2_ENDINGS[index];
  if (tense === 'imparfait') return IMPERFECT_ENDINGS[index];
  if (tense === 'futurSimple') return FUTURE_ENDINGS[index];
  if (tense === 'conditionnelPresent') return IMPERFECT_ENDINGS[index];
  if ((tense === 'passeSimple' || tense === 'passeSimple3e') && verb.group === 1) return ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'][index];
  if ((tense === 'passeSimple' || tense === 'passeSimple3e') && verb.group === 2) return ['is', 'is', 'it', 'îmes', 'îtes', 'irent'][index];
  return null;
}

function buildEndingQuestion(config: EngineConfig): VerbQuestion {
  const allowedTenses = getTenseCandidates(config).filter((tense) => ['present', 'imparfait', 'futurSimple', 'conditionnelPresent', 'passeSimple', 'passeSimple3e'].includes(tense));
  const eligible = getEligibleVerbs(config).filter((verb) =>
    (verb.group === 2 || (verb.group === 1 && !['manger', 'commencer', 'acheter', 'appeler', 'jeter', 'payer', 'envoyer'].includes(verb.infinitive)))
  );
  const candidates: Array<{ verb: VerbEntry; tense: TenseId; subject: SubjectOption; form: string; ending: string }> = [];
  for (const verb of eligible) {
    for (const tense of allowedTenses) {
      for (const subject of getPersonCandidates(verb, tense)) {
        const ending = getEndingFor(verb, tense, subject.personIndex);
        const form = conjugateForm(verb, tense, subject);
        if (ending && form && !isCompoundTense(tense)) candidates.push({ verb, tense, subject, form, ending });
      }
    }
  }
  if (!candidates.length) throw new Error('Aucune terminaison simple ne correspond aux temps et groupes sélectionnés.');
  const selected = randomItem(candidates);
  const stem = selected.form.slice(0, selected.form.length - selected.ending.length);
  const correctAnswer = `-${selected.ending}`;
  const possibleEndings = [...new Set([
    ...PRESENT_ER_ENDINGS, ...PRESENT_IR2_ENDINGS, ...IMPERFECT_ENDING_LABELS.map((x) => x.slice(1)),
    ...FUTURE_ENDING_LABELS.map((x) => x.slice(1)), 'âmes', 'âtes', 'èrent', 'is', 'it', 'îmes', 'îtes', 'irent'
  ])].map((ending) => `-${ending}`).filter((ending) => ending !== correctAnswer);
  return {
    id: nextQuestionId(), kind: 'terminaison', prompt: `Radical et terminaison · ${getTenseInfo(selected.tense).shortLabel}`,
    sentence: `Dans « ${formatFormInContext(selected.tense, selected.subject, selected.form)} », on peut lire : ${stem} + ______`,
    verb: selected.verb, tense: selected.tense, subject: selected.subject, correctAnswer,
    options: shuffle([correctAnswer, ...shuffle(possibleEndings).slice(0, 3)]),
    explanation: `Pour « ${formatFormInContext(selected.tense, selected.subject, selected.form)} », la terminaison ciblée est « ${correctAnswer} ». ${getTenseInfo(selected.tense).description}`,
    hintSteps: [
      'La terminaison est la partie qui vient après le radical dans le découpage proposé.',
      `Pour ce temps, observe le modèle de terminaison du ${selected.verb.group === 1 ? '1er' : '2e'} groupe ou les marques habituelles du temps.`,
      `Rappelle-toi les terminaisons du ${getTenseInfo(selected.tense).shortLabel.toLocaleLowerCase('fr')}.`
    ],
    feedbackTag: 'terminaison', displayedStem: stem, displayedEnding: selected.ending
  };
}

function focusToKind(focus: ActivityFocus): Array<'conjuguer' | 'identifier' | 'groupe' | 'terminaison' | 'radical'> {
  switch (focus) {
    case 'conjuguer': return ['conjuguer'];
    case 'identifier': return ['identifier'];
    case 'groupes': return ['groupe'];
    case 'radicaux': return ['terminaison', 'radical'];
    default: return ['conjuguer', 'identifier', 'groupe', 'terminaison', 'radical'];
  }
}

/** Génère une question adaptée au niveau et au choix de l'élève, sans s'appuyer sur un hasard non validé. */
export function generateQuestion(config: EngineConfig): VerbQuestion {
  const kinds = focusToKind(config.focus);
  const builders = {
    conjuguer: buildConjugationQuestion,
    identifier: buildIdentifyQuestion,
    groupe: buildGroupQuestion,
    terminaison: buildEndingQuestion,
    radical: buildRadicalQuestion
  };
  const errors: unknown[] = [];
  for (let attempt = 0; attempt < 25; attempt++) {
    const kind = randomItem(kinds);
    try {
      const question = builders[kind](config);
      if (validateQuestion(question)) return question;
    } catch (error) {
      errors.push(error);
    }
  }
  // Dernier filet de sécurité : une question de conjugaison simple, jamais une réponse vide.
  try {
    const fallback: EngineConfig = { ...config, focus: 'conjuguer', selectedTenses: ['present'], selectedGroups: [1, 2, 3] };
    const question = buildConjugationQuestion(fallback);
    if (validateQuestion(question)) return question;
  } catch (error) {
    errors.push(error);
  }
  throw new Error(`Impossible de construire une question valide (${errors.length} échec(s)).`);
}

/** Validation structurelle minimale réalisée avant chaque affichage. */
export function validateQuestion(question: VerbQuestion): boolean {
  if (!question.id || !question.prompt || !question.sentence || !question.correctAnswer.trim()) return false;
  if (question.options.length < 2 || question.options.length > 4) return false;
  if (new Set(question.options.map(normalizeAnswer)).size !== question.options.length) return false;
  if (!question.options.some((option) => normalizeAnswer(option) === normalizeAnswer(question.correctAnswer))) return false;
  if (question.kind !== 'groupe' && !question.tense) return false;
  return true;
}

/** Valide une réponse et propose une indication fondée sur la nature probable de l'erreur. */
export function analyseAnswer(question: VerbQuestion, rawAnswer: string): AnswerAnalysis {
  const given = normalizeAnswer(rawAnswer);
  const expected = normalizeAnswer(question.correctAnswer);
  const alternatives = question.verb.acceptedAlternatives?.[question.tense ?? ''] ?? [];
  const altForPerson = alternatives[question.subject?.personIndex ?? -1];
  const acceptedAlternative = altForPerson && normalizeAnswer(altForPerson) === given;
  if (given === expected || acceptedAlternative) {
    return { isCorrect: true, isNearMiss: false, hint: 'Exact : tu as trouvé la bonne forme.', explanation: question.explanation };
  }

  // Les accents restent importants en français, mais on identifie une réponse proche pour pouvoir l'expliquer.
  if (given && normalizeWithoutAccents(given) === normalizeWithoutAccents(expected)) {
    return { isCorrect: false, isNearMiss: true, hint: 'Ta réponse est très proche : vérifie les accents et l’orthographe exacte de la forme.', explanation: question.explanation };
  }

  if (question.kind === 'groupe') {
    return {
      isCorrect: false, isNearMiss: false,
      hint: 'Vérifie d’abord l’infinitif. Le 2e groupe suit le modèle finir → finissant ; aller, même en -er, appartient au 3e groupe.',
      explanation: question.explanation
    };
  }

  if (question.kind === 'radical') {
    return { isCorrect: false, isNearMiss: false, hint: 'Compare le début de plusieurs formes du même verbe. Dans le 3e groupe, le radical peut changer selon la personne.', explanation: question.explanation };
  }

  if (question.kind === 'terminaison') {
    return { isCorrect: false, isNearMiss: false, hint: 'Regarde la personne et le temps, puis repère la partie finale de la forme. Le radical et la terminaison ne jouent pas le même rôle.', explanation: question.explanation };
  }

  if (question.kind === 'identifier') {
    return { isCorrect: false, isNearMiss: false, hint: 'Demande-toi si la forme est simple ou composée. Dans un temps composé, repère l’auxiliaire et le participe passé.', explanation: question.explanation };
  }

  if (question.tense && isCompoundTense(question.tense)) {
    return { isCorrect: false, isNearMiss: false, hint: 'Sépare les deux parties : l’auxiliaire donne la personne et le temps ; le participe passé complète la forme.', explanation: question.explanation };
  }

  if (question.subject) {
    const otherPersonForm = PERSONS
      .filter((person) => person.id !== question.subject!.id)
      .map((person) => conjugateForm(question.verb, question.tense!, person))
      .some((form) => form && normalizeAnswer(form) === given);
    if (otherPersonForm) {
      return { isCorrect: false, isNearMiss: false, hint: `Cette forme ressemble à celle d’une autre personne. Relis le sujet : « ${question.subject.label} ».`, explanation: question.explanation };
    }
  }

  return { isCorrect: false, isNearMiss: false, hint: question.hintSteps[1] ?? 'Repère le temps, le sujet et le modèle du verbe, puis essaie de nouveau.', explanation: question.explanation };
}

export function isAllowedTense(grade: Grade, tense: TenseId): boolean {
  return getTensesForGrade(grade).some((item) => item.id === tense);
}

/** Fonction exposée pour les tests : vérifie que les formes d'un verbe sont effectivement calculables. */
export function getAvailableForms(grade: Grade): Array<{ infinitive: string; tense: TenseId; subject: SubjectId; form: string }> {
  const forms: Array<{ infinitive: string; tense: TenseId; subject: SubjectId; form: string }> = [];
  const verbs = getVerbsForGrade(grade);
  const tenses = getTensesForGrade(grade);
  for (const verb of verbs) {
    for (const tense of tenses) {
      for (const subject of getPersonCandidates(verb, tense.id)) {
        const form = conjugateForm(verb, tense.id, subject);
        if (form) forms.push({ infinitive: verb.infinitive, tense: tense.id, subject: subject.id, form });
      }
    }
  }
  return forms;
}

/**
 * Résout le style de réponse d'une question de conjugaison : le mix alterne
 * QCM et saisie libre. Les autres activités gardent leur format QCM.
 */
export function resolveAnswerStyle(style: AnswerStyle, question: VerbQuestion): 'qcm' | 'saisie' {
  if (question.kind !== 'conjuguer') return 'qcm';
  if (style === 'qcm' || style === 'saisie') return style;
  return Math.random() < 0.5 ? 'qcm' : 'saisie';
}

export function getGradeFocusLabel(focus: ActivityFocus): string {
  const labels: Record<ActivityFocus, string> = {
    mixte: 'Mission mixte', conjuguer: 'Conjuguer', identifier: 'Identifier les temps', groupes: 'Groupes de verbes', radicaux: 'Radicaux et terminaisons'
  };
  return labels[focus];
}

export function getGroupFromAnswer(answer: string): VerbGroup | null {
  const match = answer.match(/groupe\s*([123])/i);
  return match ? (Number(match[1]) as VerbGroup) : null;
}
