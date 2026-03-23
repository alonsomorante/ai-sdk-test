'use server'

import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { workoutSessions as workoutSessionsTable, type WorkoutSession } from '@/lib/db/schema/workout_sessions'

export type WorkoutSessionData = Pick<WorkoutSession, 'id' | 'date' | 'notes' | 'createdAt'>

export const createWorkoutSession = async (notes?: string): Promise<WorkoutSessionData> => {
  const [session] = await db
    .insert(workoutSessionsTable)
    .values({
      notes,
    })
    .returning()

  return session
}

export const getWorkoutSession = async (id: string): Promise<WorkoutSessionData | null> => {
  const [session] = await db
    .select()
    .from(workoutSessionsTable)
    .where(eq(workoutSessionsTable.id, id))
    .limit(1)

  return session || null
}

export const listWorkoutSessions = async (limit = 10): Promise<WorkoutSessionData[]> => {
  return db
    .select({
      id: workoutSessionsTable.id,
      date: workoutSessionsTable.date,
      notes: workoutSessionsTable.notes,
      createdAt: workoutSessionsTable.createdAt,
    })
    .from(workoutSessionsTable)
    .orderBy(desc(workoutSessionsTable.date))
    .limit(limit)
}