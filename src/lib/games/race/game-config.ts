/** Paramètres de Racer et choix de notions. La page garde la séance et la scène Three.js. */
import type { Notion } from './engine';

export interface NotionOption {
    id: Notion;
    label: string;
    help: string;
}

export const LANES = [-3.5, 0, 3.5];
export const BASE_SESSION_QUESTIONS = 12;
export const MAX_SESSION_QUESTIONS = 15; // Quelques questions supplémentaires permettent de revoir des erreurs.
export const BASE_SPEED_MIN = 10.5; // Unités Three.js par seconde, pas par image.
export const BASE_SPEED_MAX = 24; // En mode arcade, les réussites font vraiment monter le rythme.

export const notionGroups: { title: string; items: NotionOption[] }[] = [
    {
        title: 'MULTIPLICATIONS',
        items: [
            { id: 'livrets', label: 'Livrets', help: 'Tables de 2 à 12' },
            { id: 'doubles', label: 'Doubles / moitiés', help: 'Ex. : double de 18' },
            { id: 'triples', label: 'Triples', help: 'Ex. : triple de 12' },
            { id: 'quadruples', label: 'Quadruples', help: 'Ex. : quadruple de 8' },
            { id: 'trous', label: 'Facteur manquant', help: 'Ex. : 7 × ? = 56' },
            { id: 'divisions', label: 'Divisions liées', help: 'Ex. : 56 ÷ 7 = ?' }
        ]
    },
    {
        title: 'COMBIEN FAUT-IL AJOUTER ?',
        items: [
            { id: 'complements10', label: 'Pour arriver à 10', help: 'Ex. : 7 + ? = 10' },
            { id: 'complements100', label: 'Pour arriver à 100', help: 'Ex. : 63 + ? = 100' },
            { id: 'complements1000', label: 'Pour arriver à 1 000', help: 'Ex. : 650 + ? = 1 000' },
            { id: 'dizaineSuivante', label: 'Atteindre la dizaine suivante', help: 'Ex. : 47 → 50' },
            { id: 'centaineSuivante', label: 'Atteindre la centaine suivante', help: 'Ex. : 368 → 400' },
            { id: 'millierSuivant', label: 'Atteindre le millier suivant', help: 'Ex. : 3 650 → 4 000' }
        ]
    }
];

const allNotions: NotionOption[] = notionGroups.flatMap((group) => group.items);
export const notionLabels = Object.fromEntries(allNotions.map((notion) => [notion.id, notion.label])) as Record<Notion, string>;

