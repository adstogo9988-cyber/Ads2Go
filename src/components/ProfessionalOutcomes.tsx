"use strict";
import React from "react";
import { MeshyCards } from "@/components/MeshyCards";

export function ProfessionalOutcomes() {
    return (
        <section className="relative z-10 py-20 md:py-32 px-4 sm:px-6 flex flex-col items-center justify-center">
            <div className="max-w-7xl w-full">
                {/* Header */}
                <div className="text-center mb-16 md:mb-24">
                    <span className="text-[11px] uppercase tracking-[0.5em] text-slate-400 font-semibold mb-6 block">
                        Strategic Impact
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl md:text-6xl font-extralight text-slate-900 tracking-tight mb-6">
                        Professional Outcomes & Insights
                    </h2>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-auto"></div>
                </div>

                {/* Integration of MeshyCards */}
                <div className="w-full">
                    <MeshyCards />
                </div>

                {/* Footer */}
                <div className="mt-16 md:mt-24 text-center">
                    <p className="text-slate-400 text-[10px] md:text-[11px] font-medium tracking-[0.4em] uppercase">Trusted by Publishers Worldwide</p>
                </div>
            </div>
        </section>
    );
}
