import { pgTable, varchar, timestamp, index, unique } from "drizzle-orm/pg-core"
import { nanoid } from "@/lib/utils"
import { z } from "zod"
import { createSelectSchema } from "drizzle-zod"

export const exercises = pgTable("exercises", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: varchar("name", { length: 191 }).notNull(),
  nameLower: varchar("name_lower", { length: 191 }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" })
    .notNull()
    .defaultNow(),
},
(table) => ({
  nameLowerIdx: index("exercises_name_lower_idx").using("btree", table.nameLower),
  nameUnique: unique("exercises_name_unique").on(table.name),
  nameLowerUnique: unique("exercises_name_lower_unique").on(table.nameLower),
}))

export type Exercise = typeof exercises.$inferSelect
export type NewExerciseParams = z.infer<typeof insertExerciseSchema>

export const insertExerciseSchema = createSelectSchema(exercises)
  .extend({})
  .omit({ id: true, createdAt: true })