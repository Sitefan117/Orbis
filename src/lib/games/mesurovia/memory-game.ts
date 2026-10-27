/** Prépare les paires et les cartes du jeu de mémoire propre à Mesurovia. */
import type { MesuroviaEngineApiV3 } from './engine-v3-adapter';

export type MemoryPair = {
  id: string;
  family: string;
  left: string;
  right: string;
};

export type MemoryCard = {
  id: string;
  pairId: string;
  family: string;
  label: string;
  revealed: boolean;
  matched: boolean;
};

type MemoryProfile = {
  skills?: Record<string, { difficulty?: number } | undefined>;
  pretest?: { byFamily: Record<string, { total: number; correct: number }> };
};

/** Crée jusqu’à six associations à partir des questions de correspondance du moteur Mesurovia. */
export function createMemoryPairs(
  engine: Pick<MesuroviaEngineApiV3, 'startingDifficulty' | 'makeQuestion'>,
  options: {
    villageId: string;
    familyOrder: string[];
    houseFamilies?: string[];
    profile?: MemoryProfile | null;
  }
): MemoryPair[] {
  const { villageId, familyOrder, houseFamilies, profile } = options;
  const allowedFamilies = houseFamilies?.length ? [...houseFamilies] : [...familyOrder];
  const pairs: MemoryPair[] = [];
  const seen = new Set<string>();
  let attempts = 0;

  while (pairs.length < 6 && attempts < 20) {
    const family = allowedFamilies[attempts % allowedFamilies.length];
    const savedAdaptive = profile?.skills?.[`${villageId}:${family}`] ?? profile?.skills?.[family];
    const pretest = profile?.pretest ? { byFamily: profile.pretest.byFamily } : null;
    const difficulty = savedAdaptive?.difficulty ?? engine.startingDifficulty(villageId, family, pretest);
    const matchQuestion = engine.makeQuestion(family, difficulty, { format: 'match' });
    const rightItems = new Map<string, string>(matchQuestion.rightItems.map((item: any) => [item.id, item.label]));

    for (const leftItem of matchQuestion.leftItems) {
      if (pairs.length >= 6) break;
      const rightLabel = rightItems.get(matchQuestion.answer[leftItem.id]);
      if (typeof rightLabel !== 'string') continue;
      const key = [leftItem.label, rightLabel].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ id: `pair-${pairs.length + 1}`, family, left: leftItem.label, right: rightLabel });
    }
    attempts += 1;
  }

  return pairs;
}

/** Transforme chaque association en deux cartes puis mélange le paquet. */
export function createMemoryCards(pairs: MemoryPair[]): MemoryCard[] {
  const cards = pairs.flatMap((pair) => [
    { id: `${pair.id}-a`, pairId: pair.id, family: pair.family, label: pair.left, revealed: false, matched: false },
    { id: `${pair.id}-b`, pairId: pair.id, family: pair.family, label: pair.right, revealed: false, matched: false }
  ]);

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[other]] = [cards[other], cards[index]];
  }

  return cards;
}
