/**
 * Adaptateur TypeScript autour du moteur pédagogique historique.
 * Le moteur est isolé dans engine-legacy.js afin de conserver la même logique
 * de génération et de correction que celle testée dans le prototype autonome.
 */
import './engine-legacy.js';

type MesuroviaEngineApi = {
  FAMILIES: Record<string, { label: string; base: string; units: Record<string, number> }>;
  VILLAGES: Array<{ id: string; name: string; subtitle: string; palette: string[]; story: string }>;
  HOUSE_SETS: Record<string, Array<[string, string, string[], string]>>;
  LESSONS: Record<string, Array<Record<string, any>>>;
  listHouses: (villageId: string) => Array<{ index: number; id: string; title: string; families: string[]; subtitle: string; icon: string }>;
  lessonForHouse: (houseId: string, villageId: string) => Array<Record<string, any>>;
  convert: (value: number, family: string, from: string, to: string) => number;
  makeQuestion: (family: string, difficulty?: number, opts?: Record<string, unknown>) => any;
  checkAnswer: (question: any, rawAnswer: unknown) => boolean;
  normalizeAnswer: (value: unknown) => string;
  createAdaptiveState: (difficulty?: number) => any;
  updateAdaptive: (state: any, correct: boolean, helped?: boolean) => any;
  pretestRecommendation: (results: any) => any;
  startingDifficulty: (villageId: string, family: string, pretest?: any) => number;
  fmt: (value: number) => string;
  availableFormats: (family: string) => string[];
  tableUnitsFor: (family: string) => string[];
};

declare global {
  // Déclaré par engine-legacy.js après son import latéral.
  // eslint-disable-next-line no-var
  var MesuEngine: MesuroviaEngineApi | undefined;
}

function getMesuroviaEngine(): MesuroviaEngineApi {
  const loadedEngine = globalThis.MesuEngine;
  if (!loadedEngine) {
    throw new Error('Le moteur Mesurovia n’a pas été chargé. Vérifie engine-legacy.js.');
  }
  return loadedEngine;
}

// L'annotation explicite évite que TypeScript propage "undefined" aux composants Svelte.
const api: MesuroviaEngineApi = getMesuroviaEngine();

export default api;
export type { MesuroviaEngineApi };
