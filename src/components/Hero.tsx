"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function Hero() {
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showBlockPopup, setShowBlockPopup] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const error = searchParams.get('error');
        if (error === 'scan_failed') {
            alert("The analysis engine encountered a critical error while scanning the website. It could be down, unreachable, or simply took too long to respond. Please try again.");
            // Clean up the URL
            router.replace('/', undefined);
        }
    }, [searchParams, router]);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setIsLoading(true);
        // Add https:// if not present
        let fullUrl = url;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            fullUrl = "https://" + url;
        }

        try {
            const domain = fullUrl.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
            
            // Block scanning of own domain
            const currentHost = typeof window !== "undefined" ? window.location.hostname.replace("www.", "") : "ad2vo.com";
            if (domain.includes("ad2vo.com") || domain.includes(currentHost) || domain === "localhost") {
                setShowBlockPopup(true);
                setIsLoading(false);
                return;
            }

            // Get user if logged in
            const { supabase } = await import("@/lib/supabase");
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login?error=auth_required");
                return;
            }

            let userId = user.id;
            let userPlan = user.user_metadata?.plan || "free";

            // Create scan record in database via backend API
            const response = await fetch('/api/scans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: fullUrl,
                    domain,
                    userId,
                    userPlan
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initialize scan from server');
            }

            // Store URL and Scan ID in sessionStorage for scanning page
            sessionStorage.setItem("currentScanId", data.scanId);
            sessionStorage.setItem("analysisUrl", fullUrl);

            // Redirect to scanning page
            router.push("/scanning");
        } catch (err) {
            console.error("Failed to start scan:", err);
            setIsLoading(false);
            // Fallback: Just redirect to scanning if network fails
            // It might get stuck at 95% but it's better than silent failure.
            // A better way would be an error toast.
            alert("Failed to connect to analysis engine. Please try again.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] pt-16 sm:pt-20 md:pt-28 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 relative z-10">
            <div className="max-w-4xl w-full text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/30 backdrop-blur-md px-3 py-1 mb-8 sm:mb-12 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500/80">
                        Intelligence Engine V2.6
                    </span>
                </div>
                <h1 className="text-5xl sm:text-7xl md:text-[80px] lg:text-[100px] font-extrabold text-slate-900 mb-6 sm:mb-10 leading-[1.1]">
                    AdSense Analyzer<br />
                    <span className="text-slate-400/80 italic font-light">
                        & Checker.
                    </span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-slate-500/80 max-w-xl mx-auto leading-relaxed mb-10 sm:mb-16 font-light premium-letter-spacing">
                    Enterprise AI-driven AdSense readiness and semantic content analysis. 
                    The professional AdSense Checker and Analyzer designed for clarity.
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
                    <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 md:gap-8 opacity-40 grayscale hover:opacity-60 transition-opacity">
                        <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase text-slate-900">
                            10,000+ Sites Analyzed
                        </span>
                        <span className="hidden md:block w-1 h-1 rounded-full bg-slate-400"></span>
                        <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase text-slate-900">
                            98% Approval Accuracy
                        </span>
                        <span className="hidden md:block w-1 h-1 rounded-full bg-slate-400"></span>
                        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-slate-900">
                            Trusted by Pro Publishers
                        </span>
                    </div>
                </div>
            </div>

            {/* Block Self-Scan Modal */}
            {showBlockPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowBlockPopup(false)}></div>
                    <div className="bg-white rounded-[24px] p-8 max-w-md w-full relative z-10 shadow-2xl border border-slate-100 text-center transform transition-all">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-3xl">gpp_bad</span>
                        </div>
                        <h3 className="text-xl font-medium text-slate-900 mb-2">Action Not Allowed</h3>
                        <p className="text-slate-500 font-light mb-8 leading-relaxed text-sm">
                            Aap ghalat website search kar rahe hain. Ye ek non-profit organization hai jo ads se revenue generate nahi kar rahi hai, isliye aap is website ko scan nahi kar sakte.
                        </p>
                        <button 
                            onClick={() => setShowBlockPopup(false)}
                            className="w-full bg-slate-900 text-white font-medium py-3.5 rounded-[16px] hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
