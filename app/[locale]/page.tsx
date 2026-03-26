import type { Metadata } from 'next'
import { LOCALES, type Locale } from '../../preview.config'
import { buildMetadata } from '../../lib/metadata'
import PreviewPage from '../components/PreviewPage'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ v?: string }>
}

/** If the segment isn't a valid locale (e.g. /123), default to 'en'. */
function resolveLocale(raw: string): Locale {
  return (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : 'en'
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const { v } = await searchParams
  return buildMetadata(resolveLocale(raw), undefined, v || 'default')
}

export default async function LocalePage({ params, searchParams }: Props) {
  const { locale: raw } = await params
  const { v } = await searchParams
  const locale = resolveLocale(raw)
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  return <PreviewPage locale={locale} version={v || 'default'} baseUrl={baseUrl} />
}
