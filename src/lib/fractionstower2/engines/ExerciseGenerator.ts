export interface Exercise {
    id: string;
    question: string;
    correctAnswer: string;
    type: 'input' | 'qcm' | 'comparison' | 'number_line';
    options?: string[]; // Pour les QCM (avec distracteurs intelligents)
    fractions?: Array<{ numerator: number; denominator: number }>;
    hint?: string;
}

export class ExerciseGenerator {
    static generateSession(floorId: string, count: number = 10): Exercise[] {
        const floorNum = parseInt(floorId.replace('floor-', '') || '1');
        const pool = this.getPoolForFloor(floorNum);
        
        // Mélange aléatoire et sélection de 'count' questions (par défaut 10)
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    private static getPoolForFloor(floor: number): Exercise[] {
        switch (floor) {
            case 1: // Étage 1 : Partage équitable et bases
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
                    { id: 'f1-11', question: "Écris la fraction pour : 7 parts sur 10.", correctAnswer: '7/10', type: 'input', hint: "7 / 10" },
                    { id: 'f1-12', question: "Combien y a-t-il de quarts dans une unité entière ?", correctAnswer: '4', type: 'qcm', options: ['4', '2', '8', '1'], hint: "Il faut 4 parts de 1/4." }
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
                    { id: 'f2-8', question: "Comment lit-on la fraction 4/10 ?", correctAnswer: 'quatre dixièmes', type: 'qcm', options: ['quatre dixièmes', 'dix quarts', 'quatre sur dix', 'quarante'], hint: "10 en bas se lit dixièmes." },
                    { id: 'f2-9', question: "Écris en chiffres 'un neuvième'.", correctAnswer: '1/9', type: 'input', hint: "1 / 9" },
                    { id: 'f2-10', question: "Comment lit-on la fraction 5/100 ?", correctAnswer: 'cinq centièmes', type: 'qcm', options: ['cinq centièmes', 'cent cinquièmes', 'cinq sur cent'], hint: "100 en bas se lit centièmes." },
                    { id: 'f2-11', question: "Écris en chiffres 'sept quarts'.", correctAnswer: '7/4', type: 'input', hint: "7 / 4" },
                    { id: 'f2-12', question: "Comment lit-on la fraction 2/3 ?", correctAnswer: 'deux tiers', type: 'qcm', options: ['deux tiers', 'trois demis', 'deux sur trois'], hint: "2 en haut, tiers en bas." }
                ];

            case 3: // Étage 3 : La droite graduée
                return [
                    { id: 'f3-1', question: "Sur une droite de 0 à 1 partagée en 4, où se situe 3/4 ?", correctAnswer: '3/4', type: 'input', hint: "Au 3ème intervalle.", fractions: [{ numerator: 3, denominator: 4 }] },
                    { id: 'f3-2', question: "Sur une droite de 0 à 1 partagée en 5, que représente le 2e trait après 0 ?", correctAnswer: '2/5', type: 'input', hint: "2 pas sur 5." },
                    { id: 'f3-3', question: "Entre 0 et 1, si un segment est coupé en 3, le 1er trait après 0 vaut :", correctAnswer: '1/3', type: 'qcm', options: ['1/3', '3/1', '1/2', '2/3'], hint: "Premier pas sur trois." },
                    { id: 'f3-4', question: "Sur une droite graduée en quarts, quel nombre est exactement au milieu entre 0 et 1 ?", correctAnswer: '2/4', type: 'qcm', options: ['2/4', '1/4', '3/4', '1/1'], hint: "La moitié de 4." },
                    { id: 'f3-5', question: "Sur une droite de 0 à 1 partagée en 10, que vaut le 7e trait ?", correctAnswer: '7/10', type: 'input', hint: "7 / 10" },
                    { id: 'f3-6', question: "Le point 1 sur une droite graduée en tiers (0 à 1) correspond à quelle fraction ?", correctAnswer: '3/3', type: 'qcm', options: ['3/3', '1/3', '1/1', '0/3'], hint: "L'unité complète." },
                    { id: 'f3-7', question: "Sur une droite de 0 à 1 découpée en 8 parts, où est 5/8 ?", correctAnswer: '5/8', type: 'input', hint: "5e graduation." },
                    { id: 'f3-8', question: "Sur une droite graduée en 6, quel est le nom du 4e repère ?", correctAnswer: '4/6', type: 'qcm', options: ['4/6', '6/4', '2/6', '4/3'], hint: "4 sur 6." },
                    { id: 'f3-9', question: "Sur une droite de 0 à 1 en cinquièmes, que vaut le dernier trait (le 5e) ?", correctAnswer: '5/5', type: 'qcm', options: ['5/5', '1/5', '10/5', '0/5'], hint: "Égal à 1." },
                    { id: 'f3-10', question: "Sur une droite de 0 à 1 en demis, où se place 1/2 ?", correctAnswer: '1/2', type: 'input', hint: "Au milieu." }
                ];

            case 4: // Étage 4 : Équivalences et simplification
                return [
                    { id: 'f4-1', question: "Complète l'égalité : 1/2 = ? / 4", correctAnswer: '2', type: 'input', hint: "Multiplie par 2 en haut et en bas." },
                    { id: 'f4-2', question: "Simplifie la fraction 2/4 pour trouver une fraction équivalente irréductible.", correctAnswer: '1/2', type: 'qcm', options: ['1/2', '2/2', '1/4', '2/1'], hint: "Divise par 2." },
                    { id: 'f4-3', question: "Quelle fraction est équivalente à 2/3 ? (multiplie par 2)", correctAnswer: '4/6', type: 'qcm', options: ['4/6', '3/6', '2/6', '6/4'], hint: "Distracteur piège d'inversion : 6/4 !" },
                    { id: 'f4-4', question: "Complète : 1/3 = 2 / ?", correctAnswer: '6', type: 'input', hint: "1×2=2, donc 3×2=?" },
                    { id: 'f4-5', question: "Simplifie la fraction 4/8.", correctAnswer: '1/2', type: 'qcm', options: ['1/2', '2/4', '1/4', '4/4'], hint: "Moitié de 8 c'est 4." },
                    { id: 'f4-6', question: "Par quel nombre a-t-on multiplié 3/4 pour obtenir 6/8 ?", correctAnswer: '2', type: 'qcm', options: ['2', '3', '4', '1'], hint: "3×2=6 et 4×2=8." },
                    { id: 'f4-7', question: "Trouve le numérateur manquant : ? / 6 = 1/2", correctAnswer: '3', type: 'input', hint: "La moitié de 6." },
                    { id: 'f4-8', question: "Simplifie 5/10.", correctAnswer: '1/2', type: 'qcm', options: ['1/2', '1/5', '2/5', '5/5'], hint: "C'est la moitié." },
                    { id: 'f4-9', question: "Est-ce que 3/4 et 6/8 sont équivalentes ?", correctAnswer: 'oui', type: 'qcm', options: ['oui', 'non'], hint: "Oui, amplifiée par 2." },
                    { id: 'f4-10', question: "Complète : 2/5 = 4 / ?", correctAnswer: '10', type: 'input', hint: "5 × 2 = ?" }
                ];

            case 5: // Étage 5 : Comparer et ordonner
                return [
                    { id: 'f5-1', question: "Quel symbole manque entre 3/8 et 5/8 ? (<, >, ou =)", correctAnswer: '<', type: 'comparison', options: ['<', '>', '='], hint: "3 parts c'est plus petit que 5 parts." },
                    { id: 'f5-2', question: "Quel symbole manque entre 7/10 et 4/10 ?", correctAnswer: '>', type: 'comparison', options: ['<', '>', '='], hint: "7 est plus grand que 4." },
                    { id: 'f5-3', question: "Entre 1/4 et 3/4, quelle est la plus grande fraction ?", correctAnswer: '3/4', type: 'qcm', options: ['3/4', '1/4', 'égales', 'impossible'], hint: "Le plus grand numérateur." },
                    { id: 'f5-4', question: "Compare avec le même numérateur : 2/3 ... 2/5 (laquelle est plus grande ?)", correctAnswer: '2/3', type: 'qcm', options: ['2/3', '2/5', 'égales'], hint: "Des tiers sont plus grands que des cinquièmes !" },
                    { id: 'f5-5', question: "Quel symbole entre 4/6 et 4/6 ?", correctAnswer: '=', type: 'comparison', options: ['<', '>', '='], hint: "Elles sont identiques." },
                    { id: 'f5-6', question: "Range dans l'ordre croissant : 1/5, 4/5, 2/5. La plus petite est :", correctAnswer: '1/5', type: 'qcm', options: ['1/5', '2/5', '4/5'], hint: "La plus petite part." },
                    { id: 'f5-7', question: "Quel symbole entre 5/12 et 7/12 ?", correctAnswer: '<', type: 'comparison', options: ['<', '>', '='], hint: "5 est plus petit que 7." },
                    { id: 'f5-8', question: "Quelle fraction est plus grande entre 1/2 et 1/3 ?", correctAnswer: '1/2', type: 'qcm', options: ['1/2', '1/3', 'égales'], hint: "Partager en 2 fait de plus grosses parts qu'en 3." },
                    { id: 'f5-9', question: "Quel symbole entre 9/10 et 8/10 ?", correctAnswer: '>', type: 'comparison', options: ['<', '>', '='], hint: "9 > 8." },
                    { id: 'f5-10', question: "Quel symbole entre 2/7 et 5/7 ?", correctAnswer: '<', type: 'comparison', options: ['<', '>', '='], hint: "2 < 5." }
                ];

            case 6: // Étage 6 : Fractions décimales
                return [
                    { id: 'f6-1', question: "Écris 7/10 sous forme de nombre décimal.", correctAnswer: '0,7', type: 'input', hint: "Utilise une virgule : 0,7 (ou 0.7)" },
                    { id: 'f6-2', question: "Écris 35/100 sous forme de nombre décimal.", correctAnswer: '0,35', type: 'input', hint: "Zéro virgule trente-cinq." },
                    { id: 'f6-3', question: "Combien font 75 centimes en fraction de franc (sur 100) ?", correctAnswer: '75/100', type: 'input', hint: "75 / 100" },
                    { id: 'f6-4', question: "Quel nombre décimal correspond à la fraction décimale 4/10 ?", correctAnswer: '0,4', type: 'qcm', options: ['0,4', '0,04', '4,0', '0,14'], hint: "Quatre dixièmes." },
                    { id: 'f6-5', question: "Convertis 0,5 en fraction décimale (sur 10 ou 100).", correctAnswer: '5/10', type: 'qcm', options: ['5/10', '50/10', '1/5', '0,5/10'], hint: "La moitié de 10." },
                    { id: 'f6-6', question: "Écris 8/100 en nombre décimal.", correctAnswer: '0,08', type: 'input', hint: "Attention au zéro des dixièmes !" },
                    { id: 'f6-7', question: "Quelle fraction décimale correspond à 0,25 ?", correctAnswer: '25/100', type: 'qcm', options: ['25/100', '2/5', '2,5/10', '5/25'], hint: "Un quart d'un cent." },
                    { id: 'f6-8', question: "Convertis 1 entier et 3/10 en décimal.", correctAnswer: '1,3', type: 'input', hint: "1,3" },
                    { id: 'f6-9', question: "Écris 9/10 en décimal.", correctAnswer: '0,9', type: 'input', hint: "0,9" },
                    { id: 'f6-10', question: "Combien font 50 centimes en fraction (sur 100) ?", correctAnswer: '50/100', type: 'qcm', options: ['50/100', '5/100', '10/50'], hint: "La moitié d'un franc." }
                ];

            case 7: // Étage 7 : Addition / Soustraction (même dénominateur)
                return [
                    { id: 'f7-1', question: "Calcule : 2/7 + 3/7", correctAnswer: '5/7', type: 'input', hint: "Additionne les numérateurs (2+3), garde le dénominateur." },
                    { id: 'f7-2', question: "Calcule : 5/9 - 2/9", correctAnswer: '3/9', type: 'input', hint: "Soustrait les numérateurs (5-2)." },
                    { id: 'f7-3', question: "Comb font 3/8 + 4/8 ?", correctAnswer: '7/8', type: 'input', hint: "3 + 4 = 7" },
                    { id: 'f7-4', question: "Distracteur piège : 2/5 + 1/5 donne...", correctAnswer: '3/5', type: 'qcm', options: ['3/5', '3/10', '5/5', '2/25'], hint: "Ne jamais additionner les dénominateurs du bas !" },
                    { id: 'f7-5', question: "Calcule : 7/10 - 4/10", correctAnswer: '3/10', type: 'input', hint: "7 - 4 = 3" },
                    { id: 'f7-6', question: "Calcule : 1/6 + 3/6", correctAnswer: '4/6', type: 'input', hint: "1 + 3 = 4" },
                    { id: 'f7-7', question: "Calcule : 8/12 - 3/12", correctAnswer: '5/12', type: 'input', hint: "8 - 3 = 5" },
                    { id: 'f7-8', question: "Calcule : 2/9 + 4/9", correctAnswer: '6/9', type: 'input', hint: "2 + 4 = 6" },
                    { id: 'f7-9', question: "Calcule : 4/5 - 1/5", correctAnswer: '3/5', type: 'input', hint: "4 - 1 = 3" },
                    { id: 'f7-10', question: "Calcule : 3/10 + 5/10", correctAnswer: '8/10', type: 'input', hint: "3 + 5 = 8" }
                ];

            case 8: // Étage 8 : Dénominateurs différents
                return [
                    { id: 'f8-1', question: "Pour calculer 1/2 + 1/4, en combien de parts égales convertis-tu les demis ?", correctAnswer: '4', type: 'input', hint: "Le dénominateur commun est 4." },
                    { id: 'f8-2', question: "Calcule : 1/2 + 1/4 (donne la fraction finale simplifiée)", correctAnswer: '3/4', type: 'input', hint: "1/2 devient 2/4, puis 2/4 + 1/4 = ?" },
                    { id: 'f8-3', question: "Quel dénominateur commun choisir pour additionner 1/3 et 1/6 ?", correctAnswer: '6', type: 'qcm', options: ['6', '9', '3', '18'], hint: "Le plus petit multiple commun." },
                    { id: 'f8-4', question: "Calcule : 1/3 + 1/6", correctAnswer: '1/2', type: 'input', hint: "2/6 + 1/6 = 3/6, ce qui se simplifie en 1/2 !" },
                    { id: 'f8-5', question: "Transforme 1/2 en quarts pour l'additionner avec 1/4 :", correctAnswer: '2/4', type: 'qcm', options: ['2/4', '1/4', '4/2', '2/2'], hint: "Multiplie haut et bas par 2." },
                    { id: 'f8-6', question: "Calcule : 2/5 + 3/10", correctAnswer: '7/10', type: 'input', hint: "4/10 + 3/10 = 7/10" },
                    { id: 'f8-7', question: "Quel est le dénominateur commun pour 1/2 et 1/3 ?", correctAnswer: '6', type: 'qcm', options: ['6', '5', '2', '3'], hint: "2 × 3 = 6" },
                    { id: 'f8-8', question: "Calcule : 1/2 + 1/3", correctAnswer: '5/6', type: 'input', hint: "3/6 + 2/6 = 5/6" },
                    { id: 'f8-9', question: "Soustraction : 1/2 - 1/4", correctAnswer: '1/4', type: 'input', hint: "2/4 - 1/4 = 1/4" },
                    { id: 'f8-10', question: "Calcule : 3/4 - 1/2", correctAnswer: '1/4', type: 'input', hint: "3/4 - 2/4 = 1/4" }
                ];

            case 9: // Étage 9 : Multiplication et division
            default:
                return [
                    { id: 'f9-1', question: "Quel est l'inverse de la fraction 2/3 ?", correctAnswer: '3/2', type: 'qcm', options: ['3/2', '2/3', '-2/3', '3/-2'], hint: "Inverse le numérateur et le dénominateur (distracteur piège : 2/3 !)." },
                    { id: 'f9-2', question: "Quel est l'inverse de 3/4 ?", correctAnswer: '4/3', type: 'qcm', options: ['4/3', '3/4', '1/4', '4/1'], hint: "Le haut va en bas, le bas va en haut." },
                    { id: 'f9-3', question: "Multiplication : 1/2 × 3/4 (multiplie les hauts entre eux et les bas entre eux)", correctAnswer: '3/8', type: 'input', hint: "1×3=3 et 2×4=8." },
                    { id: 'f9-4', question: "Multiplication : 2/3 × 3/5", correctAnswer: '6/15', type: 'input', hint: "2×3=6 et 3×5=15 (ou 2/5 si simplifié)." },
                    { id: 'f9-5', question: "Quel est l'inverse de la fraction 5/7 ?", correctAnswer: '7/5', type: 'qcm', options: ['7/5', '5/7', '-5/7', '7/12'], hint: "7 sur 5." },
                    { id: 'f9-6', question: "Diviser par une fraction, c'est multiplier par son...", correctAnswer: 'inverse', type: 'qcm', options: ['inverse', double, 'opposé', 'multiple'], hint: "La règle d'or de la division de fractions." },
                    { id: 'f9-7', question: "Multiplication : 1/4 × 2/3", correctAnswer: '2/12', type: 'input', hint: "1×2=2 et 4×3=12 (ou 1/6)." },
                    { id: 'f9-8', question: "Quel est l'inverse de 1/2 ?", correctAnswer: '2/1', type: 'qcm', options: ['2/1', '1/2', '2/2', '0/1'], hint: "2 sur 1 (qui fait 2)." },
                    { id: 'f9-9', question: "Multiplication : 3/5 × 1/2", correctAnswer: '3/10', type: 'input', hint: "3×1=3 et 5×2=10." },
                    { id: 'f9-10', question: "Quel est l'inverse de 4/5 ?", correctAnswer: '5/4', type: 'qcm', options: ['5/4', '4/5', '1/4'], hint: "5 sur 4." }
                ];
        }
    }
}