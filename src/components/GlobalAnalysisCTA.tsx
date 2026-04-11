"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function GlobalAnalysisCTA() {
    const [url, setUrl] = useState("");
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!url) return;
        setIsLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push("/login?error=auth_required");
            return;
        }

        // Just use same logic as Hero or redirect back to hero / scanning
        // For simplicity redirect to home to use the main hero logic or directly scanning.
        // Easiest is to simulate what Hero does:
        let fullUrl = url;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            fullUrl = "https://" + url;
        }
        
        try {
            const domain = fullUrl.replace(/^https?:\/\//, "").split("/")[0];
            const userId = user.id;
            const userPlan = user.user_metadata?.plan || "free";

            const response = await fetch('/api/scans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: fullUrl, domain, userId, userPlan }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initialize scan');
            }

            sessionStorage.setItem("currentScanId", data.scanId);
            sessionStorage.setItem("analysisUrl", fullUrl);
            router.push("/scanning");
        } catch (err) {
            console.error(err);
            alert("Failed to connect to analysis engine. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <section className="relative z-10 py-20 md:py-32 px-4 sm:px-6 flex flex-col items-center">
            <div className="max-w-xl w-full text-center">
                <h2 className="text-2xl md:text-3xl font-extralight text-slate-900 mb-8 md:mb-10 tracking-tight">Initiate Global Analysis</h2>
                <div className="flex justify-center">
                    <div className="ethereal-pill rounded-[24px] md:rounded-full p-1.5 flex flex-col sm:flex-row items-center w-full max-w-md gap-2 sm:gap-0">
                        <input
                            className="bg-transparent border-none focus:ring-0 text-sm font-light text-slate-600 px-4 md:px-6 flex-grow placeholder:text-slate-300 w-full"
                            placeholder="Enter domain for analysis..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            type="text"
                        />
                        <button 
                            onClick={handleAnalyze}
                            disabled={isLoading}
                            className="bg-slate-900 text-white text-[10px] uppercase tracking-widest px-6 md:px-8 py-3 rounded-[20px] md:rounded-full font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 whitespace-nowrap w-full sm:w-auto overflow-hidden relative"
                        >
                            {isLoading ? "Starting..." : "Start Analysis"}
                        </button>
                    </div>
                </div>
                <p className="mt-6 md:mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-light">Authentication required for robust security</p>
            </div>
        </section>
    );
}
