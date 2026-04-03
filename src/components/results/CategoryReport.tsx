'use client';

import React from 'react';

interface CategoryReportProps {
    category: string;
    data: any;
    onOpenIssue: (issue: any) => void;
}

export default function CategoryReport({ category, data, onOpenIssue }: CategoryReportProps) {
    if (!data) return (
        <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[40px] border border-slate-100">
            <span className="material-symbols-outlined text-[64px] text-slate-200 mb-6 font-bold">query_stats</span>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No data found for {category}</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
            {/* Header Card */}
            <div className="px-10 py-12 glass-card rounded-[40px] border border-indigo-100/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 transition-opacity group-hover:opacity-10">
                    <span className="material-symbols-outlined text-[140px] font-bold">analytics</span>
                </div>
                <div className="relative z-10">
                    <span className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100/30">Detailed Category Audit</span>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tight mt-6 mb-4">{category}</h2>
                    <p className="text-slate-500 text-lg font-medium max-w-2xl leading-relaxed">
                        In-depth verification of specific AdSense compliance markers and performance metrics within the {category} domain.
                    </p>
                </div>
            </div>

            {/* Checks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.checks.map((check: any, idx: number) => (
                    <div key={idx} className="zen-card p-8 rounded-[36px] border border-slate-100 hover:border-indigo-600/30 group transition-all duration-500">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className={`size-12 rounded-2xl flex items-center justify-center shadow-sm 
                                    ${check.status === 'pass' ? 'bg-emerald-50 text-emerald-600' : 
                                      check.status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                                    <span className="material-symbols-outlined font-bold">
                                        {check.status === 'pass' ? 'check' : check.status === 'warning' ? 'priority_high' : 'close'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-[15px] font-black text-slate-800 tracking-tight leading-none mb-1.5">{check.name}</h4>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{check.impact} Impact</span>
                                </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border
                                ${check.status === 'pass' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                  check.status === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                {check.status === 'pass' ? 'Validated' : check.status === 'warning' ? 'Warning' : 'Critical'}
                            </span>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Detection Result</p>
                            <p className="text-[14px] font-bold text-slate-700 truncate">{check.value}</p>
                        </div>

                        <p className="text-slate-500 text-sm leading-relaxed mb-8 h-10 overflow-hidden line-clamp-2">{check.description}</p>

                        {(check.status === 'fail' || check.status === 'warning') && (
                            <button 
                                onClick={() => onOpenIssue(check)}
                                className="w-full py-4 rounded-xl bg-white border border-slate-200 text-slate-900 text-[11px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                                View Remediation Solution
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
