"use client";

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import Link from 'next/link';

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative w-full bg-gradient-to-br from-[#333a4a] via-[#4f5c73] to-[#a5b3c7] overflow-hidden shadow-sm">
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 sm:gap-4">
        <Link 
          href="#features" 
          className="flex items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-white/90 font-medium tracking-wide hover:text-white transition-colors"
        >
          {/* Badge */}
          <span className="flex items-center gap-1.5 bg-white/15 border border-white/20 text-white px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm">
            <Sparkles size={10} className="text-white" />
            New
          </span>
          
          {/* Text */}
          <span className="text-white font-semibold drop-shadow-sm truncate">Intelligence Engine V2.6 Released!</span>
        </Link>
      </div>

      {/* Dismiss Button */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(false);
        }}
        className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white hover:bg-white/10 p-3 sm:p-2 rounded-full transition-all z-50 flex items-center justify-center cursor-pointer"
        aria-label="Dismiss banner"
      >
        <X size={16} />
      </button>
    </div>
  );
}
