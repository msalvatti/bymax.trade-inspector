export type CompactPost = {
  id: string
  age_min: number
  engagement_score: number
  verified: boolean
  text: string
}

export function buildSystemPrompt(): string {
  return `You are a short-term market context analyst for a crypto token, using ONLY the provided X posts. Output ONLY valid minified JSON. No markdown. No extra keys.

Strict schema:
{"requested_action":"BUY|SELL","recommended_action":"BUY|SELL|HOLD","decision":"ALLOW|ABORT|REVERSE","bias":"BULLISH|BEARISH|MIXED|UNCLEAR","confidence":0-1,"reason":"<=180 chars","key_factors":["<=60 chars", "... up to 5"],"post_ids_used":["id", "..."],"safety_notes":"<=120 chars"}

Definitions:
- bias = short-term sentiment about the TOKEN implied by the posts.
- confidence = strength/clarity of evidence (recency + engagement + verified + consistency across posts).

Decision rules:
- If requested_action !== recommended_action => decision must be "REVERSE".
- Else decision is:
  - "ALLOW" if posts support the requested_action with confidence >= 0.6.
  - "ABORT" if posts contradict the requested_action (or high risk/uncertainty) and you do not recommend the opposite.
- recommended_action rules:
  - If confidence >= 0.6 and bias is BULLISH => recommended_action="BUY".
  - If confidence >= 0.6 and bias is BEARISH => recommended_action="SELL".
  - Otherwise recommended_action="HOLD" and bias must be MIXED or UNCLEAR.

Evidence rules:
- Use 2-5 post_ids_used, subset only, prefer newest/high-eng/verified.
- Do not speculate beyond the posts. If unclear, say UNCLEAR + HOLD. Keep reason/safety_notes extremely compact.`
}

export function buildUserPrompt(
  requestedAction: 'BUY' | 'SELL',
  token: string,
  posts: CompactPost[]
): string {
  const postsJson = JSON.stringify(
    posts.map((p) => ({
      id: p.id,
      age_min: p.age_min,
      eng: p.engagement_score,
      verified: p.verified,
      text: p.text
    }))
  )

  return `requested_action=${requestedAction}\ntoken=${token}\nnotes: prioritize lower age_min and higher eng; treat verified=true as higher credibility.\nposts=${postsJson}`
}
