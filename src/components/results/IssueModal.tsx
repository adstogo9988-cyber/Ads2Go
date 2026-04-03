'use client';

import React from 'react';

interface IssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    issue: any;
    onRegenerate: (issue: any) => void;
}

const MagicWandIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <title>magic-wand-sparkle</title>
      <g fill="none">
        <path d="M14.2929 8.29295C14.6834 7.90243 15.3164 7.90243 15.707 8.29295C16.0975 8.68348 16.0975 9.31649 15.707 9.70702L3.70696 21.707C3.31643 22.0975 2.68342 22.0975 2.29289 21.707C1.90237 21.3165 1.90237 20.6835 2.29289 20.293L14.2929 8.29295Z" fill="url(#wand_gradient_0)" />
        <path d="M14.2929 8.29295C14.6834 7.90243 15.3164 7.90243 15.707 8.29295C16.0975 8.68348 16.0975 9.31649 15.707 9.70702L3.70696 21.707C3.31643 22.0975 2.68342 22.0975 2.29289 21.707C1.90237 21.3165 1.90237 20.6835 2.29289 20.293L14.2929 8.29295Z" fill="url(#wand_gradient_0)" filter="url(#wand_filter_0)" />
        <path d="M19.1786 3.31611C20.1577 2.98709 21.0907 3.92011 20.7617 4.89918L19.5725 8.43775L21.8104 11.4304C22.4324 12.2622 21.8276 13.4457 20.7891 13.4288L17.073 13.3687L14.9321 16.4039C14.3355 17.2497 13.0283 17.0455 12.7181 16.0581L11.595 12.4828L8.01972 11.3597C7.03228 11.0495 6.82806 9.74224 7.67385 9.14566L10.7091 7.00474L10.6489 3.28866C10.6321 2.25022 11.8156 1.6454 12.6473 2.26737L15.64 4.50527L19.1786 3.31611Z" fill="url(#wand_gradient_1)" />
        <path d="M10.6489 3.28852C10.6322 2.25037 11.8153 1.64567 12.6469 2.26704L15.6401 4.50532L19.1782 3.31586C20.1571 2.98689 21.0908 3.91996 20.7622 4.89887L19.5727 8.43794L21.81 11.4301C22.4319 12.2618 21.8277 13.4457 20.7895 13.4291L20.8012 12.6791C21.2166 12.6859 21.4582 12.212 21.2094 11.8793L18.9721 8.88715C18.8246 8.68984 18.7833 8.43222 18.8618 8.19868L20.0512 4.66059C20.1829 4.26896 19.8091 3.89519 19.4175 4.0268L15.8794 5.21626C15.6458 5.29474 15.3882 5.25345 15.1909 5.1059L12.1987 2.86762C11.866 2.61883 11.3922 2.86143 11.3989 3.2768L11.4594 6.99262C11.4635 7.24066 11.3438 7.47463 11.1411 7.61762L8.10593 9.75825C7.76766 9.99689 7.84964 10.5199 8.2446 10.644L11.8198 11.767C12.0538 11.8405 12.2375 12.0243 12.311 12.2582L13.4341 15.8334C13.5582 16.228 14.0801 16.3097 14.3188 15.9721L16.4604 12.936L16.518 12.8647C16.662 12.7061 16.8683 12.6151 17.0854 12.6186L20.8012 12.6791L20.7891 13.4291L17.0727 13.3686L14.9321 16.4038C14.3728 17.1967 13.1889 17.0669 12.7876 16.2338L12.7182 16.0581L11.5952 12.4829L8.01999 11.3598C7.09412 11.069 6.85656 9.90134 7.5278 9.26508L7.67429 9.14594L10.7094 7.00434L10.6489 3.28852Z" fill="url(#wand_gradient_2)" />
        <path d="M5.07314 4.88824L4.44324 3.30101C4.28398 2.8997 3.71603 2.89965 3.55669 3.30094L2.92644 4.88824C2.91951 4.90563 2.90577 4.91938 2.88838 4.9263L1.30091 5.55671C0.899694 5.71604 0.899695 6.28396 1.30092 6.44329L2.88838 7.0737C2.90577 7.08063 2.91951 7.09437 2.92644 7.11176L3.55668 8.69906C3.71602 9.10035 4.28397 9.1003 4.44324 8.69899L5.07314 7.11176C5.08008 7.0943 5.094 7.08061 5.11147 7.0737L6.69907 6.4433C7.10031 6.28398 7.10031 5.71602 6.69907 5.5567L5.11147 4.9263C5.094 4.91939 5.08008 4.9057 5.07314 4.88824Z" fill="url(#wand_gradient_3)" />
        <path d="M19.0731 18.8882L18.4432 17.301C18.284 16.8997 17.716 16.8996 17.5567 17.3009L16.9264 18.8882C16.9195 18.9056 16.9058 18.9194 16.8884 18.9263L15.3009 19.5567C14.8997 19.716 14.8997 20.284 15.3009 20.4433L16.8884 21.0737C16.9058 21.0806 16.9195 21.0944 16.9264 21.1118L17.5567 22.6991C17.716 23.1003 18.284 23.1003 18.4432 22.699L19.0731 21.1118C19.0801 21.0943 19.094 21.0806 19.1115 21.0737L20.6991 20.4433C21.1003 20.284 21.1003 19.716 20.6991 19.5567L19.1115 18.9263C19.094 18.9194 19.0801 18.9057 19.0731 18.8882Z" fill="url(#wand_gradient_4)" />
        <defs>
          <linearGradient id="wand_gradient_0" x1="9" y1="8" x2="9" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#575757" />
            <stop offset="1" stopColor="#151515" />
          </linearGradient>
          <linearGradient id="wand_gradient_1" x1="21.563" y1="2.515" x2="9.542" y2="14.536" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E3E3E5" stopOpacity=".6" />
            <stop offset="1" stopColor="#BBBBC0" stopOpacity=".6" />
          </linearGradient>
          <linearGradient id="wand_gradient_2" x1="14.603" y1="2.016" x2="14.603" y2="10.655" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wand_gradient_3" x1="4" y1="3" x2="4" y2="9" gradientUnits="userSpaceOnUse">
            <stop stopColor="#575757" />
            <stop offset="1" stopColor="#151515" />
          </linearGradient>
          <linearGradient id="wand_gradient_4" x1="18" y1="17" x2="18" y2="23" gradientUnits="userSpaceOnUse">
            <stop stopColor="#575757" />
            <stop offset="1" stopColor="#151515" />
          </linearGradient>
          <filter id="wand_filter_0" x="-100%" y="-100%" width="400%" height="400%" filterUnits="objectBoundingBox">
            <feGaussianBlur stdDeviation="2" in="SourceGraphic" result="blur" />
          </filter>
        </defs>
      </g>
    </svg>
);

export default function IssueModal({ isOpen, onClose, issue, onRegenerate }: IssueModalProps) {
    if (!isOpen || !issue) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                <div className="px-10 py-12">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-5">
                            <div className={`size-16 rounded-[24px] flex items-center justify-center shadow-xl shadow-opacity-20 
                                ${issue.status === 'fail' ? 'bg-red-500 text-white shadow-red-500/20' : 
                                  issue.status === 'warning' ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'}`}>
                                <span className="material-symbols-outlined text-[32px] font-bold">
                                    {issue.status === 'fail' ? 'error' : issue.status === 'warning' ? 'warning' : 'check_circle'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] block mb-1">Issue Remediation</span>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{issue.name}</h2>
                            </div>
                        </div>
                        <button onClick={onClose} className="size-12 rounded-2xl flex items-center justify-center hover:bg-slate-50 text-slate-400 transition-colors">
                            <span className="material-symbols-outlined text-[24px]">close</span>
                        </button>
                    </div>

                    <div className="space-y-8">
                        <section>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4 leading-none">Diagnostic Explanation</p>
                            <div className="p-8 rounded-[32px] bg-[#F8FAFC] border border-slate-100 leading-relaxed text-slate-600 font-medium">
                                {issue.description || "Detailed analysis of this metric indicates a deviation from recommended AdSense and SEO standards. This could potentially affect ranking depth and ad network trust levels."}
                            </div>
                        </section>

                        <section>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4 leading-none">AI Generated Solution</p>
                            <div className="p-8 rounded-[32px] bg-slate-900 text-white shadow-2xl relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <MagicWandIcon className="w-16 h-16" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-slate-300 font-medium leading-relaxed mb-6">
                                        Based on our domain analysis, we recommend implementing the following correction:
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="size-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 mt-1">
                                                <span className="material-symbols-outlined text-[14px] text-white">bolt</span>
                                            </div>
                                            <p className="text-[14px] font-bold text-slate-100">Ensure the resource path is accessible and correctly categorized in your server headers.</p>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="size-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 mt-1">
                                                <span className="material-symbols-outlined text-[14px] text-white">bolt</span>
                                            </div>
                                            <p className="text-[14px] font-bold text-slate-100">Update your robots.txt or sitemap if this resource was incorrectly hidden.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500 text-[18px]">verified</span>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Premium Strategy</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 rounded-2xl text-slate-500 font-bold hover:bg-slate-100 transition-colors text-[13px]"
                        >
                            Dismiss
                        </button>
                        <button 
                            onClick={() => onRegenerate(issue)}
                            className="px-8 py-3 bg-black text-white rounded-2xl font-black shadow-xl hover:shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-[13px] flex items-center gap-2.5"
                        >
                            <span className="material-symbols-outlined text-[20px]">refresh</span>
                            Regenerate FIX
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
