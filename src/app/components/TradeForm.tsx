'use client'

import { useState, useEffect, useRef, startTransition } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useActionState } from 'react'
import { runAnalysis, getUsage, type AnalyzeResult } from '@/app/actions'
import {
  analysisFormSchema,
  analysisFormDefaultValues,
  type AnalysisFormValues
} from '@/lib/analysisFormSchema'
import { ResultCard } from '@/app/components/ResultCard'
import { UsageCard } from '@/app/components/UsageCard'
import { PostsList } from '@/app/components/PostsList'
import type { XUsageResponse } from '@/lib/x/types'

const STORAGE_X_TOKEN = 'bymax_x_bearer_token'
const STORAGE_OPENAI_KEY = 'bymax_openai_api_key'

function getStoredKeys(): { x: string; openai: string } {
  if (typeof window === 'undefined') return { x: '', openai: '' }
  return {
    x: sessionStorage.getItem(STORAGE_X_TOKEN) ?? '',
    openai: sessionStorage.getItem(STORAGE_OPENAI_KEY) ?? ''
  }
}

function formDataWithKeys(x: string, openai: string): FormData {
  const fd = new FormData()
  fd.set('x_bearer_token', x)
  fd.set('openai_api_key', openai)
  return fd
}

const initialState: AnalyzeResult = {
  success: false,
  error: ''
}

export function Dashboard() {
  const [state, formAction, isPending] = useActionState(
    runAnalysis as (prev: unknown, formData: FormData) => Promise<AnalyzeResult>,
    initialState
  )
  const [initialUsage, setInitialUsage] = useState<XUsageResponse | null>(null)
  const [usageLoading, setUsageLoading] = useState(true)
  const [usageError, setUsageError] = useState<string | undefined>(undefined)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsXToken, setSettingsXToken] = useState('')
  const [settingsOpenAIKey, setSettingsOpenAIKey] = useState('')
  const {
    register,
    control,
    formState: { errors },
    watch,
    handleSubmit: rhfHandleSubmit,
    reset
  } = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisFormSchema) as Resolver<AnalysisFormValues>,
    defaultValues: analysisFormDefaultValues
  })

  const action = watch('action') ?? analysisFormDefaultValues.action

  const prevSuccessRef = useRef(false)
  useEffect(() => {
    if (state.success && !prevSuccessRef.current) {
      prevSuccessRef.current = true
      reset(analysisFormDefaultValues)
    }
    if (!state.success) prevSuccessRef.current = false
  }, [state.success, reset])

  const fetchUsage = (fd: FormData | undefined): void => {
    setUsageLoading(true)
    setUsageError(undefined)
    getUsage(null, fd).then((result) => {
      setUsageLoading(false)
      if (result.success) setInitialUsage(result.usage)
      else setUsageError(result.error)
    })
  }

  useEffect(() => {
    const { x, openai } = getStoredKeys()
    const fd = x && openai ? formDataWithKeys(x, openai) : undefined
    fetchUsage(fd)
  }, [])

  const MASK_SAVED = '••••••••••••••••••••••••••••••••'

  useEffect(() => {
    if (showSettings) {
      const { x, openai } = getStoredKeys()
      setSettingsXToken(x ? MASK_SAVED : '')
      setSettingsOpenAIKey(openai ? MASK_SAVED : '')
    }
  }, [showSettings])

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const stored = getStoredKeys()
    const x = settingsXToken === MASK_SAVED ? stored.x : settingsXToken.trim()
    const openai = settingsOpenAIKey === MASK_SAVED ? stored.openai : settingsOpenAIKey.trim()
    if (x) sessionStorage.setItem(STORAGE_X_TOKEN, x)
    else sessionStorage.removeItem(STORAGE_X_TOKEN)
    if (openai) sessionStorage.setItem(STORAGE_OPENAI_KEY, openai)
    else sessionStorage.removeItem(STORAGE_OPENAI_KEY)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
    if (x && openai) fetchUsage(formDataWithKeys(x, openai))
    setShowSettings(false)
  }

  const handleClearKeys = () => {
    sessionStorage.removeItem(STORAGE_X_TOKEN)
    sessionStorage.removeItem(STORAGE_OPENAI_KEY)
    setSettingsXToken('')
    setSettingsOpenAIKey('')
    setUsageError('Keys cleared. Add keys in Settings to use the app.')
    setInitialUsage(null)
  }

  const onAnalysisSubmit = (data: AnalysisFormValues) => {
    const { x, openai } = getStoredKeys()
    const hasSessionKeys = Boolean(x && openai)
    const hasServerEnvKeys = initialUsage != null
    const stillLoadingKeys = usageLoading
    if (!hasSessionKeys && !hasServerEnvKeys && !stillLoadingKeys) {
      setShowSettings(true)
      return
    }
    const fd = new FormData()
    fd.set('token', data.token)
    fd.set('action', data.action)
    if (hasSessionKeys) {
      fd.set('x_bearer_token', x)
      fd.set('openai_api_key', openai)
    }
    if (data.officialOnly) fd.set('officialOnly', 'on')
    if (data.xHandle) fd.set('xHandle', data.xHandle)
    if (data.englishOnly) fd.set('englishOnly', 'on')
    startTransition(() => {
      formAction(fd)
    })
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Bymax Trade Inspector
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Market sentiment analysis from X posts and AI. Informational only, not financial advice.
        </p>
      </header>

      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            {showSettings ? 'Settings' : 'Request'}
          </h2>
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="cursor-pointer text-sm font-medium text-zinc-400 hover:text-zinc-300"
          >
            {showSettings ? 'Hide API keys' : 'API keys'}
          </button>
        </div>

        {showSettings ? (
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="mb-3 text-xs text-zinc-500">
              Add your own API keys here. They are stored only in your browser (session) and sent
              over HTTPS for each request. They are not stored on our servers. Clear them when
              you&apos;re done.
            </p>
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-3">
              <div>
                <label
                  htmlFor="settings_x_token"
                  className="mb-1 block text-xs font-medium text-zinc-400"
                >
                  X.com Bearer Token
                </label>
                <input
                  id="settings_x_token"
                  name="settings_x_token"
                  type="password"
                  value={settingsXToken}
                  onChange={(e) => setSettingsXToken(e.target.value)}
                  placeholder="Paste your X API Bearer Token"
                  className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  autoComplete="off"
                />
              </div>
              <div>
                <label
                  htmlFor="settings_openai_key"
                  className="mb-1 block text-xs font-medium text-zinc-400"
                >
                  OpenAI API Key
                </label>
                <input
                  id="settings_openai_key"
                  name="settings_openai_key"
                  type="password"
                  value={settingsOpenAIKey}
                  onChange={(e) => setSettingsOpenAIKey(e.target.value)}
                  placeholder="Paste your OpenAI API key"
                  className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="cursor-pointer rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  {settingsSaved ? 'Saved' : 'Save (session only)'}
                </button>
                <button
                  type="button"
                  onClick={handleClearKeys}
                  className="cursor-pointer rounded border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-700"
                >
                  Clear keys
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <form
              action={formAction}
              onSubmit={rhfHandleSubmit(onAnalysisSubmit)}
              className="flex flex-col gap-4"
            >
              <div>
                <label htmlFor="token" className="mb-1 block text-sm font-medium text-zinc-300">
                  Token
                </label>
                <input
                  id="token"
                  type="text"
                  placeholder="e.g. SOL, BTC, ETH"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                  maxLength={12}
                  {...register('token', {
                    setValueAs: (v) => (typeof v === 'string' ? v.toUpperCase() : v)
                  })}
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.toUpperCase()
                  }}
                />
                {errors.token && (
                  <p className="mt-1 text-sm text-red-400">{errors.token.message}</p>
                )}
              </div>

              <Controller
                name="action"
                control={control}
                defaultValue="BUY"
                render={({ field: { value, onChange, name } }) => (
                  <div>
                    <span className="mb-2 block text-sm font-medium text-zinc-300">Action</span>
                    <div className="flex gap-2">
                      {(['BUY', 'SELL'] as const).map((option) => {
                        const isBuy = option === 'BUY'
                        const isSelected = value === option
                        return (
                          <label
                            key={option}
                            className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border py-2.5 text-sm font-medium transition-colors"
                            style={{
                              borderColor: isSelected
                                ? isBuy
                                  ? 'rgb(16 185 129)'
                                  : 'rgb(244 63 94)'
                                : 'rgb(39 39 42)',
                              backgroundColor: isSelected
                                ? isBuy
                                  ? 'rgba(16 185 129 / 0.15)'
                                  : 'rgba(244 63 94 / 0.15)'
                                : 'rgb(24 24 27)',
                              color: isSelected
                                ? isBuy
                                  ? 'rgb(52 211 153)'
                                  : 'rgb(251 113 133)'
                                : 'rgb(161 161 170)'
                            }}
                          >
                            <input
                              type="radio"
                              name={name}
                              value={option}
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => onChange(option)}
                            />
                            {option}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              />

              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    value="on"
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                    {...register('officialOnly')}
                  />
                  <span className="text-sm text-zinc-300">Official posts only</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    value="on"
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                    {...register('englishOnly')}
                  />
                  <span className="text-sm text-zinc-300">English only</span>
                </label>
              </div>

              <div>
                <label htmlFor="xHandle" className="mb-1 block text-sm font-medium text-zinc-300">
                  Project X account (optional)
                </label>
                <input
                  id="xHandle"
                  type="text"
                  placeholder="e.g. AskVenice or @AskVenice"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  {...register('xHandle')}
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? 'Analyzing…' : 'Analyze'}
              </button>
            </form>

            {Object.keys(errors).length > 0 && (
              <ul
                className="mt-4 list-inside list-disc space-y-1 text-sm text-red-400"
                role="alert"
                aria-live="polite"
              >
                {Object.entries(errors).map(([field, e]) => {
                  const label =
                    {
                      token: 'Token',
                      action: 'Action',
                      officialOnly: 'Official posts only',
                      englishOnly: 'English only',
                      xHandle: 'Project X account'
                    }[field] ?? field
                  const msg = e?.message ? String(e.message) : 'Invalid value'
                  return (
                    <li key={field}>
                      <strong>{label}:</strong> {msg}
                    </li>
                  )
                })}
              </ul>
            )}
            {!state.success && state.error && (
              <p className="mt-4 text-sm text-red-400" role="alert" aria-live="polite">
                {state.error}
              </p>
            )}
          </>
        )}
      </section>

      {(initialUsage != null || usageLoading || (getStoredKeys().x && getStoredKeys().openai)) && (
        <UsageCard
          usage={state.success && 'usage' in state ? state.usage : initialUsage}
          error={state.success && 'usage' in state ? undefined : usageError}
          loading={usageLoading && !(state.success && 'usage' in state)}
        />
      )}

      {state.success && state.analysis && (
        <>
          <ResultCard analysis={state.analysis} />
          {state.topPosts && state.topPosts.length > 0 && (
            <PostsList posts={state.topPosts} postIdsUsed={state.analysis.post_ids_used} />
          )}
        </>
      )}
    </main>
  )
}
