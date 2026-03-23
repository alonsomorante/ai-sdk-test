'use server'

import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { workoutSets as workoutSetsTable, type WorkoutSet } from '@/lib/db/schema/workout_sets'
import { exercises as exercisesTable } from '@/lib/db/schema/exercises'
import { workoutSessions as workoutSessionsTable } from '@/lib/db/schema/workout_sessions'
import { getOrCreateExercise } from './exercises'
import { createWorkoutSession } from './workout_sessions'

export type WorkoutSetData = Pick<WorkoutSet, 'id' | 'sessionId' | 'exerciseId' | 'weightKg' | 'reps' | 'rir' | 'setNumber' | 'quantity' | 'createdAt'>

interface LogWorkoutSetInput {
  exerciseName: string
  weightKg: number
  reps: number
  rir: number
  quantity?: number
  notes?: string
  sessionId?: string
}

export const logWorkoutSet = async (input: LogWorkoutSetInput): Promise<WorkoutSetData> => {
  const { exerciseName, weightKg, reps, rir, quantity = 1, notes, sessionId } = input

  let session = sessionId
    ? await db.select().from(workoutSessionsTable).where(eq(workoutSessionsTable.id, sessionId)).then(r => r[0])
    : null

  if (!session) {
    const newSession = await createWorkoutSession(notes)
    session = newSession
  }

  const exercise = await getOrCreateExercise(exerciseName)

  const existingSets = await db
    .select()
    .from(workoutSetsTable)
    .where(eq(workoutSetsTable.sessionId, session.id))
    .orderBy(desc(workoutSetsTable.setNumber))
    .limit(1)

  const nextSetNumber = existingSets.length > 0 ? existingSets[0].setNumber + 1 : 1

  const [set] = await db
    .insert(workoutSetsTable)
    .values({
      sessionId: session.id,
      exerciseId: exercise.id,
      weightKg,
      reps,
      rir,
      setNumber: nextSetNumber,
      quantity,
    })
    .returning()

  return set
}

export const getWorkoutSetsBySession = async (sessionId: string): Promise<(WorkoutSetData & { exerciseName: string })[]> => {
  const sets = await db
    .select({
      id: workoutSetsTable.id,
      sessionId: workoutSetsTable.sessionId,
      exerciseId: workoutSetsTable.exerciseId,
      weightKg: workoutSetsTable.weightKg,
      reps: workoutSetsTable.reps,
      rir: workoutSetsTable.rir,
      setNumber: workoutSetsTable.setNumber,
      quantity: workoutSetsTable.quantity,
      createdAt: workoutSetsTable.createdAt,
    })
    .from(workoutSetsTable)
    .where(eq(workoutSetsTable.sessionId, sessionId))
    .orderBy(workoutSetsTable.setNumber)

  const setsWithExerciseNames = await Promise.all(
    sets.map(async (set) => {
      const [exercise] = await db
        .select({ name: exercisesTable.name })
        .from(exercisesTable)
        .where(eq(exercisesTable.id, set.exerciseId))
        .limit(1)
      return {
        ...set,
        quantity: set.quantity || 1,
        exerciseName: exercise?.name || 'Unknown',
      }
    })
  )

  return setsWithExerciseNames
}

export const listRecentWorkouts = async (limit = 5) => {
  const sessions = await db
    .select({
      id: workoutSessionsTable.id,
      date: workoutSessionsTable.date,
      notes: workoutSessionsTable.notes,
      createdAt: workoutSessionsTable.createdAt,
    })
    .from(workoutSessionsTable)
    .orderBy(desc(workoutSessionsTable.date))
    .limit(limit)

  return sessions
}