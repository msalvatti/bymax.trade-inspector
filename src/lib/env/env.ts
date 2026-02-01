import { z } from 'zod'

const envSchema = z.object({
  X_BEARER_TOKEN: z.string().min(1, 'X_BEARER_TOKEN is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  X_API_BASE_URL: z.string().url().optional().default('https://api.x.com'),
  OPENAI_MODEL: z.string().optional().default('gpt-4o')
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const parsed = envSchema.safeParse({
    X_BEARER_TOKEN: process.env.X_BEARER_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    X_API_BASE_URL: process.env.X_API_BASE_URL,
    OPENAI_MODEL: process.env.OPENAI_MODEL
  })

  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
    throw new Error(`Invalid environment: ${JSON.stringify(msg)}`)
  }

  return parsed.data
}

let cached: Env | null = null

export type EnvOverrides = Partial<Pick<Env, 'X_BEARER_TOKEN' | 'OPENAI_API_KEY'>>

/** Get env, optionally with request-time overrides (e.g. user API keys from form). Overrides are not cached. */
export function getEnv(overrides?: EnvOverrides): Env {
  if (overrides == null) {
    if (!cached) cached = loadEnv()
    return cached
  }
  const merged = {
    X_BEARER_TOKEN: overrides.X_BEARER_TOKEN ?? process.env.X_BEARER_TOKEN,
    OPENAI_API_KEY: overrides.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY,
    X_API_BASE_URL: process.env.X_API_BASE_URL,
    OPENAI_MODEL: process.env.OPENAI_MODEL
  }
  const parsed = envSchema.safeParse(merged)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
    throw new Error(`Invalid environment: ${JSON.stringify(msg)}`)
  }
  return parsed.data
}

const envOpenAISchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_MODEL: z.string().optional().default('gpt-4o')
})

export type EnvOpenAI = z.infer<typeof envOpenAISchema>

/** Env for OpenAI-only calls (e.g. when user provides only API key). */
export function getEnvForOpenAI(override?: { OPENAI_API_KEY?: string | null }): EnvOpenAI {
  const merged = {
    OPENAI_API_KEY: override?.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL
  }
  const parsed = envOpenAISchema.safeParse(merged)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
    throw new Error(`Invalid environment: ${JSON.stringify(msg)}`)
  }
  return parsed.data
}

const envXSchema = z.object({
  X_BEARER_TOKEN: z.string().min(1, 'X_BEARER_TOKEN is required'),
  X_API_BASE_URL: z.string().url().optional().default('https://api.x.com')
})

export type EnvX = z.infer<typeof envXSchema>

/** Env for X API–only calls (e.g. when user provides only X token). */
export function getEnvForX(override?: { X_BEARER_TOKEN?: string | null }): EnvX {
  const merged = {
    X_BEARER_TOKEN: override?.X_BEARER_TOKEN ?? process.env.X_BEARER_TOKEN,
    X_API_BASE_URL: process.env.X_API_BASE_URL
  }
  const parsed = envXSchema.safeParse(merged)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
    throw new Error(`Invalid environment: ${JSON.stringify(msg)}`)
  }
  return parsed.data
}
