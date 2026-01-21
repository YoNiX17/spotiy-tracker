import { NextRequest, NextResponse } from 'next/server';
import { saveListeningHistory, ListeningEntry } from '@/lib/pocketbase';

export async function POST(request: NextRequest) {
    const userId = request.cookies.get('spotify_user_id')?.value;

    if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const entries: ListeningEntry[] = body.entries;

        if (!entries || !Array.isArray(entries)) {
            return NextResponse.json({ error: 'Invalid entries' }, { status: 400 });
        }

        // Save to Firebase
        await saveListeningHistory(userId, entries);

        return NextResponse.json({
            success: true,
            count: entries.length
        });
    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
