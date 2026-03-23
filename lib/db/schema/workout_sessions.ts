import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core"
import { nanoid } from "@/lib/utils"
import { z } from "zod"
import { createSelectSchema } from "drizzle-zod"

export const workoutSessions = pgTable("workout_sessions", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  date: timestamp("date", { mode: "string" })
    .notNull()
    .defaultNow(),
  notes: varchar("notes", { length: 500 }),
  createdAt: timestamp("created_at", { mode: "string" })
    .notNull()
    .defaultNow(),
})

export type WorkoutSession = typeof workoutSessions.$inferSelect
export type NewWorkoutSessionParams = z.infer<typeof insertWorkoutSessionSchema>

export const insertWorkoutSessionSchema = createSelectSchema(workoutSessions)
  .extend({})
  .omit({ id: true, createdAt: true })