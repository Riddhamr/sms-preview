import { Metadata } from 'next';

const SMS_TYPE_IMAGES: Record<string, string> = {
  ins: 'upload-insurance.png',
  upd: 'medicine-update.png',
  confirm: 'confirm-pharmacy.png',
};

const SUPPORTED_LOCALES = new Set(['en', 'es', 'ru']);

interface SmsPreviewHashPageProps {
  params: Promise<{ locale: string; hash: string }>;
  searchParams: Promise<{ type?: string }>;
}

export async function generateMetadata({ params, searchParams }: SmsPreviewHashPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { type } = await searchParams;
  const imageLocale = SUPPORTED_LOCALES.has(locale) ? locale : 'en';
  const imageName = (type && SMS_TYPE_IMAGES[type]) ?? 'confirm-pharmacy.png';

  return {
    title: 'ClearRx',
    openGraph: {
      images: [`https://clearrx.co/sms-preview/${imageLocale}/${imageName}`],
    },
  };
}

export default async function SmsPreviewHashPage({ params, searchParams }: SmsPreviewHashPageProps) {
  const { locale, hash } = await params;
  const { type } = await searchParams;
  const imageLocale = SUPPORTED_LOCALES.has(locale) ? locale : 'en';
  const imageName = (type && SMS_TYPE_IMAGES[type]) ?? 'confirm-pharmacy.png';

  return (
    <div style={{ padding: 32, fontFamily: 'monospace' }}>
      <p><strong>locale:</strong> {imageLocale}</p>
      <p><strong>hash:</strong> {hash}</p>
      <p><strong>type:</strong> {type ?? '(none)'}</p>
      <p><strong>image:</strong> {imageName}</p>
      <p><strong>og:image:</strong> https://clearrx.co/sms-preview/{imageLocale}/{imageName}</p>
    </div>
  );
}
