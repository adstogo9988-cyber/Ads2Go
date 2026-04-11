"use strict";
import React from "react";

export function TrustCompliance() {
    return (
        <section className="relative z-10 py-20 md:py-24 px-4 sm:px-6 flex flex-col items-center justify-center">
            <div className="max-w-7xl w-full">
                {/* Header */}
                <div className="text-center mb-20 md:mb-32">
                    <span className="text-[11px] uppercase tracking-[0.5em] text-slate-400 font-semibold mb-6 block">
                        Monetization Guard
                    </span>
                    <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight text-slate-900 tracking-tight mb-6 md:mb-8">
                        Monetization Safety Architecture
                    </h2>
                    <p className="text-slate-500 max-w-2xl mx-auto font-light leading-relaxed text-base md:text-lg">
                        Engineered to meet strict AdSense program policies, ensuring your assets are audited against real-time regulatory standards and monetization best practices.
                    </p>
                </div>

                {/* Content Rows */}
                <div className="space-y-16 md:space-y-24 max-w-6xl mx-auto">
                    {/* Row 1 - Policy Alignment */}
                    <div className="content-row group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-start">
                        <div className="md:col-span-1">
                            <div className="glass-icon-container w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl md:text-2xl ethereal-icon">shield</span>
                            </div>
                        </div>
                        <div className="md:col-span-4">
                            <h3 className="text-xl md:text-2xl font-light text-slate-900 tracking-tight">Program Policy Sync</h3>
                            <div className="mt-3 md:mt-4 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40"></div>
                                <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-medium">Policy Matching Active</span>
                            </div>
                        </div>
                        <div className="md:col-span-7">
                            <p className="text-slate-500 font-light text-base md:text-[17px] leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                Real-time synchronization with AdSense program requirements. Our engine adaptively maps your content against shifting policy frameworks to ensure perpetual readiness.
                            </p>
                        </div>
                    </div>

                    {/* Row 2 - Privacy Integrity */}
                    <div className="content-row group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-start">
                        <div className="md:col-span-1">
                            <div className="glass-icon-container w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl md:text-2xl ethereal-icon">key</span>
                            </div>
                        </div>
                        <div className="md:col-span-4">
                            <h3 className="text-xl md:text-2xl font-light text-slate-900 tracking-tight">Privacy Integrity</h3>
                            <div className="mt-3 md:mt-4 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40"></div>
                                <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-medium">Zero-Retention Logic</span>
                            </div>
                        </div>
                        <div className="md:col-span-7">
                            <p className="text-slate-500 font-light text-base md:text-[17px] leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                Advanced zero-data-retention scanning protocols. We analyze structural data without persistence, maintaining a strict enterprise-grade barrier between intelligence and identity.
                            </p>
                        </div>
                    </div>

                    {/* Row 3 - System Reliability */}
                    <div className="content-row group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-start">
                        <div className="md:col-span-1">
                            <div className="glass-icon-container w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl md:text-2xl ethereal-icon">fact_check</span>
                            </div>
                        </div>
                        <div className="md:col-span-4">
                            <h3 className="text-xl md:text-2xl font-light text-slate-900 tracking-tight">Decision Accuracy</h3>
                            <div className="mt-3 md:mt-4 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40"></div>
                                <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-medium">99.9% Logic Reliability</span>
                            </div>
                        </div>
                        <div className="md:col-span-7">
                            <p className="text-slate-500 font-light text-base md:text-[17px] leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                A multi-layered neural cross-verification engine built for consistency. Every audit result is the result of repeatable validation to provide absolute monetization certainty.
                            </p>
                        </div>
                    </div>
                </div>


            </div>
        </section>
    );
}
