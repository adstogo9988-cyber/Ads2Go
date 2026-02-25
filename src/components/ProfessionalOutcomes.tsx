"use strict";
import React from "react";

export function ProfessionalOutcomes() {
    return (
        <section className="relative z-10 py-20 md:py-32 px-4 sm:px-6 flex flex-col items-center justify-center">
            <div className="max-w-7xl w-full">
                {/* Header */}
                <div className="text-center mb-16 md:mb-24">
                    <span className="text-[11px] uppercase tracking-[0.5em] text-slate-400 font-semibold mb-6 block">
                        Strategic Impact
                    </span>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-extralight text-slate-900 tracking-tight mb-6">
                        Professional Outcomes & Insights
                    </h2>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-auto"></div>
                </div>

                {/* Testimonial Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 xl:gap-12 max-w-7xl mx-auto">
                    {/* Card 1 - AdSense Approval */}
                    <div className="testimonial-card rounded-[24px] md:rounded-[32px] p-6 md:p-10 flex flex-col justify-between h-full">
                        <div>
                            <div className="mb-8 md:mb-10 flex items-center gap-3 md:gap-4">
                                <div className="avatar-container w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center overflow-hidden">
                                    <span className="material-symbols-outlined text-lg md:text-[20px] text-slate-400 font-extralight">person</span>
                                </div>
                                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-slate-400 font-medium">Outcome verified</span>
                            </div>
                            <h3 className="text-lg md:text-xl font-light text-slate-900 mb-4 md:mb-6 tracking-tight">AdSense Approval Achieved</h3>
                            <p className="text-slate-500 font-light text-base md:text-[17px] leading-relaxed italic opacity-90">
                                "The precision of the semantic analysis allowed us to identify the exact policy gaps we missed for months."
                            </p>
                        </div>
                        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-900/5">
                            <p className="text-slate-800 text-[12px] md:text-[13px] font-semibold tracking-wide">— Agency Director</p>
                            <p className="text-slate-400 text-[10px] md:text-[11px] uppercase tracking-widest mt-1">Growth & Compliance</p>
                        </div>
                    </div>

                    {/* Card 2 - Policy Alignment */}
                    <div className="testimonial-card rounded-[24px] md:rounded-[32px] p-6 md:p-10 flex flex-col justify-between h-full">
                        <div>
                            <div className="mb-8 md:mb-10 flex items-center gap-3 md:gap-4">
                                <div className="avatar-container w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center overflow-hidden">
                                    <span className="material-symbols-outlined text-lg md:text-[20px] text-slate-400 font-extralight">architecture</span>
                                </div>
                                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-slate-400 font-medium">Technical Clarity</span>
                            </div>
                            <h3 className="text-lg md:text-xl font-light text-slate-900 mb-4 md:mb-6 tracking-tight">Policy Alignment Secured</h3>
                            <p className="text-slate-500 font-light text-base md:text-[17px] leading-relaxed italic opacity-90">
                                "Ad2Go provides a level of architectural clarity that is simply not available in any other enterprise tool."
                            </p>
                        </div>
                        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-900/5">
                            <p className="text-slate-800 text-[12px] md:text-[13px] font-semibold tracking-wide">— Lead Web Architect</p>
                            <p className="text-slate-400 text-[10px] md:text-[11px] uppercase tracking-widest mt-1">Enterprise Infrastructure</p>
                        </div>
                    </div>

                    {/* Card 3 - Monetization Readiness */}
                    <div className="testimonial-card rounded-[24px] md:rounded-[32px] p-6 md:p-10 flex flex-col justify-between h-full">
                        <div>
                            <div className="mb-8 md:mb-10 flex items-center gap-3 md:gap-4">
                                <div className="avatar-container w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center overflow-hidden">
                                    <span className="material-symbols-outlined text-lg md:text-[20px] text-slate-400 font-extralight">bolt</span>
                                </div>
                                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-slate-400 font-medium">Market Readiness</span>
                            </div>
                            <h3 className="text-lg md:text-xl font-light text-slate-900 mb-4 md:mb-6 tracking-tight">Monetization Readiness</h3>
                            <p className="text-slate-500 font-light text-base md:text-[17px] leading-relaxed italic opacity-90">
                                "A silent, intelligent system that removed the guesswork from our site launch strategy."
                            </p>
                        </div>
                        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-900/5">
                            <p className="text-slate-800 text-[12px] md:text-[13px] font-semibold tracking-wide">— Digital Publisher</p>
                            <p className="text-slate-400 text-[10px] md:text-[11px] uppercase tracking-widest mt-1">Global Media Network</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 md:mt-24 text-center">
                    <p className="text-slate-400 text-[10px] md:text-[11px] font-medium tracking-[0.4em] uppercase">Verified Enterprise Partner Network</p>
                </div>
            </div>
        </section>
    );
}
