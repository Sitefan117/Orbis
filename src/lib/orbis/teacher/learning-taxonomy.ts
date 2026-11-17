import { GEOMETRY_FIGURES } from '../../games/geometrie/figures';

/**
 * Vocabulaire pédagogique partagé par le tableau enseignant.
 *
 * Les identifiants sont stables et peuvent être enregistrés dans skill_id.
 * Le libellé affiché peut évoluer sans casser les anciennes données.
 */
export type LearningTaxonomyEntry = {
  label: string;
  description: string;
  category: string;
};

export const LEARNING_TAXONOMY: Record<string, LearningTaxonomyEntry> = {
  'livrets.table_7': { label: 'Table de 7', description: 'Multiplier et retrouver les faits numériques de la table de 7.', category: 'Multiplication' },
  'livrets.table_8': { label: 'Table de 8', description: 'Multiplier et retrouver les faits numériques de la table de 8.', category: 'Multiplication' },
  'calculs.addition_decimale': { label: 'Addition décimale', description: 'Additionner des nombres décimaux en alignant les positions.', category: 'Nombres décimaux' },
  'calculs.soustraction_decimale': { label: 'Soustraction décimale', description: 'Soustraire des nombres décimaux avec ou sans retenue.', category: 'Nombres décimaux' },
  'numeria.valeur_position': { label: 'Valeur de position', description: 'Lire la valeur d’un chiffre selon sa position.', category: 'Numération' },
  'mesurovia.conversion_longueur': { label: 'Conversions de longueurs', description: 'Choisir l’unité et convertir une mesure de longueur.', category: 'Mesures' },
  'geometrie.proprietes_figures': { label: 'Propriétés des figures', description: 'Reconnaître et justifier les propriétés d’une figure.', category: 'Géométrie' },
  'conju_lab.temps_verbe': { label: 'Temps et conjugaison', description: 'Identifier le temps et choisir la forme verbale correcte.', category: 'Conjugaison' },
  'grammaire_lab.accord': { label: 'Accords dans la phrase', description: 'Accorder les mots avec le sujet et le groupe nominal.', category: 'Grammaire' },
  'musee_vocabulaire.sens_mot': { label: 'Sens des mots', description: 'Associer un mot à sa définition ou à son contexte.', category: 'Vocabulaire' },
  'fractionstower2.fraction_equivalente': { label: 'Fractions équivalentes', description: 'Reconnaître des fractions qui représentent la même quantité.', category: 'Fractions' },
  'shift.ordre_grandeur': { label: 'Ordre de grandeur', description: 'Comparer et estimer des nombres.', category: 'Numération' },
  'mathhunt.strategie_calcul': { label: 'Stratégie de calcul', description: 'Choisir une procédure efficace pour résoudre un calcul.', category: 'Résolution' },
  'pcp.interets': { label: 'Intérêts et préférences', description: 'Identifier ce qui attire ou motive l’élève.', category: 'Orientation' },
  'pcp.competences': { label: 'Compétences personnelles', description: 'Mettre en mots des compétences et expériences.', category: 'Orientation' }
};

export function taxonomyFor(skillId?: string | null): LearningTaxonomyEntry | null {
  if (!skillId) return null;
  const figureId = skillId.startsWith('geometrie.construction.') ? skillId.slice('geometrie.construction.'.length) : '';
  const figure = GEOMETRY_FIGURES.find((item) => item.id === figureId);
  if (figure) return { label: `Construction : ${figure.name}`, description: 'Reproduire un croquis ou une vue de solide sur une grille.', category: 'Géométrie' };
  return LEARNING_TAXONOMY[skillId] ?? null;
}

export function skillLabel(skillId?: string | null): string {
  return taxonomyFor(skillId)?.label ?? (skillId ? skillId.replaceAll('_', ' ') : 'Compétence non renseignée');
}
