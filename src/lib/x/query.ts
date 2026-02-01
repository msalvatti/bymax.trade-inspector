/**
 * Ticker → project name (included in the search query).
 * Fixed list because the X API does not expose "project name" for a ticker; without this list
 * we do not add the name to the query. We only use it when the ticker is in the list (never guess).
 * Usage: in buildSearchQuery(), if the ticker is here, the query also includes "Bitcoin", "Solana", etc.,
 * e.g. ($SOL OR "SOL" OR #SOL OR "Solana") -is:retweet -is:reply → more relevant posts.
 */
const TOKEN_PROJECT_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  LINK: 'Chainlink',
  VVV: 'AskVenice',
  HYPER: 'HyperliquidX',
  AAVE: 'Aave'
}

/**
 * Ticker → official X username (without @), used to search only posts from the official account (from:username).
 * Fixed list because the X API does not expose "official account" for a token; without this list we do not know the @.
 * Usage: when officialOnly: true in buildSearchQuery(), if the ticker is here we build
 * from:solana ($SOL OR ...); otherwise we use is:verified. Exported for documentation and tests.
 * API: https://developer.x.com/en/docs/twitter-api/tweets/search/integrate/build-a-query
 */
export const TOKEN_OFFICIAL_HANDLES: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  LINK: 'chainlink',
  VVV: 'AskVenice',
  HYPER: 'HyperliquidX',
  AAVE: 'aave'
}

function normalizeTicker(input: string): string {
  const trimmed = input.trim().replace(/^[$#]\s*/, '')
  return trimmed.toUpperCase().slice(0, 12)
}

/**
 * Terms that indicate crypto/finance context (AND clause).
 * Used when cryptoContextOnly is true so posts must mention the ticker AND at least one of these.
 * Reduces noise from music, hashtags, and unrelated "VVV" or ticker mentions.
 */
const CRYPTO_CONTEXT_TERMS =
  '(crypto OR token OR cryptocurrency OR trading OR price OR market OR blockchain OR defi OR coin OR financial OR altcoin OR web3 OR "price action" OR "market cap")'

export type SearchQueryOptions = {
  /**
   * When true: if fromHandle is provided or we have an official handle for the token, search only from that account (from:username).
   * Otherwise add is:verified so only verified-account posts are returned.
   * API: is:verified (conjunction-required), from: (standalone).
   */
  officialOnly?: boolean
  /** Override: use this X username (without @) when officialOnly is true. */
  fromHandle?: string
  /**
   * Restrict results to a single language (BCP 47, e.g. "en" for English).
   * API: lang: (conjunction-required). Only one lang per query.
   * https://developer.x.com/en/docs/twitter-api/tweets/search/integrate/build-a-query
   */
  lang?: string
  /**
   * When true, require at least one crypto/finance-related term (crypto, token, trading, price, market, etc.)
   * so results are about the token as an asset, not music/hashtags/other themes. Default true.
   */
  cryptoContextOnly?: boolean
}

/**
 * Builds an X API v2 Recent Search query for a token.
 * Supports optional "official only" mode: from:official_handle or is:verified.
 */
export function buildSearchQuery(tokenInput: string, options: SearchQueryOptions = {}): string {
  const ticker = normalizeTicker(tokenInput)
  if (ticker.length < 2) {
    return ''
  }

  const { officialOnly = false, fromHandle: customHandle, lang, cryptoContextOnly = true } = options

  const parts: string[] = [`"$${ticker}"`, `"${ticker}"`, `#${ticker}`]

  const projectName = TOKEN_PROJECT_NAMES[ticker]
  if (projectName) {
    parts.push(`"${projectName}"`)
  }

  const keywordPart = `(${parts.join(' OR ')})`
  const exclusions = '-is:retweet -is:reply'
  const langSuffix = lang?.trim() ? ` lang:${lang.trim()}` : ''
  const cryptoClause = cryptoContextOnly ? ` ${CRYPTO_CONTEXT_TERMS}` : ''

  if (officialOnly) {
    const handle = customHandle?.trim().replace(/^@/, '') || TOKEN_OFFICIAL_HANDLES[ticker]
    if (handle) {
      return `from:${handle} ${keywordPart}${cryptoClause} ${exclusions}${langSuffix}`.trim()
    }
    return `${keywordPart}${cryptoClause} ${exclusions} is:verified${langSuffix}`.trim()
  }

  return `${keywordPart}${cryptoClause} ${exclusions}${langSuffix}`.trim()
}
