"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ResultsContent } from "../results/page";
import Sidebar from "@/components/Sidebar";

/* ── helpers ── */
function timeAgo(dateStr: string) {
    if (!dateStr) return "Just now";
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

function getScoreColor(s: number) {
    if (s >= 80) return "text-emerald-500";
    if (s >= 50) return "text-amber-500";
    return "text-red-500";
}

function getScoreBg(s: number) {
    if (s >= 80) return "bg-emerald-500";
    if (s >= 50) return "bg-amber-500";
    return "bg-red-500";
}

function getVerdict(s: number) {
    if (s >= 80) return { icon: "check_circle", text: "Ready for AdSense", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" };
    if (s >= 50) return { icon: "warning", text: "Fix & Apply", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" };
    return { icon: "cancel", text: "Not Ready", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" };
}

function getCategoryBreakdown(core: any, trust: any, seo: any, security: any) {
    const c = (checks: boolean[]) => {
        const passed = checks.filter(Boolean).length;
        return { passed, total: checks.length, pct: checks.length ? Math.round((passed / checks.length) * 100) : 0 };
    };
    return [
        { name: "SEO", icon: "search", color: "#6366f1", ...c([!!core?.robots_txt?.exists, !!core?.sitemap_xml?.exists, !!seo?.canonical, !!seo?.title, !seo?.headings?.missing_h1]) },
        { name: "Content", icon: "article", color: "#a855f7", ...c([(core?.content_analysis?.word_count || 0) > 500, !core?.ai_policy?.policy_violations?.length, !core?.placeholder_content?.found]) },
        { name: "Security", icon: "verified_user", color: "#0ea5e9", ...c([core?.ssl_check?.status === "passed", security?.safe_browsing?.status === "safe", !security?.mixed_content]) },
        { name: "Policy", icon: "gavel", color: "#f59e0b", ...c([!!core?.ads_txt?.exists, !core?.banned_keywords?.found]) },
        { name: "Trust", icon: "fact_check", color: "#ec4899", ...c([!!trust?.summary?.privacy, !!trust?.summary?.contact, !!trust?.summary?.about]) },
        { name: "Performance", icon: "bolt", color: "#10b981", ...c([(core?.pagespeed?.mobile_score || 0) >= 50, !!core?.caching?.has_caching]) },
        { name: "Mobile", icon: "smartphone", color: "#14b8a6", ...c([!!core?.viewport?.exists, core?.touch_targets?.passed]) },
        { name: "Index", icon: "travel_explore", color: "#8b5cf6", ...c([!!core?.robots_txt?.exists, !!core?.sitemap_xml?.exists]) },
    ];
}

/* ── ScoreRing component ── */
function ScoreRing({ score, size = 180 }: { score: number; size?: number }) {
    const r = (size - 16) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    const gradId = `sr-${size}`;
    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke={`url(#${gradId})`}
                    strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                    className="dash-score-ring transition-all duration-1000 ease-out" />
                <defs>
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444"} />
                        <stop offset="100%" stopColor={score >= 80 ? "#059669" : score >= 50 ? "#d97706" : "#dc2626"} />
                    </linearGradient>
                </defs>
            </svg>
            <div className="text-center z-10">
                <span className="block text-4xl font-bold tracking-tight text-slate-800">{score}</span>
                <span className="block text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1">Score</span>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <React.Suspense fallback={<DashboardLoading />}>
            <DashboardContent />
        </React.Suspense>
    );
}

function DashboardLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    );
}


/* ═══════════════════ MAIN DASHBOARD ═══════════════════ */
function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlReportId = searchParams.get("report");
    
    // UI state
    const [viewingReportId, setViewingReportId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("overview");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Data state
    const [scans, setScans] = useState<any[]>([]);
    const [sites, setSites] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [newSiteDomain, setNewSiteDomain] = useState("");
    const [isAddingSite, setIsAddingSite] = useState(false);
    const [siteError, setSiteError] = useState<string | null>(null);
    const [userCredits, setUserCredits] = useState<any>(null);

    useEffect(() => { 
        if (urlReportId) {
            setViewingReportId(urlReportId);
        } else {
            setViewingReportId(null);
        }
        fetchData(); 
    }, [urlReportId]);

    // Auto-redirect to latest scan if a "Generate" or "Report" tab is clicked from dashboard
    useEffect(() => {
        const REPORT_TABS = [
            "report", "roadmap", "ai_assistant", "about", "contact", 
            "privacy", "disclaimer", "terms", "suggestions-content", 
            "suggestions-money", "suggestions-appeal"
        ];
        if (REPORT_TABS.includes(activeTab) && !viewingReportId && scans.length > 0) {
            const latestScan = scans.find(s => s.status === "completed") || scans[0];
            if (latestScan) {
                setViewingReportId(latestScan.id);
            }
        }
    }, [activeTab, viewingReportId, scans]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { user: authUser } } = await supabase.auth.getUser();
            
            // Allow guest access if not logged in
            let userId = authUser?.id || null;
            setUser(authUser || { email: "guest@ads2go.com", user_metadata: { full_name: "Guest User" } });

            // Fetch generic scans if guest, or user's scans if logged in
            let scansQuery = supabase.from('adsense_scans').select('*, sites(domain)').order('created_at', { ascending: false });
            let sitesQuery = supabase.from('sites').select('*').order('created_at', { ascending: false });
            let creditsQuery = supabase.from('user_credits').select('*');
            let notifsQuery = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(8);

            if (userId) {
                scansQuery = scansQuery.eq('user_id', userId);
                sitesQuery = sitesQuery.eq('user_id', userId);
                creditsQuery = creditsQuery.eq('user_id', userId);
                notifsQuery = notifsQuery.eq('user_id', userId);
            }
 else {
                scansQuery = scansQuery.limit(20); // only fetch 20 for guest to avoid overload
                sitesQuery = sitesQuery.limit(5);
            }

            const [scansRes, sitesRes, creditsRes, notifsRes] = await Promise.all([
                scansQuery, 
                sitesQuery, 
                userId ? creditsQuery.single() : Promise.resolve({ data: null }), 
                userId ? notifsQuery : Promise.resolve({ data: [] })
            ]);

            setScans(scansRes.data || []);
            setSites(sitesRes.data || []);
            if (creditsRes.data) setUserCredits(creditsRes.data);
            setNotifications(notifsRes.data || []);
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSiteDomain) return;
        setIsAddingSite(true);
        setSiteError(null);
        let domainToSubmit = newSiteDomain.trim();
        let urlToSubmit = domainToSubmit;
        if (!domainToSubmit.startsWith('http://') && !domainToSubmit.startsWith('https://')) {
            urlToSubmit = `https://${domainToSubmit}`;
        } else {
            try { domainToSubmit = new URL(domainToSubmit).hostname; } catch { }
        }
        try {
            const res = await fetch('/api/sites', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: urlToSubmit, domain: domainToSubmit, userId: user?.id || 'guest' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add site');
            setSites([data.site, ...sites]);
            setNewSiteDomain("");
        } catch (err: any) { setSiteError(err.message); }
        finally { setIsAddingSite(false); }
    };

    const handleDeleteSite = async (siteId: string) => {
        if (!confirm("Are you sure you want to delete this site? All associated past scans will also be correctly purged.")) return;
        try {
            const res = await fetch(`/api/sites?id=${siteId}&userId=${user?.id || 'guest'}`, { method: 'DELETE' });
            if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to delete site'); }
            setSites(sites.filter(s => s.id !== siteId));
            setScans(scans.filter(s => s.site_id !== siteId));
        } catch (err: any) { alert(err.message); }
    };

    const handleBackToDashboard = () => {
        setViewingReportId(null);
        setActiveTab("overview");
        router.push('/dashboard');
    };

    /* ── Computed data ── */
    const userPlan = userCredits?.plan_type || "free";
    const maxScans = userCredits?.scans_limit !== undefined ? userCredits.scans_limit : 3;
    const scansUsed = userCredits?.scans_used || 0;
    const scansLeft = maxScans === null ? "∞" : Math.max(0, maxScans - scansUsed);
    const planName = userPlan.charAt(0).toUpperCase() + userPlan.slice(1);

    const completedScans = scans.filter(s => s.status === "completed" && s.overall_score != null);
    const latestScan = completedScans[0] || null;
    const avgScore = completedScans.length ? Math.round(completedScans.reduce((a: number, s: any) => a + (s.overall_score || 0), 0) / completedScans.length) : 0;
    const bestScore = completedScans.length ? Math.max(...completedScans.map((s: any) => s.overall_score || 0)) : 0;
    const readyCount = completedScans.filter((s: any) => s.overall_score >= 80).length;
    const needsWorkCount = completedScans.filter((s: any) => s.overall_score < 80 && s.overall_score >= 50).length;
    const latestCore = latestScan?.core_scan_data || {};
    const latestTrust = latestScan?.trust_pages_data || {};
    const latestSeo = latestScan?.seo_indexing_data || {};
    const latestSecurity = latestScan?.security_data || {};
    const categories = latestScan ? getCategoryBreakdown(latestCore, latestTrust, latestSeo, latestSecurity) : [];
    const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "User";

    const navItems = [
        { id: "overview" as const, label: "Overview", icon: "dashboard" },
        { id: "sites" as const, label: "Projects", icon: "language" },
        { id: "account" as const, label: "Settings", icon: "settings" },
    ];

    if (loading) return <DashboardLoading />;

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
            
            <Sidebar 
                activeTab={activeTab} 
                setActiveTab={(tab: string) => {
                    if (["overview", "new-scan", "sites", "account"].includes(tab)) {
                        setViewingReportId(null);
                    }
                    setActiveTab(tab);
                }} 
                isMobileOpen={isSidebarOpen} 
                setIsMobileOpen={setIsSidebarOpen}
                isReportView={!!viewingReportId}
                user={user}
            />

            {/* ═══ MAIN CONTENT AREA ═══ */}
            <main className="flex-1 flex flex-col relative z-0 overflow-hidden bg-[#F8FAFC]">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-10 shrink-0 shadow-sm">
                    <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-lg">
                        <span className="material-symbols-outlined text-indigo-500">rocket_launch</span>
                        <span className="text-slate-900">Ads2Go</span>
                    </Link>
                    <div className="w-10 h-10"></div> {/* Spacer */}
                </header>

                {/* Content Stream */}
                <div className="flex-1 overflow-y-auto no-scrollbar relative w-full h-full">
                    {viewingReportId ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both pb-10">
                            <ResultsContent 
                                scanIdProp={viewingReportId || undefined} 
                                isDashboard={true} 
                                onBack={handleBackToDashboard} 
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                            />
                        </div>
                    ) : (
                        <div className="pb-16 px-4 md:px-8 max-w-[1400px] mx-auto w-full animate-in fade-in zoom-in-95 duration-400">
                            
                            {/* Dashboard Top Header */}
                            <header className="py-8 md:py-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                                <div>
                                    <span className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold mb-2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        System Active
                                    </span>
                                    <h1 className="text-3xl md:text-5xl font-extralight text-slate-900 tracking-tighter">
                                        Hi, <span className="font-semibold">{firstName}</span>
                                    </h1>
                                    <p className="text-slate-500 text-sm mt-3 font-medium">Here's what's happening with your AdSense projects today.</p>
                                </div>
                                <Link href="/analysis" className="inline-flex items-center gap-2.5 px-8 py-4 bg-slate-900 hover:bg-black rounded-2xl text-xs uppercase tracking-widest font-bold text-white shadow-xl shadow-slate-900/20 transition-all active:scale-95 group">
                                    <span className="material-symbols-outlined text-base group-hover:rotate-90 transition-transform">add</span>
                                    Start Deep Scan
                                </Link>
                            </header>

                            {/* ═══════ OVERVIEW TAB ═══════ */}
                            {activeTab === "overview" && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* ═══ STATS GRID ═══ */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                        {[
                                            { label: "Network Health", value: `${avgScore}%`, sub: "Avg Readiness", iconUrl: "https://img.icons8.com/plumpy/96/heart-with-pulse.png", color: "text-indigo-600", bg: "bg-indigo-50/30", border: "border-indigo-100/50", trend: "+2.4%" },
                                            { label: "Ready Sites", value: readyCount, sub: "Pass AdSense", iconUrl: "https://img.icons8.com/plumpy/96/approval.png", color: "text-emerald-600", bg: "bg-emerald-50/30", border: "border-emerald-100/50", trend: "+1" },
                                            { label: "Needs Review", value: needsWorkCount, sub: "Pending Fixes", iconUrl: "https://img.icons8.com/plumpy/96/laptop-error.png", color: "text-amber-600", bg: "bg-amber-50/30", border: "border-amber-100/50", trend: "stable" },
                                            { label: "Total Analysis", value: scans.length, sub: "Lifetime Scans", iconUrl: "https://img.icons8.com/plumpy/96/financial-growth-analysis.png", color: "text-slate-700", bg: "bg-white", border: "border-slate-200/60", trend: `+${scans.length > 5 ? 5 : scans.length}` },
                                        ].map((stat) => (
                                            <div key={stat.label} className={`group relative rounded-[32px] p-6 border ${stat.border} ${stat.bg} shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1.5 overflow-hidden`}>
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                                                <div className="relative z-10 flex flex-col gap-5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:rotate-[15deg] transition-transform duration-500">
                                                            <img src={stat.iconUrl} alt={stat.label} className="w-7 h-7 object-contain" />
                                                        </div>
                                                        {stat.trend !== "stable" && (
                                                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                {stat.trend}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter mb-1 select-none">{stat.value}</div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-black">{stat.label}</span>
                                                            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{stat.sub}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>


                                    {/* LATEST SCAN SPOTLIGHT */}
                                    {latestScan ? (
                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                            {/* Spotlight Card */}
                                            <div className="xl:col-span-2 bg-white rounded-[32px] p-8 md:p-12 border border-slate-200/80 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-[100px] opacity-70 pointer-events-none"></div>
                                                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                                                    {/* Score Ring */}
                                                    <div className="flex-shrink-0 relative">
                                                        <div className="absolute inset-0 bg-white shadow-2xl shadow-indigo-500/10 rounded-full blur-xl"></div>
                                                        <ScoreRing score={latestScan.overall_score || 0} size={180} />
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 text-center md:text-left">
                                                        <span className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold mb-3 block">Latest Analysis</span>
                                                        <h2 className="text-3xl font-light text-slate-800 tracking-tight mb-2 truncate max-w-sm">{latestScan.sites?.domain || "Unknown Website"}</h2>
                                                        <p className="text-slate-400 text-xs font-medium bg-slate-50 inline-block px-3 py-1 rounded-full mb-6 border border-slate-100">{timeAgo(latestScan.created_at)}</p>

                                                        {/* Category Breakdown */}
                                                        <div className="flex flex-wrap items-center gap-3 md:gap-5 mb-10 justify-center md:justify-start">
                                                            {categories.map(cat => (
                                                                <div key={cat.name} className="flex flex-col items-center group/cat">
                                                                    <div className="w-12 h-12 rounded-[18px] bg-white border border-slate-100 flex items-center justify-center mb-2.5 shadow-sm group-hover/cat:-translate-y-1 transition-transform duration-500">
                                                                        <span className="material-symbols-outlined text-xl" style={{ color: cat.color }}>{cat.icon}</span>
                                                                    </div>
                                                                    <div className="w-full max-w-[32px] h-1 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                                                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}></div>
                                                                    </div>
                                                                    <div className="text-[9px] uppercase tracking-[0.15em] text-slate-400 font-black group-hover/cat:text-slate-600 transition-colors">{cat.name}</div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row items-center gap-5">
                                                            <button onClick={() => router.push(`/dashboard?report=${latestScan.id}`)}
                                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4.5 bg-slate-900 hover:bg-black rounded-[20px] text-xs uppercase tracking-[0.2em] font-black text-white shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">
                                                                <span className="material-symbols-outlined text-xl font-bold">analytics</span>
                                                                Explore Report
                                                            </button>
                                                            {(() => {
                                                                const v = getVerdict(latestScan.overall_score || 0);
                                                                return (
                                                                    <div className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4.5 rounded-[20px] ${v.bg} border ${v.border} backdrop-blur-md`}>
                                                                        <span className={`material-symbols-outlined text-xl ${v.color}`}>{v.icon}</span>
                                                                        <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${v.color}`}>{v.text}</span>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Activity Feed */}
                                            <div className="bg-white/70 backdrop-blur-xl rounded-[40px] p-8 border border-slate-200/60 shadow-sm flex flex-col h-full group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-xl">dataset</span>
                                                        </div>
                                                        <h3 className="text-sm uppercase tracking-[0.2em] text-slate-800 font-black">Live Activity</h3>
                                                    </div>
                                                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Clear</button>
                                                </div>
                                                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2 relative">
                                                    {/* Timeline line */}
                                                    <div className="absolute left-[19px] top-2 bottom-6 w-[2px] bg-slate-100 rounded-full"></div>
                                                    
                                                    {notifications.length === 0 && scans.length === 0 ? (
                                                        <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                                                <span className="material-symbols-outlined text-slate-200 text-3xl">mail</span>
                                                            </div>
                                                            <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest">No recent signals</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Real Notifications first */}
                                                            {notifications.map((n) => (
                                                                <div key={n.id} className="flex items-start gap-4 relative z-10 group/item">
                                                                    <div className="w-10 h-10 rounded-2xl bg-white border-2 border-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm group-hover/item:scale-110 transition-transform">
                                                                        <span className="material-symbols-outlined text-indigo-500 text-[18px]">
                                                                            {n.type === "scan_complete" ? "check_circle" : n.type === "score_change" ? "trending_up" : "info"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="min-w-0 pt-0.5 flex-1">
                                                                        <p className="text-xs font-bold text-slate-800 break-words leading-snug">{n.message || n.title}</p>
                                                                        <p className="text-[9px] uppercase font-black text-slate-400 mt-1.5 tracking-wider flex items-center gap-2">
                                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                            {timeAgo(n.created_at)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            
                                                            {/* Derived Activity from scans if needed */}
                                                            {scans.slice(0, 5).map((scan) => (
                                                                <div key={`act-${scan.id}`} className="flex items-start gap-4 relative z-10 group/item">
                                                                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm group-hover/item:scale-110 transition-transform">
                                                                        <span className={`material-symbols-outlined text-[18px] ${scan.overall_score >= 80 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                            {scan.overall_score >= 80 ? 'verified' : 'task_alt'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="min-w-0 pt-0.5 flex-1">
                                                                        <p className="text-xs font-bold text-slate-700 break-words leading-snug group-hover/item:text-slate-900 transition-colors">
                                                                            Analysis for <span className="text-indigo-600">{scan.sites?.domain}</span> updated.
                                                                        </p>
                                                                        <div className="flex items-center gap-2 mt-1.5">
                                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${scan.overall_score >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                                {scan.overall_score}/100
                                                                            </span>
                                                                            <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-2">
                                                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                                {timeAgo(scan.created_at)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-[32px] p-16 md:p-24 border border-slate-200/80 shadow-sm text-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none"></div>
                                            <div className="relative z-10">
                                                <div className="w-24 h-24 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                                    <span className="material-symbols-outlined text-indigo-300 text-5xl">monitoring</span>
                                                </div>
                                                <h3 className="text-2xl font-light text-slate-800 mb-3 tracking-tight">No scans yet</h3>
                                                <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">Let's get started by running your first AdSense readiness analysis. It only takes a minute.</p>
                                                <Link href="/analysis" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 border border-slate-800 rounded-xl text-xs uppercase tracking-widest font-bold text-white shadow-xl shadow-slate-900/10 hover:bg-black transition-all active:scale-95">
                                                    <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                                                    Start First Scan
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {/* All Scan History */}
                                    <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-200/80 shadow-sm overflow-hidden mt-8">
                                        <div className="flex items-center justify-between mb-8 px-2">
                                            <h3 className="text-sm uppercase tracking-widest text-slate-800 font-bold flex items-center gap-2">
                                                <span className="material-symbols-outlined text-slate-400">history</span>
                                                Scan History
                                            </h3>
                                        </div>
                                        <div className="space-y-3">
                                            {completedScans.length === 0 ? (
                                                <div className="py-12 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100">No history available</div>
                                            ) : completedScans.slice(0, 10).map((scan: any, idx: number) => {
                                                const prevScan = completedScans[idx + 1];
                                                const trend = prevScan ? (scan.overall_score || 0) - (prevScan.overall_score || 0) : 0;
                                                const v = getVerdict(scan.overall_score || 0);
                                                return (
                                                    <div key={scan.id} className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-6 md:py-5 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className={`w-12 h-12 rounded-[16px] ${v.bg} border ${v.border} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                                <span className={`material-symbols-outlined text-xl ${v.color}`}>{v.icon}</span>
                                                            </div>
                                                            <div className="min-w-0 pr-4">
                                                                <h4 className="text-base font-semibold text-slate-800 truncate">{scan.sites?.domain || "Unknown Domain"}</h4>
                                                                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-medium tracking-wide">
                                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {timeAgo(scan.created_at)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-row md:flex-row items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0">
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-right">
                                                                    <div className="flex items-baseline justify-end gap-0.5">
                                                                        <span className={`text-2xl font-light leading-none tracking-tight ${getScoreColor(scan.overall_score || 0)}`}>{scan.overall_score}</span>
                                                                        <span className="text-[10px] font-bold text-slate-300">/100</span>
                                                                    </div>
                                                                    {trend !== 0 && (
                                                                        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-widest ${trend > 0 ? "text-emerald-500" : "text-red-500"}`}>
                                                                            <span className="material-symbols-outlined text-[12px]">{trend > 0 ? "trending_up" : "trending_down"}</span>
                                                                            {Math.abs(trend)} pts
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="hidden sm:block w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full transition-all duration-1000 ${getScoreBg(scan.overall_score || 0)}`}
                                                                        style={{ width: `${scan.overall_score || 0}%` }}></div>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <Link href="/analysis" className="w-10 h-10 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-colors border border-transparent hover:border-slate-200" title="Re-scan domain">
                                                                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                                                                </Link>
                                                                <button onClick={() => router.push(`/dashboard?report=${scan.id}`)}
                                                                    className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-black shadow-md shadow-slate-900/10 active:scale-95 transition-all w-24 flex items-center justify-center">
                                                                    View
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═══════ PROJECTS TAB ═══════ */}
                            {activeTab === "sites" && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="lg:col-span-1">
                                        <div className="bg-white rounded-[32px] p-8 border border-slate-200/80 shadow-sm sticky top-8">
                                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 shadow-sm border border-indigo-100">
                                                <span className="material-symbols-outlined text-2xl">add</span>
                                            </div>
                                            <h3 className="text-xl font-light text-slate-800 mb-2">New Project</h3>
                                            <p className="text-slate-500 text-sm font-medium mb-8">Add a domain to your portfolio to track its AdSense readiness over time.</p>
                                            
                                            {siteError && (
                                                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex gap-3">
                                                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                                                    <span className="font-medium leading-relaxed">{siteError}</span>
                                                </div>
                                            )}
                                            
                                            <form onSubmit={handleAddSite} className="space-y-5">
                                                <div>
                                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block ml-1">Domain URL</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">language</span>
                                                        <input type="text" value={newSiteDomain} onChange={(e) => setNewSiteDomain(e.target.value)}
                                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-800 text-sm font-medium transition-all"
                                                            placeholder="example.com" required />
                                                    </div>
                                                </div>
                                                <button type="submit" disabled={isAddingSite}
                                                    className="w-full py-4 bg-slate-900 border border-slate-800 rounded-xl text-xs uppercase tracking-widest font-bold text-white shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 hover:bg-black disabled:opacity-50 active:scale-95 transition-all">
                                                    {isAddingSite ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : "Add Project"}
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2 space-y-4">
                                        {sites.length === 0 ? (
                                            <div className="bg-white rounded-[32px] p-16 border border-slate-200/80 shadow-sm text-center h-full flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-6">
                                                    <span className="material-symbols-outlined text-slate-300 text-4xl">inventory_2</span>
                                                </div>
                                                <h3 className="text-xl font-light text-slate-800 mb-2">No projects yet</h3>
                                                <p className="text-slate-500 text-sm max-w-xs mx-auto">Projects you add will appear here. Start by adding your first domain.</p>
                                            </div>
                                        ) : sites.map(site => {
                                            const siteScans = scans.filter(s => s.site_id === site.id);
                                            const bestSiteScore = siteScans.length ? Math.max(...siteScans.map((s: any) => s.overall_score || 0)) : null;
                                            return (
                                                <div key={site.id} className="bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                                                            <span className="material-symbols-outlined text-2xl text-indigo-500">public</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-medium text-slate-800 flex items-center gap-2">
                                                                {site.domain}
                                                                <a href={site.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-500 transition-all p-1 bg-slate-50 rounded-md">
                                                                    <span className="material-symbols-outlined text-xs block">open_in_new</span>
                                                                </a>
                                                            </h4>
                                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                                Added {new Date(site.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col items-end border-r border-slate-100 pr-5">
                                                            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Best Score</span>
                                                            <div className="flex items-baseline gap-0.5 mt-0.5">
                                                                {bestSiteScore !== null ? (
                                                                    <>
                                                                    <span className={`text-xl font-light leading-none ${getScoreColor(bestSiteScore)}`}>{bestSiteScore}</span>
                                                                    <span className="text-[10px] text-slate-300 font-bold">/100</span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-slate-300 text-sm font-medium">N/A</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end border-r border-slate-100 pr-5">
                                                            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Total Scans</span>
                                                            <span className="text-xl font-light text-slate-700 leading-none mt-0.5">{siteScans.length}</span>
                                                        </div>
                                                        <button onClick={() => handleDeleteSite(site.id)}
                                                            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all ml-1 border border-transparent hover:border-red-100"
                                                            title="Delete Project">
                                                            <span className="material-symbols-outlined text-xl">delete_outline</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ═══════ SETTINGS TAB ═══════ */}
                            {activeTab === "account" && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-200/80 shadow-sm">
                                        <div className="flex items-start gap-6 mb-10">
                                            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white shrink-0">
                                                <span className="text-3xl font-light">{firstName[0]}</span>
                                            </div>
                                            <div className="pt-2">
                                                <h3 className="text-2xl font-light text-slate-800 tracking-tight">{user?.user_metadata?.full_name || "User"}</h3>
                                                <p className="text-sm font-medium text-slate-500 mt-1">{user?.email}</p>
                                                <span className="mt-3 inline-block px-3 py-1 bg-slate-100 rounded-full text-[10px] uppercase font-bold tracking-widest text-slate-500">Member</span>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block ml-1">Full Name</label>
                                                <input type="text" defaultValue={user?.user_metadata?.full_name || ""}
                                                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-800 text-sm font-medium transition-all" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block ml-1">Email <span className="lowercase text-[9px] font-medium opacity-50 ml-2 border border-slate-200 px-1.5 py-0.5 rounded">non-editable</span></label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300">lock</span>
                                                    <input type="email" defaultValue={user?.email || ""} readOnly
                                                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50/50 border border-slate-100 text-slate-400 text-sm font-medium cursor-not-allowed select-none" />
                                                </div>
                                            </div>
                                            <div className="pt-4">
                                                <button className="w-full py-4 bg-slate-900 hover:bg-black border border-slate-800 rounded-xl text-xs uppercase tracking-widest font-bold text-white shadow-xl shadow-slate-900/10 active:scale-95 transition-all">
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 rounded-[32px] p-8 md:p-10 shadow-xl shadow-slate-900/10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-indigo-500/20 to-purple-500/0 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:translate-x-1/4 transition-transform duration-1000"></div>
                                        <div className="relative z-10 h-full flex flex-col">
                                            <div className="flex flex-col mb-10">
                                                <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-3 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-sm">workspace_premium</span> Current Plan
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-3xl md:text-4xl font-light text-white tracking-tight capitalize">{planName}</h3>
                                                    <span className="px-3 py-1 bg-white/10 border border-white/5 rounded-full text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Active</span>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-6 flex-1">
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between backdrop-blur-sm">
                                                    <div>
                                                        <span className="text-slate-400 text-xs block mb-1">Scans Used</span>
                                                        <span className="text-white font-medium text-lg">{scansUsed} <span className="text-slate-500 text-sm">{maxScans !== null ? `/ ${maxScans}` : "/ ∞"}</span></span>
                                                    </div>
                                                    {maxScans !== null && (
                                                        <div className="w-24">
                                                            <div className="flex justify-end mb-2 text-[10px] font-bold text-indigo-300">{Math.round((scansUsed / maxScans) * 100)}%</div>
                                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${Math.min(100, (scansUsed / maxScans) * 100)}%` }}></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between backdrop-blur-sm">
                                                    <div>
                                                        <span className="text-slate-400 text-xs block mb-1">Average Network Score</span>
                                                        <span className="text-white font-medium text-lg">{avgScore} <span className="text-slate-500 text-sm">/100</span></span>
                                                    </div>
                                                    <div className={`w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center shadow-inner ${avgScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' : avgScore >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        <span className="material-symbols-outlined">analytics</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-8 mt-auto">
                                                <Link href="/pricing" className="block w-full py-4 bg-white text-slate-900 border border-white rounded-xl text-xs uppercase tracking-widest font-bold text-center shadow-lg shadow-white/10 hover:bg-slate-50 active:scale-95 transition-all">
                                                    Explore Pro Plans
                                                </Link>
                                                <p className="text-center text-[10px] text-slate-500 font-medium mt-4 flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[12px]">verified_user</span> Secure billing via Stripe</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
