import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSessionTokens } from '@/lib/pocketbase';
import { SpotifyAPI, refreshAccessToken, TimeRange } from '@/lib/spotify';

export async function GET(request: NextRequest) {
    const userId = request.cookies.get('spotify_user_id')?.value;
    const timeRange = (request.nextUrl.searchParams.get('time_range') || 'medium_term') as TimeRange;

    if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Get session from Firebase
        let session = await getSession(userId);

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 401 });
        }

        // Check if token expired
        if (Date.now() >= session.expiresAt) {
            const newTokens = await refreshAccessToken(session.refreshToken);
            session.accessToken = newTokens.access_token;
            session.expiresAt = Date.now() + newTokens.expires_in * 1000;
            await updateSessionTokens(userId, session.accessToken, session.expiresAt);
        }

        const spotify = new SpotifyAPI(session.accessToken);

        // Get top tracks and artists
        const [topTracks, topArtists] = await Promise.all([
            spotify.getTopTracks(timeRange, 50),
            spotify.getTopArtists(timeRange, 50),
        ]);

        return NextResponse.json({
            topTracks: topTracks.items,
            topArtists: topArtists.items,
        });
    } catch (error: any) {
        console.error('Top items error:', error);

        if (error.message === 'TOKEN_EXPIRED') {
            return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
