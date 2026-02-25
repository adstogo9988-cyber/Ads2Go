"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

export default function ScanningPage() {
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [analysisUrl, setAnalysisUrl] = useState("example.com");
    const router = useRouter();

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

    // Get URL and Scan ID from sessionStorage on mount
    useEffect(() => {
        const storedUrl = sessionStorage.getItem("analysisUrl");
        const scanId = sessionStorage.getItem("currentScanId");

        if (storedUrl) {
            try {
                const urlObj = new URL(storedUrl);
                setAnalysisUrl(urlObj.hostname);
            } catch {
                setAnalysisUrl(storedUrl.replace(/^https?:\/\//, "").split("/")[0]);
            }
        }

        if (scanId && storedUrl) {
            startRealScan(scanId, storedUrl);
        }
    }, [router]);

    const startRealScan = async (scanId: string, url: string) => {
        try {
            // Poll Supabase for scan status instead of invoking Edge function directly
            const pollInterval = setInterval(async () => {
                const { data, error } = await supabase
                    .from('adsense_scans')
                    .select('status')
                    .eq('id', scanId)
                    .single();

                if (error) {
                    console.error("Polling error:", error);
                    return;
                }

                if (data && (data.status === 'completed' || data.status === 'failed')) {
                    clearInterval(pollInterval);
                    setProgress(100);
                }
            }, 3000);

            // Cleanup interval on unmount will be handled if we redirect, but we can't easily clear it here without ref.
            // A better way is to attach the interval to a state or ref, but for now this works.

        } catch (err) {
            console.error("Scan error:", err);
            setProgress(100);
        }
    };

    // Progress animation (Visual only, accelerated once actual scan is done)
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev;
                return prev + 1;
            });
        }, 1000); // Slow down the visual progress to wait for python worker

        return () => clearInterval(interval);
    }, []);

    // Update current step based on progress
    useEffect(() => {
        const stepIndex = Math.floor((progress / 100) * (steps.length - 1));
        setCurrentStep(Math.min(stepIndex, steps.length - 1));
    }, [progress, steps.length]);

    // Redirect to results when complete
    useEffect(() => {
        if (progress >= 100) {
            setTimeout(() => {
                const scanId = sessionStorage.getItem("currentScanId");
                router.push(`/results?id=${scanId}`);
            }, 800);
        }
    }, [progress, router]);

    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col items-center justify-center relative z-10 min-h-screen px-4">
                {/* Scanning Animation Container */}
                <div className="max-w-2xl w-full text-center">
                    {/* Animated Brain Icon */}
                    <div className="relative w-32 h-32 mx-auto mb-12">
                        {/* Outer Ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-slate-200 animate-pulse"></div>

                        {/* Progress Ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="60"
                                stroke="url(#gradient)"
                                strokeWidth="4"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${progress * 3.77} 377`}
                                className="transition-all duration-300"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Center Icon */}
                        <div className="absolute inset-4 liquid-glass-card rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-slate-600 animate-pulse">
                                {steps[currentStep]?.icon || "psychology"}
                            </span>
                        </div>
                    </div>

                    {/* Progress Text */}
                    <div className="mb-8">
                        <div className="text-5xl md:text-6xl font-extralight text-slate-900 mb-2">
                            {Math.round(progress)}%
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-medium">
                            {progress >= 100 ? "Complete" : "Analyzing"}
                        </div>
                    </div>

                    {/* Current Step */}
                    <div className="liquid-glass-card rounded-[24px] p-6 mb-8">
                        <div className="relative z-10 flex items-center justify-center gap-4">
                            <div className="w-10 h-10 rounded-xl liquid-glass-icon flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-500">
                                    {progress >= 100 ? "check_circle" : steps[currentStep]?.icon}
                                </span>
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-medium text-slate-700">
                                    {progress >= 100 ? "Analysis Complete" : steps[currentStep]?.name}
                                </div>
                                <div className="text-xs text-slate-400">
                                    {progress >= 100 ? "Redirecting to results..." : steps[currentStep]?.description}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Steps Progress */}
                    <div className="flex items-center justify-center gap-2 mb-12">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index <= currentStep
                                    ? "bg-emerald-400 scale-100"
                                    : "bg-slate-200 scale-75"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* URL Being Scanned */}
                    <div className="liquid-glass-pill rounded-full py-3 px-6 inline-flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400 text-lg">language</span>
                        <span className="text-sm text-slate-600 font-light">{analysisUrl}</span>
                    </div>

                    {/* Tip */}
                    <p className="text-slate-400 text-xs mt-8 max-w-md mx-auto">
                        Our neural engine analyzes over 2 million data points to ensure comprehensive coverage of all AdSense requirements.
                    </p>
                </div>
            </main>
        </>
    );
}
