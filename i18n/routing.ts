import { defineRouting } from 'next-intl/routing';

export const defaultLocale = 'en';

export const localeNames = {
  en: 'English',
  es: 'Español',
  ru: 'Русский',
} as const;

export const locales: (keyof typeof localeNames)[] = ['en', 'es', 'ru'];

export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale,
});
