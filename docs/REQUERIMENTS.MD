# Project Prompt for AI Agents

You are building a production grade demo dashboard that simulates a trade decision using X.com recent posts plus an OpenAI GPT-5.2 analysis step. The result must be a single page dashboard, modern UI, minimal friction, ready for Vercel deployment.

This prompt is written for a team of agents. Execute it end to end, and do not skip verification steps.

## Non negotiable requirements

- Framework, Next.js App Router, use the latest stable Next.js version available at implementation time, the user requested v16, if v16 is not available, use the latest stable and document the chosen version in README.
- TypeScript everywhere.
- Tailwind CSS for styling.
- React Hook Form plus Zod for form validation.
- Zustand only if needed for state, prefer Server Components and Server Actions first.
- Use server side features as much as possible, all API calls to X.com and OpenAI must happen on the server.
- Deploy target is Vercel, follow best practices, no long running background jobs.
- Security, never expose API keys to the browser.
- Single screen dashboard.
- Show a scrollable list of the top posts that influenced the decision.
- The AI response must be compact, token efficient, and strictly structured.
- License: MIT. Include a LICENSE file with the MIT license text and a reference in the README.

## Official documentation you must consult

Before coding, open and follow the most up to date guidance from these sources, then implement accordingly.

1. X.com API overview and search docs

- [https://docs.x.com/overview](https://docs.x.com/overview)
- Also locate the X API v2 Recent Search docs, query building docs, authentication docs.

2. OpenAI API documentation

- Use OpenAI Responses API, and confirm the latest request shape.
- Confirm how to call GPT-5.2 models with the current OpenAI SDK.
- Use official docs, and follow the guidance for server side usage and authentication.

You must incorporate any updated fields, endpoints, headers, or limits you find.

## Product description

User enters:

- Token identifier, for example SOL, BTC, ETH, VVV.
- Desired operation, BUY or SELL, via a segmented control or radio button.

On submit:

1. Server fetches recent X posts about the token using a carefully crafted query.
2. Server reduces and normalizes the post set to a small, high signal subset.
3. Server calls OpenAI GPT-5.2 to classify the context as bullish, bearish, mixed, or unclear, then decides whether to allow, abort, or reverse the requested action.
4. UI shows:

- Decision card, allow or abort or reverse
- Market bias, bullish or bearish or mixed
- Short explanation
- Confidence
- The top posts used, in a scroll area

This is a simulation, no real trades.

## Output contract

The OpenAI step must return JSON only, matching this schema.

```json
{
  "requested_action": "BUY | SELL",
  "recommended_action": "BUY | SELL | HOLD",
  "decision": "ALLOW | ABORT | REVERSE",
  "bias": "BULLISH | BEARISH | MIXED | UNCLEAR",
  "confidence": 0.0,
  "reason": "<= 180 chars",
  "key_factors": ["<= 60 chars", "<= 60 chars", "<= 60 chars"],
  "post_ids_used": ["string", "string"],
  "safety_notes": "<= 120 chars"
}
```

Rules:

- confidence is 0 to 1.
- reason and safety_notes must be extremely compact.
- post_ids_used must reference the posts you display.
- If requested_action differs from recommended_action, decision must be REVERSE.
- Use HOLD when evidence is unclear or conflicting.
- Do not include markdown, do not include extra keys.

## Architecture

### Pages

- app, single route, for example app/page.tsx
- No additional pages.

### Data flow

- UI form is a Client Component for RHF.
- Form submission triggers a Server Action.
- Server Action calls:

  - lib/x/client.ts for X API
  - lib/ai/client.ts for OpenAI
  - lib/analysis/normalize.ts for post scoring, filtering, and prompt packing

### Server side only

- X API calls happen server side.
- OpenAI calls happen server side.
- Ensure these modules never run in client bundles.

### Vercel readiness

- Use environment variables.
- Avoid Node APIs that break Edge unless you intentionally set runtime.
- Decide runtime, nodejs or edge, based on X API and OpenAI SDK compatibility.
- Prefer nodejs runtime for simplicity and SDK support, unless docs confirm full Edge support.

## Environment variables

Create `.env.local.example` (commit this file; do not add it to .gitignore). It must list every environment variable the app needs, with no real values—only key names and short comments. Include:

- X_BEARER_TOKEN (required, X.com API Bearer Token)
- OPENAI_API_KEY (required, OpenAI API key)
- Optionally X_API_BASE_URL, default [https://api.x.com](https://api.x.com)
- Optionally OPENAI_BASE_URL, default [https://api.openai.com](https://api.openai.com)

Never prefix with NEXT_PUBLIC. Developers copy this file to `.env.local` and fill in values locally; `.env` and `.env.local` must remain in .gitignore.

## X.com Recent Search integration

### Endpoint

Use X API v2 Recent Search endpoint and request only the fields you need.

Required fields to request:

- post, id, text, created_at, lang, public_metrics
  Recommended expansions, if available:
- author_id, then request user fields, username, verified, public_metrics

Respect:

- pagination, max_results
- rate limits
- errors, 401, 403, 429

### Best query strategy

Goal, minimize spam, maximize signal.

Let tokenInput be the string from the form.
Normalize it server side:

- Uppercase tickerCandidate
- Remove leading $ and #
- Keep an original nameCandidate too

Build a query that combines:

- $TICKER
- TICKER as plain text
- Known project name if available, optional for demo

Use operator logic from X docs. You must verify operator syntax in docs and implement accordingly.

Default query template, adjust to valid X operator syntax:

- Include these alternatives:

  - "$TICKER"
  - "TICKER"
  - "#TICKER"

- Exclude noise:

  - exclude retweets
  - exclude replies if needed
  - exclude common giveaway terms

Example intent:
("$SOL" OR "SOL" OR "#SOL" OR "Solana") -is:retweet -is:reply

Then implement a small allowlist of well known tokens with project names, optional:

- BTC, Bitcoin
- ETH, Ethereum
- SOL, Solana
- LINK, Chainlink
  If token not in list, do not guess a name.

### Post selection and scoring

After fetching, score each post and keep only top N, default 12.

Suggested scoring, implement efficiently:

- engagementScore = like_count + 2*repost_count + 2*reply_count + 3\*quote_count if present
- recencyBoost based on minutes since created_at
- authorBoost if verified or high followers
- spamPenalty if repeated tickers, excessive emojis, or giveaway terms

Keep:

- 6 to 12 posts max
- ensure diverse authors
- remove duplicates by normalized text

Return both:

- topPosts for display
- compactPostsForLLM, which is minimal text with id, age, engagementScore, verified, and truncated text

Truncate post text to 220 characters.

## OpenAI GPT-5.2 integration

### API choice

Use the OpenAI Responses API, confirm current request shape in docs.
Use the official OpenAI JavaScript SDK.

### Token economy

You must keep prompts compact.

Strategy:

- System message defines JSON schema, strictness, and decision rules.
- User message includes:

  - requested_action
  - token
  - compactPostsForLLM

Do not send full metadata.
Do not send more than 12 posts.

### Safety and robustness

- If OpenAI errors, return a fallback response:

  - decision = ABORT
  - recommended_action = HOLD
  - bias = UNCLEAR
  - reason = "AI unavailable"

- Validate OpenAI output with Zod on the server.

- If invalid JSON or missing keys, retry once with a repair prompt.

- If still invalid, fallback.

### Prompt template

Create a prompt builder that produces two strings:

- systemPrompt
- userPrompt

System prompt must:

- demand JSON only
- enforce schema
- enforce brevity limits
- enforce decision logic
- warn against speculation

User prompt must:

- include requested_action
- include token
- include posts list as array of compact objects

## UI, single dashboard

Design requirements:

- Modern, minimal, premium look
- Centered card layout
- Use Tailwind, use a clean font stack
- Sections:

  1. Header with app name and subtitle
  2. Form card
  3. Result card, visible after submit
  4. Posts list card with scroll

Form:

- Token input, required, 2 to 12 chars
- Action toggle, BUY, SELL
- Submit button
- Loading state
- Error state

Result:

- Requested action
- Recommended action
- Decision
- Bias
- Confidence, show as percentage
- Reason and key_factors
- Optional badge if REVERSE

Posts list:

- Show author username if available
- Show created_at relative time
- Show engagement score
- Show truncated text
- Link to post if you can construct a public URL safely, otherwise omit

## Libraries and reusable modules

Create a reusable internal lib structure.

- lib/x

  - client.ts, low level fetch wrapper, auth header, base URL
  - types.ts, minimal response types
  - searchRecent.ts, typed function, maps API response into normalized posts
  - query.ts, builds the best query from token input

- lib/ai

  - client.ts, OpenAI SDK client initialization
  - analyze.ts, calls Responses API, returns parsed JSON
  - prompt.ts, prompt builder
  - schema.ts, Zod schema for the JSON contract

- lib/analysis

  - normalize.ts, scoring and selection

- lib/env

  - env.ts, Zod validated env loader

Each lib should be portable to another Next.js project.

## Implementation plan

1. Bootstrap project

- Create Next.js app with TypeScript, App Router.
- Add Tailwind.
- Add react-hook-form, zod, @hookform/resolvers.
- Add zustand only if necessary.
- Use the existing `.gitignore` in the repository root; do not replace or recreate it. Ensure `.env` and `.env.local` remain ignored and `.env.local.example` is not ignored.

2. Configure env

- Add `.env.local.example` with all required and optional variables (see Environment variables section).
- Add lib/env/env.ts using Zod.

3. Implement X client

- Use fetch with Authorization Bearer.
- Implement recent search.
- Implement query builder with exclusions.
- Add basic retry for 429 with exponential backoff, max 1 retry.

4. Implement post normalization

- Score posts.
- Filter duplicates.
- Select top N.

5. Implement OpenAI analyze

- Use Responses API.
- Provide JSON only contract.
- Validate output with Zod.
- Retry once on parse failure.

6. Implement Server Action

- Accept form data.
- Validate with Zod.
- Call X.
- Normalize.
- Call OpenAI.
- Return combined payload for UI.

7. Build UI

- Dashboard layout.
- Form with RHF.
- Use optimistic UI patterns.

8. README and license

- Produce a complete, professional README.md suitable for a public repository. It must include:
  - Project name and short description.
  - Prerequisites (Node version, etc.).
  - Installation and local run (clone, install, copy `.env.local.example` to `.env.local`, fill variables, run).
  - Configuration: reference `.env.local.example` and list each variable with a one-line description.
  - Deploy on Vercel: steps and how to set env vars in the Vercel dashboard.
  - Project structure: brief overview of main folders (app, lib, etc.).
  - License: state that the project is under the MIT License and refer to the LICENSE file.
  - Optional: rate limits, safe usage, and disclaimer that this is a simulation (no real trades).
- Add a LICENSE file in the repository root with the full MIT License text.

## Acceptance criteria

- Running locally with env vars produces an analysis result and shows posts.
- All secrets remain server side.
- Vercel deploy works with zero config beyond env vars.
- Output JSON always matches schema.
- Query builder produces valid X search queries and reduces noise.
- UI is clean and usable.

## Deliverables

- Full codebase with the structure above.
- `.env.local.example` with all API and config variables (keys only, with brief comments).
- `README.md` — complete, professional, suitable for a public repo (see Implementation plan step 8).
- `LICENSE` — MIT License text in the repository root.
- Minimal tests optional, but Zod validation is mandatory.

## Quality bar

- Use strict TypeScript.
- Use small pure functions.
- Prefer server components and server actions.
- Keep prompts compact.
- Keep network payloads minimal.
- Handle errors gracefully.

Proceed to implementation now.
