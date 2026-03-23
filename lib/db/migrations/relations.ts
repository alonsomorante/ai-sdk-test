import { relations } from "drizzle-orm/relations";
import { resources, embeddings, workout_sessions, workout_sets, exercises } from "./schema";

export const embeddingsRelations = relations(embeddings, ({one}) => ({
	resource: one(resources, {
		fields: [embeddings.resource_id],
		references: [resources.id]
	}),
}));

export const resourcesRelations = relations(resources, ({many}) => ({
	embeddings: many(embeddings),
}));

export const workout_setsRelations = relations(workout_sets, ({one}) => ({
	workout_session: one(workout_sessions, {
		fields: [workout_sets.session_id],
		references: [workout_sessions.id]
	}),
	exercise: one(exercises, {
		fields: [workout_sets.exercise_id],
		references: [exercises.id]
	}),
}));

export const workout_sessionsRelations = relations(workout_sessions, ({many}) => ({
	workout_sets: many(workout_sets),
}));

export const exercisesRelations = relations(exercises, ({many}) => ({
	workout_sets: many(workout_sets),
}));