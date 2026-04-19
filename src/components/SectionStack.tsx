import React from "react";
import { Card } from "./Card";

interface SectionStackProps {
  images: { id: number; src: string; alt: string }[];
  loadedMap: Record<number, boolean>;
  onImageLoad: (id: number) => void;
  openLightbox: (index: number) => void;
  baseIndex: number; // index of first image in this section within the full list
}

export const SectionStack: React.FC<SectionStackProps> = ({
  images,
  loadedMap,
  onImageLoad,
  openLightbox,
  baseIndex,
}) => (
  <section className="relative py-8 mb-12">
    {/* background layers */}
    <div className="absolute inset-0 bg-white rounded-xl shadow-md transform -translate-x-2 translate-y-2 z-[-2]" />
    <div className="absolute inset-0 bg-white rounded-xl shadow-md transform -translate-x-4 translate-y-4 z-[-1]" />
    <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((img, idx) => (
        <Card
          key={img.id}
          img={img}
          onClick={() => openLightbox(baseIndex + idx)}
          loaded={!!loadedMap[img.id]}
          onLoad={() => onImageLoad(img.id)}
        />
      ))}
    </div>
  </section>
);
