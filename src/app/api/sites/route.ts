import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the SERVICE ROLE key
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
    try {
        const { url, domain, userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
        }
        if (!domain || !url) {
            return NextResponse.json({ error: 'URL and Domain are required' }, { status: 400 });
        }

        // Check if the site already exists for this user
        const { data: existingSite } = await supabaseAdmin
            .from('sites')
            .select('id')
            .eq('user_id', userId)
            .eq('domain', domain)
            .single();

        if (existingSite) {
            return NextResponse.json({ error: 'Site already exists in your dashboard' }, { status: 400 });
        }

        // Insert new site
        const { data: newSite, error: insertError } = await supabaseAdmin
            .from('sites')
            .insert({ url, domain, user_id: userId })
            .select('*')
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, site: newSite });
    } catch (err: any) {
        console.error("API Site creation error:", err);
        return NextResponse.json({ error: err.message || "Failed to add site" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const urlObj = new URL(req.url);
        const siteId = urlObj.searchParams.get('id');
        const userId = urlObj.searchParams.get('userId');

        if (!siteId || !userId) {
            return NextResponse.json({ error: 'Site ID and User ID are required' }, { status: 400 });
        }

        // Validate that this user actually owns this site before deleting
        const { data: existingSite, error: fetchError } = await supabaseAdmin
            .from('sites')
            .select('id')
            .eq('id', siteId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !existingSite) {
            return NextResponse.json({ error: 'Site not found or unauthorized' }, { status: 404 });
        }

        // Delete the site - cascading will delete the scans
        const { error: deleteError } = await supabaseAdmin
            .from('sites')
            .delete()
            .eq('id', siteId);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("API Site deletion error:", err);
        return NextResponse.json({ error: err.message || "Failed to delete site" }, { status: 500 });
    }
}
