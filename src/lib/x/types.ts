export interface XTweetPublicMetrics {
  like_count?: number
  quote_count?: number
  reply_count?: number
  retweet_count?: number
}

export interface XTweetRaw {
  id: string
  text: string
  created_at: string
  lang?: string
  public_metrics?: XTweetPublicMetrics
  author_id?: string
}

export interface XUserRaw {
  id: string
  username?: string
  name?: string
  verified?: boolean
  public_metrics?: { followers_count?: number }
}

export interface XSearchResponse {
  data?: XTweetRaw[]
  includes?: { users?: XUserRaw[] }
  meta?: { next_token?: string; result_count?: number }
  errors?: Array<{ message?: string; title?: string }>
}

export interface NormalizedPost {
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
  engagement_score: number
}

/**
 * X API v2 error body (e.g. 402 CreditsDepleted, 429 rate limit).
 * See https://developer.x.com/en/docs/twitter-api/rate-limits
 */
export interface XApiErrorBody {
  title?: string
  detail?: string
  type?: string
  account_id?: number
}

/** Response from GET /2/usage/tweets */
export interface XUsageResponse {
  data?: {
    cap_reset_day?: number
    project_cap?: number
    project_id?: string
    project_usage?: number
    usage_result_count?: number
    daily_project_usage?: {
      project_id?: number
      usage?: Array<{ date?: string; usage?: number }>
    }
    daily_client_app_usage?: Array<{
      client_app_id?: string
      usage?: Array<{ date?: string; usage?: number }>
    }>
  }
  errors?: Array<{ detail?: string; title?: string; status?: number }>
}
