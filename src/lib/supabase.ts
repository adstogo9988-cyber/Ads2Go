import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Suppress benign "Refresh Token Not Found" errors from gotrue-js that break Next.js Turbopack dev overlay
if (typeof window !== 'undefined') {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
        const errorMsg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || '');
        if (errorMsg.includes('Refresh Token Not Found') || errorMsg.includes('AuthApiError')) {
            return;
        }
        originalConsoleError(...args);
    };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
