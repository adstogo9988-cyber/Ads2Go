"use strict";
import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function SolutionsPage() {
    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Hero Section */}
                <section className="relative z-10 pt-32 md:pt-48 pb-20 md:pb-32 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-4xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-medium mb-6 block">Enterprise Intelligence</span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extralight text-slate-900 tracking-tighter mb-8">Intelligence Solutions</h1>
                        <p className="text-slate-500 text-base md:text-lg lg:text-xl font-light leading-relaxed max-w-2xl mx-auto">
                            Eliminating monetization uncertainty through high-fidelity neural processing and structural alignment.
                        </p>
                    </div>
                </section>

                {/* Monetization Gap Section */}
                <section className="relative z-10 py-12 md:py-20 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-5xl w-full">
                        <div className="glass-panel rounded-[32px] md:rounded-[50px] p-8 md:p-12 lg:p-16">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                                <div>
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold mb-6 block">Market Friction</span>
                                    <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-6">The Monetization Gap</h2>
                                    <p className="text-slate-500 font-light leading-relaxed mb-8">Structural barriers and semantic opacity create a cycle of rejection that halts digital growth.</p>
                                </div>
                                <div className="space-y-6 md:space-y-8">
                                    <div className="flex items-start gap-4 md:gap-5">
                                        <span className="material-symbols-outlined text-slate-300 mt-1">rebase_edit</span>
                                        <div>
                                            <h4 className="text-slate-800 font-medium text-sm mb-1">Infinite Rejection Loops</h4>
                                            <p className="text-slate-400 text-xs font-light leading-relaxed">Systemic refusal without actionable diagnostic feedback.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 md:gap-5">
                                        <span className="material-symbols-outlined text-slate-300 mt-1">visibility_off</span>
                                        <div>
                                            <h4 className="text-slate-800 font-medium text-sm mb-1">Policy Opacity</h4>
                                            <p className="text-slate-400 text-xs font-light leading-relaxed">Hidden compliance triggers that create unpredictable outcomes.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 md:gap-5">
                                        <span className="material-symbols-outlined text-slate-300 mt-1">speed</span>
                                        <div>
                                            <h4 className="text-slate-800 font-medium text-sm mb-1">Velocity Stall</h4>
                                            <p className="text-slate-400 text-xs font-light leading-relaxed">Time-to-revenue extended by weeks of manual iteration.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Systemic Resolution Section */}
                <section className="relative z-10 py-20 md:py-32 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-3xl w-full">
                        <div className="text-center mb-12 md:mb-20">
                            <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-medium mb-4 block">The Engine</span>
                            <h2 className="text-3xl md:text-4xl font-extralight text-slate-900 tracking-tight">Systemic Resolution</h2>
                        </div>
                        <div className="flex flex-col items-center space-y-0">
                            <div className="glass-card w-full rounded-[30px] md:rounded-[40px] p-8 md:p-10 relative z-30">
                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                                        <span className="material-symbols-outlined text-slate-400 font-light text-xl md:text-2xl">account_tree</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-light text-slate-900 mb-1">Structural Re-engineering</h3>
                                        <p className="text-slate-500 text-sm font-light">Aligning site hierarchy with algorithmic crawlers for 100% indexing transparency.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="system-step-connector"></div>
                            <div className="glass-card w-[95%] rounded-[30px] md:rounded-[40px] p-8 md:p-10 relative z-20">
                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                                        <span className="material-symbols-outlined text-slate-400 font-light text-xl md:text-2xl">psychology</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-light text-slate-900 mb-1">Semantic Purification</h3>
                                        <p className="text-slate-500 text-sm font-light">Optimizing content signals to meet the highest E-E-A-T and original value standards.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="system-step-connector"></div>
                            <div className="glass-card w-[90%] rounded-[30px] md:rounded-[40px] p-8 md:p-10 relative z-10">
                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                                        <span className="material-symbols-outlined text-slate-400 font-light text-xl md:text-2xl">verified_user</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-light text-slate-900 mb-1">Policy Alignment Engine</h3>
                                        <p className="text-slate-500 text-sm font-light">Continuous mapping against global compliance frameworks to eliminate risk.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tailored Intelligence Section */}
                <section className="relative z-10 py-20 md:py-32 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-6xl w-full">
                        <div className="text-center mb-16 md:mb-24">
                            <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-medium mb-4 block">Ecosystem</span>
                            <h2 className="text-3xl md:text-4xl font-extralight text-slate-900 tracking-tight">Tailored Intelligence</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {/* Content Velocity Card */}
                            <div className="solution-card glass-card rounded-[28px] md:rounded-[35px] p-6 md:p-8 flex flex-col h-full cursor-default">
                                <div className="mb-6 md:mb-8">
                                    <span className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-semibold border-b border-slate-200 pb-2">For Bloggers</span>
                                </div>
                                <h3 className="text-lg md:text-xl font-light text-slate-900 mb-4">Content Velocity</h3>
                                <p className="text-slate-400 text-xs font-light leading-relaxed mb-8 md:mb-10 flex-grow">Automated readiness checks for niche publishers focused on organic scale.</p>
                                <div className="learn-more-link flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-medium cursor-pointer">
                                    Learn More <span className="material-symbols-outlined text-xs ml-2 arrow-icon">east</span>
                                </div>
                            </div>
                            {/* Yield Optimization Card */}
                            <div className="solution-card glass-card rounded-[28px] md:rounded-[35px] p-6 md:p-8 flex flex-col h-full cursor-default">
                                <div className="mb-6 md:mb-8">
                                    <span className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-semibold border-b border-slate-200 pb-2">For Publishers</span>
                                </div>
                                <h3 className="text-lg md:text-xl font-light text-slate-900 mb-4">Yield Optimization</h3>
                                <p className="text-slate-400 text-xs font-light leading-relaxed mb-8 md:mb-10 flex-grow">Multi-domain analysis for media houses managing diverse asset portfolios.</p>
                                <div className="learn-more-link flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-medium cursor-pointer">
                                    Learn More <span className="material-symbols-outlined text-xs ml-2 arrow-icon">east</span>
                                </div>
                            </div>
                            {/* Client Success Card */}
                            <div className="solution-card glass-card rounded-[28px] md:rounded-[35px] p-6 md:p-8 flex flex-col h-full cursor-default">
                                <div className="mb-6 md:mb-8">
                                    <span className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-semibold border-b border-slate-200 pb-2">For Agencies</span>
                                </div>
                                <h3 className="text-lg md:text-xl font-light text-slate-900 mb-4">Client Success</h3>
                                <p className="text-slate-400 text-xs font-light leading-relaxed mb-8 md:mb-10 flex-grow">Whitelabel diagnostics to accelerate client approvals and revenue onset.</p>
                                <div className="learn-more-link flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-medium cursor-pointer">
                                    Learn More <span className="material-symbols-outlined text-xs ml-2 arrow-icon">east</span>
                                </div>
                            </div>
                            {/* API Integration Card */}
                            <div className="solution-card glass-card rounded-[28px] md:rounded-[35px] p-6 md:p-8 flex flex-col h-full cursor-default">
                                <div className="mb-6 md:mb-8">
                                    <span className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-semibold border-b border-slate-200 pb-2">For Developers</span>
                                </div>
                                <h3 className="text-lg md:text-xl font-light text-slate-900 mb-4">API Integration</h3>
                                <p className="text-slate-400 text-xs font-light leading-relaxed mb-8 md:mb-10 flex-grow">Programmatic readiness assessment integrated directly into the CMS workflow.</p>
                                <div className="learn-more-link flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-medium cursor-pointer">
                                    Learn More <span className="material-symbols-outlined text-xs ml-2 arrow-icon">east</span>
                                </div>
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

                {/* Fortune 500 Badge */}
                <section className="relative z-10 py-12 md:py-16 px-4 sm:px-6 flex justify-center">
                    <div className="max-w-4xl w-full">
                        <div className="ethereal-pill rounded-full py-3 px-6 md:px-8 flex items-center justify-center">
                            <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.5em] text-slate-500 font-light text-center">
                                Reliability Engineered for Fortune 500 Digital Assets
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="relative z-10 py-20 md:py-32 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-xl w-full text-center">
                        <h2 className="text-2xl md:text-3xl font-extralight text-slate-900 mb-8 md:mb-10 tracking-tight">Initiate Global Analysis</h2>
                        <div className="flex justify-center">
                            <div className="ethereal-pill rounded-full p-1.5 flex items-center w-full max-w-md">
                                <input
                                    className="bg-transparent border-none focus:ring-0 text-sm font-light text-slate-600 px-4 md:px-6 flex-grow placeholder:text-slate-300"
                                    placeholder="Enter domain for analysis..."
                                    type="text"
                                />
                                <button className="bg-slate-900 text-white text-[10px] uppercase tracking-widest px-6 md:px-8 py-3 rounded-full font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 whitespace-nowrap">
                                    Start Analysis
                                </button>
                            </div>
                        </div>
                        <p className="mt-6 md:mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-light">No authentication required for initial scan</p>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
