/** Catalogue éditorial des cours ; les adresses physiques restent centralisées dans course-paths.ts. */
import { coursePaths } from './course-paths';

export interface CourseEntry {
  id: string;
  title: string;
  subject: string;       // ex: "Mathématiques", "Français", "Sciences"
  domain: string;        // ex: "Espace", "Nombres", "Conjugaison"
  description: string;
  level: string;         // ex: "8H", "9H", "10H"
  duration?: string;     // ex: "15 min"
  isInteractive: boolean;
  href: string;          // Chemin vers le fichier HTML/Svelte autonome
  gameLink?: {
    title: string;
    route: string;
  };
}

// Chaque entrée donne le titre, la matière, le chemin publié et, si utile, le jeu associé.
export const courses: CourseEntry[] = [
  {
    id: "fractions-complet",
    title: "Fractions — cours complet",
    subject: "Mathématiques",
    domain: "Fractions",
    description: "Un parcours progressif, du partage équitable aux opérations sur les fractions.",
    level: "Progressif",
    isInteractive: true,
    href: coursePaths.fractions.complete,
    gameLink: { title: "Fraction Tower", route: "/fractionstower2" }
  },
  {
    id: "fractions-etapes",
    title: "Fractions — cours par étapes",
    subject: "Mathématiques",
    domain: "Fractions",
    description: "Choisis une étape parmi les neuf notions, ou ouvre le cahier complet.",
    level: "Étapes 1 à 9",
    isInteractive: true,
    href: coursePaths.fractions.stages,
    gameLink: { title: "Fraction Tower", route: "/fractionstower2" }
  },
  {
    id: "mesures-reference",
    title: "Conversions de mesures — référence",
    subject: "Mathématiques",
    domain: "Mesures",
    description: "Repères sur les unités, les conversions, les durées, les aires et les volumes.",
    level: "Référence",
    isInteractive: true,
    href: coursePaths.measures.reference,
    gameLink: { title: "Mesurovia", route: "/mesurovia" }
  },
  {
    id: "mesurovia-sentiers",
    title: "Mesurovia — Sentiers du Moulin",
    subject: "Mathématiques",
    domain: "Mesurovia",
    description: "Un cahier sur les mesures du quotidien, organisé en cinq sous-thèmes.",
    level: "Parcours 1",
    isInteractive: true,
    href: coursePaths.measures.mesurovia['sentiers-moulin'],
    gameLink: { title: "Jouer à Mesurovia", route: "/mesurovia" }
  },
  {
    id: "mesurovia-clairieres",
    title: "Mesurovia — Clairières du Compas",
    subject: "Mathématiques",
    domain: "Mesurovia",
    description: "Un cahier sur les longueurs, les masses, les capacités et les durées.",
    level: "Parcours 2",
    isInteractive: true,
    href: coursePaths.measures.mesurovia['clairieres-compas'],
    gameLink: { title: "Jouer à Mesurovia", route: "/mesurovia" }
  },
  {
    id: "mesurovia-canaux",
    title: "Mesurovia — Canaux des Artisans",
    subject: "Mathématiques",
    domain: "Mesurovia",
    description: "Un cahier sur les ateliers, les surfaces et les mesures décimales.",
    level: "Parcours 3",
    isInteractive: true,
    href: coursePaths.measures.mesurovia['canaux-artisans'],
    gameLink: { title: "Jouer à Mesurovia", route: "/mesurovia" }
  },
  {
    id: "mesurovia-hautes-terres",
    title: "Mesurovia — Hautes-Terres de la Mesure",
    subject: "Mathématiques",
    domain: "Mesurovia",
    description: "Un cahier avancé sur les conversions et les grandes expéditions.",
    level: "Parcours 4",
    isInteractive: true,
    href: coursePaths.measures.mesurovia['hautes-terres'],
    gameLink: { title: "Jouer à Mesurovia", route: "/mesurovia" }
  },
  {
    id: "carnet-geometrie",
    title: "Géométrie — carnet complet",
    subject: "Mathématiques",
    domain: "Espace",
    description: "Tracés de précision, compas, perpendiculaires, parallèles, recherche de points et figures usuelles.",
    level: "8H-10H",
    duration: "45 min",
    isInteractive: true,
    href: coursePaths.geometry.notebook,
    gameLink: {
      title: "Le Défi des Formes",
      route: "/geometrie"
    }
  },
  {
    id: "croquis-solides",
    title: "Construire un croquis de solide",
    subject: "Mathématiques",
    domain: "Espace",
    description: "Apprendre à représenter des solides en perspective cavalière et identifier faces, arêtes et sommets.",
    level: "8H",
    duration: "20 min",
    isInteractive: true,
    href: coursePaths.geometry.sketch,
    gameLink: {
      title: "Le Défi des Formes",
      route: "/geometrie"
    }
  }
];
