"use client";
import React from "react";
import "./GlassLoader.css";

interface GlassLoaderProps {
    size?: number;
    colorOne?: string;
    colorTwo?: string;
}

export function GlassLoader({ 
    size = 1.2, 
    colorOne = "#ffbf48", 
    colorTwo = "#be4a1d" 
}: GlassLoaderProps) {
    return (
        <div 
            className="glass-loader-container" 
            style={{ 
                // @ts-ignore
                "--size": size,
                "--color-one": colorOne,
                "--color-two": colorTwo,
                "--color-three": `${colorOne}80`,
                "--color-four": `${colorTwo}80`,
                "--color-five": `${colorOne}40`,
            }}
        >
            <div className="loader-wrapper">
                <svg width="100" height="100" viewBox="0 0 100 100">
                    <defs>
                        <mask id="clipping-mask">
                            <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
                            <polygon points="25,25 75,25 50,75" fill="white"></polygon>
                            <polygon points="50,25 75,75 25,75" fill="white"></polygon>
                            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                        </mask>
                    </defs>
                </svg>
                <div className="box"></div>
            </div>
        </div>
    );
}
