import type { NormalizedPost } from '@/lib/x/types'

const MAX_TEXT_LENGTH = 220
const GIVEAWAY_TERMS = /giveaway|retweet|follow\s+to\s+win|free\s+\$|airdrop/gi
const EMOJI_HEAVY = /[\u{1F300}-\u{1F9FF}]/gu

interface RawPostInput {
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
}

function engagementScore(p: RawPostInput): number {
  return p.like_count + 2 * p.retweet_count + 2 * p.reply_count + 3 * (p.quote_count ?? 0)
}

function recencyBoost(createdAt: string): number {
  const created = new Date(createdAt).getTime()
  const now = Date.now()
  const minutesAgo = (now - created) / (60 * 1000)
  if (minutesAgo <= 60) return 1.5
  if (minutesAgo <= 360) return 1.2
  if (minutesAgo <= 1440) return 1.0
  return 0.8
}

function authorBoost(p: RawPostInput): number {
  let boost = 1
  if (p.author_verified) boost *= 1.3
  const followers = p.author_followers ?? 0
  if (followers >= 10000) boost *= 1.2
  else if (followers >= 1000) boost *= 1.1
  return boost
}

function spamPenalty(p: RawPostInput): number {
  let penalty = 1
  const text = p.text
  if (GIVEAWAY_TERMS.test(text)) penalty *= 0.3
  const emojiCount = (text.match(EMOJI_HEAVY) ?? []).length
  if (emojiCount > 5) penalty *= 0.8
  return penalty
}

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 100)
}

export function normalizeAndSelectTopPosts(
  rawPosts: RawPostInput[],
  topN: number
): {
  topPosts: NormalizedPost[]
  compactPostsForLLM: Array<{
    id: string
    age_min: number
    engagement_score: number
    verified: boolean
    text: string
  }>
} {
  const seenText = new Set<string>()
  const scored = rawPosts
    .map((p) => {
      const eng = engagementScore(p)
      const recency = recencyBoost(p.created_at)
      const author = authorBoost(p)
      const spam = spamPenalty(p)
      const score = eng * recency * author * spam
      const normText = normalizeText(p.text)
      if (seenText.has(normText)) return null
      seenText.add(normText)
      return {
        ...p,
        engagement_score: Math.round(eng),
        score
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  const byScore = [...scored].sort((a, b) => b.score - a.score)
  const authorCount = new Map<string, number>()
  const sorted: typeof scored = []
  for (const p of byScore) {
    if (sorted.length >= topN) break
    const key = p.author_username ?? p.id
    const count = authorCount.get(key) ?? 0
    if (count >= 2 && sorted.length >= 6) continue
    authorCount.set(key, count + 1)
    sorted.push(p)
  }
  while (sorted.length < topN && byScore.length > sorted.length) {
    const next = byScore.find((p) => !sorted.includes(p))
    if (!next) break
    sorted.push(next)
  }

  const topPosts: NormalizedPost[] = sorted.map((p) => ({
    id: p.id,
    text: p.text,
    created_at: p.created_at,
    author_username: p.author_username,
    author_verified: p.author_verified,
    author_followers: p.author_followers,
    like_count: p.like_count,
    retweet_count: p.retweet_count,
    reply_count: p.reply_count,
    quote_count: p.quote_count,
    engagement_score: p.engagement_score
  }))

  const now = Date.now()
  const compactPostsForLLM = topPosts.map((p) => ({
    id: p.id,
    age_min: Math.floor((now - new Date(p.created_at).getTime()) / (60 * 1000)),
    engagement_score: p.engagement_score,
    verified: p.author_verified ?? false,
    text: p.text.slice(0, MAX_TEXT_LENGTH)
  }))

  return { topPosts, compactPostsForLLM }
}
