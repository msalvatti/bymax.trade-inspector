'use server'

import type { EnvOverrides } from '@/lib/env/env'
import { analysisFormSchema } from '@/lib/analysisFormSchema'
import { fetchRecentPostsForToken } from '@/lib/x/searchRecent'
import { fetchUsageData } from '@/lib/x/client'
import { analyzeTradeSignal } from '@/lib/ai/analyze'
import type { NormalizedPost } from '@/lib/x/types'
import type { XUsageResponse } from '@/lib/x/types'
import type { AnalysisOutput } from '@/lib/ai/schema'

function keysFromFormData(formData: FormData): EnvOverrides | undefined {
  const x = formData.get('x_bearer_token')
  const o = formData.get('openai_api_key')
  const xStr = typeof x === 'string' ? x.trim() : ''
  const oStr = typeof o === 'string' ? o.trim() : ''
  if (xStr === '' && oStr === '') return undefined
  return {
    ...(xStr ? { X_BEARER_TOKEN: xStr } : {}),
    ...(oStr ? { OPENAI_API_KEY: oStr } : {})
  }
}

export type UsageResult =
  | { success: true; usage: XUsageResponse }
  | { success: false; error: string }

export type AnalyzeResult =
  | {
      success: true
      analysis: AnalysisOutput
      topPosts: NormalizedPost[]
      usage: XUsageResponse
    }
  | {
      success: false
      error: string
    }

/** Pass optional formData with x_bearer_token and/or openai_api_key for user-provided keys (e.g. public deploy). */
export async function getUsage(_prev: unknown, formData?: FormData): Promise<UsageResult> {
  try {
    const overrides = formData ? keysFromFormData(formData) : undefined
    const usage = await fetchUsageData(overrides)
    return { success: true, usage }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to fetch usage'
    return { success: false, error: message }
  }
}

export async function runAnalysis(_prev: unknown, formData: FormData): Promise<AnalyzeResult> {
  const parsed = analysisFormSchema.safeParse({
    token: formData.get('token') ?? '',
    action: formData.get('action'),
    officialOnly: formData.get('officialOnly') ?? undefined,
    xHandle: formData.get('xHandle') ?? undefined,
    englishOnly: formData.get('englishOnly') ?? undefined
  })

  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
    return {
      success: false,
      error: Object.values(msg).flat().join(' ') || 'Invalid form data'
    }
  }

  const { token, action } = parsed.data
  const envOverrides = keysFromFormData(formData)

  try {
    const { topPosts, compactPostsForLLM } = await fetchRecentPostsForToken(token, {
      maxPosts: 50,
      officialOnly: parsed.data.officialOnly ?? false,
      fromHandle: parsed.data.xHandle,
      lang: parsed.data.englishOnly ? 'en' : undefined,
      cryptoContextOnly: true,
      envOverrides
    })

    if (compactPostsForLLM.length === 0) {
      return {
        success: false,
        error: 'No recent posts found for this token. Try another symbol.'
      }
    }

    const analysis = await analyzeTradeSignal(
      {
        requested_action: action,
        token,
        compactPostsForLLM
      },
      envOverrides?.OPENAI_API_KEY
    )

    const usage = await fetchUsageData(envOverrides)

    return {
      success: true,
      analysis,
      topPosts,
      usage
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Analysis failed'
    return {
      success: false,
      error: message
    }
  }
}
