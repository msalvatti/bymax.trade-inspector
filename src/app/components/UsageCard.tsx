'use client'

import type { XUsageResponse } from '@/lib/x/types'

type UsageCardProps = {
  usage: XUsageResponse | null
  error?: string
  loading?: boolean
}

function formatResetDay(day: number): string {
  if (day < 1 || day > 31) return '—'
  return `Day ${day} of month`
}

export function UsageCard({ usage, error, loading }: UsageCardProps) {
  if (loading) {
    return (
      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
          X API usage
        </h2>
        <p className="text-sm text-zinc-500">Loading usage…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
          X API usage
        </h2>
        <p className="text-sm text-red-400">{error}</p>
      </section>
    )
  }

  const data = usage?.data
  const projectUsage = data?.project_usage ?? null
  const projectCap = data?.project_cap ?? null
  const capResetDay = data?.cap_reset_day
  const usageResultCount = data?.usage_result_count
  const percent =
    projectUsage != null && projectCap != null && projectCap > 0
      ? Math.round((projectUsage / projectCap) * 100)
      : null

  const creditRemaining =
    projectUsage != null && projectCap != null && projectCap > 0 ? projectCap - projectUsage : null

  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
        X API usage
      </h2>
      <div className="space-y-3 text-sm">
        {projectCap != null && (
          <p className="text-zinc-400">
            Credit (posts/month cap):{' '}
            <span className="font-medium text-zinc-200">{projectCap.toLocaleString()}</span>
          </p>
        )}
        {projectUsage != null && (
          <p className="text-zinc-400">
            Used (posts consumed):{' '}
            <span className="font-medium text-zinc-200">{projectUsage.toLocaleString()}</span>
            {percent != null && <span className="ml-1 text-zinc-500">({percent}% of cap)</span>}
          </p>
        )}
        {creditRemaining != null && creditRemaining >= 0 && (
          <p className="text-zinc-400">
            Remaining:{' '}
            <span className="font-medium text-emerald-400">{creditRemaining.toLocaleString()}</span>{' '}
            posts
          </p>
        )}
        {capResetDay != null && (
          <p className="text-zinc-400">
            Cap resets:{' '}
            <span className="font-medium text-zinc-200">{formatResetDay(capResetDay)}</span>
          </p>
        )}
        {usageResultCount != null && (
          <p className="text-zinc-400">
            Requests in period:{' '}
            <span className="font-medium text-zinc-200">{usageResultCount.toLocaleString()}</span>
          </p>
        )}
        {data &&
          projectUsage == null &&
          projectCap == null &&
          capResetDay == null &&
          usageResultCount == null && <p className="text-zinc-500">No usage data available.</p>}
      </div>
      <p className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
        Dollar cost (Total Cost) and credit balance in $ are only shown in the X console.
      </p>
    </section>
  )
}
