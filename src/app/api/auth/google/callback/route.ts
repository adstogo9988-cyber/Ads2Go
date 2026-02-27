import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            console.error('OAuth Error:', error);
            return NextResponse.redirect(new URL('/dashboard/settings?error=oauth_failed', request.url));
        }

        if (!code) {
            return NextResponse.redirect(new URL('/dashboard/settings?error=no_code', request.url));
        }

        const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const redirectUri = `${origin}/api/auth/google/callback`;

        // Exchange auth code for access & refresh tokens
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID || '',
                client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await response.json();

        if (!response.ok) {
            console.error('Token fetch error:', tokenData);
            return NextResponse.redirect(new URL('/dashboard/settings?error=token_exchange_failed', request.url));
        }

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token || null;
        const expiresIn = tokenData.expires_in;
        const scope = tokenData.scope || '';

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

        // Initialize Supabase admin client to save tokens
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options)
                            })
                        } catch (error) {
                            // Ignore if we can't set cookies
                        }
                    },
                },
            }
        );

        // Get the current user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.redirect(new URL('/login?error=unauthorized_oauth', request.url));
        }

        // Insert or update integration for user
        const updateData: any = {
            user_id: user.id,
            provider: 'google',
            access_token: accessToken,
            scopes: scope.split(' '),
            token_expires_at: expiresAt.toISOString(),
        };

        if (refreshToken) {
            updateData.refresh_token = refreshToken;
        }

        const { error: insertError } = await supabase
            .from('user_integrations')
            .upsert(updateData, { onConflict: 'user_id,provider' });

        if (insertError) {
            console.error('Error saving integration:', insertError);
            return NextResponse.redirect(new URL('/dashboard/settings?error=db_save_failed', request.url));
        }

        return NextResponse.redirect(new URL('/dashboard/settings?success=google_connected', request.url));
    } catch (error) {
        console.error('Unexpected callback error:', error);
        return NextResponse.redirect(new URL('/dashboard/settings?error=unexpected_error', request.url));
    }
}
