export const LOCALES = ['en', 'es'] as const
export type Locale = (typeof LOCALES)[number]

export interface LocaleContent {
  title: string
  description: string
  pageContent?: string
}

export interface PreviewVersion {
  en: LocaleContent
  es: LocaleContent
  /** Emoji shown in the OG image */
  emoji: string
  /** Background hex color for the OG image */
  bgColor: string
}

/**
 * URL PATTERNS
 * ─────────────────────────────────────────────
 *  /              → en, default version
 *  /123           → en (default), id 123
 *  /en/123        → en, id 123
 *  /es/123        → es, id 123
 *  /es/123?v=v2   → es, id 123, version v2
 *
 * CACHE BUSTING
 *  Add a new version key below, redeploy, share with ?v=<key>
 *  iMessage/Android see a new URL and re-fetch the preview.
 */
export const previews: Record<string, PreviewVersion> = {
  default: {
    en: {
      title: "Confirm Your Pharmacy",
      description: "Tap to confirm your pharmacy.",
      pageContent: "Please confirm your pharmacy.",
    },
    es: {
      title: "Confirma Tu Farmacia",
      description: "Toca para confirmar tu farmacia.",
      pageContent: "Por favor confirma tu farmacia.",
    },
    emoji: "💊",
    bgColor: "#f6f7f8",
  },
  v2: {
    en: {
      title: "New Update!",
      description: "Something exciting just dropped.",
    },
    es: {
      title: "¡Nueva actualización!",
      description: "Algo emocionante acaba de llegar.",
    },
    emoji: "🚀",
    bgColor: "#1e1b4b",
  },
  v3: {
    en: {
      title: "Big Announcement",
      description: "You won't believe what we just launched.",
    },
    es: {
      title: "Gran anuncio",
      description: "No creerás lo que acabamos de lanzar.",
    },
    emoji: "🎉",
    bgColor: "#14532d",
  },
}
