"use client";
import React from "react";
import { 
  Shield, 
  PenTool, 
  BarChart, 
  LineChart,
  TrendingUp,
  Sparkles,
  Eye,
  Clock
} from "lucide-react";

/**
 * MeshyCards Component
 * Fine-tuned implementation to match reference vibrancy and layout perfectly.
 */

const cards = [
  {
    title: "Policy Guard",
    description: "Automated detection of AdSense program policy violations and risk triggers.",
    icon: <Shield className="h-6 w-6 text-white" />,
    stat_icon: <TrendingUp className="mr-1 h-3.5 w-3.5" />,
    stats: "Zero-Risk Protocol",
    image: "https://images.unsplash.com/photo-1635776062360-af423602aff3?w=800&q=80",
  },
  {
    title: "EEAT Audit",
    description: "Deep semantic analysis of Experience, Expertise, Authoritativeness, and Trust signals.",
    icon: <PenTool className="h-6 w-6 text-white" />,
    stat_icon: <Sparkles className="mr-1 h-3.5 w-3.5" />,
    stats: "Quality Verified",
    image: "https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=800&q=80",
  },
  {
    title: "Site Integrity",
    description: "Full structural audit of crawlability, indexing, and mobile-first readiness.",
    icon: <BarChart className="h-6 w-6 text-white" />,
    stat_icon: <Eye className="mr-1 h-3.5 w-3.5" />,
    stats: "Architecture Scanned",
    image: "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=800&q=80",
  },
  {
    title: "Revenue Insights",
    description: "Actionable roadmap to improve site value and maximize ad revenue potential.",
    icon: <TrendingUp className="h-6 w-6 text-white" />,
    stat_icon: <Clock className="mr-1 h-3.5 w-3.5" />,
    stats: "Earnings Optimized",
    image: "https://images.unsplash.com/photo-1635776063328-153b13e3c245?w=800&q=80",
  }
];

export const MeshyCards = () => {
  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="scale-in group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 hover:scale-[1.03] shadow-2xl"
          style={{ 
            animationDelay: `${idx * 150}ms`,
            minHeight: "240px"
          }}
        >
          {/* Background Mesh */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${card.image})` }}
          />
          
          {/* Subtle Dark Overlay to ensure consistent branding feel */}
          <div className="absolute inset-0 z-10 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
          
          {/* Content Wrapper */}
          <div className="relative z-20 h-full flex flex-col p-8 bg-black/5 backdrop-blur-[2px]">
            {/* Top Row: Icon container */}
            <div className="mb-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 shadow-lg group-hover:bg-white/30 transition-all duration-300">
              {card.icon}
            </div>

            {/* Bottom Section: Text and Stats */}
            <div className="mt-8 space-y-2">
              <h3 className="text-xl font-bold font-sans text-white tracking-tight">
                {card.title}
              </h3>
              <p className="text-sm font-sans text-white/80 leading-relaxed font-light line-clamp-2">
                {card.description}
              </p>
              
              <div className="pt-4 flex items-center border-t border-white/10 text-white/60 group-hover:text-white/90 transition-colors duration-300">
                {card.stat_icon}
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {card.stats}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
