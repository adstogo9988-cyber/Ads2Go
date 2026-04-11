import React from 'react';
import Link from 'next/link';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Global Analysis Locations | Ad2Go",
  description: "Browse our analysis coverage by location."
};

export default function LocationsIndex() {
  const cities = ["New York", "London", "Toronto", "Sydney", "Singapore", "Dubai"];
  
  return (
    <>
    <Navbar />
    <div className="min-h-[calc(100vh-400px)] pt-32 pb-24 px-4 sm:px-6 relative z-10 bg-[#fafafa]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extralight text-slate-900 mb-6">Analysis Coverage by Location</h1>
        <p className="text-slate-600 font-light mb-12 max-w-2xl text-lg">Select a region to view localized AdSense compliance requirements, compliance rules, and specific ranking factors tailored for your audience.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cities.map(city => (
            <Link key={city} href={`/locations/${city.toLowerCase().replace(" ", "-")}`} className="p-8 rounded-[24px] bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/40 transition-all flex flex-col justify-between group">
                <h2 className="text-xl font-medium text-slate-800 mb-2">{city} <span className="text-slate-400 font-light ml-1">Analysis</span></h2>
                <div className="w-12 h-px bg-slate-200 group-hover:bg-slate-800 group-hover:w-full transition-all duration-300 mt-6"></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
