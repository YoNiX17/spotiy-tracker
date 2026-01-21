import { NextRequest, NextResponse } from 'next/server';
import { getSession, getFullHistory, getStreak } from '@/lib/pocketbase';

// All achievements - organized by category with progressive goals
const ACHIEVEMENTS_CONFIG = [
    // ===== LISTENING MILESTONES (tracks) =====
    { id: 'first_steps', name: 'Premiers Pas', description: '10 écoutes', icon: 'fa-shoe-prints', target: 10, category: 'listening', iconColor: 'text-blue-400', bgColor: 'bg-blue-500/20', type: 'tracks' },
    { id: 'music_lover', name: 'Mélomane', description: '100 écoutes', icon: 'fa-heart', target: 100, category: 'listening', iconColor: 'text-pink-400', bgColor: 'bg-pink-500/20', type: 'tracks' },
    { id: 'addict', name: 'Accro', description: '500 écoutes', icon: 'fa-bolt', target: 500, category: 'listening', iconColor: 'text-yellow-400', bgColor: 'bg-yellow-500/20', type: 'tracks' },
    { id: 'marathoner', name: 'Marathonien', description: '1 000 écoutes', icon: 'fa-person-running', target: 1000, category: 'listening', iconColor: 'text-orange-400', bgColor: 'bg-orange-500/20', type: 'tracks' },
    { id: 'legend', name: 'Légende', description: '5 000 écoutes', icon: 'fa-crown', target: 5000, category: 'listening', iconColor: 'text-amber-400', bgColor: 'bg-amber-500/20', type: 'tracks' },
    { id: 'mythic', name: 'Mythique', description: '10 000 écoutes', icon: 'fa-gem', target: 10000, category: 'listening', iconColor: 'text-purple-400', bgColor: 'bg-purple-500/20', type: 'tracks' },
    { id: 'godlike', name: 'Divin', description: '25 000 écoutes', icon: 'fa-star', target: 25000, category: 'listening', iconColor: 'text-yellow-300', bgColor: 'bg-yellow-400/20', type: 'tracks' },
    { id: 'immortal', name: 'Immortel', description: '50 000 écoutes', icon: 'fa-infinity', target: 50000, category: 'listening', iconColor: 'text-cyan-300', bgColor: 'bg-cyan-400/20', type: 'tracks' },

    // ===== TIME MILESTONES (minutes) =====
    { id: 'hour_1', name: '1 Heure', description: '60 minutes', icon: 'fa-clock', target: 60, category: 'time', iconColor: 'text-cyan-400', bgColor: 'bg-cyan-500/20', type: 'minutes' },
    { id: 'hour_10', name: '10 Heures', description: '600 minutes', icon: 'fa-hourglass-half', target: 600, category: 'time', iconColor: 'text-teal-400', bgColor: 'bg-teal-500/20', type: 'minutes' },
    { id: 'hour_100', name: 'Centurion', description: '6 000 minutes', icon: 'fa-hourglass', target: 6000, category: 'time', iconColor: 'text-emerald-400', bgColor: 'bg-emerald-500/20', type: 'minutes' },
    { id: 'time_500h', name: 'Dédié', description: '30 000 min (500h)', icon: 'fa-clock-rotate-left', target: 30000, category: 'time', iconColor: 'text-green-400', bgColor: 'bg-green-500/20', type: 'minutes' },
    { id: 'time_1000h', name: 'Passionné', description: '60 000 min (1000h)', icon: 'fa-stopwatch', target: 60000, category: 'time', iconColor: 'text-lime-400', bgColor: 'bg-lime-500/20', type: 'minutes' },
    { id: 'time_100k', name: '100K Master', description: '100 000 minutes', icon: 'fa-trophy', target: 100000, category: 'time', iconColor: 'text-yellow-500', bgColor: 'bg-yellow-600/20', type: 'minutes' },
    { id: 'time_200k', name: 'Légende Ultime', description: '200 000 minutes', icon: 'fa-medal', target: 200000, category: 'time', iconColor: 'text-orange-500', bgColor: 'bg-orange-600/20', type: 'minutes' },
    { id: 'time_500k', name: 'Dieu de la Musique', description: '500 000 minutes', icon: 'fa-dragon', target: 500000, category: 'time', iconColor: 'text-red-500', bgColor: 'bg-red-600/20', type: 'minutes' },

    // ===== STREAK ACHIEVEMENTS =====
    { id: 'streak_3', name: 'Régulier', description: '3 jours de streak', icon: 'fa-fire', target: 3, category: 'streak', iconColor: 'text-orange-400', bgColor: 'bg-orange-500/20', type: 'streak' },
    { id: 'streak_7', name: 'Semainier', description: '7 jours de streak', icon: 'fa-fire-flame-curved', target: 7, category: 'streak', iconColor: 'text-orange-500', bgColor: 'bg-orange-600/20', type: 'streak' },
    { id: 'streak_14', name: 'Dévoué', description: '14 jours de streak', icon: 'fa-fire-flame-simple', target: 14, category: 'streak', iconColor: 'text-red-400', bgColor: 'bg-red-500/20', type: 'streak' },
    { id: 'streak_30', name: 'Inarrêtable', description: '30 jours de streak', icon: 'fa-meteor', target: 30, category: 'streak', iconColor: 'text-red-500', bgColor: 'bg-red-600/20', type: 'streak' },
    { id: 'streak_60', name: 'Machine', description: '60 jours de streak', icon: 'fa-robot', target: 60, category: 'streak', iconColor: 'text-purple-500', bgColor: 'bg-purple-600/20', type: 'streak' },
    { id: 'streak_100', name: 'Centenaire', description: '100 jours de streak', icon: 'fa-hundred-points', target: 100, category: 'streak', iconColor: 'text-yellow-400', bgColor: 'bg-yellow-500/20', type: 'streak' },
    { id: 'streak_365', name: 'Annuel', description: '365 jours de streak', icon: 'fa-calendar-check', target: 365, category: 'streak', iconColor: 'text-green-400', bgColor: 'bg-green-500/20', type: 'streak' },

    // ===== DISCOVERY ACHIEVEMENTS (artists) =====
    { id: 'artists_10', name: 'Curieux', description: '10 artistes', icon: 'fa-users', target: 10, category: 'discovery', iconColor: 'text-purple-400', bgColor: 'bg-purple-500/20', type: 'artists' },
    { id: 'artists_50', name: 'Explorateur', description: '50 artistes', icon: 'fa-compass', target: 50, category: 'discovery', iconColor: 'text-violet-400', bgColor: 'bg-violet-500/20', type: 'artists' },
    { id: 'artists_100', name: 'Globe-Trotter', description: '100 artistes', icon: 'fa-earth-americas', target: 100, category: 'discovery', iconColor: 'text-indigo-400', bgColor: 'bg-indigo-500/20', type: 'artists' },
    { id: 'artists_250', name: 'Collectionneur', description: '250 artistes', icon: 'fa-layer-group', target: 250, category: 'discovery', iconColor: 'text-blue-400', bgColor: 'bg-blue-500/20', type: 'artists' },
    { id: 'artists_500', name: 'Encyclopédie', description: '500 artistes', icon: 'fa-book', target: 500, category: 'discovery', iconColor: 'text-cyan-400', bgColor: 'bg-cyan-500/20', type: 'artists' },
    { id: 'artists_1000', name: 'Omniscient', description: '1000 artistes', icon: 'fa-brain', target: 1000, category: 'discovery', iconColor: 'text-pink-400', bgColor: 'bg-pink-500/20', type: 'artists' },

    // ===== SPECIAL ACHIEVEMENTS =====
    { id: 'night_owl', name: 'Noctambule', description: 'Écoute après minuit', icon: 'fa-moon', target: 1, category: 'special', iconColor: 'text-blue-300', bgColor: 'bg-blue-400/20', type: 'night' },
    { id: 'early_bird', name: 'Lève-tôt', description: 'Écoute avant 6h', icon: 'fa-sun', target: 1, category: 'special', iconColor: 'text-yellow-300', bgColor: 'bg-yellow-400/20', type: 'early' },
    { id: 'weekend_warrior', name: 'Weekend Warrior', description: '1000 min un weekend', icon: 'fa-champagne-glasses', target: 1000, category: 'special', iconColor: 'text-pink-300', bgColor: 'bg-pink-400/20', type: 'weekend' },
];

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

        // Get user's stats
        const history = await getFullHistory(userId);
        const totalTracks = history.length;
        const totalMinutes = Math.floor(history.reduce((acc, e) => acc + e.duration_ms, 0) / 60000);
        const uniqueArtists = new Set(history.map(e => e.artistName)).size;

        // Get streak from PocketBase
        const streakData = await getStreak(userId) || { longestStreak: 0, currentStreak: 0 };

        // Check special achievements
        let hasNightOwl = false;
        let hasEarlyBird = false;
        let weekendMinutes = 0;

        history.forEach(entry => {
            const date = new Date(entry.played_at);
            const hour = date.getHours();
            const day = date.getDay();

            if (hour >= 0 && hour < 5) hasNightOwl = true;
            if (hour >= 4 && hour < 6) hasEarlyBird = true;
            if (day === 0 || day === 6) weekendMinutes += entry.duration_ms / 60000;
        });

        // Calculate achievements
        const achievements = ACHIEVEMENTS_CONFIG.map(config => {
            let progress = 0;
            let unlocked = false;

            switch (config.type) {
                case 'tracks':
                    progress = totalTracks;
                    unlocked = totalTracks >= config.target;
                    break;
                case 'minutes':
                    progress = totalMinutes;
                    unlocked = totalMinutes >= config.target;
                    break;
                case 'streak':
                    progress = Math.max(streakData.longestStreak || 0, streakData.currentStreak || 0);
                    unlocked = progress >= config.target;
                    break;
                case 'artists':
                    progress = uniqueArtists;
                    unlocked = uniqueArtists >= config.target;
                    break;
                case 'night':
                    progress = hasNightOwl ? 1 : 0;
                    unlocked = hasNightOwl;
                    break;
                case 'early':
                    progress = hasEarlyBird ? 1 : 0;
                    unlocked = hasEarlyBird;
                    break;
                case 'weekend':
                    progress = Math.floor(weekendMinutes);
                    unlocked = weekendMinutes >= config.target;
                    break;
            }

            return {
                ...config,
                progress,
                unlocked,
            };
        });

        return NextResponse.json({
            achievements,
            stats: {
                totalTracks,
                totalMinutes,
                uniqueArtists,
                longestStreak: streakData.longestStreak || 0,
            }
        });
    } catch (error) {
        console.error('Achievements error:', error);
        return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }
}
