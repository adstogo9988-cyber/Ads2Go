"use client";
import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<"scans" | "account">("scans");
    const [scans, setScans] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    const userPlan = user?.user_metadata?.plan || "free";
    const planLimits: Record<string, number> = {
        free: 3,
        weekly: 5,
        monthly: 30,
        lifetime: Infinity
    };
    const maxScans = planLimits[userPlan] || 3;
    const cycleDays = userPlan === 'weekly' ? 7 : 30;
    const cycleStart = new Date();
    cycleStart.setDate(cycleStart.getDate() - cycleDays);
    const scansUsed = scans.filter(s => new Date(s.created_at) >= cycleStart).length;
    const scansLeft = maxScans === Infinity ? "Unlimited" : Math.max(0, maxScans - scansUsed);
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
