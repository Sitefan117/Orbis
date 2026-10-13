export interface Exercise {
    id: string;
    question: string;
    correctAnswer: string | number;
    type: 'comparison' | 'input' | 'choice' | 'number_line' | 'addition' | 'decimal_conversion';
    choices?: string[];
    fractions?: { numerator: number; denominator: number }[];
}

export class ExerciseGenerator {
    static generate(params: { floorId: string | number; difficulty?: string; type?: string }): Exercise {
        let rawFloor = String(params.floorId ?? 'floor-1').trim().toLowerCase();
        
        // Si c'est une intro sans numéro explicite, on cible l'étage 2 par défaut
        if (rawFloor.includes('intro')) {
            if (rawFloor.includes('3')) rawFloor = 'floor-3';
            else if (rawFloor.includes('4')) rawFloor = 'floor-4';
            else if (rawFloor.includes('5')) rawFloor = 'floor-5';
            else if (rawFloor.includes('6')) rawFloor = 'floor-6';
            else if (rawFloor.includes('7')) rawFloor = 'floor-7';
            else if (rawFloor.includes('8')) rawFloor = 'floor-8';
            else if (rawFloor.includes('9')) rawFloor = 'floor-9';
            else rawFloor = 'floor-2'; // Par défaut sur l'étage 2 pour l'intro actuelle
        }

        const floor = rawFloor.startsWith('floor-') ? rawFloor : `floor-${rawFloor}`;

        switch (floor) {
            // ==========================================
            // ÉTAGE 1 : Le partage équitable
            // ==========================================
            case 'floor-1': {
                const den = [3, 4, 5, 6, 7, 8, 9, 10, 12][Math.floor(Math.random() * 9)];
                const num = Math.floor(Math.random() * (den - 1)) + 1;
                const contexts = ['une orange', 'une tablette de chocolat', 'une pizza', 'une tarte', 'une barre', 'un gâteau', 'une feuille'];
                const context = contexts[Math.floor(Math.random() * contexts.length)];
                const mode = Math.floor(Math.random() * 7);

                if (mode === 0) {
                    return {
                        id: 'f1-den-context',
                        question: `On partage ${context} en ${den} parts de même taille. Combien y a-t-il de parts en tout ?`,
                        correctAnswer: den,
                        type: 'input'
                    };
                }
                if (mode === 1) {
                    return {
                        id: 'f1-num-context',
                        question: `Dans la fraction ${num}/${den}, quel nombre est le numérateur ?`,
                        correctAnswer: num,
                        type: 'input'
                    };
                }
                if (mode === 2) {
                    return {
                        id: 'f1-denominator',
                        question: `Dans la fraction ${num}/${den}, quel nombre est le dénominateur ?`,
                        correctAnswer: den,
                        type: 'input'
                    };
                }
                if (mode === 3) {
                    return {
                        id: 'f1-write',
                        question: `On prend ${num} parts parmi ${den} parts égales. Écris la fraction prise.`,
                        correctAnswer: `${num}/${den}`,
                        type: 'input'
                    };
                }
                if (mode === 4) {
                    return {
                        id: 'f1-whole',
                        question: `Une barre est partagée en ${den} parts égales. Toutes les ${den} parts sont présentes. Écris la fraction qui représente le tout.`,
                        correctAnswer: `${den}/${den}`,
                        type: 'input'
                    };
                }
                if (mode === 5) {
                    const taken = Math.floor(Math.random() * (den - 1)) + 1;
                    return {
                        id: 'f1-read-story',
                        question: `Une tablette comporte ${den} carrés égaux. ${taken} carrés sont pris. Écris la fraction prise.`,
                        correctAnswer: `${taken}/${den}`,
                        type: 'input'
                    };
                }
                const chosen = Math.floor(Math.random() * (den - 1)) + 1;
                return {
                    id: 'f1-identify',
                    question: `Dans ${chosen}/${den}, combien de parts sont prises ?`,
                    correctAnswer: chosen,
                    type: 'input'
                };
            }

            // ==========================================
            // ÉTAGE 2 : Lire et représenter les fractions
            // ==========================================
            case 'floor-2': {
                const pairs = [
                    { numerator: 1, denominator: 2, words: 'une moitié' },
                    { numerator: 1, denominator: 3, words: 'un tiers' },
                    { numerator: 2, denominator: 3, words: 'deux tiers' },
                    { numerator: 1, denominator: 4, words: 'un quart' },
                    { numerator: 3, denominator: 4, words: 'trois quarts' },
                    { numerator: 2, denominator: 5, words: 'deux cinquièmes' },
                    { numerator: 3, denominator: 5, words: 'trois cinquièmes' },
                    { numerator: 4, denominator: 7, words: 'quatre septièmes' },
                    { numerator: 5, denominator: 6, words: 'cinq sixièmes' },
                    { numerator: 3, denominator: 9, words: 'trois neuvièmes' },
                    { numerator: 6, denominator: 8, words: 'six huitièmes' },
                    { numerator: 5, denominator: 4, words: 'cinq quarts' },
                    { numerator: 7, denominator: 10, words: 'sept dixièmes' }
                ];
                const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
                const p = pick(pairs);
                const mode = Math.floor(Math.random() * 7);

                if (mode === 0) {
                    return { id: 'f2-words-to-fraction', question: `Écris en chiffres : « ${p.words} ».`, correctAnswer: `${p.numerator}/${p.denominator}`, type: 'input' };
                }
                if (mode === 1) {
                    return { id: 'f2-picture-to-fraction', question: `La barre est partagée en ${p.denominator} parts égales. ${p.numerator} sont coloriées. Écris la fraction représentée.`, correctAnswer: `${p.numerator}/${p.denominator}`, type: 'input', fractions: [{ numerator: p.numerator, denominator: p.denominator }] };
                }
                if (mode === 2) {
                    return { id: 'f2-fraction-to-words', question: `Écris avec des mots : ${p.numerator}/${p.denominator}.`, correctAnswer: p.words, type: 'input' };
                }
                if (mode === 3) {
                    const context = pick([
                        { question: `Une distance est divisée en ${p.denominator} segments égaux. Tu en parcours ${p.numerator}. Quelle fraction as-tu parcourue ?`, answer: `${p.numerator}/${p.denominator}` },
                        { question: `Une tablette a ${p.denominator} carrés égaux. ${p.numerator} carrés sont encore là. Quelle fraction reste-t-il ?`, answer: `${p.numerator}/${p.denominator}` },
                        { question: `Une recette demande de compter ${p.denominator} mesures identiques. Tu en utilises ${p.numerator}. Écris la fraction utilisée.`, answer: `${p.numerator}/${p.denominator}` }
                    ]);
                    return { id: 'f2-situation', question: context.question, correctAnswer: context.answer, type: 'input' };
                }
                if (mode === 4) {
                    return { id: 'f2-denominator', question: `Dans la fraction ${p.numerator}/${p.denominator}, combien y a-t-il de parts égales en tout ?`, correctAnswer: p.denominator, type: 'input', fractions: [{ numerator: p.numerator, denominator: p.denominator }] };
                }
                if (mode === 5) {
                    return { id: 'f2-one-third-context', question: 'Une boîte contient 12 chocolats identiques. Un tiers de la boîte représente combien de chocolats ?', correctAnswer: 4, type: 'input' };
                }
                return { id: 'f2-whole', question: `Un tout est partagé en ${p.denominator} parts égales. Toutes les parts sont présentes. Écris la fraction qui représente le tout.`, correctAnswer: `${p.denominator}/${p.denominator}`, type: 'input' };
            }

            // ==========================================
            // ÉTAGE 3 : La droite graduée
            // ==========================================
            case 'floor-3': {
                const den = [4, 5, 6, 8, 10][Math.floor(Math.random() * 5)];
                const num = Math.floor(Math.random() * (den - 1)) + 1;
                return {
                    id: 'f3-1',
                    question: `Sur une droite de 0 à 1 partagée en ${den} intervalles égaux, à quelle fraction correspond le ${num}e trait après 0 ?`,
                    correctAnswer: `${num}/${den}`,
                    type: 'number_line',
                    fractions: [{ numerator: num, denominator: den }]
                };
            }

            // ==========================================
            // ÉTAGE 4 : Fractions équivalentes et simplification
            // ==========================================
            case 'floor-4': {
                const sub = Math.floor(Math.random() * 2);
                if (sub === 0) {
                    const baseNum = [1, 2][Math.floor(Math.random() * 2)];
                    const baseDen = baseNum * 2;
                    const mult = [2, 3, 4][Math.floor(Math.random() * 3)];
                    return {
                        id: 'f4-1',
                        question: `Complète l'égalité : ${baseNum}/${baseDen} = ?/${baseDen * mult}`,
                        correctAnswer: baseNum * mult,
                        type: 'input'
                    };
                } else {
                    const fracs = [
                        { orig: '4/8', simp: '1/2' },
                        { orig: '6/9', simp: '2/3' },
                        { orig: '8/12', simp: '2/3' },
                        { orig: '5/10', simp: '1/2' },
                        { orig: '14/21', simp: '2/3' }
                    ];
                    const f = fracs[Math.floor(Math.random() * fracs.length)];
                    return {
                        id: 'f4-2',
                        question: `Simplifie au maximum la fraction ${f.orig}.`,
                        correctAnswer: f.simp,
                        type: 'input'
                    };
                }
            }

            // ==========================================
            // ÉTAGE 5 : Comparer et ordonner
            // ==========================================
            case 'floor-5':
            case 'boss-bilan-5': {
                const typeOp = Math.random();
                if (typeOp < 0.6) {
                    const den = [4, 5, 7, 8, 10][Math.floor(Math.random() * 5)];
                    const n1 = Math.floor(Math.random() * (den - 2)) + 1;
                    const n2 = n1 + Math.floor(Math.random() * 2) + 1;
                    const [left, right] = Math.random() > 0.5 ? [n1, n2] : [n2, n1];
                    const sym = left < right ? '<' : left > right ? '>' : '=';
                    return {
                        id: 'f5-comp',
                        question: `Compare avec <, > ou = : ${left}/${den} ___ ${right}/${den}`,
                        correctAnswer: sym,
                        type: 'comparison',
                        fractions: [
                            { numerator: left, denominator: den },
                            { numerator: right, denominator: den }
                        ]
                    };
                } else {
                    const pairs = [
                        { f1: '3/5', f2: '3/8', ans: '>' },
                        { f1: '1/3', f2: '1/2', ans: '<' },
                        { f1: '2/3', f2: '3/4', ans: '<' }
                    ];
                    const p = pairs[Math.floor(Math.random() * pairs.length)];
                    const [n1, d1] = p.f1.split('/').map(Number);
                    const [n2, d2] = p.f2.split('/').map(Number);
                    return {
                        id: 'f5-comp2',
                        question: `Compare avec <, > ou = : ${p.f1} ___ ${p.f2}`,
                        correctAnswer: p.ans,
                        type: 'comparison',
                        fractions: [
                            { numerator: n1, denominator: d1 },
                            { numerator: n2, denominator: d2 }
                        ]
                    };
                }
            }

            // ==========================================
            // ÉTAGE 6 : Fractions décimales et décimaux
            // ==========================================
            case 'floor-6': {
                const sub = Math.floor(Math.random() * 3);
                if (sub === 0) {
                    const dec = [10, 100][Math.floor(Math.random() * 2)];
                    const num = Math.floor(Math.random() * (dec - 1)) + 1;
                    const val = dec === 10 ? (num / 10).toFixed(1) : (num / 100).toFixed(2);
                    return {
                        id: 'f6-1',
                        question: `Convertis la fraction décimale ${num}/${dec} en nombre décimal.`,
                        correctAnswer: val.replace('.', ','),
                        type: 'input'
                    };
                } else if (sub === 1) {
                    return {
                        id: 'f6-2',
                        question: `Écris le nombre décimal 0,06 sous forme de fraction décimale.`,
                        correctAnswer: '6/100',
                        type: 'input'
                    };
                } else {
                    return {
                        id: 'f6-3',
                        question: `75 centimes représentent quelle fraction de 1 CHF ? (ex: 75/100)`,
                        correctAnswer: '75/100',
                        type: 'input'
                    };
                }
            }

            // ==========================================
            // ÉTAGE 7 : Addition et soustraction (même dénominateur)
            // ==========================================
            case 'floor-7': {
                const den = [6, 7, 8, 10, 12][Math.floor(Math.random() * 5)];
                const n1 = Math.floor(Math.random() * 3) + 1;
                const n2 = Math.floor(Math.random() * 3) + 1;
                const isAdd = Math.random() > 0.5;
                if (isAdd) {
                    const sum = n1 + n2;
                    return {
                        id: 'f7-1',
                        question: `Calcule : ${n1}/${den} + ${n2}/${den}`,
                        correctAnswer: `${sum}/${den}`,
                        type: 'input'
                    };
                } else {
                    const big = Math.max(n1, n2) + 2;
                    const small = Math.min(n1, n2);
                    const diff = big - small;
                    return {
                        id: 'f7-2',
                        question: `Calcule : ${big}/${den} - ${small}/${den}`,
                        correctAnswer: `${diff}/${den}`,
                        type: 'input'
                    };
                }
            }

            // ==========================================
            // ÉTAGE 8 : Dénominateurs différents
            // ==========================================
            case 'floor-8': {
                const problems = [
                    { q: '1/2 + 1/4', a: '3/4' },
                    { q: '1/3 + 1/6', a: '1/2' },
                    { q: '3/4 - 1/2', a: '1/4' },
                    { q: '2/5 + 1/10', a: '1/2' },
                    { q: '3/4 - 1/6', a: '7/12' }
                ];
                const p = problems[Math.floor(Math.random() * problems.length)];
                return {
                    id: 'f8-1',
                    question: `Calcule et simplifie si besoin : ${p.q}`,
                    correctAnswer: p.a,
                    type: 'input'
                };
            }

            // ==========================================
            // ÉTAGE 9 : Multiplication et division
            // ==========================================
            case 'floor-9':
            case 'boss-final-9': {
                const sub = Math.random();
                if (sub < 0.5) {
                    const mults = [
                        { q: '2/5 × 3/4', a: '3/10' },
                        { q: '1/3 × 3/7', a: '1/7' },
                        { q: '3/4 × 2/3', a: '1/2' }
                    ];
                    const m = mults[Math.floor(Math.random() * mults.length)];
                    return {
                        id: 'f9-mult',
                        question: `Calcule le produit : ${m.q}`,
                        correctAnswer: m.a,
                        type: 'input'
                    };
                } else {
                    const divs = [
                        { q: '1/2 ÷ 1/4', a: '2' },
                        { q: '2/3 ÷ 1/6', a: '4' },
                        { q: '3/5 ÷ 1/10', a: '6' }
                    ];
                    const d = divs[Math.floor(Math.random() * divs.length)];
                    return {
                        id: 'f9-div',
                        question: `Calcule le quotient : ${d.q}`,
                        correctAnswer: d.a,
                        type: 'input'
                    };
                }
            }

            default:
                return {
                    id: 'default',
                    question: `Écris la fraction correspondant à 1 part sur 2.`,
                    correctAnswer: '1/2',
                    type: 'input',
                    fractions: [{ numerator: 1, denominator: 2 }]
                };
        }
    }
}