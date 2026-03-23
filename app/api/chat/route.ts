import { createResource } from '@/lib/actions/resources'
import { findRelevantContent } from '@/lib/ai/embedding'
import { logWorkoutSet, listRecentWorkouts, getWorkoutSetsBySession } from '@/lib/actions/workout_sets'
import { listExercises } from '@/lib/actions/exercises'
import {
    convertToModelMessages,
    streamText,
    tool,
    UIMessage,
    stepCountIs,
} from 'ai'
import { z } from 'zod'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json()

    const result = streamText({
        model: 'openai/gpt-4o',
        system: `Eres un asistente de fitness amigable y conciso. 🎯

TU ÚNICO PROPÓSITO es registrar workouts que el usuario ya planificó por su cuenta.

PROHIBICIONES (MUY IMPORTANTE):
- NO des rutinas, tips de ejercicios ni consejos de entrenamiento
- NO sugieras ejercicios ni horarios
- Si el usuario pide una rutina, redirige: "Solo registro los workouts que ya hiciste. ¿Qué ejercicio realizaste hoy?"
- Solo responde preguntas sobre SU historial de entrenamientos guardados

REGLAS IMPORTANTES:
1. Peso es OBLIGATORIO -si el usuario no lo da, INSISTE. Solo pull-ups, dominadas y ejercicios con peso corporal pueden obviarlo
2. Solo guarda cuando el usuario confirme

REGISTRO DE SETS (regla muy importante):
- Si el usuario dice "3 sets de 5 reps" con mismo peso y RIR → 1 registro con quantity=3
- Si cada set tiene datos diferentes (peso, reps o RIR distinto) → crear X registros individuales con quantity=1
- Ejemplo 1: "bench 80kg 3 sets 5 reps al fallo" → 1 registro (quantity=3)
- Ejemplo 2: "bench 80kg, set1 5 reps, set2 4 reps" → 2 registros distintos con quantity=1

DETECTAR RIR (estas frases significan RIR=0):
- "al fallo", "al maximo", "al limite"
- "ya no pude mas", "no pude hacer ni una mas"
- "lo di todo", "ya no podia"
- "complete todas", "llegue al final"
- En estos casos NO preguntes por el RIR, asume 0 y confirma

Sé breve, usa emojis, y confirma antes de guardar cada set.`,
        messages: await convertToModelMessages(messages),
        stopWhen: stepCountIs(15),
        tools: {
            addResource: tool({
                description: `Agregar un recurso a tu base de conocimiento.`,
                inputSchema: z.object({
                    content: z
                        .string()
                        .describe('contenido a agregar'),
                }),
                execute: async ({ content }) => createResource({ content }),
            }),
            getInformation: tool({
                description: `Buscar información en tu base de conocimiento.`,
                inputSchema: z.object({
                    question: z.string().describe('pregunta del usuario'),
                }),
                execute: async ({ question }) => findRelevantContent(question),
            }),
            logWorkoutSet: tool({
                description: `GUARDAR un set de entrenamiento en la base de datos.
IMPORTANTE: Solo usa esto cuando el usuario haya confirmado TODOS los datos: ejercicio, peso, reps Y RIR.
Si falta el RIR, NO uses este tool - pregunta primero.
quantity: número de sets con los mismos datos (default 1). Solo usar quantity > 1 si TODOS los sets tienen mismo peso, reps y RIR.`,
                inputSchema: z.object({
                    exerciseName: z.string().describe('nombre del ejercicio'),
                    weightKg: z.number().describe('peso en kg'),
                    reps: z.number().describe('número de repeticiones'),
                    rir: z.number().describe('RIR (Reps In Reserve) - repeticiones que podrías haber hecho más'),
                    quantity: z.number().optional().describe('número de sets con mismos datos (default 1)'),
                }),
                execute: async ({ exerciseName, weightKg, reps, rir, quantity = 1 }) =>
                    logWorkoutSet({ exerciseName, weightKg, reps, rir, quantity }),
            }),
            getWorkoutHistory: tool({
                description: `Ver historial de entrenamientos recientes.`,
                inputSchema: z.object({
                    limit: z.number().optional().describe('número de workouts a mostrar'),
                }),
                execute: async ({ limit = 5 }) => {
                    const sessions = await listRecentWorkouts(limit)
                    const history = await Promise.all(
                        sessions.map(async (session) => {
                            const sets = await getWorkoutSetsBySession(session.id)
                            return { ...session, sets }
                        })
                    )
                    return history
                },
            }),
            listExercises: tool({
                description: `Ver lista de ejercicios registrados.`,
                inputSchema: z.object({}),
                execute: async () => listExercises(),
            }),
        },
    })

    return result.toUIMessageStreamResponse()
}