import type { Metadata } from 'next'
import { previews } from '../preview.config'
import CopyButton from './CopyButton'

type Props = {
  searchParams: Promise<{ v?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { v } = await searchParams
  const version = v || 'default'
  const preview = previews[version] ?? previews['default']

  return {
    title: preview.title,
    description: preview.description,
    openGraph: {
      title: preview.title,
      description: preview.description,
      images: [{ url: `/api/og?v=${version}`, width: 1200, height: 630, alt: preview.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: preview.title,
      description: preview.description,
      images: [`/api/og?v=${version}`],
    },
  }
}

export default async function Page({ searchParams }: Props) {
  const { v } = await searchParams
  const version = v || 'default'
  const preview = previews[version] ?? previews['default']
  const allVersions = Object.keys(previews)

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 600, marginBottom: 64 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>{preview.emoji}</div>
        <h1 style={{ fontSize: 42, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>
          {preview.title}
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>
          {preview.description}
        </p>
        {preview.pageContent && (
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginTop: 24, fontStyle: 'italic' }}>
            {preview.pageContent}
          </p>
        )}
      </div>

      {/* Version URLs panel */}
      <div style={{
        width: '100%',
        maxWidth: 560,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '28px 32px',
      }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>
          Share URLs — tap a version to copy
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allVersions.map((key) => {
            const p = previews[key]
            const url = key === 'default' ? baseUrl : `${baseUrl}?v=${key}`
            const isActive = key === version

            return (
              <CopyButton key={key} url={url} isActive={isActive} label={`${p.emoji}  ${key === 'default' ? 'default' : key}  —  ${p.title}`} />
            )
          })}
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 20, marginBottom: 0, lineHeight: 1.6 }}>
          Each URL has a unique cache in iMessage &amp; Android Messages.<br />
          Bump to <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>?v=v4</code> in <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>preview.config.ts</code> to show a fresh preview.
        </p>
      </div>

      <p style={{ marginTop: 32, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
        Currently showing: <strong style={{ color: 'rgba(255,255,255,0.4)' }}>{version}</strong>
      </p>
    </main>
  )
}
