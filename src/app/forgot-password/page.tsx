import React from "react";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Reset Password | Ad2Go",
  description: "Reset your Ad2Go account password."
};

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10 overflow-hidden bg-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#fafafa] to-[#f4f4f5] z-0" />
      <div className="absolute -top-[500px] -right-[500px] w-[1000px] h-[1000px] rounded-full bg-gradient-to-b from-[#e2e8f0]/50 to-transparent blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 relative z-10 transition-all">
        <div className="text-center mb-10 relative z-10">
          <Link href="/" className="inline-block mb-8 relative">
            <div className="bg-slate-900 rounded-full p-3 shadow-lg shadow-slate-200 inline-flex">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl font-medium text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-slate-500 text-sm mt-3 font-light leading-relaxed">Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        <form className="space-y-6 relative z-10" action="#" method="POST">
             <div className="space-y-2">
                <label htmlFor="email" className="text-[13px] font-medium text-slate-700 ml-1">Email address</label>
                <div className="relative">
                    <input id="email" name="email" type="email" required className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 text-slate-900 rounded-[16px] focus:ring-1 focus:ring-slate-900 focus:border-slate-900 hover:border-slate-300 transition-all font-light placeholder:text-slate-400" placeholder="name@company.com" />
                </div>
            </div>

            <button type="submit" className="w-full bg-slate-900 text-white font-medium py-3.5 px-4 rounded-[16px] hover:bg-slate-800 transition-all shadow-md shadow-slate-200 flex items-center justify-center group">
                Recover Account
            </button>
        </form>

        <div className="mt-8 text-center text-[13px] text-slate-500 font-light relative z-10 pt-6 border-t border-slate-100">
          Remember your password? <Link href="/login" className="text-slate-900 font-medium hover:underline hover:underline-offset-4 decoration-slate-300 ml-1">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
