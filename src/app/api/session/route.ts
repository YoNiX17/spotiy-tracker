import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/pocketbase';

export async function GET(request: NextRequest) {
    const userId = request.cookies.get('spotify_user_id')?.value;

    if (!userId) {
        return NextResponse.json({ authenticated: false });
    }

    try {
        const session = await getSession(userId);

        if (!session) {
            return NextResponse.json({ authenticated: false });
        }

        return NextResponse.json({
            authenticated: true,
            user: {
                id: session.userId,
                displayName: session.displayName,
                profileImage: session.profileImage,
            },
        });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json({ authenticated: false });
    }
}
