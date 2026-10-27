/** Types et mise à niveau des profils locaux propres à Mesurovia. */

export type HouseProgress = {
  theoryDone: boolean;
  trainingDone: boolean;
  examPassed: boolean;
  bestScore: number;
};

export type Profile = {
  name: string;
  avatar: string;
  xp: number;
  badges: string[];
  lastVillage: string;
  pretest?: {
    total: number;
    correct: number;
    byFamily: Record<string, { total: number; correct: number }>;
    recommended: string;
  };
  houses: Record<string, Record<string, HouseProgress>>;
  skills: Record<string, any>;
  preferences: { reducedMotion: boolean; largeText: boolean; highContrast: boolean };
};

/** Crée une progression vide avec les préférences et listes toujours initialisées. */
export function createBlankProfile(name: string, avatar: string, defaultVillage: string): Profile {
  return {
    name,
    avatar,
    xp: 0,
    badges: [],
    lastVillage: defaultVillage,
    houses: {},
    skills: {},
    preferences: { reducedMotion: false, largeText: false, highContrast: false }
  };
}

/** Normalise les profils actuels et convertit les anciennes sauvegardes Mesurovia sans les effacer. */
export function normalizeProfile(
  rawProfile: unknown,
  fallbackName: string,
  defaultAvatar: string,
  defaultVillage: string,
  validVillageIds: string[]
): Profile {
  const raw = rawProfile && typeof rawProfile === 'object' ? rawProfile as Record<string, any> : {};
  const base = createBlankProfile(String(raw.name || fallbackName || 'Aventurier'), String(raw.avatar || defaultAvatar), defaultVillage);
  const convertedHouses: Record<string, Record<string, HouseProgress>> = {};

  if (raw.houses && typeof raw.houses === 'object') {
    Object.assign(convertedHouses, raw.houses);
  } else if (raw.villages && typeof raw.villages === 'object') {
    for (const [villageId, villageData] of Object.entries(raw.villages) as Array<[string, any]>) {
      convertedHouses[villageId] = {};
      for (const [houseId, progress] of Object.entries(villageData?.houses ?? {}) as Array<[string, any]>) {
        convertedHouses[villageId][houseId] = {
          theoryDone: !!progress.theoryDone,
          trainingDone: !!progress.trainingDone,
          examPassed: !!progress.examPassed,
          bestScore: Number(progress.bestScore ?? progress.examBest ?? 0) || 0
        };
      }
    }
  }

  const oldPretest = Array.isArray(raw.pretests) ? raw.pretests[0] : null;
  const pretest = raw.pretest ?? (oldPretest ? {
    total: Number(oldPretest.total) || 0,
    correct: Number(oldPretest.correct) || 0,
    byFamily: oldPretest.byFamily ?? {},
    recommended: oldPretest.recommended ?? raw.recommended ?? base.lastVillage
  } : undefined);
  const oldOptions = raw.options ?? {};

  return {
    ...base,
    ...raw,
    name: String(raw.name || fallbackName || base.name),
    avatar: String(raw.avatar || base.avatar),
    xp: Number(raw.xp) || 0,
    badges: Array.isArray(raw.badges)
      ? raw.badges.map((badge: any) => typeof badge === 'string' ? badge : String(badge?.text ?? 'Blason acquis'))
      : [],
    lastVillage: validVillageIds.includes(raw.lastVillage)
      ? raw.lastVillage
      : validVillageIds.includes(raw.recommended) ? raw.recommended : base.lastVillage,
    houses: convertedHouses,
    skills: raw.skills ?? raw.adaptive ?? {},
    pretest,
    preferences: {
      reducedMotion: !!(raw.preferences?.reducedMotion ?? oldOptions.motion),
      largeText: !!raw.preferences?.largeText,
      highContrast: !!(raw.preferences?.highContrast ?? oldOptions.contrast)
    }
  };
}
