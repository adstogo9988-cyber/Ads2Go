"use client";
import React, { useEffect, useRef, useState } from "react";

export function DetectionLayers() {
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
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="relative z-10 py-20 md:py-24 px-4 sm:px-6 flex flex-col items-center justify-center">
            <div className="max-w-6xl w-full">
                <div className="text-center mb-16 md:mb-20">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-medium mb-4 block">
                        Signal Verification
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-extralight text-slate-900 tracking-tight mb-6 md:mb-8">
                        Intelligence Detection Layers
                    </h2>
                    <p className="text-slate-500 max-w-2xl mx-auto font-light leading-relaxed text-sm">
                        Deep-scanning modules that evaluate site integrity across four critical domains to ensure maximum monetization success.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Domain I - Structural Foundations */}
                    <div className="glass-panel rounded-[32px] md:rounded-[48px] p-8 md:p-12 flex flex-col h-full transition-all duration-700 group">
                        <div className="flex items-center justify-between mb-8 md:mb-12">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60"></div>
                                <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-medium">Domain I</span>
                            </div>
                            <div className="flex gap-[2px] items-end">
                                <div className="indicator-bar w-[3px] h-3 bg-slate-300/40 rounded-full transition-colors duration-300"></div>
                                <div className="indicator-bar w-[3px] h-5 bg-slate-400/40 rounded-full transition-colors duration-300"></div>
                                <div className="indicator-bar w-[3px] h-2 bg-slate-300/40 rounded-full transition-colors duration-300"></div>
                            </div>
                        </div>
                        <h3 className="text-xl md:text-2xl font-light text-slate-900 mb-4 md:mb-5 tracking-tight">Structural Foundations</h3>
                        <p className="text-slate-500 font-light text-[13px] leading-relaxed mb-8 md:mb-12 flex-grow">
                            A deep technical audit of indexing protocols, crawl budget efficiency, and site architecture robustness.
                        </p>
                        <div className="space-y-6 md:space-y-8">
                            <div className="space-y-3">
                                <div className="flex justify-between text-[9px] uppercase tracking-widest text-slate-400">
                                    <span>Crawlability</span>
                                    <span>Active</span>
                                </div>
                                <div className="micro-bar">
                                    <div
                                        className={`micro-bar-fill-animated ${isVisible ? 'animate' : ''}`}
                                        style={{ '--target-width': '88%' } as React.CSSProperties}
                                    ></div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 md:gap-3 pt-2 md:pt-4">
                                <span className="tag-pill">Sitemap.xml</span>
                                <span className="tag-pill">Robots.txt</span>
                                <span className="tag-pill">Hierarchy</span>
                            </div>
                        </div>
                    </div>

                    {/* Domain II - Semantic Intelligence */}
                    <div className="glass-panel rounded-[32px] md:rounded-[48px] p-8 md:p-12 flex flex-col h-full transition-all duration-700 group">
                        <div className="flex items-center justify-between mb-8 md:mb-12">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60"></div>
                                <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-medium">Domain II</span>
                            </div>
                            <div className="flex gap-[2px] items-end">
                                <div className="indicator-bar w-[3px] h-2 bg-slate-300/40 rounded-full transition-colors duration-300"></div>
                                <div className="indicator-bar w-[3px] h-3 bg-slate-300/40 rounded-full transition-colors duration-300"></div>
                                <div className="indicator-bar w-[3px] h-4 bg-slate-400/40 rounded-full transition-colors duration-300"></div>
                            </div>
                        </div>
                        <h3 className="text-xl md:text-2xl font-light text-slate-900 mb-4 md:mb-5 tracking-tight">Semantic Intelligence</h3>
                        <p className="text-slate-500 font-light text-[13px] leading-relaxed mb-8 md:mb-12 flex-grow">
                            Evaluating content quality, thematic consistency, and original value proposition through NLP analysis.
                        </p>
                        <div className="space-y-6 md:space-y-8">
                            <div className="space-y-3">
                                <div className="flex justify-between text-[9px] uppercase tracking-widest text-slate-400">
                                    <span>NLP Quality Score</span>
                                    <span>Optimal</span>
                                </div>
                                <div className="micro-bar">
                                    <div
                                        className={`micro-bar-fill-animated ${isVisible ? 'animate' : ''}`}
                                        style={{ '--target-width': '94%' } as React.CSSProperties}
                                    ></div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 md:gap-3 pt-2 md:pt-4">
                                <span className="tag-pill">Uniqueness</span>
                                <span className="tag-pill">Topic Depth</span>
                                <span className="tag-pill">E-E-A-T</span>
                            </div>
                        </div>
                    </div>

                    {/* Domain III - Compliance & Policy */}
                    <div className="glass-panel rounded-[32px] md:rounded-[48px] p-8 md:p-12 flex flex-col h-full transition-all duration-700 group">
                        <div className="flex items-center justify-between mb-8 md:mb-12">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60"></div>
                                <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-medium">Domain III</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="indicator-dot w-1.5 h-1.5 rounded-full bg-slate-300/40 transition-colors duration-300"></div>
                                <div className="indicator-dot w-1.5 h-1.5 rounded-full bg-slate-300/40 transition-colors duration-300"></div>
                                <div className="indicator-dot w-1.5 h-1.5 rounded-full border border-slate-300/40 transition-colors duration-300"></div>
                            </div>
                        </div>
                        <h3 className="text-xl md:text-2xl font-light text-slate-900 mb-4 md:mb-5 tracking-tight">Compliance & Policy</h3>
                        <p className="text-slate-500 font-light text-[13px] leading-relaxed mb-8 md:mb-12 flex-grow">
                            Scanning for AdSense policy alignment, legal trust signals, and brand safety compliance protocols.
                        </p>
                        <div className="space-y-6 md:space-y-8">
                            <div className="space-y-3">
                                <div className="flex justify-between text-[9px] uppercase tracking-widest text-slate-400">
                                    <span>Policy Matching</span>
                                    <span>Verified</span>
                                </div>
                                <div className="micro-bar">
                                    <div
                                        className={`micro-bar-fill-animated ${isVisible ? 'animate' : ''}`}
                                        style={{ '--target-width': '100%' } as React.CSSProperties}
                                    ></div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 md:gap-3 pt-2 md:pt-4">
                                <span className="tag-pill">Privacy Policy</span>
                                <span className="tag-pill">TOS</span>
                                <span className="tag-pill">GDPR</span>
                            </div>
                        </div>
                    </div>

                    {/* Domain IV - Performance Integrity */}
                    <div className="glass-panel rounded-[32px] md:rounded-[48px] p-8 md:p-12 flex flex-col h-full transition-all duration-700 group">
                        <div className="flex items-center justify-between mb-8 md:mb-12">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60"></div>
                                <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-medium">Domain IV</span>
                            </div>
                            <div className="flex items-end h-4 gap-[2px]">
                                <div className="indicator-bar w-[3px] h-2 bg-slate-300/40 rounded-full transition-colors duration-300"></div>
                                <div className="indicator-bar w-[3px] h-3 bg-slate-300/40 rounded-full transition-colors duration-300"></div>
                                <div className="indicator-bar w-[3px] h-5 bg-slate-400/40 rounded-full transition-colors duration-300"></div>
                            </div>
                        </div>
                        <h3 className="text-xl md:text-2xl font-light text-slate-900 mb-4 md:mb-5 tracking-tight">Performance Integrity</h3>
                        <p className="text-slate-500 font-light text-[13px] leading-relaxed mb-8 md:mb-12 flex-grow">
                            Measuring user experience stability, core web vitals, and mobile responsiveness for ad-delivery readiness.
                        </p>
                        <div className="space-y-6 md:space-y-8">
                            <div className="space-y-3">
                                <div className="flex justify-between text-[9px] uppercase tracking-widest text-slate-400">
                                    <span>UX Stability</span>
                                    <span>92% Readied</span>
                                </div>
                                <div className="micro-bar">
                                    <div
                                        className={`micro-bar-fill-animated ${isVisible ? 'animate' : ''}`}
                                        style={{ '--target-width': '92%' } as React.CSSProperties}
                                    ></div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 md:gap-3 pt-2 md:pt-4">
                                <span className="tag-pill">CLS</span>
                                <span className="tag-pill">LCP</span>
                                <span className="tag-pill">FID</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
