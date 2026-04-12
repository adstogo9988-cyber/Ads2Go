"use client";
import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { submitAPIRequest } from "./actions";
import { 
    ArrowRight,
    Copy,
} from "lucide-react";

export default function APIOverview() {
    const [activeSection, setActiveSection] = useState("intro");
    const [selectedSDK, setSelectedSDK] = useState<{name: string, src: string, code: string} | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<{success?: boolean, error?: string} | null>(null);

    const sdks = [
        { 
            name: "Next.js", 
            src: "https://img.icons8.com/fluency/48/nextjs.png",
            code: `// Next.js API Route / Server Action
const response = await fetch('https://ad2vo.com/api/v1/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_SECRET_KEY'
  },
  body: JSON.stringify({ site_url: 'https://example.com' })
});`
        },
        { 
            name: "Python", 
            src: "https://img.icons8.com/color/48/python--v1.png",
            code: `import requests\n\nrequests.post("https://ad2vo.com/api/v1/analyze", json={"site_url": "https://example.com"}, headers={"Authorization": "Bearer YOUR_SECRET_KEY"})`
        },
        { 
            name: "JavaScript", 
            src: "https://img.icons8.com/deco/48/javascript.png",
            code: `fetch('https://ad2vo.com/api/v1/analyze', { method: 'POST' })`
        },
        { 
            name: "React.js", 
            src: "https://img.icons8.com/deco/48/react-native.png" ,
            code: `// React Implementation\nconst runAudit = async () => { ... }`
        },
    ];

    useEffect(() => {
        const handleScroll = () => {
            const sections = ["intro", "auth", "endpoints", "analyze", "sdks", "access", "terms"];
            const scrollPosition = window.scrollY + 200;

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const offsetTop = element.offsetTop;
                    const height = element.offsetHeight;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + height) {
                        setActiveSection(section);
                    }
                }
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const sidebarItems = [
        { id: "intro", label: "Overview", icon: "insights" },
        { id: "auth", label: "Security", icon: "security" },
        { id: "endpoints", label: "Methods", icon: "api" },
        { id: "analyze", label: "Neural Engine", icon: "psychology" },
        { id: "sdks", label: "Access Nodes", icon: "deployed_code" },
        { id: "access", label: "Access API", icon: "key" },
        { id: "terms", label: "Conditions", icon: "verified" },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-[#fcfdfe] selection:bg-[#333a4a]/10 selection:text-[#333a4a]">
            <Navbar />
            
            <div className="flex-1 w-full max-w-7xl mx-auto px-6 pt-32">
                <div className="flex flex-col lg:flex-row gap-20 relative">
                    
                    {/* ── Sidebar ── */}
                    <aside className="hidden lg:flex sticky top-32 h-fit w-56 flex-col gap-8 z-20">
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
                                    {activeSection === item.id && (
                                        <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#333a4a] rounded-full shadow-[0_0_12px_rgba(51,58,74,0.4)]" />
                                    )}
                                </Link>
                            ))}
                            <Link href="/api/docs" className="flex items-center gap-4 py-2 px-3 text-emerald-600 hover:text-emerald-700 font-black transition-all">
                                <span className="material-symbols-outlined text-[16px] font-thin">menu_book</span>
                                <span className="text-[13px] tracking-tight">Technical Docs</span>
                                <ArrowRight size={12} />
                            </Link>
                        </nav>
                    </aside>

                    {/* ── Main Content ── */}
                    <main className="flex-1 min-w-0">
                        <div className="max-w-3xl space-y-48 pb-60">
                            
                            {/* Intro */}
                            <section id="intro" className="scroll-mt-40">
                                <span className="text-[11px] uppercase tracking-[0.4em] text-slate-300 font-black mb-6 block">API Overview v4.2</span>
                                <h1 className="text-5xl md:text-[80px] font-light text-slate-900 tracking-tighter leading-[0.9] mb-12">
                                    Neural <br />Protocol.
                                </h1>
                                <p className="text-xl text-slate-500 font-light leading-relaxed max-w-2xl mb-12">
                                    Ad2Vo programmatic layer allows you to scale neural audits across millions of digital assets.
                                </p>
                                <Link href="/api/docs" className="inline-flex items-center gap-6 px-10 py-5 bg-[#333a4a] text-white rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                    Full Documentation <ArrowRight size={14} />
                                </Link>
                            </section>

                            {/* Security Layer */}
                            <section id="auth" className="scroll-mt-40">
                                <h2 className="text-2xl font-bold text-slate-900 mb-8 tracking-tight flex items-center gap-4">
                                    <span className="w-8 h-px bg-slate-200" /> Security Layer
                                </h2>
                                <div className="p-10 rounded-[32px] border border-slate-100 bg-white flex flex-col md:flex-row gap-12 items-center">
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-400 leading-relaxed font-light mb-6">
                                            Authentication node requires a Bearer token. Implement in all header payloads.
                                        </p>
                                        <div className="flex gap-4">
                                            <div className="px-3 py-1 bg-emerald-50 rounded-full text-[9px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100">Live API</div>
                                        </div>
                                    </div>
                                    <div className="bg-[#333a4a] rounded-[24px] p-8 font-mono text-xs text-white/50 shadow-inner w-full md:w-auto text-center">
                                        <code>Bearer ad2vo_live_***</code>
                                    </div>
                                </div>
                            </section>

                            {/* Endpoints */}
                            <section id="endpoints" className="scroll-mt-40">
                                <h2 className="text-2xl font-bold text-slate-900 mb-12 tracking-tight">Core Methods</h2>
                                <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden divide-y divide-slate-50">
                                    {[
                                        { method: "POST", path: "/v1/analyze", desc: "Initiate audit." },
                                        { method: "GET", path: "/v1/results", desc: "Fetch payload." },
                                        { method: "GET", path: "/v1/usage", desc: "Node metrics." },
                                    ].map((row, i) => (
                                        <div key={i} className="flex items-center gap-8 p-8 hover:bg-slate-50 transition-all group">
                                            <span className="text-[10px] font-black text-slate-300 w-12">{row.method}</span>
                                            <div className="flex-1 text-slate-800 font-mono text-sm font-semibold">{row.path}</div>
                                            <ArrowRight size={14} className="text-slate-200 group-hover:text-slate-900 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Neural Machine */}
                            <section id="analyze" className="scroll-mt-40">
                                <div className="p-12 md:p-20 rounded-[32px] border border-slate-100 bg-white shadow-sm flex flex-col items-center">
                                    <span className="text-[9px] uppercase tracking-[0.5em] text-slate-300 font-black mb-12">Neural Lifecycle</span>
                                    <div className="flex flex-col md:flex-row gap-12 items-center justify-between w-full max-w-2xl text-center">
                                        <div>
                                            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 mx-auto"><span className="material-symbols-outlined text-sm font-thin">bolt</span></div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Inhale</h4>
                                        </div>
                                        <div className="h-px w-20 bg-slate-100 hidden md:block"></div>
                                        <div>
                                            <div className="w-16 h-16 rounded-full bg-[#333a4a] text-white flex items-center justify-center mb-6 mx-auto shadow-2xl"><span className="material-symbols-outlined text-2xl font-thin">neurology</span></div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Map</h4>
                                        </div>
                                         <div className="h-px w-20 bg-slate-100 hidden md:block"></div>
                                        <div>
                                            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 mx-auto"><span className="material-symbols-outlined text-sm font-thin">done_all</span></div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Signal</h4>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Developers */}
                            <section id="sdks" className="scroll-mt-40">
                                <h2 className="text-2xl font-bold text-slate-900 mb-12 tracking-tight">Access Nodes</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {sdks.map((sdk) => (
                                        <button key={sdk.name} onClick={() => setSelectedSDK(sdk)} className="p-8 rounded-[24px] border border-slate-50 bg-white hover:border-slate-200 hover:shadow-xl transition-all duration-500 flex flex-col items-center group">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 mb-6 flex items-center justify-center transition-all group-hover:scale-110">
                                                <img width="32" height="32" src={sdk.src} alt={sdk.name} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{sdk.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Access API Request */}
                            <section id="access" className="scroll-mt-40">
                                <span className="text-[9px] uppercase tracking-[0.5em] text-slate-300 font-black mb-8 block">Programmatic Permission</span>
                                <h2 className="text-2xl font-bold text-slate-900 mb-12 tracking-tight">Access Ad2Vo API</h2>
                                
                                <div className="p-10 md:p-16 rounded-[40px] border border-slate-100 bg-white shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-900 pointer-events-none">
                                        <span className="material-symbols-outlined text-[160px]">key</span>
                                    </div>

                                    {submissionStatus?.success ? (
                                        <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                                            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
                                                <span className="material-symbols-outlined text-3xl">verified</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">Request Transmitted</h3>
                                            <p className="text-slate-500 font-light text-sm max-w-sm">
                                                Neural Protocol access is currently under review. Our team will contact you via email within 24 hours.
                                            </p>
                                            <button 
                                                onClick={() => setSubmissionStatus(null)}
                                                className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all underline underline-offset-4"
                                            >
                                                Submit another request
                                            </button>
                                        </div>
                                    ) : (
                                        <form className="space-y-8 relative z-10" action={async (formData: FormData) => {
                                            setIsSubmitting(true);
                                            const result = await submitAPIRequest(formData);
                                            setIsSubmitting(false);
                                            setSubmissionStatus(result);
                                        }}>
                                            <div className="grid md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                                                    <input 
                                                        required
                                                        name="full_name"
                                                        type="text" 
                                                        placeholder="John Doe"
                                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50/50 border border-slate-100 focus:border-[#333a4a] focus:bg-white transition-all outline-none text-sm placeholder:text-slate-300" 
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                                    <input 
                                                        required
                                                        name="email"
                                                        type="email" 
                                                        placeholder="john@example.com"
                                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50/50 border border-slate-100 focus:border-[#333a4a] focus:bg-white transition-all outline-none text-sm placeholder:text-slate-300" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Company / Project</label>
                                                <input 
                                                    name="company"
                                                    type="text" 
                                                    placeholder="Acme Inc."
                                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50/50 border border-slate-100 focus:border-[#333a4a] focus:bg-white transition-all outline-none text-sm placeholder:text-slate-300" 
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Use Case</label>
                                                <textarea 
                                                    name="use_case"
                                                    rows={4}
                                                    placeholder="Describe how you plan to integrate our Neural Engine..."
                                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50/50 border border-slate-100 focus:border-[#333a4a] focus:bg-white transition-all outline-none text-sm placeholder:text-slate-300 resize-none" 
                                                />
                                            </div>

                                            {submissionStatus?.error && (
                                                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[11px] font-medium flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-sm">error</span>
                                                    {submissionStatus.error}
                                                </div>
                                            )}

                                            <button 
                                                disabled={isSubmitting}
                                                type="submit"
                                                className="w-full py-5 bg-[#333a4a] text-white rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
                                            >
                                                {isSubmitting ? (
                                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        Initialize Access Request
                                                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </section>

                        </div>
                    </main>
                </div>
            </div>
            
            <Footer />

            {/* Modal Logic */}
            {selectedSDK && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl p-12 border border-white/20">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{selectedSDK.name} Pattern</h3>
                            <button onClick={() => setSelectedSDK(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900">
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        </div>
                        <div className="bg-[#333a4a] rounded-[24px] p-8 font-mono text-xs text-slate-300 relative border border-white/5 overflow-x-auto">
                            <pre>{selectedSDK.code}</pre>
                            <button onClick={() => { navigator.clipboard.writeText(selectedSDK.code); }} className="mt-8 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all underline underline-offset-4">Copy Node</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
