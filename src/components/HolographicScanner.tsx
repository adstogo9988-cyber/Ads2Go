"use client";
import React, { useEffect, useState } from "react";
import "./HolographicLoader.css";
import { GlassLoader } from "./GlassLoader";

interface Step {
    name: string;
    description: string;
    icon: string;
}

interface HolographicScannerProps {
    progress: number;
    currentStep: number;
    steps: Step[];
    scanFailed: boolean;
    analysisUrl: string;
}

export function HolographicScanner({
    progress,
    currentStep,
    steps,
    scanFailed,
    analysisUrl
}: HolographicScannerProps) {
    const [stream, setStream] = useState<string[]>([]);

    useEffect(() => {
        if (steps[currentStep]) {
            setStream(prev => [
                `> INITIALIZING: ${steps[currentStep].name.toUpperCase()}`,
                `> STATUS: STABLE`,
                `> AD2VO_ENGINE: ACTIVE`,
                ...prev.slice(0, 5)
            ]);
        }
    }, [currentStep, steps]);

    return (
        <div className="holographic-container">
            {/* Background Mesh */}
            <div className="mesh-gradient"></div>

            {/* Orbiting Elements */}
            <div className="orbit-ring ring-1"></div>
            <div className="orbit-ring ring-2"></div>
            <div className="orbit-ring ring-3"></div>

            {/* Step Nodes */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {steps.map((_, i) => {
                    const angle = (i / steps.length) * 2 * Math.PI - Math.PI / 2;
                    const radius = 275;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    return (
                        <div
                            key={i}
                            className={`intel-node ${i < currentStep ? 'completed' : i === currentStep ? 'active' : ''}`}
                            style={{
                                transform: `translate(${x}px, ${y}px)`,
                            }}
                        >
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] uppercase tracking-[0.2em] text-slate-400 font-bold opacity-0 group-hover:opacity-100">
                                {steps[i].name}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Central Hub */}
            <div className="central-hub">
                <div className="hub-percentage">
                    {Math.round(progress)}<span className="text-3xl opacity-20">%</span>
                </div>
                
                <div className="hub-disc">
                    <GlassLoader size={1.8} colorOne="#10b981" colorTwo="#3b82f6" />
                </div>

                <div className="mt-12 text-center">
                    <div className="text-[10px] uppercase tracking-[0.8em] text-slate-400 font-bold mb-2">
                        System Analysis
                    </div>
                    <div className="text-2xl font-extralight text-slate-800 tracking-tight">
                        {analysisUrl}
                    </div>
                </div>
            </div>

            {/* Data Stream (Left) */}
            <div className="data-stream hidden lg:flex">
                {stream.map((msg, i) => (
                    <div key={i} className="stream-item" style={{ animationDelay: `${i * 0.1}s` }}>
                        {msg}
                    </div>
                ))}
            </div>

            {/* Current Status Panel */}
            <div className="status-panel">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-sm text-emerald-500 animate-pulse">
                        {scanFailed ? 'gpp_bad' : 'psychology'}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-slate-900">
                        {steps[currentStep]?.name || "Finalizing"}
                    </span>
                </div>
                <p className="text-xs text-slate-500 font-light italic leading-relaxed">
                    "{steps[currentStep]?.description || "Compiling intelligence report..."}"
                </p>
            </div>
        </div>
    );
}
