"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GlobalAnalysisCTA } from "@/components/GlobalAnalysisCTA";

import { supabase } from "@/lib/supabase";

export default function AnalysisPage() {
    const [url, setUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        setIsAnalyzing(true);
        setError(null);

        try {
            // 1. Get current user (optional for first scan, but required for recording)
            const { data: { user } } = await supabase.auth.getUser();

            let userId = null;
            let userPlan = "free";

            if (user) {
                userId = user.id;
                userPlan = user.user_metadata?.plan || "free";
            }

            let domain = url.replace(/^https?:\/\//, "").split("/")[0];

            // Setup Secure Backend API request since frontend isn't allowed to insert directly
            const response = await fetch('/api/scans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url,
                    domain,
                    userId,
                    userPlan
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initialize scan from server');
            }

            // Extract the generated scan info
            const scan = { id: data.scanId };


            // 5. Store in session & redirect
            sessionStorage.setItem("currentScanId", scan.id);
            sessionStorage.setItem("analysisUrl", url);

            router.push("/scanning");
        } catch (err: any) {
            console.error("Scan initialization error:", err);
            setError(err.message || "Failed to start analysis");
            setIsAnalyzing(false);
        }
    };

    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Hero Section */}
                <section className="relative z-10 pt-24 md:pt-40 pb-8 md:pb-12 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-4xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-medium mb-6 block">Neural Analysis Engine</span>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extralight text-slate-900 tracking-tighter mb-6 leading-tight">
                            AdSense Analyzer &<br/>Professional Audit
                        </h1>
                        <p className="text-slate-500 text-sm md:text-lg font-light leading-relaxed max-w-2xl mx-auto mb-12">
                            The industry-leading AdSense Checker. Our AI engine scans 2M+ data points to determine your monetization readiness in under 30 seconds.
                        </p>
                    </div>
                </section>

                {/* URL Input Section */}
                <section className="relative z-10 pb-16 md:pb-24 px-4 sm:px-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="liquid-glass-card rounded-[32px] p-8 md:p-12">
                            <div className="relative z-10">
                                <form onSubmit={handleAnalyze} className="space-y-6">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-3 block">Website URL</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                                <span className="material-symbols-outlined text-slate-300">language</span>
                                            </div>
                                            <input
                                                type="url"
                                                value={url}
                                                onChange={(e) => setUrl(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/60 border border-white/80 focus:border-slate-300 focus:outline-none text-slate-800 text-base font-light placeholder:text-slate-300 transition-colors"
                                                placeholder="https://example.com"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isAnalyzing}
                                        className="w-full py-4 liquid-glass-button-primary rounded-2xl text-xs uppercase tracking-widest font-bold text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                                Start Neural Analysis
                                            </>
                                        )}
                                    </button>
                                    {error && (
                                        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-left">
                                            <span className="material-symbols-outlined text-red-500 mt-0.5 text-base">error</span>
                                            <p className="text-red-600 text-sm font-light leading-relaxed">{error}</p>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What We Analyze Section */}
                <section className="relative z-10 py-16 md:py-24 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12 md:mb-16">
                            <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-medium mb-4 block">Deep Intelligence</span>
                            <h2 className="text-2xl md:text-4xl font-extralight text-slate-900 tracking-tighter">What We Analyze</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Technical SEO */}
                            <div className="liquid-glass-card rounded-[28px] p-8">
                                <div className="relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 mb-6">
                                        <img width="24" height="24" src="https://img.icons8.com/plumpy/24/bullish.png" alt="bullish"/>
                                    </div>
                                    <h3 className="text-lg font-light text-slate-800 mb-3 tracking-tight">Technical SEO</h3>
                                    <ul className="space-y-2">
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Sitemap & Crawlability
                                        </li>
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Structural Readiness
                                        </li>
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Mobile-First Health
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Content Intelligence */}
                            <div className="liquid-glass-card rounded-[28px] p-8">
                                <div className="relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 mb-6">
                                        <img width="24" height="24" src="https://img.icons8.com/material-two-tone/24/ai-generated-code--v2.png" alt="ai-generated-code--v2"/>
                                    </div>
                                    <h3 className="text-lg font-light text-slate-800 mb-3 tracking-tight">Content Intelligence</h3>
                                    <ul className="space-y-2">
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Semantic Depth Score
                                        </li>
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Keyword Alignment
                                        </li>
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            AI Synthesis Detection
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Trust Signals */}
                            <div className="liquid-glass-card rounded-[28px] p-8">
                                <div className="relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 mb-6">
                                        <img width="24" height="24" src="https://img.icons8.com/plumpy/24/guarantee.png" alt="guarantee"/>
                                    </div>
                                    <h3 className="text-lg font-light text-slate-800 mb-3 tracking-tight">Trust & E-E-A-T</h3>
                                    <ul className="space-y-2">
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Required pages check
                                        </li>
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Author information
                                        </li>
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Brand consistency
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Schema Detection */}
                            <div className="liquid-glass-card rounded-[28px] p-8">
                                <div className="relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 mb-6">
                                        <img width="24" height="24" src="https://img.icons8.com/plumpy/24/upload-link-document.png" alt="upload-link-document"/>
                                    </div>
                                    <h3 className="text-lg font-light text-slate-800 mb-3 tracking-tight">Schema & Structured Data</h3>
                                    <ul className="space-y-2">
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Existing markup detection
                                        </li>
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Missing schema types
                                        </li>
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Validation errors
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Performance */}
                            <div className="liquid-glass-card rounded-[28px] p-8">
                                <div className="relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 mb-6">
                                        <img width="24" height="24" src="https://img.icons8.com/plumpy/24/speed.png" alt="speed"/>
                                    </div>
                                    <h3 className="text-lg font-light text-slate-800 mb-3 tracking-tight">Performance & UX</h3>
                                    <ul className="space-y-2">
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Core Web Vitals
                                        </li>
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Page speed analysis
                                        </li>
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Internal linking
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Policy Risk */}
                            <div className="liquid-glass-card rounded-[28px] p-8">
                                <div className="relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 mb-6">
                                        <img width="24" height="24" src="https://img.icons8.com/plumpy/24/high-risk.png" alt="high-risk"/>
                                    </div>
                                    <h3 className="text-lg font-light text-slate-800 mb-3 tracking-tight">Policy Risk Engine</h3>
                                    <ul className="space-y-2">
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Prohibited Content Scan
                                        </li>
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Low-Value Detection
                                        </li>
                                        <li className="text-slate-500 text-sm font-light flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            Policy Violation Mapping
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Verdict System */}
                <section className="relative z-10 py-16 md:py-24 px-4 sm:px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12 md:mb-16">
                            <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-medium mb-4 block">Decision Engine</span>
                            <h2 className="text-2xl md:text-4xl font-extralight text-slate-900 tracking-tighter">Your Verdict</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="liquid-glass-card rounded-[28px] p-8 text-center">
                                <div className="relative z-10">
                                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                        <img width="32" height="32" src="https://img.icons8.com/plumpy/32/cancel.png" alt="cancel"/>
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-800 mb-2">Rejection Risk</h3>
                                    <p className="text-slate-500 text-sm font-light">Critical policy conflicts detected. Rectification required before submission.</p>
                                </div>
                            </div>
                            <div className="liquid-glass-card rounded-[28px] p-8 text-center">
                                <div className="relative z-10">
                                    <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                                        <img width="32" height="32" src="https://img.icons8.com/plumpy/32/high-importance.png" alt="high-importance"/>
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-800 mb-2">Optimization Needed</h3>
                                    <p className="text-slate-500 text-sm font-light">Minor structural adjustments required to guarantee approval probability.</p>
                                </div>
                            </div>
                            <div className="liquid-glass-card rounded-[28px] p-8 text-center">
                                <div className="relative z-10">
                                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                                        <img width="32" height="32" src="https://img.icons8.com/plumpy/32/ok--v1.png" alt="ok--v1"/>
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-800 mb-2">Approval Ready</h3>
                                    <p className="text-slate-500 text-sm font-light">Asset demonstrates full alignment with AdSense monetization standards.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <GlobalAnalysisCTA />
            </main>
            <Footer />
        </>
    );
}
