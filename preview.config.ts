export interface PreviewVersion {
  /** Title shown in SMS/iMessage preview card */
  title: string
  /** Description shown below the title in preview card */
  description: string
  /** Emoji displayed prominently in the OG image */
  emoji: string
  /** Background color for the OG image (hex) */
  bgColor: string
  /** Optional: content shown when someone actually visits the page */
  pageContent?: string
}

/**
 * HOW TO USE
 * ----------
 * 1. Edit or add versions below
 * 2. Push to Vercel (redeploy)
 * 3. Share the URL with ?v=<key> to bust SMS cache
 *
 * Examples:
 *   https://yoursite.com          → uses "default"
 *   https://yoursite.com?v=v2     → uses "v2"
 *   https://yoursite.com?v=v3     → uses "v3"
 *
 * iOS/Android SMS apps cache previews per URL, so changing ?v= forces
 * them to re-fetch the latest preview metadata.
 */
export const previews: Record<string, PreviewVersion> = {
  default: {
    title: "My Link",
    description: "Tap to check it out.",
    emoji: "🔗",
    bgColor: "#0f172a",
    pageContent: "Welcome! You can customize this in preview.config.ts",
  },
  v2: {
    title: "New Update! 🚀",
    description: "Something exciting just dropped. Check it out.",
    emoji: "🚀",
    bgColor: "#1e1b4b",
    pageContent: "Version 2 is live!",
  },
  v3: {
    title: "Big Announcement 🎉",
    description: "You won't believe what we just launched.",
    emoji: "🎉",
    bgColor: "#14532d",
    pageContent: "Version 3 – the big reveal!",
  },
}
