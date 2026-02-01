import { z } from 'zod'

/**
 * Shared analysis form schema for client (React Hook Form + Zod) and server (Server Action validation).
 * Single source of truth to avoid drift between client and server validation.
 */
export const analysisFormSchema = z.object({
  token: z
    .string()
    .min(2, 'Token must be 2–12 characters')
    .max(12, 'Token must be 2–12 characters')
    .transform((s) => s.trim().toUpperCase().replace(/^[$#]/, '')),
  action: z.enum(['BUY', 'SELL']),
  officialOnly: z
    .union([z.boolean(), z.literal('on')])
    .optional()
    .transform((v) => v === true || v === 'on'),
  xHandle: z
    .string()
    .optional()
    .transform((s) => s?.trim().replace(/^@/, '') || undefined),
  englishOnly: z
    .union([z.boolean(), z.literal('on')])
    .optional()
    .transform((v) => v === true || v === 'on')
})

export type AnalysisFormValues = z.infer<typeof analysisFormSchema>

/** Default values for the analysis form (client-side initial state). */
export const analysisFormDefaultValues: AnalysisFormValues = {
  token: '',
  action: 'BUY',
  officialOnly: false,
  xHandle: '',
  englishOnly: false
}
