import React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { MapPin, Globe, Award, ChevronRight, Activity } from "lucide-react";

// Pre-render highest-value locations for optimal LCP and SEO impact
export function generateStaticParams() {
  const topCities = [
    "new-york", "london", "singapore", "los-angeles", 
    "san-francisco", "toronto", "sydney", "berlin", 
    "dubai", "austin"
  ];
  return topCities.map((city) => ({
    city: city,
  }));
}

// Convert "new-york" to "New York"
function formatCityName(city: string) {
  return city
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const cityName = formatCityName(city);
  
  return {
    title: `Local AdSense Monetization Consultants in ${cityName} | Ad2Go`,
    description: `Maximize your digital ad revenue with Ad2Go's specialized AdSense evaluation and neural analysis for publishers based in ${cityName}. Enterprise-grade site auditing.`,
    alternates: {
      canonical: `/locations/${city}`,
    },
    openGraph: {
      title: `AdSense Monetization Consultants in ${cityName}`,
      description: `Maximize your digital ad revenue with Ad2Go's neural analysis tailored for web publishers in ${cityName}.`,
    }
  };
}

export default async function LocationPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const cityName = formatCityName(city);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfe] selection:bg-[#333a4a]/10 selection:text-[#333a4a]">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
             __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": `Ad2Go Neural Intelligence - ${cityName}`,
              "image": "https://www.ad2vo.com/AD2GO.net.png",
              "description": `Professional AdSense monetization analysis and readiness auditing for publishers in ${cityName}. Ensure Google AdSense compliance and maximize RPM.`,
              "areaServed": cityName,
              "serviceArea": {
                "@type": "Place",
                "name": cityName
              },
              "address": {
                 "@type": "PostalAddress",
                 "addressLocality": cityName,
                 "postalCode": "10001",
                 "addressCountry": "US"
              },
              "parentOrganization": {
                 "@type": "Organization",
                 "name": "Ad2Go",
                 "url": "https://www.ad2vo.com"
              }
             })
          }}
        />
      </head>

      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-32 pb-40">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-12">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/locations" className="hover:text-slate-900 transition-colors">Locations</Link>
          <ChevronRight size={12} />
          <span className="text-emerald-600">{cityName}</span>
        </nav>

        {/* Hero */}
        <header className="mb-24 text-center max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-8">
             <MapPin className="text-emerald-500" size={28} />
          </div>
          <h1 className="text-5xl md:text-[72px] font-light text-slate-900 tracking-tighter leading-[0.9] mb-8">
            AdSense Automation & Analysis for <strong className="font-bold">{cityName}</strong> Publishers.
          </h1>
          <p className="text-xl text-slate-500 font-light leading-relaxed">
            Elevating digital media revenues for {cityName}'s fastest-growing blogs, media outlets, and niche forums using advanced neural policy scanning.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-6">
            <Link href="/analysis" className="px-10 py-5 bg-[#333a4a] text-white rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl active:scale-95 transition-all w-full sm:w-auto">
              Scan Your Domain Now
            </Link>
            <Link href="/contact" className="px-10 py-5 bg-white border border-slate-200 text-slate-900 rounded-full font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-50 active:scale-95 transition-all w-full sm:w-auto">
              Speak to a Consultant
            </Link>
          </div>
        </header>

        {/* Features Specific to Local Needs */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
           {[
             { 
               icon: <Globe size={24} />, 
               title: `Global Scalability from ${cityName}`, 
               desc: "Expand your local publishing footprint globally with ad setups built to capture high-paying international bidding markets."
             },
             { 
               icon: <Award size={24} />, 
               title: "Policy Perfection", 
               desc: "Keep your operational health flawless. Our scanners detect policy violations before Google's bots hit your servers."
             },
             { 
               icon: <Activity size={24} />, 
               title: "Real-Time Monetization Tracking", 
               desc: "Monitor your page-levelRPMs, semantic density, and overall readiness directly from our intuitive global dashboard."
             }
           ].map((feat, i) => (
             <div key={i} className="p-10 rounded-[32px] border border-slate-100 bg-white hover:border-slate-300 transition-all">
                <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mb-6">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{feat.title}</h3>
                <p className="text-slate-500 font-light text-sm leading-relaxed">{feat.desc}</p>
             </div>
           ))}
        </div>

        {/* Local FAQ Engine */}
        <section className="max-w-3xl mx-auto">
           <h2 className="text-3xl font-bold text-slate-900 mb-12 tracking-tight text-center">Frequently Asked Questions</h2>
           <div className="space-y-6">
              {[
                { 
                  q: `Do you provide dedicated account management in ${cityName}?`, 
                  a: `While our core engine is entirely cloud-based and accessible globally, enterprise clients based in ${cityName} can request priority technical onboarding via our digital channels.` 
                },
                { 
                  q: `How does the Ad2Go scanner improve my AdSense approval odds?`, 
                  a: "Our neural engine scans for over 45 critical factors that Google reviewers look for, including proper navigation, original semantic content mapping, transparency pages, and absence of restricted topics." 
                },
                { 
                  q: "What types of publishers do you work with?", 
                  a: "From independent niche bloggers to multi-million visitor news syndicates, our platform scales effortlessly." 
                }
              ].map((faq, i) => (
                 <div key={i} className="p-8 pb-10 bg-white border border-slate-100 rounded-[24px]">
                    <h4 className="text-lg font-bold text-slate-900 mb-4 pr-10">{faq.q}</h4>
                    <p className="text-slate-500 font-light text-sm leading-relaxed">{faq.a}</p>
                 </div>
              ))}
           </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
