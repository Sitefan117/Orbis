// Source de vérité pédagogique de Fractions Tower.
// Les neuf étages font partie du parcours actuellement jouable.

export interface FloorCurriculum {
	number: number;
	id: string;
	title: string;
	objective: string;
	prerequisites: string[];
	trainingFocus: string;
	bossFocus: string;
	status: 'active' | 'planned';
}

export const FLOOR_CURRICULUM: readonly FloorCurriculum[] = [
	{
		number: 1, id: 'floor-1', title: 'Le partage équitable',
		objective: 'Comprendre l’unité, les parts égales, le numérateur et le dénominateur.',
		prerequisites: [], trainingFocus: 'Identifier une fraction représentée.',
		bossFocus: 'Lire et représenter des fractions simples.', status: 'active'
	},
	{
		number: 2, id: 'floor-2', title: 'Lire et représenter les fractions',
		objective: 'Passer entre une représentation visuelle, une écriture fractionnaire et son nom.',
		prerequisites: ['Parts égales', 'Numérateur et dénominateur'],
		trainingFocus: 'Associer image, écriture et lecture des fractions.',
		bossFocus: 'Associer représentation, écriture fractionnaire et nom des fractions simples.', status: 'active'
	},
	{
		number: 3, id: 'floor-3', title: 'La droite graduée',
		objective: 'Placer et lire des fractions simples entre deux repères.',
		prerequisites: ['Unité', 'Parts égales', 'Lecture des fractions'],
		trainingFocus: 'Repérer une fraction sur une droite graduée.',
		bossFocus: 'Comparer une position et une fraction.', status: 'active'
	},
	{
		number: 4, id: 'floor-4', title: 'Fractions équivalentes et simplification',
		objective: 'Reconnaître des fractions de même valeur et les simplifier.',
		prerequisites: ['Multiplication et division simples', 'Lecture des fractions'],
		trainingFocus: 'Compléter et simplifier des fractions équivalentes.',
		bossFocus: 'Transformer une fraction sans changer sa valeur.', status: 'active'
	},
	{
		number: 5, id: 'floor-5', title: 'Comparer et ordonner',
		objective: 'Comparer puis ranger des fractions, y compris avec dénominateurs différents.',
		prerequisites: ['Droite graduée', 'Fractions équivalentes'],
		trainingFocus: 'Utiliser <, > et = puis ordonner des fractions.',
		bossFocus: 'Choisir une stratégie de comparaison pertinente.', status: 'active'
	},
	{
		number: 6, id: 'floor-6', title: 'Fractions décimales et nombres décimaux',
		objective: 'Relier dixièmes, centièmes et millièmes aux écritures décimales.',
		prerequisites: ['Valeur de position', 'Fractions sur 10, 100 et 1 000'],
		trainingFocus: 'Convertir une fraction décimale en nombre décimal et inversement.',
		bossFocus: 'Passer correctement entre les deux écritures.', status: 'active'
	},
	{
		number: 7, id: 'floor-7', title: 'Addition et soustraction : même dénominateur',
		objective: 'Additionner et soustraire des fractions de même dénominateur.',
		prerequisites: ['Numérateur', 'Dénominateur', 'Fractions équivalentes'],
		trainingFocus: 'Calculer en conservant le dénominateur commun.',
		bossFocus: 'Résoudre des calculs et des situations simples.', status: 'active'
	},
	{
		number: 8, id: 'floor-8', title: 'Dénominateurs différents',
		objective: 'Réduire au même dénominateur avant de calculer.',
		prerequisites: ['Fractions équivalentes', 'Addition et soustraction même dénominateur'],
		trainingFocus: 'Trouver un dénominateur commun.',
		bossFocus: 'Résoudre une addition ou une soustraction complète.', status: 'active'
	},
	{
		number: 9, id: 'floor-9', title: 'Multiplication et division de fractions',
		objective: 'Multiplier des fractions puis comprendre la division par l’inverse.',
		prerequisites: ['Simplification', 'Multiplication et division des entiers'],
		trainingFocus: 'Calculer des produits et des quotients, expliquer l’inverse et résoudre des situations.',
		bossFocus: 'Choisir l’opération et expliquer son calcul dans une situation-problème.', status: 'active'
	}
];

export const ACTIVE_FLOOR_CURRICULUM = FLOOR_CURRICULUM.filter(
	(floor) => floor.status === 'active'
);

export function getFloorCurriculum(floorId: string): FloorCurriculum | undefined {
	return FLOOR_CURRICULUM.find((floor) => floor.id === floorId);
}
