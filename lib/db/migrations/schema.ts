import { pgTable, varchar, text, timestamp, index, foreignKey, vector, unique, integer } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"



export const resources = pgTable("resources", {
	id: varchar("id", { length: 191 }).primaryKey().notNull(),
	content: text("content").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const embeddings = pgTable("embeddings", {
	id: varchar("id", { length: 191 }).primaryKey().notNull(),
	resource_id: varchar("resource_id", { length: 191 }).references(() => resources.id, { onDelete: "cascade" } ),
	content: text("content").notNull(),
	embedding: vector("embedding", { dimensions: 1536 }).notNull(),
},
(table) => {
	return {
		embeddingIndex: index("embeddingIndex").using("hnsw", table.embedding.op("vector_cosine_ops")),
	}
});

export const exercises = pgTable("exercises", {
	id: varchar("id", { length: 191 }).primaryKey().notNull(),
	name: varchar("name", { length: 191 }).notNull(),
	name_lower: varchar("name_lower", { length: 191 }).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		name_lower_idx: index("exercises_name_lower_idx").using("btree", table.name_lower),
		exercises_name_unique: unique("exercises_name_unique").on(table.name),
		exercises_name_lower_unique: unique("exercises_name_lower_unique").on(table.name_lower),
	}
});

export const workout_sessions = pgTable("workout_sessions", {
	id: varchar("id", { length: 191 }).primaryKey().notNull(),
	date: timestamp("date", { mode: 'string' }).defaultNow().notNull(),
	notes: varchar("notes", { length: 500 }),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const user_settings = pgTable("user_settings", {
	user_id: varchar("user_id", { length: 191 }).default("default").primaryKey().notNull(),
	suggestion_days: integer("suggestion_days").default(14).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const workout_sets = pgTable("workout_sets", {
	id: varchar("id", { length: 191 }).primaryKey().notNull(),
	session_id: varchar("session_id", { length: 191 }).notNull().references(() => workout_sessions.id, { onDelete: "cascade" } ),
	exercise_id: varchar("exercise_id", { length: 191 }).notNull().references(() => exercises.id, { onDelete: "cascade" } ),
	weight_kg: integer("weight_kg").notNull(),
	reps: integer("reps").notNull(),
	rir: integer("rir").notNull(),
	set_number: integer("set_number").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		exercise_idx: index("workout_sets_exercise_idx").using("btree", table.exercise_id),
		session_idx: index("workout_sets_session_idx").using("btree", table.session_id),
	}
});