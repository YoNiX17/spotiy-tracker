import PocketBase from 'pocketbase';

// PocketBase URL - MUST be set in environment variables
const POCKETBASE_URL = process.env.POCKETBASE_URL;

if (!POCKETBASE_URL) {
    console.error('❌ POCKETBASE_URL is not defined! Set it in your .env.local or Vercel environment variables');
}

// Initialize PocketBase client
const pb = new PocketBase(POCKETBASE_URL || '');

// Disable auto-cancellation for server-side requests
pb.autoCancellation(false);

// User session (stores tokens)
export interface SpotifySession {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    userId: string;
    displayName: string;
    profileImage: string | null;
}

// Listening history entry
export interface ListeningEntry {
    trackId: string;
    trackName: string;
    artistName: string;
    albumName: string;
    albumImage: string;
    duration_ms: number;
    played_at: string;
    spotifyUrl: string;
}

// User stats
export interface UserStats {
    totalListeningTime: number;
    totalTracks: number;
    uniqueTracks: number;
    uniqueArtists: number;
    lastUpdated: string;
}

// Save user session to PocketBase
export async function saveSession(userId: string, session: SpotifySession) {
    try {
        // Try to find existing session
        const existing = await pb.collection('spotify_sessions').getFirstListItem(
            `user_id = "${userId}"`
        ).catch(() => null);

        const data = {
            user_id: userId,
            access_token: session.accessToken,
            refresh_token: session.refreshToken,
            expires_at: session.expiresAt,
            display_name: session.displayName,
            profile_image: session.profileImage || '',
        };

        if (existing) {
            await pb.collection('spotify_sessions').update(existing.id, data);
        } else {
            await pb.collection('spotify_sessions').create(data);
        }
        console.log('✅ Session saved to PocketBase');
    } catch (error) {
        console.error('Error saving session:', error);
    }
}

// Get user session from PocketBase
export async function getSession(userId: string): Promise<SpotifySession | null> {
    try {
        const record = await pb.collection('spotify_sessions').getFirstListItem(
            `user_id = "${userId}"`
        );

        return {
            accessToken: record.access_token,
            refreshToken: record.refresh_token,
            expiresAt: record.expires_at,
            userId: record.user_id,
            displayName: record.display_name,
            profileImage: record.profile_image || null,
        };
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
}

// Update session tokens
export async function updateSessionTokens(userId: string, accessToken: string, expiresAt: number) {
    try {
        const existing = await pb.collection('spotify_sessions').getFirstListItem(
            `user_id = "${userId}"`
        );

        await pb.collection('spotify_sessions').update(existing.id, {
            access_token: accessToken,
            expires_at: expiresAt,
        });
        console.log('✅ Tokens updated in PocketBase');
    } catch (error) {
        console.error('Error updating tokens:', error);
    }
}

// Save listening history entry
export async function saveListeningEntry(userId: string, entry: ListeningEntry) {
    try {
        await pb.collection('spotify_history').create({
            user_id: userId,
            track_id: entry.trackId,
            track_name: entry.trackName,
            artist_name: entry.artistName,
            album_name: entry.albumName,
            album_image: entry.albumImage,
            duration_ms: entry.duration_ms,
            played_at: entry.played_at,
            spotify_url: entry.spotifyUrl,
        });
    } catch (error) {
        console.error('Error saving listening entry:', error);
    }
}

// Save multiple listening entries (batch) - OPTIMIZED for performance
export async function saveListeningHistory(userId: string, entries: ListeningEntry[]) {
    if (entries.length === 0) return;

    try {
        // Get existing entries to avoid duplicates (only fetch played_at for efficiency)
        const existingRecords = await pb.collection('spotify_history').getFullList({
            filter: `user_id = "${userId}"`,
            fields: 'played_at',
        });

        const existingTimestamps = new Set(
            existingRecords.map(r => new Date(r.played_at).getTime())
        );

        // Filter out duplicates first
        const newEntries = entries.filter(entry => {
            const timestamp = new Date(entry.played_at).getTime();
            return !existingTimestamps.has(timestamp);
        });

        if (newEntries.length === 0) {
            console.log('No new entries to save');
            return;
        }

        // Insert in parallel batches of 50 for much better performance
        const BATCH_SIZE = 50;
        let savedCount = 0;

        for (let i = 0; i < newEntries.length; i += BATCH_SIZE) {
            const batch = newEntries.slice(i, i + BATCH_SIZE);
            
            // Execute all inserts in parallel
            await Promise.all(batch.map(entry =>
                pb.collection('spotify_history').create({
                    user_id: userId,
                    track_id: entry.trackId,
                    track_name: entry.trackName,
                    artist_name: entry.artistName,
                    album_name: entry.albumName,
                    album_image: entry.albumImage,
                    duration_ms: entry.duration_ms,
                    played_at: entry.played_at,
                    spotify_url: entry.spotifyUrl,
                })
            ));

            savedCount += batch.length;
            console.log(`Progress: ${savedCount}/${newEntries.length} entries saved`);
        }

        console.log(`✅ Saved ${savedCount} new listening entries`);
    } catch (error) {
        console.error('Error saving listening history:', error);
        throw error; // Re-throw to show error in UI
    }
}

// Get listening history
export async function getListeningHistory(userId: string, limit = 100): Promise<ListeningEntry[]> {
    try {
        const records = await pb.collection('spotify_history').getList(1, limit, {
            filter: `user_id = "${userId}"`,
            sort: '-played_at',
        });

        return records.items.map(r => ({
            trackId: r.track_id,
            trackName: r.track_name,
            artistName: r.artist_name,
            albumName: r.album_name,
            albumImage: r.album_image,
            duration_ms: r.duration_ms,
            played_at: r.played_at,
            spotifyUrl: r.spotify_url,
        }));
    } catch (error) {
        console.error('Error getting listening history:', error);
        return [];
    }
}

// Get full history for stats
export async function getFullHistory(userId: string): Promise<ListeningEntry[]> {
    try {
        const records = await pb.collection('spotify_history').getFullList({
            filter: `user_id = "${userId}"`,
            sort: '-played_at',
        });

        return records.map(r => ({
            trackId: r.track_id,
            trackName: r.track_name,
            artistName: r.artist_name,
            albumName: r.album_name,
            albumImage: r.album_image,
            duration_ms: r.duration_ms,
            played_at: r.played_at,
            spotifyUrl: r.spotify_url,
        }));
    } catch (error) {
        console.error('Error getting full history:', error);
        return [];
    }
}

// Calculate and save user stats
export async function updateUserStats(userId: string) {
    const history = await getFullHistory(userId);

    if (history.length === 0) return null;

    const uniqueTrackIds = new Set(history.map(e => e.trackId));
    const uniqueArtists = new Set(history.map(e => e.artistName));
    const totalListeningTime = history.reduce((acc, e) => acc + e.duration_ms, 0);

    const stats: UserStats = {
        totalListeningTime,
        totalTracks: history.length,
        uniqueTracks: uniqueTrackIds.size,
        uniqueArtists: uniqueArtists.size,
        lastUpdated: new Date().toISOString(),
    };

    try {
        const existing = await pb.collection('spotify_stats').getFirstListItem(
            `user_id = "${userId}"`
        ).catch(() => null);

        const data = {
            user_id: userId,
            total_listening_time: stats.totalListeningTime,
            total_tracks: stats.totalTracks,
            unique_tracks: stats.uniqueTracks,
            unique_artists: stats.uniqueArtists,
            last_updated: stats.lastUpdated,
        };

        if (existing) {
            await pb.collection('spotify_stats').update(existing.id, data);
        } else {
            await pb.collection('spotify_stats').create(data);
        }

        console.log('✅ Stats updated');
        return stats;
    } catch (error) {
        console.error('Error updating stats:', error);
        return null;
    }
}

// Get user stats
export async function getUserStats(userId: string): Promise<UserStats | null> {
    try {
        const record = await pb.collection('spotify_stats').getFirstListItem(
            `user_id = "${userId}"`
        );

        return {
            totalListeningTime: record.total_listening_time,
            totalTracks: record.total_tracks,
            uniqueTracks: record.unique_tracks,
            uniqueArtists: record.unique_artists,
            lastUpdated: record.last_updated,
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return null;
    }
}

// Get top tracks from history
export async function getTopTracksFromHistory(userId: string, limit = 10): Promise<{
    trackId: string;
    trackName: string;
    artistName: string;
    albumImage: string;
    playCount: number;
    totalDuration: number;
}[]> {
    const history = await getFullHistory(userId);

    const trackCounts = new Map<string, {
        trackName: string;
        artistName: string;
        albumImage: string;
        count: number;
        duration: number;
    }>();

    history.forEach(entry => {
        const existing = trackCounts.get(entry.trackId);
        if (existing) {
            existing.count++;
            existing.duration += entry.duration_ms;
        } else {
            trackCounts.set(entry.trackId, {
                trackName: entry.trackName,
                artistName: entry.artistName,
                albumImage: entry.albumImage,
                count: 1,
                duration: entry.duration_ms,
            });
        }
    });

    const sorted = Array.from(trackCounts.entries())
        .map(([trackId, data]) => ({
            trackId,
            trackName: data.trackName,
            artistName: data.artistName,
            albumImage: data.albumImage,
            playCount: data.count,
            totalDuration: data.duration,
        }))
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, limit);

    return sorted;
}

// Get top artists from history
export async function getTopArtistsFromHistory(userId: string, limit = 10): Promise<{
    artistName: string;
    playCount: number;
    totalDuration: number;
}[]> {
    const history = await getFullHistory(userId);

    const artistCounts = new Map<string, { count: number; duration: number }>();

    history.forEach(entry => {
        const existing = artistCounts.get(entry.artistName);
        if (existing) {
            existing.count++;
            existing.duration += entry.duration_ms;
        } else {
            artistCounts.set(entry.artistName, {
                count: 1,
                duration: entry.duration_ms,
            });
        }
    });

    const sorted = Array.from(artistCounts.entries())
        .map(([artistName, data]) => ({
            artistName,
            playCount: data.count,
            totalDuration: data.duration,
        }))
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, limit);

    return sorted;
}

// ============================================
// STREAK FUNCTIONS
// ============================================

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastListenDate: string;
}

// Get user streak
export async function getStreak(userId: string): Promise<StreakData | null> {
    try {
        const record = await pb.collection('spotify_streaks').getFirstListItem(
            `user_id = "${userId}"`
        );
        return {
            currentStreak: record.current_streak || 0,
            longestStreak: record.longest_streak || 0,
            lastListenDate: record.last_listen_date || '',
        };
    } catch (error) {
        // Not found - return default
        return null;
    }
}

// Save/Update user streak
export async function saveStreak(userId: string, streak: StreakData): Promise<void> {
    try {
        const existing = await pb.collection('spotify_streaks').getFirstListItem(
            `user_id = "${userId}"`
        ).catch(() => null);

        const data = {
            user_id: userId,
            current_streak: streak.currentStreak,
            longest_streak: streak.longestStreak,
            last_listen_date: streak.lastListenDate,
        };

        if (existing) {
            await pb.collection('spotify_streaks').update(existing.id, data);
        } else {
            await pb.collection('spotify_streaks').create(data);
        }
    } catch (error) {
        console.error('Error saving streak:', error);
    }
}

// ============================================
// ACHIEVEMENTS FUNCTIONS
// ============================================

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string;
}

// Get user achievements
export async function getAchievements(userId: string): Promise<string[]> {
    try {
        const record = await pb.collection('spotify_achievements').getFirstListItem(
            `user_id = "${userId}"`
        );
        return record.unlocked_achievements || [];
    } catch (error) {
        return [];
    }
}

// Save user achievements
export async function saveAchievements(userId: string, achievements: string[]): Promise<void> {
    try {
        const existing = await pb.collection('spotify_achievements').getFirstListItem(
            `user_id = "${userId}"`
        ).catch(() => null);

        const data = {
            user_id: userId,
            unlocked_achievements: achievements,
            updated_at: new Date().toISOString(),
        };

        if (existing) {
            await pb.collection('spotify_achievements').update(existing.id, data);
        } else {
            await pb.collection('spotify_achievements').create(data);
        }
    } catch (error) {
        console.error('Error saving achievements:', error);
    }
}

// Export PocketBase instance for direct access if needed
export { pb };
