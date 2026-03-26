import type { Metadata } from 'next'
import { LOCALES, type Locale } from '../../preview.config'
import { buildMetadata } from '../../lib/metadata'
import PreviewPage from '../components/PreviewPage'

type Props = {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<{ v?: string }>
}

/** Parse /[locale]/[id] or /[id] — en is the default locale (no prefix). */
function parseSlug(slug: string[]): { locale: Locale; id?: string } {
  const [first, second] = slug
  if ((LOCALES as readonly string[]).includes(first)) {
    return { locale: first as Locale, id: second }
  }
  return { locale: 'en', id: first }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const { v } = await searchParams
  const { locale, id } = parseSlug(slug)
  return buildMetadata(locale, id, v || 'default')
}

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { v } = await searchParams
  const { locale, id } = parseSlug(slug)
  const version = v || 'default'

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  return <PreviewPage locale={locale} id={id} version={version} baseUrl={baseUrl} />
}
