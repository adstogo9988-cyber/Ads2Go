"use strict";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { CoreArchitecture } from "@/components/CoreArchitecture";
import { DetectionLayers } from "@/components/DetectionLayers";
import { DecisionOutcome } from "@/components/DecisionOutcome";
import { TrustCompliance } from "@/components/TrustCompliance";
import { ProfessionalOutcomes } from "@/components/ProfessionalOutcomes";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-grow flex flex-col relative z-10">
        <Hero />
        <CoreArchitecture />
        <DetectionLayers />
        <DecisionOutcome />
        <TrustCompliance />
        <ProfessionalOutcomes />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
