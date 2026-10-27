/** Ouvre SQLite et applique le schéma minimal requis par les services serveur. */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as schema from './schema';

// Tables créées au premier accès pour démarrer sans étape manuelle distincte.
const FOUNDATION_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  display_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS students_normalized_name_idx ON students (normalized_name);

CREATE TABLE IF NOT EXISTS activity_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  world TEXT NOT NULL,
  mission TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  score_basis TEXT NOT NULL DEFAULT 'last',
  error_count INTEGER NOT NULL DEFAULT 0,
  error_families_json TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS activity_results_student_idx ON activity_results (student_id);
CREATE INDEX IF NOT EXISTS activity_results_world_idx ON activity_results (world);
CREATE INDEX IF NOT EXISTS activity_results_created_at_idx ON activity_results (created_at);

CREATE TABLE IF NOT EXISTS world_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  world TEXT NOT NULL,
  mission TEXT NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  last_score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  completions INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS world_progress_student_world_mission_idx ON world_progress (student_id, world, mission);
CREATE INDEX IF NOT EXISTS world_progress_student_idx ON world_progress (student_id);

CREATE TABLE IF NOT EXISTS teacher_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  world TEXT,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS teacher_notes_student_idx ON teacher_notes (student_id);

CREATE TABLE IF NOT EXISTS teacher_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS teacher_sessions_expires_at_idx ON teacher_sessions (expires_at);

CREATE TABLE IF NOT EXISTS classroom_schema_state (
  id TEXT PRIMARY KEY NOT NULL,
  applied_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO classroom_schema_state (id, applied_at)
VALUES ('foundation', strftime('%s', 'now') * 1000);
`;

// La connexion et l’état d’initialisation sont réutilisés par le processus serveur.
let sqlite: Database.Database | undefined;
let schemaReady = false;

// DATABASE_URL peut remplacer le chemin SQLite local par défaut.
export function getDatabasePath(): string {
  const configured = process.env.DATABASE_URL?.replace(/^file:/, '') ?? './data/classroom.sqlite';
  return resolve(process.cwd(), configured);
}

function runFoundationSchema(database: Database.Database): void {
  if (schemaReady) return;
  database.exec(FOUNDATION_SCHEMA_SQL);
  schemaReady = true;
}

export function getSqlite(): Database.Database {
  if (!sqlite) {
    const databasePath = getDatabasePath();
    mkdirSync(dirname(databasePath), { recursive: true });
    sqlite = new Database(databasePath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
  }

  runFoundationSchema(sqlite);
  return sqlite;
}

export function getDb() {
  return drizzle(getSqlite(), { schema });
}

export type ClassroomDb = ReturnType<typeof getDb>;
