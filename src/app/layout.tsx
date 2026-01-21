import type { Metadata } from "next";
import { Inter, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

const orbitron = Orbitron({
    variable: "--font-orbitron",
    subsets: ["latin"],
});

const rajdhani = Rajdhani({
    variable: "--font-rajdhani",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "Spotify Tracker | Red Empire",
    description: "Suivez vos statistiques Spotify, historique d'écoute et top artistes en temps réel",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr">
            <head>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
            </head>
            <body
                className={`${inter.variable} ${orbitron.variable} ${rajdhani.variable} antialiased`}
            >
                <ThemeProvider>
                    {/* Navbar */}
                    <nav className="fixed w-full z-50 border-b border-[#1db954]/20 bg-black/90 backdrop-blur-md py-4">
                        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
                            <a href="/" className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1db954] to-[#1ed760] flex items-center justify-center">
                                    <i className="fa-brands fa-spotify text-white text-xl"></i>
                                </div>
                                <span className="font-[family-name:var(--font-orbitron)] font-bold text-xl text-white">
                                    RED EMPIRE
                                </span>
                            </a>
                            <div className="flex items-center gap-6">
                                <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors font-[family-name:var(--font-rajdhani)]">
                                    <i className="fa-solid fa-chart-simple mr-2"></i>Dashboard
                                </a>
                                <a href="/" className="text-gray-400 hover:text-white transition-colors font-[family-name:var(--font-rajdhani)]">
                                    <i className="fa-solid fa-home mr-2"></i>Accueil
                                </a>
                            </div>
                        </div>
                    </nav>

                    {/* Main content */}
                    <main className="relative z-10 pt-24 pb-16 min-h-screen">
                        <div className="max-w-7xl mx-auto px-6 lg:px-8">
                            {children}
                        </div>
                    </main>

                    {/* Footer */}
                    <footer className="border-t border-[#1db954]/10 bg-black py-8 relative z-10">
                        <div className="text-center text-gray-600 text-xs font-[family-name:var(--font-rajdhani)] uppercase tracking-widest">
                            <i className="fa-brands fa-spotify text-[#1db954]/60 mr-2"></i>
                            © 2024 Red Empire Systems. Powered by Spotify API.
                        </div>
                    </footer>
                </ThemeProvider>
            </body>
        </html>
    );
}
