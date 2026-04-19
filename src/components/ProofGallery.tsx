"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

const TOTAL_IMAGES = 50;

const proofImages = Array.from({ length: TOTAL_IMAGES }, (_, i) => ({
  id: i + 1,
  src: `/AD2VO%20Proofs/${i + 1}.png`,
  alt: `AdSense Approval Proof #${i + 1}`,
}));

export function ProofGallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [cardsPerGroup, setCardsPerGroup] = useState(3);
  const [isMounted, setIsMounted] = useState(false);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev - 1 + TOTAL_IMAGES) % TOTAL_IMAGES
    );
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % TOTAL_IMAGES
    );
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, goPrev, goNext]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  // Handle responsive grouping for sticky stack
  useEffect(() => {
    setIsMounted(true);
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCardsPerGroup(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerGroup(2);
      } else {
        setCardsPerGroup(3);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentImage = lightboxIndex !== null ? proofImages[lightboxIndex] : null;

  return (
    <>
      <section className="relative z-10 py-12 md:py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* ── Header ──────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <div className="flex items-center justify-center p-0.5 rounded-full border border-emerald-200">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-[1.5px] border-emerald-500" />
                </div>
                <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
                  Verified Results
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-[3.5rem] font-light text-slate-600 tracking-tight leading-tight">
                Real Approvals.<br />
                <span className="font-semibold text-slate-900">Verified Proof.</span>
              </h2>
              <p className="mt-4 md:mt-6 text-slate-500 font-light text-sm md:text-[16px] max-w-xl leading-relaxed">
                Every screenshot below is an authentic Google AdSense approval from a real client.
                These aren't fabricated — they're the direct outcome of our neural-level analysis.
              </p>
            </div>

            {/* Stats pill */}
            <div className="flex items-center shrink-0 mb-2 md:mb-4">
              <div className="bg-white rounded-3xl px-5 py-3 md:px-6 md:py-4 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-500" size={16} />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl md:text-2xl font-light text-slate-700 leading-none">50+</span>
                  </div>
                  <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                    Proven Approvals
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sticky Scroll Overlap Layout ──────────────────────────────────── */}
          <div className="relative pb-[5vh] md:pb-[10vh] pt-4 md:pt-8 mt-4 md:mt-8">
            <div className="relative z-30 space-y-[8vh] md:space-y-[15vh]">
              {Array.from({ length: Math.ceil(proofImages.length / cardsPerGroup) }).map((_, groupIdx) => {
                const group = proofImages.slice(groupIdx * cardsPerGroup, groupIdx * cardsPerGroup + cardsPerGroup);
                
                return (
                  <div 
                    key={groupIdx} 
                    className="sticky w-full transition-all duration-300 transform-gpu"
                    style={{ 
                      // Dynamic top creates the layered effect, reduced on mobile for better fit
                      top: `calc(12vh + ${Math.min(groupIdx, 8) * (cardsPerGroup === 1 ? 6 : 12)}px)`, 
                      zIndex: groupIdx + 30 
                    }}
                  >
                    {/* Main Section Content Wrapper (White Panel) */}
                    <div className="bg-white border border-slate-200 rounded-3xl md:rounded-[2rem] p-4 sm:p-6 lg:p-10 shadow-[0_-10px_35px_-10px_rgba(0,0,0,0.08)] relative overflow-hidden w-full mx-auto">
                      <div className={`grid gap-4 sm:gap-6 md:gap-8 ${
                        cardsPerGroup === 1 ? 'grid-cols-1' : 
                        cardsPerGroup === 2 ? 'grid-cols-2' : 'grid-cols-3'
                      }`}>
                        {group.map((img, idx) => {
                          const absoluteIndex = groupIdx * cardsPerGroup + idx;
                          return (
                            <button
                              key={img.id}
                              onClick={() => openLightbox(absoluteIndex)}
                              className="group w-full flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:border-emerald-200/60 hover:-translate-y-1.5 transition-all duration-300 ease-out text-left relative"
                            >
                              {/* Approved Badge Overlay */}
                              <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 flex items-center gap-1.5 bg-white rounded-full px-2 py-1 md:px-2.5 md:py-1 shadow-sm border border-slate-100">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                <span className="text-[8px] md:text-[9px] font-bold tracking-widest text-slate-700 uppercase">APPROVED</span>
                              </div>

                              <div className="relative w-full pt-[125%] md:pt-[135%] lg:pt-[145%] p-3 md:p-4">
                                <Image
                                  src={img.src}
                                  alt={img.alt}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  className="object-contain p-2 md:p-4 lg:p-5 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                                  loading="lazy"
                                />
                                
                                <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                  <div className="bg-white/95 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out">
                                    <span className="text-[10px] md:text-xs font-semibold text-slate-800">Zoom In</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-t border-slate-200 bg-white mt-auto">
                                <span className="uppercase tracking-widest font-bold text-[#8fb4d8] text-[8px] md:text-[9px]">AdSense Proof</span>
                                <span className="font-bold text-slate-400/80 text-[9px] md:text-[10px]">#{img.id}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* --- Lightbox --- */}
      {lightboxIndex !== null && currentImage && (() => {
        const activeIdx = lightboxIndex;
        return (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
          >
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />

            <div
              className="relative z-10 flex flex-col items-center w-full max-w-5xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-white/70 text-xs font-medium">
                    Proof {activeIdx + 1} of {TOTAL_IMAGES}
                  </span>
                </div>
                <button
                  onClick={closeLightbox}
                  aria-label="Close lightbox"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20
                             flex items-center justify-center text-white transition-colors duration-200"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="relative w-full rounded-2xl overflow-hidden border border-white/10
                              shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]
                              bg-slate-900">
                <Image
                  src={currentImage.src}
                  alt={currentImage.alt}
                  width={1200}
                  height={900}
                  className="w-full h-auto max-h-[75vh] object-contain"
                  loading="eager"
                  priority
                />
              </div>

              <div className="flex items-center gap-2 md:gap-4 mt-5">
                <button
                  onClick={goPrev}
                  aria-label="Previous image"
                  className="flex items-center gap-1 md:gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl
                             bg-white/10 hover:bg-white/20 border border-white/15
                             text-white text-[10px] md:text-xs font-semibold transition-all duration-200
                             backdrop-blur-sm"
                >
                  <ChevronLeft size={15} /> <span className="hidden sm:inline">Prev</span>
                </button>

                <div className="flex items-center gap-1 md:gap-1.5">
                  {proofImages.slice(
                    Math.max(0, activeIdx - 3),
                    Math.min(TOTAL_IMAGES, activeIdx + 4)
                  ).map((_, dotOffset) => {
                    const actualIndex = Math.max(0, activeIdx - 3) + dotOffset;
                    return (
                      <button
                        key={actualIndex}
                        onClick={() => setLightboxIndex(actualIndex)}
                        aria-label={`Go to image ${actualIndex + 1}`}
                        className={`rounded-full transition-all duration-200
                          ${actualIndex === activeIdx
                            ? "w-4 md:w-5 h-1 md:h-1.5 bg-white"
                            : "w-1 md:w-1.5 h-1 md:h-1.5 bg-white/30 hover:bg-white/60"
                          }`}
                      />
                    );
                  })}
                </div>

                <button
                  onClick={goNext}
                  aria-label="Next image"
                  className="flex items-center gap-1 md:gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl
                             bg-white/10 hover:bg-white/20 border border-white/15
                             text-white text-[10px] md:text-xs font-semibold transition-all duration-200
                             backdrop-blur-sm"
                >
                  <span className="hidden sm:inline">Next</span> <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
