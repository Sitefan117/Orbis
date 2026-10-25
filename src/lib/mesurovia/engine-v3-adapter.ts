/**
 * Adaptateur Mesurovia V3 avec un nom de module volontairement distinct.
 *
 * Pourquoi ce fichier existe : la page Svelte importait auparavant
 * "$lib/mesurovia/engine". Dans le projet local, TypeScript résolvait encore
 * cet import vers un ancien contrat qui déclarait le moteur comme optionnel
 * et ne connaissait pas availableFormats/tableUnitsFor.
 *
 * Cet adaptateur possède son propre type, vérifie le moteur à l'exécution et
 * évite de dépendre de l'ancien type MesuroviaEngineApi.
 */
import './engine-legacy.js';

type MesuroviaEngineApiV3 = {
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
  /** Formats pédagogiques proposés par le générateur de questions. */
  availableFormats: (family: string) => string[];
  /** Unités affichables dans le tableau de conversion pour cette grandeur. */
  tableUnitsFor: (family: string) => string[];
};

type MesuroviaGlobal = typeof globalThis & {
  MesuEngine?: MesuroviaEngineApiV3;
};

function loadMesuroviaEngine(): MesuroviaEngineApiV3 {
  const api = (globalThis as MesuroviaGlobal).MesuEngine;

  // Échec explicite et compréhensible au lieu d'une cascade d'erreurs `undefined`.
  if (!api) {
    throw new Error(
      'Mesurovia V3 : le moteur n’a pas été initialisé. Vérifie que src/lib/mesurovia/engine-legacy.js est présent et importé.'
    );
  }

  // Vérifier précisément les méthodes à l'origine des diagnostics VS Code.
  if (typeof api.availableFormats !== 'function' || typeof api.tableUnitsFor !== 'function') {
    throw new Error(
      'Mesurovia V3 : le fichier engine-legacy.js chargé est ancien. Remplace-le par la version V3 fournie.'
    );
  }

  return api;
}

// Type explicite non optionnel : la page ne doit plus propager `undefined`.
const engine: MesuroviaEngineApiV3 = loadMesuroviaEngine();

export default engine;
export type { MesuroviaEngineApiV3 };
