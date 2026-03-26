import { previews, LOCALES, type Locale } from '../../preview.config'
import CopyButton from '../CopyButton'

interface Props {
  locale: Locale
  id?: string
  version: string
  baseUrl: string
}

/** Build a share URL given locale, optional id, and version. */
function buildUrl(baseUrl: string, locale: Locale, id: string | undefined, version: string): string {
  const parts: string[] = []
  // en is the default — no prefix needed; es always gets a prefix
  if (locale !== 'en') parts.push(locale)
  if (id) parts.push(id)
  const path = parts.length ? '/' + parts.join('/') : ''
  const query = version !== 'default' ? `?v=${version}` : ''
  return `${baseUrl}${path}${query}`
}

export default function PreviewPage({ locale, id, version, baseUrl }: Props) {
  const preview = previews[version] ?? previews['default']
  const content = preview[locale]
  const allVersions = Object.keys(previews)

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 600, marginBottom: 64 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>{preview.emoji}</div>
        <h1 style={{ fontSize: 42, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>
          {content.title}
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>
          {content.description}
        </p>
        {content.pageContent && (
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginTop: 24, fontStyle: 'italic' }}>
            {content.pageContent}
          </p>
        )}
      </div>

      {/* Share grid: versions × locales */}
      <div style={{
        width: '100%',
        maxWidth: 600,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '28px 32px',
      }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>
          Share URLs
        </h2>

        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(2, 90px)', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>version</div>
          {LOCALES.map(l => (
            <div key={l} style={{ fontSize: 11, color: l === locale ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>
              {l}
            </div>
          ))}
        </div>

        {/* Version rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {allVersions.map((v) => {
            const p = previews[v]
            return (
              <div key={v} style={{
                display: 'grid',
                gridTemplateColumns: '1fr repeat(2, 90px)',
                gap: 8,
                alignItems: 'center',
                padding: '8px 12px',
                background: v === version ? 'rgba(255,255,255,0.07)' : 'transparent',
                borderRadius: 8,
                border: `1px solid ${v === version ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
              }}>
                <div style={{ fontSize: 14, color: v === version ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                  {p.emoji} {v}
                </div>
                {LOCALES.map(l => (
                  <CopyButton
                    key={l}
                    url={buildUrl(baseUrl, l, id, v)}
                    isActive={v === version && l === locale}
                    label="copy"
                  />
                ))}
              </div>
            )
          })}
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 20, marginBottom: 0, lineHeight: 1.6 }}>
          {id && <span>ID: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>{id}</code> &nbsp;·&nbsp; </span>}
          Add a new version key in <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>preview.config.ts</code> to bust SMS cache.
        </p>
      </div>

      <p style={{ marginTop: 28, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
        <span style={{ color: 'rgba(255,255,255,0.35)' }}>{locale}</span>
        {id && <> · <span style={{ color: 'rgba(255,255,255,0.35)' }}>{id}</span></>}
        {' · '}
        <span style={{ color: 'rgba(255,255,255,0.35)' }}>{version}</span>
      </p>
    </main>
  )
}
