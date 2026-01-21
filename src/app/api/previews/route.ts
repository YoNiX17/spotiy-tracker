import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSessionTokens } from '@/lib/pocketbase';
import { refreshAccessToken } from '@/lib/spotify';

export async function GET(request: NextRequest) {
    const userId = request.cookies.get('spotify_user_id')?.value;
    const ids = request.nextUrl.searchParams.get('ids');

    if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!ids) {
        return NextResponse.json({ error: 'No track IDs provided' }, { status: 400 });
    }

    try {
        const session = await getSession(userId);
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 401 });
        }

        // Refresh token if needed
        let accessToken = session.accessToken;
        if (Date.now() > session.expiresAt - 60000) {
            try {
                const newTokens = await refreshAccessToken(session.refreshToken);
                accessToken = newTokens.access_token;
                await updateSessionTokens(userId, newTokens.access_token, Date.now() + newTokens.expires_in * 1000);
            } catch (e) {
                console.error('Token refresh failed:', e);
            }
        }

        // Fetch tracks from Spotify
        const response = await fetch(
            `https://api.spotify.com/v1/tracks?ids=${ids}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
            return NextResponse.json({ previews: [] });
        }

        const data = await response.json();

        const previews = data.tracks
            ?.filter((t: any) => t !== null)
            .map((track: any) => ({
                id: track.id,
                preview_url: track.preview_url,
            })) || [];

        return NextResponse.json({ previews });
    } catch (error) {
        console.error('Previews error:', error);
        return NextResponse.json({ previews: [] });
    }
}
