import type { Metadata } from 'next'
import { buildMetadata } from '../lib/metadata'
import PreviewPage from './components/PreviewPage'

type Props = { searchParams: Promise<{ v?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { v } = await searchParams
  return buildMetadata('en', undefined, v || 'default')
}

export default async function Page({ searchParams }: Props) {
  const { v } = await searchParams
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  return <PreviewPage locale="en" version={v || 'default'} baseUrl={baseUrl} />
}
