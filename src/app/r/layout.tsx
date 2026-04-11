import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AdSense Analysis Report | Ad2Go",
  description: "Detailed AdSense compliance and technical SEO report.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
