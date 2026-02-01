import OpenAI from 'openai'
import { getEnv, getEnvForOpenAI } from '@/lib/env/env'

let cached: OpenAI | null = null

/** Get OpenAI client. When apiKeyOverride is provided (e.g. user keys), use it and do not cache. */
export function getOpenAIClient(apiKeyOverride?: string): OpenAI {
  if (apiKeyOverride != null && apiKeyOverride !== '') {
    getEnvForOpenAI({ OPENAI_API_KEY: apiKeyOverride })
    return new OpenAI({ apiKey: apiKeyOverride })
  }
  if (!cached) {
    const env = getEnv()
    cached = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  }
  return cached
}
