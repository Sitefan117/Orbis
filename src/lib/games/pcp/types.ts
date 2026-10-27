/** Types de l’interface PCP ; ils décrivent les brouillons manipulés par la page. */
export type PcpScreen = 'home' | 'cv' | 'letter';

export type CvFields = {
  perso: string;
  accroche: string;
  ecole: string;
  stages: string;
  langues: string;
  info: string;
  hobbies: string;
  references: string;
};

export type LetterFields = {
  exp: string;
  dest: string;
  date: string;
  objet: string;
  appel: string;
  p1: string;
  p2: string;
  p3: string;
  sig: string;
};

export type ChatMessage = { role: 'user' | 'assistant'; content: string; context?: string };
