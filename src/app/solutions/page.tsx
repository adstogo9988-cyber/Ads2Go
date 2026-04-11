import React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GlobalAnalysisCTA } from "@/components/GlobalAnalysisCTA";
import { CheckCircle2, ShieldCheck, Database, Zap, BookOpen, LineChart } from "lucide-react";

export const metadata: Metadata = {
  title: "AdSense Intelligence Solutions | Enterprise Website Analyzer by Ad2Go",
  description: "Eliminate monetization uncertainty with Ad2Go's high-fidelity neural processing and structural alignment. Our advanced AdSense checker ensures strict policy compliance.",
  alternates: {
    canonical: "/solutions",
  },
};

export default function SolutionsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-[#fcfdfe] selection:bg-[#333a4a]/10 selection:text-[#333a4a]">
            {/* Schema Injection */}
            <head>
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                     __html: JSON.stringify({
                        "@context": "https://schema.org/",
                        "@type": "Service",
                        "serviceType": "AdSense Monetization Analysis",
                        "provider": {
                          "@type": "Organization",
                          "name": "Ad2Go"
                        },
                        "description": "Enterprise-grade neural scanning and structural mapping to ensure Google AdSense policy compliance and revenue maximization.",
                        "offers": {
                          "@type": "Offer",
                          "priceSpecification": {
                            "@type": "PriceSpecification",
                            "priceCurrency": "USD",
                            "price": "0.00"
                          }
                        }
                     })
                  }}
                />
            </head>

            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Hero Section */}
                <section className="relative z-10 pt-32 md:pt-48 pb-20 md:pb-32 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-5xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-medium mb-6 block">Enterprise Intelligence</span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extralight text-slate-900 tracking-tighter mb-8">Intelligence Solutions.</h1>
                        <p className="text-slate-500 text-base md:text-lg lg:text-xl font-light leading-relaxed max-w-3xl mx-auto">
                            Eliminating monetization uncertainty through high-fidelity neural processing and structural alignment. Our advanced checker algorithm dives deep into the semantic core of your publication, identifying compliance vulnerabilities before Google's bots formulate a block. Discover why thousands of top-tier publishers rely on Ad2Go to safeguard their programmatic revenue streams.
                        </p>
                    </div>
                </section>

                {/* The Monetization Gap Section - Expanded */}
                <section className="relative z-10 py-12 md:py-20 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-6xl w-full">
                        <div className="glass-panel rounded-[32px] md:rounded-[50px] p-8 md:p-12 lg:p-16">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
                                <div>
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold mb-6 block">Market Friction</span>
                                    <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-6">The Monetization Gap</h2>
                                    <p className="text-slate-500 font-light leading-relaxed mb-8">
                                        Structural barriers and semantic opacity create a cycle of rejection that halts digital growth. Most publishers apply for monetization networks blindly, unaware of the rigorous, automated machine-learning checks performed by major ad networks. These checks scan for exact programmatic footprints, specific layout elements, and precise semantic value density.
                                    </p>
                                    <p className="text-slate-500 font-light leading-relaxed mb-8">
                                        When a publisher falls short of these hidden parameters, the result is an automated, opaque rejection. No detailed debug logs, no specific file references—just a frustrating "Low Value Content" or "Site Behavior: Navigation" error. This gap creates massive velocity stall for digital entrepreneurs.
                                    </p>
                                </div>
                                <div className="space-y-6 md:space-y-8">
                                    <div className="flex items-start gap-4 md:gap-5">
                                        <Zap className="text-slate-300 mt-1 flex-shrink-0" size={24} />
                                        <div>
                                            <h4 className="text-slate-800 font-medium text-sm mb-1">Infinite Rejection Loops</h4>
                                            <p className="text-slate-400 text-xs font-light leading-relaxed">Systemic refusal without actionable diagnostic feedback. Publishers often edit blindly, changing themes or deleting good articles unnecessarily, wasting hundreds of hours without resolving the core algorithmic penalty.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 md:gap-5">
                                        <ShieldCheck className="text-slate-300 mt-1 flex-shrink-0" size={24} />
                                        <div>
                                            <h4 className="text-slate-800 font-medium text-sm mb-1">Policy Opacity</h4>
                                            <p className="text-slate-400 text-xs font-light leading-relaxed">Hidden compliance triggers that create unpredictable outcomes. The exact requirements for privacy policies, cookie disclosures, and content classification shift dynamically; what worked in 2024 results in a ban in 2026.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 md:gap-5">
                                        <LineChart className="text-slate-300 mt-1 flex-shrink-0" size={24} />
                                        <div>
                                            <h4 className="text-slate-800 font-medium text-sm mb-1">Velocity Stall</h4>
                                            <p className="text-slate-400 text-xs font-light leading-relaxed">Time-to-revenue extended by weeks of manual iteration. Every rejection pushes ad-serving timelines back by 14-30 days, resulting in thousands of dollars in lost yield.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Detailed Systemic Resolution Overview */}
                <section className="relative z-10 py-20 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-4xl w-full text-center mb-16">
                         <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-medium mb-4 block">The Engine Details</span>
                         <h2 className="text-3xl md:text-4xl font-extralight text-slate-900 tracking-tight mb-8">Deep Systemic Resolution</h2>
                         <p className="text-slate-500 font-light leading-relaxed text-left md:text-center">
                           To counteract programmatic friction, Ad2Go deploys an advanced neural assessment protocol. Our architecture mirrors the actual Googlebot crawler logic, performing deep structural and semantic audits across your domain in milliseconds. We do not just look at your text; we look at how your text is mapped programmatically, how your images are prioritized, and how your internal linking architecture directs link equity.
                         </p>
                    </div>

                    <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8">
                       <div className="p-10 rounded-[32px] border border-slate-100 bg-white">
                          <Database className="text-emerald-500 mb-6" size={32} />
                          <h3 className="text-xl font-bold text-slate-900 mb-4">Structural Re-engineering</h3>
                          <p className="text-slate-500 font-light text-sm leading-relaxed mb-4">
                            We analyze your DOM tree to ensure it aligns with strict machine-readability standards. Are your H1 tags correctly configured? Are navigation menus accessible without executing complex JavaScript? Our engine flags any structural anomaly that could trigger a "Site Behavior" penalty.
                          </p>
                          <ul className="space-y-2 mt-6">
                            {["DOM Tree Accessibility", "Core Web Vitals Assessment", "Internal Link Equity Map"].map((feat, i) => (
                              <li key={i} className="flex gap-3 text-sm text-slate-600 font-light">
                                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" /> {feat}
                              </li>
                            ))}
                          </ul>
                       </div>

                       <div className="p-10 rounded-[32px] border border-slate-100 bg-white">
                          <BookOpen className="text-emerald-500 mb-6" size={32} />
                          <h3 className="text-xl font-bold text-slate-900 mb-4">Semantic Purification</h3>
                          <p className="text-slate-500 font-light text-sm leading-relaxed mb-4">
                            Our LLM-driven backend evaluates the actual intent and originality of your written content. We detect "thin" content, scraped text combinations, and lack of E-E-A-T signals. We then provide actionable directives on how to inject semantic density to elevate your "Content Value" score.
                          </p>
                          <ul className="space-y-2 mt-6">
                            {["E-E-A-T Signal Detection", "Plagiarism & Spun Text Auditing", "Semantic Density Scoring"].map((feat, i) => (
                              <li key={i} className="flex gap-3 text-sm text-slate-600 font-light">
                                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" /> {feat}
                              </li>
                            ))}
                          </ul>
                       </div>
                    </div>
                </section>

                {/* Ecosystem Solutions */}
                <section className="relative z-10 py-20 px-4 sm:px-6 flex flex-col items-center bg-slate-50 border-y border-slate-100">
                    <div className="max-w-6xl w-full">
                        <div className="text-center mb-16 md:mb-24">
                            <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-medium mb-4 block">Ecosystem</span>
                            <h2 className="text-3xl md:text-4xl font-extralight text-slate-900 tracking-tight">Tailored Intelligence Output</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <div className="solution-card bg-white rounded-[28px] md:rounded-[35px] shadow-sm p-6 md:p-8 flex flex-col">
                                <span className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-semibold border-b border-slate-100 pb-2 mb-6 block">For Bloggers</span>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Content Velocity</h3>
                                <p className="text-slate-500 text-xs font-light leading-relaxed mb-8 flex-grow">Automated readiness checks for niche publishers. Ensure every article meets the monetization baseline before pushing to production, eliminating the risk of unexpected de-indexation or network holds.</p>
                            </div>
                            <div className="solution-card bg-white rounded-[28px] md:rounded-[35px] shadow-sm p-6 md:p-8 flex flex-col">
                                <span className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-semibold border-b border-slate-100 pb-2 mb-6 block">For Publishers</span>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Yield Optimization</h3>
                                <p className="text-slate-500 text-xs font-light leading-relaxed mb-8 flex-grow">Multi-domain analysis for media houses managing massive diverse asset portfolios. Scale your revenue by guaranteeing compliance across hundreds of subdomains and international variants effortlessly.</p>
                            </div>
                            <div className="solution-card bg-white rounded-[28px] md:rounded-[35px] shadow-sm p-6 md:p-8 flex flex-col">
                                <span className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-semibold border-b border-slate-100 pb-2 mb-6 block">For Agencies</span>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Client Success</h3>
                                <p className="text-slate-500 text-xs font-light leading-relaxed mb-8 flex-grow">Whitelabel diagnostics to accelerate client approvals. Bring actionable data to client meetings, proving exactly what structural deficits exist and demonstrating your agency's superior technical proficiency.</p>
                            </div>
                            <div className="solution-card bg-white rounded-[28px] md:rounded-[35px] shadow-sm p-6 md:p-8 flex flex-col">
                                <span className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-semibold border-b border-slate-100 pb-2 mb-6 block">For Developers</span>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">API Integration</h3>
                                <p className="text-slate-500 text-xs font-light leading-relaxed mb-8 flex-grow">Programmatic readiness assessment integrated directly into the CMS workflow. Connect your headless architecture securely via our Neural API protocol to trigger scans immediately post-build.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Enterprise Outcomes Section */}
                <section className="relative z-10 py-20 md:py-32 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-5xl w-full">
                        <div className="text-center mb-12 md:mb-16">
                            <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-medium mb-4 block">The Result</span>
                            <h2 className="text-3xl md:text-4xl font-extralight text-slate-900 tracking-tight">Enterprise Outcomes</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            {/* Decision Confidence Card */}
                            <div className="outcome-card glass-card rounded-[30px] md:rounded-[40px] p-8 md:p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-sm font-medium text-slate-800">Decision Confidence</h4>
                                    <span className="text-[10px] text-emerald-500 font-medium bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">99.8%</span>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[9px] uppercase tracking-widest text-slate-400">
                                            <span>Signal Accuracy</span>
                                            <span>Optimal</span>
                                        </div>
                                        <div className="micro-viz-bar"><div className="micro-viz-fill animate-bar-fill" style={{ width: '98%' }}></div></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[9px] uppercase tracking-widest text-slate-400">
                                            <span>False Positive Mitigation</span>
                                            <span>Deep Active</span>
                                        </div>
                                        <div className="micro-viz-bar"><div className="micro-viz-fill animate-bar-fill" style={{ width: '94%', animationDelay: '0.2s' }}></div></div>
                                    </div>
                                </div>
                            </div>
                            {/* Risk Mitigation Card */}
                            <div className="outcome-card glass-card rounded-[30px] md:rounded-[40px] p-8 md:p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-sm font-medium text-slate-800">Risk Mitigation</h4>
                                    <span className="text-[10px] text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Minimal</span>
                                </div>
                                <div className="flex items-center gap-4 mb-8 justify-center">
                                    <div className="flex-1 flex flex-col items-center risk-bar-container">
                                        <div className="w-2 h-10 bg-slate-200/50 rounded-full relative overflow-hidden">
                                            <div className="risk-bar-fill absolute bottom-0 w-full bg-slate-400/60 rounded-full" style={{ height: '20%' }}></div>
                                        </div>
                                        <span className="text-[8px] uppercase tracking-tighter text-slate-400 mt-2">Compliance</span>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center risk-bar-container">
                                        <div className="w-2 h-10 bg-slate-200/50 rounded-full relative overflow-hidden">
                                            <div className="risk-bar-fill absolute bottom-0 w-full bg-slate-400/60 rounded-full" style={{ height: '15%', animationDelay: '0.15s' }}></div>
                                        </div>
                                        <span className="text-[8px] uppercase tracking-tighter text-slate-400 mt-2">Semantic</span>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center risk-bar-container">
                                        <div className="w-2 h-10 bg-slate-200/50 rounded-full relative overflow-hidden">
                                            <div className="risk-bar-fill absolute bottom-0 w-full bg-slate-400/60 rounded-full" style={{ height: '10%', animationDelay: '0.3s' }}></div>
                                        </div>
                                        <span className="text-[8px] uppercase tracking-tighter text-slate-400 mt-2">Security</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 font-light leading-relaxed italic text-center">Continuous ethereal monitoring of domain health signals.</p>
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
