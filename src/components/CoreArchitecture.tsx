"use strict";
import React from "react";

export function CoreArchitecture() {
    return (
        <section className="relative z-10 py-20 md:py-32 px-4 sm:px-6 flex flex-col items-center justify-center">
            <div className="max-w-6xl w-full">
                <div className="text-center mb-16 md:mb-20">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-medium mb-4 block">
                        Engine Architecture
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight text-slate-900 tracking-tight mb-6">
                        Core Intelligence Architecture
                    </h2>
                    <p className="text-slate-500 max-w-xl mx-auto font-light leading-relaxed text-sm md:text-base">
                        A silent, high-precision processing sequence designed to map digital assets against global monetization standards.
                    </p>
                </div>

                <div className="core-processor-card rounded-[40px] md:rounded-[60px] p-6 sm:p-8 md:p-16 lg:p-20 relative overflow-hidden">
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center justify-between relative">
                        <div className="flex-1 flex flex-col items-center text-center px-4 z-20">
                            <div className="glass-node w-14 h-14 rounded-full flex items-center justify-center mb-8">
                                <span className="material-symbols-outlined text-slate-400 font-light">distance</span>
                            </div>
                            <h3 className="text-lg font-normal text-slate-800 step-title mb-2">Deep Structural Audit</h3>
                            <p className="text-xs text-slate-400 font-light leading-relaxed uppercase tracking-wider">Scanning site architecture</p>
                        </div>

                        <div className="flex-[0.5] flex items-center justify-center relative px-2">
                            <div className="ethereal-line"></div>
                            <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-200 blur-[1px]"></div>
                        </div>

                        <div className="flex-1 flex flex-col items-center text-center px-4 z-20">
                            <div className="glass-node w-16 h-16 rounded-full flex items-center justify-center mb-8 border-slate-200/50">
                                <span className="material-symbols-outlined text-slate-500 font-light text-3xl">shield_with_heart</span>
                            </div>
                            <h3 className="text-xl font-medium text-slate-900 step-title mb-2">Monetization Policy Alignment</h3>
                            <p className="text-xs text-slate-400 font-light leading-relaxed uppercase tracking-wider">Mapping against AdSense rules</p>
                        </div>

                        <div className="flex-[0.5] flex items-center justify-center relative px-2">
                            <div className="ethereal-line"></div>
                            <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-200 blur-[1px]"></div>
                        </div>

                        <div className="flex-1 flex flex-col items-center text-center px-4 z-20">
                            <div className="glass-node w-14 h-14 rounded-full flex items-center justify-center mb-8">
                                <span className="material-symbols-outlined text-slate-400 font-light">auto_awesome</span>
                            </div>
                            <h3 className="text-lg font-normal text-slate-800 step-title mb-2">Readiness Intelligence Output</h3>
                            <p className="text-xs text-slate-400 font-light leading-relaxed uppercase tracking-wider">Generating final decision</p>
                        </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="md:hidden flex flex-col items-center space-y-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="glass-node w-14 h-14 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-slate-400 font-light">distance</span>
                            </div>
                            <h3 className="text-lg font-medium text-slate-800 mb-1">Deep Structural Audit</h3>
                            <p className="text-xs text-slate-400 tracking-widest uppercase">Scanning</p>
                        </div>

                        <div className="h-10 relative flex items-center justify-center">
                            <div className="ethereal-line-vertical"></div>
                            <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="glass-node w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-slate-500 font-light text-2xl">shield_with_heart</span>
                            </div>
                            <h3 className="text-lg font-medium text-slate-800 mb-1">Policy Alignment</h3>
                            <p className="text-xs text-slate-400 tracking-widest uppercase">Mapping Rules</p>
                        </div>

                        <div className="h-10 relative flex items-center justify-center">
                            <div className="ethereal-line-vertical"></div>
                            <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="glass-node w-14 h-14 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-slate-400 font-light">auto_awesome</span>
                            </div>
                            <h3 className="text-lg font-medium text-slate-800 mb-1">Readiness Output</h3>
                            <p className="text-xs text-slate-400 tracking-widest uppercase">Intelligence</p>
                        </div>
                    </div>

                    {/* Decorative grain elements */}
                    <div className="absolute top-0 right-0 p-6 md:p-10 opacity-10">
                        <span className="material-symbols-outlined text-6xl md:text-8xl font-thin">grain</span>
                    </div>
                    <div className="absolute bottom-0 left-0 p-6 md:p-10 opacity-10 scale-x-[-1]">
                        <span className="material-symbols-outlined text-6xl md:text-8xl font-thin">grain</span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="mt-16 md:mt-20 flex flex-wrap justify-center gap-8 md:gap-16 lg:gap-24 opacity-60">
                    <div className="flex flex-col items-center">
                        <span className="text-xl md:text-2xl font-light text-slate-900 tracking-tighter">0.02s</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-1">Latency</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xl md:text-2xl font-light text-slate-900 tracking-tighter">100%</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-1">Consistency</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xl md:text-2xl font-light text-slate-900 tracking-tighter">AI-Deep</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-1">Logic Level</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
