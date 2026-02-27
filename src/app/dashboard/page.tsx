"use client";
import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<"scans" | "sites" | "account">("scans");
    const [scans, setScans] = useState<any[]>([]);
    const [sites, setSites] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // UI state for adding new site
    const [newSiteDomain, setNewSiteDomain] = useState("");
    const [isAddingSite, setIsAddingSite] = useState(false);
    const [siteError, setSiteError] = useState<string | null>(null);

    const [userCredits, setUserCredits] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;
            setUser(authUser);

            // Fetch Scans
            const { data: scansData, error: scansError } = await supabase
                .from('adsense_scans')
                .select('*, sites(domain)')
                .order('created_at', { ascending: false });

            if (scansError) throw scansError;
            setScans(scansData || []);

            // Fetch Sites
            const { data: sitesData, error: sitesError } = await supabase
                .from('sites')
                .select('*')
                .eq('user_id', authUser.id)
                .order('created_at', { ascending: false });

            if (sitesError) throw sitesError;
            setSites(sitesData || []);

            // Fetch User Credits
            const { data: creditsData, error: creditsError } = await supabase
                .from('user_credits')
                .select('*')
                .eq('user_id', authUser.id)
                .single();

            if (creditsData) {
                setUserCredits(creditsData);
            }

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSiteDomain || !user) return;

        setIsAddingSite(true);
        setSiteError(null);

        // Normalize domain
        let domainToSubmit = newSiteDomain.trim();
        let urlToSubmit = domainToSubmit;

        if (!domainToSubmit.startsWith('http://') && !domainToSubmit.startsWith('https://')) {
            urlToSubmit = `https://${domainToSubmit}`;
        } else {
            // Extract domain from URL
            try {
                const url = new URL(domainToSubmit);
                domainToSubmit = url.hostname;
            } catch (e) {
                // Invalid URL format
            }
        }

        try {
            const res = await fetch('/api/sites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: urlToSubmit,
                    domain: domainToSubmit,
                    userId: user.id
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to add site');
            }

            // Refresh sites list
            setSites([data.site, ...sites]);
            setNewSiteDomain("");
        } catch (err: any) {
            setSiteError(err.message);
        } finally {
            setIsAddingSite(false);
        }
    };

    const handleDeleteSite = async (siteId: string) => {
        if (!confirm("Are you sure you want to delete this site? All associated past scans will also be correctly purged.") || !user) return;

        try {
            const res = await fetch(`/api/sites?id=${siteId}&userId=${user.id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete site');
            }

            // Remove from local state
            setSites(sites.filter(s => s.id !== siteId));
            setScans(scans.filter(s => s.site_id !== siteId));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const userPlan = userCredits?.plan_type || "free";
    const maxScans = userCredits?.scans_limit !== undefined ? userCredits.scans_limit : 3;
    const scansUsed = userCredits?.scans_used || 0;
    const scansLeft = maxScans === null ? "Unlimited" : Math.max(0, maxScans - scansUsed);
    const planNameDisplay = userPlan.charAt(0).toUpperCase() + userPlan.slice(1);


    const getVerdictBadge = (score: number) => {
        if (score >= 80) return { emoji: "✅", text: "Ready", bg: "bg-emerald-50", color: "text-emerald-600" };
        if (score >= 50) return { emoji: "⚠️", text: "Fix & Apply", bg: "bg-amber-50", color: "text-amber-600" };
        return { emoji: "❌", text: "Not Ready", bg: "bg-red-50", color: "text-red-600" };
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-500";
        if (score >= 60) return "text-amber-500";
        return "text-red-500";
    };

    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Header */}
                <section className="relative z-10 pt-32 md:pt-40 pb-8 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <span className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-medium mb-2 block">Dashboard</span>
                                <h1 className="text-3xl md:text-4xl font-extralight text-slate-900 tracking-tighter">
                                    Welcome back, {user?.user_metadata?.full_name?.split(" ")[0] || "User"}
                                </h1>
                            </div>
                            <Link
                                href="/analysis"
                                className="inline-flex items-center gap-2 px-6 py-3 liquid-glass-button-primary rounded-xl text-xs uppercase tracking-widest font-bold text-white"
                            >
                                <span className="material-symbols-outlined text-base">add</span>
                                New Scan
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Stats Bar */}
                <section className="relative z-10 py-6 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="liquid-glass-card rounded-[20px] p-5 text-center">
                                <div className="text-2xl md:text-3xl font-extralight text-slate-800 mb-1">{scans.length}</div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-400">Total Scans</div>
                            </div>
                            <div className="liquid-glass-card rounded-[20px] p-5 text-center">
                                <div className="text-2xl md:text-3xl font-extralight text-emerald-500 mb-1">
                                    {scans.filter(s => s.overall_score >= 80).length}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-400">Ready</div>
                            </div>
                            <div className="liquid-glass-card rounded-[20px] p-5 text-center">
                                <div className="text-2xl md:text-3xl font-extralight text-amber-500 mb-1">
                                    {scans.filter(s => s.overall_score < 80 && s.overall_score >= 50).length}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-400">Needs Work</div>
                            </div>
                            <div className="liquid-glass-card rounded-[20px] p-5 text-center">
                                <div className="text-2xl md:text-3xl font-extralight text-slate-800 mb-1">
                                    {scansLeft}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-400">Scans Left</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tabs */}
                <section className="relative z-10 py-8 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex gap-2 mb-8">
                            <button
                                onClick={() => setActiveTab("scans")}
                                className={`px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-medium transition-all ${activeTab === "scans"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500 hover:text-slate-800 liquid-glass-button"
                                    }`}
                            >
                                Scan History
                            </button>
                            <button
                                onClick={() => setActiveTab("sites")}
                                className={`px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-medium transition-all ${activeTab === "sites"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500 hover:text-slate-800 liquid-glass-button"
                                    }`}
                            >
                                Sites
                            </button>
                            <button
                                onClick={() => setActiveTab("account")}
                                className={`px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-medium transition-all ${activeTab === "account"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500 hover:text-slate-800 liquid-glass-button"
                                    }`}
                            >
                                Account
                            </button>
                        </div>

                        {/* Scans Tab */}
                        {activeTab === "scans" && (
                            <div className="space-y-4">
                                {scans.map((scan) => {
                                    const badge = getVerdictBadge(scan.overall_score);
                                    return (
                                        <div key={scan.id} className="liquid-glass-card rounded-[24px] p-6 group hover:bg-white/60 transition-all">
                                            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
                                                {/* URL & Date */}
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-light text-slate-800 mb-1">{scan.sites?.domain}</h3>
                                                    <p className="text-slate-400 text-xs">{new Date(scan.created_at).toLocaleDateString()}</p>
                                                </div>

                                                {/* Score */}
                                                <div className="flex items-center gap-6">
                                                    <div className="text-center">
                                                        <div className={`text-2xl font-extralight ${getScoreColor(scan.score)}`}>
                                                            {scan.score}
                                                        </div>
                                                        <div className="text-[9px] uppercase tracking-widest text-slate-400">Score</div>
                                                    </div>

                                                    {/* Verdict Badge */}
                                                    <div className={`px-3 py-1.5 rounded-full ${badge.bg}`}>
                                                        <span className={`text-xs font-medium ${badge.color}`}>
                                                            {badge.emoji} {badge.text}
                                                        </span>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/results?id=${scan.id}`}
                                                            className="w-10 h-10 rounded-xl liquid-glass-icon flex items-center justify-center hover:bg-white transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-slate-500 text-lg">visibility</span>
                                                        </Link>
                                                        <button className="w-10 h-10 rounded-xl liquid-glass-icon flex items-center justify-center hover:bg-white transition-all">
                                                            <span className="material-symbols-outlined text-slate-500 text-lg">refresh</span>
                                                        </button>
                                                        <button className="w-10 h-10 rounded-xl liquid-glass-icon flex items-center justify-center hover:bg-white transition-all">
                                                            <span className="material-symbols-outlined text-slate-500 text-lg">download</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {scans.length === 0 && (
                                    <div className="liquid-glass-card rounded-[32px] p-12 text-center">
                                        <div className="relative z-10">
                                            <span className="material-symbols-outlined text-slate-200 text-6xl mb-4">search_off</span>
                                            <h3 className="text-xl font-light text-slate-700 mb-2">No scans yet</h3>
                                            <p className="text-slate-400 text-sm mb-6">Start your first analysis to see results here.</p>
                                            <Link
                                                href="/analysis"
                                                className="inline-flex items-center gap-2 px-6 py-3 liquid-glass-button-primary rounded-xl text-xs uppercase tracking-widest font-bold text-white"
                                            >
                                                Start Analysis
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Sites Tab */}
                        {activeTab === "sites" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Add Site Card */}
                                <div className="liquid-glass-card rounded-[32px] p-8 lg:col-span-1 h-fit">
                                    <h3 className="text-lg font-light text-slate-800 mb-4">Add Project</h3>
                                    <p className="text-slate-500 text-sm font-light mb-6">Add a domain to your dashboard to organize your scans efficiently.</p>

                                    {siteError && (
                                        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                                            {siteError}
                                        </div>
                                    )}

                                    <form onSubmit={handleAddSite} className="space-y-4">
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-2 block">Domain URL</label>
                                            <input
                                                type="text"
                                                value={newSiteDomain}
                                                onChange={(e) => setNewSiteDomain(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:border-slate-300 focus:outline-none text-slate-800 text-sm font-light placeholder:text-slate-400"
                                                placeholder="example.com"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isAddingSite}
                                            className="w-full py-3 liquid-glass-button-primary rounded-xl text-xs uppercase tracking-widest font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isAddingSite ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <><span className="material-symbols-outlined text-[16px]">add</span> Add Site</>
                                            )}
                                        </button>
                                    </form>
                                </div>

                                {/* Sites List */}
                                <div className="lg:col-span-2 space-y-4">
                                    {sites.length === 0 ? (
                                        <div className="liquid-glass-card rounded-[32px] p-12 text-center h-full flex flex-col items-center justify-center">
                                            <span className="material-symbols-outlined text-slate-200 text-6xl mb-4">language</span>
                                            <h3 className="text-xl font-light text-slate-700 mb-2">No projects yet</h3>
                                            <p className="text-slate-400 text-sm">Add a project domain to organize your website optimization journey.</p>
                                        </div>
                                    ) : (
                                        sites.map(site => (
                                            <div key={site.id} className="liquid-glass-card rounded-[24px] p-6 hover:bg-white/60 transition-all flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-lg font-medium text-slate-800 flex items-center gap-2">
                                                        {site.domain}
                                                        <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600">
                                                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                                        </a>
                                                    </h4>
                                                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                                                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                                        Added {new Date(site.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-500">
                                                        {scans.filter(s => s.site_id === site.id).length} Scans
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteSite(site.id)}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                                        aria-label="Delete Site"
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Account Tab */}
                        {activeTab === "account" && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Profile Card */}
                                <div className="liquid-glass-card rounded-[32px] p-8">
                                    <div className="relative z-10">
                                        <h3 className="text-lg font-light text-slate-800 mb-6">Profile</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-2 block">Name</label>
                                                <input
                                                    type="text"
                                                    defaultValue={user?.user_metadata?.full_name || ""}
                                                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:border-slate-300 focus:outline-none text-slate-800 text-sm font-light"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-2 block">Email</label>
                                                <input
                                                    type="email"
                                                    defaultValue={user?.email || ""}
                                                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:border-slate-300 focus:outline-none text-slate-800 text-sm font-light"
                                                    readOnly
                                                />
                                            </div>
                                            <button className="w-full py-3 liquid-glass-button-primary rounded-xl text-xs uppercase tracking-widest font-bold text-white mt-4">
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Plan Card */}
                                <div className="liquid-glass-card-dark rounded-[32px] p-8">
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-light text-white">Your Plan</h3>
                                            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">{planNameDisplay}</span>
                                        </div>
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-white/60 text-sm">Scans Used</span>
                                                <span className="text-white text-sm">{scansUsed} {maxScans !== Infinity ? `/ ${maxScans}` : ""}</span>
                                            </div>
                                            {maxScans !== Infinity && (
                                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-white/60 rounded-full"
                                                        style={{ width: `${Math.min(100, (scansUsed / maxScans) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-white/40 text-xs mb-6">Member since {new Date(user?.created_at || new Date()).toLocaleDateString()}</div>
                                        <Link
                                            href="/pricing"
                                            className="block w-full py-3 liquid-glass-button-light rounded-xl text-xs uppercase tracking-widest font-bold text-slate-900 text-center"
                                        >
                                            Upgrade Plan
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
