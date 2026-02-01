import type { ReactNode } from 'react'
import type { Metadata } from 'next'

import './globals.css'
import { Footer } from '@/app/components/Footer'

const APP_BASE_URL =
  typeof process.env.NEXT_PUBLIC_APP_URL === 'string' && process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'https://inspector.bymax.trade'

export const metadata: Metadata = {
  metadataBase: new URL(APP_BASE_URL),
  title: 'Bymax Trade Inspector – Crypto Market Sentiment Analysis with AI',
  description:
    'Market sentiment analysis from X.com posts and AI. Enter a crypto token (BTC, ETH, SOL) and your buy or sell intention; get an AI-backed viability read based on real-time social sentiment. Informational only, not financial advice.',
  keywords: [
    // Primary (crypto & trade)
    'crypto sentiment analysis',
    'crypto market sentiment',
    'bitcoin sentiment',
    'ethereum sentiment',
    'solana sentiment',
    'trade sentiment',
    'buy sell signal',
    'market sentiment tool',
    // AI & automation
    'AI crypto analysis',
    'AI sentiment analysis',
    'GPT crypto analysis',
    'OpenAI crypto',
    'AI trade analysis',
    'automated sentiment',
    // X / social
    'X.com crypto',
    'Twitter crypto sentiment',
    'social sentiment crypto',
    'X API crypto',
    // Intent & discovery
    'should I buy crypto',
    'should I sell crypto',
    'crypto viability',
    'trade inspector',
    'trade dashboard',
    'crypto research tool',
    // Tokens
    'BTC sentiment',
    'ETH sentiment',
    'SOL sentiment',
    'altcoin sentiment',
    'crypto token analysis',
    // Disclaimer-related
    'crypto analysis tool',
    'market mood crypto',
    'bullish bearish crypto'
  ],
  authors: [{ name: 'Bymax Trade Inspector' }],
  creator: 'Bymax Trade Inspector',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_BASE_URL,
    title: 'Bymax Trade Inspector – Crypto Sentiment Analysis with AI',
    description:
      'Analyze crypto market sentiment from X.com posts with AI. Enter a token and buy/sell intention; get a clear viability read. Informational only, not financial advice.',
    siteName: 'Bymax Trade Inspector',
    images: [
      {
        url: '/img/results.png',
        width: 1200,
        height: 630,
        alt: 'Bymax Trade Inspector – Crypto market sentiment analysis with AI'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@bymaxtrade',
    creator: '@bymaxtrade',
    title: 'Bymax Trade Inspector – Crypto Sentiment Analysis with AI',
    description:
      'Market sentiment from X.com + AI. Enter token and buy/sell intention; get viability read. Informational only.',
    images: ['/img/results.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: APP_BASE_URL
  }
}

function JsonLdScripts(): ReactNode {
  const appBaseUrl =
    typeof process.env.NEXT_PUBLIC_APP_URL === 'string' && process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL
      : 'https://trade-inspector.bymax.com'

  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Bymax Trade Inspector',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    description:
      'Market sentiment analysis from X.com posts and AI. Enter a crypto token and buy or sell intention; get an AI-backed viability read based on real-time social sentiment. Informational only, not financial advice.'
  }

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bymax Trade Inspector',
    url: appBaseUrl,
    description:
      'Crypto market sentiment analysis using X.com posts and AI. Informational tool only, not financial advice.',
    sameAs: ['https://instagram.com/bymaxtrade', 'https://x.com/bymaxtrade']
  }

  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Crypto Market Sentiment Analysis',
    provider: {
      '@type': 'Organization',
      name: 'Bymax Trade Inspector'
    },
    areaServed: { '@type': 'Country', name: 'Worldwide' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Analysis Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Crypto Sentiment Analysis',
            description:
              'AI-powered sentiment analysis from X.com posts for crypto tokens (e.g. BTC, ETH, SOL) with buy/sell viability read'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Market Bias Detection',
            description:
              'Bullish, bearish, mixed or unclear market bias from real-time social discussion'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Trade Inspector Dashboard',
            description:
              'Single dashboard to run analyses and view top posts that influenced the AI decision'
          }
        }
      ]
    }
  }

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does Bymax Trade Inspector work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You enter a crypto token symbol (e.g. BTC, ETH, SOL) and your intention (buy or sell). The app fetches recent posts from X.com about that token, scores them by engagement and recency, and sends a compact set to OpenAI. The AI classifies market sentiment (bullish, bearish, mixed, unclear) and recommends allow, abort, or reverse for your intended action. You see the decision, confidence, reason, and the top posts that influenced it.'
        }
      },
      {
        '@type': 'Question',
        name: 'Does Bymax Trade Inspector execute real trades?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Bymax Trade Inspector is a simulation and research tool only. It does not execute trades and is not financial advice. Use it to gauge market sentiment from X.com and AI; always do your own research and consult professionals before making financial decisions.'
        }
      },
      {
        '@type': 'Question',
        name: 'What tokens can I analyze?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can enter any token symbol (2–12 characters), e.g. BTC, ETH, SOL, LINK. The app searches X.com for posts mentioning that token and uses them for sentiment analysis. Well-known symbols tend to have more and better signal.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do I need my own X and OpenAI API keys?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can run the app with keys set in the environment (e.g. on your server or Vercel). For public deploys, you can optionally enter your own X Bearer Token and OpenAI API key in the browser; they are sent only with each request and are not stored on our servers.'
        }
      },
      {
        '@type': 'Question',
        name: 'What does ALLOW, ABORT, and REVERSE mean?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ALLOW: the AI agrees with your intended action (e.g. you said buy and sentiment supports buy). ABORT: the AI recommends holding (HOLD), e.g. when evidence is unclear or mixed. REVERSE: the AI recommends the opposite (e.g. you said buy but sentiment is bearish, so it recommends sell). This is informational only, not a trading signal.'
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplication) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
    </>
  )
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <JsonLdScripts />
      </head>
      <body className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 antialiased">
        {children}
        <Footer />
      </body>
    </html>
  )
}
