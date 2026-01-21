import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSessionTokens } from '@/lib/pocketbase';
import { refreshAccessToken } from '@/lib/spotify';

export async function GET(request: NextRequest) {
    const userId = request.cookies.get('spotify_user_id')?.value;

    if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const session = await getSession(userId);
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 401 });
        }

        // Refresh token if needed
        let accessToken = session.accessToken;
        if (Date.now() > session.expiresAt - 60000) {
            const newTokens = await refreshAccessToken(session.refreshToken);
            accessToken = newTokens.access_token;
            await updateSessionTokens(userId, newTokens.access_token, Date.now() + newTokens.expires_in * 1000);
        }

        // Get liked songs count
        const response = await fetch(
            'https://api.spotify.com/v1/me/tracks?limit=1',
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch liked songs' }, { status: 500 });
        }

        const data = await response.json();
        const total = data.total;

        // Get recently added (last week)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const recentResponse = await fetch(
            `https://api.spotify.com/v1/me/tracks?limit=50`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        let recentlyAdded = 0;
        if (recentResponse.ok) {
            const recentData = await recentResponse.json();
            recentlyAdded = recentData.items.filter((item: any) =>
                new Date(item.added_at) > new Date(weekAgo)
            ).length;
        }

        return NextResponse.json({
            total,
            recentlyAdded,
            oldestDate: null, // Would require paginating through all tracks
        });
    } catch (error) {
        console.error('Liked songs error:', error);
        return NextResponse.json({ error: 'Failed to fetch liked songs' }, { status: 500 });
    }
}
