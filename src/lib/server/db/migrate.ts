// Point d’entrée de `npm run db:migrate` : ouvre la base et confirme son emplacement.
import { getDatabasePath, getSqlite } from './client';

getSqlite();
console.log(`SQLite classroom database is ready: ${getDatabasePath()}`);
