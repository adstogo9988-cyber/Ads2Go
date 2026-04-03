'use client';

import React from 'react';

export default function RoadmapContent() {
    const roadmapSteps = [
        { title: "Immediate Action", label: "Priority Fixes", description: "Critical technical SEO and security gaps that block your AdSense approval path.", icon: "bolt", color: "text-red-500", bg: "bg-red-50", items: ["Fix Sitemap XML structure", "Enable HTTPS sitewide", "Resolve Core Content Violations"] },
        { title: "Secondary Phase", label: "Optimization", description: "Improving performance and structured data markers to increase your CPM potential.", icon: "insights", color: "text-amber-500", bg: "bg-amber-50", items: ["Add Schema.org Organization Markup", "Optimize Image Payloads", "Compress Large JS Bundles"] },
        { title: "Scalability", label: "Brand Presence", description: "Enhancing trust signals and content depth to attract high-tier ad inventory.", icon: "verified", color: "text-emerald-500", bg: "bg-emerald-50", items: ["Implement Privacy Policy page", "Enhance 'About Us' authority", "Expand blog content depth"] }
    ];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {roadmapSteps.map((step, idx) => (
                <div key={idx} className="relative pl-12 group">
                    {/* Progress line */}
                    {idx < roadmapSteps.length - 1 && (
                        <div className="absolute left-6 top-12 bottom-0 w-1 bg-slate-100/50 group-hover:bg-indigo-100 transition-colors"></div>
                    )}
                    
                    <div className="absolute left-0 top-0 size-12 rounded-[20px] bg-white border-2 border-slate-100 flex items-center justify-center z-10 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-xl shadow-slate-100/50">
                        <span className="material-symbols-outlined font-bold text-[22px] transition-transform group-hover:scale-110">{step.icon}</span>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-700">
                        <div className="flex-1 w-full text-center lg:text-left">
                            <span className={`px-4 py-1.5 rounded-full ${step.bg} ${step.color} text-[10px] font-black uppercase tracking-widest border border-current opacity-70 mb-5 inline-block`}>{step.label}</span>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-4">{step.title}</h3>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">{step.description}</p>
                        </div>

                        <div className="w-full lg:w-96 space-y-4">
                            {step.items.map((item, iidx) => (
                                <div key={iidx} className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-indigo-600/30 transition-all cursor-default translate-x-0 hover:translate-x-2">
                                    <div className="size-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[14px] text-slate-300">check_circle</span>
                                    </div>
                                    <span className="text-[14px] font-bold text-slate-700 tracking-tight">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
