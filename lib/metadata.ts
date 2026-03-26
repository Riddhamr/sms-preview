import type { Metadata } from 'next'
import type { Locale } from '../preview.config'

export function buildMetadata(locale: Locale, id: string | undefined, version: string): Metadata {
  return {
    title: { absolute: ' ' },
    openGraph: {
      title: ' ',
      images: [{ url: `/api/og?v=${version}&locale=${locale}`, width: 1200, height: 630, alt: '' }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ' ',
      images: [`/api/og?v=${version}&locale=${locale}`],
    },
  }
}
