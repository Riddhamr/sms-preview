import { ImageResponse } from 'next/og'
import { previews, LOCALES, type Locale } from '../../../preview.config'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const version = searchParams.get('v') || 'default'
  const localeParam = searchParams.get('locale') || 'en'
  const locale: Locale = (LOCALES as readonly string[]).includes(localeParam)
    ? (localeParam as Locale)
    : 'en'

  const preview = previews[version] ?? previews['default']
  const content = preview[locale]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: preview.bgColor,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '60px',
        }}
      >
        {/* subtle grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            display: 'flex',
          }}
        />

        <div style={{ fontSize: 96, marginBottom: 28, display: 'flex' }}>
          {preview.emoji}
        </div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.15,
            marginBottom: 20,
            maxWidth: 960,
            display: 'flex',
          }}
        >
          {content.title}
        </div>

        <div
          style={{
            fontSize: 30,
            color: 'rgba(255,255,255,0.65)',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.5,
            display: 'flex',
          }}
        >
          {content.description}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
