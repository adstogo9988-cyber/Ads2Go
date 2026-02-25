"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export function Hero() {
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleAnalyze = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setIsLoading(true);
        // Add https:// if not present
        let fullUrl = url;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            fullUrl = "https://" + url;
        }

        // Store URL in sessionStorage for scanning page
        sessionStorage.setItem("analysisUrl", fullUrl);

        // Redirect to scanning page
        router.push("/scanning");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 relative z-10">
            <div className="max-w-4xl w-full text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/30 backdrop-blur-md px-3 py-1 mb-12 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500/80">
                        Intelligence Engine V2.6
                    </span>
                </div>
                <h1 className="hero-title text-6xl md:text-[100px] font-extrabold text-slate-900 mb-10">
                    Pure Website<br />
                    <span className="text-slate-400/80 italic font-light">
                        Intelligence.
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-500/80 max-w-xl mx-auto leading-relaxed mb-16 font-light premium-letter-spacing">
                    Enterprise AI-driven AdSense readiness and semantic content analysis.
                    Designed for those who demand absolute clarity in monetization.
                </p>
                <div className="max-w-2xl mx-auto relative group">
                    <form onSubmit={handleAnalyze} className="machined-glass p-1.5 rounded-[28px] flex flex-col sm:flex-row gap-1.5">
                        <div className="flex-grow relative flex items-center">
                            <span className="material-symbols-outlined absolute left-6 text-slate-400 font-extralight">
                                public
                            </span>
                            <input
                                className="w-full bg-transparent border-none focus:ring-0 text-slate-800 pl-16 pr-4 py-5 text-base placeholder-slate-400/60 font-normal tracking-wide focus:outline-none"
                                placeholder="Enter domain for analysis..."
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inner-glow-button text-white font-semibold py-4 px-10 rounded-[22px] flex items-center justify-center gap-3 whitespace-nowrap disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="text-[14px] tracking-wider uppercase">
                                        Loading...
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-[14px] tracking-wider uppercase">
                                        Analyze
                                    </span>
                                    <span className="material-symbols-outlined text-[18px]">
                                        arrow_forward
                                    </span>
                                </>
                            )}
                        </button>
                    </form>
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:gap-8 opacity-40 grayscale hover:opacity-60 transition-opacity">
                        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-slate-900">
                            10,000+ Sites Analyzed
                        </span>
                        <span className="hidden md:block w-1 h-1 rounded-full bg-slate-400"></span>
                        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-slate-900">
                            98% Approval Accuracy
                        </span>
                        <span className="hidden md:block w-1 h-1 rounded-full bg-slate-400"></span>
                        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-slate-900">
                            Trusted by Pro Publishers
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
