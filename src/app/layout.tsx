import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ad2Go - Refined Intelligence",
  description: "Enterprise AI-driven AdSense readiness and semantic content analysis.",
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
      </head>
      <body suppressHydrationWarning className={`${plusJakartaSans.variable} antialiased flex flex-col min-h-screen text-slate-900 bg-[#fcfdfe] overflow-x-hidden`}>
        <div className="liquid-bg fixed top-0 left-0 w-[100vw] h-[100vh] -z-10 bg-[radial-gradient(circle_at_50%_50%,#fcfdfe_0%,#f4f7fb_100%)] overflow-hidden pointer-events-none">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        {children}
        <div className="fixed bottom-0 left-0 right-0 h-64 pointer-events-none bg-gradient-to-t from-[#fcfdfe] to-transparent z-0"></div>
      </body>
    </html>
  );
}
