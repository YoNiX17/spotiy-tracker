import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, SpotifyAPI } from '@/lib/spotify';
import { saveSession, SpotifySession } from '@/lib/pocketbase';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('🔐 OAuth Callback received');
    console.log('Code:', code ? 'present' : 'missing');
    console.log('Error:', error);

    if (error) {
        console.log('❌ Spotify returned error:', error);
        return NextResponse.redirect(new URL('/?error=access_denied', request.url));
    }

    if (!code) {
        console.log('❌ No code in callback');
        return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    try {
        console.log('🔄 Exchanging code for tokens...');
        // Exchange code for tokens
        const tokens = await getAccessToken(code);
        console.log('✅ Got tokens, access_token length:', tokens.access_token?.length);

        // Get user profile
        console.log('🔄 Fetching user profile...');
        const spotify = new SpotifyAPI(tokens.access_token);
        const profile = await spotify.getProfile();
        console.log('✅ Got profile for:', profile.display_name);

        // Create session
        const session: SpotifySession = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + tokens.expires_in * 1000,
            userId: profile.id,
            displayName: profile.display_name,
            profileImage: profile.images[0]?.url || null,
        };

        // Save to Firebase
        console.log('🔄 Saving session to Firebase...');
        await saveSession(profile.id, session);
        console.log('✅ Session saved');

        // Redirect to dashboard with userId in cookie
        const baseUrl = process.env.NEXTAUTH_URL || 'http://127.0.0.1:3001';
        const isProduction = baseUrl.startsWith('https');
        const response = NextResponse.redirect(new URL('/dashboard', baseUrl));

        // Set cookie with user ID
        response.cookies.set('spotify_user_id', profile.id, {
            httpOnly: true,
            secure: isProduction, // true for HTTPS (production), false for HTTP (localhost)
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });

        console.log('✅ Redirecting to dashboard with cookie set (secure:', isProduction, ')');
        return response;
    } catch (err: any) {
        console.error('❌ OAuth callback error:', err.message);
        console.error('Full error:', err);
        return NextResponse.redirect(new URL(`/?error=auth_failed&details=${encodeURIComponent(err.message)}`, request.url));
    }
}
