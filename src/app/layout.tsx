import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { DisableDevTools } from "@/components/DisableDevTools";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ad2vo.com"),
  title: "AdSense Checker & Analyzer | Ad2Go - AI-Powered Monetization Readiness",
  description: "Use Ad2Go's advanced AdSense Analyzer and Checker to audit your website's readiness for Google AdSense. Get enterprise AI-driven insights and semantic content analysis.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  keywords: ["Adsense Checker", "Adsense Analyzer", "Monetization Readiness", "AdSense Audit", "Website Analysis", "AI Content Analysis", "Ad2Go"],
  authors: [{ name: "Ad2Go Team" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "6w2clirAK9hQq-2GurQn87mw0BSSXAGT6RS94gyuFH0",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AdSense Checker & Analyzer | Ad2Go",
    description: "Enterprise AI-driven AdSense readiness and semantic content analysis. Designed for professional publishers.",
    url: "https://www.ad2vo.com",
    siteName: "Ad2Go Neural Intelligence",
    images: [
      {
        url: "/AD2GO.net.png",
        width: 1200,
        height: 630,
        alt: "Ad2Go AdSense Analyzer",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AdSense Checker & Analyzer | Ad2Go",
    description: "Audit your website's readiness for Google AdSense with Ad2Go's AI-powered analyzer.",
    images: ["/AD2GO.net.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Ad2Go",
                "url": "https://www.ad2vo.com",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://www.ad2vo.com/analysis?url={search_term_string}",
                  "query-input": "required name=search_term_string"
                },
                "description": "Enterprise AdSense Checker and Analyzer using AI-powered neural intelligence.",
                "keywords": "Adsense Checker, Adsense Analyzer, AdSense Readiness"
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Ad2Go",
                "url": "https://www.ad2vo.com",
                "logo": "https://www.ad2vo.com/favicon.png",
                "sameAs": [
                  "https://twitter.com/ad2go",
                  "https://www.linkedin.com/company/ad2go"
                ]
              }
            ]),
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${plusJakartaSans.variable} antialiased flex flex-col min-h-screen text-slate-900 bg-[#fcfdfe] overflow-x-hidden`}>
        <div className="liquid-bg fixed top-0 left-0 w-[100vw] h-[100vh] -z-10 bg-[radial-gradient(circle_at_50%_50%,#fcfdfe_0%,#f4f7fb_100%)] overflow-hidden pointer-events-none">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        {children}
        <Analytics />
        <SpeedInsights />
        <BreadcrumbJsonLd />
        <DisableDevTools />
        <div className="fixed bottom-0 left-0 right-0 h-64 pointer-events-none bg-gradient-to-t from-[#fcfdfe] to-transparent z-0"></div>
      </body>
    </html>
  );
}
