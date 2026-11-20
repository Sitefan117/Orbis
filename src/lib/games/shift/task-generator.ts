/** Génère les tâches de Shift sans dépendre de l'état de l'interface. */
import { PLACE_VALUES, TICK_WEIGHT, makeTargetTicks, numberToSwissText, randomInt } from './number-engine';
import { MEASURE_UNITS } from './config';

export function createShiftTask(missionId: string, difficultyId: string, maxInteger: number) {
  if (missionId === 'factory') {
    const targetTicks = makeTargetTicks(difficultyId);
    return {
      type: 'factory', targetTicks,
      prompt: 'Prépare exactement la quantité demandée, puis expédie le colis.',
      targetWords: Number.isInteger(targetTicks / 1000) ? numberToSwissText(targetTicks / 1000) : ''
    };
  }

  if (missionId === 'measure') {
    const familyNames = Object.keys(MEASURE_UNITS);
    const familyName = familyNames[randomInt(0, familyNames.length - 1)]!;
    const units = MEASURE_UNITS[familyName]!;
    let fromIndex = randomInt(0, units.length - 1);
    // Les écarts de conversion deviennent progressivement plus grands avec la difficulté,
    // sans imposer d’emblée des résultats impossibles à lire ou à saisir.
    const maxExponentGap = difficultyId === 'starter' ? 3
      : difficultyId === 'workshop' ? 6 : 9;
    const maxUnitSteps = difficultyId === 'starter' ? 1
      : difficultyId === 'workshop' ? 2
        : difficultyId === 'decimal' ? 3 : 6;
    const candidateIndexes = units.map((unit, index) => ({ unit, index }))
      .filter(({ unit, index }) => index !== fromIndex && (
        familyName === 'Temps'
          ? Math.abs(index - fromIndex) <= (difficultyId === 'starter' ? 1 : difficultyId === 'workshop' ? 2 : 3)
          : familyName === 'Volume et capacité'
            ? Math.abs(Math.log10((unit.factor ?? 0)) - Math.log10((units[fromIndex]!.factor ?? 0))) <= (difficultyId === 'starter' ? 0 : difficultyId === 'workshop' ? 3 : 6)
            : Math.abs(index - fromIndex) <= maxUnitSteps
              && Math.abs((unit.exp ?? 0) - (units[fromIndex]!.exp ?? 0)) <= maxExponentGap
      ));
    let toIndex = candidateIndexes[randomInt(0, candidateIndexes.length - 1)]!.index;
    const baseValues = difficultyId === 'starter'
      ? [1, 2, 3, 5, 10]
      : difficultyId === 'workshop'
        ? [1, 2, 3, 5, 10, 25, 120, 250]
        : [0.25, 0.4, 0.8, 1.2, 2.5, 3.75, 12.5];
    const sourceValue = baseValues[randomInt(0, baseValues.length - 1)]!;
    // Les durées utilisent des facteurs 60 et 24 ; les autres grandeurs suivent
    // les puissances décimales (les surfaces par 100 et les volumes par 1'000).
    let conversion = familyName === 'Temps' || familyName === 'Volume et capacité'
      ? sourceValue * (units[fromIndex]!.factor ?? 0) / (units[toIndex]!.factor ?? 0)
      : sourceValue * Math.pow(10, (units[fromIndex]!.exp ?? 0) - (units[toIndex]!.exp ?? 0));
    // Évite les résultats inférieurs au millième qui seraient illisibles à saisir.
    // On inverse le sens de conversion, sans changer la quantité de départ.
    if (conversion > 0 && conversion < 0.001) {
      const previousFromIndex = fromIndex;
      fromIndex = toIndex;
      toIndex = previousFromIndex;
      conversion = familyName === 'Temps' || familyName === 'Volume et capacité'
        ? sourceValue * (units[fromIndex]!.factor ?? 0) / (units[toIndex]!.factor ?? 0)
        : sourceValue * Math.pow(10, (units[fromIndex]!.exp ?? 0) - (units[toIndex]!.exp ?? 0));
    }
    return {
      type: 'measure', familyName, sourceValue, fromUnit: units[fromIndex]!.name,
      toUnit: units[toIndex]!.name, expected: Number(conversion.toPrecision(12)),
      prompt: `Convertis cette mesure en ${units[toIndex]!.name}.`,
      hint: familyName === 'Temps'
        ? 'Les durées ne sont pas en base 10 : 1 minute = 60 secondes, 1 heure = 60 minutes et 1 jour = 24 heures.'
        : familyName === 'Volume et capacité'
          ? 'Repères utiles : 1 cm³ = 1 mL ; 1 dm³ = 1 L ; 1 m³ = 1’000 L.'
          : `Pour les ${familyName.toLowerCase()}, le facteur entre deux unités adjacentes est ${familyName === 'Surface' ? '100' : familyName === 'Volume' ? '1’000' : '10'}. Vers une unité plus petite, on multiplie ; vers une unité plus grande, on divise.`
    };
  }

  if (missionId === 'words') {
    const expedition = difficultyId === 'expedition';
    const number = expedition ? randomInt(1, 999999999999) : randomInt(1, maxInteger);
    const numericToWords = Math.random() < 0.5;
    return numericToWords
      ? { type: 'words', direction: 'toWords', number, prompt: 'Écris ce nombre en toutes lettres.', expectedWords: numberToSwissText(number) }
      : { type: 'words', direction: 'toDigits', number, prompt: 'Lis le mot-nombre et écris le nombre en chiffres.', expected: number };
  }

  if (missionId === 'decompose') {
    const targetTicks = makeTargetTicks(difficultyId);
    // Pour une partie des nombres entiers, l'élève part d'un mot-nombre plutôt que de chiffres.
    const asWords = targetTicks % 1000 === 0 && Math.random() < 0.35;
    return {
      type: 'decompose', targetTicks, asWords,
      targetWords: asWords ? numberToSwissText(targetTicks / 1000) : '',
      prompt: 'Reporte le chiffre de chaque rang dans le tableau.'
    };
  }

  if (missionId === 'sort') {
    const values: number[] = [];
    const large = difficultyId === 'expedition';
    const decimals = difficultyId === 'decimal';
    const max = large ? 999999999999 : decimals ? 9999999 : maxInteger * 1000;
    while (values.length < 4) {
      // Les entiers aussi sont stockés en ticks : 1 unité = 1'000 ticks.
      const candidate = large ? randomInt(1, max) * 1000 : decimals ? randomInt(1, max) : randomInt(1, maxInteger) * 1000;
      if (!values.includes(candidate)) values.push(candidate);
    }
    return { type: 'sort', values, prompt: 'Appuie sur les nombres dans l’ordre croissant, du plus petit au plus grand.' };
  }

  if (missionId === 'line') {
    let start = 0;
    let span = 100;
    if (difficultyId === 'workshop') { start = randomInt(100, 5000); span = 100; }
    if (difficultyId === 'decimal') { start = randomInt(0, 20) / 10; span = 1; }
    if (difficultyId === 'expedition') { start = randomInt(1, 999900) * 1000000; span = 100000000; }
    // Le repère tombe sur une graduation visible (tous les 5 % de la droite).
    // Une partie des tâches demande de placer un nombre, l'autre de lire le repère.
    const offset = randomInt(1, 19) * 5;
    const direction = Math.random() < 0.5 ? 'place' : 'read';
    return {
      type: 'line', start, end: start + span,
      target: start + (span * offset / 100), offset, direction,
      prompt: direction === 'place'
        ? 'Place le repère au niveau du nombre demandé.'
        : 'Quel nombre est indiqué par le repère ?'
    };
  }

  if (missionId === 'rank') {
    const examples = difficultyId === 'starter'
      ? [234, 487, 902]
      : difficultyId === 'workshop'
        ? [1234, 4387, 9876]
        : difficultyId === 'decimal'
          ? [12345, 234567, 4387000, 7654, 32005]
          : [123456789, 123456789012, 9876543210];
    const ticks = examples[randomInt(0, examples.length - 1)]!;
    const ranks = difficultyId === 'starter'
      ? PLACE_VALUES.filter((p) => [1, 2].includes(p.exp))
      : difficultyId === 'workshop'
        ? PLACE_VALUES.filter((p) => [1, 2, 3].includes(p.exp))
        : difficultyId === 'decimal'
          ? PLACE_VALUES.filter((p) => p.exp >= -3 && p.exp <= 0)
          : PLACE_VALUES.filter((p) => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, -1, -2, -3].includes(p.exp));
    const place = ranks[randomInt(0, ranks.length - 1)]!;
    const actualTicks = difficultyId === 'decimal' ? ticks : ticks * 1000;
    const expected = Math.floor(actualTicks / TICK_WEIGHT[place.key] + 1e-8);
    return { type: 'rank', targetTicks: actualTicks, place, expected, prompt: `Combien de ${place.label.toLocaleLowerCase('fr-CH')} entiers contient ce nombre ?` };
  }

  if (missionId === 'build') {
    const decimalMode = difficultyId === 'decimal';
    const expeditionDecimal = difficultyId === 'expedition' && Math.random() < 0.5;
    const number = decimalMode
      ? randomInt(1000, 9999999) / 1000
      : expeditionDecimal
        ? randomInt(1, 99999999999) / 1000
        : difficultyId === 'expedition'
          ? randomInt(100000, 100000000)
          : randomInt(10, maxInteger);
    const step = decimalMode || expeditionDecimal ? 0.001 : 1;
    if (Math.random() < 0.34) {
      const lower = decimalMode ? Math.floor(number * 100) / 100 : Math.floor(number / 10) * 10;
      const upper = lower + (decimalMode ? 0.01 : 10);
      return { type: 'build', condition: 'between', lower, upper, step, prompt: 'Propose un nombre strictement compris entre les deux bornes.' };
    } else {
      const direction = Math.random() < 0.5 ? 'greater' : 'smaller';
      return {
        type: 'build', condition: 'direction', number, direction, step,
        prompt: direction === 'greater' ? 'Propose un nombre plus grand que celui affiché.' : 'Propose un nombre plus petit que celui affiché.'
      };
    }
  }
}
