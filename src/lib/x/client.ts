import { getEnv, getEnvForX, type EnvOverrides } from '@/lib/env/env'
import type { XApiErrorBody, XSearchResponse, XUsageResponse } from '@/lib/x/types'

/**
 * Parses X API error response and returns a user-friendly message.
 * Handles 402 CreditsDepleted, 429 rate limit, 401/403 auth, and generic errors.
 */
function parseXApiErrorMessage(status: number, body: string): string {
  let parsed: XApiErrorBody | null = null
  try {
    parsed = JSON.parse(body) as XApiErrorBody
  } catch {
    return body || `X API error ${status}`
  }
  const title = parsed?.title ?? ''
  const detail = parsed?.detail ?? ''

  if (status === 402 && (title === 'CreditsDepleted' || detail.toLowerCase().includes('credits'))) {
    return 'X API: Your account has no credits left. Add credits in the X Developer Portal (developer.x.com) to use the API.'
  }
  if (status === 429) {
    return 'X API: Rate limit exceeded. Try again later.'
  }
  if (status === 401 || status === 403) {
    return 'X API: Invalid or expired credentials. Check your X Bearer Token in Settings or .env.local.'
  }
  if (detail) return `X API: ${detail}`
  if (title) return `X API: ${title}`
  return body || `X API error ${status}`
}

const MAX_RETRIES = 1
const INITIAL_BACKOFF_MS = 1000

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retriesLeft = MAX_RETRIES
): Promise<Response> {
  const res = await fetch(url, options)

  if (res.status === 429 && retriesLeft > 0) {
    const delay = INITIAL_BACKOFF_MS * Math.pow(2, MAX_RETRIES - retriesLeft)
    await new Promise((r) => setTimeout(r, delay))
    return fetchWithRetry(url, options, retriesLeft - 1)
  }

  return res
}

export async function searchRecent(
  query: string,
  maxResults = 50,
  overrides?: EnvOverrides
): Promise<XSearchResponse> {
  const env =
    overrides?.X_BEARER_TOKEN != null && overrides?.OPENAI_API_KEY == null
      ? getEnvForX({ X_BEARER_TOKEN: overrides.X_BEARER_TOKEN })
      : getEnv(overrides)
  const baseUrl = env.X_API_BASE_URL.replace(/\/$/, '')
  const url = new URL(`${baseUrl}/2/tweets/search/recent`)
  url.searchParams.set('query', query)
  url.searchParams.set('max_results', String(Math.min(maxResults, 100)))
  url.searchParams.set('tweet.fields', 'created_at,lang,public_metrics,author_id')
  url.searchParams.set('expansions', 'author_id')
  url.searchParams.set('user.fields', 'username,verified,public_metrics')

  const res = await fetchWithRetry(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.X_BEARER_TOKEN}`,
      'Content-Type': 'application/json'
    },
    next: { revalidate: 0 }
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(parseXApiErrorMessage(res.status, body || res.statusText))
  }

  return res.json() as Promise<XSearchResponse>
}

export async function fetchUsageData(overrides?: EnvOverrides): Promise<XUsageResponse> {
  const env =
    overrides?.X_BEARER_TOKEN != null && overrides?.OPENAI_API_KEY == null
      ? getEnvForX({ X_BEARER_TOKEN: overrides.X_BEARER_TOKEN })
      : getEnv(overrides)
  const baseUrl = env.X_API_BASE_URL.replace(/\/$/, '')
  const url = new URL(`${baseUrl}/2/usage/tweets`)
  url.searchParams.set('days', '1')

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.X_BEARER_TOKEN}`,
      'Content-Type': 'application/json'
    },
    next: { revalidate: 0 }
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(parseXApiErrorMessage(res.status, body || res.statusText))
  }

  return res.json() as Promise<XUsageResponse>
}
