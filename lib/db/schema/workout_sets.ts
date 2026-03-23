import { pgTable, varchar, integer, timestamp, index } from "drizzle-orm/pg-core"
import { nanoid } from "@/lib/utils"
import { z } from "zod"
import { createSelectSchema } from "drizzle-zod"
import { exercises } from "./exercises"
import { workoutSessions } from "./workout_sessions"

export const workoutSets = pgTable("workout_sets", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  sessionId: varchar("session_id", { length: 191 })
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: varchar("exercise_id", { length: 191 })
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  weightKg: integer("weight_kg").notNull(),
  reps: integer("reps").notNull(),
  rir: integer("rir").notNull(),
  setNumber: integer("set_number").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  createdAt: timestamp("created_at", { mode: "string" })
    .notNull()
    .defaultNow(),
},
(table) => ({
  exerciseIdx: index("workout_sets_exercise_idx").using("btree", table.exerciseId),
  sessionIdx: index("workout_sets_session_idx").using("btree", table.sessionId),
}))

export type WorkoutSet = typeof workoutSets.$inferSelect
export type NewWorkoutSetParams = z.infer<typeof insertWorkoutSetSchema>

export const insertWorkoutSetSchema = createSelectSchema(workoutSets)
  .extend({})
  .omit({ id: true, createdAt: true })