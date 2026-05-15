"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { GlassLoader } from "@/components/GlassLoader";

export default function ScanningPage() {
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [analysisUrl, setAnalysisUrl] = useState("example.com");
    const [scanFailed, setScanFailed] = useState(false);
    const router = useRouter();
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const redirectedRef = useRef(false);

    const steps = [
        { name: "Connecting", icon: "link", description: "Establishing connection to website..." },
        { name: "Technical SEO", icon: "code", description: "Analyzing sitemap, robots.txt, HTTPS..." },
        { name: "Content Intelligence", icon: "article", description: "Scanning content quality and depth..." },
        { name: "Trust Signals", icon: "verified", description: "Checking E-E-A-T and trust pages..." },
        { name: "Schema Detection", icon: "schema", description: "Validating structured data..." },
        { name: "Performance", icon: "speed", description: "Measuring Core Web Vitals..." },
        { name: "Policy Check", icon: "gpp_maybe", description: "Running compliance engine..." },
        { name: "Finalizing", icon: "auto_awesome", description: "Generating your report..." },
    ];

    const statusToStep: Record<string, number> = {
        pending: 0,
        running: 1,
        crawling_site: 2,
        checking_links: 3,
        scraping: 3,
        measuring_performance: 5,
        analyzing_policy: 6,
        enriching_data: 6,
        finalizing_results: 7,
        completed: 7,
        failed: 7,
    };

    const doRedirect = (scanId: string, failed: boolean) => {
        if (redirectedRef.current) return;
        redirectedRef.current = true;
        if (pollRef.current) clearInterval(pollRef.current);
        if (progressRef.current) clearInterval(progressRef.current);
        setProgress(100);
        setTimeout(() => {
            if (failed) {
                router.push(`/?error=scan_failed`);
            } else {
                router.push(`/dashboard?report=${scanId}`);
            }
        }, 800);
    };

    useEffect(() => {
        const storedUrl = sessionStorage.getItem("analysisUrl");
        const scanId = sessionStorage.getItem("currentScanId");

        if (storedUrl) {
            try {
                setAnalysisUrl(new URL(storedUrl).hostname);
            } catch {
                setAnalysisUrl(storedUrl.replace(/^https?:\/\//, "").split("/")[0]);
            }
        }

        if (!scanId) return;

        // ── Visual progress animation (cosmetic only) ──
        progressRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 99) return 99;
                // Slow down naturally as it approaches the end
                const increment = prev >= 90 ? 0.1 : prev >= 70 ? 0.5 : prev >= 40 ? 1 : 2;
                return Math.min(99, prev + increment);
            });
        }, 1000);

        // ── Poll backend for real status every 4 seconds ──
        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/scans/status?id=${scanId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (!data?.status) return;

                const status = data.status;
                console.log(`[Poll] status=${status}`);

                // Update the step card
                if (status in statusToStep) {
                    setCurrentStep(statusToStep[status]);
                }

                if (status === "completed") {
                    doRedirect(scanId, false);
                } else if (status === "failed") {
                    setScanFailed(true);
                    doRedirect(scanId, true);
                }
            } catch (e) {
                console.error("Poll error:", e);
            }
        }, 4000);

        // ── Hard timeout: 12 minutes max ──
        const timeout = setTimeout(() => {
            if (!redirectedRef.current) {
                setScanFailed(true);
                doRedirect(scanId, true);
            }
        }, 12 * 60 * 1000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (progressRef.current) clearInterval(progressRef.current);
            clearTimeout(timeout);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-[#fcfdfe] flex flex-col">
            <Navbar />
            <main className="flex-grow flex flex-col items-center justify-center relative z-10 px-4 py-12">
                {/* Background Atmosphere */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-rose-200/10 blur-[120px] -z-10 rounded-full"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-200/10 blur-[120px] -z-10 rounded-full"></div>

                <div className="max-w-2xl w-full text-center">
                    {/* Loader */}
                    <div className="mb-12 relative flex justify-center">
                        <div className="absolute inset-0 bg-rose-500/5 blur-[40px] rounded-full"></div>
                        <GlassLoader size={1.5} colorOne="#ff4d6d" colorTwo="#ff8fa3" />
                    </div>

                    {/* Progress */}
                    <div className="mb-12 dash-fade-in-1">
                        <div className="text-6xl font-extralight text-slate-900 mb-2 tracking-tight">
                            {Math.round(progress)}%
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-bold">
                            {progress >= 100 ? (scanFailed ? "Scan Failed" : "Complete") : "Analyzing Website"}
                        </div>
                    </div>

                    {/* Intelligence Dock */}
                    <div className="max-w-xl mx-auto mt-16 space-y-12">
                        {/* Intelligence Card */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-rose-500/10 to-indigo-500/10 rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                            <div className="machined-glass rounded-[32px] p-8 flex items-center gap-8 relative z-10 border border-white/60 shadow-2xl shadow-slate-200/30">
                                {/* URL Chip */}
                                <div className="absolute top-6 right-8 flex items-center gap-2 px-3 py-1 bg-white/40 backdrop-blur-sm rounded-full border border-white/60 shadow-sm">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                    <span className="text-[9px] text-slate-500 font-medium tracking-wider lowercase truncate max-w-[120px]">
                                        {analysisUrl}
                                    </span>
                                </div>

                                <div className="w-16 h-16 rounded-2xl bg-white/50 backdrop-blur-md border border-white/80 flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-emerald-500 text-3xl font-extralight animate-pulse">
                                        {steps[currentStep]?.icon || "bolt"}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] uppercase tracking-[0.5em] text-emerald-500 font-bold mb-1.5">Neural Engine Phase</div>
                                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight leading-none mb-2">
                                        {steps[currentStep]?.name}
                                    </h3>
                                    <p className="text-sm text-slate-400 font-light leading-relaxed">
                                        {steps[currentStep]?.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step Indicators */}
                        <div className="flex items-center justify-center gap-2">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
                                        index <= currentStep
                                            ? index === currentStep
                                                ? "w-16 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                                : "w-4 bg-emerald-200"
                                            : "w-2 bg-slate-100"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <p className="text-slate-400 text-xs mt-12 max-w-md mx-auto font-light leading-relaxed">
                        Our neural engine analyzes over 2 million data points to ensure comprehensive coverage of all AdSense requirements.
                    </p>
                </div>
            </main>
        </div>
    );
}
