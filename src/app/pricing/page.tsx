"use client";
import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PricingPage() {
    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Hero Section */}
                <section className="relative z-10 pt-32 md:pt-40 pb-12 md:pb-20 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-4xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-medium mb-6 block">Access Architecture</span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extralight text-slate-900 tracking-tighter mb-8 leading-tight">Intelligence Plans</h1>
                        <p className="text-slate-500 text-base md:text-lg lg:text-xl font-light leading-relaxed max-w-2xl mx-auto">
                            Fair, precise access to decision-grade website intelligence.
                        </p>
                    </div>
                </section>

                {/* Pricing Cards Section */}
                <section className="relative z-10 pb-20 md:pb-32 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Main Pricing Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                            {/* Free Plan - Liquid Glass */}
                            <div className="liquid-glass-card group relative rounded-[32px] p-8 flex flex-col">
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="mb-8">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 liquid-glass-pill rounded-full mb-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400/80"></div>
                                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Free</span>
                                        </div>
                                        <h3 className="text-2xl font-light text-slate-800 tracking-tight">Exploration</h3>
                                    </div>

                                    <div className="mb-8 pb-8 border-b border-white/40">
                                        <div className="flex items-end gap-1">
                                            <span className="text-5xl font-extralight text-slate-800">$0</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">No credit card required</p>
                                    </div>

                                    <ul className="space-y-4 flex-grow">
                                        <li className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full liquid-glass-icon flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-500 text-sm">check</span>
                                            </div>
                                            <span className="text-sm text-slate-600">3 scans per month</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full liquid-glass-icon flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-500 text-sm">check</span>
                                            </div>
                                            <span className="text-sm text-slate-600">1 scan every 10 days</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full liquid-glass-icon flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-500 text-sm">check</span>
                                            </div>
                                            <span className="text-sm text-slate-600">Entry testing plan</span>
                                        </li>
                                    </ul>

                                    <button className="mt-8 w-full py-4 rounded-2xl liquid-glass-button-muted text-xs uppercase tracking-widest font-medium text-slate-500 cursor-default">
                                        Current Plan
                                    </button>
                                </div>
                            </div>

                            {/* Weekly Plan - Liquid Glass */}
                            <div className="liquid-glass-card group relative rounded-[32px] p-8 flex flex-col">
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="mb-8 pt-2">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 liquid-glass-pill rounded-full mb-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Weekly</span>
                                        </div>
                                        <h3 className="text-2xl font-light text-slate-800 tracking-tight">Starter</h3>
                                    </div>

                                    <div className="mb-8 pb-8 border-b border-white/40">
                                        <div className="flex items-end gap-1">
                                            <span className="text-5xl font-extralight text-slate-800">$9</span>
                                            <span className="text-lg text-slate-400 mb-1">.99</span>
                                            <span className="text-sm text-slate-400 ml-2 mb-1">/ week</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-slate-400 line-through">$15.00</span>
                                            <span className="text-[10px] uppercase px-2 py-0.5 bg-slate-200 text-slate-500 rounded-full font-medium">33% off</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 flex-grow">
                                        <li className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full liquid-glass-icon flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-500 text-sm">check</span>
                                            </div>
                                            <span className="text-sm text-slate-600">5 scans per billing cycle</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full liquid-glass-icon flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-500 text-sm">check</span>
                                            </div>
                                            <span className="text-sm text-slate-600">No daily restriction</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full liquid-glass-icon flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-500 text-sm">check</span>
                                            </div>
                                            <span className="text-sm text-slate-600">Deep content analysis</span>
                                        </li>
                                    </ul>

                                    <a href={process.env.NEXT_PUBLIC_STRIPE_WEEKLY_LINK || "#"} className="mt-8 block w-full py-4 text-center rounded-2xl liquid-glass-button text-xs uppercase tracking-widest font-bold text-slate-700 hover:bg-white/90 transition-all">
                                        Subscribe Weekly
                                    </a>
                                </div>
                            </div>

                            {/* Monthly Plan - Featured Dark Liquid Glass */}
                            <div className="liquid-glass-card-dark group relative rounded-[32px] p-8 flex flex-col">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <div className="px-4 py-1.5 liquid-glass-badge rounded-full">
                                        <span className="text-[10px] uppercase tracking-widest text-white/90 font-bold">Most Popular</span>
                                    </div>
                                </div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="mb-8 pt-2">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full mb-4 border border-white/10">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"></div>
                                            <span className="text-[10px] uppercase tracking-widest text-white/70 font-medium">Monthly</span>
                                        </div>
                                        <h3 className="text-2xl font-light text-white tracking-tight">Professional</h3>
                                    </div>

                                    <div className="mb-8 pb-8 border-b border-white/10">
                                        <div className="flex items-end gap-1">
                                            <span className="text-5xl font-extralight text-white">$19</span>
                                            <span className="text-lg text-white/40 mb-1">.99</span>
                                            <span className="text-sm text-white/40 ml-2 mb-1">/ month</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-white/30 line-through">$49.00</span>
                                            <span className="text-[10px] uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-medium border border-emerald-500/20">60% off</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 flex-grow">
                                        <li className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                                                <span className="material-symbols-outlined text-white/80 text-sm">check</span>
                                            </div>
                                            <span className="text-sm text-white/70">30 scans per billing cycle</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                                                <span className="material-symbols-outlined text-white/80 text-sm">check</span>
                                            </div>
                                            <span className="text-sm text-white/70">No daily restriction</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                                                <span className="material-symbols-outlined text-white/80 text-sm">check</span>
                                            </div>
                                            <span className="text-sm text-white/70">Priority processing</span>
                                        </li>
                                    </ul>

                                    <a href={process.env.NEXT_PUBLIC_STRIPE_MONTHLY_LINK || "#"} className="mt-8 block text-center w-full py-4 rounded-2xl liquid-glass-button-light text-xs uppercase tracking-widest font-bold text-slate-900 hover:bg-white transition-all">
                                        Subscribe Monthly
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Lifetime Deal Banner - Liquid Glass */}
                        <div className="mt-12 relative overflow-hidden">
                            <div className="liquid-glass-banner rounded-[32px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-4 py-1.5 liquid-glass-badge-dark rounded-full text-[10px] uppercase tracking-widest text-white font-bold">Limited Time</span>
                                        <span className="px-4 py-1.5 liquid-glass-badge-dark bg-amber-500/20 text-amber-400 border-amber-500/30 rounded-full text-[10px] uppercase tracking-widest font-bold">Limited</span>
                                        <span className="text-[10px] uppercase tracking-widest text-slate-400">Only 47 left</span>
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-light text-slate-800 mb-2">Lifetime Access</h3>
                                    <p className="text-slate-500 text-sm font-light">One-time payment, unlimited forever with fair usage. All future updates included.</p>
                                </div>
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="text-center md:text-right">
                                        <div className="flex items-end gap-1">
                                            <span className="text-4xl md:text-5xl font-extralight text-slate-800">$299</span>
                                        </div>
                                        <span className="text-sm text-slate-400 line-through">was $999</span>
                                    </div>
                                    <a href={process.env.NEXT_PUBLIC_STRIPE_LIFETIME_LINK || "#"} className="px-8 py-4 text-center liquid-glass-button-primary rounded-2xl text-xs uppercase tracking-widest font-bold text-white whitespace-nowrap">
                                        Claim Now
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust Indicators - Liquid Glass */}
                <section className="relative z-10 py-12 md:py-16 px-4 sm:px-6 flex justify-center">
                    <div className="max-w-4xl w-full">
                        <div className="liquid-glass-trust rounded-full py-5 px-8 flex flex-wrap items-center justify-center gap-8 md:gap-12">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400 text-lg">verified_user</span>
                                <span className="text-xs text-slate-500 font-medium">SSL Secured</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400 text-lg">history</span>
                                <span className="text-xs text-slate-500 font-medium">Cancel Anytime</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400 text-lg">support_agent</span>
                                <span className="text-xs text-slate-500 font-medium">24/7 Support</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400 text-lg">money_off</span>
                                <span className="text-xs text-slate-500 font-medium">Money Back Guarantee</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
