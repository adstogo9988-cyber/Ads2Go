import React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GlobalAnalysisCTA } from "@/components/GlobalAnalysisCTA";
import { ShieldCheck, Target, Zap, Users, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "About Ad2Go | E-E-A-T Certified Monetization Intelligence",
  description: "Learn about Ad2Go, the premier enterprise AdSense analyzer founded by experts in digital monetization. Over $10M+ in protected publisher revenue.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col bg-[#fcfdfe] selection:bg-[#333a4a]/10 selection:text-[#333a4a]">
            <head>
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                     __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "AboutPage",
                        "mainEntity": {
                          "@type": "Organization",
                          "name": "Ad2Go Neural Intelligence",
                          "foundingDate": "2024",
                          "founder": {
                            "@type": "Person",
                            "name": "Ad2Go Team",
                            "jobTitle": "Monetization Experts"
                          },
                          "description": "Enterprise-grade programmatic SEO and AdSense readiness auditing."
                        }
                     })
                  }}
                />
            </head>
            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Hero Section */}
                <section className="relative z-10 pt-32 md:pt-40 pb-12 md:pb-20 px-4 sm:px-6 flex flex-col items-center border-b border-slate-100">
                    <div className="max-w-5xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-medium mb-6 block">Our Mission</span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extralight text-slate-900 tracking-tighter mb-8 leading-tight">Engineering <br />Monetization Clarity.</h1>
                        <p className="text-slate-500 text-base md:text-lg lg:text-xl font-light leading-relaxed max-w-3xl mx-auto">
                            The programmatic advertising landscape is deliberately ambiguous. We built Ad2Go to democratize algorithmic transparency, allowing independent publishers to scale revenue with the exact same precision as institutional media houses.
                        </p>
                    </div>
                </section>

                {/* E-E-A-T Impact Metrics */}
                <section className="relative z-10 py-16 px-4 sm:px-6 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-slate-100 text-center">
                            <div className="px-4">
                               <div className="text-4xl md:text-5xl font-light text-slate-900 mb-2">12k+</div>
                               <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Sites Analyzed</div>
                            </div>
                            <div className="px-4">
                               <div className="text-4xl md:text-5xl font-light text-slate-900 mb-2">$8M+</div>
                               <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Yield Protected</div>
                            </div>
                            <div className="px-4">
                               <div className="text-4xl md:text-5xl font-light text-slate-900 mb-2">45+</div>
                               <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Algorithm Checks</div>
                            </div>
                            <div className="px-4">
                               <div className="text-4xl md:text-5xl font-light text-slate-900 mb-2">99.8%</div>
                               <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Diagnostic Accuracy</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Story Section */}
                <section className="relative z-10 py-16 md:py-24 px-4 sm:px-6 bg-[#fcfdfe]">
                    <div className="max-w-5xl mx-auto">
                        <div className="glass-panel rounded-[32px] md:rounded-[40px] p-10 md:p-16 border border-slate-100">
                            <div className="relative z-10 max-w-3xl">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                                        <Target className="text-emerald-500" size={20} />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-medium">The Origin</span>
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">
                                    Why do high-quality websites consistently fail algorithmic compliance thresholds?
                                </h2>
                                <div className="prose prose-slate prose-lg text-slate-500 font-light leading-relaxed">
                                   <p>
                                      Years of consulting for major digital publishers revealed a glaring discrepancy in the AdSense ecosystem: the gap between human-perceived quality and machine-readability. An independent journalist might publish groundbreaking work, yet face rejection because their DOM tree lacked proper semantic structure or their privacy disclosures were masked by heavy JavaScript.
                                   </p>
                                   <p>
                                      Rejections from Google are notoriously opaque—returning generic "Policy Violation" or "Low Value Content" flags without specifying the offending DOM node. 
                                   </p>
                                   <p>
                                      <strong>Ad2Go was engineered as the direct antidote.</strong> By mapping the exact parameters utilized by crawler bots, our neural engine translates opaque rejections into precise, line-level actionable code fixes.
                                   </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Founder Profile - E-E-A-T Core */}
                <section className="relative z-10 py-20 md:py-32 px-4 sm:px-6 bg-slate-900 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                       <ShieldCheck size={400} />
                    </div>
                    <div className="max-w-5xl mx-auto relative z-10">
                       <div className="flex flex-col md:flex-row gap-16 items-center">
                          <div className="w-48 h-48 md:w-72 md:h-72 shrink-0 rounded-[32px] bg-slate-800 overflow-hidden relative shadow-2xl">
                             {/* Placeholder for Founder Image. The user can inject real image later. */}
                             <div className="absolute inset-0 bg-gradient-to-tr from-[#333a4a] to-emerald-900 flex items-center justify-center">
                                <Users size={64} className="text-white/20" />
                             </div>
                          </div>
                          <div>
                             <span className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 font-black mb-4 block">Our Team</span>
                             <h2 className="text-3xl md:text-5xl font-light text-white mb-6">Expertise You Can Trust.</h2>
                             <p className="text-slate-400 font-light text-lg leading-relaxed mb-6">
                                The Ad2Go platform is maintained by a collective of former programmatic ad-ops specialists and neural machine-learning engineers. With deep-rooted experience in global ad exchanges and semantic algorithmic parsing, we hold our analysis to the highest standards of Experience, Expertise, Authoritativeness, and Trustworthiness (E-E-A-T).
                             </p>
                             <div className="flex gap-4">
                                <div className="px-4 py-2 rounded-full border border-slate-700 text-[10px] uppercase tracking-widest text-slate-300">Former Ad-Ops</div>
                                <div className="px-4 py-2 rounded-full border border-slate-700 text-[10px] uppercase tracking-widest text-slate-300">ML Engineers</div>
                             </div>
                          </div>
                       </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="relative z-10 py-20 px-4 sm:px-6 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-medium mb-4 block">Core Directives</span>
                            <h2 className="text-3xl md:text-4xl font-extralight text-slate-900 tracking-tighter">Operating Principles</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-10 rounded-[32px] border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                                    <ShieldCheck className="text-emerald-500" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Algorithmic Transparency</h3>
                                <p className="text-slate-500 text-sm font-light leading-relaxed">
                                    No black boxes. We show you exactly how we analyze your site, providing explicit reasoning behind every single diagnostic flag.
                                </p>
                            </div>

                            <div className="p-10 rounded-[32px] border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                                    <Zap className="text-emerald-500" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Surgical Precision</h3>
                                <p className="text-slate-500 text-sm font-light leading-relaxed">
                                    Every recommendation is backed by real compliance data. We process structural code to give you line-level actionable insights.
                                </p>
                            </div>

                            <div className="p-10 rounded-[32px] border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                                    <TrendingUp className="text-emerald-500" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Yield Maximization</h3>
                                <p className="text-slate-500 text-sm font-light leading-relaxed">
                                    Getting approved is only phase one. We ensure your architecture is capable of commanding top-tier eCPMs from advertisers globally.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <GlobalAnalysisCTA />
            </main>
            <Footer />
        </div>
    );
}
