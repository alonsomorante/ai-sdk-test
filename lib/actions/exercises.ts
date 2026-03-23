'use server'

import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { exercises as exercisesTable, type Exercise } from '@/lib/db/schema/exercises'
import { nanoid } from '@/lib/utils'

export type ExerciseData = Pick<Exercise, 'id' | 'name' | 'nameLower' | 'createdAt'>

export const createExercise = async (name: string): Promise<{ success: boolean; data?: ExerciseData; error?: string }> => {
  try {
    const nameLower = name.toLowerCase().trim()
    
    const existing = await db
      .select()
      .from(exercisesTable)
      .where(eq(exercisesTable.nameLower, nameLower))
      .limit(1)

    if (existing.length > 0) {
      return { success: false, error: 'Exercise already exists' }
    }

    const [exercise] = await db
      .insert(exercisesTable)
      .values({
        name: name.trim(),
        nameLower,
      })
      .returning()

    return { success: true, data: exercise }
  } catch (e) {
    if (e instanceof Error) {
      return { success: false, error: e.message }
    }
    return { success: false, error: 'Unknown error' }
  }
}

export const getOrCreateExercise = async (name: string): Promise<ExerciseData> => {
  const nameLower = name.toLowerCase().trim()
  
  const existing = await db
    .select()
    .from(exercisesTable)
    .where(eq(exercisesTable.nameLower, nameLower))
    .limit(1)

  if (existing.length > 0) {
    return existing[0]
  }

  const [exercise] = await db
    .insert(exercisesTable)
    .values({
      name: name.trim(),
      nameLower,
    })
    .returning()

  return exercise
}

export const listExercises = async (): Promise<ExerciseData[]> => {
  return db.select({
    id: exercisesTable.id,
    name: exercisesTable.name,
    nameLower: exercisesTable.nameLower,
    createdAt: exercisesTable.createdAt,
  })
    .from(exercisesTable)
    .orderBy(desc(exercisesTable.createdAt))
}