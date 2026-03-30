import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { locales, defaultLocale } from '@/i18n/routing';

export async function getMessages(locale: string) {
  try {
    return (await import(`@/messages/${locale}.json`)).default;
  } catch {
    throw new Error(`Failed to load messages for locale: ${locale}`);
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(locales, requested) ? requested : defaultLocale;

  return {
    locale,
    messages: await getMessages(locale),
  };
});
