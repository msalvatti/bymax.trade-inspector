import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bymax Trade Inspector',
  description:
    'Market sentiment analysis from X.com posts and AI. Informational only, not financial advice.'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  )
}
