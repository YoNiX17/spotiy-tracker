// Spotify API Configuration
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/auth/callback';

// Scopes needed for the app
export const SPOTIFY_SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-read-recently-played',
    'user-top-read',
    'user-library-read',
].join(' ');

// Generate authorization URL
export function getAuthUrl(): string {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: SPOTIFY_SCOPES,
        show_dialog: 'true',
    });
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function getAccessToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
}> {
    console.log('getAccessToken called with redirect_uri:', REDIRECT_URI);

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Token exchange failed:', response.status, errorBody);
        throw new Error(`Failed to get access token: ${response.status} - ${errorBody}`);
    }

    return response.json();
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
}> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to refresh access token');
    }

    return response.json();
}

// Spotify API client
export class SpotifyAPI {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async fetch<T>(endpoint: string): Promise<T> {
        const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('TOKEN_EXPIRED');
            }
            throw new Error(`Spotify API error: ${response.status}`);
        }

        // Handle 204 No Content (when nothing is playing)
        if (response.status === 204) {
            return null as T;
        }

        return response.json();
    }

    // Get current user profile
    async getProfile(): Promise<SpotifyUser> {
        return this.fetch<SpotifyUser>('/me');
    }

    // Get currently playing track
    async getCurrentlyPlaying(): Promise<CurrentlyPlaying | null> {
        return this.fetch<CurrentlyPlaying | null>('/me/player/currently-playing');
    }

    // Get recently played tracks (max 50)
    async getRecentlyPlayed(limit = 50): Promise<RecentlyPlayedResponse> {
        return this.fetch<RecentlyPlayedResponse>(`/me/player/recently-played?limit=${limit}`);
    }

    // Get top tracks
    async getTopTracks(timeRange: TimeRange = 'medium_term', limit = 50): Promise<TopTracksResponse> {
        return this.fetch<TopTracksResponse>(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
    }

    // Get top artists
    async getTopArtists(timeRange: TimeRange = 'medium_term', limit = 50): Promise<TopArtistsResponse> {
        return this.fetch<TopArtistsResponse>(`/me/top/artists?time_range=${timeRange}&limit=${limit}`);
    }

    // Get saved tracks count
    async getSavedTracksCount(): Promise<number> {
        const response = await this.fetch<{ total: number }>('/me/tracks?limit=1');
        return response.total;
    }

    // Get followed artists count
    async getFollowedArtistsCount(): Promise<number> {
        const response = await this.fetch<{ artists: { total: number } }>('/me/following?type=artist&limit=1');
        return response.artists.total;
    }
}

// Types
export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export interface SpotifyUser {
    id: string;
    display_name: string;
    email: string;
    images: { url: string; width: number; height: number }[];
    followers: { total: number };
    country: string;
    product: string; // 'premium' | 'free'
}

export interface SpotifyTrack {
    id: string;
    name: string;
    album: {
        id: string;
        name: string;
        images: { url: string; width: number; height: number }[];
    };
    artists: { id: string; name: string }[];
    duration_ms: number;
    explicit: boolean;
    external_urls: { spotify: string };
    preview_url: string | null;
}

export interface SpotifyArtist {
    id: string;
    name: string;
    images: { url: string; width: number; height: number }[];
    genres: string[];
    followers: { total: number };
    popularity: number;
    external_urls: { spotify: string };
}

export interface CurrentlyPlaying {
    is_playing: boolean;
    progress_ms: number;
    item: SpotifyTrack;
    currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
}

export interface RecentlyPlayedResponse {
    items: {
        track: SpotifyTrack;
        played_at: string;
    }[];
    next: string | null;
    cursors: { after: string; before: string };
}

export interface TopTracksResponse {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
}

export interface TopArtistsResponse {
    items: SpotifyArtist[];
    total: number;
    limit: number;
    offset: number;
}

// Utility functions
export function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatListeningTime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
}

export function getTimeRangeLabel(timeRange: TimeRange): string {
    switch (timeRange) {
        case 'short_term': return '4 dernières semaines';
        case 'medium_term': return '6 derniers mois';
        case 'long_term': return 'Depuis toujours';
    }
}
