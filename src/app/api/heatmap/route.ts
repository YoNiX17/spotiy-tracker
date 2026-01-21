import { NextRequest, NextResponse } from 'next/server';
import { getSession, getFullHistory } from '@/lib/pocketbase';

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

        // Get user's history
        const history = await getFullHistory(userId);

        // Count listens per day
        const heatmap: { [date: string]: number } = {};

        history.forEach(entry => {
            const date = new Date(entry.played_at).toISOString().split('T')[0];
            heatmap[date] = (heatmap[date] || 0) + 1;
        });

        return NextResponse.json({ heatmap });
    } catch (error) {
        console.error('Heatmap error:', error);
        return NextResponse.json({ error: 'Failed to fetch heatmap' }, { status: 500 });
    }
}
