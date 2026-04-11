import React from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { CoreArchitecture } from "@/components/CoreArchitecture";
import { DetectionLayers } from "@/components/DetectionLayers";
import { DecisionOutcome } from "@/components/DecisionOutcome";
import { TrustCompliance } from "@/components/TrustCompliance";
import { ProfessionalOutcomes } from "@/components/ProfessionalOutcomes";
import { CaseStudies } from "@/components/CaseStudies";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";
import { GlobalAnalysisCTA } from "@/components/GlobalAnalysisCTA";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-grow flex flex-col relative z-10">
        <React.Suspense fallback={<div className="h-[500px] flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div></div>}>
          <Hero />
        </React.Suspense>
        <CoreArchitecture />
        <DetectionLayers />
        <DecisionOutcome />
        <TrustCompliance />
        <ProfessionalOutcomes />
        <CaseStudies />
        <FAQSection />
        <GlobalAnalysisCTA />
      </main>
      <Footer />
    </>
  );
}
