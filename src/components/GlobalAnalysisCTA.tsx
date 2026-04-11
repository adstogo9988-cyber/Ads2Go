"use client";
import React from "react";

export function GlobalAnalysisCTA() {
    return (
        <section className="relative z-10 py-20 md:py-32 px-4 sm:px-6 flex flex-col items-center">
            <div className="max-w-xl w-full text-center">
                <h2 className="text-2xl md:text-3xl font-extralight text-slate-900 mb-8 md:mb-10 tracking-tight">Initiate Global Analysis</h2>
                <div className="flex justify-center">
                    <div className="ethereal-pill rounded-[24px] md:rounded-full p-1.5 flex flex-col sm:flex-row items-center w-full max-w-md gap-2 sm:gap-0">
                        <input
                            className="bg-transparent border-none focus:ring-0 text-sm font-light text-slate-600 px-4 md:px-6 flex-grow placeholder:text-slate-300 w-full"
                            placeholder="Enter domain for analysis..."
                            type="text"
                        />
                        <button className="bg-slate-900 text-white text-[10px] uppercase tracking-widest px-6 md:px-8 py-3 rounded-[20px] md:rounded-full font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 whitespace-nowrap w-full sm:w-auto">
                            Start Analysis
                        </button>
                    </div>
                </div>
                <p className="mt-6 md:mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-light">No authentication required for initial scan</p>
            </div>
        </section>
    );
}
