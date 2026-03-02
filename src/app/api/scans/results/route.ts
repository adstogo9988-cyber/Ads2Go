import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the SERVICE ROLE key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Scan ID is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('adsense_scans')
            .select('*, sites(url, domain)')
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
        }

        return NextResponse.json({ data });

    } catch (err: any) {
        console.error("API Scan fetch error:", err);
        return NextResponse.json({ error: err.message || "Failed to fetch scan results" }, { status: 500 });
    }
}
