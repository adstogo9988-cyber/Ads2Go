import React from "react";
import { ShieldCheck, ArrowRight, CheckCircle2, AlertTriangle, Zap } from "lucide-react";

export function CaseStudies() {
  return (
    <section className="relative z-10 py-20 md:py-32 bg-slate-50 border-t border-slate-100 overflow-hidden">
      <div className="absolute inset-0 bg-[#fcfdfe] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-bold mb-4 block">Proven E-E-A-T Impact</span>
            <h2 className="text-3xl md:text-5xl font-extralight text-slate-900 tracking-tight leading-tight">
              Real Intelligence.<br />
              <span className="font-semibold">Actual Approvals.</span>
            </h2>
          </div>
          <p className="text-slate-500 font-light text-base max-w-sm">
            We don't just provide generic tips. We provide surgical, neural-level structural fixes that force Google's hand.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Case Study 1 */}
          <div className="glass-panel bg-white rounded-[32px] p-8 md:p-10 border border-slate-100 flex flex-col hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-8">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                     <span className="text-slate-600 font-black text-sm">FP</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Finance Pulse</h4>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">Personal Finance</span>
                  </div>
               </div>
               <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Approved
               </div>
            </div>

            <div className="mb-6 pb-6 border-b border-slate-50">
               <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                  <div>
                     <span className="text-xs font-bold text-slate-800 block mb-1">Previous Status: Rejection Core</span>
                     <p className="text-xs text-slate-500 font-light leading-relaxed">Repeatedly denied for "Low Value Content". Publisher spent 4 months rewriting articles to no avail.</p>
                  </div>
               </div>
            </div>

            <div className="mb-8 flex-grow">
               <div className="flex items-start gap-3">
                  <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                  <div>
                     <span className="text-xs font-bold text-slate-800 block mb-1">Ad2Go Resolution</span>
                     <p className="text-xs text-slate-500 font-light leading-relaxed">Neural scan detected that the site's primary layout CSS injected massive layout shifts (CLS), triggering automated bot failure. Furthermore, their privacy policy lacked exact GDPR string-matching parameters. Fixed in 2 hours.</p>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
               <div className="flex flex-col">
                  <span className="text-2xl font-light text-slate-900">$2.4k</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400">Monthly Yield Reclaimed</span>
               </div>
               <button className="text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2 text-xs font-semibold">
                 View Case <ArrowRight size={14} />
               </button>
            </div>
          </div>

          {/* Case Study 2 */}
          <div className="glass-panel bg-slate-900 rounded-[32px] p-8 md:p-10 border border-slate-800 flex flex-col hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
               <CheckCircle2 size={300} className="text-white" />
            </div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                     <span className="text-slate-300 font-black text-sm">TR</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Tech Reviewer Pro</h4>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">Hardware Publisher</span>
                  </div>
               </div>
               <div className="px-3 py-1 bg-blue-900/40 text-blue-400 border border-blue-800/50 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Scaled
               </div>
            </div>

            <div className="mb-6 pb-6 border-b border-slate-800 relative z-10">
               <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                  <div>
                     <span className="text-xs font-bold text-white block mb-1">Previous Status: Site Behavior Ban</span>
                     <p className="text-xs text-slate-400 font-light leading-relaxed">Account was flagged for "Site Behavior: Navigation". The user exhausted all appeals and was bleeding traffic value.</p>
                  </div>
               </div>
            </div>

            <div className="mb-8 flex-grow relative z-10">
               <div className="flex items-start gap-3">
                  <Zap className="text-blue-400 shrink-0 mt-0.5" size={16} />
                  <div>
                     <span className="text-xs font-bold text-white block mb-1">Ad2Go Resolution</span>
                     <p className="text-xs text-slate-400 font-light leading-relaxed">Our crawler simulated the AdSense bot path. We identified an infinite redirect loop caused by a misconfigured mobile-only trailing slash in their Next.js routing. Algorithmic trust was restored instantly upon fix.</p>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-between mt-auto relative z-10">
               <div className="flex flex-col">
                  <span className="text-2xl font-light text-white">$14.2k</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-500">Monthly Yield Reclaimed</span>
               </div>
               <button className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold">
                 View Case <ArrowRight size={14} />
               </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
