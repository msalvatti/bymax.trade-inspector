'use client'

import type { NormalizedPost } from '@/lib/x/types'

type PostsListProps = {
  posts: NormalizedPost[]
  postIdsUsed: string[]
}

function formatRelativeTime(createdAt: string): string {
  const date = new Date(createdAt)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMins = Math.floor(diffMs / (60 * 1000))
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const POST_URL_BASE = 'https://x.com/i/status'

function sortByNewestFirst(posts: NormalizedPost[]): NormalizedPost[] {
  return [...posts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export function PostsList({ posts, postIdsUsed }: PostsListProps) {
  const usedSet = new Set(postIdsUsed)
  const sortedPosts = sortByNewestFirst(posts)

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-zinc-500">
        Top posts used
      </h2>
      <p className="mb-4 flex items-center gap-1.5 text-xs text-zinc-500">
        <span aria-hidden>🤖</span>
        Posts used by the AI for the decision.
      </p>
      <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
        {sortedPosts.map((post) => {
          const used = usedSet.has(post.id)
          return (
            <article
              key={post.id}
              className={`rounded-lg border p-3 ${
                used ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-700 bg-zinc-800/50'
              }`}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                {post.author_username && (
                  <span className="font-medium text-zinc-400">
                    @{post.author_username}
                    {post.author_verified && (
                      <span className="ml-0.5 text-emerald-500" title="Verified">
                        ✓
                      </span>
                    )}
                  </span>
                )}
                <span>{formatRelativeTime(post.created_at)}</span>
                <span>
                  engagement: {post.engagement_score}
                  {used && (
                    <span className="ml-0.5 text-zinc-400" title="Used in AI analysis" aria-hidden>
                      🤖
                    </span>
                  )}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-300 line-clamp-3">
                {post.text.slice(0, 220)}
                {post.text.length > 220 && '…'}
              </p>
              <a
                href={`${POST_URL_BASE}/${post.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-emerald-500 hover:text-emerald-400"
              >
                View on X
              </a>
            </article>
          )
        })}
      </div>
    </section>
  )
}
