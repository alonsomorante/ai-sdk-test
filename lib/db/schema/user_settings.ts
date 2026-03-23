import { pgTable, varchar, integer, timestamp } from "drizzle-orm/pg-core"
import { z } from "zod"
import { createSelectSchema } from "drizzle-zod"

export const userSettings = pgTable("user_settings", {
  userId: varchar("user_id", { length: 191 })
    .primaryKey()
    .default("default"),
  suggestionDays: integer("suggestion_days").notNull().default(14),
  createdAt: timestamp("created_at", { mode: "string" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" })
    .notNull()
    .defaultNow(),
})

export type UserSettings = typeof userSettings.$inferSelect
export type NewUserSettingsParams = z.infer<typeof insertUserSettingsSchema>

export const insertUserSettingsSchema = createSelectSchema(userSettings)
  .extend({})
  .omit({ userId: true, createdAt: true, updatedAt: true })