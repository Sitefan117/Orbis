/** Données suffisantes pour afficher une question sans lier le moteur à l’écran. */
export type DecimalQuestion = {
  left: string;
  right: string;
  operation: '+' | '-';
  answer: number;
  level: number;
};

// Fabrique une valeur décimale sous forme de texte pour garder ses zéros utiles.
function randomDecimal(min: number, max: number, digits: number): string {
  return (Math.random() * (max - min) + min).toFixed(digits);
}

/** Choisit un niveau, construit les deux opérandes et calcule la réponse attendue. */
export function generateDecimalQuestion(activeLevels: number[]): DecimalQuestion | null {
  if (activeLevels.length === 0) return null;

  const level = activeLevels[Math.floor(Math.random() * activeLevels.length)];
  const operation: '+' | '-' = Math.random() > 0.5 ? '+' : '-';
  let left: string;
  let right: string;

  if (level === 1) {
    left = Math.random() > 0.5 ? randomDecimal(10, 60, 1) : Math.floor(Math.random() * 80 + 20).toString();
    right = Math.random() > 0.5 ? randomDecimal(1, 20, 1) : Math.floor(Math.random() * 40 + 5).toString();
  } else if (level === 2) {
    left = randomDecimal(10, 60, 1);
    right = randomDecimal(5, 45, 1);
  } else {
    left = randomDecimal(10, 60, 2);
    right = randomDecimal(5, 45, 2);
  }

  if (operation === '-' && Number(left) < Number(right)) [left, right] = [right, left];

  const precision = level === 3 ? 2 : 1;
  const answer = operation === '+' ? Number(left) + Number(right) : Number(left) - Number(right);
  return { left, right, operation, answer: Number(answer.toFixed(precision)), level };
}
