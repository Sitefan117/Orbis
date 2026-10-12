// -----------------------------------------------------------------------------
// GÉNÉRATEUR D'EXERCICES
// Génère dynamiquement des fractions et des défis basés sur des critères 
// de difficulté et des objectifs pédagogiques.
// -----------------------------------------------------------------------------

import { type Fraction } from '$lib/fractionstower2/engines/FractionEngine';

export interface ExerciseConfig {
    minNumerator: number;
    maxNumerator: number;
    denominators: number[]; // Liste des dénominateurs autorisés pour l'étage
}

export interface ExerciseRequest {
    floorId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    type?: 'standard' | 'comparison' | 'number_line' | 'decimal_conversion';
    index?: number;
}

export interface Exercise {
    question: string;
    correctAnswer: Fraction | string;
    type: 'input' | 'comparison' | 'number_line' | 'decimal_conversion';
    hint?: string;
    fractions?: Fraction[];
}

export class ExerciseGenerator {
    /**
     * Génère une fraction aléatoire basée sur une configuration d'étage.
     */
    static generateRandomFraction(config: ExerciseConfig): Fraction {
        const den = config.denominators[Math.floor(Math.random() * config.denominators.length)];
        const actualMax = Math.min(config.maxNumerator, den);
        const num = Math.floor(Math.random() * (actualMax - config.minNumerator + 1)) + config.minNumerator;
        return { numerator: num, denominator: den };
    }

    /**
     * POINT D'ENTRÉE PRINCIPAL pour les activités et le Boss.
     */
    static generate(request: ExerciseRequest): Exercise {
        const { floorId } = request;
        let type = request.type;
        
        // Configuration des dénominateurs et plages par étage selon la progression pédagogique
        const configs: Record<string, ExerciseConfig> = {
            'floor-1': { minNumerator: 1, maxNumerator: 10, denominators: [2, 3, 4, 6, 8] },     // Étage 1 : Bases (partage équitable)
            'floor-2': { minNumerator: 1, maxNumerator: 10, denominators: [2, 3, 4, 5, 6, 8, 10] }, // Étage 2 : Lecture et représentation visuelle variée
            'floor-3': { minNumerator: 1, maxNumerator: 10, denominators: [2, 4, 5, 10] },         // Étage 3 : Droite graduée
            'floor-4': { minNumerator: 1, maxNumerator: 20, denominators: [2, 3, 4, 5, 6, 8, 10, 12] }, // Étage 4 : Fractions équivalentes
            'floor-5': { minNumerator: 1, maxNumerator: 50, denominators: [2, 3, 4, 5, 6, 8, 10, 12] }, // Étage 5 : Comparaison avancée
            'floor-6': { minNumerator: 1, maxNumerator: 100, denominators: [10, 100] },          // Étage 6 : Fractions décimales
            'floor-7': { minNumerator: 1, maxNumerator: 100, denominators: [2, 3, 4, 5, 6, 8, 10] }, // Étage 7 : Addition même dénominateur
            'floor-8': { minNumerator: 1, maxNumerator: 100, denominators: [2, 3, 4, 5, 6] },      // Étage 8 : Dénominateurs différents
        };

        const config = configs[floorId] || configs['floor-1'];

        // Forcer le type d'exercice selon l'étage si non spécifié
        if (floorId === 'floor-3') type = 'number_line';
        if (floorId === 'floor-4' || floorId === 'floor-5') type = 'comparison';

        // 1. CAS COMPARAISON / ÉQUIVALENCE (Étage 4 & 5)
        if (type === 'comparison') {
            const f1 = this.generateRandomFraction(config);
            let f2 = this.generateRandomFraction(config);

            if (floorId === 'floor-4') {
                // Pour l'étage 4, on force un mélange d'équivalences et de variations maîtrisées
                const rand = Math.random();
                if (rand < 0.5) {
                    const multiplier = [2, 3][Math.floor(Math.random() * 2)];
                    f2 = { numerator: f1.numerator * multiplier, denominator: f1.denominator * multiplier };
                }
            }

            // Évite l'identité parfaite si le hasard a généré exactement la même fraction
            if (f1.numerator === f2.numerator && f1.denominator === f2.denominator) {
                f2 = { numerator: Math.max(1, f1.numerator - 1), denominator: f1.denominator };
            }

            const val1 = f1.numerator / f1.denominator;
            const val2 = f2.numerator / f2.denominator;
            
            let result = '=';
            if (val1 > val2) result = '>';
            else if (val1 < val2) result = '<';

            return {
                question: floorId === 'floor-5' ? `Compare ces deux fractions :` : `Trouve le lien entre ces deux fractions :`,
                correctAnswer: result,
                type: 'comparison',
                fractions: [f1, f2]
            };
        }

        // 2. CAS DROITE GRADUÉE (Étage 3)
        if (type === 'number_line') {
            const f = this.generateRandomFraction(config);
            return {
                question: `Place ou lis la fraction correspondante sur la droite graduée :`,
                correctAnswer: f,
                type: 'number_line',
                fractions: [f]
            };
        }

        // 3. CAS CONVERSION (Nombres décimaux)
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

        // 4. CAS STANDARD (Barres / Cercles par défaut)
        const f = this.generateRandomFraction(config);
        return {
            question: `Quelle fraction de la figure est colorée ?`,
            correctAnswer: f,
            type: 'input',
            fractions: [f]
        };
    }

    static generateSet(count: number, config: ExerciseConfig): Fraction[] {
        const set: Fraction[] = [];
        for (let i = 0; i < count; i++) {
            set.push(this.generateRandomFraction(config));
        }
        return set;
    }
}