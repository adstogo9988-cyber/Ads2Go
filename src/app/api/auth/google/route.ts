import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        // Redirect URI
        const redirectUri = `${origin}/api/auth/google/callback`;

        // Google OAuth endpoint
        const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

        // Scopes needed for integrations
        const scopes = [
            'https://www.googleapis.com/auth/webmasters.readonly', // Search Console
            'https://www.googleapis.com/auth/adsense.readonly'    // AdSense
        ];

        // Parameters
        const params = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: scopes.join(' '),
            access_type: 'offline', // Request a refresh token
            prompt: 'consent' // Force to get refresh token
        });

        // Check if missing Client ID
        if (!process.env.GOOGLE_CLIENT_ID) {
            return NextResponse.json(
                { error: 'Google Client ID is not configured.' },
                { status: 500 }
            );
        }

        return NextResponse.redirect(`${oauth2Endpoint}?${params.toString()}`);
    } catch (error) {
        console.error('Error initiating Google OAuth:', error);
        return NextResponse.json({ error: 'Failed to initiate Google OAuth' }, { status: 500 });
    }
}
