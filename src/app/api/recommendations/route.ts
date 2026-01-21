import { NextRequest, NextResponse } from 'next/server';
import { getSession, getFullHistory, updateSessionTokens } from '@/lib/pocketbase';
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
            try {
                const newTokens = await refreshAccessToken(session.refreshToken);
                accessToken = newTokens.access_token;
                await updateSessionTokens(userId, newTokens.access_token, Date.now() + newTokens.expires_in * 1000);
            } catch (e) {
                console.error('Token refresh failed:', e);
            }
        }

        // Get top tracks from history for seed - filter valid IDs
        const history = await getFullHistory(userId);
        const validTrackIds = history
            .map(t => t.trackId)
            .filter(id => id && id.length === 22);
        const topTrackIds = [...new Set(validTrackIds)].slice(0, 5);

        console.log('Recommendations: topTrackIds:', topTrackIds);

        if (topTrackIds.length === 0) {
            // Fallback: use Spotify's top tracks API instead
            const topResponse = await fetch(
                'https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=medium_term',
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (topResponse.ok) {
                const topData = await topResponse.json();
                const fallbackIds = topData.items?.map((t: any) => t.id).slice(0, 5) || [];
                if (fallbackIds.length > 0) {
                    topTrackIds.push(...fallbackIds);
                }
            }
        }

        if (topTrackIds.length === 0) {
            return NextResponse.json({ tracks: [], message: 'No seed tracks available' });
        }

        // Get recommendations from Spotify
        const response = await fetch(
            `https://api.spotify.com/v1/recommendations?seed_tracks=${topTrackIds.join(',')}&limit=10`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Recommendations API error:', response.status, errorText);
            return NextResponse.json({ tracks: [], error: `API error: ${response.status}` });
        }

        const data = await response.json();

        if (!data.tracks || data.tracks.length === 0) {
            return NextResponse.json({ tracks: [], message: 'No recommendations found' });
        }

        const tracks = data.tracks.map((track: any) => ({
            id: track.id,
            name: track.name,
            artist: track.artists.map((a: any) => a.name).join(', '),
            album: track.album.name,
            image: track.album.images[0]?.url || '',
            preview_url: track.preview_url,
            spotifyUrl: track.external_urls.spotify,
        }));

        return NextResponse.json({ tracks });
    } catch (error) {
        console.error('Recommendations error:', error);
        return NextResponse.json({ tracks: [], error: String(error) });
    }
}
