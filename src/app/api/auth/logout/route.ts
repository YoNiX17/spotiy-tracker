import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const response = NextResponse.redirect(new URL('/', request.url));

    // Clear the cookie
    response.cookies.set('spotify_user_id', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Expire immediately
    });

    return response;
}
