export interface Exercise {
    id: string;
    question: string;
    correctAnswer: string;
    type: 'input' | 'qcm' | 'comparison' | 'number_line' | 'color_interactive' | 'slice_interactive';
    options?: string[];
    fractions?: Array<{ numerator: number; denominator: number }>;
    hint?: string;
    // Propriétés spécifiques pour les exercices interactifs visuels
    interactiveData?: {
        totalParts?: number;
        targetParts?: number;
    };
}

export class ExerciseGenerator {
    static generateSession(floorId: string, count: number = 10): Exercise[] {
        const floorNum = parseInt(floorId.replace('floor-', '') || '1');
        const pool = this.getPoolForFloor(floorNum);
        
        // Mélange aléatoire et sélection de 'count' questions
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    private static getPoolForFloor(floor: number): Exercise[] {
        switch (floor) {
            case 1: // Étage 1 : Partage équitable et bases (Curated + Interactifs)
                return [
                    { id: 'f1-1', question: "Dans une pizza coupée en 4 parts égales, comment appelle-t-on le nombre du bas (4) ?", correctAnswer: 'dénominateur', type: 'qcm', options: ['dénominateur', 'numérateur', 'quotient', 'diviseur'], hint: "Il donne le nom de la part." },
                    { id: 'f1-2', question: "Quel nombre représente le nombre de parts que l'on prend (en haut d'une fraction) ?", correctAnswer: 'numérateur', type: 'qcm', options: ['dénominateur', 'numérateur', 'fraction', 'part'], hint: "Il 'numère' les parts." },
                    { id: 'f1-3', question: "Pour pouvoir écrire une fraction, les parts d'une unité doivent obligatoirement être de...", correctAnswer: 'même taille', type: 'qcm', options: ['même taille', 'tailles différentes', 'formes différentes', 'couleurs différentes'], hint: "Le partage doit être équitable." },
                    { id: 'f1-4', question: "Écris la fraction correspondant à 3 parts prises sur un total de 4 parts égales.", correctAnswer: '3/4', type: 'input', hint: "Utilise un slash : numérateur/dénominateur." },
                    { id: 'f1-5', question: "Si on prend 2 parts sur 5 parts égales, quelle fraction écrit-on ?", correctAnswer: '2/5', type: 'input', hint: "2 en haut, 5 en bas." },
                    { id: 'f1-6', question: "Quel est le numérateur de la fraction 5/7 ?", correctAnswer: '5', type: 'qcm', options: ['5', '7', '12', '2'], hint: "C'est le nombre du haut." },
                    { id: 'f1-7', question: "Quel est le dénominateur de la fraction 3/8 ?", correctAnswer: '8', type: 'qcm', options: ['3', '8', '5', '11'], hint: "C'est le nombre du bas." },
                    { id: 'f1-8', question: "Représente 'un tiers' sous forme de fraction chiffrée.", correctAnswer: '1/3', type: 'input', hint: "1 sur 3." },
                    { id: 'f1-9', question: "Une unité partagée en 6 parts égales dont on prend 4 parts s'écrit :", correctAnswer: '4/6', type: 'qcm', options: ['4/6', '6/4', '2/6', '4/2'], hint: "Le total en bas, les parts prises en haut." },
                    { id: 'f1-10', question: "Vrai ou Faux : 2/4 représente un partage en parts égales.", correctAnswer: 'vrai', type: 'qcm', options: ['vrai', 'faux'], hint: "Les moitiés sont égales." },
                    // Nouveaux exercices interactifs de coloriage visuel
                    { id: 'f1-inter-1', question: "Colorie exactement 3 parts sur une unité découpée en 4 parts égales pour représenter 3/4.", correctAnswer: '3/4', type: 'color_interactive', interactiveData: { totalParts: 4, targetParts: 3 }, hint: "Clique sur 3 parts pour les colorer." },
                    { id: 'f1-inter-2', question: "Colorie 2 parts sur un total de 5 parts égales.", correctAnswer: '2/5', type: 'color_interactive', interactiveData: { totalParts: 5, targetParts: 2 }, hint: "Atteins le numérateur 2 en coloriant." }
                ];

            case 2: // Étage 2 : Lire et représenter
                return [
                    { id: 'f2-1', question: "Comment lit-on la fraction 3/5 ?", correctAnswer: 'trois cinquièmes', type: 'qcm', options: ['trois cinquièmes', 'cinq tiers', 'trois sur cinq', 'cinq sur trois'], hint: "On nomme le nombre du bas en -ième." },
                    { id: 'f2-2', question: "Écris en chiffres la fraction 'quatre septièmes'.", correctAnswer: '4/7', type: 'input', hint: "4 sur 7." },
                    { id: 'f2-3', question: "Comment lit-on la fraction 1/2 ?", correctAnswer: 'un demi', type: 'qcm', options: ['un demi', 'un deux', 'deux un', 'un second'], hint: "Le cas particulier de 2 au dénominateur." },
                    { id: 'f2-4', question: "Comment lit-on la fraction 1/3 ?", correctAnswer: 'un tiers', type: 'qcm', options: ['un tiers', 'un trois', 'trois un', 'un trentième'], hint: "Le cas particulier de 3 au dénominateur." },
                    { id: 'f2-5', question: "Écris en chiffres 'cinq sixièmes'.", correctAnswer: '5/6', type: 'input', hint: "5 / 6" },
                    { id: 'f2-6', question: "Quelle lecture correspond à 2/4 ?", correctAnswer: 'deux quarts', type: 'qcm', options: ['deux quarts', 'quatre demis', 'deux sur quatre', 'un quart'], hint: "4 en bas se lit quarts." },
                    { id: 'f2-7', question: "Écris en chiffres 'trois huitièmes'.", correctAnswer: '3/8', type: 'input', hint: "3 / 8" },
                    { id: 'f2-8', question: "Comment lit-on la fraction 4/10 ?", correctAnswer: 'quatre dixièmes', type: 'qcm', options: ['quatre dixièmes', 'dix quarts', 'quatre sur dix', 'quarante'], hint: "10 en bas se lit dixièmes." }
                ];

            case 3: // Étage 3 : La droite graduée & Découpage interactif
                return [
                    { id: 'f3-1', question: "Sur une droite de 0 à 1 partagée en 4, où se situe 3/4 ?", correctAnswer: '3/4', type: 'input', hint: "Au 3ème intervalle." },
                    { id: 'f3-2', question: "Sur une droite de 0 à 1 partagée en 5, que représente le 2e trait après 0 ?", correctAnswer: '2/5', type: 'input', hint: "2 pas sur 5." },
                    { id: 'f3-3', question: "Entre 0 et 1, si un segment est coupé en 3, le 1er trait après 0 vaut :", correctAnswer: '1/3', type: 'qcm', options: ['1/3', '3/1', '1/2', '2/3'], hint: "Premier pas sur trois." },
                    { id: 'f3-4', question: "Sur une droite graduée en quarts, quel nombre est exactement au milieu entre 0 et 1 ?", correctAnswer: '2/4', type: 'qcm', options: ['2/4', '1/4', '3/4', '1/1'], hint: "La moitié de 4." },
                    { id: 'f3-5', question: "Sur une droite de 0 à 1 partagée en 10, que vaut le 7e trait ?", correctAnswer: '7/10', type: 'input', hint: "7 / 10" },
                    // Exercice interactif de découpage
                    { id: 'f3-inter-1', question: "Utilise le sélecteur pour découper l'unité en 6 parts égales.", correctAnswer: '6', type: 'slice_interactive', interactiveData: { targetParts: 6 }, hint: "Ajuste le nombre de parts à 6." }
                ];

            case 4: // Étage 4 : Équivalences et simplification (Algorithmique enrichi)
                return this.generateEquivalenceExercises();

            case 5: // Étage 5 : Comparer et ordonner (Algorithmique)
                return this.generateComparisonExercises();

            case 6: // Étage 6 : Fractions décimales (Algorithmique)
                return this.generateDecimalExercises();

            case 7: // Étage 7 : Opérations même dénominateur (Algorithmique)
                return this.generateSameDenominatorExercises();

            case 8: // Étage 8 : Dénominateurs différents (Algorithmique)
                return this.generateDifferentDenominatorExercises();

            case 9: // Étage 9 : Multiplication et division (Algorithmique)
            default:
                return this.generateAdvancedExercises();
        }
    }

    // --- GÉNÉRATEURS ALGORITHMIQUES (Procéduraux & Étendus) ---

    private static generateEquivalenceExercises(): Exercise[] {
        const exercises: Exercise[] = [];
        const baseFrags = [
            { n: 1, d: 2 }, { n: 1, d: 3 }, { n: 2, d: 3 }, 
            { n: 3, d: 4 }, { n: 1, d: 5 }, { n: 2, d: 5 },
            { n: 3, d: 4 }, { n: 4, d: 5 }
        ];
        
        baseFrags.forEach((f, idx) => {
            const factor = Math.floor(Math.random() * 3) + 2; // Facteur 2, 3 ou 4
            const newN = f.n * factor;
            const newD = f.d * factor;

            exercises.push({
                id: `alg-e4-${idx}`,
                question: `Complète l'égalité d'équivalence : ${f.n}/${f.d} = ? / ${newD}`,
                correctAnswer: newN.toString(),
                type: 'input',
                hint: `Multiplie le haut et le bas par ${factor}.`
            });
        });
        return exercises;
    }

    private static generateComparisonExercises(): Exercise[] {
        const exercises: Exercise[] = [];
        const denoms = [5, 7, 8, 10, 12, 100];
        
        denoms.forEach((d, idx) => {
            const n1 = Math.floor(Math.random() * (d - 2)) + 1;
            let n2 = Math.floor(Math.random() * (d - 1)) + 1;
            if (n1 === n2) n2 = n1 + 1 <= d ? n1 + 1 : n1 - 1;

            const symbol = n1 < n2 ? '<' : '>';
            exercises.push({
                id: `alg-e5-${idx}`,
                question: `Quel symbole manque entre ${n1}/${d} et ${n2}/${d} ? (<, >, ou =)`,
                correctAnswer: symbol,
                type: 'comparison',
                options: ['<', '>', '='],
                hint: "Compare les numérateurs du haut !"
            });
        });
        return exercises;
    }

    private static generateDecimalExercises(): Exercise[] {
        const exercises: Exercise[] = [];
        const numerators = [1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 25, 75];
        
        numerators.forEach((n, idx) => {
            const denom = n >= 10 ? 100 : 10;
            const decimalVal = (n / denom).toFixed(denom === 100 ? 2 : 1).replace('.', ',');
            exercises.push({
                id: `alg-e6-${idx}`,
                question: `Écris la fraction ${n}/${denom} sous forme de nombre décimal.`,
                correctAnswer: decimalVal,
                type: 'input',
                hint: "Utilise une virgule (ex: 0,x)"
            });
        });
        return exercises;
    }

    private static generateSameDenominatorExercises(): Exercise[] {
        const exercises: Exercise[] = [];
        const denoms = [6, 8, 10, 12, 100];

        denoms.forEach((d, idx) => {
            const n1 = Math.floor(Math.random() * 4) + 1;
            const n2 = Math.floor(Math.random() * 4) + 1;
            const sum = n1 + n2;

            exercises.push({
                id: `alg-e7-${idx}`,
                question: `Calcule : ${n1}/${d} + ${n2}/${d}`,
                correctAnswer: `${sum}/${d}`,
                type: 'input',
                hint: "Additionne les numérateurs, garde le dénominateur."
            });
        });
        return exercises;
    }

    private static generateDifferentDenominatorExercises(): Exercise[] {
        return [
            { id: 'alg-e8-1', question: "Calcule : 1/2 + 1/4", correctAnswer: '3/4', type: 'input', hint: "Transforme les demis en quarts." },
            { id: 'alg-e8-2', question: "Calcule : 1/3 + 1/6", correctAnswer: '1/2', type: 'input', hint: "Dénominateur commun : 6." },
            { id: 'alg-e8-3', question: "Calcule : 1/2 + 1/3", correctAnswer: '5/6', type: 'input', hint: "Dénominateur commun : 6." },
            { id: 'alg-e8-4', question: "Soustraction : 1/2 - 1/4", correctAnswer: '1/4', type: 'input', hint: "2/4 - 1/4" },
            { id: 'alg-e8-5', question: "Calcule : 1/4 + 3/8", correctAnswer: '5/8', type: 'input', hint: "Mets les quarts en huitièmes (2/8 + 3/8)." }
        ];
    }

    private static generateAdvancedExercises(): Exercise[] {
        return [
            { id: 'alg-e9-1', question: "Quel est l'inverse de la fraction 2/3 ?", correctAnswer: '3/2', type: 'qcm', options: ['3/2', '2/3', '-2/3'], hint: "Inverse le haut et le bas." },
            { id: 'alg-e9-2', question: "Quel est l'inverse de 3/4 ?", correctAnswer: '4/3', type: 'qcm', options: ['4/3', '3/4', '1/4'], hint: "Inverse le haut et le bas." },
            { id: 'alg-e9-3', question: "Multiplication : 1/2 × 3/4", correctAnswer: '3/8', type: 'input', hint: "Haut × haut, bas × bas." },
            { id: 'alg-e9-4', question: "Diviser par une fraction, c'est multiplier par son...", correctAnswer: 'inverse', type: 'qcm', options: ['inverse', 'double', 'opposé'], hint: "La règle de la division." },
            { id: 'alg-e9-5', question: "Multiplication : 2/3 × 3/4", correctAnswer: '6/12', type: 'input', hint: "Multiplie les numérateurs et dénominateurs." }
        ];
    }
}