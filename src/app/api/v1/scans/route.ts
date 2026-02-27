import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Helper to hash incoming API keys
function hashApiKey(key: string) {
    return crypto.createHash('sha256').update(key).digest('hex');
}

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        const apiKey = authHeader.split(' ')[1];
        const hashedKey = hashApiKey(apiKey);

        // Use service role to bypass RLS for API key validation
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: keyData, error: keyError } = await supabase
            .from('api_keys')
            .select('user_id')
            .eq('key_hash', hashedKey)
            .single();

        if (keyError || !keyData) {
            return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
        }

        // Update last_used_at securely
        await supabase
            .from('api_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('key_hash', hashedKey);

        const userId = keyData.user_id;

        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get('limit') || '10';
        const limit = parseInt(limitParam, 10);

        // Fetch scans belonging to this user
        const { data: scans, error: scansError } = await supabase
            .from('adsense_scans')
            .select(`
                id, status, overall_score, created_at, updated_at,
                site_id, sites!inner(domain)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (scansError) {
            console.error('Error fetching scans for API:', scansError);
            return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 });
        }

        return NextResponse.json({
            count: scans.length,
            data: scans
        });

    } catch (error) {
        console.error('API /v1/scans error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
