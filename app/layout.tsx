import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: ' ' },
  // metadataBase makes relative OG image URLs resolve to the right domain.
  // Set NEXT_PUBLIC_BASE_URL in Vercel env vars to your production URL.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
