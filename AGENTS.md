# AI Agents Guidelines — Bymax Trade Inspector

This document defines the project’s standards and best practices for AI agents. Follow it when implementing features, refactoring, or reviewing code. All implementation details, comments, and user-facing text must be in **English**.

---

## 1. Project Overview

- **Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, React Hook Form (RHF), Zod.
- **Purpose**: Single-page dashboard for market sentiment analysis from X.com posts and OpenAI. No real trades; informational only.
- **Deploy target**: Vercel. No long-running background jobs; server-side API calls only.
- **Security**: API keys (X, OpenAI) must never be exposed to the browser. Use `.env.local` server-side or optional user-provided keys sent only in Server Action payloads.

For full product and technical requirements, see `docs/REQUIREMENTS.md`.

---

## 2. Next.js Best Practices

### 2.1 Server-first

- **Default to Server Components.** Use `'use client'` only when the component needs:
  - `useState`, `useEffect`, or other React hooks
  - Browser APIs (e.g. `sessionStorage`, `window`)
  - Event handlers that cannot be passed from a Server Component
  - React Hook Form, `useActionState`, or other client-only APIs
- **Keep the client boundary small.** Prefer passing data and callbacks from Server Components to minimal client components rather than making entire pages client components.
- **Routes**: Use the App Router. Page components live in `src/app/` (e.g. `page.tsx`). Prefer a thin page that composes Server/Client components and passes server-fetched data where possible.

### 2.2 Server Actions

- **Mutations and server-only work**: Use Server Actions (`'use server'`) in `src/app/actions.ts` (or domain-specific action files). Do not call external APIs (X, OpenAI) from the client.
- **Form handling**: Submit forms via Server Actions. Use `useActionState` for pending/error/success state when the action is triggered from client components.
- **Validation**: Always validate and parse Server Action inputs (e.g. `FormData`) on the server with the same Zod schema used on the client. Never trust client-only validation for security.
- **Return types**: Use discriminated unions for results (e.g. `{ success: true; data } | { success: false; error: string }`) so the client can handle success and error explicitly.

### 2.3 Data fetching and env

- **API calls**: Perform all X.com and OpenAI calls inside Server Actions or Server Components. Never expose API keys to the client.
- **Environment**: Read secrets from `process.env` only on the server. Use the shared env helpers in `src/lib/env/env.ts` (e.g. `getEnv(overrides)`) so validation and overrides (e.g. user-provided keys from forms) are consistent.

---

## 3. API and Backend Best Practices

### 3.1 External APIs (X, OpenAI)

- **Server-only**: All requests to X.com and OpenAI must run on the server (Server Actions or Server Components).
- **Env and keys**: Use `getEnv(overrides)` (or `getEnvForX` / `getEnvForOpenAI` where applicable). `overrides` can come from form payloads for public deploys where users supply their own keys; otherwise use cached env from `process.env`.
- **Errors**: Catch errors at the action/orchestration layer; return user-safe messages and log details server-side. Do not leak stack traces or internal errors to the client.

### 3.2 Environment variables

- **Validation**: Validate env with Zod in `src/lib/env/env.ts`. Use a single schema (or split schemas for X-only / OpenAI-only) and `safeParse`; throw a clear error if required vars are missing.
- **Caching**: Cache the parsed env when no overrides are passed to avoid repeated parsing. When overrides are provided (e.g. user keys), merge with `process.env` and re-validate without caching.
- **Naming**: Use the same names as in `.env.local` (e.g. `X_BEARER_TOKEN`, `OPENAI_API_KEY`). Document required and optional vars in `.env.local.example` and README.

### 3.3 Response shapes

- **Structured results**: Prefer typed, discriminated result types (e.g. `AnalyzeResult`, `UsageResult`) so the client can narrow on `success` and access `data` or `error` safely.
- **Idempotency and side effects**: Server Actions that only read data should be safe to call multiple times; mutations should be explicit and documented.

---

## 4. React Hook Form (RHF) and Zod

### 4.1 Single source of truth

- **Shared schema**: Define one Zod schema for the analysis form in `src/lib/analysisFormSchema.ts`. Use it for:
  - Client: RHF validation via `zodResolver(analysisFormSchema)`.
  - Server: Parsing and validating `FormData` in the Server Action (e.g. `analysisFormSchema.safeParse({ ... })`).
- **No drift**: Do not duplicate validation rules in separate client/server schemas. Export the schema, inferred type, and default values from the same file.

### 4.2 Form setup (client)

- **Resolver**: Use `zodResolver(analysisFormSchema)` with the shared schema. Cast the resolver type if needed: `as Resolver<AnalysisFormValues>`.
- **Default values**: Export `analysisFormDefaultValues` from the schema file and use it as `defaultValues` in `useForm`. Keep defaults in sync with the schema (e.g. optional booleans, empty strings).
- **Types**: Use `AnalysisFormValues = z.infer<typeof analysisFormSchema>` for `useForm<AnalysisFormValues>` and for submit handlers.

### 4.3 Schema design (Zod)

- **FormData compatibility**: For fields that come from `FormData`, use `.optional()` and/or `.union([z.boolean(), z.literal('on')])` where appropriate, then `.transform()` to normalize to the internal type (e.g. boolean).
- **Strings**: Use `.trim()`, `.toUpperCase()`, or `.transform()` for normalization (e.g. token symbols, handles) so server and client behave the same.
- **Errors**: Use `.min()/.max()` (or custom refinements) with clear messages; these appear in RHF `formState.errors` and can be re-used in server error responses.

### 4.4 Submit flow

- **Client**: On submit, run RHF validation. If valid, build `FormData` with all fields the server expects (including optional keys when the user provided them). Call the Server Action (e.g. via `formAction(fd)` from `useActionState`).
- **Server**: Parse the same fields from `FormData` with the shared schema; return a discriminated result. Do not rely only on client-side validation.

---

## 5. Tailwind CSS

### 5.1 Consistency and palette

- **Palette**: Use the project’s existing palette for consistency:
  - **Neutrals**: `zinc` for backgrounds, borders, and text (e.g. `bg-zinc-900/50`, `border-zinc-800`, `text-zinc-100`, `text-zinc-400`, `text-zinc-500`).
  - **Primary / success**: `emerald` for primary actions and positive states (e.g. `bg-emerald-600`, `text-emerald-400`).
  - **Destructive / bearish**: `rose` for errors and negative states (e.g. `text-rose-400`, `bg-rose-500/20`).
  - **Warning / caution**: `amber` for warnings and neutral-negative (e.g. `text-amber-400`, `bg-amber-500/20`).
  - **Info / neutral-positive**: `sky` where appropriate (e.g. confidence indicators: `text-sky-400`).
- **Avoid**: Arbitrary hex/rgb in class names; prefer Tailwind tokens. Prefer opacity modifiers (e.g. `/50`, `/20`) over new custom colors when possible.

### 5.2 Layout and spacing

- **Containers**: Use `gap-*` on parent containers to space children (e.g. `flex flex-col gap-4`, `gap-2`). Prefer parent-controlled spacing over ad-hoc margins on every child.
- **Sections**: Use consistent border and padding (e.g. `rounded-xl border border-zinc-800 bg-zinc-900/50 p-6`) for card-like sections so the UI stays coherent.
- **Responsive**: Use responsive prefixes when needed (e.g. `sm:py-12`, `sm:px-6`). Keep the single-page layout usable on small screens.

### 5.3 Typography and focus

- **Text hierarchy**: Use `text-sm`, `text-2xl`, `font-medium`, `font-semibold`, `uppercase`, `tracking-wider`, etc., consistently for headings vs body vs labels.
- **Focus**: Use `focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500` (or equivalent) for inputs and buttons so focus is visible and on-brand.

---

## 6. TypeScript and React Code Style

### 6.1 General

- **Strict mode**: Keep `strict` (and related options) enabled in `tsconfig.json`. No `any` for props or public APIs; use `unknown` and type guards if needed.
- **Naming**: camelCase for variables and functions; PascalCase for components and types; UPPER_SNAKE_CASE for constants. Use descriptive names; avoid generic names like `data`, `info`, `temp`.
- **Imports**: Use the `@/` path alias for `src/*`. Prefer named exports. Do not add barrel files (`index.ts`) for re-exports; import from the concrete file.

### 6.2 Components

- **Definition**: Use named function declarations for components (e.g. `export function Dashboard() { ... }`). No arrow-function components for the main export.
- **Props**: Type all props with an `interface` or `type` (e.g. `type ResultCardProps = { analysis: AnalysisOutput }`). Do not use `any`.
- **One main component per file**: Each file under `src/app/components/` should export one primary component; helpers or subcomponents can be in the same file if small and tightly coupled.

### 6.3 State and hooks

- **Client state**: Use `useState` for local UI state (e.g. modals, tabs, form visibility). Use `useActionState` for Server Action pending/success/error when submitting forms.
- **Side effects**: Use `useEffect` for one-off or reactive side effects (e.g. fetch usage on mount, sync settings panel with storage). Avoid unnecessary effects; prefer deriving state where possible.
- **Refs**: Use `useRef` when you need a stable reference that does not trigger re-renders (e.g. previous value for reset-after-success).

### 6.4 Functions and purity

- **Pure helpers**: Keep pure functions (e.g. `getStoredKeys()`, `formDataWithKeys()`, validation helpers) outside components when they have no dependency on React. Easier to test and reuse.
- **Immutability**: Do not mutate props or state; use state setters and new objects/arrays.
- **Return types**: Prefer explicit return types for public functions and for Server Actions (e.g. `Promise<AnalyzeResult>`).

---

## 7. Comments and Documentation (English only)

- **Comments**: Write all comments in **English**. Explain *why* and non-obvious behavior, not only *what* the code does.
- **JSDoc**: Use JSDoc for public helpers and for non-obvious logic (e.g. confidence color mapping, env override behavior). Keep JSDoc concise.
- **In-code**: Comment complex conditionals, magic numbers (or replace with named constants), and any workaround or non-obvious dependency (e.g. “Keys may come from env or from form overrides”).
- **User-facing strings**: All labels, placeholders, buttons, and messages in the UI must be in **English** (e.g. “Analyze”, “API keys”, “Token”, “Official posts only”). Keep tone consistent and professional.

---

## 8. Project Structure

- **`src/app/`**: App Router routes, layout, and global styles.
  - **`page.tsx`**: Thin page; composes the main dashboard (e.g. `<Dashboard />`). Prefer Server Component when the page does not need client state.
  - **`layout.tsx`**: Root layout (metadata, fonts, body).
  - **`actions.ts`**: Server Actions (e.g. `runAnalysis`, `getUsage`). Validate input with the shared Zod schema; call libs in `src/lib/`.
  - **`components/`**: Page-specific or shared UI components used by the app (e.g. `TradeForm.tsx`, `ResultCard.tsx`, `UsageCard.tsx`, `PostsList.tsx`).
  - **`globals.css`**: Global styles and Tailwind entry (e.g. `@import 'tailwindcss'`).
- **`src/lib/`**: Domain and shared logic (no React components).
  - **`analysisFormSchema.ts`**: Shared Zod schema, default values, and inferred type for the analysis form.
  - **`env/env.ts`**: Env validation (Zod), `getEnv(overrides)`, and optional split getters for X-only / OpenAI-only.
  - **`ai/`**: OpenAI client, prompt, analysis orchestration, and output schema.
  - **`x/`**: X API client, search, query builders, and types.
  - **`analysis/`**: Normalization or analysis helpers used by the server.

Do not introduce barrel files under `src/lib/` or `src/app/components/`; keep direct imports from the defining file.

---

## 9. Checklist for New Work

- [ ] **Next.js**: Prefer Server Components; use `'use client'` only where necessary; mutations via Server Actions.
- [ ] **API keys**: Never send or expose keys to the client; use env and optional form overrides only on the server.
- [ ] **Forms**: One shared Zod schema for client (RHF) and server; validate Server Action input with the same schema.
- [ ] **Tailwind**: Use project palette (zinc, emerald, rose, amber, sky); parent `gap-*`; consistent borders/padding.
- [ ] **TypeScript**: No `any`; named components; explicit return types for public/action functions.
- [ ] **Comments and UI**: All comments and user-facing text in English; comment non-obvious logic.
- [ ] **Structure**: New components under `src/app/components/`; new logic under `src/lib/`; no barrel files; use `@/` imports.

---

## 10. References

- **Product and technical requirements**: `docs/REQUIREMENTS.md`
- **Cursor rules**: `.cursor/rules/` — use `init.mdc` first, then domain-specific rules (e.g. `guidelines/architecture/`, `guidelines/code/react/`, `guidelines/code/typescript/`) for detailed conventions on colors, typography, spacing, React, TypeScript, and testing.

When in doubt, align with existing patterns in `src/app/actions.ts`, `src/lib/analysisFormSchema.ts`, `src/lib/env/env.ts`, and `src/app/components/TradeForm.tsx`, and keep all new code and comments in English.
