'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NowPlaying from '@/components/NowPlaying';
import TopItems from '@/components/TopItems';
import StatsCard from '@/components/StatsCard';
import RecentHistory from '@/components/RecentHistory';
import GDPRImport from '@/components/GDPRImport';
import Streak from '@/components/Streak';
import Achievements from '@/components/Achievements';
import Heatmap from '@/components/Heatmap';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import MoodDetector from '@/components/MoodDetector';
import Recommendations from '@/components/Recommendations';
import LikedSongsStats from '@/components/LikedSongsStats';

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch('/api/session');
                const data = await res.json();

                if (!data.authenticated) {
                    router.push('/');
                    return;
                }

                setAuthenticated(true);
            } catch (error) {
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--theme-primary,#1db954)]/20 flex items-center justify-center animate-pulse">
                        <i className="fa-brands fa-spotify text-3xl text-[var(--theme-primary,#1db954)]"></i>
                    </div>
                    <p className="text-gray-400">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return null;
    }

    return (
        <div>
            {/* Header */}
            <section className="mb-6">
                <h1 className="font-[family-name:var(--font-orbitron)] text-3xl font-bold text-white mb-2">
                    <span className="gradient-text">Dashboard</span>
                </h1>
                <p className="text-gray-400 font-[family-name:var(--font-rajdhani)]">
                    Tes statistiques Spotify en temps réel
                </p>
            </section>

            {/* ===== PRIORITY 1: Now Playing ===== */}
            <section className="mb-6">
                <NowPlaying />
            </section>

            {/* ===== PRIORITY 2: Stats Overview ===== */}
            <section className="mb-6">
                <StatsCard />
            </section>

            {/* ===== PRIORITY 3: Top Items + Small Widgets Row ===== */}
            <section className="grid lg:grid-cols-3 gap-4 mb-6">
                {/* Top Items - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <TopItems />
                </div>

                {/* Right Column - Small Widgets */}
                <div className="space-y-4">
                    <MoodDetector />
                    <LikedSongsStats />
                    <Heatmap />
                </div>
            </section>

            {/* ===== PRIORITY 4: Recommendations + History ===== */}
            <section className="grid lg:grid-cols-2 gap-4 mb-6">
                <Recommendations />
                <RecentHistory />
            </section>

            {/* ===== SECONDARY: Streak + Achievements ===== */}
            <section className="grid lg:grid-cols-4 gap-4 mb-6">
                <Streak className="lg:col-span-1" />
                <Achievements className="lg:col-span-3" />
            </section>

            {/* ===== SETTINGS: Theme + Import ===== */}
            <section className="grid lg:grid-cols-2 gap-4">
                <ThemeSwitcher />
                <GDPRImport userId="current" />
            </section>
        </div>
    );
}
