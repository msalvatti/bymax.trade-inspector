import { searchRecent } from '@/lib/x/client'
import type { EnvOverrides } from '@/lib/env/env'
import { buildSearchQuery } from '@/lib/x/query'
import type { NormalizedPost } from '@/lib/x/types'
import { normalizeAndSelectTopPosts } from '@/lib/analysis/normalize'
import type { XTweetRaw, XUserRaw } from '@/lib/x/types'

function mapResponseToRawPosts(
  data: XTweetRaw[] = [],
  includes?: { users?: XUserRaw[] }
): Array<{
  id: string
  text: string
  created_at: string
  author_username?: string
  author_verified?: boolean
  author_followers?: number
  like_count: number
  retweet_count: number
  reply_count: number
  quote_count: number
}> {
  const userMap = new Map<string, XUserRaw>()
  for (const u of includes?.users ?? []) {
    userMap.set(u.id, u)
  }

  return data.map((t) => {
    const author = t.author_id ? userMap.get(t.author_id) : undefined
    const metrics = t.public_metrics ?? {}
    return {
      id: t.id,
      text: t.text,
      created_at: t.created_at,
      author_username: author?.username,
      author_verified: author?.verified,
      author_followers: author?.public_metrics?.followers_count,
      like_count: metrics.like_count ?? 0,
      retweet_count: metrics.retweet_count ?? 0,
      reply_count: metrics.reply_count ?? 0,
      quote_count: metrics.quote_count ?? 0
    }
  })
}

export type FetchRecentPostsOptions = {
  maxPosts?: number
  /** When true, search only from official project account (from:handle) or only verified accounts (is:verified). */
  officialOnly?: boolean
  /** Override X username (without @) when officialOnly is true. */
  fromHandle?: string
  /** Restrict to a single language (BCP 47, e.g. "en" for English). */
  lang?: string
  /** When true, require crypto/finance context terms (crypto, token, trading, price, etc.). Default true. */
  cryptoContextOnly?: boolean
  /** Request-time API keys (e.g. from user Settings). */
  envOverrides?: EnvOverrides
}

export async function fetchRecentPostsForToken(
  tokenInput: string,
  maxPostsOrOptions: number | FetchRecentPostsOptions = 12
): Promise<{
  topPosts: NormalizedPost[]
  compactPostsForLLM: Array<{
    id: string
    age_min: number
    engagement_score: number
    verified: boolean
    text: string
  }>
}> {
  const options: FetchRecentPostsOptions =
    typeof maxPostsOrOptions === 'number' ? { maxPosts: maxPostsOrOptions } : maxPostsOrOptions
  const {
    officialOnly = false,
    fromHandle,
    lang,
    cryptoContextOnly = true,
    maxPosts: optMax = 12,
    envOverrides
  } = options
  const resolvedMaxPosts = optMax

  const query = buildSearchQuery(tokenInput, {
    officialOnly,
    fromHandle,
    lang,
    cryptoContextOnly
  })
  if (!query) {
    return { topPosts: [], compactPostsForLLM: [] }
  }

  const response = await searchRecent(query, 100, envOverrides)
  const rawPosts = mapResponseToRawPosts(response.data, response.includes)
  return normalizeAndSelectTopPosts(rawPosts, resolvedMaxPosts)
}
