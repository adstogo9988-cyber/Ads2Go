"use client";
import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Hero Section */}
                <section className="relative z-10 pt-32 md:pt-40 pb-12 md:pb-20 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-4xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-medium mb-6 block">Our Story</span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extralight text-slate-900 tracking-tighter mb-8 leading-tight">About Ad2Go</h1>
                        <p className="text-slate-500 text-base md:text-lg lg:text-xl font-light leading-relaxed max-w-2xl mx-auto">
                            Building the future of website intelligence, one analysis at a time.
                        </p>
                    </div>
                </section>

                {/* Story Section */}
                <section className="relative z-10 py-16 md:py-24 px-4 sm:px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="liquid-glass-card rounded-[32px] p-10 md:p-16">
                            <div className="relative z-10 max-w-3xl">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-full liquid-glass-icon flex items-center justify-center">
                                        <span className="material-symbols-outlined text-slate-500">auto_stories</span>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-medium">The Beginning</span>
                                </div>
                                <p className="text-xl md:text-2xl lg:text-3xl font-extralight text-slate-800 leading-relaxed mb-8">
                                    We started with a simple question: Why do so many quality websites get rejected by ad networks?
                                </p>
                                <p className="text-slate-500 text-base md:text-lg font-light leading-relaxed">
                                    After years of working with publishers, we realized that most rejections were due to fixable issues — technical problems, missing pages, or content that just needed minor adjustments. The information was there, but scattered across complex documentation. So we built Ad2Go to give publishers the clarity they deserve.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="relative z-10 py-16 md:py-24 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12 md:mb-16">
                            <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-medium mb-4 block">What Drives Us</span>
                            <h2 className="text-3xl md:text-4xl font-extralight text-slate-900 tracking-tighter">Our Values</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            <div className="liquid-glass-card rounded-[28px] p-8 md:p-10">
                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-2xl liquid-glass-icon flex items-center justify-center mb-6">
                                        <span className="material-symbols-outlined text-slate-500 text-xl">visibility</span>
                                    </div>
                                    <h3 className="text-lg md:text-xl font-light text-slate-800 mb-3 tracking-tight">Transparency</h3>
                                    <p className="text-slate-500 text-sm font-light leading-relaxed">
                                        No black boxes. We show you exactly how we analyze your site and why we reach our conclusions.
                                    </p>
                                </div>
                            </div>

                            <div className="liquid-glass-card rounded-[28px] p-8 md:p-10">
                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-2xl liquid-glass-icon flex items-center justify-center mb-6">
                                        <span className="material-symbols-outlined text-slate-500 text-xl">speed</span>
                                    </div>
                                    <h3 className="text-lg md:text-xl font-light text-slate-800 mb-3 tracking-tight">Precision</h3>
                                    <p className="text-slate-500 text-sm font-light leading-relaxed">
                                        Every recommendation is backed by real data. We analyze millions of signals to give you accurate insights.
                                    </p>
                                </div>
                            </div>

                            <div className="liquid-glass-card rounded-[28px] p-8 md:p-10">
                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-2xl liquid-glass-icon flex items-center justify-center mb-6">
                                        <span className="material-symbols-outlined text-slate-500 text-xl">lock</span>
                                    </div>
                                    <h3 className="text-lg md:text-xl font-light text-slate-800 mb-3 tracking-tight">Privacy First</h3>
                                    <p className="text-slate-500 text-sm font-light leading-relaxed">
                                        Your data stays yours. We analyze patterns, not personal information. Everything is encrypted.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
            <Footer />
        </>
    );
}
