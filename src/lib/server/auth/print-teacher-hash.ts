// Outil terminal : lit le secret fourni et n’affiche que son empreinte.
import { hashTeacherPassword } from './password-hash';

const password = process.env.TEACHER_PASSWORD_INPUT ?? process.argv.slice(2).join(' ');

if (!password) {
  console.error('Usage: TEACHER_PASSWORD_INPUT="mot de passe enseignant" npm run teacher:hash');
  process.exit(1);
}

console.log(hashTeacherPassword(password));
