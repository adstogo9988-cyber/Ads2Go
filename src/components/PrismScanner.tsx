"use client";
import React from "react";
import "./PrismScanner.css";
import { GlassLoader } from "./GlassLoader";

interface Step {
    name: string;
    description: string;
    icon: string;
}

interface PrismScannerProps {
    progress: number;
    currentStep: number;
    steps: Step[];
    scanFailed: boolean;
    analysisUrl: string;
}

export function PrismScanner({
    progress,
    currentStep,
    steps,
    scanFailed,
    analysisUrl
}: PrismScannerProps) {
    return (
        <div className="prism-dark-container">
            {/* Background Layers */}
            <div className="prism-atmosphere"></div>
            <div className="prism-grid"></div>
            
            {/* Floating Glow Follower */}
            <div className="core-glow" style={{ transform: `translate(${(progress - 50) * 2}px, ${(currentStep - 2) * 20}px)` }}></div>

            {/* Main Interface Card */}
            <div className="prism-card">
                <div className="prism-sweep"></div>
                
                {/* Visual Hub */}
                <div className="mb-12 relative flex justify-center">
                    <div className="absolute inset-0 bg-rose-500/10 blur-[60px] rounded-full"></div>
                    <GlassLoader size={1.6} colorOne="#ff4d6d" colorTwo="#ff8fa3" />
                </div>

                {/* Percentage Lens */}
                <div className="mb-12">
                    <div className="text-8xl font-black tracking-tighter mb-2 bg-gradient-to-b from-white to-white/10 bg-clip-text text-transparent opacity-90 leading-none">
                        {Math.round(progress)}%
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#ff4d6d]"></span>
                        <span className="text-[10px] uppercase tracking-[0.8em] text-slate-500 font-bold">
                            Neural Link Active
                        </span>
                    </div>
                </div>

                {/* Information Cluster */}
                <div className="prism-tech-box">
                    <div className="text-[10px] uppercase tracking-[0.4em] text-rose-500 font-black mb-2">
                        Phase 0{currentStep + 1}
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-3">
                        {steps[currentStep]?.name}
                    </h2>
                    <p className="text-sm text-slate-400 font-light italic leading-relaxed mb-8">
                        "{steps[currentStep]?.description}"
                    </p>

                    {/* Progress Track */}
                    <div className="prism-progress-bar">
                        <div 
                            className="prism-progress-fill" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between text-[8px] font-mono text-slate-600 tracking-widest">
                        <span>SRC: {analysisUrl}</span>
                        <span>V: 2.6.4</span>
                    </div>
                </div>
            </div>

            {/* Corner Decorative Tech */}
            <div className="absolute top-12 left-12 flex flex-col gap-4 opacity-20">
                <div className="w-16 h-[1px] bg-white"></div>
                <div className="w-[1px] h-16 bg-white"></div>
            </div>
            <div className="absolute bottom-12 right-12 flex flex-col gap-4 opacity-20 rotate-180">
                <div className="w-16 h-[1px] bg-white"></div>
                <div className="w-[1px] h-16 bg-white"></div>
            </div>
        </div>
    );
}
