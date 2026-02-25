"use client";
import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function ReportPage() {
    const [analysisUrl, setAnalysisUrl] = useState("example.com");
    const [copied, setCopied] = useState(false);

    // Get URL from sessionStorage on mount
    useEffect(() => {
        const storedUrl = sessionStorage.getItem("analysisUrl");
        if (storedUrl) {
            try {
                const urlObj = new URL(storedUrl);
                setAnalysisUrl(urlObj.hostname);
            } catch {
                setAnalysisUrl(storedUrl.replace(/^https?:\/\//, "").split("/")[0]);
            }
        }
    }, []);

    // Get current date
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Mock data
    const mockReport = {
        score: 72,
        verdict: "fix",
        shareUrl: `ad2go.app/r/abc123`
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(mockReport.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Report sections
    const reportSections = [
        "Executive Summary",
        "Category Breakdown (6 sections)",
        "Issues & Warnings (7 items)",
        "Recommendations & Fix Roadmap",
        "Technical Details & Raw Data"
    ];

    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Header */}
                <section className="relative z-10 pt-32 md:pt-40 pb-8 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-4xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-medium mb-4 block">Export & Share</span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extralight text-slate-800 tracking-tight mb-4 leading-tight">
                            Your Report
                        </h1>
                        <p className="text-slate-500 text-base font-light max-w-md mx-auto">
                            Download or share your complete AdSense readiness report
                        </p>
                    </div>
                </section>

                {/* Report Preview Card */}
                <section className="relative z-10 py-8 px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto">
                        {/* Main Report Card */}
                        <div className="liquid-glass-card rounded-[2.5rem] p-8 md:p-12 mb-10">
                            <div className="relative z-10">
                                {/* Report Header */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b border-slate-200/50 pb-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                                            <span className="material-symbols-outlined text-white text-2xl">description</span>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-light tracking-wide text-slate-800">{analysisUrl}</h2>
                                            <p className="text-[11px] uppercase tracking-widest text-slate-400 mt-1">Generated on {currentDate}</p>
                                        </div>
                                    </div>
                                    {/* Score Ring */}
                                    <div className="score-ring">
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl font-light tracking-tighter text-slate-800">{mockReport.score}</span>
                                            <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold -mt-1">Score</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Report Sections */}
                                <div className="space-y-3 mb-12">
                                    {reportSections.map((section, index) => (
                                        <div
                                            key={index}
                                            className="group flex items-center justify-between p-5 rounded-2xl bg-white/30 border border-transparent hover:border-slate-200 hover:bg-white/60 transition-all duration-300 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>
                                                <span className="font-light tracking-wide text-slate-700">{section}</span>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-300 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">chevron_right</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Download Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-2xl shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-1">
                                        <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                                        <span className="text-[11px] uppercase tracking-[0.2em] font-bold">Download PDF</span>
                                    </button>
                                    <button className="flex-1 flex items-center justify-center gap-3 bg-white/80 text-slate-800 py-5 rounded-2xl border border-white/40 hover:bg-white transition-all duration-300 hover:-translate-y-1">
                                        <span className="material-symbols-outlined text-xl">table_chart</span>
                                        <span className="text-[11px] uppercase tracking-[0.2em] font-bold">Export CSV</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Share Section */}
                        <div className="liquid-glass-card rounded-[2rem] p-8 md:px-12 md:py-10">
                            <div className="relative z-10">
                                <h3 className="text-lg font-light tracking-wide text-slate-800 mb-8">Share Report</h3>

                                <div className="flex flex-col gap-8">
                                    {/* Shareable Link */}
                                    <div>
                                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-3 ml-1">Shareable Link</span>
                                        <div className="machined-field p-2 rounded-2xl flex items-center justify-between">
                                            <span className="text-sm font-light px-4 text-slate-600">{mockReport.shareUrl}</span>
                                            <button
                                                onClick={handleCopy}
                                                className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl text-[10px] uppercase tracking-widest font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    {copied ? 'check' : 'content_copy'}
                                                </span>
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-3 ml-1 italic">Anyone with this link can view a read-only version of your report.</p>
                                    </div>

                                    {/* Social Share */}
                                    <div>
                                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-4 ml-1">Share On</span>
                                        <div className="flex gap-4">
                                            {/* X (Twitter) */}
                                            <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                                <svg className="w-4 h-4 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                </svg>
                                            </button>
                                            {/* LinkedIn */}
                                            <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                                <svg className="w-4 h-4 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                                </svg>
                                            </button>
                                            {/* Email */}
                                            <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                                <span className="material-symbols-outlined text-slate-700">mail</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Back Link */}
                        <div className="text-center mt-16">
                            <Link
                                href="/results"
                                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Back to Results
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />

            {/* CSS for score ring animation */}
            <style jsx>{`
                .score-ring {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .score-ring::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    padding: 2px;
                    background: linear-gradient(45deg, #6366f1, #a855f7, #ec4899);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    mask-composite: exclude;
                    animation: pulse-ring 4s infinite linear;
                }
                @keyframes pulse-ring {
                    0% { transform: rotate(0deg); opacity: 0.8; }
                    50% { opacity: 1; }
                    100% { transform: rotate(360deg); opacity: 0.8; }
                }
                .machined-field {
                    background: rgba(0, 0, 0, 0.03);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                }
            `}</style>
        </>
    );
}
