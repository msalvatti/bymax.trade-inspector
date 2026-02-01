import { getEnv, getEnvForX, type EnvOverrides } from '@/lib/env/env'
import type { XSearchResponse, XUsageResponse } from '@/lib/x/types'

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
    throw new Error(`X API error ${res.status}: ${body || res.statusText}`)
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
    throw new Error(`X usage API error ${res.status}: ${body || res.statusText}`)
  }

  return res.json() as Promise<XUsageResponse>
}
