import { NextRequest, NextResponse } from 'next/server';
import { getSession, getFullHistory, getStreak, saveStreak, StreakData } from '@/lib/pocketbase';

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

        // Get current streak data
        let streakData: StreakData = await getStreak(userId) || {
            currentStreak: 0,
            longestStreak: 0,
            lastListenDate: ''
        };

        // Check if user listened today
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Get user's history to check if they listened today
        const history = await getFullHistory(userId);

        // Check for listens today
        const todayListens = history.filter((entry) => {
            const entryDate = new Date(entry.played_at).toISOString().split('T')[0];
            return entryDate === today;
        });

        if (todayListens.length > 0) {
            // User listened today
            if (streakData.lastListenDate === yesterday) {
                // Continue streak
                streakData.currentStreak += 1;
            } else if (streakData.lastListenDate !== today) {
                // Start new streak (didn't listen yesterday)
                streakData.currentStreak = 1;
            }
            // Update last listen date
            streakData.lastListenDate = today;

            // Update longest streak
            if (streakData.currentStreak > streakData.longestStreak) {
                streakData.longestStreak = streakData.currentStreak;
            }

            // Save to PocketBase
            await saveStreak(userId, streakData);
        } else if (streakData.lastListenDate !== today && streakData.lastListenDate !== yesterday) {
            // Streak broken - reset
            streakData.currentStreak = 0;
            await saveStreak(userId, streakData);
        }

        return NextResponse.json(streakData);
    } catch (error) {
        console.error('Streak error:', error);
        return NextResponse.json({ error: 'Failed to fetch streak' }, { status: 500 });
    }
}
