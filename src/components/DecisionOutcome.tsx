"use client";
import React, { useEffect, useRef, useState } from "react";

export function DecisionOutcome() {
    const sectionRef = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                    }
                });
            },
            { threshold: 0.3 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="relative z-10 py-20 md:py-32 px-4 sm:px-6 flex flex-col items-center justify-center">
            <div className="max-w-6xl w-full">
                <div className="text-center mb-16 md:mb-24">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-medium mb-4 block">
                        Final Assessment
                    </span>
                    <h2 className="text-4xl md:text-5xl font-extralight text-slate-900 tracking-tight mb-6">
                        Intelligence Decision Outcome
                    </h2>
                    <p className="text-slate-500 max-w-xl mx-auto font-light leading-relaxed text-sm md:text-base">
                        The definitive synchronization of all detection layers into a singular readiness verdict.
                    </p>
                </div>

                <div className="decision-panel rounded-[40px] md:rounded-[60px] p-6 sm:p-8 md:p-16 lg:p-20 relative overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
                        {/* Radial Progress */}
                        <div className="flex flex-col items-center justify-center">
                            <div className="radial-progress-container w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80">
                                <svg className="radial-progress-svg w-full h-full" viewBox="0 0 200 200">
                                    <circle className="radial-bg" cx="100" cy="100" fill="transparent" r="90" strokeWidth="6"></circle>
                                    <circle
                                        className={`radial-indicator ${isVisible ? 'animate' : ''}`}
                                        cx="100"
                                        cy="100"
                                        fill="transparent"
                                        r="90"
                                        strokeLinecap="round"
                                        strokeWidth="8"
                                    ></circle>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-5xl md:text-6xl lg:text-7xl font-extralight text-slate-900 tracking-tighter">94%</span>
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-medium mt-2">Readiness Score</span>
                                </div>
                            </div>
                            <div className="mt-8 md:mt-12 text-center max-w-sm">
                                <p className="text-slate-500 font-light text-sm leading-relaxed">
                                    Decision based on the weighted aggregation of structural, semantic, policy, and performance data points.
                                </p>
                            </div>
                        </div>

                        {/* Assessment States */}
                        <div className="flex flex-col space-y-4 relative">
                            <h4 className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-medium mb-4">Assessment States</h4>

                            {/* Decorative Infinity Icon */}
                            <div className="absolute top-0 right-0 opacity-[0.15] pointer-events-none z-0">
                                <span className="material-symbols-outlined text-[200px] md:text-[280px] lg:text-[320px] text-slate-400" style={{ fontVariationSettings: "'wght' 200" }}>all_inclusive</span>
                            </div>

                            {/* Ready State */}
                            <div className="state-card glass-node rounded-2xl md:rounded-3xl p-4 md:p-6 flex items-center justify-between border-emerald-100/30 bg-white/40 ring-1 ring-emerald-500/10 cursor-pointer">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-50 flex items-center justify-center shadow-inner">
                                        <span className="material-symbols-outlined text-emerald-500 text-lg md:text-xl font-light">verified</span>
                                    </div>
                                    <div>
                                        <span className="block text-slate-900 font-medium text-sm">Ready</span>
                                        <span className="block text-[9px] md:text-[10px] text-slate-400 font-light uppercase tracking-wider">Asset meets all critical thresholds</span>
                                    </div>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"></div>
                            </div>

                            {/* Fix Required State */}
                            <div className="state-card glass-node rounded-2xl md:rounded-3xl p-4 md:p-6 flex items-center justify-between opacity-60 cursor-pointer">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-50 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-amber-500 text-lg md:text-xl font-light">error</span>
                                    </div>
                                    <div>
                                        <span className="block text-slate-700 font-medium text-sm">Fix Required</span>
                                        <span className="block text-[9px] md:text-[10px] text-slate-400 font-light uppercase tracking-wider">Minor optimizations detected</span>
                                    </div>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-amber-200"></div>
                            </div>

                            {/* Not Ready State */}
                            <div className="state-card glass-node rounded-2xl md:rounded-3xl p-4 md:p-6 flex items-center justify-between opacity-40 cursor-pointer">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-rose-50 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-rose-500 text-lg md:text-xl font-light">dangerous</span>
                                    </div>
                                    <div>
                                        <span className="block text-slate-700 font-medium text-sm">Not Ready</span>
                                        <span className="block text-[9px] md:text-[10px] text-slate-400 font-light uppercase tracking-wider">Critical policy misalignment</span>
                                    </div>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-rose-200"></div>
                            </div>

                            {/* Footer */}
                            <div className="pt-6 md:pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <span className="text-[10px] uppercase tracking-widest text-slate-400">Live Calibration Active</span>
                                </div>
                                <button className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold border-b border-slate-300 pb-0.5 hover:text-slate-900 transition-colors">
                                    Detailed Report
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Powered By */}
                <div className="mt-16 md:mt-20 text-center">
                    <p className="text-slate-400 text-xs font-light tracking-[0.2em] uppercase">Powered by Neural Processing Unit v4.0</p>
                </div>
            </div>
        </section>
    );
}
