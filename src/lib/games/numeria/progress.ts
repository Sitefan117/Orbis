import type { ActiveMissionSave, Grade, Question, QuestionOutcome, RealmProgress, StudentSave } from './types';
import { REALMS } from './curriculum';

/** Le code d'accès est un verrou pédagogique local, pas une sécurité serveur. */
export const TEACHER_ACCESS_CODE = 'NUMERIA-ENSEIGNANT';
const STORAGE_PREFIX = 'numeria_save_sveltekit_v2::';
const LEGACY_STORAGE_KEY = 'numeria_save_sveltekit_v1';

export function studentStorageKey(name: string): string {
  // L'Unicode est encodé dans la clé : « José » et « Jose » ne se partagent pas la sauvegarde.
  const normalized = name.trim().normalize('NFC').replace(/\s+/g, ' ').toLocaleLowerCase('fr-CH') || 'visiteur';
  return `${STORAGE_PREFIX}${encodeURIComponent(normalized)}`;
}

export function emptyRealmProgress(): RealmProgress {
  return { trainingBest: 0, guardianBest: 0, guardianWon: false, codexUnlocked: false, attempts: 0, totalCorrect: 0 };
}

export function createEmptySave(studentName: string, grade: Grade = '6H'): StudentSave {
  const realms: Record<string, RealmProgress> = {};
  for (const realm of REALMS) realms[realm.id] = emptyRealmProgress();
  return {
    schemaVersion: 3,
    studentName: studentName.trim() || 'Visiteur',
    grade,
    xp: 0,
    completedRealms: [],
    teacherBypassRealms: [],
    realms,
    codexEntries: [],
    activeMission: undefined,
    updatedAt: new Date().toISOString()
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isQuestion(value: unknown, realmId: string, grade: Grade): value is Question {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && value.realmId === realmId
    && value.grade === grade
    && (value.kind === 'choice' || value.kind === 'input' || value.kind === 'numberline')
    && typeof value.prompt === 'string'
    && typeof value.expected === 'string'
    && typeof value.hint === 'string'
    && typeof value.explanation === 'string'
    && typeof value.errorFamily === 'string'
    && (value.options === undefined || (Array.isArray(value.options) && value.options.every((option) => typeof option === 'string')));
}

function isQuestionOutcome(value: unknown): value is QuestionOutcome {
  if (!isRecord(value)) return false;
  return typeof value.solved === 'boolean'
    && typeof value.firstTry === 'boolean'
    && Number.isInteger(value.mistakes)
    && Number(value.mistakes) >= 0;
}

function sanitizeActiveMission(value: unknown): ActiveMissionSave | undefined {
  if (!isRecord(value)) return undefined;
  const realmId = typeof value.realmId === 'string' ? value.realmId : '';
  const grade = value.grade;
  const mode = value.mode;
  const questions = value.questions;
  const outcomes = value.outcomes;
  const questionIndex = Number(value.questionIndex);
  const attemptsForQuestion = Number(value.attemptsForQuestion);
  const feedback = value.feedback;

  if (!REALMS.some((realm) => realm.id === realmId)
    || !isGrade(grade)
    || (mode !== 'training' && mode !== 'guardian')
    || !Array.isArray(questions)
    || questions.length === 0
    || questions.length > 20
    || !questions.every((question) => isQuestion(question, realmId, grade))
    || !Number.isInteger(questionIndex)
    || questionIndex < 0
    || questionIndex >= questions.length
    || !Number.isInteger(attemptsForQuestion)
    || attemptsForQuestion < 0
    || !Array.isArray(outcomes)
    || outcomes.length !== questions.length
    || !outcomes.every(isQuestionOutcome)
    || typeof value.answer !== 'string'
    || typeof value.showHint !== 'boolean'
    || (feedback !== 'none' && feedback !== 'try-again' && feedback !== 'success' && feedback !== 'reveal')
    || typeof value.feedbackText !== 'string'
    || typeof value.questionFinished !== 'boolean') {
    return undefined;
  }

  return {
    realmId,
    grade,
    mode,
    questions,
    questionIndex,
    answer: value.answer,
    attemptsForQuestion,
    showHint: value.showHint,
    feedback,
    feedbackText: value.feedbackText,
    questionFinished: value.questionFinished,
    outcomes,
    savedAt: typeof value.savedAt === 'string' ? value.savedAt : new Date().toISOString()
  };
}

/** Corrige les champs manquants quand la sauvegarde est plus ancienne ou partielle. */
function sanitizeSave(raw: unknown, studentName: string, fallbackGrade: Grade): StudentSave | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const candidateName = String(value.studentName ?? value.playerName ?? studentName).trim();
  if (candidateName.toLocaleLowerCase('fr-CH') !== studentName.trim().toLocaleLowerCase('fr-CH')) return null;
  const rawGrade = value.grade ?? value.selectedGrade;
  const save = createEmptySave(candidateName, isGrade(rawGrade) ? rawGrade : fallbackGrade);
  save.xp = finiteNumber(value.xp, 0);
  save.completedRealms = stringArray(value.completedRealms);
  save.teacherBypassRealms = stringArray(value.teacherBypassRealms);
  save.codexEntries = stringArray(value.codexEntries);
  save.activeMission = sanitizeActiveMission(value.activeMission);
  save.updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString();

  const rawRealms = value.realms;
  if (rawRealms && typeof rawRealms === 'object') {
    for (const [realmId, rawProgress] of Object.entries(rawRealms as Record<string, unknown>)) {
      if (!(realmId in save.realms) || !rawProgress || typeof rawProgress !== 'object') continue;
      const progress = rawProgress as Record<string, unknown>;
      save.realms[realmId] = {
        trainingBest: clampScore(progress.trainingBest),
        guardianBest: clampScore(progress.guardianBest),
        guardianWon: Boolean(progress.guardianWon),
        codexUnlocked: Boolean(progress.codexUnlocked),
        attempts: Math.max(0, Math.trunc(finiteNumber(progress.attempts, 0))),
        totalCorrect: Math.max(0, Math.trunc(finiteNumber(progress.totalCorrect, 0))),
        ...(typeof progress.lastPlayedAt === 'string' ? { lastPlayedAt: progress.lastPlayedAt } : {})
      };
    }
  }
  // Compatibilité avec une ancienne sauvegarde qui ne stockait qu'une progression simple.
  if (!value.realms && value.progress && typeof value.progress === 'object') {
    const oldProgress = value.progress as Record<string, unknown>;
    for (const [realmId, old] of Object.entries(oldProgress)) {
      if (!(realmId in save.realms) || !old || typeof old !== 'object') continue;
      const p = old as Record<string, unknown>;
      save.realms[realmId] = {
        ...save.realms[realmId],
        trainingBest: clampScore(p.trainingBest ?? p.training ?? p.score),
        guardianBest: clampScore(p.guardianBest ?? p.boss),
        guardianWon: Boolean(p.guardianWon ?? p.bossCompleted),
        codexUnlocked: Boolean(p.codexUnlocked ?? p.codex),
        attempts: Math.max(0, Math.trunc(finiteNumber(p.attempts, 0))),
        totalCorrect: Math.max(0, Math.trunc(finiteNumber(p.totalCorrect, 0)))
      };
    }
  }
  return save;
}

function isGrade(value: unknown): value is Grade { return value === '6H' || value === '7H' || value === '8H'; }
function finiteNumber(value: unknown, fallback: number): number { const number = Number(value); return Number.isFinite(number) ? number : fallback; }
function clampScore(value: unknown): number { return Math.max(0, Math.min(7, Math.trunc(finiteNumber(value, 0)))); }
function stringArray(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }

/**
 * La sauvegarde est séparée par nom d'élève et reste locale à ce navigateur.
 * Si une ancienne sauvegarde est retrouvée, on la migre sans écraser une autre personne.
 */
export function loadSave(studentName: string, fallbackGrade: Grade = '6H'): StudentSave {
  if (typeof localStorage === 'undefined') return createEmptySave(studentName, fallbackGrade);
  const key = studentStorageKey(studentName);
  try {
    const current = localStorage.getItem(key);
    if (current) {
      const parsed = sanitizeSave(JSON.parse(current), studentName, fallbackGrade);
      if (parsed) return parsed;
    }
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy) as Record<string, unknown>;
      const nested = (parsedLegacy.state && typeof parsedLegacy.state === 'object') ? parsedLegacy.state as Record<string, unknown> : parsedLegacy;
      const legacyName = String(nested.studentName ?? nested.playerName ?? '').trim();
      const migrated = legacyName.toLocaleLowerCase('fr-CH') === studentName.trim().toLocaleLowerCase('fr-CH')
        ? sanitizeSave(nested, studentName, fallbackGrade)
        : null;
      if (migrated) {
        saveProgress(migrated);
        return migrated;
      }
    }
  } catch (error) {
    console.warn('[Numéria] La sauvegarde locale est illisible ; une nouvelle sauvegarde sera créée.', error);
  }
  return createEmptySave(studentName, fallbackGrade);
}

export function saveProgress(save: StudentSave): void {
  save.updatedAt = new Date().toISOString();
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(studentStorageKey(save.studentName), JSON.stringify(save));
  } catch (error) {
    // Le jeu reste jouable même si le navigateur bloque le stockage.
    console.warn('[Numéria] Sauvegarde impossible dans ce navigateur.', error);
  }
}

export function clearProgress(studentName: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(studentStorageKey(studentName));
    // Une ancienne sauvegarde globale ne doit pas réapparaître après l'effacement.
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Record<string, unknown>;
      const nested = (parsed.state && typeof parsed.state === 'object') ? parsed.state as Record<string, unknown> : parsed;
      const legacyName = String(nested.studentName ?? nested.playerName ?? '').trim();
      if (legacyName.toLocaleLowerCase('fr-CH') === studentName.trim().toLocaleLowerCase('fr-CH')) {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
  } catch (error) { console.warn('[Numéria] Impossible d’effacer la sauvegarde locale.', error); }
}
