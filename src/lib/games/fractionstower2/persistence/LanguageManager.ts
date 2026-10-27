// -----------------------------------------------------------------------------
// GESTIONNAIRE DE LANGUES
// Permet de traduire l'application dynamiquement.
// -----------------------------------------------------------------------------

export type LanguageCode = 'fr-FR' | 'ru-RU';

// État global pour la langue actuelle
export const languageState = {
	current: 'fr-FR' as LanguageCode
};

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
	'fr-FR': {
		'course.unit.title': "L'Unité",
		'course.unit.text': "Tout commence par une unité. C'est un objet entier, non coupé.",
		'course.division.title': "Le Découpage (Le Dénominateur)",
		'course.division.text': "Le dénominateur (le chiffre du bas) nous dit en combien de parts ÉGALES on coupe l'unité.",
		'course.filling.title': "Le Choix (Le Numérateur)",
		'course.filling.text': "Le numérateur (le chiffre du haut) nous dit combien de parts on choisit ou on colorie.",
		'course.validation.title': "Vérifions ensemble !",
		'course.validation.text': "Si on coupe en 4 et qu'on en prend 3, quelle fraction obtient-on ?",
		'training.question': "Combien de parts sont colorées ?",
		'feedback.correct': "✅ Bravo ! C'est correct.",
		'feedback.wrong': "❌ Ce n'est pas tout à fait ça. Regarde bien les parts coloriées.",
		'boss.victory': "VICTOIRE ! Tu as maîtrisé les bases des fractions.",
	},
	'ru-RU': {
		'course.unit.title': "Единица",
		'course.unit.text': "Все начинается с единицы. Это целый объект, который не разделен.",
		'course.division.title': "Разделение (Знаменатель)",
		'course.division.text': "Знаменатель (нижнее число) говорит нам, на сколько РАВНЫХ частей мы делим единицу.",
		'course.filling.title': "Выбор (Числитель)",
		'course.filling.text': "Числитель (верхнее число) говорит нам, сколько частей мы выбираем или закрашиваем.",
		'course.validation.title': "Давайте проверим!",
		'course.validation.text': "Если мы разделим на 4 и возьмем 3, какую дробь мы получим?",
		'training.question': "Сколько частей закрашено?",
		'feedback.correct': "✅ Молодец! Это правильно.",
		'feedback.wrong': "❌ Не совсем так. Посмотри внимательно на закрашенные части.",
		'boss.victory': "ПОБЕДА! Вы освоили основы дробей.",
	}
};

export function t(key: string): string {
	return TRANSLATIONS[languageState.current][key] || key;
}
