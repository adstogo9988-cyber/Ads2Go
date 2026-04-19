import React from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";

interface CardProps {
  img: { id: number; src: string; alt: string };
  onClick: () => void;
  loaded: boolean;
  onLoad: () => void;
}

export const Card: React.FC<CardProps> = ({ img, onClick, loaded, onLoad }) => (
  <button
    onClick={onClick}
    aria-label={`View proof ${img.id}`}
    className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 w-full flex flex-col aspect-[4/3]"
  >
    <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden rounded-t-xl bg-slate-50">
      {!loaded && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse z-10" />
      )}
      <Image
        src={img.src}
        alt={img.alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
        onLoad={onLoad}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <ZoomIn size={16} className="text-emerald-600" />
          <span className="text-sm font-semibold text-slate-800">View Proof</span>
        </div>
      </div>
    </div>
    <div className="flex items-center justify-between text-xs text-slate-400 px-4 py-3 bg-white border-t border-slate-100 mt-auto">
      <span className="uppercase tracking-widest font-medium">AdSense Proof</span>
      <span className="font-semibold text-slate-500">#{img.id}</span>
    </div>
  </button>
);
