"use client";
import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { 
    ArrowRight,
    Copy,
    Check,
} from "lucide-react";

export default function APIDocs() {
    const [activeSection, setActiveSection] = useState("setup");

    const sidebarItems = [
        { id: "setup", label: "Guide: Setup", icon: "settings" },
        { id: "requests", label: "Guide: Requests", icon: "terminal" },
        { id: "callbacks", label: "Guide: Callbacks", icon: "webhook" },
        { id: "errors", label: "Guide: Errors", icon: "error" },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-[#fcfdfe] selection:bg-[#333a4a]/10 selection:text-[#333a4a]">
            <Navbar />
            
            <div className="flex-1 w-full max-w-7xl mx-auto px-6 pt-32">
                <div className="flex flex-col lg:flex-row gap-20 relative">
                    
                    {/* ── Sidebar ── */}
                    <aside className="hidden lg:flex sticky top-32 h-fit w-56 flex-col gap-8 z-20">
                        <Link href="/api" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 hover:text-slate-900 flex items-center gap-3 transition-all mb-4 px-3">
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Back to Overview
                        </Link>
                        <nav className="flex flex-col gap-2">
                            {sidebarItems.map((item) => (
                                <Link 
                                    key={item.id}
                                    href={`#${item.id}`}
                                    className={`group flex items-center gap-4 py-2 px-3 transition-all duration-300 relative rounded-xl ${
                                        activeSection === item.id 
                                        ? "text-slate-900 font-bold" 
                                        : "text-slate-400 hover:text-slate-600 font-medium"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[16px] font-thin">
                                        {item.icon}
                                    </span>
                                    <span className="text-[13px] tracking-tight">{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </aside>

                    {/* ── Main Content ── */}
                    <main className="flex-1 min-w-0">
                        <div className="max-w-3xl space-y-48 pb-60">
                            
                            {/* Setup */}
                            <section id="setup" className="scroll-mt-40">
                                <span className="text-[11px] uppercase tracking-[0.4em] text-slate-300 font-black mb-6 block">Section 01</span>
                                <h1 className="text-5xl md:text-[60px] font-light text-slate-900 tracking-tighter leading-none mb-12">
                                    Technical <br />Infrastructure.
                                </h1>
                                <div className="p-10 rounded-[32px] bg-white border border-slate-100 shadow-sm">
                                    <h3 className="text-sm font-black uppercase tracking-widest mb-6">Environment Configuration</h3>
                                    <p className="text-sm text-slate-400 font-light leading-relaxed mb-10">
                                        Every Ad2Vo integration begins with a secure handshake. Ensure your environment is configured to point at our neural nodes.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 bg-slate-50 rounded-2xl">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Production Node</span>
                                            <code className="text-xs text-[#333a4a]">api.ad2vo.com/v1</code>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-2xl">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Security Standard</span>
                                            <code className="text-xs text-[#333a4a]">TLS 1.3 / HMAC</code>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Requests */}
                            <section id="requests" className="scroll-mt-40">
                                <h2 className="text-2xl font-bold text-slate-900 mb-8 tracking-tight">Request Protocol</h2>
                                <div className="p-10 rounded-[32px] bg-white border border-slate-100 shadow-sm">
                                    <p className="text-sm text-slate-400 font-light leading-relaxed mb-8">
                                        Submitting an asset for analysis requires a specific JSON payload. The engine supports high-depth traversal and intelligent caching.
                                    </p>
                                    <div className="bg-[#333a4a] rounded-[24px] p-8 font-mono text-[11px] text-slate-300 relative overflow-hidden group mb-8">
                                        <span className="absolute top-4 right-8 text-[8px] uppercase tracking-[0.4em] font-black text-white/10">POST Payload</span>
                                        {`{
  "site_url": "https://example.com",
  "audit_type": "NEURAL_FULL",
  "priority": "system_high",
  "webhook": "https://callback.io"
}`}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 flex-shrink-0">1</div>
                                            <div className="text-xs text-slate-500 font-medium leading-relaxed">System validates the workspace credit balance before initiation.</div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 flex-shrink-0">2</div>
                                            <div className="text-xs text-slate-500 font-medium leading-relaxed">Engine assigns a global trace-id for the request lifetime.</div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Callbacks */}
                            <section id="callbacks" className="scroll-mt-40">
                                <h2 className="text-2xl font-bold text-slate-900 mb-8 tracking-tight">Callback Implementation</h2>
                                <div className="p-10 rounded-[32px] bg-white border border-slate-100 shadow-sm">
                                    <p className="text-sm text-slate-400 font-light leading-relaxed mb-8">
                                        Once the neural audit is finalized, Ad2Vo will ping your specified webhook. Verify the signature to ensure data integrity.
                                    </p>
                                    <div className="bg-[#333a4a] rounded-[24px] p-8 font-mono text-[11px] text-slate-300 relative overflow-hidden mb-10">
                                        <div className="opacity-80">
                                        {`// Webhook Receiver Logic
async function handleAd2VoCallback(req) {
   const signature = req.headers['x-ad2vo-signature'];
   const payload = req.body;

   if (verifySignature(payload, signature)) {
      await processResults(payload.violations);
      return { status: "ACK" };
   }
}`}
                                        </div>
                                    </div>
                                    <div className="flex gap-10">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase block mb-3">Timeout</span>
                                            <div className="text-xs font-bold text-slate-900 uppercase tracking-widest">30,000 MS</div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase block mb-3">Retries</span>
                                            <div className="text-xs font-bold text-slate-900 uppercase tracking-widest">5 Attempts</div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Errors */}
                            <section id="errors" className="scroll-mt-40">
                                <h2 className="text-2xl font-bold text-slate-900 mb-8 tracking-tight">System Status Codes</h2>
                                <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50">
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Code</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            <tr>
                                                <td className="p-6 font-mono text-xs font-bold text-slate-900">401_UNAUTH</td>
                                                <td className="p-6 text-xs text-slate-400 font-light">Invalid Workspace Token or key expired.</td>
                                            </tr>
                                            <tr>
                                                <td className="p-6 font-mono text-xs font-bold text-slate-900">402_CREDIT</td>
                                                <td className="p-6 text-xs text-slate-400 font-light">Insufficient balance for neural analysis.</td>
                                            </tr>
                                            <tr>
                                                <td className="p-6 font-mono text-xs font-bold text-slate-900">429_LIMIT</td>
                                                <td className="p-6 text-xs text-slate-400 font-light">Request frequency exceeds node capacity.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    </main>
                </div>
            </div>
            
            <Footer />
        </div>
    );
}
