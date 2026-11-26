import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import * as schema from './schema';

const FOUNDATION_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  display_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS students_normalized_name_idx ON students (normalized_name);

CREATE TABLE IF NOT EXISTS learning_missions (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL,
  scope TEXT NOT NULL,
  game TEXT NOT NULL,
  configuration_json TEXT NOT NULL,
  configuration_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  disabled_at INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS learning_missions_code_idx ON learning_missions (code);
CREATE INDEX IF NOT EXISTS learning_missions_game_idx ON learning_missions (game);
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
  mission_id TEXT REFERENCES learning_missions(id) ON DELETE SET NULL,
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

let sqlite: Database.Database | undefined;
let schemaReady = false;

export function getDatabasePath(): string {
  const configured = process.env.DATABASE_URL?.replace(/^file:/, '') ?? './data/classroom.sqlite';
  return resolve(process.cwd(), configured);
}

function runFoundationSchema(database: Database.Database): void {
  if (schemaReady) return;
  database.exec(FOUNDATION_SCHEMA_SQL);
  const activityColumns = database.prepare("PRAGMA table_info('activity_results')").all() as Array<{ name: string }>;
  if (!activityColumns.some((column) => column.name === 'mission_id')) {
    database.exec('ALTER TABLE activity_results ADD COLUMN mission_id TEXT REFERENCES learning_missions(id) ON DELETE SET NULL');
  }
  const missionColumns = database.prepare("PRAGMA table_info('learning_missions')").all() as Array<{ name: string }>;
  if (!missionColumns.some((column) => column.name === 'configuration_key')) {
    database.exec('ALTER TABLE learning_missions ADD COLUMN configuration_key TEXT');
  }
  const missions = database.prepare('SELECT id, game, configuration_json, created_at FROM learning_missions ORDER BY created_at ASC').all() as Array<{ id: string; game: string; configuration_json: string; created_at: number }>;
  const claimedKeys = new Set<string>();
  const updateKey = database.prepare('UPDATE learning_missions SET configuration_key = ? WHERE id = ?');
  const migrateKeys = database.transaction(() => {
    for (const mission of missions) {
      const key = createHash('sha256').update(`${mission.game}:${mission.configuration_json}`).digest('hex');
      if (claimedKeys.has(`${mission.game}:${key}`)) continue;
      claimedKeys.add(`${mission.game}:${key}`);
      updateKey.run(key, mission.id);
    }
  });
  migrateKeys();
  database.exec('CREATE UNIQUE INDEX IF NOT EXISTS learning_missions_game_configuration_key_idx ON learning_missions (game, configuration_key)');
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
