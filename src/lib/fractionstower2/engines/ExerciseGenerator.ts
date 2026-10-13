// -----------------------------------------------------------------------------
// [Moteur] ExerciseGenerator.ts (Global 9 Étages + Étage 9 & Boss)
// -----------------------------------------------------------------------------

import { type Fraction } from '$lib/fractionstower2/engines/FractionEngine';

export interface ExerciseConfig {
    minNumerator: number;
    maxNumerator: number;
    denominators: number[];
}

export interface ExerciseRequest {
    floorId: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    type?: 'standard' | 'comparison' | 'number_line' | 'decimal_conversion' | 'addition' | 'improper';
    index?: number;
}

export interface Exercise {
    question: string;
    correctAnswer: Fraction | string;
    type: 'input' | 'comparison' | 'number_line' | 'decimal_conversion' | 'addition' | 'improper';
    hint?: string;
    fractions?: Fraction[];
}

export class ExerciseGenerator {
    static generateRandomFraction(config: ExerciseConfig): Fraction {
        const den = config.denominators[Math.floor(Math.random() * config.denominators.length)];
        const actualMax = Math.min(config.maxNumerator, den);
        const num = Math.floor(Math.random() * (actualMax - config.minNumerator + 1)) + config.minNumerator;
        return { numerator: num, denominator: den };
    }

    static generate(request: ExerciseRequest): Exercise {
        let { floorId, type } = request;
        
        // Si on est dans un contexte de Boss, on peut cibler un étage aléatoire parmi les autorisés
        if (floorId === 'boss-bilan-5') {
            const randomFloorNum = Math.floor(Math.random() * 5) + 1;
            floorId = `floor-${randomFloorNum}`;
        } else if (floorId === 'boss-final-9' || floorId === 'floor-8' || floorId === 'floor-9') {
            // Pour le grand boss final, on brasse de l'étage 1 à 9
            const randomFloorNum = Math.floor(Math.random() * 9) + 1;
            floorId = `floor-${randomFloorNum}`;
        }

        // Configuration pour l'ensemble des 9 étages
        const configs: Record<string, ExerciseConfig> = {
            'floor-1': { minNumerator: 1, maxNumerator: 10, denominators: [2, 3, 4, 6, 8] },
            'floor-2': { minNumerator: 1, maxNumerator: 10, denominators: [2, 3, 4, 5, 6, 8, 10] },
            'floor-3': { minNumerator: 1, maxNumerator: 10, denominators: [2, 4, 5, 10] },
            'floor-4': { minNumerator: 1, maxNumerator: 20, denominators: [2, 3, 4, 5, 6, 8, 10, 12] },
            'floor-5': { minNumerator: 1, maxNumerator: 50, denominators: [2, 3, 4, 5, 6, 8, 10, 12] },
            'floor-6': { minNumerator: 1, maxNumerator: 100, denominators: [10, 100] },
            'floor-7': { minNumerator: 1, maxNumerator: 100, denominators: [4, 6, 8, 10] },
            'floor-8': { minNumerator: 1, maxNumerator: 100, denominators: [2, 3, 4, 6, 8] },
            'floor-9': { minNumerator: 1, maxNumerator: 100, denominators: [2, 3, 4, 6] },
        };

        const config = configs[floorId] || configs['floor-1'];

        // Attribution automatique du type d'exercice selon l'étage
        if (!type || type === 'standard') {
            if (floorId === 'floor-3') type = 'number_line';
            else if (['floor-4', 'floor-5'].includes(floorId)) type = 'comparison';
            else if (floorId === 'floor-6') type = 'decimal_conversion';
            else if (['floor-7', 'floor-8'].includes(floorId)) type = 'addition';
            else if (floorId === 'floor-9') type = 'improper';
            else type = 'standard';
        }

        // 1. ÉTAGE 9 : Fractions impropres / supérieures à 1 (ex: 5/4)
        if (type === 'improper' || floorId === 'floor-9') {
            const den = config.denominators[Math.floor(Math.random() * config.denominators.length)];
            // Numérateur supérieur au dénominateur pour faire plus d'une unité (ex: entre den + 1 et den * 2)
            const num = Math.floor(Math.random() * den) + den + 1;

            return {
                question: `Quelle fraction totale représente ces figures (plus d'une unité) ?`,
                correctAnswer: `${num}/${den}`,
                type: 'improper',
                fractions: [{ numerator: num, denominator: den }]
            };
        }

        // 2. CAS ADDITION (Étages 7 & 8)
        if (type === 'addition') {
            if (floorId === 'floor-7') {
                const den = config.denominators[Math.floor(Math.random() * config.denominators.length)];
                const num1 = Math.floor(Math.random() * (den - 2)) + 1;
                const num2 = Math.floor(Math.random() * (den - num1 - 1)) + 1;
                const sum = num1 + num2;

                return {
                    question: `Additionne ces fractions :`,
                    correctAnswer: `${sum}/${den}`,
                    type: 'addition',
                    fractions: [
                        { numerator: num1, denominator: den },
                        { numerator: num2, denominator: den }
                    ]
                };
            } else {
                const pairs = [
                    { d1: 2, d2: 4, n1: 1, n2: 1 },
                    { d1: 4, d2: 2, n1: 1, n2: 1 },
                    { d1: 3, d2: 6, n1: 1, n2: 1 },
                    { d1: 4, d2: 8, n1: 1, n2: 3 }
                ];
                const pair = pairs[Math.floor(Math.random() * pairs.length)];
                const commonDen = Math.max(pair.d1, pair.d2);
                const adjustedN1 = pair.n1 * (commonDen / pair.d1);
                const totalNum = adjustedN1 + pair.n2;

                return {
                    question: `Additionne ces fractions (convertis si besoin) :`,
                    correctAnswer: `${totalNum}/${commonDen}`,
                    type: 'addition',
                    fractions: [
                        { numerator: pair.n1, denominator: pair.d1 },
                        { numerator: pair.n2, denominator: pair.d2 }
                    ]
                };
            }
        }

        // 3. CAS COMPARISON / ÉQUIVALENCE
        if (type === 'comparison') {
            const f1 = this.generateRandomFraction(config);
            let f2 = this.generateRandomFraction(config);

            if (f1.numerator === f2.numerator && f1.denominator === f2.denominator) {
                f2 = { numerator: Math.max(1, f1.numerator - 1), denominator: f1.denominator };
            }

            const val1 = f1.numerator / f1.denominator;
            const val2 = f2.numerator / f2.denominator;
            
            let result = '=';
            if (val1 > val2) result = '>';
            else if (val1 < val2) result = '<';

            return {
                question: `Compare ces deux fractions :`,
                correctAnswer: result,
                type: 'comparison',
                fractions: [f1, f2]
            };
        }

        // 4. CAS DROITE GRADUÉE (Étage 3)
        if (type === 'number_line') {
            const f = this.generateRandomFraction(config);
            return {
                question: `Place ou lis la fraction correspondante sur la droite graduée :`,
                correctAnswer: f,
                type: 'number_line',
                fractions: [f]
            };
        }

        // 5. CAS CONVERSION (Étage 6)
        if (type === 'decimal_conversion') {
            const f = this.generateRandomFraction(config);
            const decimalVal = (f.numerator / f.denominator).toFixed(3).replace(/\.?0+$/, "");
            return {
                question: `Convertis cette fraction en nombre décimal :`,
                correctAnswer: decimalVal,
                type: 'input',
                fractions: [f]
            };
        }

        // 6. CAS STANDARD
        const f = this.generateRandomFraction(config);
        return {
            question: `Quelle fraction de la figure est colorée ?`,
            correctAnswer: f,
            type: 'input',
            fractions: [f]
        };
    }
}