import { getOpenAIClient } from '@/lib/ai/client'
import { getEnv, getEnvForOpenAI } from '@/lib/env/env'
import { buildSystemPrompt, buildUserPrompt, type CompactPost } from '@/lib/ai/prompt'
import { analysisOutputSchema, fallbackAnalysisOutput, type AnalysisOutput } from '@/lib/ai/schema'

export type AnalyzeInput = {
  requested_action: 'BUY' | 'SELL'
  token: string
  compactPostsForLLM: CompactPost[]
}

function extractJson(text: string): string | null {
  const trimmed = text.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  return trimmed.slice(start, end + 1)
}

export async function analyzeTradeSignal(
  input: AnalyzeInput,
  openaiApiKeyOverride?: string
): Promise<AnalysisOutput> {
  const env =
    openaiApiKeyOverride != null && openaiApiKeyOverride !== ''
      ? getEnvForOpenAI({ OPENAI_API_KEY: openaiApiKeyOverride })
      : getEnv()
  const client = getOpenAIClient(openaiApiKeyOverride)

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildUserPrompt(input.requested_action, input.token, input.compactPostsForLLM)

  const parseResponse = (content: string | null): AnalysisOutput | null => {
    if (!content) return null
    const raw = extractJson(content)
    if (!raw) return null
    const parsed = analysisOutputSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  }

  const isGpt4o = env.OPENAI_MODEL.startsWith('gpt-4o')
  const completionOptions = {
    model: env.OPENAI_MODEL,
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ],
    response_format: { type: 'json_object' as const },
    max_completion_tokens: 400,
    ...(isGpt4o ? { temperature: 0 } : {})
  }

  try {
    const completion = await client.chat.completions.create(completionOptions)

    const content = completion.choices[0]?.message?.content?.trim() ?? null
    let result = parseResponse(content)

    if (!result) {
      const repairCompletion = await client.chat.completions.create({
        ...completionOptions,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
          {
            role: 'user',
            content:
              'Your previous response was invalid. Reply with only the JSON object, no markdown.'
          }
        ]
      })
      const repairContent = repairCompletion.choices[0]?.message?.content?.trim() ?? null
      result = parseResponse(repairContent)
    }

    if (!result) {
      return {
        ...fallbackAnalysisOutput,
        requested_action: input.requested_action
      }
    }

    return {
      ...result,
      requested_action: input.requested_action
    }
  } catch (err) {
    const message = getErrorMessage(err)
    throw new Error(`OpenAI: ${message}`)
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null) {
    const o = err as Record<string, unknown>
    if (typeof o.message === 'string') return o.message
    if (o.error && typeof o.error === 'object') {
      const inner = (o.error as Record<string, unknown>).message
      if (typeof inner === 'string') return inner
    }
  }
  return String(err)
}
