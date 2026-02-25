"use client";
import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function RoadmapPage() {
    const [completedPhases, setCompletedPhases] = useState<number[]>([1]); // Phase 1 completed by default
    const currentPhase = 2; // Currently in Phase 2

    // Strategic phases data
    const phases = [
        {
            id: 1,
            title: "Structural Integrity",
            status: "completed",
            icon: "architecture",
            tasks: [
                { icon: "data_object", text: "JSON-LD Schema Verification", active: true },
                { icon: "grid_view", text: "DOM Tree Optimization", active: true },
            ]
        },
        {
            id: 2,
            title: "Semantic Alignment",
            status: "in-progress",
            icon: "psychology",
            tasks: [
                { icon: "topic", text: "Content Cluster Mapping", active: true },
                { icon: "translate", text: "Linguistic Sentiment Analysis", active: true },
                { icon: "key", text: "Keyword Density Normalization", active: false },
            ]
        },
        {
            id: 3,
            title: "Technical Performance",
            status: "pending",
            icon: "speed",
            description: "Core Web Vitals and LCP benchmarking scheduled for post-semantic phase."
        },
        {
            id: 4,
            title: "Policy Compliance",
            status: "pending",
            icon: "gavel",
            description: "Automated scan for TOS violations and privacy alignment."
        },
        {
            id: 5,
            title: "Final Verification",
            status: "pending",
            icon: "rocket_launch",
            description: "Final AI-audit before AdSense submission gateway."
        }
    ];

    // Calculate progress
    const totalPhases = phases.length;
    const completedCount = completedPhases.length;
    const currentProgress = 64;
    const targetProgress = 98;

    const getStatusIcon = (status: string, id: number) => {
        if (status === "completed") {
            return <span className="material-symbols-outlined text-[#135bec]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>;
        }
        if (status === "in-progress") {
            return <span className="material-symbols-outlined text-[#135bec] animate-pulse">play_circle</span>;
        }
        if (id === 5) {
            return <span className="material-symbols-outlined text-slate-300">verified</span>;
        }
        return <span className="material-symbols-outlined text-slate-300">circle</span>;
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "completed": return { text: "Completed", color: "text-emerald-500" };
            case "in-progress": return { text: "In-Progress", color: "text-[#135bec]" };
            default: return { text: "Pending", color: "text-slate-400" };
        }
    };

    // Get current date
    const lastUpdated = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col relative z-10">
                {/* Hero Section */}
                <section className="relative z-10 pt-32 md:pt-40 pb-8 px-4 sm:px-6">
                    <div className="max-w-[800px] mx-auto">
                        <p className="text-[#135bec] font-bold tracking-widest text-xs uppercase mb-4">Strategic Intelligence</p>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight text-slate-900 mb-4">
                            Fix Roadmap
                        </h1>
                        <p className="text-[#4c669a] text-lg max-w-xl leading-relaxed">
                            Systematic execution path to achieve full monetization readiness.
                            A prioritized masterplan for enterprise AdSense alignment.
                        </p>
                    </div>
                </section>

                {/* Overall Progress Section */}
                <section className="relative z-10 py-6 px-4 sm:px-6">
                    <div className="max-w-[800px] mx-auto">
                        <div className="liquid-glass-card rounded-2xl p-8 flex flex-col gap-6">
                            <div className="relative z-10 flex items-end justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Status</span>
                                    <p className="text-4xl font-black text-[#135bec]">{currentProgress}%</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Post-Execution Target</span>
                                    <p className="text-xl font-bold text-slate-800">{targetProgress}%</p>
                                </div>
                            </div>
                            <div className="relative z-10 w-full h-4 bg-[#135bec]/10 rounded-full overflow-hidden">
                                <div
                                    className="absolute left-0 top-0 h-full bg-[#135bec] rounded-full transition-all duration-700"
                                    style={{
                                        width: `${currentProgress}%`,
                                        boxShadow: '0 0 20px rgba(19, 91, 236, 0.4)'
                                    }}
                                />
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-slate-500">
                                <span className="material-symbols-outlined text-sm">info</span>
                                <p className="text-xs font-medium">8 optimization modules remaining to reach certification threshold.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Strategic Phases Timeline */}
                <section className="relative z-10 py-8 px-4 sm:px-6">
                    <div className="max-w-[800px] mx-auto">
                        {/* Section Header */}
                        <div className="flex items-center justify-between px-2 mb-8">
                            <h2 className="text-xl font-bold text-slate-800">Strategic Phases</h2>
                            <span className="text-xs font-medium bg-white/50 px-3 py-1.5 rounded-full border border-slate-200/50">
                                {phases.length} Phases Defined
                            </span>
                        </div>

                        {/* Timeline */}
                        <div className="relative flex flex-col">
                            {/* Vertical Line Connector */}
                            <div className="absolute left-[27px] top-6 bottom-6 w-[1.5px] bg-slate-200" />

                            {phases.map((phase, index) => {
                                const statusInfo = getStatusText(phase.status);
                                const isActive = phase.status === "in-progress";
                                const isPending = phase.status === "pending";

                                return (
                                    <div
                                        key={phase.id}
                                        className={`relative pl-16 ${index < phases.length - 1 ? 'pb-8' : 'pb-4'} group ${isPending ? 'opacity-60' : ''}`}
                                    >
                                        {/* Phase Icon Circle */}
                                        <div className={`absolute left-0 top-1 w-14 h-14 rounded-full bg-white/60 backdrop-blur-md border flex items-center justify-center z-10 ${isActive ? 'border-[#135bec]/30 ring-4 ring-[#135bec]/10' : 'border-slate-200'}`}>
                                            {getStatusIcon(phase.status, phase.id)}
                                        </div>

                                        {/* Phase Card */}
                                        <div className={`liquid-glass-card p-6 rounded-2xl hover:translate-x-1 transition-transform duration-300 ${isActive ? 'border-[#135bec]/20' : ''}`}>
                                            <div className="relative z-10 flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800">Phase {phase.id}: {phase.title}</h3>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${statusInfo.color}`}>
                                                        {statusInfo.text}
                                                    </span>
                                                </div>
                                                <span className="material-symbols-outlined text-slate-300">{phase.icon}</span>
                                            </div>

                                            {/* Tasks or Description */}
                                            <div className="relative z-10">
                                                {phase.tasks ? (
                                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {phase.tasks.map((task, taskIndex) => (
                                                            <li
                                                                key={taskIndex}
                                                                className={`flex items-center gap-2 text-sm text-slate-600 ${phase.status === "completed" ? 'opacity-70' :
                                                                    task.active === false ? 'opacity-40' : ''
                                                                    }`}
                                                            >
                                                                <span className={`material-symbols-outlined text-[16px] ${isActive && task.active !== false ? 'text-[#135bec]' : 'text-slate-400'
                                                                    }`}>
                                                                    {task.icon}
                                                                </span>
                                                                <span>{task.text}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-slate-500 italic">{phase.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Footer Utility */}
                <section className="relative z-10 py-8 px-4 sm:px-6">
                    <div className="max-w-[800px] mx-auto">
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/50 pt-8 gap-4">
                            <div className="flex items-center gap-6">
                                <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors">
                                    <span className="material-symbols-outlined text-sm">download</span>
                                    Export Strategy PDF
                                </button>
                                <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors">
                                    <span className="material-symbols-outlined text-sm">share</span>
                                    Share with Stakeholders
                                </button>
                            </div>
                            <p className="text-[10px] font-medium text-slate-300 uppercase tracking-tighter">
                                Last updated: {lastUpdated}
                            </p>
                        </div>

                        {/* Back Link */}
                        <div className="text-center mt-12">
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
        </>
    );
}
