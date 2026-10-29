export type LessonSlide = {
  title: string;
  body: string;
  visual?: string;
  ask: string;
  options: string[];
  answer: string;
  explain: string;
};

export type VillageCourses = Record<string, LessonSlide[]>;

export const lesson = (
  title: string,
  body: string,
  ask: string,
  options: string[],
  answer: string,
  explain: string,
  visual = ''
): LessonSlide => ({ title, body, ask, options, answer, explain, visual });
