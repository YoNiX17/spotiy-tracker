'use client';

import { useEffect, useState } from 'react';

export default function Home() {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [user, setUser] = useState<{ displayName: string; profileImage: string | null } | null>(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch('/api/session');
                const data = await res.json();
                setAuthenticated(data.authenticated);
                if (data.authenticated) {
                    setUser(data.user);
                }
            } catch (error) {
                setAuthenticated(false);
            }
        };

        checkSession();
    }, []);

    return (
        <div className="text-center">
            {/* Hero Section */}
            <section className="mb-12">
                <div className="mb-6">
                    <span className="text-xs font-[family-name:var(--font-rajdhani)] font-bold tracking-[0.2em] text-[#1db954] uppercase">
                        <i className="fa-brands fa-spotify mr-2"></i>PERSONAL STATS TRACKER
                    </span>
                </div>
                <h1 className="font-[family-name:var(--font-orbitron)] text-4xl md:text-6xl font-black text-white mb-4">
                    <span className="glitch" data-text="SPOTIFY">SPOTIFY</span>{' '}
                    <span className="gradient-text">TRACKER</span>
                </h1>
                <p className="text-gray-400 font-[family-name:var(--font-rajdhani)] text-lg max-w-2xl mx-auto">
                    Suivez vos statistiques d'écoute, vos artistes préférés et votre historique en temps réel
                </p>
            </section>

            {/* Auth Section */}
            <section className="mb-12">
                {authenticated === null ? (
                    <div className="glass-panel rounded-2xl p-8 max-w-md mx-auto">
                        <div className="skeleton h-12 w-48 rounded-full mx-auto"></div>
                    </div>
                ) : authenticated ? (
                    <div className="glass-panel rounded-2xl p-8 max-w-md mx-auto">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            {user?.profileImage && (
                                <img
                                    src={user.profileImage}
                                    alt={user.displayName}
                                    className="w-12 h-12 rounded-full border-2 border-[#1db954]"
                                />
                            )}
                            <div className="text-left">
                                <p className="text-gray-400 text-sm">Connecté en tant que</p>
                                <p className="font-bold text-white">{user?.displayName}</p>
                            </div>
                        </div>
                        <a href="/dashboard" className="spotify-button inline-block">
                            <i className="fa-solid fa-chart-simple mr-2"></i>
                            Voir mon Dashboard
                        </a>
                    </div>
                ) : (
                    <div className="glass-panel rounded-2xl p-8 max-w-md mx-auto">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1db954] to-[#1ed760] flex items-center justify-center">
                            <i className="fa-brands fa-spotify text-4xl text-white"></i>
                        </div>
                        <h2 className="font-[family-name:var(--font-orbitron)] text-xl font-bold text-white mb-4">
                            Connecte-toi à Spotify
                        </h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Autorise l'accès à ton compte pour voir tes statistiques personnalisées
                        </p>
                        <a href="/api/auth/login" className="spotify-button inline-block">
                            <i className="fa-brands fa-spotify mr-2"></i>
                            Se connecter avec Spotify
                        </a>
                    </div>
                )}
            </section>

            {/* Features */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                <div className="glass-panel glass-panel-hover rounded-xl p-6 text-center">
                    <i className="fa-solid fa-music text-3xl text-[#1db954] mb-4"></i>
                    <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold text-white mb-2">Now Playing</h3>
                    <p className="text-gray-400 font-[family-name:var(--font-rajdhani)] text-sm">
                        Voir ta musique en cours en temps réel
                    </p>
                </div>
                <div className="glass-panel glass-panel-hover rounded-xl p-6 text-center">
                    <i className="fa-solid fa-trophy text-3xl text-yellow-500 mb-4"></i>
                    <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold text-white mb-2">Top Artistes & Tracks</h3>
                    <p className="text-gray-400 font-[family-name:var(--font-rajdhani)] text-sm">
                        Tes favoris sur 4 semaines, 6 mois ou tout le temps
                    </p>
                </div>
                <div className="glass-panel glass-panel-hover rounded-xl p-6 text-center">
                    <i className="fa-solid fa-clock-rotate-left text-3xl text-purple-500 mb-4"></i>
                    <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold text-white mb-2">Historique</h3>
                    <p className="text-gray-400 font-[family-name:var(--font-rajdhani)] text-sm">
                        Tracking continu de toutes tes écoutes
                    </p>
                </div>
            </section>

            {/* How it works */}
            <section className="mt-20">
                <h2 className="font-[family-name:var(--font-orbitron)] text-2xl font-bold text-white mb-8">
                    Comment ça marche ?
                </h2>
                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#1db954]/20 flex items-center justify-center text-[#1db954] font-bold">
                            1
                        </div>
                        <h3 className="font-bold text-white mb-2">Connecte-toi</h3>
                        <p className="text-sm text-gray-400">
                            Autorise l'accès à ton compte Spotify
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#1db954]/20 flex items-center justify-center text-[#1db954] font-bold">
                            2
                        </div>
                        <h3 className="font-bold text-white mb-2">Écoute ta musique</h3>
                        <p className="text-sm text-gray-400">
                            On track automatiquement ce que tu écoutes
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#1db954]/20 flex items-center justify-center text-[#1db954] font-bold">
                            3
                        </div>
                        <h3 className="font-bold text-white mb-2">Découvre tes stats</h3>
                        <p className="text-sm text-gray-400">
                            Analyse tes habitudes d'écoute en détail
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
