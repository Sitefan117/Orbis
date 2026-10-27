/** Modèles Drizzle qui correspondent aux tables créées par le client SQLite. */
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Élèves et résultats sont séparés afin qu’un bilan conserve son historique.
export const students = sqliteTable(
  'students',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    displayName: text('display_name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    createdAt: integer('created_at').notNull(),
    lastSeenAt: integer('last_seen_at').notNull()
  },
  (table) => ({
    normalizedNameIdx: uniqueIndex('students_normalized_name_idx').on(table.normalizedName)
  })
);

export const activityResults = sqliteTable(
  'activity_results',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    world: text('world').notNull(),
    mission: text('mission').notNull(),
    score: integer('score').notNull(),
    total: integer('total').notNull(),
    scoreBasis: text('score_basis').notNull().default('last'),
    errorCount: integer('error_count').notNull().default(0),
    errorFamiliesJson: text('error_families_json'),
    metadataJson: text('metadata_json'),
    createdAt: integer('created_at').notNull()
  },
  (table) => ({
    studentIdx: index('activity_results_student_idx').on(table.studentId),
    worldIdx: index('activity_results_world_idx').on(table.world),
    createdAtIdx: index('activity_results_created_at_idx').on(table.createdAt)
  })
);

export const worldProgress = sqliteTable(
  'world_progress',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    world: text('world').notNull(),
    mission: text('mission').notNull(),
    bestScore: integer('best_score').notNull().default(0),
    lastScore: integer('last_score').notNull().default(0),
    total: integer('total').notNull().default(0),
    completions: integer('completions').notNull().default(0),
    updatedAt: integer('updated_at').notNull()
  },
  (table) => ({
    uniqueStudentWorldMission: uniqueIndex('world_progress_student_world_mission_idx').on(
      table.studentId,
      table.world,
      table.mission
    ),
    studentIdx: index('world_progress_student_idx').on(table.studentId)
  })
);

// Notes et sessions enseignant restent distinctes des résultats des jeux.
export const teacherNotes = sqliteTable(
  'teacher_notes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id').references(() => students.id, { onDelete: 'set null' }),
    world: text('world'),
    body: text('body').notNull(),
    createdAt: integer('created_at').notNull()
  },
  (table) => ({
    studentIdx: index('teacher_notes_student_idx').on(table.studentId)
  })
);

export const teacherSessions = sqliteTable(
  'teacher_sessions',
  {
    id: text('id').primaryKey(),
    createdAt: integer('created_at').notNull(),
    expiresAt: integer('expires_at').notNull(),
    lastSeenAt: integer('last_seen_at').notNull()
  },
  (table) => ({
    expiresAtIdx: index('teacher_sessions_expires_at_idx').on(table.expiresAt)
  })
);

export type Student = typeof students.$inferSelect;
export type ActivityResult = typeof activityResults.$inferSelect;
export type WorldProgress = typeof worldProgress.$inferSelect;
export type TeacherNote = typeof teacherNotes.$inferSelect;
export type TeacherSession = typeof teacherSessions.$inferSelect;
