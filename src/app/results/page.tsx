"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function ResultsPage() {
    const [activeTab, setActiveTab] = useState<"overview" | "issues" | "recommendations">("overview");
    const [analysisUrl, setAnalysisUrl] = useState("example.com");
    const [scanData, setScanData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);
    const searchParams = useSearchParams();
    const scanId = searchParams.get("id");

    useEffect(() => {
        if (scanId) {
            fetchScanResults(scanId);
        } else {
            // Fallback to session storage if no ID in URL
            const storedId = sessionStorage.getItem("currentScanId");
            if (storedId) fetchScanResults(storedId);
        }
    }, [scanId]);

    const fetchScanResults = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('adsense_scans')
                .select('*, sites(url, domain)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setScanData(data);
            setAnalysisUrl(data.sites?.domain || "site.com");
        } catch (err) {
            console.error("Error fetching scan results:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate dynamic state from scanData
    const getOverallScore = () => scanData?.overall_score || 0;
    const getVerdict = () => {
        const score = getOverallScore();
        if (score >= 80) return "ready";
        if (score >= 50) return "fix";
        return "not_ready";
    };

    const getCategories = () => {
        if (!scanData) return [];

        const core = scanData.core_scan_data || {};
        const trust = scanData.trust_pages_data || {};
        const seo = scanData.seo_indexing_data || {};
        const security = scanData.security_data || {};

        return [
            {
                name: "Technical SEO",
                score: (core.robots_txt?.exists ? 30 : 0) + (core.sitemap_xml?.exists ? 30 : 0) + (seo.title ? 20 : 0) + (core.broken_links?.broken === 0 ? 20 : 0),
                status: (core.robots_txt?.exists && core.sitemap_xml?.exists && core.broken_links?.broken === 0) ? "good" : "warning"
            },
            {
                name: "Trust Signals",
                score: Object.values(trust.summary || {}).filter(Boolean).length * 20,
                status: trust.summary?.privacy ? "good" : "critical"
            },
            {
                name: "Policy Compliance",
                score: 100 - (core.ai_policy?.risk_score || 0),
                status: (core.ai_policy?.risk_score || 0) > 70 ? "critical" : ((core.ai_policy?.risk_score || 0) > 30 ? "warning" : "good")
            },
            {
                name: "Security",
                score: (core.ssl_check?.status === 'passed' ? 50 : 0) + (security.headers?.csp ? 10 : 0) + (security.headers?.sts ? 10 : 0) + (security.mixed_content ? 0 : 15) + (security.safe_browsing?.status === 'safe' ? 15 : 0),
                status: core.ssl_check?.status === 'passed' && security.safe_browsing?.status !== 'unsafe' && !security.mixed_content ? "good" : "critical"
            },
            { name: "Content Quality", score: 65 + (core.content_analysis?.has_thin_content ? -20 : 0), status: core.content_analysis?.has_thin_content ? "warning" : "good" },
            {
                name: "Performance",
                score: core.pagespeed?.score || 50,
                status: (core.pagespeed?.score || 50) >= 80 ? "good" : ((core.pagespeed?.score || 50) >= 50 ? "warning" : "critical")
            },
            {
                name: "Schema & SEO",
                score: (seo.structured_data?.detected ? 50 : 0) + (seo.headings?.h1_count === 1 ? 50 : 30),
                status: seo.structured_data?.detected ? "good" : "warning"
            },
        ];
    };

    const categories = getCategories();

    const getIssuesCount = () => {
        if (!scanData) return { critical: 0, warnings: 0, passed: 0 };
        const trust = scanData.trust_pages_data?.summary || {};
        const core = scanData.core_scan_data || {};

        let critical = 0;
        let warnings = 0;

        if (!trust.privacy) critical++;
        if (!trust.about) warnings++;
        if (!trust.contact) critical++;
        if (core.ssl_check?.status !== 'passed') critical++;
        if (!core.sitemap_xml?.exists) warnings++;
        if (core.broken_links && core.broken_links.broken > 0) critical++;
        if (core.content_analysis?.has_thin_content) warnings++;

        if (core.pagespeed) {
            if (core.pagespeed.score < 50) critical++;
            else if (core.pagespeed.score < 80) warnings++;
        }

        if (core.ai_policy) {
            if (core.ai_policy.risk_score > 70) critical++;
            else if (core.ai_policy.risk_score > 30) warnings++;

            // Add ai flags to total issues
            if (core.ai_policy.issues_found && core.ai_policy.flags?.length) {
                warnings += core.ai_policy.flags.length;
            }
        }

        const security = scanData.security_data || {};
        if (security.safe_browsing?.status === 'unsafe') critical++;
        if (security.mixed_content) warnings++;

        const seo = scanData.seo_indexing_data || {};
        if (!seo.structured_data?.detected) warnings++;
        if (seo.headings?.h1_count !== 1) warnings++;

        return { critical, warnings, passed: 15 };
    };

    const issues = getIssuesCount();

    const getVerdictDisplay = () => {
        const verdictType = getVerdict();
        switch (verdictType) {
            case "ready":
                return { emoji: "✅", text: "Ready for AdSense", color: "text-emerald-600", bg: "bg-emerald-50" };
            case "fix":
                return { emoji: "⚠️", text: "Fix & Apply", color: "text-amber-600", bg: "bg-amber-50" };
            case "not_ready":
                return { emoji: "❌", text: "Not Ready", color: "text-red-600", bg: "bg-red-50" };
            default:
                return { emoji: "⚠️", text: "Fix & Apply", color: "text-amber-600", bg: "bg-amber-50" };
        }
    };

    const verdict = getVerdictDisplay();

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-500";
        if (score >= 60) return "text-amber-500";
        return "text-red-500";
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case "good": return "bg-emerald-400";
            case "warning": return "bg-amber-400";
            case "critical": return "bg-red-400";
            default: return "bg-slate-400";
        }
    };

    const generatePDF = async () => {
        const element = document.getElementById("pdf-report-content");
        if (!element) return;

        try {
            // Hide navbar/footer from print if needed, but capturing main is usually enough
            const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#f8fafc" });
            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

            // Add watermark
            pdf.setFontSize(40);
            pdf.setTextColor(200, 200, 200);
            pdf.text("www.ads2go.org", pdfWidth / 2, pdf.internal.pageSize.getHeight() / 2, { align: "center", angle: -45 });

            pdf.save(`${analysisUrl.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_adsense_report.pdf`);
        } catch (err) {
            console.error("PDF generation failed:", err);
            alert("Failed to generate PDF report.");
        }
    };

    const copyShareLink = () => {
        const url = `${window.location.origin}/results?id=${scanId || sessionStorage.getItem('currentScanId')}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    return (
        <>
            <Navbar />
            <main id="pdf-report-content" className="flex-grow flex flex-col relative z-10 bg-slate-50/30 pb-10">
                {/* Header */}
                <section className="relative z-10 pt-32 md:pt-40 pb-8 px-4 sm:px-6 flex flex-col items-center">
                    <div className="max-w-4xl w-full text-center">
                        <span className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-medium mb-4 block">Analysis Complete</span>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extralight text-slate-900 tracking-tighter mb-4 leading-tight">
                            {analysisUrl}
                        </h1>
                        <div className={`inline-flex items-center gap-2 px-4 py-2 ${verdict.bg} rounded-full`}>
                            <span className="text-lg">{verdict.emoji}</span>
                            <span className={`text-sm font-medium ${verdict.color}`}>{verdict.text}</span>
                        </div>
                    </div>
                </section>

                {/* Score Overview */}
                <section className="relative z-10 py-8 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Score Card */}
                            <div className="liquid-glass-card-dark rounded-[32px] p-8 md:p-10 text-center">
                                <div className="relative z-10">
                                    <span className="text-[10px] uppercase tracking-widest text-white/40 mb-4 block">Overall Score</span>
                                    <div className="text-7xl md:text-8xl font-extralight text-white mb-4">{getOverallScore()}</div>
                                    <div className="text-white/50 text-sm font-light">out of 100</div>
                                </div>
                            </div>

                            {/* Issues Summary */}
                            <div className="liquid-glass-card rounded-[32px] p-8 md:p-10">
                                <div className="relative z-10">
                                    <span className="text-[10px] uppercase tracking-widest text-slate-400 mb-6 block">Issues Found</span>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                                <span className="text-slate-600 text-sm">Critical</span>
                                            </div>
                                            <span className="text-xl font-light text-slate-800">{issues.critical}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                                <span className="text-slate-600 text-sm">Warnings</span>
                                            </div>
                                            <span className="text-xl font-light text-slate-800">{issues.warnings}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                                <span className="text-slate-600 text-sm">Passed</span>
                                            </div>
                                            <span className="text-xl font-light text-slate-800">{issues.passed}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="liquid-glass-card rounded-[32px] p-8 md:p-10">
                                <div className="relative z-10">
                                    <span className="text-[10px] uppercase tracking-widest text-slate-400 mb-6 block">Quick Actions</span>
                                    <div className="space-y-3">
                                        <button
                                            onClick={generatePDF}
                                            className="w-full py-3 px-4 liquid-glass-button-primary rounded-xl text-xs uppercase tracking-widest font-bold text-white flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-base">download</span>
                                            Export Report
                                        </button>
                                        <Link
                                            href="/roadmap"
                                            className="w-full py-3 px-4 liquid-glass-button rounded-xl text-xs uppercase tracking-widest font-medium text-slate-700 flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-base">route</span>
                                            Fix Roadmap
                                        </Link>
                                        <button
                                            onClick={copyShareLink}
                                            className="w-full py-3 px-4 liquid-glass-button rounded-xl text-xs uppercase tracking-widest font-medium text-slate-700 flex items-center justify-center gap-2 relative"
                                        >
                                            <span className="material-symbols-outlined text-base">{copySuccess ? 'check' : 'share'}</span>
                                            {copySuccess ? 'Copied!' : 'Share Report'}
                                        </button>
                                        <Link
                                            href="/analysis"
                                            className="w-full py-3 px-4 liquid-glass-button rounded-xl text-xs uppercase tracking-widest font-medium text-slate-700 flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-base">refresh</span>
                                            Re-Analyze
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Category Scores */}
                <section className="relative z-10 py-12 md:py-16 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-medium mb-2 block">Breakdown</span>
                            <h2 className="text-2xl md:text-3xl font-extralight text-slate-900 tracking-tighter">Category Scores</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map((category: any, index: number) => (
                                <div key={index} className="liquid-glass-card rounded-[24px] p-6">
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium text-slate-700">{category.name}</h3>
                                            <div className={`w-2 h-2 rounded-full ${getStatusBg(category.status)}`}></div>
                                        </div>
                                        <div className={`text-4xl font-extralight ${getScoreColor(category.score)} mb-2`}>
                                            {category.score}
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${getStatusBg(category.status)}`}
                                                style={{ width: `${category.score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Tabs Section */}
                <section className="relative z-10 py-12 md:py-16 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Tab Buttons */}
                        <div className="flex gap-2 mb-8 border-b border-slate-100 pb-4">
                            <button
                                onClick={() => setActiveTab("overview")}
                                className={`px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-medium transition-all ${activeTab === "overview"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab("issues")}
                                className={`px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-medium transition-all ${activeTab === "issues"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                Issues ({issues.critical + issues.warnings})
                            </button>
                            <button
                                onClick={() => setActiveTab("recommendations")}
                                className={`px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-medium transition-all ${activeTab === "recommendations"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                Recommendations
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === "overview" && (
                            <div className="liquid-glass-card rounded-[32px] p-8 md:p-12">
                                <div className="relative z-10 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-light text-slate-800 mb-3">Summary</h3>
                                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                                            Your website has a good foundation but needs improvements in trust signals and structured data.
                                            The technical SEO and performance metrics are strong. Focus on adding required trust pages and
                                            implementing proper schema markup to increase your approval chances.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                        <div className="text-center p-4 bg-slate-50/50 rounded-2xl">
                                            <div className="text-2xl font-extralight text-slate-800 mb-1">12</div>
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400">Pages Scanned</div>
                                        </div>
                                        <div className="text-center p-4 bg-slate-50/50 rounded-2xl">
                                            <div className="text-2xl font-extralight text-slate-800 mb-1">
                                                {scanData?.core_scan_data?.pagespeed?.lcp ? scanData.core_scan_data.pagespeed.lcp.replace("s", "") + "s" : "2.4s"}
                                            </div>
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400">LCP Time</div>
                                        </div>
                                        <div className="text-center p-4 bg-slate-50/50 rounded-2xl">
                                            <div className="text-2xl font-extralight text-slate-800 mb-1">78%</div>
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400">Mobile Ready</div>
                                        </div>
                                        <div className="text-center p-4 bg-slate-50/50 rounded-2xl">
                                            <div className="text-2xl font-extralight text-slate-800 mb-1">65%</div>
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400">Approval Odds</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "issues" && (
                            <div className="space-y-4">
                                {/* Dynamic Issues from Scan */}
                                {!scanData?.trust_pages_data?.summary?.privacy && (
                                    <div className="liquid-glass-card rounded-[24px] p-6 border-l-4 border-red-400">
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-red-500">error</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold">Critical</span>
                                                </div>
                                                <h4 className="text-base font-medium text-slate-800 mb-1">Missing Privacy Policy</h4>
                                                <p className="text-slate-500 text-sm font-light">No privacy policy page detected. This is strictly required by Google AdSense.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!scanData?.trust_pages_data?.summary?.contact && (
                                    <div className="liquid-glass-card rounded-[24px] p-6 border-l-4 border-red-400">
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-red-500">error</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold">Critical</span>
                                                </div>
                                                <h4 className="text-base font-medium text-slate-800 mb-1">No Contact Information</h4>
                                                <p className="text-slate-500 text-sm font-light">Contact page is missing or unreachable. Add contact details to establish trust.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {scanData?.core_scan_data?.ssl_check?.status !== 'passed' && (
                                    <div className="liquid-glass-card rounded-[24px] p-6 border-l-4 border-red-400">
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-red-500">vpn_key</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold">Critical</span>
                                                </div>
                                                <h4 className="text-base font-medium text-slate-800 mb-1">Insecure Connection (No HTTPS)</h4>
                                                <p className="text-slate-500 text-sm font-light">Your site does not enforce a valid SSL certificate. AdSense requires secure properties.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {scanData?.core_scan_data?.broken_links?.broken > 0 && (
                                    <div className="liquid-glass-card rounded-[24px] p-6 border-l-4 border-red-400">
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-red-500">link_off</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold">Critical</span>
                                                </div>
                                                <h4 className="text-base font-medium text-slate-800 mb-1">Broken Links Detected</h4>
                                                <p className="text-slate-500 text-sm font-light">We found {scanData.core_scan_data.broken_links.broken} broken internal link(s) on your site. This harms UX and SEO.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!scanData?.core_scan_data?.sitemap_xml?.exists && (
                                    <div className="liquid-glass-card rounded-[24px] p-6 border-l-4 border-amber-400">
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-amber-500">warning</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] uppercase tracking-widest text-amber-600 font-bold">Warning</span>
                                                </div>
                                                <h4 className="text-base font-medium text-slate-800 mb-1">Sitemap Missing</h4>
                                                <p className="text-slate-500 text-sm font-light">We couldn't detect a sitemap.xml. Ensure your pages can be crawled by Googlebot.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {scanData?.security_data?.safe_browsing?.status === 'unsafe' && (
                                    <div className="liquid-glass-card rounded-[24px] p-6 border-l-4 border-red-500">
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-red-600">bug_report</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] uppercase tracking-widest text-red-600 font-bold">Critical Error</span>
                                                </div>
                                                <h4 className="text-base font-medium text-slate-800 mb-1">Google Safe Browsing Flag</h4>
                                                <p className="text-slate-500 text-sm font-light">Your domain is flagged for malware, phishing, or unwanted software. You will be instantly rejected by AdSense.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {scanData?.security_data?.mixed_content && (
                                    <div className="liquid-glass-card rounded-[24px] p-6 border-l-4 border-amber-400">
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-amber-500">lock_open</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] uppercase tracking-widest text-amber-600 font-bold">Warning</span>
                                                </div>
                                                <h4 className="text-base font-medium text-slate-800 mb-1">Mixed Content Detected</h4>
                                                <p className="text-slate-500 text-sm font-light">Your site loads over HTTPS but requests some assets over HTTP. Ensure all resources are served securely.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {scanData?.seo_indexing_data?.structured_data?.detected === false && (
                                    <div className="liquid-glass-card rounded-[24px] p-6 border-l-4 border-amber-400">
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-amber-500">data_object</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] uppercase tracking-widest text-amber-600 font-bold">Warning</span>
                                                </div>
                                                <h4 className="text-base font-medium text-slate-800 mb-1">No Structured Data Found</h4>
                                                <p className="text-slate-500 text-sm font-light">We couldn't detect any Schema markup (JSON-LD). This reduces search visibility and context.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {scanData?.core_scan_data?.pagespeed?.score < 80 && (
                                    <div className={`liquid-glass-card rounded-[24px] p-6 border-l-4 ${scanData.core_scan_data.pagespeed.score < 50 ? "border-red-400" : "border-amber-400"}`}>
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-xl ${scanData.core_scan_data.pagespeed.score < 50 ? "bg-red-50" : "bg-amber-50"} flex items-center justify-center flex-shrink-0`}>
                                                <span className={`material-symbols-outlined ${scanData.core_scan_data.pagespeed.score < 50 ? "text-red-500" : "text-amber-500"}`}>speed</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[9px] uppercase tracking-widest ${scanData.core_scan_data.pagespeed.score < 50 ? "text-red-500" : "text-amber-600"} font-bold`}>{scanData.core_scan_data.pagespeed.score < 50 ? "Critical" : "Warning"}</span>
                                                </div>
                                                <h4 className="text-base font-medium text-slate-800 mb-1">Poor Core Web Vitals</h4>
                                                <p className="text-slate-500 text-sm font-light">Your PageSpeed score is {scanData.core_scan_data.pagespeed.score}. LCP is {scanData.core_scan_data.pagespeed.lcp}. Fast load times are required for AdSense approval and ad visibility.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {scanData?.core_scan_data?.ai_policy?.issues_found && scanData.core_scan_data.ai_policy.flags?.map((flag: string, idx: number) => (
                                    <div key={idx} className={`liquid-glass-card rounded-[24px] p-6 border-l-4 ${scanData.core_scan_data.ai_policy.risk_score > 70 ? "border-red-400" : "border-amber-400"}`}>
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-xl ${scanData.core_scan_data.ai_policy.risk_score > 70 ? "bg-red-50" : "bg-amber-50"} flex items-center justify-center flex-shrink-0`}>
                                                <span className={`material-symbols-outlined ${scanData.core_scan_data.ai_policy.risk_score > 70 ? "text-red-500" : "text-amber-500"}`}>gpp_maybe</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[9px] uppercase tracking-widest ${scanData.core_scan_data.ai_policy.risk_score > 70 ? "text-red-500" : "text-amber-600"} font-bold`}>Policy Risk</span>
                                                </div>
                                                <h4 className="text-base font-medium text-slate-800 mb-1">AI Detected Policy Violation</h4>
                                                <p className="text-slate-500 text-sm font-light">{flag}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {issues.critical === 0 && issues.warnings === 0 && (
                                    <div className="liquid-glass-card rounded-[24px] p-6 border-l-4 border-emerald-400">
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold">Passed</span>
                                                </div>
                                                <h4 className="text-base font-medium text-slate-800 mb-1">No Phase 1 Technical Issues Found!</h4>
                                                <p className="text-slate-500 text-sm font-light">Great job. Your trust pages and technical foundation are strong.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "recommendations" && (
                            <div className="space-y-4">
                                {scanData?.core_scan_data?.ai_policy?.recommendations?.map((rec: string, idx: number) => (
                                    <div key={`ai-rec-${idx}`} className="liquid-glass-card rounded-[24px] p-6">
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl liquid-glass-icon flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-slate-500">auto_fix_high</span>
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-[9px] uppercase tracking-widest text-indigo-600 font-bold mb-1 block">AI Suggestion</span>
                                                <h4 className="text-base font-medium text-slate-800 mb-1">Policy Content Fix</h4>
                                                <p className="text-slate-500 text-sm font-light">{rec}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {!scanData?.core_scan_data?.ai_policy?.recommendations?.length && (
                                    <>
                                        <div className="liquid-glass-card rounded-[24px] p-6">
                                            <div className="relative z-10 flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl liquid-glass-icon flex items-center justify-center flex-shrink-0">
                                                    <span className="material-symbols-outlined text-slate-500">add_circle</span>
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold mb-1 block">Add</span>
                                                    <h4 className="text-base font-medium text-slate-800 mb-1">Create Privacy Policy Page</h4>
                                                    <p className="text-slate-500 text-sm font-light">Add a comprehensive privacy policy that covers data collection, cookies, and third-party advertising.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="liquid-glass-card rounded-[24px] p-6">
                                            <div className="relative z-10 flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl liquid-glass-icon flex items-center justify-center flex-shrink-0">
                                                    <span className="material-symbols-outlined text-slate-500">build</span>
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[9px] uppercase tracking-widest text-blue-600 font-bold mb-1 block">Fix</span>
                                                    <h4 className="text-base font-medium text-slate-800 mb-1">Implement Schema Markup</h4>
                                                    <p className="text-slate-500 text-sm font-light">Add Organization, WebSite, and Article schema to improve search visibility.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="liquid-glass-card rounded-[24px] p-6">
                                            <div className="relative z-10 flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl liquid-glass-icon flex items-center justify-center flex-shrink-0">
                                                    <span className="material-symbols-outlined text-slate-500">expand</span>
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[9px] uppercase tracking-widest text-purple-600 font-bold mb-1 block">Improve</span>
                                                    <h4 className="text-base font-medium text-slate-800 mb-1">Expand Thin Content Pages</h4>
                                                    <p className="text-slate-500 text-sm font-light">Add at least 500 words of valuable, original content to pages flagged as thin.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
