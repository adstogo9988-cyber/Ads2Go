import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateApiKey() {
    return 'ad2go_' + crypto.randomBytes(32).toString('hex');
}

function hashApiKey(key: string) {
    return crypto.createHash('sha256').update(key).digest('hex');
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options)
                            })
                        } catch (error) { }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rawKey = generateApiKey();
        const hashedKey = hashApiKey(rawKey);

        const { data, error } = await supabase
            .from('api_keys')
            .insert({
                user_id: user.id,
                name: name,
                key_hash: hashedKey
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating API key:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Return the RAW key exactly ONCE. We only store the hash.
        return NextResponse.json({
            ...data,
            api_key: rawKey
        });

    } catch (err) {
        console.error('Server error API Keys:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options)
                            })
                        } catch (error) { }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('api_keys')
            .select('id, name, created_at, last_used_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options)
                            })
                        } catch (error) { }
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { error } = await supabase
            .from('api_keys')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
    }
}
