'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { userSettings as userSettingsTable } from '@/lib/db/schema/user_settings'

export const getUserSettings = async (userId = 'default') => {
  const [settings] = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, userId))
    .limit(1)

  return settings
}

export const updateUserSettings = async (suggestionDays: number, userId = 'default') => {
  const existing = await getUserSettings(userId)

  if (existing) {
    const [updated] = await db
      .update(userSettingsTable)
      .set({ suggestionDays })
      .where(eq(userSettingsTable.userId, userId))
      .returning()
    return updated
  }

  const [created] = await db
    .insert(userSettingsTable)
    .values({
      userId,
      suggestionDays,
    })
    .returning()

  return created
}