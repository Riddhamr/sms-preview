import { Metadata } from 'next';
import Image from 'next/image';

const SMS_TYPE_IMAGES: Record<string, string> = {
  ins: 'upload-insurance.png',
  upd: 'medicine-update.png',
  confirm: 'confirm-pharmacy.png',
};

const SUPPORTED_LOCALES = new Set(['en', 'es', 'ru']);

interface SmsPreviewPageProps {
  searchParams: Promise<{ type?: string; locale?: string }>;
}

export async function generateMetadata({ searchParams }: SmsPreviewPageProps): Promise<Metadata> {
  const { type, locale } = await searchParams;
  const imageLocale = locale && SUPPORTED_LOCALES.has(locale) ? locale : 'en';
  const imageName = (type && SMS_TYPE_IMAGES[type]) ?? 'confirm-pharmacy.png';

  return {
    title: 'ClearRx',
    openGraph: {
      images: [`https://clearrx.co/sms-preview/${imageLocale}/${imageName}`],
    },
  };
}

export default async function SmsPreviewPage({ searchParams }: SmsPreviewPageProps) {
  const { type, locale } = await searchParams;
  const imageLocale = locale && SUPPORTED_LOCALES.has(locale) ? locale : 'en';
  const imageName = (type && SMS_TYPE_IMAGES[type]) ?? 'confirm-pharmacy.png';

  return (
    <Image
      src={`/sms-preview/${imageLocale}/${imageName}`}
      alt="SMS preview"
      width={1200}
      height={630}
      priority
    />
  );
}
