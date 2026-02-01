'use client'

import type { AnalysisOutput } from '@/lib/ai/schema'

type ResultCardProps = {
  analysis: AnalysisOutput
}

const decisionColors: Record<string, string> = {
  ALLOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  ABORT: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  REVERSE: 'bg-rose-500/20 text-rose-400 border-rose-500/40'
}

const biasColors: Record<string, string> = {
  BULLISH: 'text-emerald-400',
  BEARISH: 'text-rose-400',
  MIXED: 'text-amber-400',
  UNCLEAR: 'text-zinc-400'
}

/** Confidence color by reliability: blue = reliable, amber = not reliable, zinc = neutral (avoids green/red for BUY/SELL). */
function getConfidenceColorClass(confidence: number): string {
  if (confidence >= 0.65) return 'text-sky-400' // reliable
  if (confidence < 0.4) return 'text-amber-400' // not reliable
  return 'text-zinc-400' // neutral
}

export function ResultCard({ analysis }: ResultCardProps) {
  const decisionClass = decisionColors[analysis.decision] ?? 'bg-zinc-500/20 text-zinc-400'
  const biasClass = biasColors[analysis.bias] ?? 'text-zinc-400'
  const confidenceClass = getConfidenceColorClass(analysis.confidence)

  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">Result</h2>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-500">Requested:</span>
          <span className="font-medium text-zinc-200">{analysis.requested_action}</span>
          <span className="text-zinc-600">→</span>
          <span className="text-sm text-zinc-500">Recommended:</span>
          <span className="font-medium text-zinc-200">{analysis.recommended_action}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md border px-2.5 py-1 text-sm font-medium ${decisionClass}`}>
            {analysis.decision}
          </span>
          <span className={`text-sm font-medium ${biasClass}`}>{analysis.bias}</span>
        </div>

        <div>
          <p className="text-sm text-zinc-400">
            Confidence:{' '}
            <span className={`font-medium ${confidenceClass}`}>
              {Math.round(analysis.confidence * 100)}%
            </span>
          </p>
        </div>

        <p className="text-sm leading-relaxed text-zinc-300">{analysis.reason}</p>

        {analysis.key_factors && analysis.key_factors.length > 0 && (
          <ul className="list-inside list-disc space-y-0.5 text-sm text-zinc-400">
            {analysis.key_factors.map((f, i) => (
              <li key={`factor-${i}-${f.slice(0, 20)}`}>{f}</li>
            ))}
          </ul>
        )}

        {analysis.safety_notes && (
          <p className="border-t border-zinc-800 pt-3 text-xs text-zinc-500">
            {analysis.safety_notes}
          </p>
        )}
      </div>
    </section>
  )
}
