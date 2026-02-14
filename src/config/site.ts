export const siteConfig = {
  name: "ReviewPulse",
  description:
    "AI-powered review response and reputation manager for local businesses.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og.png",
  links: {
    github: "https://github.com/bufaale/review-reputation",
    twitter: "https://twitter.com/yourusername",
  },
} as const;
