import { z } from 'zod'

export const analysisOutputSchema = z.object({
  requested_action: z.enum(['BUY', 'SELL']),
  recommended_action: z.enum(['BUY', 'SELL', 'HOLD']),
  decision: z.enum(['ALLOW', 'ABORT', 'REVERSE']),
  bias: z.enum(['BULLISH', 'BEARISH', 'MIXED', 'UNCLEAR']),
  confidence: z.number().min(0).max(1),
  reason: z.string().max(180),
  key_factors: z.array(z.string().max(60)).max(5),
  post_ids_used: z.array(z.string()),
  safety_notes: z.string().max(120)
})

export type AnalysisOutput = z.infer<typeof analysisOutputSchema>

export const fallbackAnalysisOutput: AnalysisOutput = {
  requested_action: 'BUY',
  recommended_action: 'HOLD',
  decision: 'ABORT',
  bias: 'UNCLEAR',
  confidence: 0,
  reason: 'AI unavailable',
  key_factors: [],
  post_ids_used: [],
  safety_notes: 'Service temporarily unavailable.'
}
